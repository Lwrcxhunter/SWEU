<?php

namespace App\Http\Requests\Auth;

use App\Models\Student;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['nullable', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        app(RecaptchaService::class)->verify($this->input('recaptcha_token'), $this->ip());

        $loginInput = strtolower(trim($this->input('email')));

        // If input does not contain @, resolve from Student school_id_number or User accounts
        if (! str_contains($loginInput, '@')) {
            $student = Student::where('school_id_number', $loginInput)->first();
            if ($student && $student->user_id) {
                $user = User::find($student->user_id);
                if ($user) {
                    $loginInput = $user->email;
                }
            } else {
                $matchedUser = User::where('email', "{$loginInput}@student.buksu.edu.ph")
                    ->orWhere('email', "{$loginInput}@buksu.edu.ph")
                    ->first();
                if ($matchedUser) {
                    $loginInput = $matchedUser->email;
                }
            }
        }

        $isAllowed = str_ends_with($loginInput, '@student.buksu.edu.ph')
            || str_ends_with($loginInput, '@buksu.edu.ph')
            || str_ends_with($loginInput, '@faculty.buksu.edu.ph')
            || (app()->environment('testing') && str_ends_with($loginInput, '.test'));

        if (! $isAllowed) {
            throw ValidationException::withMessages([
                'email' => 'Only BukSU institutional accounts (@student.buksu.edu.ph or @buksu.edu.ph) are permitted.',
            ]);
        }

        try {
            if (! Auth::attempt(['email' => $loginInput, 'password' => $this->input('password'), 'active' => true], false)) {
                RateLimiter::hit($this->throttleKey());

                throw ValidationException::withMessages([
                    'email' => trans('auth.failed'),
                ]);
            }
        } catch (\MongoDB\Driver\Exception\ConnectionTimeoutException|\MongoDB\Driver\Exception\ConnectionException $e) {
            report($e);
            throw ValidationException::withMessages([
                'email' => 'Database connection timeout: Unable to connect to MongoDB Atlas. Please verify that your IP address is whitelisted in MongoDB Atlas Network Access.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
