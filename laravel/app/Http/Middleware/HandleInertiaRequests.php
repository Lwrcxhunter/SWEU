<?php

namespace App\Http\Middleware;

use App\Models\OfficeAlert;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = null;
        try {
            $user = $request->user();
        } catch (\Throwable $e) {
            report($e);
        }

        return [
            ...parent::share($request),
            'flash' => ['success' => fn () => $request->session()->get('success')],
            'unreadAlertCount' => function () use ($user) {
                if (! $user) {
                    return 0;
                }
                try {
                    return OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', Ids::object($user->id))->whereNull('read_at')->count();
                } catch (\Throwable $e) {
                    report($e);
                    return 0;
                }
            },
            'unreadAlerts' => function () use ($user) {
                if (! $user) {
                    return [];
                }
                try {
                    return OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', Ids::object($user->id))
                        ->whereNull('read_at')->latest()->limit(5)->get()->map(fn ($a) => Views::alert($a, $user));
                } catch (\Throwable $e) {
                    report($e);
                    return [];
                }
            },
            'auth' => [
                'user' => $user ? Views::user($user) : null,
                'permissions' => $user ? array_values(array_filter(config('guidance.permissions.'.$user->role, []), fn ($p) => $user->checkPermissionTo($p))) : [],
            ],
            'integrations' => [
                'google' => [
                    'enabled' => ! empty(config('services.google.client_id')),
                    'client_id' => config('services.google.client_id'),
                ],
                'recaptcha' => [
                    'enabled' => ! empty(config('services.recaptcha.site_key')),
                    'site_key' => config('services.recaptcha.site_key'),
                ],
            ],
        ];
    }
}
