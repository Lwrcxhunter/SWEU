<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
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
        $filters = $request->validate([
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'preset' => 'nullable|string|in:today,this_week,this_month,last_month,semester,school_year,all,custom',
            'service' => 'nullable|string|in:all,appointments,testing,cases',
            'status' => 'nullable|string',
            'college' => 'nullable|string',
            'counselor_id' => 'nullable|string',
            'type' => 'nullable|string|in:all,walk_in,scheduled',
            'urgency' => 'nullable|string|in:all,urgent,standard',
        ]);

        [$start, $end, $activePreset, $from, $to] = $this->resolveDateRange(
            $filters['preset'] ?? null,
            $filters['from'] ?? null,
            $filters['to'] ?? null
        );

        $selectedCollege = $filters['college'] ?? 'all';
        $selectedCounselor = $filters['counselor_id'] ?? 'all';
        $selectedService = $filters['service'] ?? 'all';
        $selectedStatus = $filters['status'] ?? 'all';
        $selectedType = $filters['type'] ?? 'all';
        $selectedUrgency = $filters['urgency'] ?? 'all';

        // Preload active counselors
        $counselors = User::where('role', 'counselor')
            ->where('active', true)
            ->orderBy('full_name')
            ->get(['_id', 'full_name', 'email']);
        $counselorsMap = $counselors->keyBy(fn ($c) => (string) $c->id);

        // Preload students college mapping if needed
        $studentQuery = Student::query();
        if ($selectedCollege !== 'all') {
            $studentQuery->where(function ($q) use ($selectedCollege) {
                $q->where('college', $selectedCollege)
                  ->orWhere('college.code', $selectedCollege);
            });
        }
        $filteredStudentIds = ($selectedCollege !== 'all')
            ? $studentQuery->pluck('_id')->map(fn ($id) => Ids::object($id))->all()
            : null;

        // Base Queries with Date and Primary Filters
        $appointmentQuery = Appointment::whereBetween('created_at', [$start, $end]);
        if ($filteredStudentIds !== null) {
            $appointmentQuery->whereIn('student_id', $filteredStudentIds);
        }
        if ($selectedCounselor !== 'all') {
            $appointmentQuery->where('counselor_id', Ids::object($selectedCounselor));
        }
        if ($selectedType !== 'all') {
            if ($selectedType === 'walk_in') {
                $appointmentQuery->where('type', 'walk_in');
            } else {
                $appointmentQuery->where(fn ($q) => $q->whereNull('type')->orWhere('type', '!=', 'walk_in'));
            }
        }
        if ($selectedUrgency !== 'all') {
            $appointmentQuery->where('urgency_level', $selectedUrgency);
        }
        if ($selectedStatus !== 'all') {
            if ($selectedStatus === 'assigned') {
                $appointmentQuery->whereIn('status', ['assigned', 'assigned_pending_counselor', 'assigned_pending_accept']);
            } elseif ($selectedStatus === 'confirmed' || $selectedStatus === 'accepted') {
                $appointmentQuery->whereIn('status', ['accepted', 'confirmed']);
            } else {
                $appointmentQuery->where('status', $selectedStatus);
            }
        }

        $testingQuery = TestingRequest::whereBetween('created_at', [$start, $end]);
        if ($selectedCollege !== 'all') {
            $testingQuery->where(function ($q) use ($selectedCollege) {
                $q->where('college', $selectedCollege)
                  ->orWhere('college.code', $selectedCollege);
            });
        }
        if ($selectedStatus !== 'all') {
            $testingQuery->where('status', $selectedStatus);
        }

        $caseQuery = CounselingCase::whereBetween('created_at', [$start, $end]);
        if ($filteredStudentIds !== null) {
            $caseQuery->whereIn('student_id', $filteredStudentIds);
        }
        if ($selectedCounselor !== 'all') {
            $caseQuery->where('counselor_id', Ids::object($selectedCounselor));
        }
        if ($selectedStatus !== 'all') {
            $caseQuery->where('status', $selectedStatus);
        }

        // Aggregate Metrics Rows (for service & status matrix, backwards compatible)
        $rows = [];
        $includeAppointments = in_array($selectedService, ['all', 'appointments']);
        $includeTesting = in_array($selectedService, ['all', 'testing']);
        $includeCases = in_array($selectedService, ['all', 'cases']);

        if ($includeAppointments) {
            foreach (['pending', 'assigned', 'accepted', 'completed', 'cancelled'] as $st) {
                $q = clone $appointmentQuery;
                if ($selectedStatus === 'all') {
                    if ($st === 'assigned') {
                        $q->whereIn('status', ['assigned', 'assigned_pending_counselor', 'assigned_pending_accept']);
                    } elseif ($st === 'accepted') {
                        $q->whereIn('status', ['accepted', 'confirmed']);
                    } else {
                        $q->where('status', $st);
                    }
                }
                $rows[] = [
                    'service' => 'Appointment',
                    'status' => $st,
                    'count' => $q->count(),
                ];
            }
        }

        if ($includeTesting) {
            foreach (['pending', 'approved', 'completed'] as $st) {
                $q = clone $testingQuery;
                if ($selectedStatus === 'all') {
                    $q->where('status', $st);
                }
                $rows[] = [
                    'service' => 'TestingRequest',
                    'status' => $st,
                    'count' => $q->count(),
                ];
            }
        }

        if ($includeCases) {
            foreach (['open', 'follow_up', 'closed'] as $st) {
                $q = clone $caseQuery;
                if ($selectedStatus === 'all') {
                    $q->where('status', $st);
                }
                $rows[] = [
                    'service' => 'CounselingCase',
                    'status' => $st,
                    'count' => $q->count(),
                ];
            }
        }

        // KPIs calculation
        $kpis = [
            'total_appointments' => (clone $appointmentQuery)->count(),
            'walk_ins' => (clone $appointmentQuery)->where('type', 'walk_in')->count(),
            'scheduled' => (clone $appointmentQuery)->where(fn ($q) => $q->whereNull('type')->orWhere('type', '!=', 'walk_in'))->count(),
            'urgent' => (clone $appointmentQuery)->where('urgency_level', 'urgent')->count(),
            'completed_appointments' => (clone $appointmentQuery)->where('status', 'completed')->count(),
            'total_testing' => (clone $testingQuery)->count(),
            'approved_testing' => (clone $testingQuery)->where('status', 'approved')->count(),
            'completed_testing' => (clone $testingQuery)->where('status', 'completed')->count(),
            'total_cases' => (clone $caseQuery)->count(),
            'closed_cases' => (clone $caseQuery)->where('status', 'closed')->count(),
        ];

        // College Breakdown calculation
        $collegesConfig = config('guidance.colleges', []);
        $allStudents = Student::get(['_id', 'college']);
        $studentCollegeLookup = [];
        foreach ($allStudents as $st) {
            $cCode = is_array($st->college) ? ($st->college['code'] ?? '') : ($st->college ?? '');
            if ($cCode) {
                $studentCollegeLookup[(string) $st->id] = strtoupper($cCode);
            }
        }

        $allAppointmentsInPeriod = (clone $appointmentQuery)->get(['_id', 'student_id']);
        $apptCollegeCounts = [];
        foreach ($allAppointmentsInPeriod as $ap) {
            $sid = (string) $ap->student_id;
            $code = $studentCollegeLookup[$sid] ?? 'UNKNOWN';
            $apptCollegeCounts[$code] = ($apptCollegeCounts[$code] ?? 0) + 1;
        }

        $allTestingInPeriod = (clone $testingQuery)->get(['_id', 'college']);
        $testCollegeCounts = [];
        foreach ($allTestingInPeriod as $tq) {
            $code = is_array($tq->college) ? ($tq->college['code'] ?? '') : ($tq->college ?? '');
            $code = strtoupper($code ?: 'UNKNOWN');
            $testCollegeCounts[$code] = ($testCollegeCounts[$code] ?? 0) + 1;
        }

        $totalInteractions = $kpis['total_appointments'] + $kpis['total_testing'];
        $collegeBreakdown = [];
        foreach ($collegesConfig as $col) {
            $cCode = strtoupper($col['code']);
            $appts = $apptCollegeCounts[$cCode] ?? 0;
            $tests = $testCollegeCounts[$cCode] ?? 0;
            $total = $appts + $tests;
            $pct = $totalInteractions > 0 ? round(($total / $totalInteractions) * 100, 1) : 0;
            $collegeBreakdown[] = [
                'code' => $col['code'],
                'name' => $col['name'],
                'appointments' => $appts,
                'testing' => $tests,
                'total' => $total,
                'percentage' => $pct,
            ];
        }

        // Counselor Breakdown calculation
        $counselorBreakdown = [];
        foreach ($counselors as $c) {
            $cid = (string) $c->id;
            $cAppts = Appointment::whereBetween('created_at', [$start, $end])
                ->where('counselor_id', Ids::object($cid));
            $assignedCount = (clone $cAppts)->count();
            $completedCount = (clone $cAppts)->where('status', 'completed')->count();
            $urgentCount = (clone $cAppts)->where('urgency_level', 'urgent')->count();
            $casesCount = CounselingCase::whereBetween('created_at', [$start, $end])
                ->where('counselor_id', Ids::object($cid))->count();

            $counselorBreakdown[] = [
                'id' => $cid,
                'name' => $c->full_name,
                'assigned' => $assignedCount,
                'completed' => $completedCount,
                'urgent' => $urgentCount,
                'cases' => $casesCount,
            ];
        }

        // Recent Scoped Records (Max 20 for quick preview, strictly non-clinical)
        $recentRecords = [];
        if ($includeAppointments) {
            $recentAppts = (clone $appointmentQuery)->latest()->limit(15)->get();
            foreach ($recentAppts as $ap) {
                $sid = (string) $ap->student_id;
                $cid = (string) $ap->counselor_id;
                $recentRecords[] = [
                    'id' => (string) $ap->id,
                    'service' => 'Counseling Appointment',
                    'date' => $ap->scheduled_date ?? ($ap->created_at ? Carbon::parse($ap->created_at)->toDateString() : ''),
                    'time' => $ap->scheduled_time ?? ($ap->preferred_period ?? '—'),
                    'college' => $studentCollegeLookup[$sid] ?? '—',
                    'type' => $ap->type === 'walk_in' ? 'Walk-in' : 'Scheduled',
                    'urgency' => $ap->urgency_level ?? 'standard',
                    'counselor' => isset($counselorsMap[$cid]) ? $counselorsMap[$cid]->full_name : 'Unassigned',
                    'status' => $ap->status,
                    'created_at' => $ap->created_at ? Carbon::parse($ap->created_at)->toIso8601String() : '',
                ];
            }
        }
        if ($includeTesting) {
            $recentTests = (clone $testingQuery)->latest()->limit(10)->get();
            foreach ($recentTests as $tq) {
                $code = is_array($tq->college) ? ($tq->college['code'] ?? '') : ($tq->college ?? '—');
                $recentRecords[] = [
                    'id' => (string) $tq->id,
                    'service' => 'Testing Request',
                    'date' => $tq->preferred_date ?? ($tq->created_at ? Carbon::parse($tq->created_at)->toDateString() : ''),
                    'time' => $tq->preferred_session ?? '—',
                    'college' => strtoupper($code),
                    'type' => $tq->test_type ?? 'Psychological Test',
                    'urgency' => 'standard',
                    'counselor' => $tq->requester_name ?? 'Faculty/Coordinator',
                    'status' => $tq->status,
                    'created_at' => $tq->created_at ? Carbon::parse($tq->created_at)->toIso8601String() : '',
                ];
            }
        }

        usort($recentRecords, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));
        $recentRecords = array_slice($recentRecords, 0, 20);

        // Compute Visual Analytics Insights for Analytics Hub
        $monthlyTrends = [];
        $cursorMonth = $end->copy()->startOfMonth();
        for ($i = 5; $i >= 0; $i--) {
            $mStart = $cursorMonth->copy()->subMonths($i)->startOfDay();
            $mEnd = $mStart->copy()->endOfMonth()->endOfDay();
            $mLabel = $mStart->format('M Y');

            $mAppts = Appointment::whereBetween('created_at', [$mStart, $mEnd])->count();
            $mTests = TestingRequest::whereBetween('created_at', [$mStart, $mEnd])->count();
            $mUrgent = Appointment::whereBetween('created_at', [$mStart, $mEnd])->where('urgency_level', 'urgent')->count();
            $mWalkIn = Appointment::whereBetween('created_at', [$mStart, $mEnd])->where('type', 'walk_in')->count();

            $monthlyTrends[] = [
                'month' => $mLabel,
                'appointments' => $mAppts,
                'testing' => $mTests,
                'urgent' => $mUrgent,
                'walk_ins' => $mWalkIn,
                'total' => $mAppts + $mTests,
            ];
        }

        $daysMap = ['Mon' => 0, 'Tue' => 0, 'Wed' => 0, 'Thu' => 0, 'Fri' => 0];
        $morningCount = 0;
        $afternoonCount = 0;

        $allApptsData = (clone $appointmentQuery)->get(['scheduled_date', 'scheduled_time', 'preferred_period', 'created_at']);
        foreach ($allApptsData as $ap) {
            $dateStr = $ap->scheduled_date ?? ($ap->created_at ? Carbon::parse($ap->created_at)->toDateString() : null);
            if ($dateStr) {
                $dayName = Carbon::parse($dateStr)->format('D');
                if (isset($daysMap[$dayName])) {
                    $daysMap[$dayName]++;
                }
            }

            if ($ap->preferred_period === 'AM') {
                $morningCount++;
            } elseif ($ap->preferred_period === 'PM') {
                $afternoonCount++;
            } elseif ($ap->scheduled_time) {
                $hour = (int) substr($ap->scheduled_time, 0, 2);
                if ($hour < 12) {
                    $morningCount++;
                } else {
                    $afternoonCount++;
                }
            }
        }

        $totalApptsWithDay = array_sum($daysMap);
        $dayOfWeekDistribution = [];
        foreach ($daysMap as $d => $c) {
            $dayOfWeekDistribution[] = [
                'day' => $d,
                'count' => $c,
                'percentage' => $totalApptsWithDay > 0 ? round(($c / $totalApptsWithDay) * 100, 1) : 0,
            ];
        }

        $totalTimes = $morningCount + $afternoonCount;
        $analytics = [
            'monthlyTrends' => $monthlyTrends,
            'dayOfWeekDistribution' => $dayOfWeekDistribution,
            'timeOfDay' => [
                'morning' => $morningCount,
                'afternoon' => $afternoonCount,
                'morning_pct' => $totalTimes > 0 ? round(($morningCount / $totalTimes) * 100, 1) : 50,
                'afternoon_pct' => $totalTimes > 0 ? round(($afternoonCount / $totalTimes) * 100, 1) : 50,
            ],
            'urgencyRatio' => [
                'urgent' => $kpis['urgent'],
                'standard' => max(0, $kpis['total_appointments'] - $kpis['urgent']),
                'urgent_pct' => $kpis['total_appointments'] > 0 ? round(($kpis['urgent'] / $kpis['total_appointments']) * 100, 1) : 0,
            ],
            'typeRatio' => [
                'walk_in' => $kpis['walk_ins'],
                'scheduled' => $kpis['scheduled'],
                'walk_in_pct' => $kpis['total_appointments'] > 0 ? round(($kpis['walk_ins'] / $kpis['total_appointments']) * 100, 1) : 0,
            ],
        ];

        // CSV Download handler
        if ($request->boolean('download')) {
            return response()->streamDownload(function () use ($rows, $collegeBreakdown, $counselorBreakdown, $kpis, $from, $to) {
                $out = fopen('php://output', 'w');
                // Section 1: Standard Service Status Summary
                fputcsv($out, ['Service', 'Status', 'Count'], ',', '"', '');
                foreach ($rows as $row) {
                    fputcsv($out, array_values($row), ',', '"', '');
                }

                // Section 2: KPIs
                fputcsv($out, [], ',', '"', '');
                fputcsv($out, ['--- OFFICE PERFORMANCE METRICS ('.$from.' to '.$to.') ---'], ',', '"', '');
                fputcsv($out, ['Metric', 'Value'], ',', '"', '');
                fputcsv($out, ['Total Appointments', $kpis['total_appointments']], ',', '"', '');
                fputcsv($out, ['Walk-in Appointments', $kpis['walk_ins']], ',', '"', '');
                fputcsv($out, ['Scheduled Appointments', $kpis['scheduled']], ',', '"', '');
                fputcsv($out, ['Urgent Cases Triaged', $kpis['urgent']], ',', '"', '');
                fputcsv($out, ['Completed Sessions', $kpis['completed_appointments']], ',', '"', '');
                fputcsv($out, ['Total Testing Requests', $kpis['total_testing']], ',', '"', '');
                fputcsv($out, ['Approved Testing Requests', $kpis['approved_testing']], ',', '"', '');
                fputcsv($out, ['Counseling Cases Opened', $kpis['total_cases']], ',', '"', '');
                fputcsv($out, ['Counseling Cases Closed', $kpis['closed_cases']], ',', '"', '');

                // Section 3: College Distribution
                fputcsv($out, [], ',', '"', '');
                fputcsv($out, ['--- COLLEGE DISTRIBUTION ---'], ',', '"', '');
                fputcsv($out, ['College Code', 'College Name', 'Appointments', 'Testing Requests', 'Total Interactions', 'Share (%)'], ',', '"', '');
                foreach ($collegeBreakdown as $col) {
                    fputcsv($out, [
                        $col['code'],
                        $col['name'],
                        $col['appointments'],
                        $col['testing'],
                        $col['total'],
                        $col['percentage'].'%',
                    ], ',', '"', '');
                }

                // Section 4: Counselor Caseload
                fputcsv($out, [], ',', '"', '');
                fputcsv($out, ['--- COUNSELOR CASELOAD ---'], ',', '"', '');
                fputcsv($out, ['Counselor Name', 'Assigned Appointments', 'Completed Sessions', 'Urgent Cases', 'Cases Managed'], ',', '"', '');
                foreach ($counselorBreakdown as $cb) {
                    fputcsv($out, [
                        $cb['name'],
                        $cb['assigned'],
                        $cb['completed'],
                        $cb['urgent'],
                        $cb['cases'],
                    ], ',', '"', '');
                }

                fclose($out);
            }, 'guidance-summary.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Cache-Control' => 'no-store',
            ]);
        }

        return Inertia::render('Staff/Reports', [
            'rows' => $rows,
            'kpis' => $kpis,
            'analytics' => $analytics,
            'collegeBreakdown' => $collegeBreakdown,
            'counselorBreakdown' => $counselorBreakdown,
            'recentRecords' => $recentRecords,
            'colleges' => $collegesConfig,
            'counselors' => $counselors->map(fn ($c) => ['id' => (string) $c->id, 'full_name' => $c->full_name])->values()->all(),
            'filters' => [
                'from' => $from,
                'to' => $to,
                'preset' => $activePreset,
                'service' => $selectedService,
                'status' => $selectedStatus,
                'college' => $selectedCollege,
                'counselor_id' => $selectedCounselor,
                'type' => $selectedType,
                'urgency' => $selectedUrgency,
            ],
            'from' => $from,
            'to' => $to,
        ]);
    }

    private function resolveDateRange(?string $preset, ?string $from, ?string $to): array
    {
        $now = now();
        switch ($preset) {
            case 'today':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'today', $now->toDateString(), $now->toDateString()];
            case 'this_week':
                $start = $now->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $end = $now->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
                return [$start, $end, 'this_week', $start->toDateString(), $end->toDateString()];
            case 'this_month':
                $start = $now->copy()->startOfMonth()->startOfDay();
                $end = $now->copy()->endOfMonth()->endOfDay();
                return [$start, $end, 'this_month', $start->toDateString(), $end->toDateString()];
            case 'last_month':
                $last = $now->copy()->subMonth();
                $start = $last->copy()->startOfMonth()->startOfDay();
                $end = $last->copy()->endOfMonth()->endOfDay();
                return [$start, $end, 'last_month', $start->toDateString(), $end->toDateString()];
            case 'semester':
                $month = $now->month;
                $year = $now->year;
                if ($month >= 8) {
                    $start = Carbon::create($year, 8, 1)->startOfDay();
                    $end = Carbon::create($year, 12, 31)->endOfDay();
                } elseif ($month >= 1 && $month <= 5) {
                    $start = Carbon::create($year, 1, 1)->startOfDay();
                    $end = Carbon::create($year, 5, 31)->endOfDay();
                } else {
                    $start = Carbon::create($year, 6, 1)->startOfDay();
                    $end = Carbon::create($year, 7, 31)->endOfDay();
                }
                return [$start, $end, 'semester', $start->toDateString(), $end->toDateString()];
            case 'school_year':
                $year = $now->month >= 8 ? $now->year : $now->year - 1;
                $start = Carbon::create($year, 8, 1)->startOfDay();
                $end = Carbon::create($year + 1, 7, 31)->endOfDay();
                return [$start, $end, 'school_year', $start->toDateString(), $end->toDateString()];
            case 'all':
                $start = Carbon::create(2020, 1, 1)->startOfDay();
                $end = $now->copy()->endOfDay();
                return [$start, $end, 'all', $start->toDateString(), $end->toDateString()];
            case 'custom':
            default:
                if ($from && $to) {
                    return [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay(), $preset ?? 'custom', $from, $to];
                }
                if ($from) {
                    $start = Carbon::parse($from)->startOfDay();
                    $end = $now->copy()->endOfDay();
                    return [$start, $end, $preset ?? 'custom', $from, $end->toDateString()];
                }
                $start = $now->copy()->startOfMonth()->startOfDay();
                $end = $now->copy()->endOfDay();
                return [$start, $end, $preset ?? 'this_month', $start->toDateString(), $end->toDateString()];
        }
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
