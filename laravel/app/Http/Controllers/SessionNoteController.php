<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\User;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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

    public function show(Request $request, string $appointment)
    {
        $record = $this->appointment($request, $appointment);
        $session = CounselingSession::where('appointment_id', Ids::object($appointment))->first();
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
        ]);
    }

    public function store(Request $request, string $appointment)
    {
        $data = $request->validate([
            'notes' => 'required|string|max:20000',
            'version' => 'required|integer|min:0',
            'is_flagged_for_followup' => 'required|boolean',
            'next_followup_date' => 'required_if:is_flagged_for_followup,true|nullable|date_format:Y-m-d|after_or_equal:today',
            'next_followup_time' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $appointment, $data) {
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
                        'status' => 'assigned_pending_accept',
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
                        'status' => 'assigned_pending_accept',
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
                if ($existingFollowup && in_array($existingFollowup->status, ['assigned', 'assigned_pending_accept'])) {
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
