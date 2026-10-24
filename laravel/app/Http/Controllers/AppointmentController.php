<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppointmentRequest;
use App\Models\Appointment;
use App\Models\Student;
use App\Models\User;
use App\Services\Appointments;
use App\Services\PdfApiService;
use App\Support\Ids;
use App\Support\StudentInformation;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();
        $appointments = $student ? Views::appointments(Appointment::where('student_id', Ids::object($student->id))->latest()->paginate(15)) : null;

        return Inertia::render('Student/BookAppointment', ['appointments' => $appointments, 'hasIntake' => (bool) $student]);
    }

    public function wizard(Request $request)
    {
        $student = Student::where('user_id', Ids::object($request->user()->id))->first();
        if (! $student || ! ($student->intake_record['signed_agreement'] ?? false)) {
            return to_route('personal-information.edit')->with('warning', 'Please complete your personal information first.');
        }

        return Inertia::render('Student/AppointmentWizard', [
            'student' => StudentInformation::forOwner($student),
            'colleges' => config('guidance.colleges'),
            'programs' => config('guidance.programs'),
        ]);
    }

    public function store(AppointmentRequest $request, Appointments $service)
    {
        $appointment = $service->book(IntakeFormController::student($request), $request->validated());

        return to_route('appointments.index')->with('success', 'Your appointment request has been submitted. Awaiting SWEU staff assignment.');
    }

    public function walkIn(Request $request, Appointments $service)
    {
        $service->walkIn(IntakeFormController::student($request));

        return back()->with('success', 'You have joined the walk-in queue. Please check in with the front desk. Sign out when leaving this terminal.');
    }

    public function update(Request $request, string $appointment, Appointments $service)
    {
        $data = $request->validate([
            'action' => 'required|in:assign,urgent,accept,counselor_accept,student_confirm,request_reassignment,reschedule,complete,cancel',
            'version' => 'required|integer|min:1',
            'counselor_id' => 'required_if:action,assign|nullable|string|regex:/^[a-f0-9]{24}$/i',
            'onboarding_note' => 'nullable|string|max:500',
            'note' => 'required_if:action,request_reassignment|nullable|string|max:1000',
            'scheduled_date' => 'required_if:action,reschedule|nullable|date_format:Y-m-d|after_or_equal:today',
            'scheduled_time' => ['required_if:action,reschedule', 'nullable', 'date_format:H:i', 'regex:/^\d{2}:(00|30)$/'],
        ]);
        if ($data['action'] === 'reschedule' && now()->format('Y-m-d H:i') >= $data['scheduled_date'].' '.$data['scheduled_time']) {
            throw ValidationException::withMessages(['scheduled_time' => 'Choose a future time.']);
        }
        $service->change($appointment, $request->user(), $data);

        return back()->with('success', 'Appointment updated.');
    }

    public function exportPdf(Request $request, string $appointment, PdfApiService $pdfService)
    {
        $record = Appointment::findOrFail(Ids::object($appointment));
        $student = Student::findOrFail($record->student_id);
        $user = $request->user();

        $isStudentOwner = $user->role === 'student' && Ids::same($user->id, $student->user_id);
        $isAssignedCounselor = $user->role === 'counselor' && Ids::same($user->id, $record->counselor_id);
        $isStaffOrAdmin = in_array($user->role, ['staff', 'admin']);

        abort_unless($isStudentOwner || $isAssignedCounselor || $isStaffOrAdmin, 403);

        $studentInfo = StudentInformation::forOwner($student);
        $counselor = $record->counselor_id ? User::find($record->counselor_id) : null;

        $html = view('pdf.counseling_intake_form', [
            'appointment' => $record,
            'student' => $student,
            'studentInfo' => $studentInfo,
            'counselor' => $counselor,
            'user' => User::find($student->user_id),
        ])->render();

        return $pdfService->generateFromHtml($html, "BukSU_Counseling_Intake_{$record->id}.pdf");
    }
}
