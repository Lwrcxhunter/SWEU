<?php

namespace Tests\Guidance;

use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class InstitutionalAuthAndSecurityTest extends GuidanceTestCase
{
    public function test_registration_rejects_non_buksu_student_email(): void
    {
        $response = $this->post('/register', [
            'full_name' => 'Non BukSU User',
            'email' => 'user@gmail.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_registration_accepts_buksu_student_email_and_extracts_id(): void
    {
        $response = $this->post('/register', [
            'full_name' => 'Juan P. Dela Cruz',
            'email' => '2401105814@student.buksu.edu.ph',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertRedirect('/dashboard');
        $user = User::where('email', '2401105814@student.buksu.edu.ph')->first();
        $this->assertNotNull($user);
        $this->assertSame('student', $user->role);

        $student = Student::where('school_id_number', '2401105814')->first();
        $this->assertNotNull($student);
        $this->assertSame('Juan', $student->personal_details['first_name'] ?? null);
    }

    public function test_google_auth_rejects_non_institutional_domain(): void
    {
        config(['services.google.client_id' => 'test-google-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-google-client-id',
                'email' => 'user@gmail.com',
                'email_verified' => true,
                'name' => 'Gmail User',
                'sub' => 'google-uid-12345',
            ], 200),
        ]);

        $response = $this->post('/auth/google', [
            'credential' => 'fake-jwt-token',
        ]);

        $response->assertSessionHasErrors('google');
        $this->assertGuest();
    }

    public function test_google_auth_provisions_new_student_with_extracted_id(): void
    {
        config(['services.google.client_id' => 'test-google-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-google-client-id',
                'email' => '2401109999@student.buksu.edu.ph',
                'email_verified' => true,
                'name' => 'Maria Clara Santos',
                'given_name' => 'Maria Clara',
                'family_name' => 'Santos',
                'sub' => 'google-sub-9999',
                'hd' => 'student.buksu.edu.ph',
            ], 200),
        ]);

        $response = $this->post('/auth/google', [
            'credential' => 'valid-student-token',
        ]);

        $response->assertRedirect('/dashboard');
        $user = User::where('email', '2401109999@student.buksu.edu.ph')->first();
        $this->assertNotNull($user);
        $this->assertSame('student', $user->role);
        $this->assertSame('google-sub-9999', $user->google_id);

        $student = Student::where('school_id_number', '2401109999')->first();
        $this->assertNotNull($student);
        $this->assertSame('Maria Clara', $student->personal_details['first_name'] ?? null);
        $this->assertSame('Santos', $student->personal_details['last_name'] ?? null);
    }

    public function test_google_auth_links_existing_staff_account(): void
    {
        config(['services.google.client_id' => 'test-google-client-id']);

        $staff = User::create([
            'full_name' => 'Registered Staff',
            'email' => 'staff.office@buksu.edu.ph',
            'password' => 'Password123!',
            'role' => 'staff',
            'active' => true,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-google-client-id',
                'email' => 'staff.office@buksu.edu.ph',
                'email_verified' => true,
                'name' => 'Registered Staff',
                'sub' => 'google-staff-111',
                'hd' => 'buksu.edu.ph',
            ], 200),
        ]);

        $response = $this->post('/auth/google', [
            'credential' => 'valid-staff-token',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($staff);
        $this->assertSame('google-staff-111', $staff->fresh()->google_id);
    }

    public function test_google_auth_rejects_unregistered_staff_account(): void
    {
        config(['services.google.client_id' => 'test-google-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'test-google-client-id',
                'email' => 'unknown.staff@buksu.edu.ph',
                'email_verified' => true,
                'name' => 'Unknown Staff',
                'sub' => 'google-unknown-222',
                'hd' => 'buksu.edu.ph',
            ], 200),
        ]);

        $response = $this->post('/auth/google', [
            'credential' => 'unregistered-token',
        ]);

        $response->assertSessionHasErrors('google');
        $this->assertGuest();
    }
}
