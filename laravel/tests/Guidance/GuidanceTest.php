<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Models\Referral;
use App\Models\RoleGrant;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
use App\Services\Appointments;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use MongoDB\BSON\ObjectId;
use MongoDB\Driver\Exception\BulkWriteException;

class GuidanceTest extends GuidanceTestCase
{
    public function test_registration_cannot_escalate_roles_and_password_is_hashed(): void
    {
        $this->post('/register', ['full_name' => 'Student Test', 'email' => 'student@example.test', 'password' => 'TestPassword123!',
            'password_confirmation' => 'TestPassword123!', 'role' => 'admin'])->assertRedirect('/dashboard');
        $user = User::firstOrFail();
        $this->assertSame('student', $user->role);
        $this->assertTrue(Hash::check('TestPassword123!', $user->password));
        $this->assertAuthenticatedAs($user);
        $this->assertArrayNotHasKey('password', $user->toArray());
    }

    public function test_login_disabled_account_and_throttling(): void
    {
        $user = $this->user('faculty');
        $this->post('/login', ['email' => $user->email, 'password' => 'TestPassword123!'])->assertRedirect('/dashboard');
        $this->post('/logout')->assertRedirect('/');
        $user->update(['active' => false]);
        $this->post('/login', ['email' => $user->email, 'password' => 'TestPassword123!'])->assertSessionHasErrors('email');
        $this->assertGuest();
        for ($i = 0; $i < 6; $i++) {
            $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        }
    }

    public function test_login_does_not_restore_another_roles_intended_page(): void
    {
        $admin = $this->user('admin');
        $this->withSession(['url.intended' => '/counselor/appointments/012345678901234567890123/notes'])
            ->post('/login', ['email' => $admin->email, 'password' => 'TestPassword123!'])
            ->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($admin);
    }

    public function test_intake_requires_declarations_and_valid_contact_details(): void
    {
        $user = $this->user();
        $this->actingAs($user)->post('/intake', [...$this->intake(), 'phone_number' => '123', 'signed_agreement' => false,
            'is_sworn_truthful' => false, 'school_id_number' => '?'])->assertSessionHasErrors(['phone_number', 'signed_agreement', 'is_sworn_truthful', 'school_id_number']);
        $this->assertSame(0, Student::count());
        $this->post('/intake', $this->intake())->assertRedirect('/student/dashboard');
        $student = Student::firstOrFail();
        $this->assertTrue($student->intake_record['signed_agreement']);
        $this->assertArrayHasKey('submitted_at', $student->intake_record);
        $raw = DB::connection()->getDatabase()->students->findOne([]);
        $this->assertInstanceOf(ObjectId::class, $raw['user_id']);
        $this->get('/intake')->assertOk();
    }

    public function test_role_guards_and_permission_revocation(): void
    {
        $student = $this->user();
        $this->get('/queue')->assertRedirect('/login');
        $this->actingAs($student)->get('/queue')->assertForbidden();
        $this->get('/admin')->assertForbidden();
        $staff = $this->user('staff');
        $this->actingAs($staff)->get('/queue')->assertOk();
        RoleGrant::where('name', 'staff')->update(['permissions' => []]);
        $this->get('/queue')->assertForbidden();
    }

