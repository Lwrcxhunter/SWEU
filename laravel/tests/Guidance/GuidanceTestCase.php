<?php

namespace Tests\Guidance;

use App\Models\Appointment;
use App\Models\Student;
use App\Models\User;
use App\Services\DatabaseSetup;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

abstract class GuidanceTestCase extends TestCase
{
    public function actingAs(Authenticatable $user, $guard = null)
    {
        // Each actor switch models a separate browser session, not a changed
        // identity inside an existing authenticated password-hash session.
        $this->app['session']->forget('password_hash_web');

        return parent::actingAs($user, $guard);
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->travelTo(Carbon::parse('2026-10-04 10:00:00', 'Asia/Manila'));
        $this->assertSame('buksu_guidance_test', config('database.connections.mongodb.database'), 'Refusing to clear a non-test database');
        $this->assertStringStartsWith('mongodb://127.0.0.1:27028/', config('database.connections.mongodb.dsn'));
        $db = DB::connection()->getDatabase();
        foreach (['users', 'students', 'appointments', 'counseling_cases', 'counseling_case_sequences', 'counseling_sessions', 'counselor_schedules', 'audit_logs', 'testing_requests', 'office_alerts', 'role_grants'] as $collection) {
            $db->selectCollection($collection)->deleteMany([]);
        }
        app(DatabaseSetup::class)->run();
    }

    protected function user(string $role = 'student', array $extra = []): User
    {
        return User::create(array_merge(['full_name' => ucfirst($role).' Test', 'email' => uniqid().'@example.test',
            'password' => 'TestPassword123!', 'role' => $role, 'active' => true, 'college_codes' => ['CAS', 'COB'], 'available' => true, 'on_duty' => true], $extra));
    }

    protected function intake(): array
    {
        return ['school_id_number' => '2026-12345', 'college_code' => 'CAS', 'year_level' => '2',
            'phone_number' => '09123456789', 'emergency_name' => 'Emergency Test', 'emergency_phone' => '+639123456789',
            'living_condition' => 'With family', 'personal_concerns' => ['Private intake concern'], 'signed_agreement' => true, 'is_sworn_truthful' => true];
    }

    protected function student(?User $user = null): Student
    {
        $user ??= $this->user();

        return Student::create(['user_id' => Ids::object($user->id), 'school_id_number' => uniqid('ST-'),
            'college' => ['code' => 'CAS', 'name' => 'Arts and Sciences'], 'year_level' => '2', 'phone_number' => '09123456789',
            'emergency_contact' => ['name' => 'Emergency', 'phone' => '09123456789'],
            'intake_record' => ['signed_agreement' => true, 'is_sworn_truthful' => true, 'living_condition' => 'Private living situation', 'personal_concerns' => ['Private intake concern']]]);
    }

    protected function appointment(User $counselor, ?Student $student = null, string $status = 'accepted'): Appointment
    {
        $student ??= $this->student();

        return Appointment::create(['student_id' => Ids::object($student->id), 'counselor_id' => Ids::object($counselor->id),
            'channel' => 'face_to_face', 'type' => 'online_booking', 'urgency_level' => 'normal', 'scheduled_date' => '2026-10-05',
            'scheduled_time' => '10:00', 'status' => $status, 'version' => 1]);
    }
}
