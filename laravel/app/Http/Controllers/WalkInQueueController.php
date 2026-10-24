<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselorSchedule;
use App\Models\Referral;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
use App\Services\Appointments;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WalkInQueueController extends Controller
{
    public function index()
    {
        $activeStatuses = [
            'pending',
            'pending_assignment',
            'assigned',
            'assigned_pending_accept',
            'assigned_pending_counselor',
            'counselor_accepted_pending_student',
            'reassignment_requested',
            'accepted',
            'confirmed',
            'rescheduled',
        ];

        $appointments = Appointment::whereIn('status', $activeStatuses)
            ->orderByDesc('urgency_level')
            ->oldest()
            ->paginate(20);

        $counselorRecords = User::where('role', 'counselor')
            ->where('active', true)
            ->get();
        $schedules = CounselorSchedule::whereIn(
            'counselor_id',
            $counselorRecords->map(fn ($user) => Ids::object($user->id))->all(),
        )->get()->keyBy(fn ($schedule) => (string) $schedule->counselor_id);
        $counselors = $counselorRecords->map(function ($u) use ($schedules) {
            $userView = Views::user($u);
            $schedule = $schedules->get((string) $u->id);
            $userView['schedule'] = $schedule ? [
                'availability' => $schedule->availability ?? [],
                'classSchedule' => $schedule->classSchedule ?? [],
                'leaves' => collect($schedule->leaves ?? [])->map(fn ($leave) => [
                    'startDateTime' => $leave['startDateTime'],
                    'endDateTime' => $leave['endDateTime'],
                    'type' => $leave['type'],
                ])->all(),
            ] : null;
            $userView['active_sessions_count'] = Appointment::where('counselor_id', $u->id)
                ->whereIn('status', [
                    'assigned', 'assigned_pending_accept', 'assigned_pending_counselor',
                    'counselor_accepted_pending_student', 'reassignment_requested',
                    'accepted', 'confirmed',
                ])
                ->count();

            return $userView;
        });

        $onDutyCounselors = User::where('role', 'counselor')->where('active', true)->where('on_duty', true)->count();
        $availableCounselors = User::where('role', 'counselor')->where('active', true)->where('available', true)->count();
        $totalCounselors = User::where('role', 'counselor')->where('active', true)->count();

        $metrics = [
            'queue_total' => Appointment::whereIn('status', $activeStatuses)->count(),
            'urgent_count' => Appointment::whereIn('status', $activeStatuses)->where('urgency_level', 'urgent')->count(),
            'pending_referrals_count' => Referral::where('status', 'submitted')->count(),
            'open_testing_count' => TestingRequest::where('status', 'pending')->count(),
            'counselors_on_duty' => $onDutyCounselors,
            'counselors_available' => $availableCounselors,
            'counselors_total' => $totalCounselors,
        ];

        return Inertia::render('Staff/WalkInQueue', [
            'appointments' => Views::appointments($appointments, true),
            'counselors' => $counselors,
            'metrics' => $metrics,
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
