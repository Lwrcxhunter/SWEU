<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselorSchedule;
use App\Models\Referral;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
use App\Services\Appointments;
use App\Services\CounselorAvailability;
use App\Services\CounselorSchedules;
use App\Support\Ids;
use App\Support\Views;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WalkInQueueController extends Controller
{
    public function index(Request $request, CounselorAvailability $availability, CounselorSchedules $schedules)
    {
        $filters = $request->validate([
            'stage' => 'nullable|in:all,unassigned,waiting,confirmed,urgent',
            'calendar_date' => 'nullable|date_format:Y-m-d',
            'calendar_view' => 'nullable|in:day,week',
            'tab' => 'nullable|in:queue,calendar',
        ]);
        $stage = $filters['stage'] ?? 'all';
        $date = CarbonImmutable::parse($filters['calendar_date'] ?? today()->toDateString());
        $view = $filters['calendar_view'] ?? 'week';
        $start = $view === 'day' ? $date : $date->startOfWeek();
        $dates = collect(range(0, $view === 'day' ? 0 : 6))
            ->map(fn ($offset) => $start->addDays($offset)->toDateString());

        $base = Appointment::whereIn('status', CounselorAvailability::ACTIVE_STATUSES);
        $queue = clone $base;
        match ($stage) {
            'unassigned' => $queue->whereNull('counselor_id'),
            'waiting' => $queue->whereNotNull('counselor_id')->where('status', '!=', 'accepted'),
            'confirmed' => $queue->where('status', 'accepted'),
            'urgent' => $queue->where('urgency_level', 'urgent'),
            default => null,
        };
        $appointments = $queue->orderByDesc('urgency_level')->oldest()->paginate(20)->withQueryString();

        $users = User::where('role', 'counselor')->where('active', true)->orderBy('full_name')->get();
        $bookingDates = $dates
            ->concat(collect($appointments->items())->pluck('scheduled_date'))
            ->push(today()->toDateString())
            ->filter()
            ->unique()
            ->values()
            ->all();
        $bookings = Appointment::whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
            ->whereNotNull('counselor_id')
            ->whereIn('scheduled_date', $bookingDates)
            ->get(['_id', 'counselor_id', 'scheduled_date', 'scheduled_time', 'status']);
        $byCounselor = $bookings->groupBy(fn ($booking) => (string) $booking->counselor_id);

        $appointments = Views::appointments($appointments, true)->through(
            function ($appointment) use ($users, $availability, $schedules, $byCounselor) {
                $urgent = $appointment['urgency_level'] === 'urgent';
                $appointmentsByCounselor = $byCounselor;
                $appointment['assignment_options'] = $users->map(
                    function ($user) use ($appointment, $urgent, $availability, $schedules, $appointmentsByCounselor) {
                        $counselorBookings = $appointmentsByCounselor->get((string) $user->id, collect());
                        $scheduledDate = $urgent ? today()->toDateString() : $appointment['scheduled_date'];
                        $scheduledTime = $urgent
                            ? now()->format('H:i')
                            : ($appointment['scheduled_time'] ?? null);
                        $result = $availability->check(
                            $user,
                            $scheduledDate,
                            $scheduledTime,
                            $urgent ? null : ($appointment['preferred_period'] ?? null),
                            $counselorBookings,
                            $appointment['id'],
                            $urgent,
                        );
                        $schedule = CounselorSchedule::where('counselor_id', Ids::object($user->id))->first();
                        if ($result['available'] && $schedule) {
                            if ($scheduledTime) {
                                $result['available'] = $schedules->allowsAppointment(
                                    (string) $user->id,
                                    ['scheduled_date' => $scheduledDate, 'scheduled_time' => $scheduledTime],
                                    $urgent,
                                );
                            } else {
                                $result['times'] = array_values(array_filter(
                                    $result['times'],
                                    fn ($time) => $schedules->allowsAppointment(
                                        (string) $user->id,
                                        ['scheduled_date' => $scheduledDate, 'scheduled_time' => $time],
                                    ),
                                ));
                                $result['available'] = $result['times'] !== [];
                            }
                            if (! $result['available']) {
                                $result['status'] = 'off_schedule';
                                $result['badge'] = 'Outside counselor schedule';
                                $result['reason'] = 'No configured counseling time is available without a class or leave conflict.';
                                $result['times'] = [];
                            }
                        }

                        return ['id' => (string) $user->id, ...$result];
                    },
                )->all();

                return $appointment;
            },
        );

        $scheduleIds = $users->map(fn ($user) => Ids::object($user->id))->all();
        $schedulesByCounselor = CounselorSchedule::whereIn('counselor_id', $scheduleIds)
            ->get()
            ->keyBy(fn ($schedule) => (string) $schedule->counselor_id);
        $counselors = $users->map(function ($user) use ($dates, $availability, $schedules, $schedulesByCounselor, $byCounselor) {
            $schedule = $schedulesByCounselor->get((string) $user->id);
            $calendar = $dates->mapWithKeys(function ($day) use ($user, $availability, $schedules, $schedule, $byCounselor) {
                $periods = $availability->day($user, $day, $byCounselor->get((string) $user->id, collect()));
                if ($schedule) {
                    foreach ($periods as &$blocks) {
                        foreach ($blocks as &$block) {
                            if ($block['status'] === 'available'
                                && ! $schedules->allowsAppointment((string) $user->id, [
                                    'scheduled_date' => $day,
                                    'scheduled_time' => $block['start'],
                                ])) {
                                $block['status'] = 'off_schedule';
                                $block['available'] = false;
                                $block['badge'] = 'Outside counselor schedule';
                                $block['reason'] = 'This time is outside configured counseling hours or conflicts with class/leave.';
                            }
                        }
                        unset($block);
                    }
                    unset($blocks);
                }

                return [$day => $periods];
            })->all();

            return [
                'id' => (string) $user->id,
                'full_name' => $user->full_name,
                'college_codes' => $user->college_codes ?? [],
                'designation' => $user->designation,
                'on_duty' => (bool) $user->on_duty,
                'available' => (bool) $user->available,
                'uses_default_schedule' => ! is_array($user->counseling_schedule),
                'schedule' => $schedule ? [
                    'availability' => $schedule->availability ?? [],
                    'classSchedule' => $schedule->classSchedule ?? [],
                    'leaves' => collect($schedule->leaves ?? [])->map(fn ($leave) => [
                        'startDateTime' => $leave['startDateTime'],
                        'endDateTime' => $leave['endDateTime'],
                        'type' => $leave['type'],
                    ])->all(),
                ] : null,
                'active_sessions_count' => Appointment::where('counselor_id', Ids::object($user->id))
                    ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
                    ->count(),
                'calendar' => $calendar,
            ];
        });

        return Inertia::render('Staff/WalkInQueue', [
            'appointments' => $appointments,
            'counselors' => $counselors,
            'colleges' => config('guidance.colleges', []),
            'filters' => ['stage' => $stage, 'tab' => $filters['tab'] ?? 'queue'],
            'calendar' => [
                'date' => $date->toDateString(),
                'view' => $view,
                'dates' => $dates,
                'today' => today()->toDateString(),
            ],
            'metrics' => [
                'queue_total' => (clone $base)->count(),
                'unassigned_count' => (clone $base)->whereNull('counselor_id')->count(),
                'waiting_count' => (clone $base)->whereNotNull('counselor_id')->where('status', '!=', 'accepted')->count(),
                'confirmed_count' => (clone $base)->where('status', 'accepted')->count(),
                'urgent_count' => (clone $base)->where('urgency_level', 'urgent')->count(),
                'pending_referrals_count' => Referral::where('status', 'submitted')->count(),
                'open_testing_count' => TestingRequest::where('status', 'pending')->count(),
                'counselors_on_duty' => $users->where('on_duty', true)->count(),
                'counselors_total' => $users->count(),
            ],
        ]);
    }

    public function store(Request $request, Appointments $service)
    {
        $data = $request->validate(['school_id_number' => 'required|string|max:20']);
        $student = Student::where('school_id_number', $data['school_id_number'])->first();
        if (! $student || ! ($student->intake_record['signed_agreement'] ?? false)) {
            throw ValidationException::withMessages(['school_id_number' => 'The student must first complete their digital intake and agreement.']);
        }
        $service->walkIn($student);

        return back()->with('success', 'Student added to the walk-in queue.');
    }
}
