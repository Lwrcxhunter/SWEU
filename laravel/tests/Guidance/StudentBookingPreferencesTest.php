<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Services\CounselingCases;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class StudentBookingPreferencesTest extends GuidanceTestCase
{
    public function test_booking_stores_each_mode_and_period_without_an_assigned_time(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        foreach (['face_to_face', 'virtual'] as $channel) {
            foreach (['am', 'pm'] as $period) {
                $this->actingAs($user)->post('/appointments', [
                    'channel' => $channel, 'preferred_period' => $period, 'scheduled_date' => '2026-10-06',
                ])->assertRedirect('/appointments')->assertSessionHasNoErrors();
                $appointment = Appointment::where('student_id', Ids::object($student->id))
                    ->where('channel', $channel)->where('preferred_period', $period)->firstOrFail();
                $this->assertSame('pending_assignment', $appointment->status);
                $this->assertNull($appointment->scheduled_time);
                $this->assertNull($appointment->counselor_id);
            }
        }
        $this->assertSame('Virtual', app(CounselingCases::class)->mode('virtual'));
    }

    public function test_booking_rejects_past_dates_and_invalid_preferences(): void
    {
        $user = $this->user();
        $this->student($user);
        $this->actingAs($user)->post('/appointments', [
            'channel' => 'email', 'preferred_period' => 'night', 'scheduled_date' => '2026-10-03',
        ])->assertSessionHasErrors(['channel', 'preferred_period', 'scheduled_date']);
        $this->post('/appointments', ['channel' => 'virtual', 'scheduled_date' => '2026-10-06'])
            ->assertSessionHasErrors('preferred_period');
        $this->assertSame(0, Appointment::count());
    }

    public function test_follow_up_banners_are_scoped_and_not_limited_to_recent_appointments(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        $counselor = $this->user('counselor');
        $followUp = $this->appointment($counselor, $student, 'counselor_accepted_pending_student');
        $followUp->update(['type' => 'follow_up', 'created_at' => now()->subMonth()]);
        for ($i = 0; $i < 16; $i++) {
            $this->appointment($counselor, $student, 'completed');
        }
        $this->appointment($counselor, $this->student(), 'counselor_accepted_pending_student')->update(['type' => 'follow_up']);
        foreach (['/student/dashboard', '/appointments'] as $url) {
            $this->actingAs($user)->get($url)->assertInertia(fn (Assert $page) => $page
                ->has('followUps', 1)->where('followUps.0.id', (string) $followUp->id));
        }
    }

    public function test_declining_requires_reason_records_timestamp_releases_slot_and_notifies_counselor(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        $counselor = $this->user('counselor');
        $original = $this->appointment($counselor, $student);
        $case = app(CounselingCases::class)->createCaseFromAppointment($original);
        $this->actingAs($counselor)->postJson('/api/cases/'.$case->id.'/follow-up', [
            'targetDate' => '2026-10-06', 'scheduledTime' => '14:00', 'mode' => 'Virtual',
        ])->assertCreated();
        $followUp = Appointment::where('type', 'follow_up')->firstOrFail();
        $url = '/appointments/'.$followUp->id;
        $payload = ['action' => 'student_decline', 'version' => $followUp->version];
        $this->actingAs($user)->patch($url, $payload)->assertSessionHasErrors('note');
        $this->patch($url, [...$payload, 'note' => '   '])->assertSessionHasErrors('note');
        $this->patch($url, ['action' => 'cancel', 'version' => $followUp->version])->assertSessionHasErrors('action');
        $reason = 'I have a laboratory class. Please arrange another date.';
        $this->patch($url, [...$payload, 'note' => $reason])->assertSessionHasNoErrors();
        $followUp->refresh();
        $this->assertSame('declined_by_student', $followUp->status);
        $this->assertSame(now()->toDateTimeString(), $followUp->student_declined_at);
        $this->assertSame($reason, $followUp->student_decline_note);
        $this->assertNull($followUp->slot_key);
        $this->assertSame('cancelled', CounselingSession::where('appointment_id', Ids::object($followUp->id))->firstOrFail()->status);
        $alert = OfficeAlert::where('user_id', Ids::object($counselor->id))
            ->where('appointment_id', Ids::object($followUp->id))->firstOrFail();
        $this->assertStringContainsString($reason, $alert->message);
        $this->patch($url, [...$payload, 'note' => $reason])->assertSessionHasErrors('action');
        $this->patch($url, ['action' => 'student_confirm', 'version' => $followUp->version])->assertSessionHasErrors('action');
        $this->get('/student/dashboard')->assertInertia(fn (Assert $page) => $page->has('followUps', 0));
    }

    public function test_follow_up_response_requires_owner_and_pending_follow_up(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        $counselor = $this->user('counselor');
        $followUp = $this->appointment($counselor, $student, 'counselor_accepted_pending_student');
        $followUp->update(['type' => 'follow_up']);
        foreach ([$this->user(), $this->user('staff'), $counselor] as $actor) {
            foreach (['student_decline', 'student_confirm'] as $action) {
                $this->actingAs($actor)->patch('/appointments/'.$followUp->id, [
                    'action' => $action, 'version' => 1, 'note' => 'Unavailable',
                ])->assertForbidden();
            }
        }
        $ordinary = $this->appointment($counselor, $student, 'counselor_accepted_pending_student');
        $this->actingAs($user)->patch('/appointments/'.$ordinary->id, [
            'action' => 'student_decline', 'version' => 1, 'note' => 'Unavailable',
        ])->assertSessionHasErrors('action');
    }
}
