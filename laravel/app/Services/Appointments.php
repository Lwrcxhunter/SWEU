<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\User;
use App\Support\Ids;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use MongoDB\BSON\UTCDateTime;

class Appointments
{
    public function __construct(
        private readonly CounselingCases $cases,
        private readonly CounselorSchedules $schedules,
        private readonly CounselorAvailability $availability,
    ) {}

    public function book(Student $student, array $data): Appointment
    {
        return DB::transaction(function () use ($student, $data) {
            $sigInput = $data['signature'] ?? $data['signature_data'] ?? null;
            $signature = null;
            if (! empty($sigInput)) {
                if (is_array($sigInput)) {
                    $signature = $sigInput;
                } else {
                    $signature = [
                        'type' => str_starts_with($sigInput, 'data:') ? 'drawn' : 'typed',
                        'data' => $sigInput,
                    ];
                }
            }

            $appointment = Appointment::create([
                'student_id' => Ids::object($student->id),
                'counselor_id' => null,
                'channel' => $data['channel'] ?? 'face_to_face',
                'type' => 'online_booking',
                'urgency_level' => 'normal',
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time' => $data['scheduled_time'] ?? null,
                'preferred_period' => $data['preferred_period'] ?? null,
                'status' => 'pending_assignment',
                'version' => 1,
                'slot_key' => null,
                'initial_visit_questionnaire' => [
                    'reason' => $data['reason'] ?? '',
                    'expectations' => $data['expectations'] ?? '',
                    'average_sleep' => $data['average_sleep'] ?? '',
                    'prior_consultation' => (bool) ($data['prior_consultation'] ?? false),
                    'prior_consultation_details' => $data['prior_consultation_details'] ?? null,
                    'additional_comments' => $data['additional_comments'] ?? null,
                ],
                'signature' => $signature,
                'signed_at' => ! empty($signature) ? new UTCDateTime(now()) : null,
            ]);

            foreach (User::where('role', 'staff')->where('active', true)->get() as $staffUser) {
                $this->alert($staffUser, $appointment, 'appointment', 'A new appointment request is pending counselor assignment.');
            }

            return $appointment;
        });
    }

    public function walkIn(Student $student): Appointment
    {
        // Normal walk-ins share the same slot boundaries as online bookings.
        $time = now();
        $slot = $time->copy()->startOfHour()->addMinutes($time->minute < 30 ? 30 : 60);

        return Appointment::create([
            'student_id' => Ids::object($student->id), 'counselor_id' => null,
            'channel' => 'face_to_face', 'type' => 'walk_in', 'urgency_level' => 'normal',
            'scheduled_date' => $slot->toDateString(), 'scheduled_time' => $slot->format('H:i'),
            'status' => 'pending_assignment', 'version' => 1,
        ]);
    }

