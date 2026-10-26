<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Services\RecaptchaService;
use App\Support\Ids;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request, RecaptchaService $recaptcha): RedirectResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:150',
            'email' => [
                'required', 'string', 'lowercase', 'email:strict', 'not_regex:/[\r\n]/', 'max:255', 'unique:'.User::class,
                function ($attribute, $value, $fail) {
                    $email = strtolower(trim($value));
                    $isAllowed = str_ends_with($email, '@student.buksu.edu.ph')
                        || (app()->environment('testing') && str_ends_with($email, '.test'));
                    if (! $isAllowed) {
                        $fail('Only BukSU student institutional accounts (@student.buksu.edu.ph) can register.');
                    }
                },
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'recaptcha_token' => ['nullable', 'string'],
        ]);

        $recaptcha->verify($request->input('recaptcha_token'), $request->ip());

        $email = strtolower(trim($request->email));
        $studentId = null;
        if (preg_match('/^(\d+)@student\.buksu\.edu\.ph$/i', $email, $matches)) {
            $studentId = $matches[1];
        } elseif (preg_match('/^([a-zA-Z0-9.\-_]+)@student\.buksu\.edu\.ph$/i', $email, $matches)) {
            $studentId = $matches[1];
        }

        try {
            $user = User::create([
                'full_name' => $request->full_name,
                'role' => 'student',
                'active' => true,
                'email' => $email,
                'password' => Hash::make($request->password),
            ]);

            $parts = preg_split('/\s+/', trim($request->full_name));
            $firstName = array_shift($parts) ?? 'Student';
            $lastName = implode(' ', $parts);

            Student::create([
                'user_id' => Ids::object($user->id),
                'school_id_number' => $studentId ?? 'PENDING',
                'college' => [
                    'code' => 'CAS',
                    'name' => 'College of Arts and Sciences',
                ],
                'year_level' => 1,
                'personal_details' => [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'school_id_number' => $studentId ?? 'PENDING',
                    'marital_status' => 'Single',
                ],
                'intake_record' => [
                    'signed_agreement' => false,
                ],
            ]);
        } catch (\MongoDB\Driver\Exception\ConnectionTimeoutException|\MongoDB\Driver\Exception\ConnectionException $e) {
            report($e);
            throw ValidationException::withMessages([
                'email' => 'Database connection timeout: Unable to connect to MongoDB Atlas. Please verify that your IP address is whitelisted in MongoDB Atlas Network Access.',
            ]);
        }

        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();

        return redirect(route('dashboard', absolute: false));
    }
}
