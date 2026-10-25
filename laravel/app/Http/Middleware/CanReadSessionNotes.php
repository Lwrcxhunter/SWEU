<?php

namespace App\Http\Middleware;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Support\Ids;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CanReadSessionNotes
{
    public function handle(Request $request, Closure $next, string $resource, string $intent = 'read'): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        if ($resource === 'appointment') {
            $appointment = Appointment::findOrFail(Ids::object((string) $request->route('appointment')));
            $case = CounselingCase::where('appointment_id', Ids::object($appointment->id))->first();
            $sessions = CounselingSession::where('appointment_id', Ids::object($appointment->id))->get();
            if ($case) {
                $sessions = $sessions->concat(
                    CounselingSession::where('case_id', Ids::object($case->id))->orderBy('session_number')->get(),
                )->unique(fn ($session) => (string) $session->id)->values();
            }
            $owns = $user->role === 'counselor'
                && Ids::same($user->id, $appointment->counselor_id)
                && $user->checkPermissionTo('notes.manage');
        } elseif ($resource === 'case') {
            $case = CounselingCase::findOrFail(Ids::object((string) $request->route('case')));
            $sessions = CounselingSession::where('case_id', Ids::object($case->id))->orderBy('session_number')->get();
            $owns = $user->role === 'counselor'
                && Ids::same($user->id, $case->counselor_id)
                && $user->checkPermissionTo('notes.manage');
        } else {
            abort(404);
        }

        abort_unless($owns, 403);

        return $next($request);
    }
}
