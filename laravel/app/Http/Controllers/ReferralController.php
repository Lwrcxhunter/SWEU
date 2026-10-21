<?php

namespace App\Http\Controllers;

use App\Models\Referral;
use App\Models\Student;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReferralController extends Controller
{
    public function index(Request $request)
    {
        $isStaff = $request->user()->role === 'staff';
        $query = Referral::query();
        if (! $isStaff) {
            $query->where('referrer_id', Ids::object($request->user()->id));
        }

        return Inertia::render('Faculty/SubmitReferral', ['isStaff' => $isStaff,
            'referrals' => $query->latest()->paginate(15)->through(fn ($r) => [
                'id' => (string) $r->id, 'status' => $r->status, 'submitted_at' => $r->created_at->toIso8601String(),
                ...($isStaff ? ['student' => Views::student(Student::findOrFail($r->student_id)), 'reason' => $r->reason] : []),
            ])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['school_id_number' => 'required|string|max:20', 'reason' => 'required|string|max:3000']);
        $student = Student::where('school_id_number', $data['school_id_number'])->first();
        if (! $student) {
            throw ValidationException::withMessages(['school_id_number' => 'Unable to submit for that ID. Please contact the guidance office.']);
        }
        Referral::create(['referrer_id' => Ids::object($request->user()->id), 'student_id' => Ids::object($student->id),
            'reason' => $data['reason'], 'status' => 'submitted']);

        return back()->with('success', 'Referral submitted. You can track its status here; private counseling information is not shared.');
    }

    public function update(Request $request, string $referral)
    {
        $data = $request->validate(['status' => 'required|in:under_review,action_taken,closed', 'previous_status' => 'required|string']);
        $transitions = ['submitted' => 'under_review', 'under_review' => 'action_taken', 'action_taken' => 'closed'];
        if (($transitions[$data['previous_status']] ?? null) !== $data['status']) {
            abort(422, 'Invalid referral transition.');
        }
        $changed = Referral::where('_id', Ids::object($referral))->where('status', $data['previous_status'])->update(['status' => $data['status']]);
        if (! $changed) {
            throw ValidationException::withMessages(['status' => 'This referral changed. Refresh the page.']);
        }

        return back()->with('success', 'Referral status updated.');
    }
}
