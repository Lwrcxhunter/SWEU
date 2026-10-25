<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselorSchedule;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class StudentAppointmentTest extends GuidanceTestCase
{
    public function test_appointment_index_and_wizard_accessible_by_student(): void
    {
        $user = $this->user();
        $this->student($user);

        $this->actingAs($user)->get('/appointments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Student/BookAppointment')->has('appointments'));

        $this->actingAs($user)->get('/appointments/request')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Student/AppointmentWizard')->has('student'));
    }

    public function test_student_can_submit_appointment_via_wizard_flow(): void
    {
        $user = $this->user();
        $student = $this->student($user);

        $payload = [
            'channel' => 'face_to_face',
            'scheduled_date' => '2026-10-06',
            'scheduled_time' => '10:00',
            'reason' => 'Academic stress and anxiety about final exam deadlines.',
            'expectations' => 'To learn practical time management and coping techniques.',
            'average_sleep' => '5-6 hours',
            'prior_consultation' => false,
            'prior_consultation_details' => null,
            'additional_comments' => 'Morning session preferred.',
            'is_sworn_truthful' => true,
            'ethical_use_consent' => true,
            'signature_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        ];

        $response = $this->actingAs($user)->post('/appointments', $payload);
        $response->assertRedirect('/appointments');

        $appointment = Appointment::where('student_id', Ids::object($student->id))->firstOrFail();
        $this->assertSame('pending_assignment', $appointment->status);
        $this->assertSame('Academic stress and anxiety about final exam deadlines.', $appointment->initial_visit_questionnaire['reason']);
        $this->assertSame('5-6 hours', $appointment->initial_visit_questionnaire['average_sleep']);
        $this->assertNotEmpty($appointment->signature['data']);
        $this->assertNull($appointment->counselor_id);
    }

    public function test_dual_acceptance_flow_and_onboarding_notes(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');

        // 1. Student requests session
        $this->actingAs($studentUser)->post('/appointments', [
            'channel' => 'face_to_face',
            'scheduled_date' => '2026-10-06',
            'scheduled_time' => '14:00',
            'reason' => 'Counseling request test',
            'expectations' => 'Guidance',
            'average_sleep' => '7-8 hours',
            'prior_consultation' => false,
            'is_sworn_truthful' => true,
            'signature_data' => 'Typed: Test Student',
        ])->assertRedirect('/appointments');

        $appointment = Appointment::where('student_id', Ids::object($student->id))->firstOrFail();
        $this->assertSame('pending_assignment', $appointment->status);

        // 2. Staff assigns counselor with onboarding note
        $this->actingAs($staff)->patch('/appointments/'.$appointment->id, [
            'action' => 'assign',
            'version' => $appointment->version,
            'counselor_id' => (string) $counselor->id,
            'onboarding_note' => 'Please arrive 5 minutes early at Room 202, SWEU Building.',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('assigned_pending_counselor', $appointment->status);
        $this->assertSame('Please arrive 5 minutes early at Room 202, SWEU Building.', $appointment->onboarding_note);

        // 2b. Student cannot reschedule once counselor has been assigned
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'reschedule',
            'version' => $appointment->version,
            'scheduled_date' => '2026-10-08',
            'scheduled_time' => '11:00',
        ])->assertSessionHasErrors('action');

        // A student cannot confirm before the assigned counselor accepts.
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'student_confirm',
            'version' => $appointment->version,
        ])->assertSessionHasErrors('action');

        // Counselor approval makes the appointment available for student confirmation.
        $this->actingAs($counselor)->patch('/appointments/'.$appointment->id, [
            'action' => 'counselor_accept',
            'version' => $appointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $appointment->refresh();
        $this->assertSame('counselor_accepted_pending_student', $appointment->status);
        $this->assertNotNull($appointment->counselor_accepted_at);
        $this->assertSame(1, CounselingCase::where('appointment_id', Ids::object($appointment->id))->count());

        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'student_confirm',
            'version' => $appointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $appointment->refresh();
        $this->assertSame('confirmed', $appointment->status);
        $this->assertNotNull($appointment->student_accepted_at);
    }

    public function test_student_reschedule_and_cancel_actions(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);

        $this->actingAs($studentUser)->post('/appointments', [
            'channel' => 'online',
            'scheduled_date' => '2026-10-07',
            'scheduled_time' => '09:00',
            'reason' => 'Online test session',
            'expectations' => 'Help',
            'average_sleep' => '6 hours',
            'prior_consultation' => false,
            'is_sworn_truthful' => true,
        ])->assertRedirect();

        $appointment = Appointment::where('student_id', Ids::object($student->id))->firstOrFail();

        // Reschedule
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'reschedule',
            'version' => $appointment->version,
            'scheduled_date' => '2026-10-08',
            'scheduled_time' => '11:00',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('rescheduled', $appointment->status);
        $this->assertSame('2026-10-08', $appointment->scheduled_date);
        $this->assertSame('11:00', $appointment->scheduled_time);

        // Cancel
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'cancel',
            'version' => $appointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('cancelled', $appointment->status);
    }

    public function test_pdf_intake_form_export_scoped_to_owner_and_staff(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $otherUser = $this->user();
        $this->student($otherUser);
        $staff = $this->user('staff');

        $this->actingAs($studentUser)->post('/appointments', [
            'channel' => 'face_to_face',
            'scheduled_date' => '2026-10-07',
            'scheduled_time' => '13:00',
            'reason' => 'Intake form verification test',
            'expectations' => 'Better wellness',
            'average_sleep' => '7 hours',
            'prior_consultation' => false,
            'is_sworn_truthful' => true,
            'signature_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        ])->assertRedirect();

        $appointment = Appointment::where('student_id', Ids::object($student->id))->firstOrFail();

        // Other student is forbidden
        $this->actingAs($otherUser)->get('/appointments/'.$appointment->id.'/pdf')->assertForbidden();

        // Student owner can access
        $resStudent = $this->actingAs($studentUser)->get('/appointments/'.$appointment->id.'/pdf');
        $this->assertTrue(in_array($resStudent->status(), [200, 302]));
        if ($resStudent->status() === 200) {
            $this->assertStringContainsString('Guidance and Counseling', $resStudent->getContent());
        }

        // Staff can access
        $resStaff = $this->actingAs($staff)->get('/appointments/'.$appointment->id.'/pdf');
        $this->assertTrue(in_array($resStaff->status(), [200, 302]));
    }

    public function test_counselor_can_schedule_followup_appointment_and_student_accepts(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor, $student, 'accepted');

        // Counselor saves session notes with follow-up flag, date, and time
        $notesUrl = '/counselor/appointments/'.$appointment->id.'/notes';
        $this->actingAs($counselor)->put($notesUrl, [
            'notes' => 'Discussed exam anxiety and coping strategies.',
            'version' => 0,
            'is_flagged_for_followup' => true,
            'next_followup_date' => '2026-10-15',
            'next_followup_time' => '14:00',
        ])->assertRedirect()->assertSessionHasNoErrors();

        // Verify a follow-up appointment was automatically created
        $followup = Appointment::where('student_id', Ids::object($student->id))
            ->where('type', 'follow_up')
            ->firstOrFail();

        $this->assertSame('counselor_accepted_pending_student', $followup->status);
        $this->assertSame('2026-10-15', $followup->scheduled_date);
        $this->assertSame('14:00', $followup->scheduled_time);
        $this->assertTrue(Ids::same($counselor->id, $followup->counselor_id));
        $this->assertNotNull($followup->counselor_accepted_at);
        $this->assertNull($followup->student_accepted_at);

        // Student accepts the follow-up appointment
        $this->actingAs($studentUser)->patch('/appointments/'.$followup->id, [
            'action' => 'student_confirm',
            'version' => $followup->version,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $followup->refresh();
        $this->assertSame('confirmed', $followup->status);
        $this->assertNotNull($followup->student_accepted_at);
    }

    public function test_counselor_can_request_reassignment_and_staff_can_read_and_reassign(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $replacement = $this->user('counselor');
        $appointment = $this->appointment($counselor, $student, 'assigned_pending_counselor');

        $this->actingAs($replacement)->patch('/appointments/'.$appointment->id, [
            'action' => 'request_reassignment',
            'version' => $appointment->version,
            'note' => 'This appointment conflicts with my approved leave.',
        ])->assertForbidden();

        $this->actingAs($counselor)->patch('/appointments/'.$appointment->id, [
            'action' => 'request_reassignment',
            'version' => $appointment->version,
        ])->assertSessionHasErrors('note');

        $this->actingAs($counselor)->patch('/appointments/'.$appointment->id, [
            'action' => 'request_reassignment',
            'version' => $appointment->version,
            'note' => 'This appointment conflicts with my approved leave.',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('reassignment_requested', $appointment->status);
        $this->assertSame('This appointment conflicts with my approved leave.', $appointment->reassignment_note);

        // Urgent appointment with non-standard time (e.g. 12:59) does not fail validation on reassignment
        $urgentAppointment = $this->appointment($counselor, $student, 'assigned_pending_counselor');
        $urgentAppointment->urgency_level = 'urgent';
        $urgentAppointment->scheduled_time = '12:59';
        $urgentAppointment->save();

        $this->actingAs($counselor)->patch('/appointments/'.$urgentAppointment->id, [
            'action' => 'request_reassignment',
            'version' => $urgentAppointment->version,
            'scheduled_time' => '12:59',
            'note' => 'I am currently in an emergency intake.',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->actingAs($studentUser)->get('/appointments')->assertInertia(
            fn (Assert $page) => $page
                ->where('appointments.data.0.status', 'reassignment_requested')
                ->where('appointments.data.0.reassignment_note', null),
        );

        $this->actingAs($staff)->get('/queue')->assertInertia(
            fn (Assert $page) => $page
                ->where('appointments.data.0.status', 'reassignment_requested')
                ->where('appointments.data.0.reassignment_note', 'This appointment conflicts with my approved leave.'),
        );

        $this->patch('/appointments/'.$appointment->id, [
            'action' => 'assign',
            'version' => $appointment->version,
            'counselor_id' => (string) $replacement->id,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('assigned_pending_counselor', $appointment->status);
        $this->assertTrue(Ids::same($replacement->id, $appointment->counselor_id));
        $this->assertNull($appointment->reassignment_note);
    }

    public function test_student_cannot_confirm_an_assignment_until_the_counselor_accepts(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor, $student, 'assigned_pending_counselor');

        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'student_confirm',
            'version' => $appointment->version,
        ])->assertSessionHasErrors('action');

        $this->assertSame('assigned_pending_counselor', $appointment->fresh()->status);
        $this->assertNull($appointment->fresh()->student_accepted_at);
    }

    public function test_staff_assignment_checks_counselor_leave_and_class_conflict(): void
    {
        $staff = $this->user('staff');
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $counselor = $this->user('counselor');
        CounselorSchedule::create([
            'counselor_id' => Ids::object($counselor->id),
            'availability' => [['dayOfWeek' => 1, 'startTime' => '08:00', 'endTime' => '17:00']],
            'classSchedule' => [['dayOfWeek' => 1, 'startTime' => '09:00', 'endTime' => '11:00']],
            'leaves' => [[
                'startDateTime' => '2026-10-06T09:00',
                'endDateTime' => '2026-10-06T17:00',
                'reason' => 'Private leave reason',
                'type' => 'official',
            ]],
        ]);

        $onLeave = $this->appointment($counselor, $student, 'pending_assignment');
        $onLeave->update([
            'counselor_id' => null,
            'scheduled_date' => '2026-10-06',
            'scheduled_time' => '10:00',
        ]);

        $this->actingAs($staff)->patch('/appointments/'.$onLeave->id, [
            'action' => 'assign',
            'version' => $onLeave->version,
            'counselor_id' => (string) $counselor->id,
        ])->assertSessionHasErrors('counselor_id');

        $duringClass = $this->appointment($counselor, $student, 'pending_assignment');
        $duringClass->update([
            'counselor_id' => null,
            'scheduled_date' => '2026-10-19',
            'scheduled_time' => '10:00',
        ]);

        $this->actingAs($staff)->patch('/appointments/'.$duringClass->id, [
            'action' => 'assign',
            'version' => $duringClass->version,
            'counselor_id' => (string) $counselor->id,
        ])->assertSessionHasErrors('counselor_id');

        $available = $this->appointment($counselor, $student, 'pending_assignment');
        $available->update([
            'counselor_id' => null,
            'scheduled_date' => '2026-10-19',
            'scheduled_time' => '14:00',
        ]);

        $this->actingAs($staff)->patch('/appointments/'.$available->id, [
            'action' => 'assign',
            'version' => $available->version,
            'counselor_id' => (string) $counselor->id,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $available->refresh();
        $this->assertSame('assigned_pending_counselor', $available->status);
        $this->assertTrue(Ids::same($counselor->id, $available->counselor_id));
    }

    public function test_internship_coordinator_can_submit_cohort_testing_request(): void
    {
        $faculty = $this->user('faculty');
        $staff = $this->user('staff');

        $this->actingAs($faculty)->post('/testing', [
            'requester_name' => 'Prof. Juan Dela Cruz',
            'requester_position' => 'Department Internship Coordinator',
            'college' => 'COT',
            'program' => 'Bachelor of Science in Information Technology (BSIT)',
            'year_level' => '4th Year',
            'student_count' => 45,
            'purpose' => 'Pre-Internship Psychological Evaluation',
            'preferred_date' => '2026-11-20',
            'preferred_session' => 'AM',
            'test_type' => 'GAMA',
            'details' => 'BSIT 4A & 4B Internship candidates',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $request = TestingRequest::where('requester_name', 'Prof. Juan Dela Cruz')->firstOrFail();
        $this->assertSame('pending', $request->status);
        $this->assertSame(45, $request->student_count);
        $this->assertSame('COT', $request->college);

        // Staff / Psychometrician approves the batch request
        $this->actingAs($staff)->patch('/testing/'.$request->id, [
            'previous_status' => 'pending',
            'status' => 'approved',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $request->refresh();
        $this->assertSame('approved', $request->status);
    }
}
