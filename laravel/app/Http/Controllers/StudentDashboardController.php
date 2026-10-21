<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Referral;
use App\Models\Student;
use App\Models\TestingRequest;
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
                ->orWhere(fn ($today) => $today->where('scheduled_date', $clock->toDateString())->where('scheduled_time', '>=', $clock->format('H:i')));
        });
        $testing = [];
        foreach (['GAMA', 'Other'] as $type) {
            foreach (['pending', 'approved', 'completed'] as $status) {
                $testing[] = ['type' => $type, 'status' => $status, 'count' => $student
                    ? TestingRequest::where('student_id', $studentId)->where('test_type', $type)->where('status', $status)->count() : 0];
            }
        }
        $referrals = Referral::whereIn('status', ['submitted', 'under_review', 'action_taken'])
            ->where(function ($query) use ($userId, $studentId) {
                $query->where('referrer_id', $userId);
                if ($studentId) {
                    $query->orWhere('student_id', $studentId);
                }
            })->count();

        return Inertia::render('Student/Dashboard', [
            'student' => $student ? StudentInformation::forOwner($student) : null,
            'summary' => [
                'pending_appointments' => $student ? (clone $appointments)->whereIn('status', ['pending', 'assigned'])->count() : 0,
                'scheduled_appointments' => $student ? (clone $appointments)->where('status', 'accepted')->count() : 0,
                'active_referrals' => $referrals,
                'testing' => $testing,
            ],
        ]);
    }
}
