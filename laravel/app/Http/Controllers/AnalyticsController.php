<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $from = Carbon::parse($validated['from'] ?? today()->subMonths(3)->startOfMonth()->toDateString())->startOfDay();
        $to = Carbon::parse($validated['to'] ?? today()->endOfMonth()->toDateString())->endOfDay();
        $counselorId = Ids::object($request->user()->id);

        $sessions = CounselingSession::where('counselor_id', $counselorId)
            ->whereBetween('session_date', [$from->toDateString(), $to->toDateString()])
            ->get();
        $periodDays = $from->diffInDays($to);
        $previousFrom = $from->copy()->subDays($periodDays + 1);
        $previousTo = $from->copy()->subDay()->endOfDay();
        $previousTotal = CounselingSession::where('counselor_id', $counselorId)
            ->whereBetween('session_date', [$previousFrom->toDateString(), $previousTo->toDateString()])
            ->count();

        $caseIds = $sessions->pluck('case_id')->filter()->unique()->values()->all();
        $appointmentIds = $sessions->pluck('appointment_id')->filter()->unique()->values()->all();
        $cases = CounselingCase::whereIn('_id', $caseIds)->get()->keyBy(fn (CounselingCase $case) => (string) $case->id);
        $appointments = Appointment::whereIn('_id', $appointmentIds)->get()->keyBy(fn (Appointment $appointment) => (string) $appointment->id);

        $records = $sessions->map(function (CounselingSession $session) use ($cases, $appointments) {
            $case = $cases->get((string) $session->case_id);
            $appointment = $appointments->get((string) $session->appointment_id);

            return [
                'date' => (string) ($session->session_date ?? ''),
                'concern' => $this->concernLabel($session->concern_category ?? $case?->category),
                'service' => $this->serviceLabel($session->service_type ?? $appointment?->type),
                'status' => (string) ($session->status ?? 'scheduled'),
                'is_referral' => ! (bool) ($session->is_follow_up ?? false),
            ];
        });

        if ($records->isEmpty()) {
            return Inertia::render('Analytics', $this->placeholderProps($from, $to));
        }

        $total = $records->count();
        $followUps = $records->where('status', 'follow-up')->count();
        $concerns = $this->counts($records, 'concern', $this->concernCategories());
        $serviceCounts = $this->counts($records, 'service', $this->serviceCategories());
        $monthly = $this->monthly($records, $to, 4);
        $referralRecords = $records->where('is_referral', true);
        $referrals = $this->monthly($referralRecords, $to, 5);
        $previousReferralCount = CounselingSession::where('counselor_id', $counselorId)
            ->where('is_follow_up', false)
            ->whereBetween('session_date', [$previousFrom->toDateString(), $previousTo->toDateString()])
            ->count();
        $totalChange = $previousTotal > 0
            ? round((($total - $previousTotal) / $previousTotal) * 100)
            : ($total > 0 ? 100 : 0);

        return Inertia::render('Analytics', [
            'total' => $total,
            'followUps' => $followUps,
            'totalChange' => $totalChange,
            'sessionsTrend' => $this->weekly($records, $from, $to),
            'concerns' => $this->percentages($concerns, $total),
            'referrals' => [
                'total' => $referralRecords->count(),
                'change' => $previousReferralCount > 0
                    ? round((($referralRecords->count() - $previousReferralCount) / $previousReferralCount) * 100)
                    : ($referralRecords->count() > 0 ? 100 : 0),
                'series' => collect($referrals)->map(fn (array $item) => [
                    'm' => $item['month'],
                    'v' => $item['appointments'],
                ])->all(),
            ],
            'serviceTypes' => $this->percentages($serviceCounts, $total),
            'monthly' => $monthly,
            'topConcerns' => collect($this->namedValues($concerns))
                ->sortByDesc('value')
                ->take(5)
                ->map(fn (array $item) => ['name' => $item['name'], 'count' => $item['value']])
                ->values()
                ->all(),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    private function counts($records, string $field, array $categories = []): array
    {
        $counts = $records->countBy(fn (array $record) => $record[$field])->all();

        return collect($categories)->mapWithKeys(fn (string $category) => [$category => $counts[$category] ?? 0])->all();
    }

    private function namedValues(array $counts): array
    {
        return collect($counts)->map(fn (int $value, string $name) => [
            'name' => $name,
            'value' => $value,
        ])->sortByDesc('value')->values()->all();
    }

    private function percentages(array $counts, int $total): array
    {
        return collect($this->namedValues($counts))->map(fn (array $item) => [
            'name' => $item['name'],
            'value' => $total > 0 ? round(($item['value'] / $total) * 100) : 0,
        ])->all();
    }

    private function monthly($records, Carbon $to, int $monthCount): array
    {
        $months = collect();
        $cursor = $to->copy()->startOfMonth()->subMonths($monthCount - 1);
        $end = $to->copy()->startOfMonth();
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');
            $monthRecords = $records->filter(fn (array $record) => str_starts_with($record['date'], $key));
            $months->push([
                'month' => $cursor->format('M'),
                'appointments' => $monthRecords->count(),
                'completed' => $monthRecords->where('status', 'completed')->count(),
            ]);
            $cursor->addMonth();
        }

        return $months->all();
    }

    private function weekly($records, Carbon $from, Carbon $to): array
    {
        $weeks = collect();
        $cursor = $from->copy()->startOfWeek();
        while ($cursor->lte($to)) {
            $key = $cursor->format('Y-m-d');
            $weekRecords = $records->filter(fn (array $record) => Carbon::parse($record['date'])->startOfWeek()->format('Y-m-d') === $key);
            $weeks->push(['label' => $cursor->format('M j'), 'v' => $weekRecords->count()]);
            $cursor->addWeek();
        }

        return $weeks->all();
    }

    private function concernCategories(): array
    {
        return ['Academic', 'Personal', 'Career', 'Mental Health', 'Others'];
    }

    private function serviceCategories(): array
    {
        return ['Individual Counseling', 'Follow-up Session', 'Crisis Support', 'Group Guidance', 'Referral'];
    }

    private function concernLabel(?string $value): string
    {
        $value = strtolower((string) $value);

        return match (true) {
            str_contains($value, 'academic') => 'Academic',
            str_contains($value, 'career') => 'Career',
            str_contains($value, 'mental'), str_contains($value, 'stress'), str_contains($value, 'anxiety') => 'Mental Health',
            str_contains($value, 'personal'), str_contains($value, 'social') => 'Personal',
            default => 'Others',
        };
    }

    private function serviceLabel(?string $value): string
    {
        $value = strtolower((string) $value);

        return match (true) {
            str_contains($value, 'follow') => 'Follow-up Session',
            str_contains($value, 'crisis'), str_contains($value, 'urgent') => 'Crisis Support',
            str_contains($value, 'group') => 'Group Guidance',
            str_contains($value, 'referral') => 'Referral',
            default => 'Individual Counseling',
        };
    }

    private function placeholderProps(Carbon $from, Carbon $to): array
    {
        $months = collect(range(0, 3))->map(fn (int $offset) => [
            'month' => $to->copy()->startOfMonth()->subMonths(3 - $offset)->format('M'),
            'appointments' => 28 + ($offset * 3),
            'completed' => 24 + ($offset * 2),
        ])->all();

        return [
            'total' => 128,
            'followUps' => 18,
            'totalChange' => 12,
            'sessionsTrend' => collect(range(0, 3))->map(fn (int $index) => ['label' => 'Week '.($index + 1), 'v' => 24 + ($index * 4)])->all(),
            'concerns' => [
                ['name' => 'Academic', 'value' => 33],
                ['name' => 'Personal', 'value' => 23],
                ['name' => 'Career', 'value' => 19],
                ['name' => 'Mental Health', 'value' => 16],
                ['name' => 'Others', 'value' => 9],
            ],
            'referrals' => [
                'total' => 34,
                'change' => 8,
                'series' => collect(range(0, 4))->map(fn (int $offset) => [
                    'm' => $to->copy()->startOfMonth()->subMonths(4 - $offset)->format('M'),
                    'v' => 7 + $offset,
                ])->all(),
            ],
            'serviceTypes' => [
                ['name' => 'Individual Counseling', 'value' => 52],
                ['name' => 'Follow-up Session', 'value' => 22],
                ['name' => 'Crisis Support', 'value' => 12],
                ['name' => 'Group Guidance', 'value' => 8],
                ['name' => 'Referral', 'value' => 6],
            ],
            'monthly' => $months,
            'topConcerns' => [
                ['name' => 'Academic pressure', 'count' => 42],
                ['name' => 'Personal adjustment', 'count' => 29],
                ['name' => 'Career planning', 'count' => 24],
                ['name' => 'Stress and anxiety', 'count' => 21],
                ['name' => 'Peer relationships', 'count' => 12],
            ],
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ];
    }
}
