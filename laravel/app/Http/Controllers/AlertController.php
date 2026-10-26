<?php

namespace App\Http\Controllers;

use App\Models\OfficeAlert;
use App\Support\Ids;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        if ($this->wantsOnlyGlobalProps($request, 'Alerts', ['alerts'])) {
            return Inertia::render('Alerts', []);
        }

        return Inertia::render('Alerts', ['alerts' => OfficeAlert::where('kind', '!=', 'urgent')->where('user_id', Ids::object($request->user()->id))->latest()->paginate(20)
            ->through(fn ($a) => ['id' => (string) $a->id, 'message' => $a->message, 'kind' => $a->kind, 'read' => (bool) $a->read_at])]);
    }

    public function update(Request $request, string $alert)
    {
        $record = OfficeAlert::where('_id', Ids::object($alert))->where('user_id', Ids::object($request->user()->id))->firstOrFail();
        $record->update(['read_at' => now()]);

        return back();
    }
}
