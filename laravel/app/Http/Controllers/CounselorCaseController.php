<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\CounselorSchedule;
use App\Models\Student;
use App\Models\User;
use App\Services\CounselorAvailability;
use App\Support\Ids;
use App\Support\Views;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use MongoDB\BSON\UTCDateTime;

class CounselorCaseController extends Controller
{
    public function index(Request $request, CounselorAvailability $availability)
    {
        $request->validate([
            'start' => ['nullable', 'date_format:Y-m-d'],
            'end' => ['nullable', 'date_format:Y-m-d', 'after:start'],
        ]);
        $start = CarbonImmutable::parse($request->input('start', today()->startOfMonth()->startOfWeek(0)->toDateString()));
        $end = CarbonImmutable::parse($request->input('end', $start->addDays(42)->toDateString()));
        abort_if($start->diffInDays($end) > 42, 422, 'Choose a calendar range of up to 42 days.');
        $counselorId = Ids::object($request->user()->id);
        $cases = CounselingCase::where('counselor_id', $counselorId)
            ->orderByDesc('opened_at')
            ->paginate(20);
        $caseRecords = collect($cases->items());
        $students = Student::whereIn('_id', $caseRecords->pluck('student_id')->filter()->unique()->values()->all())
            ->get()
            ->keyBy(fn (Student $student) => (string) $student->id);
        $studentUsers = User::whereIn(
            '_id',
            $students->pluck('user_id')->filter()->unique()->values()->all(),
        )->get()->keyBy(fn (User $user) => (string) $user->id);

        $cases->through(function (CounselingCase $case) use ($students, $studentUsers) {
            $student = $students->get((string) $case->student_id);
            $studentUser = $student?->user_id ? $studentUsers->get((string) $student->user_id) : null;

            return [
                'id' => (string) $case->id,
                'case_number' => $case->case_number,
                'category' => $case->category,
                'status' => $case->status,
                'opened_at' => $case->opened_at,
                'session_count' => (int) $case->session_count,
                'student_name' => $studentUser?->full_name ?? 'Unavailable account',
                'student_id_number' => $student?->school_id_number,
            ];
        });

        $appointments = Appointment::where('counselor_id', $counselorId)
            ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
            ->whereBetween('scheduled_date', [
                $start->toDateString(),
                $end->subDay()->toDateString(),
            ])
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();

        $appointmentViews = collect(Views::appointments($appointments->all()))
            ->map(fn (array $appointment) => [
                'id' => $appointment['id'],
                'case_id' => $appointment['case_id'],
                'student_name' => $appointment['student']['full_name'] ?? 'Unavailable account',
                'scheduled_date' => $appointment['scheduled_date'],
                'scheduled_time' => $appointment['scheduled_time'],
                'type' => $appointment['type'],
                'status' => $appointment['status'],
            ])
            ->values()
            ->all();

        $availableSlots = [];
        $counselor = $request->user();
        $counselor->setRelation('availabilitySchedule', CounselorSchedule::where('counselor_id', $counselorId)->first());
        for ($date = $start; $date->lt($end); $date = $date->addDay()) {
            if ($date->lt(CarbonImmutable::today())) {
                continue;
            }
            foreach ($availability->day($counselor, $date->toDateString(), $appointments) as $blocks) {
                foreach ($blocks as $block) {
                    if ($block['available']) {
                        $availableSlots[] = [
                            'start' => $date->toDateString().'T'.$block['start'],
                            'end' => $date->toDateString().'T'.$block['end'],
                        ];
                    }
                }
            }
        }

        $history = null;
        if ($request->input('tab') === 'history') {
            $history = Appointment::where('counselor_id', $counselorId)
                ->where(function ($query) {
                    $query->where('scheduled_date', '<', today()->toDateString())
                        ->orWhereNotIn('status', CounselorAvailability::ACTIVE_STATUSES);
                })
                ->orderByDesc('scheduled_date')->orderByDesc('scheduled_time')
                ->paginate(20, ['*'], 'history_page')->withQueryString();
            $history->setCollection(collect(Views::appointments($history->items()))->map(fn (array $appointment) => [
                'id' => $appointment['id'],
                'case_id' => $appointment['case_id'],
                'student' => ['full_name' => $appointment['student']['full_name'] ?? 'Unavailable account'],
                'scheduled_date' => $appointment['scheduled_date'],
                'scheduled_time' => $appointment['scheduled_time'],
                'type' => $appointment['type'],
                'status' => $appointment['status'],
            ]));
        }

        $caseStatusCounts = CounselingCase::where('counselor_id', $counselorId)
            ->get(['status'])
            ->countBy('status')
            ->all();

        return Inertia::render('Counselor/Cases', [
            'cases' => $cases,
            'appointments' => $appointmentViews,
            'availableSlots' => $availableSlots,
            'calendarRange' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'history' => $history,
            'caseStatusCounts' => $caseStatusCounts,
            'tab' => in_array($request->string('tab')->toString(), ['schedule', 'history', 'ongoing', 'hold', 'closed'], true)
                ? $request->string('tab')->toString()
                : 'schedule',
        ]);
    }

