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
        return [
            ...parent::share($request),
            'flash' => ['success' => fn () => $request->session()->get('success')],
            'unreadAlertCount' => fn () => $request->user() ? OfficeAlert::where('user_id', Ids::object($request->user()->id))->whereNull('read_at')->count() : 0,
            'unreadAlerts' => fn () => $request->user() ? OfficeAlert::where('user_id', Ids::object($request->user()->id))
                ->whereNull('read_at')->latest()->limit(5)->get()->map(fn ($a) => ['id' => (string) $a->id, 'kind' => $a->kind, 'message' => $a->message]) : [],
            'auth' => [
                'user' => $request->user() ? Views::user($request->user()) : null,
                'permissions' => $request->user() ? array_values(array_filter(config('guidance.permissions.'.$request->user()->role, []), fn ($p) => $request->user()->checkPermissionTo($p))) : [],
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
