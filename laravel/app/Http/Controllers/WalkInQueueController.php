<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselorSchedule;
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
use MongoDB\BSON\Regex;

class WalkInQueueController extends Controller
{
    public function index(Request $request, CounselorAvailability $availability, CounselorSchedules $schedules)
    {
        if ($this->wantsOnlyGlobalProps($request, 'Staff/WalkInQueue', ['appointments', 'counselors', 'filters', 'calendar', 'metrics', 'colleges'])) {
            return Inertia::render('Staff/WalkInQueue', []);
        }

        $filters = $request->validate([
            'stage' => 'nullable|in:all,unassigned,waiting,student,confirmed,urgent,completed,cancelled',
            'search' => 'nullable|string|max:100',
            'appointment_date' => 'nullable|date_format:Y-m-d',
            'calendar_date' => 'nullable|date_format:Y-m-d',
            'calendar_view' => 'nullable|in:day,week',
            'tab' => 'nullable|in:queue,calendar',
        ]);
        $stage = $filters['stage'] ?? 'all';
        $date = CarbonImmutable::parse($filters['calendar_date'] ?? today()->toDateString());
        $view = $filters['calendar_view'] ?? 'day';
        $start = $view === 'day' ? $date : $date->startOfWeek();
        $dates = collect(range(0, $view === 'day' ? 0 : 6))
            ->map(fn ($offset) => $start->addDays($offset)->toDateString());

        $base = Appointment::query();
        $queue = clone $base;
        match ($stage) {
            'unassigned' => $queue->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)->where(fn ($q) => $q->whereNull('counselor_id')->orWhere('status', 'reassignment_requested')),
            'waiting' => $queue->whereNotNull('counselor_id')->whereIn('status', ['assigned', 'assigned_pending_accept', 'assigned_pending_counselor', 'rescheduled']),
            'student' => $queue->where('status', 'counselor_accepted_pending_student'),
            'confirmed' => $queue->whereIn('status', ['accepted', 'confirmed']),
            'urgent' => $queue->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)->where('urgency_level', 'urgent'),
            'completed', 'cancelled' => $queue->where('status', $stage),
            default => null,
        };
        if ($search = trim($filters['search'] ?? '')) {
            $pattern = new Regex(preg_quote($search), 'i');
            $userIds = User::where('full_name', 'regex', $pattern)->get(['_id'])->map(fn ($user) => Ids::object((string) $user->id))->all();
            $studentIds = Student::where(fn ($q) => $q->where('school_id_number', 'regex', $pattern)->orWhereIn('user_id', $userIds))->get(['_id'])->map(fn ($student) => Ids::object((string) $student->id))->all();
            $queue->whereIn('student_id', $studentIds);
        }
        if (! empty($filters['appointment_date'])) {
            $queue->where('scheduled_date', $filters['appointment_date']);
        }
        $appointments = $queue->latest()->paginate(10)->withQueryString();

        $users = User::where('role', 'counselor')->where('active', true)->orderBy('full_name')->get();
        $counselorIds = $users->map(fn ($user) => Ids::object((string) $user->id))->all();
        $schedulesMap = CounselorSchedule::whereIn('counselor_id', $counselorIds)->get()->keyBy(fn ($s) => (string) $s->counselor_id);

        $allAppointmentsSummary = Appointment::all(['status', 'counselor_id', 'urgency_level']);
        $activeAppointmentsSummary = $allAppointmentsSummary->whereIn('status', CounselorAvailability::ACTIVE_STATUSES);
        $activeSessionsByCounselor = $activeAppointmentsSummary
            ->filter(fn ($a) => ! empty($a->counselor_id))
            ->groupBy(fn ($a) => (string) $a->counselor_id)
            ->map->count();

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
            function ($appointment) use ($users, $availability, $schedules, $byCounselor, $schedulesMap) {
                // Operational lists do not need questionnaire answers or signatures.
                unset($appointment['initial_visit_questionnaire'], $appointment['signature']);
                if (in_array($appointment['status'], ['completed', 'cancelled', 'accepted', 'confirmed', 'counselor_accepted_pending_student'], true)) {
                    $appointment['assignment_options'] = [];

                    return $appointment;
                }
                $urgent = $appointment['urgency_level'] === 'urgent';
                $appointmentsByCounselor = $byCounselor;
                $appointment['assignment_options'] = $users->map(
                    function ($user) use ($appointment, $urgent, $availability, $schedules, $appointmentsByCounselor, $schedulesMap) {
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
                        $schedule = $schedulesMap->get((string) $user->id);
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
        $counselors = $users->map(function ($user) use ($dates, $availability, $schedules, $schedulesByCounselor, $byCounselor, $activeSessionsByCounselor) {
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
                'uses_default_schedule' => ! $schedule && ! is_array($user->counseling_schedule),
                'schedule' => $schedule ? [
                    'availability' => $schedule->availability ?? [],
                    'classSchedule' => $schedule->classSchedule ?? [],
                    'leaves' => collect($schedule->leaves ?? [])->map(fn ($leave) => [
                        'startDateTime' => $leave['startDateTime'],
                        'endDateTime' => $leave['endDateTime'],
                        'type' => $leave['type'],
                    ])->all(),
                ] : null,
                'active_sessions_count' => $activeSessionsByCounselor->get((string) $user->id, 0),
                'calendar' => $calendar,
            ];
        });

        return Inertia::render('Staff/WalkInQueue', [
            'appointments' => $appointments,
            'counselors' => $counselors,
            'colleges' => config('guidance.colleges', []),
            'filters' => ['stage' => $stage, 'tab' => $filters['tab'] ?? 'queue', 'search' => $filters['search'] ?? '', 'appointment_date' => $filters['appointment_date'] ?? ''],
            'calendar' => [
                'date' => $date->toDateString(),
                'view' => $view,
                'dates' => $dates,
                'today' => today()->toDateString(),
            ],
            'metrics' => [
                'queue_total' => $allAppointmentsSummary->count(),
                'unassigned_count' => $activeAppointmentsSummary->filter(fn ($a) => empty($a->counselor_id) || $a->status === 'reassignment_requested')->count(),
                'waiting_count' => $allAppointmentsSummary->filter(fn ($a) => ! empty($a->counselor_id) && in_array($a->status, ['assigned', 'assigned_pending_accept', 'assigned_pending_counselor', 'rescheduled'], true))->count(),
                'student_count' => $allAppointmentsSummary->where('status', 'counselor_accepted_pending_student')->count(),
                'confirmed_count' => $allAppointmentsSummary->whereIn('status', ['accepted', 'confirmed'])->count(),
                'completed_count' => $allAppointmentsSummary->where('status', 'completed')->count(),
                'cancelled_count' => $allAppointmentsSummary->where('status', 'cancelled')->count(),
                'urgent_count' => $activeAppointmentsSummary->where('urgency_level', 'urgent')->count(),
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