    public function show(Request $request, string $case)
    {
        $record = $this->caseForCounselor($request, $case);
        $student = Student::findOrFail($record->student_id);
        $studentUser = $student->user_id ? User::find($student->user_id) : null;
        $initialAppointment = $record->appointment_id
            ? Appointment::find($record->appointment_id)
            : null;
        $intakeSubmittedAt = $student->intake_record['submitted_at'] ?? null;
        $signedAt = $initialAppointment?->signed_at;
        if ($signedAt instanceof UTCDateTime) {
            $intakeSubmittedAt = $signedAt->toDateTime()
                ->setTimezone(new \DateTimeZone(config('app.timezone')))
                ->format('Y-m-d H:i');
        } elseif ($signedAt instanceof \DateTimeInterface) {
            $intakeSubmittedAt = $signedAt
                ->setTimezone(new \DateTimeZone(config('app.timezone')))
                ->format('Y-m-d H:i');
        } elseif (is_string($signedAt)) {
            $intakeSubmittedAt = $signedAt;
        }
        $sessionRecords = CounselingSession::where('case_id', Ids::object($record->id))
            ->orderByDesc('session_date')
            ->orderByDesc('session_number')
            ->get();
        $appointments = Appointment::whereIn(
            '_id',
            $sessionRecords->pluck('appointment_id')->filter()->unique()->values()->all(),
        )->get()->keyBy(fn (Appointment $appointment) => (string) $appointment->id);
        $sessions = $sessionRecords->map(fn (CounselingSession $session) => [
            'id' => (string) $session->id,
            'appointment_id' => (string) $session->appointment_id,
            'session_number' => (int) $session->session_number,
            'session_date' => $session->session_date,
            'scheduled_time' => $appointments->get((string) $session->appointment_id)?->scheduled_time,
            'time_slot' => $session->time_slot,
            'mode' => $session->mode,
            'status' => $session->status,
            'is_follow_up' => (bool) $session->is_follow_up,
        ])
            ->values();

        return Inertia::render('Counselor/CaseDetail', [
            'caseRecord' => [
                'id' => (string) $record->id,
                'case_number' => $record->case_number,
                'category' => $record->category,
                'status' => $record->status,
                'opened_at' => $record->opened_at,
                'closed_at' => $record->closed_at,
                'closed_by' => $record->closed_by ? (string) $record->closed_by : null,
                'closed_reason' => $record->closed_reason,
                'outcome' => $record->outcome,
                'session_count' => (int) $record->session_count,
            ],
            'student' => [
                'name' => $studentUser?->full_name ?? 'Unavailable account',
                'school_id_number' => $student->school_id_number,
                'college' => $student->college,
                'year_level' => $student->year_level,
            ],
            'intake' => collect($student->intake_record ?? [])->only([
                'living_condition',
                'personal_concerns',
                'referred_by',
                'submitted_at',
            ])->all(),
            'initialAppointmentId' => $initialAppointment ? (string) $initialAppointment->id : null,
            'intakeSubmittedAt' => $intakeSubmittedAt,
            'sessions' => $sessions,
        ]);
    }

    public function followUpSlots(Request $request, string $case, CounselorAvailability $availability)
    {
        $request->validate([
            'date' => ['required', 'date_format:Y-m-d', 'after:today'],
        ]);
        $record = $this->caseForCounselor($request, $case);
        abort_if($record->status === 'closed', 409, 'A follow-up cannot be added to a closed case.');

        $counselor = $request->user();
        $bookings = Appointment::where('counselor_id', Ids::object($counselor->id))
            ->where('scheduled_date', $request->string('date')->toString())
            ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
            ->get(['_id', 'counselor_id', 'scheduled_date', 'scheduled_time', 'status']);
        $times = array_merge($availability->times('AM'), $availability->times('PM'));
        $slots = collect($times)
            ->filter(fn (string $time) => $availability->check(
                $counselor,
                $request->string('date')->toString(),
                $time,
                null,
                $bookings,
            )['available'])
            ->values()
            ->all();

        return response()->json(['slots' => $slots]);
    }

    private function caseForCounselor(Request $request, string $id): CounselingCase
    {
        $case = CounselingCase::findOrFail(Ids::object($id));
        abort_unless(
            $request->user()->role === 'counselor'
                && $request->user()->checkPermissionTo('notes.manage')
                && Ids::same($request->user()->id, $case->counselor_id),
            403,
        );

        return $case;
    }
}
