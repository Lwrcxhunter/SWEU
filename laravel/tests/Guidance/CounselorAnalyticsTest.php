<?php

namespace Tests\Guidance;

use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class CounselorAnalyticsTest extends GuidanceTestCase
{
    public function test_analytics_are_real_scoped_counts_and_exclude_clinical_notes(): void
    {
        $counselor = $this->user('counselor');
        $completed = $this->appointment($counselor, status: 'completed');
        $case = app(CounselingCases::class)->createCaseFromAppointment($completed);
        $closedAppointment = $this->appointment($counselor, status: 'cancelled');
        $closedCase = app(CounselingCases::class)->createCaseFromAppointment($closedAppointment);
        $closedCase->update(['status' => 'closed', 'closed_at' => now()->toDateTimeString()]);
        $upcoming = $this->appointment($counselor, status: 'confirmed');
        $upcoming->update(['scheduled_date' => '2026-10-20']);
        CounselingSession::create([
            'case_id' => Ids::object($case->id),
            'appointment_id' => Ids::object($upcoming->id),
            'student_id' => Ids::object($upcoming->student_id),
            'counselor_id' => Ids::object($counselor->id),
            'session_date' => '2026-10-20',
            'time_slot' => 'AM',
            'mode' => 'F2F',
            'status' => 'scheduled',
            'is_follow_up' => true,
            'session_number' => 2,
            'encrypted_session_notes' => 'Private note not for analytics',
        ]);
        CounselingCase::where('_id', Ids::object($case->id))->update(['session_count' => 2]);

        $otherCounselor = $this->user('counselor');
        $this->appointment($otherCounselor, status: 'completed');

        $this->actingAs($counselor)
            ->get('/counselor/analytics?range=custom&from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Counselor/Analytics')
                ->where('metrics.activeCases', 1)
                ->where('metrics.closedCases', 1)
                ->where('metrics.newCases', 2)
                ->where('metrics.upcomingAppointments', 1)
                ->where('metrics.completedAppointments', 1)
                ->where('metrics.cancelledAppointments', 1)
                ->where('metrics.followUpSessions', 1)
                ->where('caseStatuses.open', 1)
                ->where('caseStatuses.closed', 1))
            ->assertDontSee('Private note not for analytics');
    }

    public function test_analytics_require_counselor_role_and_valid_custom_dates(): void
    {
        $counselor = $this->user('counselor');
        $this->actingAs($counselor)
            ->get('/counselor/analytics?range=custom&from=2026-10-15&to=2026-10-01')
            ->assertSessionHasErrors('to');
        $this->actingAs($this->user('staff'))
            ->get('/counselor/analytics')
            ->assertForbidden();
    }
}
