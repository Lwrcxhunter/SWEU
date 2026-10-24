<?php

namespace Tests\Guidance;

use App\Models\AuditLog;
use App\Models\CounselingSession;
use App\Services\CounselingCases;
use App\Support\Ids;

class SessionNoteConfidentialityTest extends GuidanceTestCase
{
    public function test_assigned_counselor_can_read_notes_but_other_roles_cannot(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();
        $session->update(['encrypted_session_notes' => 'Private clinical details']);

        $this->actingAs($counselor)->get('/counselor/appointments/'.$appointment->id.'/notes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('session.notes', 'Private clinical details'));

        $this->actingAs($this->user('counselor'))->get('/counselor/appointments/'.$appointment->id.'/notes')->assertForbidden();
        $this->actingAs($this->user('staff'))->get('/counselor/appointments/'.$appointment->id.'/notes')->assertForbidden();
        $this->actingAs($this->user('student'))->get('/counselor/appointments/'.$appointment->id.'/notes')->assertForbidden();
        $this->actingAs($this->user('faculty'))->get('/counselor/appointments/'.$appointment->id.'/notes')->assertForbidden();
        $this->actingAs($this->user('admin'))->get('/counselor/appointments/'.$appointment->id.'/notes')->assertForbidden();
        $this->assertSame(0, AuditLog::count());
    }

    public function test_head_counselor_note_reads_are_audited_before_access_and_are_read_only(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();
        $session->update(['encrypted_session_notes' => 'Private clinical details']);
        $head = $this->user('head_counselor');

        $this->actingAs($head)->getJson('/api/cases/'.$case->id)
            ->assertOk()
            ->assertJsonPath('sessions.0.notes', 'Private clinical details');
        $log = AuditLog::firstOrFail();
        $this->assertTrue(Ids::same($head->id, $log->actor_id));
        $this->assertTrue(Ids::same($case->id, $log->case_id));
        $this->assertTrue(Ids::same($session->id, $log->session_id));
        $this->assertSame('read_session_notes', $log->action);
        $this->assertNotNull($log->created_at);

        $this->actingAs($head)->put('/counselor/appointments/'.$appointment->id.'/notes', [
            'notes' => 'Attempted modification',
            'version' => 1,
            'is_flagged_for_followup' => false,
        ])->assertForbidden();
        $this->assertSame('Private clinical details', $session->fresh()->encrypted_session_notes);
    }

    public function test_operational_session_list_never_contains_notes_and_api_requires_authentication(): void
    {
        $counselor = $this->user('counselor');
        $appointment = $this->appointment($counselor);
        $case = app(CounselingCases::class)->createCaseFromAppointment($appointment);
        $session = CounselingSession::where('case_id', Ids::object($case->id))->firstOrFail();
        $session->update(['encrypted_session_notes' => 'Private clinical details']);

        $this->actingAs($this->user('staff'))->getJson('/api/counseling-sessions')
            ->assertOk()
            ->assertJsonPath('sessions.data.0.status', 'scheduled')
            ->assertJsonMissingPath('sessions.data.0.notes')
            ->assertJsonMissing(['Private clinical details']);

        auth()->logout();
        $this->getJson('/api/cases/'.$case->id)->assertUnauthorized();
    }
}
