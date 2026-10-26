<?php

namespace Tests\Guidance;

use App\Models\OfficeAlert;
use App\Models\RoleGrant;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use MongoDB\BSON\UTCDateTime;

class StudentDashboardTest extends GuidanceTestCase
{
    private function information(): array
    {
        return [...$this->intake(), 'full_name' => 'Lawrence Student Test',
            'address' => ['street' => 'Synthetic Street', 'city' => 'Malaybalay', 'state_province' => 'Bukidnon', 'postal_zip' => '8700'],
            'dob' => '2004-05-12', 'marital_status' => 'Single', 'religious_affiliation' => 'Private affiliation',
            'facebook_messenger_username' => 'student.test', 'emergency_relationship' => 'Parent',
            'medical_history' => ['conditions' => ['Anxiety', 'Asthma', 'Allergies', 'Other'], 'other_conditions_specify' => 'Synthetic condition',
                'on_prescription_meds' => true, 'current_meds_specify' => 'Synthetic medication',
                'recent_surgeries_past_5_yrs' => true, 'surgeries_specify' => 'Synthetic surgery',
                'family_medical_history' => ['tobacco_cigarettes_vape_use' => 'None', 'alcohol_use' => 'None', 'caffeine_use' => 'Coffee', 'drug_use' => 'None']],
            'is_walk_in' => true, 'referred_by' => 'Synthetic faculty'];
    }

    public function test_dashboard_is_student_landing_and_works_before_intake(): void
    {
        $this->get('/student/dashboard')->assertRedirect('/login');
        $this->actingAs($this->user())->get('/dashboard')->assertRedirect('/student/dashboard');
        $this->get('/student/dashboard')->assertInertia(fn (Assert $page) => $page->component('Student/Dashboard')
            ->where('student', null)->where('summary.pending_appointments', 0)->where('summary.scheduled_appointments', 0)
            ->missing('summary.testing')->has('followUps', 0)->where('unreadAlertCount', 0));
        foreach (['faculty', 'staff', 'counselor', 'admin'] as $role) {
            $this->actingAs($this->user($role))->get('/student/dashboard')->assertForbidden();
        }
    }

    public function test_counts_are_scoped_and_use_future_philippine_dates_and_statuses(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        $other = $this->student();
        $counselor = $this->user('counselor');
        foreach (['pending', 'assigned', 'accepted', 'completed', 'cancelled'] as $status) {
            $this->appointment($counselor, $student, $status);
            $this->appointment($counselor, $other, $status);
        }
        $this->appointment($counselor, $student, 'accepted')->update(['scheduled_date' => '2026-10-03']);
        $this->appointment($counselor, $student, 'pending')->update(['scheduled_date' => '2026-10-04', 'scheduled_time' => '09:30']);
        $this->appointment($counselor, $student, 'accepted')->update(['scheduled_date' => '2026-10-04', 'scheduled_time' => '10:30']);
        $this->appointment($counselor, $student, 'assigned')->update(['scheduled_date' => '2026-10-04', 'scheduled_time' => '10:30']);
        foreach (['GAMA', 'Other'] as $type) {
            foreach (['pending', 'approved', 'completed'] as $status) {
                TestingRequest::create(['student_id' => Ids::object($student->id), 'test_type' => $type, 'status' => $status]);
                TestingRequest::create(['student_id' => Ids::object($other->id), 'test_type' => $type, 'status' => $status]);
            }
        }
        $this->actingAs($user)->get('/student/dashboard?student_id='.$other->id)->assertInertia(fn (Assert $page) => $page
            ->where('student.school_id_number', $student->school_id_number)->where('summary.pending_appointments', 3)
            ->where('summary.scheduled_appointments', 2)
            ->missing('summary.testing')->missing('referrals'));
    }

