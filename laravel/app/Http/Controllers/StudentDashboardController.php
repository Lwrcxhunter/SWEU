<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Student;
use App\Services\Appointments;
use App\Support\Ids;
use App\Support\StudentInformation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $userId = Ids::object($request->user()->id);
        $student = Student::where('user_id', $userId)->first();
        $studentId = $student ? Ids::object($student->id) : null;
        $clock = now();
        $appointments = Appointment::where('student_id', $studentId)->where(function ($query) use ($clock) {
            $query->where('scheduled_date', '>', $clock->toDateString())
                ->orWhere(fn ($today) => $today->where('scheduled_date', $clock->toDateString())
                    ->where(fn ($time) => $time->whereNull('scheduled_time')->orWhere('scheduled_time', '>=', $clock->format('H:i'))));
        });

        return Inertia::render('Student/Dashboard', [
            'student' => $student ? StudentInformation::forOwner($student) : null,
            'followUps' => Appointments::pendingFollowUps($student),
            'summary' => [
                'pending_appointments' => $student ? (clone $appointments)->whereIn('status', ['pending', 'assigned', 'pending_assignment', 'assigned_pending_counselor', 'counselor_accepted_pending_student', 'reassignment_requested', 'rescheduled', 'assigned_pending_accept'])->count() : 0,
                'scheduled_appointments' => $student ? (clone $appointments)->whereIn('status', ['accepted', 'confirmed'])->count() : 0,
            ],
        ]);
    }
}
