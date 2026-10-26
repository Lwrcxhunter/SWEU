<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\GoogleAuthService;
use App\Services\RecaptchaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        // A shared terminal may have a previous role's protected URL in history.
        // Always enter the newly authenticated user's own workspace.
        $request->session()->forget('url.intended');

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Handle an incoming Google authentication request.
     */
    public function google(Request $request, GoogleAuthService $googleAuth, RecaptchaService $recaptcha): RedirectResponse
    {
        $data = $request->validate([
            'credential' => 'required|string',
            'recaptcha_token' => 'nullable|string',
        ]);

        if (! empty($data['recaptcha_token'])) {
            $recaptcha->verify($data['recaptcha_token'], $request->ip());
        }

        try {
            $user = $googleAuth->authenticate($data['credential']);
        } catch (\MongoDB\Driver\Exception\ConnectionTimeoutException|\MongoDB\Driver\Exception\ConnectionException $e) {
            report($e);
            throw ValidationException::withMessages([
                'google' => 'Database connection timeout: Unable to connect to MongoDB Atlas. Please verify that your IP address is whitelisted in MongoDB Atlas Network Access.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->forget('url.intended');

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        Inertia::clearHistory();

        return redirect('/');
    }
}
