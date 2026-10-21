<?php

namespace App\Http\Controllers;

use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TestingRequestController extends Controller
{
    public function index(Request $request)
    {
        $isStaff = $request->user()->role === 'staff';
        $student = $isStaff ? null : Student::where('user_id', Ids::object($request->user()->id))->first();
        $query = TestingRequest::query();
        if (! $isStaff) {
            $query->where('student_id', $student ? Ids::object($student->id) : null);
        }

        return Inertia::render('Student/RequestTesting', ['isStaff' => $isStaff,
            'requests' => $query->latest()->paginate(15)->through(fn ($t) => [
                'id' => (string) $t->id, 'test_type' => $t->test_type, 'details' => $t->details, 'status' => $t->status,
                ...($isStaff ? ['student' => Views::student(Student::findOrFail($t->student_id))] : []),
            ])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['test_type' => 'required|in:GAMA,Other', 'details' => 'required_if:test_type,Other|nullable|string|max:500']);
        $student = IntakeFormController::student($request);
        TestingRequest::create(['student_id' => Ids::object($student->id), 'test_type' => $data['test_type'],
            'details' => $data['details'] ?? '', 'status' => 'pending', 'requested_at' => now()]);

        return back()->with('success', 'Testing request submitted to the psychometrician.');
    }

    public function update(Request $request, string $testing)
    {
        $data = $request->validate(['status' => 'required|in:approved,completed', 'previous_status' => 'required|string']);
        if ((['pending' => 'approved', 'approved' => 'completed'][$data['previous_status']] ?? null) !== $data['status']) {
            abort(422);
        }
        DB::transaction(function () use ($testing, $data) {
            $record = TestingRequest::findOrFail(Ids::object($testing));
            $changed = TestingRequest::where('_id', Ids::object($record->id))->where('status', $data['previous_status'])->update(['status' => $data['status']]);
            if (! $changed) {
                throw ValidationException::withMessages(['status' => 'This request changed. Refresh the page.']);
            }
            $student = Student::findOrFail($record->student_id);
            OfficeAlert::create(['user_id' => $student->user_id, 'testing_request_id' => Ids::object($record->id),
                'kind' => 'testing', 'message' => 'Your '.$record->test_type.' testing request is now '.$data['status'].'. Open psychological testing for details.',
                'read_at' => null]);
        });

        return back()->with('success', 'Testing status updated.');
    }
}
