<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class CaseLifecycleTest extends GuidanceTestCase
{
    public function test_accepting_an_appointment_opens_one_case_and_initial_session(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor, status: 'assigned_pending_accept');

        $this->actingAs($counselor)->patch('/appointments/'.$appointment->id, [
            'action' => 'accept',
            'version' => $appointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->firstOrFail();
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();

        $this->assertMatchesRegularExpression('/^CASE-2026-\d{4}$/', $case->case_number);
        $this->assertSame('open', $case->status);
        $this->assertSame(1, (int) $case->session_count);
        $this->assertSame('scheduled', $session->status);
        $this->assertSame(1, (int) $session->session_number);
        $this->assertSame('2026-10-05', $session->session_date);
        $this->assertSame('AM', $session->time_slot);
        $this->assertSame('F2F', $session->mode);

        app(CounselingCases::class)->createCaseFromAppointment($appointment->fresh());
        $this->assertSame(1, CounselingCase::where('appointment_id', Ids::object($appointment->id))->count());
    }

    public function test_counselor_can_close_a_case_and_complete_its_current_session(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->firstOrFail();

        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/close')
            ->assertOk()
            ->assertJsonPath('case.status', 'closed')
            ->assertJsonPath('case.outcome', 'completed/stable');
        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/close')->assertStatus(409);

        $this->assertSame('completed', CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail()->status);
        $this->assertSame('completed', $appointment->fresh()->status);
    }

    public function test_counselor_can_schedule_a_follow_up_under_the_same_case(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->firstOrFail();

        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/follow-up', [
            'targetDate' => '2026-10-06',
            'timeSlot' => 'PM',
            'mode' => 'Virtual',
        ])->assertCreated()
            ->assertJsonPath('case.status', 'follow_up')
            ->assertJsonPath('session.session_number', 2)
            ->assertJsonPath('session.time_slot', 'PM')
            ->assertJsonPath('session.mode', 'Virtual');

        $sessions = CounselingSession::where('case_id', Ids::object($case->id))->orderBy('session_number')->get();
        $this->assertCount(2, $sessions);
        $this->assertSame('completed', $sessions[0]->status);
        $this->assertSame((string) $sessions[0]->case_id, (string) $sessions[1]->case_id);
        $this->assertSame('online', Appointment::findOrFail($sessions[1]->appointment_id)->channel);
        $this->assertSame(2, (int) $case->fresh()->session_count);

        $this->actingAs($counselor)->get('/counselor/appointments/'.$sessions[1]->appointment_id.'/notes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('caseRecord.case_number', $case->case_number));

        $followUpAppointment = Appointment::findOrFail($sessions[1]->appointment_id);
        $this->actingAs($counselor)->patch('/appointments/'.$followUpAppointment->id, [
            'action' => 'cancel',
            'version' => $followUpAppointment->version,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/follow-up', [
            'targetDate' => '2026-10-07',
            'timeSlot' => 'AM',
            'mode' => 'F2F',
        ])->assertCreated()->assertJsonPath('session.session_number', 3);

        $this->assertSame(
            'cancelled',
            CounselingSession::where('appointment_id', Ids::object($followUpAppointment->id))->firstOrFail()->status,
        );
    }

    public function test_closed_cases_cannot_receive_follow_ups_and_other_counselors_cannot_read_them(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->firstOrFail();

        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/close')->assertOk();
        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/follow-up', [
            'targetDate' => '2026-10-06',
            'timeSlot' => 'AM',
            'mode' => 'F2F',
        ])->assertStatus(409);

        $otherCounselor = $this->user('counselor');
        $this->actingAs($otherCounselor)->getJson('/api/cases/'.$case->id)->assertForbidden();
    }

    public function test_case_details_include_history_only_for_the_assigned_counselor(): void
    {
        $counselor = $this->user('counselor');
        $student = $this->student();
        $appointment = $this->appointment($counselor, $student);
        app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->firstOrFail();

        $this->actingAs($counselor)->getJson('/api/cases/'.$case->id)
            ->assertOk()
            ->assertJsonPath('case.case_number', $case->case_number)
            ->assertJsonCount(1, 'sessions')
            ->assertJsonPath('sessions.0.session_number', 1);

        $this->actingAs($this->user('staff'))->getJson('/api/cases/'.$case->id)->assertForbidden();
    }

    public function test_case_numbers_are_sequential_for_the_same_year(): void
    {
        $counselor = $this->user('counselor');
        $first = $this->appointment($counselor);
        $second = $this->appointment($counselor);
        $cases = app(CounselingCases::class);

        $firstCase = $cases->createCaseFromAppointment($first);
        $secondCase = $cases->createCaseFromAppointment($second);

        $this->assertSame('CASE-2026-0001', $firstCase->case_number);
        $this->assertSame('CASE-2026-0002', $secondCase->case_number);
    }

    public function test_follow_up_requires_a_future_date_and_supported_time_slot_and_mode(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment);

        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/follow-up', [
            'targetDate' => '2026-10-04',
            'timeSlot' => 'MIDNIGHT',
            'mode' => 'Unknown',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['targetDate', 'timeSlot', 'mode']);

        $this->assertSame(1, CounselingSession::where('case_id', Ids::object($case->id))->count());
    }
}
