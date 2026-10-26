<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\TestingRequest;
use App\Services\CounselorAvailability;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class StaffAvailabilityTest extends GuidanceTestCase
{
    public function test_week_calendar_loads_schedules_once_and_refreshes_next_request(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $db = \Illuminate\Support\Facades\DB::connection();
        $db->enableQueryLog();
        try {
            $db->flushQueryLog();
            $this->actingAs($staff)->get('/queue?calendar_view=week')->assertOk();
            $scheduleQueries = collect($db->getQueryLog())->filter(
                fn ($query) => str_contains($query['query'], 'counselor_schedules'),
            );
            $this->assertCount(1, $scheduleQueries);

            \App\Models\CounselorSchedule::create([
                'counselor_id' => Ids::object($counselor->id),
                'availability' => [], 'classSchedule' => [], 'leaves' => [],
            ]);
            $this->get('/queue?calendar_date=2026-10-05')->assertInertia(fn (Assert $page) => $page
                ->where('counselors.0.uses_default_schedule', false)
                ->where('counselors.0.calendar.2026-10-05.AM.0.status', 'off_schedule'));
        } finally {
            $db->disableQueryLog();
            $db->flushQueryLog();
        }
    }

    public function test_staff_can_distinguish_confirmation_stages_and_browse_history(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        foreach (['assigned_pending_counselor', 'counselor_accepted_pending_student', 'confirmed', 'completed', 'cancelled', 'reassignment_requested'] as $status) {
            $this->appointment($counselor, status: $status);
        }
        $this->actingAs($staff)->get('/queue')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 6)
            ->where('metrics.unassigned_count', 1)->where('metrics.waiting_count', 1)
            ->where('metrics.student_count', 1)->where('metrics.confirmed_count', 1)
            ->where('metrics.completed_count', 1)->where('metrics.cancelled_count', 1));
        foreach (['waiting' => 'assigned_pending_counselor', 'student' => 'counselor_accepted_pending_student', 'confirmed' => 'confirmed', 'completed' => 'completed', 'cancelled' => 'cancelled', 'unassigned' => 'reassignment_requested'] as $stage => $status) {
            $this->get('/queue?stage='.$stage)->assertInertia(fn (Assert $page) => $page
                ->where('appointments.total', 1)->where('appointments.data.0.status', $status));
        }
    }

    public function test_staff_searches_all_records_by_student_name_id_and_date_without_clinical_answers(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $student = $this->student($this->user('student', ['full_name' => 'Mira Santos']));
        $student->update(['school_id_number' => '2026-FIND']);
        $record = $this->appointment($counselor, $student, 'completed');
        $record->update(['initial_visit_questionnaire' => ['reason' => 'Private narrative'], 'signature' => 'Private signature']);
        $this->appointment($counselor);
        foreach (['mira', '2026-FIND'] as $search) {
            $this->actingAs($staff)->get('/queue?search='.$search.'&appointment_date=2026-10-05')->assertInertia(fn (Assert $page) => $page
                ->where('appointments.total', 1)->where('appointments.data.0.id', (string) $record->id)
                ->missing('appointments.data.0.initial_visit_questionnaire')->missing('appointments.data.0.signature'));
        }
        $this->get('/queue?search=mira&appointment_date=2026-10-06')->assertInertia(fn (Assert $page) => $page->where('appointments.total', 0));
        $this->get('/queue?search=%2E%2A')->assertInertia(fn (Assert $page) => $page->where('appointments.total', 0));
    }

    public function test_staff_request_inboxes_filter_before_pagination_and_show_requester(): void
    {
        $staff = $this->user('staff');
        for ($index = 0; $index < 16; $index++) {
            TestingRequest::create(['requester_name' => 'Coordinator '.$index, 'status' => 'completed']);
        }
        TestingRequest::create(['requester_name' => 'Faculty Coordinator', 'college' => 'CAS', 'status' => 'pending']);
        $this->actingAs($staff)->get('/testing?status=pending&search=Faculty')->assertInertia(fn (Assert $page) => $page
            ->where('requests.total', 1)->where('requests.data.0.requester_name', 'Faculty Coordinator')->where('counts.completed', 16));
        $this->get('/testing?status=pending&search=missing')->assertInertia(fn (Assert $page) => $page->where('requests.total', 0));
        $this->actingAs($this->user())->get('/queue')->assertForbidden();
    }

    public function test_class_overlap_and_counseling_hours_are_enforced(): void
    {
        $counselor = $this->user('counselor', [
            'counseling_schedule' => [['day' => 'Monday', 'start' => '09:00', 'end' => '12:00']],
            'class_schedule' => [['day' => 'Monday', 'start' => '09:15', 'end' => '10:00']],
        ]);
        $availability = app(CounselorAvailability::class);
        $this->assertSame('in_class', $availability->check($counselor, '2026-10-05', '09:00')['status']);
        $this->assertTrue($availability->check($counselor, '2026-10-05', '10:00')['available']);
        $this->assertFalse($availability->check($counselor, '2026-10-05', '08:30')['available']);
        $this->assertFalse($availability->check($counselor, '2026-10-05', '12:00')['available']);
        $counselor->counseling_schedule = [];
        $this->assertFalse($availability->check($counselor, '2026-10-05', '10:00')['available']);
    }

    public function test_only_approved_and_legacy_official_leave_blocks_assignment(): void
    {
        $counselor = $this->user('counselor');
        foreach (['pending' => true, 'rejected' => true, 'approved' => false] as $status => $available) {
            $counselor->leaves = [['start_date' => '2026-10-05', 'end_date' => '2026-10-06', 'status' => $status]];
            $this->assertSame($available, $counselor->checkAvailability('2026-10-05', '10:00')['available']);
        }
        $counselor->leaves = [['date' => '2026-10-05', 'reason' => 'Private medical details']];
        $check = $counselor->checkAvailability('2026-10-05', '10:00');
        $this->assertSame('on_leave', $check['status']);
        $this->assertStringNotContainsString('Private medical', $check['reason']);
        $counselor->available = false;
        $this->assertSame('on_leave', $counselor->checkAvailability('2026-10-05', '10:00')['status']);
    }

    public function test_period_only_request_offers_free_times_and_assignment_checks_selected_period(): void
    {
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $counselor = $this->user('counselor', ['class_schedule' => [['day' => 'Monday', 'start' => '08:00', 'end' => '10:00']]]);
        $this->appointment($counselor); // Reserves 10:00 even without a legacy slot_key.
        $this->actingAs($studentUser)->post('/appointments', [
            'scheduled_date' => '2026-10-05', 'preferred_period' => 'AM', 'channel' => 'online',
        ])->assertSessionHasNoErrors();
        $appointment = Appointment::where('student_id', Ids::object($student->id))->firstOrFail();
        $staff = $this->user('staff');
        $this->actingAs($staff)->get('/queue?stage=unassigned')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.assignment_options.0.available', true)
            ->where('appointments.data.0.assignment_options.0.times', ['10:30', '11:00', '11:30']));
        $payload = ['action' => 'assign', 'version' => 1, 'counselor_id' => (string) $counselor->id];
        $this->patch('/appointments/'.$appointment->id, $payload)->assertSessionHasErrors('scheduled_time');
        $this->patch('/appointments/'.$appointment->id, [...$payload, 'scheduled_time' => '13:00'])->assertSessionHasErrors('counselor_id');
        $this->patch('/appointments/'.$appointment->id, [...$payload, 'scheduled_time' => '10:00'])->assertSessionHasErrors('counselor_id');
        $this->patch('/appointments/'.$appointment->id, [...$payload, 'scheduled_time' => '10:30'])->assertSessionHasNoErrors();
        $this->assertSame('10:30', $appointment->fresh()->scheduled_time);
        $this->assertSame('assigned_pending_counselor', $appointment->fresh()->status);
    }

    public function test_calendar_has_real_dates_and_busy_blocks_without_private_data(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor', [
            'class_schedule' => [['day' => 'Monday', 'start' => '08:00', 'end' => '09:00', 'subject' => 'PSYC 101']],
            'leaves' => [['date' => '2026-10-06', 'status' => 'approved', 'reason' => 'Private medical details']],
        ]);
        $this->appointment($counselor);
        $response = $this->actingAs($staff)->get('/queue?tab=calendar&calendar_date=2026-10-05&calendar_view=day');
        $response->assertInertia(fn (Assert $page) => $page
            ->where('calendar.dates', ['2026-10-05'])
            ->where('counselors.0.calendar.2026-10-05.AM.0.status', 'in_class')
            ->where('counselors.0.calendar.2026-10-05.AM.1.status', 'available')
            ->where('counselors.0.calendar.2026-10-05.AM.2.status', 'booked')
            ->missing('counselors.0.leaves'));
        $response->assertDontSee('Private medical details');
        $this->get('/queue?calendar_date=2026-10-11&calendar_view=week')->assertInertia(fn (Assert $page) => $page
            ->where('calendar.dates.0', '2026-10-05')->where('calendar.dates.6', '2026-10-11')
            ->where('counselors.0.calendar.2026-10-06.AM.0.status', 'on_leave'));
    }

    public function test_assignment_rechecks_changes_after_queue_loaded(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor, status: 'pending_assignment');
        $appointment->update(['counselor_id' => null]);
        $this->actingAs($staff)->get('/queue')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.assignment_options.0.available', true));
        $counselor->update(['leaves' => [['date' => '2026-10-05', 'status' => 'approved']]]);
        $this->patch('/appointments/'.$appointment->id, ['action' => 'assign', 'version' => 1, 'counselor_id' => (string) $counselor->id])
            ->assertSessionHasErrors('counselor_id');
        $this->assertNull($appointment->fresh()->counselor_id);
    }

    public function test_legacy_urgent_flag_does_not_bypass_counseling_hours(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor, status: 'pending_assignment');
        $appointment->update(['counselor_id' => null, 'type' => 'walk_in', 'urgency_level' => 'urgent', 'scheduled_time' => '18:00']);
        $this->actingAs($staff)->get('/queue')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.assignment_options.0.available', false));
        $this->patch('/appointments/'.$appointment->id, ['action' => 'assign', 'version' => 1, 'counselor_id' => (string) $counselor->id])
            ->assertSessionHasErrors('counselor_id');
        $this->assertNull($appointment->fresh()->counselor_id);
    }

    public function test_filters_apply_before_pagination_and_keep_testing_count(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        for ($index = 0; $index < 21; $index++) {
            $this->appointment($counselor, status: 'assigned_pending_accept');
        }
        $request = $this->appointment($counselor, status: 'pending_assignment');
        $request->update(['counselor_id' => null]);
        TestingRequest::create(['status' => 'pending', 'student_count' => 30]);
        $this->actingAs($staff)->get('/queue?stage=unassigned')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 1)->where('metrics.queue_total', 22)
            ->where('metrics.waiting_count', 21)->where('metrics.open_testing_count', 1));
        $this->get('/queue?stage=waiting&page=3')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 21)->has('appointments.data', 1));
    }
}
