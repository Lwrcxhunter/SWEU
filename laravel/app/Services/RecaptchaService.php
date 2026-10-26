<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class RecaptchaService
{
    public function verify(?string $token, ?string $ip = null): void
    {
        $secret = config('services.recaptcha.secret_key');

        // In test environments or when secret is omitted, bypass validation
        if (empty($secret) || app()->environment('testing')) {
            return;
        }

        if (empty($token)) {
            throw ValidationException::withMessages([
                'recaptcha' => 'Please complete the reCAPTCHA security verification.',
            ]);
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $ip,
            ]);

            if (! $response->successful() || ! ($response->json('success') ?? false)) {
                throw ValidationException::withMessages([
                    'recaptcha' => 'reCAPTCHA verification failed. Please try again.',
                ]);
            }
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            if (app()->environment('production')) {
                throw ValidationException::withMessages([
                    'recaptcha' => 'Unable to verify security challenge. Please try again.',
                ]);
            }
        }
    }
}