    public function change(string $id, User $actor, array $data): void
    {
        DB::transaction(function () use ($id, $actor, $data) {
            $appointment = Appointment::findOrFail(Ids::object($id));
            $student = Student::findOrFail($appointment->student_id);

            $isStaff = $actor->role === 'staff';
            $isCounselor = $actor->role === 'counselor' && Ids::same($actor->id, $appointment->counselor_id);
            $isStudent = $actor->role === 'student' && Ids::same($actor->id, $student->user_id);

            abort_unless($isStaff || $isCounselor || $isStudent, 403);

            if ((int) $appointment->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['action' => 'This appointment changed. Refresh before trying again.']);
            }
            $action = $data['action'];
            if (in_array($appointment->status, ['completed', 'cancelled'])) {
                throw ValidationException::withMessages(['action' => 'This appointment is already closed.']);
            }
            if ($action === 'urgent') {
                abort_unless($isStaff && $appointment->type === 'walk_in', 403);
                $appointment->urgency_level = 'urgent';
                foreach (User::where('role', 'counselor')->where('active', true)->where('on_duty', true)->where('available', true)->get() as $user) {
                    $this->alert($user, $appointment, 'urgent', 'An urgent walk-in needs immediate front-desk coordination.');
                }
            } elseif ($action === 'assign') {
                abort_unless($isStaff, 403);
                if (in_array($appointment->status, ['accepted', 'confirmed', 'completed', 'cancelled', 'counselor_accepted_pending_student'])
                    || (CounselingSession::where('appointment_id', Ids::object($appointment->id))->exists()
                        && $appointment->status !== 'reassignment_requested')) {
                    throw ValidationException::withMessages(['action' => 'An accepted appointment or a session with clinical notes cannot be reassigned.']);
                }
                $counselor = User::findOrFail(Ids::object($data['counselor_id']));
                $urgent = $appointment->urgency_level === 'urgent';
                if ($counselor->role !== 'counselor' || ! $counselor->active || ! $counselor->available
                    || ($urgent && ! $counselor->on_duty)) {
                    throw ValidationException::withMessages(['counselor_id' => 'Choose an available counselor (must be on-duty for urgent cases).']);
                }
                $scheduledDate = $urgent ? today()->toDateString() : $appointment->scheduled_date;
                $scheduledTime = $urgent
                    ? now()->format('H:i')
                    : ($appointment->scheduled_time ?? ($data['scheduled_time'] ?? null));
                if (! $scheduledTime) {
                    throw ValidationException::withMessages(['scheduled_time' => 'Choose an available time before assigning this counselor.']);
                }
                $bookings = Appointment::where('counselor_id', Ids::object($counselor->id))
                    ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
                    ->where('scheduled_date', $scheduledDate)
                    ->get(['_id', 'counselor_id', 'scheduled_date', 'scheduled_time', 'status']);
                $availability = $this->availability->check(
                    $counselor,
                    $scheduledDate,
                    $scheduledTime,
                    $urgent ? null : ($appointment->preferred_period ?? null),
                    $bookings,
                    (string) $appointment->id,
                    $urgent,
                );
                if (! $availability['available']) {
                    throw ValidationException::withMessages([
                        'counselor_id' => 'That counselor is not available at the selected time: '.$availability['reason'],
                    ]);
                }
                $scheduleRequest = [
                    'scheduled_date' => $scheduledDate,
                    'scheduled_time' => $scheduledTime,
                ];
                if (! $this->schedules->allowsAppointment((string) $counselor->id, $scheduleRequest, $urgent)) {
                    throw ValidationException::withMessages(['counselor_id' => 'That counselor is unavailable during the selected schedule or leave period.']);
                }
                if (! $urgent) {
                    $scheduleRequest['scheduled_date'] = $scheduledDate;
                    $targetSlot = $this->slot($counselor->id, $scheduleRequest);
                    if (Appointment::where('slot_key', $targetSlot)->where('_id', '!=', $appointment->_id)->exists()) {
                        throw ValidationException::withMessages(['counselor_id' => 'That counselor already has an appointment scheduled at that time.']);
                    }
                }
                $appointment->counselor_id = Ids::object($counselor->id);
                $appointment->status = 'assigned_pending_counselor';
                $appointment->reassignment_note = null;
                $appointment->student_accepted_at = null;
                $appointment->counselor_accepted_at = null;
                if (! empty($data['onboarding_note'])) {
                    $appointment->onboarding_note = $data['onboarding_note'];
                }
                if ($urgent) {
                    $appointment->scheduled_date = today()->toDateString();
                    $appointment->scheduled_time = now()->format('H:i');
                    $appointment->slot_key = null;
                } else {
                    $appointment->scheduled_date = $scheduledDate;
                    $appointment->scheduled_time = $scheduledTime;
                    $appointment->slot_key = $this->slot($counselor->id, $scheduleRequest);
                }
                $this->alert($counselor, $appointment, 'appointment', 'An appointment has been assigned to you. Review and accept schedule.');
            } elseif ($action === 'counselor_accept') {
                abort_unless($isCounselor, 403);
                if ($appointment->status !== 'assigned_pending_counselor') {
                    throw ValidationException::withMessages(['action' => 'Only a newly assigned appointment can be accepted.']);
                }
                $appointment->counselor_accepted_at = now()->toDateTimeString();
                $appointment->status = 'counselor_accepted_pending_student';
            } elseif ($action === 'student_confirm') {
                abort_unless($isStudent, 403);
                if ($appointment->status !== 'counselor_accepted_pending_student') {
                    throw ValidationException::withMessages(['action' => 'Confirmations are available only after the counselor accepts the appointment.']);
                }
                $appointment->student_accepted_at = now()->toDateTimeString();
                $appointment->status = 'confirmed';
            } elseif ($action === 'request_reassignment') {
                abort_unless($isCounselor, 403);
                if ($appointment->status !== 'assigned_pending_counselor') {
                    throw ValidationException::withMessages(['action' => 'Reassignment can only be requested for a newly assigned appointment.']);
                }
                $appointment->status = 'reassignment_requested';
                $appointment->reassignment_note = trim($data['note']);
            } elseif ($action === 'accept') {
                abort_unless($isCounselor, 403);
                if (! in_array($appointment->status, ['assigned', 'assigned_pending_accept', 'rescheduled'], true)) {
                    throw ValidationException::withMessages(['action' => 'Only assigned requests can be accepted.']);
                }
                $appointment->counselor_accepted_at = now()->toDateTimeString();
                $appointment->status = 'accepted';
            } elseif ($action === 'reschedule') {
                abort_unless($isCounselor || $isStudent, 403);
                if ($isStudent && $appointment->counselor_id) {
                    throw ValidationException::withMessages(['action' => 'Rescheduling is not permitted once a counselor has been assigned.']);
                }
                $targetSlot = null;
                if ($appointment->counselor_id) {
                    $targetTime = [...$appointment->toArray(), ...$data];
                    if (! $this->schedules->allowsAppointment((string) $appointment->counselor_id, $targetTime)) {
                        throw ValidationException::withMessages(['scheduled_time' => 'The selected time conflicts with the counselor schedule or leave.']);
                    }
                    $targetSlot = $this->slot($appointment->counselor_id, $data);
                    if (Appointment::where('slot_key', $targetSlot)->where('_id', '!=', $appointment->_id)->exists()) {
                        throw ValidationException::withMessages(['conflict' => 'That time is already reserved. Please choose another slot.']);
                    }
                }
                $appointment->scheduled_date = $data['scheduled_date'];
                $appointment->scheduled_time = $data['scheduled_time'];
                $appointment->slot_key = $targetSlot;
                $appointment->status = $isCounselor ? 'counselor_accepted_pending_student' : 'rescheduled';
                $appointment->student_accepted_at = null;
                $appointment->counselor_accepted_at = $isCounselor ? now()->toDateTimeString() : null;
            } elseif ($action === 'complete') {
                abort_unless($isCounselor, 403);
                if (! in_array($appointment->status, ['accepted', 'confirmed'], true)) {
                    throw ValidationException::withMessages(['action' => 'Wait for the student to confirm the appointment before completing it.']);
                }
                $appointment->status = 'completed';
                $appointment->slot_key = null;
            } elseif ($action === 'cancel') {
                abort_unless($isStaff || $isCounselor || $isStudent, 403);
                $appointment->status = 'cancelled';
                $appointment->slot_key = null;
            } else {
                abort(422);
            }
            $appointment->version++;
            $appointment->save();
            if ($action === 'counselor_accept' || ($action === 'accept' && $isCounselor)) {
                $this->cases->createCaseFromAppointment($appointment);
            }
            $session = CounselingSession::where('appointment_id', Ids::object($appointment->id))->first();
            if ($session && in_array($action, ['cancel', 'complete', 'reschedule'], true)) {
                $sessionUpdate = match ($action) {
                    'cancel' => ['status' => 'cancelled', 'cancelled_at' => now()->toDateTimeString()],
                    'complete' => ['status' => 'completed', 'completed_at' => now()->toDateTimeString()],
                    'reschedule' => [
                        'session_date' => $appointment->scheduled_date,
                        'time_slot' => $this->cases->timeSlot($appointment->scheduled_time),
                        'mode' => $this->cases->mode($appointment->channel),
                        'status' => 'scheduled',
                    ],
                };
                $session->update($sessionUpdate);
            }
            if (in_array($action, ['counselor_accept', 'student_confirm', 'accept', 'reschedule', 'complete', 'cancel', 'request_reassignment'])) {
                if ($action === 'request_reassignment') {
                    foreach (User::where('role', 'staff')->where('active', true)->get() as $staffUser) {
                        $this->alert($staffUser, $appointment, 'appointment', 'A counselor requested reassignment. Review the request note in the front-desk queue.');
                    }
                }
                if (in_array($action, ['counselor_accept', 'student_confirm', 'reschedule', 'complete', 'cancel'])) {
                    $this->alert(User::findOrFail($student->user_id), $appointment, 'status', 'Your appointment status or schedule has changed. Open appointments for details.');
                }
                if (in_array($action, ['student_confirm', 'reschedule', 'complete', 'cancel']) && $appointment->counselor_id && ($isStaff || $isStudent)) {
                    $assignedCounselor = User::find($appointment->counselor_id);
                    if ($assignedCounselor) {
                        $this->alert($assignedCounselor, $appointment, 'appointment', "Appointment status changed to {$appointment->status}.");
                    }
                }
            }
        });
    }

    public function slot($counselorId, array $data): string
    {
        return (string) $counselorId.':'.$data['scheduled_date'].':'.$data['scheduled_time'];
    }

    private function alert(User $user, Appointment $appointment, string $kind, string $message): void
    {
        OfficeAlert::create(['user_id' => Ids::object($user->id), 'appointment_id' => Ids::object($appointment->id),
            'kind' => $kind, 'message' => $message, 'read_at' => null]);
    }
}
