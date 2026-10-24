<?php

namespace Tests\Guidance;

use App\Models\CounselorSchedule;
use App\Services\Appointments;
use App\Services\CounselorAvailability;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class CounselorScheduleTest extends GuidanceTestCase
{
    public function test_counselor_can_save_and_read_own_schedule_and_staff_can_only_read_it(): void
    {
        $counselor = $this->user('counselor');
        $schedule = [
            'availability' => [
                ['dayOfWeek' => 1, 'startTime' => '09:00', 'endTime' => '12:00'],
            ],
            'classSchedule' => [
                ['dayOfWeek' => 1, 'startTime' => '13:00', 'endTime' => '15:00', 'label' => 'Lecture'],
            ],
            'leaves' => [
                ['startDateTime' => '2026-10-06T09:00', 'endDateTime' => '2026-10-06T17:00', 'reason' => 'Training', 'type' => 'official'],
            ],
        ];

        $this->actingAs($counselor)->get('/counselor/schedule')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Counselor/Schedule'));
        $this->actingAs($counselor)->put('/api/counselor/schedule', $schedule)
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->actingAs($counselor)->getJson('/api/counselor/schedule')
            ->assertOk()
            ->assertJsonPath('schedule.availability.0.dayOfWeek', 1);
        $this->assertSame(1, CounselorSchedule::where('counselor_id', Ids::object($counselor->id))->count());

        $this->actingAs($this->user('staff'))->getJson('/api/counselors/'.$counselor->id.'/schedule')
            ->assertOk()
            ->assertJsonPath('schedule.availability.0.startTime', '09:00')
            ->assertJsonMissingPath('schedule.leaves.0.reason');
        $this->actingAs($this->user('student'))->getJson('/api/counselors/'.$counselor->id.'/schedule')->assertForbidden();
    }

    public function test_schedule_rejects_invalid_periods_overlaps_and_class_conflicts(): void
    {
        $counselor = $this->user('counselor');
        $base = ['availability' => [], 'classSchedule' => [], 'leaves' => []];

        $this->actingAs($counselor)->put('/api/counselor/schedule', [
            ...$base,
            'availability' => [['dayOfWeek' => 1, 'startTime' => '10:00', 'endTime' => '09:00']],
        ])->assertSessionHasErrors('availability.0.endTime');

        $this->put('/api/counselor/schedule', [
            ...$base,
            'availability' => [
                ['dayOfWeek' => 1, 'startTime' => '09:00', 'endTime' => '12:00'],
                ['dayOfWeek' => 1, 'startTime' => '11:30', 'endTime' => '13:00'],
            ],
        ])->assertSessionHasErrors('availability');

        $this->put('/api/counselor/schedule', [
            ...$base,
            'availability' => [['dayOfWeek' => 1, 'startTime' => '09:00', 'endTime' => '12:00']],
            'classSchedule' => [['dayOfWeek' => 1, 'startTime' => '10:00', 'endTime' => '11:00']],
        ])->assertSessionHasErrors('availability');

        $this->assertSame(0, CounselorSchedule::count());
    }

    public function test_assignment_rejects_time_outside_counseling_availability(): void
    {
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $student = $this->student();
        CounselorSchedule::create([
            'counselor_id' => Ids::object($counselor->id),
            'availability' => [['dayOfWeek' => 1, 'startTime' => '11:00', 'endTime' => '12:00']],
            'classSchedule' => [],
            'leaves' => [],
        ]);
        $appointment = app(Appointments::class)->book($student, [
            'channel' => 'face_to_face',
            'scheduled_date' => '2026-10-05',
            'scheduled_time' => '10:00',
        ]);

        $this->actingAs($staff)->patch('/appointments/'.$appointment->id, [
            'action' => 'assign',
            'version' => $appointment->version,
            'counselor_id' => (string) $counselor->id,
        ])->assertSessionHasErrors('counselor_id');

        $this->assertNull($appointment->fresh()->counselor_id);
    }

    public function test_saved_schedule_replaces_legacy_default_hours_and_checks_partial_leave(): void
    {
        $counselor = $this->user('counselor');
        CounselorSchedule::create([
            'counselor_id' => Ids::object($counselor->id),
            'availability' => [['dayOfWeek' => 6, 'startTime' => '09:00', 'endTime' => '12:00']],
            'classSchedule' => [],
            'leaves' => [[
                'startDateTime' => '2026-10-10T10:00',
                'endDateTime' => '2026-10-10T11:00',
                'reason' => 'Private leave reason',
                'type' => 'planned',
            ]],
        ]);
        $availability = app(CounselorAvailability::class);

        $this->assertTrue($availability->check($counselor, '2026-10-10', '09:00')['available']);
        $this->assertSame('on_leave', $availability->check($counselor, '2026-10-10', '10:00')['status']);
        $this->assertTrue($availability->check($counselor, '2026-10-10', '11:00')['available']);
    }
}
