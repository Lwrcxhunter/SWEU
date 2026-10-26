<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\User;
use App\Services\CounselingCases;
use App\Services\CounselorSchedules;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SessionNoteController extends Controller
{
    private function appointment(Request $request, string $id): Appointment
    {
        $appointment = Appointment::findOrFail(Ids::object($id));
        abort_unless(Ids::same($request->user()->id, $appointment->counselor_id), 403);

        return $appointment;
    }

    public function dashboard(Request $request)
    {
        if ($this->wantsOnlyGlobalProps($request, 'Counselor/Dashboard', ['appointments', 'followups'])) {
            return Inertia::render('Counselor/Dashboard', []);
        }

        $id = Ids::object($request->user()->id);

        return Inertia::render('Counselor/Dashboard', [
            'appointments' => Views::appointments(Appointment::where('counselor_id', $id)->orderByDesc('scheduled_date')->paginate(15)),
            'followups' => CounselingSession::where('counselor_id', $id)->where('is_flagged_for_followup', true)
                ->orderBy('next_followup_date')->paginate(15, ['*'], 'followup_page')->through(fn ($s) => [
                    'appointment_id' => (string) $s->appointment_id, 'next_followup_date' => $s->next_followup_date,
                    'student' => Views::student(Student::findOrFail($s->student_id)),
                ]),
        ]);
    }

    public function operationalSessions()
    {
        $sessions = CounselingSession::orderByDesc('session_date')->paginate(30)->through(fn (CounselingSession $session) => [
            'status' => $session->status,
            'session_date' => $session->session_date,
            'time_slot' => $session->time_slot,
            'mode' => $session->mode,
            'is_follow_up' => (bool) $session->is_follow_up,
        ]);

        return response()->json(['sessions' => $sessions]);
    }

    public function show(Request $request, string $appointment)
    {
        $record = Appointment::findOrFail(Ids::object($appointment));
        abort_unless(
            $request->user()->role === 'counselor'
                && Ids::same($request->user()->id, $record->counselor_id)
                && $request->user()->checkPermissionTo('notes.manage'),
            403
        );
        $session = CounselingSession::where('appointment_id', Ids::object($appointment))->first();
        $case = ! empty($record->case_id)
            ? CounselingCase::find($record->case_id)
            : CounselingCase::where('appointment_id', Ids::object($appointment))->first();
        if (! $case && in_array($record->status, ['accepted', 'completed'], true)) {
            $case = app(CounselingCases::class)->createCaseFromAppointment($record);
        }
        $notes = null;
        if ($session) {
            Gate::authorize('view', $session);
            $notes = [
                'notes' => $session->encrypted_session_notes,
                'is_flagged_for_followup' => (bool) $session->is_flagged_for_followup,
                'next_followup_date' => $session->next_followup_date,
                'next_followup_time' => $session->next_followup_time,
                'version' => (int) $session->version,
            ];
        }

        return Inertia::render('Counselor/SessionNotes', [
            'appointment' => Views::appointment($record),
            'intake' => Student::findOrFail($record->student_id)->intake_record,
            'session' => $notes,
            'caseRecord' => $case ? $this->serializeCase($case) : null,
        ]);
    }

    public function caseDetails(Request $request, string $case)
    {
        $record = CounselingCase::findOrFail(Ids::object($case));
        $user = $request->user();
        abort_unless(
            $user->role === 'counselor'
                && Ids::same($user->id, $record->counselor_id)
                && $user->checkPermissionTo('notes.manage'),
            403
        );

        return response()->json([
            'case' => $this->serializeCase($record, false),
            'sessions' => $this->caseSessions($record),
        ]);
    }

    public function closeCase(Request $request, string $case)
    {
        $record = $this->caseForCounselor($request, $case);
        $result = DB::transaction(function () use ($record) {
            $record = CounselingCase::findOrFail(Ids::object($record->id));
            if ($record->status === 'closed') {
                return response()->json(['message' => 'This case is already closed.'], 409);
            }

            $session = CounselingSession::where('case_id', Ids::object($record->id))
                ->orderByDesc('session_number')
                ->first();
            if (! $session) {
                return response()->json(['message' => 'This case has no session to close.'], 409);
            }

            $now = now()->toDateTimeString();
            if (in_array($session->status, ['scheduled', 'in_progress'], true)) {
                $session->update(['status' => 'completed', 'completed_at' => $now]);
            }
            if ($session->status !== 'cancelled' && ($appointment = Appointment::find($session->appointment_id))) {
                $appointment->update([
                    'status' => 'completed',
                    'slot_key' => null,
                    'version' => (int) $appointment->version + 1,
                ]);
            }
            $record->update([
                'status' => 'closed',
                'closed_at' => $now,
                'closed_reason' => 'completed/stable',
                'outcome' => 'completed/stable',
            ]);

            return response()->json(['case' => $this->serializeCase($record->fresh(), false)]);
        });

        return $result;
    }

    public function scheduleFollowUp(Request $request, string $case, CounselorSchedules $schedules)
    {
        $data = $request->validate([
            'targetDate' => ['required', 'date_format:Y-m-d', 'after:today'],
            'timeSlot' => ['required', Rule::in(['AM', 'PM'])],
            'mode' => ['required', Rule::in(['F2F', 'Virtual'])],
        ]);
        $record = $this->caseForCounselor($request, $case);

        return DB::transaction(function () use ($record, $data, $schedules) {
            $case = CounselingCase::findOrFail(Ids::object($record->id));
            if ($case->status === 'closed') {
                return response()->json(['message' => 'A follow-up cannot be added to a closed case.'], 409);
            }

            $scheduledTime = $data['timeSlot'] === 'AM' ? '10:00' : '14:00';
            $channel = $data['mode'] === 'Virtual' ? 'online' : 'face_to_face';
            if (! $schedules->allowsAppointment((string) $case->counselor_id, [
                'scheduled_date' => $data['targetDate'],
                'scheduled_time' => $scheduledTime,
            ])) {
                return response()->json(['message' => 'That counselor is unavailable during the selected schedule or leave period.'], 409);
            }
            $slotKey = (string) $case->counselor_id.':'.$data['targetDate'].':'.$scheduledTime;
            if (Appointment::where('slot_key', $slotKey)->exists()) {
                return response()->json(['message' => 'That counselor slot is already reserved. Choose another date or time slot.'], 409);
            }

            $currentSession = CounselingSession::where('case_id', Ids::object($case->id))
                ->orderByDesc('session_number')
                ->first();
            if (! $currentSession) {
                return response()->json(['message' => 'This case has no session to follow up.'], 409);
            }

            $now = now()->toDateTimeString();
            if (in_array($currentSession->status, ['scheduled', 'in_progress'], true)) {
                $currentSession->update(['status' => 'completed', 'completed_at' => $now]);
                if ($currentAppointment = Appointment::find($currentSession->appointment_id)) {
                    $currentAppointment->update([
                        'status' => 'completed',
                        'slot_key' => null,
                        'version' => (int) $currentAppointment->version + 1,
                    ]);
                }
            } elseif (! in_array($currentSession->status, ['completed', 'cancelled'], true)) {
                return response()->json(['message' => 'The latest session cannot be followed up.'], 409);
            }

            $appointment = Appointment::create([
                'case_id' => Ids::object($case->id),
                'student_id' => Ids::object($case->student_id),
                'counselor_id' => Ids::object($case->counselor_id),
                'channel' => $channel,
                'type' => 'follow_up',
                'urgency_level' => 'normal',
                'scheduled_date' => $data['targetDate'],
                'scheduled_time' => $scheduledTime,
                'status' => 'counselor_accepted_pending_student',
                'version' => 1,
                'slot_key' => $slotKey,
                'counselor_accepted_at' => now()->toDateTimeString(),
                'student_accepted_at' => null,
                'initial_visit_questionnaire' => [
                    'reason' => 'Follow-up counseling session',
                    'expectations' => 'Continued guidance and progress review',
                ],
            ]);

            $case->increment('session_count');
            $case->update(['status' => 'follow_up']);
            $session = CounselingSession::create([
                'case_id' => Ids::object($case->id),
                'appointment_id' => Ids::object($appointment->id),
                'student_id' => Ids::object($case->student_id),
                'counselor_id' => Ids::object($case->counselor_id),
                'session_date' => $data['targetDate'],
                'time_slot' => $data['timeSlot'],
                'mode' => $data['mode'],
                'status' => 'scheduled',
                'is_follow_up' => true,
                'session_number' => (int) $case->fresh()->session_count,
                'version' => 0,
            ]);

            $student = Student::findOrFail($case->student_id);
            if ($student->user_id) {
                OfficeAlert::create([
                    'user_id' => Ids::object($student->user_id),
                    'appointment_id' => Ids::object($appointment->id),
                    'kind' => 'appointment',
                    'message' => "Your counselor scheduled a follow-up session for {$data['targetDate']}. Please review your appointments.",
                    'read_at' => null,
                ]);
            }

            return response()->json([
                'case' => $this->serializeCase($case->fresh(), false),
                'session' => $this->serializeSession($session),
            ], 201);
        });
    }

    private function caseForCounselor(Request $request, string $id): CounselingCase
    {
        $case = CounselingCase::findOrFail(Ids::object($id));
        abort_unless($request->user()->role === 'counselor'
            && Ids::same($request->user()->id, $case->counselor_id), 403);

        return $case;
    }

    private function serializeCase(CounselingCase $case, bool $includeSessions = true): array
    {
        $data = [
            'id' => (string) $case->id,
            'case_number' => $case->case_number,
            'category' => $case->category,
            'status' => $case->status,
            'opened_at' => $case->opened_at,
            'closed_at' => $case->closed_at,
            'closed_reason' => $case->closed_reason,
            'outcome' => $case->outcome,
            'session_count' => (int) $case->session_count,
        ];
        if ($includeSessions) {
            $data['sessions'] = $this->caseSessions($case);
        }

        return $data;
    }

    private function caseSessions(CounselingCase $case): array
    {
        return CounselingSession::where('case_id', Ids::object($case->id))
            ->orderBy('session_number')
            ->get()
            ->map(function (CounselingSession $session) {
                Gate::authorize('view', $session);

                return $this->serializeSession($session, true);
            })
            ->all();
    }

    private function serializeSession(CounselingSession $session, bool $includeNotes = false): array
    {
        $data = [
            'id' => (string) $session->id,
            'appointment_id' => (string) $session->appointment_id,
            'session_number' => (int) $session->session_number,
            'session_date' => $session->session_date,
            'time_slot' => $session->time_slot,
            'mode' => $session->mode,
            'status' => $session->status,
            'is_follow_up' => (bool) $session->is_follow_up,
        ];
        if ($includeNotes) {
            $data['notes'] = $session->encrypted_session_notes;
        }

        return $data;
    }

    public function store(Request $request, string $appointment, CounselorSchedules $schedules)
    {
        $data = $request->validate([
            'notes' => 'required|string|max:20000',
            'version' => 'required|integer|min:0',
            'is_flagged_for_followup' => 'required|boolean',
            'next_followup_date' => 'required_if:is_flagged_for_followup,true|nullable|date_format:Y-m-d|after_or_equal:today',
            'next_followup_time' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $appointment, $data, $schedules) {
            $record = $this->appointment($request, $appointment);
            $session = CounselingSession::where('appointment_id', Ids::object($appointment))->first();
            abort_unless($session || in_array($record->status, ['accepted', 'completed']), 422, 'Accept the appointment before saving session notes.');
            if ($session) {
                Gate::authorize('view', $session);
            }
            if ((int) ($session?->version ?? 0) !== (int) $data['version']) {
                throw ValidationException::withMessages(['notes' => 'These notes changed in another window. Reload before saving.']);
            }
            $session ??= new CounselingSession([
                'appointment_id' => Ids::object($appointment),
                'student_id' => $record->student_id,
                'counselor_id' => Ids::object($request->user()->id),
            ]);

            $followupDate = $data['is_flagged_for_followup'] ? $data['next_followup_date'] : null;
            $followupTime = $data['is_flagged_for_followup']
                ? (! empty($data['next_followup_time']) ? $data['next_followup_time'] : ($record->scheduled_time ?? '10:00'))
                : null;
            if ($followupDate && ! $schedules->allowsAppointment((string) $request->user()->id, [
                'scheduled_date' => $followupDate,
                'scheduled_time' => $followupTime,
            ])) {
                throw ValidationException::withMessages(['next_followup_time' => 'That counselor is unavailable during the selected schedule or leave period.']);
            }

            $session->fill([
                'encrypted_session_notes' => $data['notes'],
                'is_flagged_for_followup' => (bool) $data['is_flagged_for_followup'],
                'next_followup_date' => $followupDate,
                'next_followup_time' => $followupTime,
                'version' => $data['version'] + 1,
            ]);

            $counselorId = Ids::object($request->user()->id);
            $counselor = $request->user();

            if ($data['is_flagged_for_followup'] && $followupDate) {
                $targetSlot = (string) $counselorId.':'.$followupDate.':'.$followupTime;

                $existingFollowup = ! empty($session->followup_appointment_id)
                    ? Appointment::find($session->followup_appointment_id)
                    : null;

                if ($existingFollowup && ! in_array($existingFollowup->status, ['completed', 'cancelled'])) {
                    if (Appointment::where('slot_key', $targetSlot)->where('_id', '!=', $existingFollowup->_id)->exists()) {
                        throw ValidationException::withMessages(['next_followup_time' => 'That counselor slot is already reserved for another appointment.']);
                    }
                    $existingFollowup->update([
                        'scheduled_date' => $followupDate,
                        'scheduled_time' => $followupTime,
                        'slot_key' => $targetSlot,
                        'status' => 'counselor_accepted_pending_student',
                        'student_accepted_at' => null,
                        'counselor_accepted_at' => now()->toDateTimeString(),
                    ]);
                } else {
                    if (Appointment::where('slot_key', $targetSlot)->exists()) {
                        throw ValidationException::withMessages(['next_followup_time' => 'That counselor slot is already reserved for another appointment.']);
                    }

                    $newFollowup = Appointment::create([
                        'student_id' => $record->student_id,
                        'counselor_id' => $counselorId,
                        'channel' => $record->channel ?? 'face_to_face',
                        'type' => 'follow_up',
                        'urgency_level' => 'normal',
                        'scheduled_date' => $followupDate,
                        'scheduled_time' => $followupTime,
                        'status' => 'counselor_accepted_pending_student',
                        'version' => 1,
                        'slot_key' => $targetSlot,
                        'counselor_accepted_at' => now()->toDateTimeString(),
                        'student_accepted_at' => null,
                        'onboarding_note' => "Follow-up consultation scheduled with {$counselor->full_name}.",
                        'initial_visit_questionnaire' => [
                            'reason' => 'Follow-up counseling session',
                            'expectations' => 'Continued guidance and progress review',
                        ],
                    ]);

                    $session->followup_appointment_id = Ids::object($newFollowup->id);

                    $student = Student::find($record->student_id);
                    if ($student && $student->user_id) {
                        $studentUser = User::find($student->user_id);
                        if ($studentUser) {
                            OfficeAlert::create([
                                'user_id' => Ids::object($studentUser->id),
                                'appointment_id' => Ids::object($newFollowup->id),
                                'kind' => 'appointment',
                                'message' => "Your counselor {$counselor->full_name} scheduled a follow-up session for {$followupDate} at {$followupTime}. Please review and confirm your schedule.",
                                'read_at' => null,
                            ]);
                        }
                    }
                }
            } elseif (! $data['is_flagged_for_followup'] && ! empty($session->followup_appointment_id)) {
                $existingFollowup = Appointment::find($session->followup_appointment_id);
                if ($existingFollowup && in_array($existingFollowup->status, [
                    'assigned',
                    'assigned_pending_accept',
                    'counselor_accepted_pending_student',
                ], true)) {
                    $existingFollowup->update(['status' => 'cancelled', 'slot_key' => null]);
                }
                $session->followup_appointment_id = null;
            }

            $session->save();
            $record->increment('version');
        });

        return back()->with('success', 'Private session notes and follow-up appointment saved.');
    }
}
