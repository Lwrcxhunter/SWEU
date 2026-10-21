<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Student;
use App\Models\User;
use App\Services\Appointments;
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
            'accepted',
            'rescheduled',
        ];

        $appointments = Appointment::whereIn('status', $activeStatuses)
            ->orderByDesc('urgency_level')
            ->oldest()
            ->paginate(20);

        $counselors = User::where('role', 'counselor')
            ->where('active', true)
            ->get()
            ->map(function ($u) {
                $userView = Views::user($u);
                $userView['active_sessions_count'] = Appointment::where('counselor_id', $u->id)
                    ->whereIn('status', ['assigned', 'assigned_pending_accept', 'accepted'])
                    ->count();

                return $userView;
            });

        $onDutyCounselors = User::where('role', 'counselor')->where('active', true)->where('on_duty', true)->count();
        $availableCounselors = User::where('role', 'counselor')->where('active', true)->where('available', true)->count();
        $totalCounselors = User::where('role', 'counselor')->where('active', true)->count();

        $metrics = [
            'queue_total' => Appointment::whereIn('status', $activeStatuses)->count(),
            'urgent_count' => Appointment::whereIn('status', $activeStatuses)->where('urgency_level', 'urgent')->count(),
            'pending_referrals_count' => \App\Models\Referral::where('status', 'submitted')->count(),
            'open_testing_count' => \App\Models\TestingRequest::where('status', 'pending')->count(),
            'counselors_on_duty' => $onDutyCounselors,
            'counselors_available' => $availableCounselors,
            'counselors_total' => $totalCounselors,
        ];

        return Inertia::render('Staff/WalkInQueue', [
            'appointments' => Views::appointments($appointments),
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
