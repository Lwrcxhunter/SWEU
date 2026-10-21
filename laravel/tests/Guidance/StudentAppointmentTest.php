<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\Student;
use App\Models\User;
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
        $this->assertSame('assigned_pending_accept', $appointment->status);
        $this->assertSame('Please arrive 5 minutes early at Room 202, SWEU Building.', $appointment->onboarding_note);

        // 2b. Student cannot reschedule once counselor has been assigned
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'reschedule',
            'version' => $appointment->version,
            'scheduled_date' => '2026-10-08',
            'scheduled_time' => '11:00',
        ])->assertSessionHasErrors('action');

        // 3. Student views appointment and accepts
        $this->actingAs($studentUser)->patch('/appointments/'.$appointment->id, [
            'action' => 'accept',
            'version' => $appointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('accepted', $appointment->status);
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

        $this->assertSame('assigned_pending_accept', $followup->status);
        $this->assertSame('2026-10-15', $followup->scheduled_date);
        $this->assertSame('14:00', $followup->scheduled_time);
        $this->assertTrue(Ids::same($counselor->id, $followup->counselor_id));
        $this->assertNotNull($followup->counselor_accepted_at);
        $this->assertNull($followup->student_accepted_at);

        // Student accepts the follow-up appointment
        $this->actingAs($studentUser)->patch('/appointments/'.$followup->id, [
            'action' => 'accept',
            'version' => $followup->version,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $followup->refresh();
        $this->assertSame('accepted', $followup->status);
        $this->assertNotNull($followup->student_accepted_at);
    }
}