    public function test_full_information_round_trips_with_bson_dates_and_reconfirmation(): void
    {
        $user = $this->user();
        $other = $this->student();
        $this->actingAs($user)->post('/intake', [...$this->information(), 'user_id' => (string) $other->user_id,
            'intake_record' => ['submitted_at' => '1900-01-01'], 'role' => 'admin'])
            ->assertRedirect('/student/dashboard')->assertSessionHasNoErrors()->assertSessionHas('success');
        $student = Student::where('user_id', Ids::object($user->id))->firstOrFail();
        $raw = DB::connection()->getDatabase()->students->findOne(['_id' => Ids::object($student->id)]);
        $this->assertInstanceOf(UTCDateTime::class, $raw['dob']);
        $this->assertInstanceOf(UTCDateTime::class, $raw['intake_record']['submitted_at']);
        $this->assertSame(now()->getTimestamp(), $raw['intake_record']['submitted_at']->toDateTime()->getTimestamp());
        $this->assertSame('2004-05-12', $student->dob->format('Y-m-d'));
        $this->assertTrue($student->medical_history['on_prescription_meds']);
        $this->assertTrue($student->intake_record['is_walk_in']);
        $this->assertSame('Lawrence Student Test', $user->fresh()->full_name);
        $this->assertSame('student', $user->fresh()->role);
        $this->assertNull($other->fresh()->medical_history);
        $this->get('/intake')->assertInertia(fn (Assert $page) => $page->where('student.dob', '2004-05-12')
            ->where('student.address.city', 'Malaybalay')->where('student.emergency_contact.relationship_to_client', 'Parent')
            ->where('student.medical_history.current_meds_specify', 'Synthetic medication')
            ->where('student.medical_history.family_medical_history.caffeine_use', 'Coffee'));
        $this->post('/intake', [...$this->information(), 'is_sworn_truthful' => false, 'signed_agreement' => false, 'phone_number' => '09999999999'])
            ->assertSessionHasErrors(['is_sworn_truthful', 'signed_agreement']);
        $this->assertSame('09123456789', $student->fresh()->phone_number);
        $this->assertNull(session()->getOldInput('medical_history'));
        $this->get('/student/dashboard')->assertInertia(fn (Assert $page) => $page->where('student.medical_history.surgeries_specify', 'Synthetic surgery'));
    }

    public function test_nested_validation_and_role_permissions_cannot_be_bypassed(): void
    {
        $user = $this->user();
        $data = $this->information();
        $data['dob'] = '2030-01-01';
        $data['address']['city'] = ['not a string'];
        $data['medical_history']['current_meds_specify'] = '';
        $data['medical_history']['surgeries_specify'] = '';
        $data['medical_history']['other_conditions_specify'] = '';
        $data['medical_history']['family_medical_history']['drug_use'] = str_repeat('x', 1001);
        $this->actingAs($user)->post('/intake', $data)->assertSessionHasErrors(['dob', 'address.city',
            'medical_history.current_meds_specify', 'medical_history.surgeries_specify', 'medical_history.other_conditions_specify', 'medical_history.family_medical_history.drug_use']);
        $data['medical_history']['conditions'] = 'bad shape';
        $this->post('/intake', $data)->assertSessionHasErrors('medical_history.conditions');
        $this->assertSame(0, Student::count());
        RoleGrant::where('name', 'student')->update(['permissions' => []]);
        $this->post('/intake', $this->information())->assertForbidden();
        foreach (['faculty', 'staff', 'counselor', 'admin'] as $role) {
            $this->actingAs($this->user($role))->get('/intake')->assertForbidden();
            $this->post('/intake', $this->information())->assertForbidden();
        }
    }