    public function test_booking_stays_pending_and_staff_assigns_available_counselor(): void
    {
        $staff = $this->user('staff');
        $counselor1 = $this->user('counselor');
        $counselor2 = $this->user('counselor');
        $studentUser = $this->user();
        $student = $this->student($studentUser);
        $data = ['channel' => 'online', 'scheduled_date' => '2026-10-05', 'scheduled_time' => '10:00'];

        // Student books: appointment stays pending, no counselor auto-assigned
        $this->actingAs($studentUser)->post('/appointments', $data)->assertRedirect()->assertSessionHasNoErrors();
        $a1 = Appointment::firstOrFail();
        $this->assertNull($a1->counselor_id);
        $this->assertContains($a1->status, ['pending', 'pending_assignment']);

        // Staff assigns an available counselor
        $this->actingAs($staff)->patch('/appointments/'.$a1->id, [
            'action' => 'assign',
            'version' => 1,
            'counselor_id' => (string) $counselor1->id,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $a1->refresh();
        $this->assertTrue(Ids::same($counselor1->id, $a1->counselor_id));
        $this->assertSame('assigned_pending_counselor', $a1->status);
        $this->assertSame(1, OfficeAlert::where('user_id', Ids::object($counselor1->id))->count());

        // Second booking at the same time
        $student2 = $this->student($this->user());
        $this->actingAs(User::find($student2->user_id))->post('/appointments', $data)->assertRedirect()->assertSessionHasNoErrors();
        $a2 = Appointment::where('student_id', Ids::object($student2->id))->firstOrFail();
        $this->assertContains($a2->status, ['pending', 'pending_assignment']);

        // Staff tries to assign counselor1 who is already booked at that time -> fails
        $this->actingAs($staff)->patch('/appointments/'.$a2->id, [
            'action' => 'assign',
            'version' => 1,
            'counselor_id' => (string) $counselor1->id,
        ])->assertSessionHasErrors('counselor_id');

        // Staff assigns counselor2 who is available at that time -> succeeds
        $this->patch('/appointments/'.$a2->id, [
            'action' => 'assign',
            'version' => 1,
            'counselor_id' => (string) $counselor2->id,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $a2->refresh();
        $this->assertTrue(Ids::same($counselor2->id, $a2->counselor_id));
        $this->assertSame('assigned_pending_counselor', $a2->status);
    }

    public function test_unmapped_booking_stays_pending_and_invalid_dates_are_rejected(): void
    {
        $user = $this->user();
        $this->student($user);
        $this->actingAs($user)->post('/appointments', ['channel' => 'face_to_face', 'scheduled_date' => '2026-10-05', 'scheduled_time' => '09:30'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNull(Appointment::firstOrFail()->counselor_id);
        $this->assertContains(Appointment::first()->status, ['pending', 'pending_assignment']);
        $this->post('/appointments', ['channel' => 'invalid', 'scheduled_date' => '2026-10-01', 'scheduled_time' => '09:11'])->assertSessionHasErrors(['channel', 'scheduled_date', 'scheduled_time']);
    }

    public function test_urgent_queue_alerts_only_on_duty_available_counselors(): void
    {
        $staff = $this->user('staff');
        $ready = $this->user('counselor');
        $this->user('counselor', ['on_duty' => false]);
        $this->user('counselor', ['available' => false]);
        $a = app(Appointments::class)->walkIn($this->student());
        $this->actingAs($staff)->patch('/appointments/'.$a->id, ['action' => 'urgent', 'version' => 1])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('urgent', $a->fresh()->urgency_level);
        $alerts = OfficeAlert::where('kind', 'urgent')->get();
        $this->assertCount(1, $alerts);
        $this->assertTrue(Ids::same($ready->id, $alerts->first()->user_id));
        $this->patch('/appointments/'.$a->id, ['action' => 'assign', 'version' => 2, 'counselor_id' => (string) $ready->id])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('assigned_pending_counselor', $a->fresh()->status);
    }

    public function test_stale_updates_and_illegal_transitions_do_not_overwrite(): void
    {
        $counselor = $this->user('counselor');
        $a = $this->appointment($counselor, status: 'assigned');
        $this->actingAs($counselor)->patch('/appointments/'.$a->id, ['action' => 'complete', 'version' => 1])->assertSessionHasErrors('action');
        $this->patch('/appointments/'.$a->id, ['action' => 'accept', 'version' => 1])->assertRedirect()->assertSessionHasNoErrors();
        $this->patch('/appointments/'.$a->id, ['action' => 'cancel', 'version' => 1])->assertSessionHasErrors('action');
        $this->assertSame('accepted', $a->fresh()->status);
        $this->patch('/appointments/'.$a->id, ['action' => 'complete', 'version' => 2])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('completed', $a->fresh()->status);
    }

    public function test_notes_encrypted_at_rest_redacted_and_followup_tracked(): void
    {
        $c = $this->user('counselor');
        $a = $this->appointment($c);
        $url = '/counselor/appointments/'.$a->id.'/notes';
        $payload = ['notes' => 'Highly private session narrative', 'version' => 0, 'is_flagged_for_followup' => true, 'next_followup_date' => '2026-10-10'];
        $this->actingAs($c)->put($url, $payload)->assertRedirect()->assertSessionHasNoErrors();
        $session = CounselingSession::firstOrFail();
        $raw = DB::connection()->getDatabase()->counseling_sessions->findOne([]);
        $this->assertStringNotContainsString($payload['notes'], $raw['encrypted_session_notes']);
        $this->assertSame($payload['notes'], $session->encrypted_session_notes);
        $this->assertArrayNotHasKey('encrypted_session_notes', $session->toArray());
        $this->get($url)->assertInertia(fn (Assert $page) => $page->component('Counselor/SessionNotes')->where('session.notes', $payload['notes']));
        $this->get('/counselor')->assertInertia(fn (Assert $page) => $page->has('followups.data', 1));
        $this->put($url, $payload)->assertSessionHasErrors('notes');
        $this->put($url, [...$payload, 'version' => 1, 'is_flagged_for_followup' => false, 'next_followup_date' => null])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertFalse($session->fresh()->is_flagged_for_followup);
    }

    public function test_every_other_role_and_unassigned_counselor_denied_notes(): void
    {
        $owner = $this->user('counselor');
        $a = $this->appointment($owner);
        foreach (['student', 'faculty', 'staff', 'admin', 'counselor'] as $role) {
            $this->actingAs($this->user($role))->get('/counselor/appointments/'.$a->id.'/notes')->assertForbidden();
            $this->put('/counselor/appointments/'.$a->id.'/notes', ['notes' => 'Attempt', 'version' => 0, 'is_flagged_for_followup' => false])->assertForbidden();
        }
        $this->assertSame(0, CounselingSession::count());
    }

    public function test_student_and_faculty_lists_are_scoped_and_staff_queue_has_no_intake(): void
    {
        $studentUser = $this->user();
        $s = $this->student($studentUser);
        $c = $this->user('counselor');
        $this->appointment($c, $s);
        $this->appointment($c);
        $this->actingAs($studentUser)->get('/appointments')->assertInertia(fn (Assert $page) => $page->has('appointments.data', 1));
        $staff = $this->user('staff');
        $this->actingAs($staff)->get('/queue')->assertInertia(fn (Assert $page) => $page->has('appointments.data', 2)->missing('appointments.data.0.student.intake_record'));
        $faculty = $this->user('faculty');
        $other = $this->user('faculty');
        Referral::create(['referrer_id' => Ids::object($faculty->id), 'student_id' => Ids::object($s->id), 'reason' => 'Private referral', 'status' => 'submitted']);
        Referral::create(['referrer_id' => Ids::object($other->id), 'student_id' => Ids::object($s->id), 'reason' => 'Other referral', 'status' => 'submitted']);
        $this->actingAs($faculty)->get('/referrals')->assertInertia(fn (Assert $page) => $page->has('referrals.data', 1)->missing('referrals.data.0.reason')->missing('referrals.data.0.student'));
    }

    public function test_referral_testing_and_aggregate_reports_work_without_clinical_data(): void
    {
        $u = $this->user();
        $s = $this->student($u);
        $this->actingAs($u)->post('/referrals', ['school_id_number' => $s->school_id_number, 'reason' => 'Private referral'])->assertRedirect()->assertSessionHasNoErrors();
        $this->post('/testing', ['test_type' => 'Other'])->assertSessionHasErrors('details');
        $this->post('/testing', ['test_type' => 'GAMA', 'details' => ''])->assertRedirect()->assertSessionHasNoErrors();
        $staff = $this->user('staff');
        $r = Referral::firstOrFail();
        $t = TestingRequest::firstOrFail();
        $this->actingAs($staff)->patch('/referrals/'.$r->id, ['previous_status' => 'submitted', 'status' => 'under_review'])->assertRedirect()->assertSessionHasNoErrors();
        $this->patch('/testing/'.$t->id, ['previous_status' => 'pending', 'status' => 'approved'])->assertRedirect()->assertSessionHasNoErrors();
        $this->get('/reports')->assertOk();
        $csv = $this->get('/reports?download=1')->assertOk()->streamedContent();
        $this->assertStringContainsString('TestingRequest,approved,1', $csv);
        $this->assertStringNotContainsString('Private referral', $csv);
        $this->assertStringNotContainsString($s->school_id_number, $csv);
    }

    public function test_admin_mappings_permissions_and_self_protection(): void
    {
        $admin = $this->user('admin');
        $c = $this->user('counselor');
        $this->actingAs($admin)->patch('/admin/users/'.$c->id, ['role' => 'counselor', 'active' => true, 'college_codes' => ['CAS', 'COB'], 'on_duty' => true, 'available' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->patch('/admin/users/'.$admin->id, ['role' => 'student', 'active' => false, 'college_codes' => [], 'on_duty' => false, 'available' => false])->assertSessionHasErrors('role');
        $this->patch('/admin/roles/staff', ['permissions' => ['notes.manage']])->assertSessionHasErrors('permissions.0');
        $this->patch('/admin/roles/admin', ['permissions' => []])->assertSessionHasErrors('permissions');
        $this->get('/admin')->assertOk();
    }

    public function test_malformed_ids_do_not_throw_database_errors(): void
    {
        $this->actingAs($this->user('counselor'))->get('/counselor/appointments/not-an-id/notes')->assertNotFound();
    }

    public function test_unique_index_arbitrates_a_slot_race(): void
    {
        $c = $this->user('counselor');
        $a = $this->appointment($c);
        $a->update(['slot_key' => 'race-key']);
        $other = $this->appointment($c);
        try {
            $other->update(['slot_key' => 'race-key']);
            $this->fail('Duplicate slot accepted');
        } catch (BulkWriteException $e) {
            $this->assertSame(11000, $e->getCode());
        }
        $this->assertSame(1, Appointment::where('slot_key', 'race-key')->count());
    }

    public function test_csrf_protection_remains_enabled_for_real_requests(): void
    {
        $this->app['env'] = 'local';
        $this->post('/register', ['full_name' => 'Unauthorized post'])->assertStatus(419);
        $this->app['env'] = 'testing';
        $this->assertSame(0, User::count());
    }

    public function test_intake_updates_own_profile_and_rejects_duplicate_student_id(): void
    {
        $first = $this->user();
        $this->actingAs($first)->post('/intake', $this->intake())->assertRedirect('/student/dashboard');
        $this->post('/intake', [...$this->intake(), 'phone_number' => '09999999999'])->assertRedirect('/student/dashboard');
        $this->assertSame(1, Student::count());
        $this->assertSame('09999999999', Student::first()->phone_number);
        $this->actingAs($this->user())->post('/intake', $this->intake())->assertSessionHasErrors('school_id_number');
        $this->assertSame(1, Student::count());
    }

    public function test_testing_identity_and_alert_ownership_cannot_be_overridden(): void
    {
        $first = $this->user();
        $own = $this->student($first);
        $other = $this->student();
        $this->actingAs($first)->post('/testing', ['test_type' => 'GAMA', 'student_id' => (string) $other->id])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue(Ids::same($own->id, TestingRequest::first()->student_id));
        $alert = OfficeAlert::create(['user_id' => $other->user_id, 'message' => 'Restricted alert', 'kind' => 'status', 'read_at' => null]);
        $this->patch('/alerts/'.$alert->id)->assertNotFound();
        $this->get('/alerts')->assertInertia(fn (Assert $page) => $page->has('alerts.data', 0));
    }

    public function test_staff_cannot_complete_sessions_or_assign_unavailable_counselor(): void
    {
        $staff = $this->user('staff');
        $unavailable = $this->user('counselor', ['available' => false]);
        $a = app(Appointments::class)->walkIn($this->student());
        $this->actingAs($staff)->patch('/appointments/'.$a->id, ['action' => 'assign', 'version' => 1, 'counselor_id' => (string) $unavailable->id])->assertSessionHasErrors('counselor_id');
        $this->patch('/appointments/'.$a->id, ['action' => 'accept', 'version' => 1])->assertForbidden();
        $this->patch('/appointments/'.$a->id, ['action' => 'complete', 'version' => 1])->assertForbidden();
        $this->assertContains($a->fresh()->status, ['pending', 'pending_assignment']);
    }

    public function test_rescheduling_collision_preserves_original_appointment(): void
    {
        $c = $this->user('counselor');
        $a = $this->appointment($c);
        $b = $this->appointment($c);
        $a->update(['scheduled_time' => '11:00', 'slot_key' => $c->id.':2026-10-05:11:00']);
        $b->update(['slot_key' => $c->id.':2026-10-05:10:00']);
        $this->actingAs($c)->patch('/appointments/'.$a->id, ['action' => 'reschedule', 'version' => 1, 'scheduled_date' => '2026-10-05', 'scheduled_time' => '10:00'])->assertSessionHasErrors('conflict');
        $this->assertSame('11:00', $a->fresh()->scheduled_time);
        $this->assertSame(1, $a->fresh()->version);
    }

    public function test_pending_session_cannot_save_notes_and_followup_requires_date(): void
    {
        $c = $this->user('counselor');
        $a = $this->appointment($c, status: 'assigned');
        $url = '/counselor/appointments/'.$a->id.'/notes';
        $data = ['notes' => 'Private notes', 'is_flagged_for_followup' => false, 'version' => 0];
        $this->actingAs($c)->put($url, $data)->assertStatus(422);
        $a->update(['status' => 'accepted']);
        $this->put($url, [...$data, 'is_flagged_for_followup' => true])->assertSessionHasErrors('next_followup_date');
        $this->assertSame(0, CounselingSession::count());
    }

    public function test_notes_keep_original_owner_after_reschedule_and_followup_can_be_resolved_after_cancellation(): void
    {
        $c = $this->user('counselor');
        $other = $this->user('counselor');
        $staff = $this->user('staff');
        $a = $this->appointment($c);
        $url = '/counselor/appointments/'.$a->id.'/notes';
        $data = ['notes' => 'Original clinical record', 'version' => 0, 'is_flagged_for_followup' => true, 'next_followup_date' => '2026-10-10'];
        $this->actingAs($c)->put($url, $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(2, $a->fresh()->version);
        $this->patch('/appointments/'.$a->id, ['action' => 'reschedule', 'version' => 2, 'scheduled_date' => '2026-10-06', 'scheduled_time' => '11:30'])->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($staff)->patch('/appointments/'.$a->id, ['action' => 'assign', 'version' => 3, 'counselor_id' => (string) $other->id])->assertSessionHasErrors('action');
        $this->assertTrue(Ids::same($c->id, $a->fresh()->counselor_id));
        $this->patch('/appointments/'.$a->id, ['action' => 'cancel', 'version' => 3])->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($c)->put($url, [...$data, 'version' => 1, 'is_flagged_for_followup' => false, 'next_followup_date' => null])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertFalse(CounselingSession::first()->is_flagged_for_followup);
    }

    public function test_normal_walk_in_uses_slot_boundaries_and_urgent_assignment_bypasses_them(): void
    {
        $this->travelTo(Carbon::parse('2026-10-04 10:13:00', 'Asia/Manila'));
        $a = app(Appointments::class)->walkIn($this->student());
        $this->assertSame('10:30', $a->scheduled_time);
        $staff = $this->user('staff');
        $counselor = $this->user('counselor');
        $this->actingAs($staff)->patch('/appointments/'.$a->id, ['action' => 'urgent', 'version' => 1])->assertRedirect()->assertSessionHasNoErrors();
        $this->patch('/appointments/'.$a->id, ['action' => 'assign', 'version' => 2, 'counselor_id' => (string) $counselor->id])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('10:13', $a->fresh()->scheduled_time);
        $this->assertNull($a->fresh()->slot_key);
    }
}
