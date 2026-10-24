<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\Referral;
use App\Models\TestingRequest;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReportController extends Controller
{
    private const COUNSELOR_COLUMNS = ['Case #', 'Date/Time', 'Mode', 'Status', 'Case Category'];

    public function index(Request $request)
    {
        $data = $request->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from']);
        $from = $data['from'] ?? now()->startOfMonth()->toDateString();
        $to = $data['to'] ?? today()->toDateString();
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->endOfDay();
        $rows = [];
        foreach ([Appointment::class => ['pending', 'assigned', 'accepted', 'completed', 'cancelled'],
            Referral::class => ['submitted', 'under_review', 'action_taken', 'closed'],
            TestingRequest::class => ['pending', 'approved', 'completed']] as $model => $statuses) {
            foreach ($statuses as $status) {
                $rows[] = ['service' => class_basename($model), 'status' => $status,
                    'count' => $model::whereBetween('created_at', [$start, $end])->where('status', $status)->count()];
            }
        }
        if ($request->boolean('download')) {
            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Service', 'Status', 'Count'], ',', '"', '');
                foreach ($rows as $row) {
                    fputcsv($out, array_values($row), ',', '"', '');
                }
                fclose($out);
            }, 'guidance-summary.csv', ['Content-Type' => 'text/csv', 'Cache-Control' => 'no-store']);
        }

        return Inertia::render('Staff/Reports', compact('rows', 'from', 'to'));
    }

    public function counselorSessions(Request $request)
    {
        $data = $request->validate([
            'range' => ['required', Rule::in(['day', 'week', 'month', 'custom'])],
            'from' => ['required_if:range,custom', 'nullable', 'date_format:Y-m-d'],
            'to' => ['required_if:range,custom', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'format' => ['required', Rule::in(['json', 'csv', 'pdf'])],
        ]);

        [$from, $to] = $this->counselorDateRange($data);
        $cases = CounselingCase::where('counselor_id', Ids::object($request->user()->id))->get();
        $caseIds = $cases->map(fn ($case) => Ids::object($case->id))->all();
        $cases = $cases->keyBy(fn ($case) => (string) $case->id);
        $rows = CounselingSession::whereIn('case_id', $caseIds)
            ->whereBetween('session_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('session_date')
            ->orderBy('time_slot')
            ->get()
            ->map(function (CounselingSession $session) use ($cases) {
                $case = $cases->get((string) $session->case_id);
                if (! $case) {
                    return null;
                }

                return [
                    'Case #' => $case->case_number,
                    'Date/Time' => trim(($session->session_date ?? '').' '.($session->time_slot ?? '')),
                    'Mode' => $session->mode,
                    'Status' => $case->status === 'closed'
                        ? 'Closed'
                        : (($case->status === 'follow_up' || $session->is_follow_up) ? 'Follow-up' : 'Open'),
                    'Case Category' => $case->category,
                ];
            })
            ->filter()
            ->values()
            ->all();

        if ($data['format'] === 'json') {
            return response()->json(['from' => $from->toDateString(), 'to' => $to->toDateString(), 'data' => $rows]);
        }

        if ($data['format'] === 'csv') {
            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');
                fwrite($out, "\xEF\xBB\xBF");
                fputcsv($out, self::COUNSELOR_COLUMNS, ',', '"', '');
                foreach ($rows as $row) {
                    fputcsv($out, array_values($row), ',', '"', '');
                }
                fclose($out);
            }, 'counselor-sessions.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Cache-Control' => 'private, no-store',
            ]);
        }

        return response()->view('reports.counselor-sessions', [
            'columns' => self::COUNSELOR_COLUMNS,
            'rows' => $rows,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
        ], 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="counselor-sessions-print.html"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function counselorDateRange(array $data): array
    {
        $now = now();
        $range = $data['range'];
        if ($range === 'day') {
            return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
        }
        if ($range === 'week') {
            return [$now->copy()->startOfWeek(Carbon::MONDAY), $now->copy()->endOfWeek(Carbon::SUNDAY)];
        }
        if ($range === 'month') {
            return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
        }
        if (empty($data['from']) || empty($data['to'])) {
            throw ValidationException::withMessages(['from' => 'Choose both start and end dates for a custom range.']);
        }

        return [Carbon::parse($data['from'])->startOfDay(), Carbon::parse($data['to'])->endOfDay()];
    }
}
