<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Services\CounselorAvailability;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CounselorAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'range' => ['nullable', Rule::in(['week', 'month', 'custom'])],
            'from' => ['required_if:range,custom', 'nullable', 'date_format:Y-m-d'],
            'to' => ['required_if:range,custom', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $range = $data['range'] ?? 'month';
        [$from, $to] = $this->dateRange($range, $data);
        $counselorId = Ids::object($request->user()->id);
        $caseScope = CounselingCase::where('counselor_id', $counselorId);
        $appointmentScope = Appointment::where('counselor_id', $counselorId);
        $sessionScope = CounselingSession::where('counselor_id', $counselorId);

        $caseStatuses = (clone $caseScope)->get(['status'])
            ->groupBy('status')
            ->map(fn ($records) => $records->count())
            ->all();
        $appointments = (clone $appointmentScope)
            ->whereBetween('scheduled_date', [$from->toDateString(), $to->toDateString()])
            ->get(['scheduled_date', 'status']);
        $firstUpcomingDate = $from->greaterThan(today()) ? $from->toDateString() : today()->toDateString();
        $upcomingAppointments = $firstUpcomingDate <= $to->toDateString()
            ? (clone $appointmentScope)
                ->whereBetween('scheduled_date', [$firstUpcomingDate, $to->toDateString()])
                ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
                ->count()
            : 0;
        $newCases = (clone $caseScope)
            ->whereBetween('opened_at', [$from->copy()->startOfDay()->toDateTimeString(), $to->copy()->endOfDay()->toDateTimeString()])
            ->count();
        $followUpSessions = (clone $sessionScope)
            ->where('is_follow_up', true)
            ->whereBetween('session_date', [$from->toDateString(), $to->toDateString()])
            ->count();

        return Inertia::render('Counselor/Analytics', [
            'range' => $range,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'metrics' => [
                'activeCases' => (clone $caseScope)->whereIn('status', ['open', 'follow_up'])->count(),
                'closedCases' => (clone $caseScope)->where('status', 'closed')->count(),
                'newCases' => $newCases,
                'upcomingAppointments' => $upcomingAppointments,
                'completedAppointments' => $appointments->where('status', 'completed')->count(),
                'cancelledAppointments' => $appointments->where('status', 'cancelled')->count(),
                'followUpSessions' => $followUpSessions,
            ],
            'caseStatuses' => $caseStatuses,
            'trend' => $this->appointmentTrend($appointments, $from, $to),
        ]);
    }

    private function dateRange(string $range, array $data): array
    {
        $today = today();
        if ($range === 'week') {
            return [$today->copy()->startOfWeek(Carbon::MONDAY), $today->copy()->endOfWeek(Carbon::SUNDAY)];
        }
        if ($range === 'custom') {
            if (empty($data['from']) || empty($data['to'])) {
                throw ValidationException::withMessages([
                    'from' => 'Choose both a start and end date for a custom range.',
                ]);
            }

            return [Carbon::parse($data['from']), Carbon::parse($data['to'])];
        }

        return [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()];
    }

    private function appointmentTrend($appointments, Carbon $from, Carbon $to): array
    {
        $days = $from->diffInDays($to) + 1;
        $unit = $days <= 31 ? 'day' : ($days <= 120 ? 'week' : 'month');

        return $appointments
            ->groupBy(function (Appointment $appointment) use ($unit) {
                $date = Carbon::parse($appointment->scheduled_date);

                return match ($unit) {
                    'week' => $date->startOfWeek(Carbon::MONDAY)->toDateString(),
                    'month' => $date->startOfMonth()->toDateString(),
                    default => $date->toDateString(),
                };
            })
            ->map(fn ($records, $key) => ['period' => $key, 'count' => $records->count()])
            ->sortBy('period')
            ->values()
            ->all();
    }
}
