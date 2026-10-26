<?php

namespace App\Services;

use App\Models\Student;
use App\Models\User;
use App\Support\Ids;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GoogleAuthService
{
    public const ALLOWED_DOMAINS = [
        'buksu.edu.ph',
        'student.buksu.edu.ph',
        'faculty.buksu.edu.ph',
    ];

    public function authenticate(string $credential): User
    {
        $clientId = config('services.google.client_id');
        if (empty($clientId)) {
            throw ValidationException::withMessages([
                'google' => 'Google Authentication is not configured.',
            ]);
        }

        // Verify token via Google OAuth2 tokeninfo endpoint
        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'google' => 'Google account verification failed. Please try again.',
            ]);
        }

        $payload = $response->json();

        // Validate payload audience
        if (($payload['aud'] ?? '') !== $clientId) {
            throw ValidationException::withMessages([
                'google' => 'Google authentication client ID mismatch.',
            ]);
        }

        $emailVerified = ($payload['email_verified'] ?? false) === true || ($payload['email_verified'] ?? '') === 'true';
        if (! $emailVerified || empty($payload['email'])) {
            throw ValidationException::withMessages([
                'google' => 'Unverified Google email address.',
            ]);
        }

        $email = strtolower(trim($payload['email']));
        $hd = strtolower(trim($payload['hd'] ?? ''));

        // Enforce institutional domain restriction
        $isInstitutional = false;
        foreach (self::ALLOWED_DOMAINS as $domain) {
            if (str_ends_with($email, "@{$domain}") || $hd === $domain) {
                $isInstitutional = true;
                break;
            }
        }

        if (! $isInstitutional) {
            throw ValidationException::withMessages([
                'google' => 'Only BukSU institutional accounts (@student.buksu.edu.ph or @buksu.edu.ph) are permitted.',
            ]);
        }

        $googleId = (string) ($payload['sub'] ?? '');

        // Distinguish Student vs Staff / Faculty
        if (str_ends_with($email, '@student.buksu.edu.ph')) {
            return $this->handleStudentAccount($email, $googleId, $payload);
        }

        return $this->handleStaffFacultyAccount($email, $googleId, $payload);
    }

    private function handleStudentAccount(string $email, string $googleId, array $payload): User
    {
        // Extract student ID number (10-digit ID or prefix before @student.buksu.edu.ph)
        $studentId = null;
        if (preg_match('/^(\d+)@student\.buksu\.edu\.ph$/i', $email, $matches)) {
            $studentId = $matches[1];
        } elseif (preg_match('/^([a-zA-Z0-9.\-_]+)@student\.buksu\.edu\.ph$/i', $email, $matches)) {
            $studentId = $matches[1];
        }

        $names = self::extractGoogleName($payload);

        $user = User::where('email', $email)->orWhere('google_id', $googleId)->first();

        if (! $user) {
            $user = User::create([
                'full_name' => $names['full_name'],
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'role' => 'student',
                'active' => true,
                'google_id' => $googleId,
            ]);

            Student::create([
                'user_id' => Ids::object($user->id),
                'school_id_number' => $studentId ?? 'PENDING',
                'college' => [
                    'code' => 'CAS',
                    'name' => 'College of Arts and Sciences',
                ],
                'year_level' => 1,
                'personal_details' => [
                    'first_name' => $names['first_name'],
                    'last_name' => $names['last_name'],
                    'school_id_number' => $studentId ?? 'PENDING',
                    'marital_status' => 'Single',
                ],
                'intake_record' => [
                    'signed_agreement' => false,
                ],
            ]);
        } else {
            if (! $user->active) {
                throw ValidationException::withMessages([
                    'google' => 'Your account is deactivated. Please contact the Guidance Office.',
                ]);
            }

            if (empty($user->google_id)) {
                $user->google_id = $googleId;
                $user->save();
            }

            // Ensure student profile exists
            $student = Student::where('user_id', Ids::object($user->id))->first();
            if (! $student) {
                Student::create([
                    'user_id' => Ids::object($user->id),
                    'school_id_number' => $studentId ?? 'PENDING',
                    'college' => [
                        'code' => 'CAS',
                        'name' => 'College of Arts and Sciences',
                    ],
                    'year_level' => 1,
                    'personal_details' => [
                        'first_name' => $names['first_name'],
                        'last_name' => $names['last_name'],
                        'school_id_number' => $studentId ?? 'PENDING',
                        'marital_status' => 'Single',
                    ],
                    'intake_record' => [
                        'signed_agreement' => false,
                    ],
                ]);
            }
        }

        return $user;
    }

    private function handleStaffFacultyAccount(string $email, string $googleId, array $payload): User
    {
        $user = User::where('email', $email)->orWhere('google_id', $googleId)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'google' => 'Institutional faculty/staff accounts must be registered or provisioned by an administrator before signing in with Google.',
            ]);
        }

        if (! $user->active) {
            throw ValidationException::withMessages([
                'google' => 'Your account is deactivated. Please contact the Guidance Office.',
            ]);
        }

        if (empty($user->google_id)) {
            $user->google_id = $googleId;
            $user->save();
        }

        return $user;
    }

    public static function extractGoogleName(array $payload): array
    {
        $givenName = trim($payload['given_name'] ?? '');
        $familyName = trim($payload['family_name'] ?? '');
        $fullName = trim($payload['name'] ?? '');

        if (! empty($givenName) && ! empty($familyName)) {
            return [
                'first_name' => $givenName,
                'last_name' => $familyName,
                'full_name' => "{$givenName} {$familyName}",
            ];
        }

        if (! empty($fullName)) {
            $parts = preg_split('/\s+/', $fullName);
            $first = array_shift($parts) ?? 'Student';
            $last = implode(' ', $parts);

            return [
                'first_name' => $first,
                'last_name' => $last,
                'full_name' => $fullName,
            ];
        }

        return [
            'first_name' => 'Student',
            'last_name' => '',
            'full_name' => 'BukSU Student',
        ];
    }
}
