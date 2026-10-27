<?php

namespace Tests\Guidance;

use App\Models\OfficeAlert;
use App\Support\Ids;
use Inertia\Testing\AssertableInertia as Assert;

class AlertTest extends GuidanceTestCase
{
    public function test_alerts_page_returns_enriched_props_and_category_counts(): void
    {
        $student = $this->user('student');
        $counselor = $this->user('counselor');

        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'appointment',
            'message' => 'Your counselor scheduled a follow-up session. Please confirm your schedule.',
            'read_at' => null,
        ]);

        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'testing',
            'message' => 'Testing request for GAMA approved.',
            'read_at' => now(),
        ]);

        OfficeAlert::create([
            'user_id' => Ids::object($counselor->id),
            'kind' => 'status',
            'message' => 'Other counselor alert',
            'read_at' => null,
        ]);

        $this->actingAs($student)->get('/alerts')->assertOk()->assertInertia(
            fn (Assert $page) => $page
                ->component('Alerts')
                ->has('alerts.data', 2)
                ->where('alerts.data.0.title', 'Follow-up Session')
                ->where('alerts.data.0.action_url', '/appointments')
                ->where('alerts.data.0.read', false)
                ->where('alerts.data.1.title', 'Testing Request Approved')
                ->where('alerts.data.1.action_url', '/testing')
                ->where('alerts.data.1.read', true)
                ->where('counts.all', 2)
                ->where('counts.unread', 1)
                ->where('counts.appointment', 1)
                ->where('counts.testing', 1)
        );
    }

    public function test_alerts_filtering_by_unread_and_kind(): void
    {
        $student = $this->user('student');

        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'appointment',
            'message' => 'Appointment alert 1',
            'read_at' => null,
        ]);

        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'testing',
            'message' => 'Testing alert 2',
            'read_at' => now(),
        ]);

        $this->actingAs($student)->get('/alerts?filter=unread')->assertOk()->assertInertia(
            fn (Assert $page) => $page
                ->component('Alerts')
                ->has('alerts.data', 1)
                ->where('alerts.data.0.kind', 'appointment')
        );

        $this->actingAs($student)->get('/alerts?filter=testing')->assertOk()->assertInertia(
            fn (Assert $page) => $page
                ->component('Alerts')
                ->has('alerts.data', 1)
                ->where('alerts.data.0.kind', 'testing')
        );
    }

    public function test_mark_single_alert_read(): void
    {
        $student = $this->user('student');
        $alert = OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'appointment',
            'message' => 'Appointment scheduled',
            'read_at' => null,
        ]);

        $this->actingAs($student)->patch('/alerts/'.$alert->id)->assertRedirect();
        $this->assertNotNull($alert->fresh()->read_at);
    }

    public function test_mark_all_alerts_read(): void
    {
        $student = $this->user('student');
        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'appointment',
            'message' => 'Alert 1',
            'read_at' => null,
        ]);
        OfficeAlert::create([
            'user_id' => Ids::object($student->id),
            'kind' => 'testing',
            'message' => 'Alert 2',
            'read_at' => null,
        ]);

        $this->actingAs($student)->patch('/alerts/mark-all-read')->assertRedirect();
        $this->assertSame(0, OfficeAlert::where('user_id', Ids::object($student->id))->whereNull('read_at')->count());
    }

    public function test_users_cannot_mark_other_users_alerts_read(): void
    {
        $student = $this->user('student');
        $other = $this->user('student');
        $alert = OfficeAlert::create([
            'user_id' => Ids::object($other->id),
            'kind' => 'appointment',
            'message' => 'Other student alert',
            'read_at' => null,
        ]);

        $this->actingAs($student)->patch('/alerts/'.$alert->id)->assertNotFound();
        $this->assertNull($alert->fresh()->read_at);
    }
}
