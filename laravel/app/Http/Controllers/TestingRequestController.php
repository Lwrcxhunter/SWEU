<?php

namespace App\Http\Controllers;

use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
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
        $user = $request->user();
        $isStaff = $user->role === 'staff';
        $student = $isStaff ? null : Student::where('user_id', Ids::object($user->id))->first();

        $query = TestingRequest::query();
        if (! $isStaff) {
            $query->where(function ($q) use ($student, $user) {
                if ($student) {
                    $q->where('student_id', Ids::object($student->id));
                }
                $q->orWhere('requester_user_id', Ids::object($user->id));
            });
        }

        return Inertia::render('Student/RequestTesting', [
            'isStaff' => $isStaff,
            'colleges' => config('guidance.colleges', []),
            'programs' => config('guidance.programs', []),
            'requests' => $query->latest()->paginate(15)->through(function ($t) use ($isStaff) {
                $st = ($t->student_id) ? Student::find($t->student_id) : null;
                $reqName = $t->requester_name;
                if (! $reqName && $st) {
                    $reqName = Views::student($st)['full_name'];
                }

                return [
                    'id' => (string) $t->id,
                    'test_type' => $t->test_type,
                    'details' => $t->details ?? '',
                    'purpose' => $t->purpose ?? 'Pre-Internship Evaluation',
                    'requester_name' => $reqName ?? 'Department Coordinator',
                    'requester_position' => $t->requester_position ?? 'Department Internship Coordinator',
                    'college' => $t->college ?? ($st?->college ?? null),
                    'program' => $t->program ?? null,
                    'year_level' => $t->year_level ?? ($st?->year_level ?? '4th Year'),
                    'student_count' => (int) ($t->student_count ?? 1),
                    'preferred_date' => $t->preferred_date ?? null,
                    'preferred_session' => $t->preferred_session ?? 'AM',
                    'status' => $t->status,
                    'requested_at' => $t->requested_at ? ($t->requested_at instanceof \DateTimeInterface ? $t->requested_at->format('M d, Y') : (string) $t->requested_at) : null,
                    ...($isStaff && $st ? ['student' => Views::student($st)] : []),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'test_type' => 'required|string',
            'details' => 'required_if:test_type,Other|nullable|string|max:1000',
            'requester_name' => 'nullable|string|max:150',
            'requester_position' => 'nullable|string|max:100',
            'college' => 'nullable|string|max:50',
            'program' => 'nullable|string|max:150',
            'year_level' => 'nullable|string|max:50',
            'student_count' => 'nullable|integer|min:1|max:1000',
            'purpose' => 'nullable|string|max:255',
            'preferred_date' => 'nullable|date',
            'preferred_session' => 'nullable|in:AM,PM,Whole Day',
        ]);

        $user = $request->user();
        $student = null;
        if ($user->role === 'student') {
            $student = Student::where('user_id', Ids::object($user->id))->first();
            if (! $student) {
                $student = IntakeFormController::student($request);
            }
        }

        $testingRecord = TestingRequest::create([
            'student_id' => $student ? Ids::object($student->id) : null,
            'requester_user_id' => Ids::object($user->id),
            'requester_name' => $data['requester_name'] ?? $user->full_name,
            'requester_position' => $data['requester_position'] ?? ($user->role === 'faculty' ? 'Department Internship Coordinator' : 'Academic Coordinator'),
            'requester_email' => $user->email,
            'college' => $data['college'] ?? ($student?->college ?? 'COT'),
            'program' => $data['program'] ?? 'Internship Cohort',
            'year_level' => $data['year_level'] ?? ($student?->year_level ?? '4th Year'),
            'student_count' => (int) ($data['student_count'] ?? 1),
            'purpose' => $data['purpose'] ?? 'Pre-internship / Practicum assessment',
            'preferred_date' => $data['preferred_date'] ?? today()->addDays(7)->toDateString(),
            'preferred_session' => $data['preferred_session'] ?? 'AM',
            'test_type' => $data['test_type'],
            'details' => $data['details'] ?? '',
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        foreach (User::where('role', 'staff')->where('active', true)->get() as $staffUser) {
            OfficeAlert::create([
                'user_id' => $staffUser->id,
                'testing_request_id' => Ids::object($testingRecord->id),
                'kind' => 'testing',
                'message' => 'New testing request: '.($testingRecord->test_type).' for '.($testingRecord->student_count).' student(s) requested by '.($testingRecord->requester_name).'.',
                'read_at' => null,
            ]);
        }

        return back()->with('success', 'Testing request submitted to the psychometrician.');
    }

    public function update(Request $request, string $testing)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,completed',
            'previous_status' => 'required|string',
        ]);

        if ((['pending' => 'approved', 'approved' => 'completed'][$data['previous_status']] ?? null) !== $data['status']) {
            abort(422);
        }

        DB::transaction(function () use ($testing, $data) {
            $record = TestingRequest::findOrFail(Ids::object($testing));
            $changed = TestingRequest::where('_id', Ids::object($record->id))
                ->where('status', $data['previous_status'])
                ->update(['status' => $data['status']]);

            if (! $changed) {
                throw ValidationException::withMessages(['status' => 'This request changed. Refresh the page.']);
            }

            if ($record->student_id && ($student = Student::find($record->student_id))) {
                OfficeAlert::create([
                    'user_id' => $student->user_id,
                    'testing_request_id' => Ids::object($record->id),
                    'kind' => 'testing',
                    'message' => 'Your '.$record->test_type.' testing request is now '.$data['status'].'. Open psychological testing for details.',
                    'read_at' => null,
                ]);
            }

            if ($record->requester_user_id) {
                OfficeAlert::create([
                    'user_id' => $record->requester_user_id,
                    'testing_request_id' => Ids::object($record->id),
                    'kind' => 'testing',
                    'message' => 'The testing request for '.$record->test_type.' ('.$record->purpose.') is now '.$data['status'].'.',
                    'read_at' => null,
                ]);
            }
        });

        return back()->with('success', 'Testing status updated.');
    }
}
