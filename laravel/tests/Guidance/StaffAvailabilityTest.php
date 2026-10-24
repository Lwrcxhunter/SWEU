<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\TestingRequest;
use App\Services\CounselorAvailability;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class StaffAvailabilityTest extends GuidanceTestCase
{
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
        $this->assertSame('assigned_pending_accept', $appointment->fresh()->status);
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
            ->missing('counselors.0.leaves')
            ->missing('metrics.pending_referrals_count'));
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

    public function test_urgent_assignment_still_requires_on_duty_and_checks_leave(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor', ['on_duty' => false]);
        $appointment = $this->appointment($counselor, status: 'pending_assignment');
        $appointment->update(['counselor_id' => null, 'type' => 'walk_in', 'urgency_level' => 'urgent']);
        $this->actingAs($staff)->get('/queue')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.data.0.assignment_options.0.status', 'off_duty'));
        $counselor->update(['on_duty' => true, 'leaves' => [['date' => today()->toDateString()]]]);
        $this->patch('/appointments/'.$appointment->id, ['action' => 'assign', 'version' => 1, 'counselor_id' => (string) $counselor->id])
            ->assertSessionHasErrors('counselor_id');
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
        $this->get('/queue?stage=waiting&page=2')->assertInertia(fn (Assert $page) => $page
            ->where('appointments.total', 21)->has('appointments.data', 1));
    }
}
