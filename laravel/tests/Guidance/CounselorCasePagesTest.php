<?php

namespace Tests\Guidance;

use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class CounselorCasePagesTest extends GuidanceTestCase
{
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
