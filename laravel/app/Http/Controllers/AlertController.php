<?php

namespace App\Http\Controllers;

use App\Models\OfficeAlert;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        if ($this->wantsOnlyGlobalProps($request, 'Alerts', ['alerts'])) {
            return Inertia::render('Alerts', []);
        }

        $user = $request->user();
        $userId = Ids::object($user->id);
        $filter = (string) $request->query('filter', 'all');

        $query = OfficeAlert::where('kind', '!=', 'urgent')
            ->where('user_id', $userId);

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'appointment') {
            $query->where(function ($q) {
                $q->where('kind', 'appointment')
                    ->orWhere('kind', 'status')
                    ->orWhere('appointment_id', 'exists', true);
            });
        } elseif ($filter === 'testing') {
            $query->where('kind', 'testing');
        }

        $alerts = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($a) => Views::alert($a, $user));

        $counts = [
            'all' => OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', $userId)->count(),
            'unread' => OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', $userId)->whereNull('read_at')->count(),
            'appointment' => OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', $userId)->where(function ($q) {
                $q->where('kind', 'appointment')->orWhere('kind', 'status')->orWhere('appointment_id', 'exists', true);
            })->count(),
            'testing' => OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', $userId)->where('kind', 'testing')->count(),
        ];

        return Inertia::render('Alerts', [
            'alerts' => $alerts,
            'filter' => $filter,
            'counts' => $counts,
        ]);
    }

    public function update(Request $request, string $alert)
    {
        $record = OfficeAlert::where('_id', Ids::object($alert))->where('user_id', Ids::object($request->user()->id))->firstOrFail();
        $record->update(['read_at' => now()]);

        return back();
    }

    public function markAll(Request $request)
    {
        OfficeAlert::where('user_id', Ids::object($request->user()->id))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }
}
