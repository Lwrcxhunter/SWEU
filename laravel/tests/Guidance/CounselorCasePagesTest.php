<?php

namespace Tests\Guidance;

use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class CounselorCasePagesTest extends GuidanceTestCase
{
    public function test_appointment_history_includes_old_and_finished_records_only_for_the_counselor(): void
    {
        $counselor = $this->user('counselor');
        $this->appointment($counselor)->update(['scheduled_date' => '2025-01-01']);
        $this->appointment($counselor, status: 'completed');
        $this->appointment($counselor, status: 'cancelled');
        $this->appointment($counselor);
        $this->appointment($this->user('counselor'), status: 'completed');

        $this->actingAs($counselor)->get('/counselor/cases?tab=history')
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('tab', 'history')->where('history.total', 3)
                ->missing('history.data.0.initial_visit_questionnaire')
                ->missing('history.data.0.signature'));
    }

    public function test_calendar_range_loads_bookings_and_excludes_reserved_times_from_availability(): void
    {
        $counselor = $this->user('counselor');
        $booking = $this->appointment($counselor);
        $this->appointment($this->user('counselor'));
        foreach (['2026-10-06', '2026-10-12', '2026-11-01'] as $end) {
            $response = $this->actingAs($counselor)->get('/counselor/cases?start=2026-10-05&end='.$end);
            $response->assertOk()->assertInertia(fn ($page) => $page
                ->has('appointments', 1)
                ->where('appointments.0.id', (string) $booking->id)
                ->where('calendarRange.end', $end));
            $slots = $response->viewData('page')['props']['availableSlots'];
            $this->assertNotEmpty($slots);
            foreach ($slots as $slot) {
                $this->assertFalse($slot['start'] < '2026-10-05T10:30' && $slot['end'] > '2026-10-05T10:00');
            }
        }
        $this->get('/counselor/cases?start=2026-10-06&end=2026-10-07')
            ->assertInertia(fn ($page) => $page->has('appointments', 0));
        $this->get('/counselor/cases?start=2026-01-01&end=2027-01-01')->assertStatus(422);
    }

    public function test_case_folder_lists_only_the_assigned_counselors_cases(): void
    {
        $counselor = $this->user('counselor');
        $otherCounselor = $this->user('counselor');
        $ownAppointment = $this->appointment($counselor);
        $otherAppointment = $this->appointment($otherCounselor);
        $ownCase = app(CounselingCases::class)->createCaseFromAppointment($ownAppointment);
        app(CounselingCases::class)->createCaseFromAppointment($otherAppointment);

        $this->actingAs($counselor)
            ->get('/counselor/cases')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Counselor/Cases')
                ->has('cases.data', 1)
                ->where('cases.data.0.id', (string) $ownCase->id)
                ->where('cases.data.0.student_name', 'Student Test'));
    }

    public function test_case_detail_shows_limited_intake_and_session_history_without_notes(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();
        $session->update(['encrypted_session_notes' => 'Confidential clinical note']);

        $this->actingAs($counselor)
            ->get('/counselor/cases/'.$case->id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Counselor/CaseDetail')
                ->where('caseRecord.case_number', $case->case_number)
                ->where('student.name', 'Student Test')
                ->where('intake.living_condition', 'Private living situation')
                ->has('sessions', 1)
                ->where('sessions.0.appointment_id', (string) $appointment->id))
            ->assertDontSee('Confidential clinical note');
    }

    public function test_case_detail_is_not_accessible_to_another_counselor_or_staff(): void
    {
        $counselor = $this->user('counselor');
        $case = app(CounselingCases::class)->createCaseFromAppointment(
            $this->appointment($counselor),
        );

        $this->actingAs($this->user('counselor'))
            ->get('/counselor/cases/'.$case->id)
            ->assertForbidden();
        $this->actingAs($this->user('staff'))
            ->get('/counselor/cases/'.$case->id)
            ->assertForbidden();
    }
}