    public function test_legacy_records_keep_unrelated_data_and_medical_fields_stay_out_of_shared_views(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        $student->update(['intake_record' => [...$student->intake_record, 'legacy_reference' => 'Retain this'],
            'medical_history' => ['conditions' => ['Legacy condition'], 'family_medical_history' => ['caffeine_use' => 'Existing history']]]);
        $this->actingAs($user)->get('/intake')->assertInertia(fn (Assert $page) => $page->where('student.dob', null)->where('student.address', []));
        $this->post('/intake', $this->intake())->assertSessionHasNoErrors();
        $student->refresh();
        $this->assertSame('Retain this', $student->intake_record['legacy_reference']);
        $this->assertSame(['Legacy condition'], $student->medical_history['conditions']);
        $data = $this->information();
        $data['medical_history']['conditions'] = [];
        $data['medical_history']['on_prescription_meds'] = false;
        $data['medical_history']['recent_surgeries_past_5_yrs'] = false;
        $this->post('/intake', $data)->assertSessionHasNoErrors();
        $student->refresh();
        $this->assertSame([], $student->medical_history['conditions']);
        $this->assertNull($student->medical_history['current_meds_specify']);
        $this->assertNull($student->medical_history['surgeries_specify']);
        foreach (['medical_history', 'address', 'dob', 'religious_affiliation'] as $field) {
            $this->assertArrayNotHasKey($field, $student->toArray());
            $this->assertArrayNotHasKey($field, Views::student($student));
        }
        $c = $this->user('counselor');
        $this->appointment($c, $student);
        $this->actingAs($this->user('staff'))->get('/queue')->assertInertia(fn (Assert $page) => $page
            ->missing('appointments.data.0.student.medical_history')->missing('appointments.data.0.student.address'));
    }

    public function test_unread_total_is_not_capped_by_preview_and_testing_update_notifies_only_owner(): void
    {
        $user = $this->user();
        $student = $this->student($user);
        for ($i = 0; $i < 7; $i++) {
            OfficeAlert::create(['user_id' => Ids::object($user->id), 'kind' => 'status', 'message' => 'Synthetic alert', 'read_at' => null]);
        }
        OfficeAlert::create(['user_id' => Ids::object($this->user()->id), 'kind' => 'status', 'message' => 'Other alert', 'read_at' => null]);
        $testing = TestingRequest::create(['student_id' => Ids::object($student->id), 'test_type' => 'GAMA', 'status' => 'pending']);
        $this->actingAs($this->user('staff'))->patch('/testing/'.$testing->id, ['previous_status' => 'pending', 'status' => 'approved'])->assertSessionHasNoErrors();
        $this->patch('/testing/'.$testing->id, ['previous_status' => 'pending', 'status' => 'approved'])->assertSessionHasErrors('status');
        $this->assertSame(1, OfficeAlert::where('kind', 'testing')->count());
        $alert = OfficeAlert::where('kind', 'testing')->firstOrFail();
        $this->assertTrue(Ids::same($user->id, $alert->user_id));
        $this->actingAs($user)->get('/student/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadAlertCount', 8)->has('unreadAlerts', 5));
        $this->patch('/alerts/'.$alert->id)->assertRedirect();
        $this->get('/student/dashboard')->assertInertia(fn (Assert $page) => $page->where('unreadAlertCount', 7));
    }

    public function test_account_settings_update_only_current_user_and_allowlisted_fields(): void
    {
        $user = $this->user();
        $other = $this->user('admin');
        $this->actingAs($user)->patch('/account/profile', ['full_name' => 'Updated Student', 'role' => 'admin', 'id' => $other->id])->assertSessionHasNoErrors();
        $this->assertSame('Updated Student', $user->fresh()->full_name);
        $this->assertSame('student', $user->fresh()->role);
        $this->assertSame('Admin Test', $other->fresh()->full_name);
        $this->patch('/account/preferences', ['notification_refresh' => false, 'role' => 'admin'])->assertSessionHasNoErrors();
        $this->get('/account')->assertInertia(fn (Assert $page) => $page->where('auth.user.preferences.notification_refresh', false));
        $this->patch('/account/preferences', ['notification_refresh' => 'invalid'])->assertSessionHasErrors('notification_refresh');
    }
}
