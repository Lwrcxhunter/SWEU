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
                if (in_array($appointment->status, ['accepted', 'completed']) || CounselingSession::where('appointment_id', Ids::object($appointment->id))->exists()) {
                    throw ValidationException::withMessages(['action' => 'An accepted appointment or a session with clinical notes cannot be reassigned.']);
                }
                $counselor = User::findOrFail(Ids::object($data['counselor_id']));
                $urgent = $appointment->urgency_level === 'urgent';
                if ($counselor->role !== 'counselor' || ! $counselor->active || ! $counselor->available
                    || ($urgent && ! $counselor->on_duty)) {
                    throw ValidationException::withMessages(['counselor_id' => 'Choose an available counselor (must be on-duty for urgent cases).']);
                }
                $date = $urgent ? today()->toDateString() : $appointment->scheduled_date;
                $time = $urgent ? now()->format('H:i') : ($appointment->scheduled_time ?: ($data['scheduled_time'] ?? null));
                if (! $time) {
                    throw ValidationException::withMessages(['scheduled_time' => 'Choose an available time within the requested AM/PM period.']);
                }
                $bookings = Appointment::where('counselor_id', Ids::object($counselor->id))
                    ->where('scheduled_date', $date)->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)->get();
                $check = app(CounselorAvailability::class)->check($counselor, $date, $time,
                    $urgent ? null : $appointment->preferred_period, $bookings, (string) $appointment->id, $urgent);
                if (! $check['available']) {
                    throw ValidationException::withMessages(['counselor_id' => $check['reason']]);
                }
                $appointment->scheduled_time = $time;
                if (! $urgent) {
                    $targetSlot = $this->slot($counselor->id, $appointment->toArray());
                    if (Appointment::where('slot_key', $targetSlot)->where('_id', '!=', $appointment->_id)->exists()) {
                        throw ValidationException::withMessages(['counselor_id' => 'That counselor already has an appointment scheduled at that time.']);
                    }
                }
                $appointment->counselor_id = Ids::object($counselor->id);
                $appointment->status = 'assigned_pending_accept';
                $appointment->counselor_accepted_at = null;
                $appointment->student_accepted_at = null;
                if (! empty($data['onboarding_note'])) {
                    $appointment->onboarding_note = $data['onboarding_note'];
                }
                if ($urgent) {
                    $appointment->scheduled_date = today()->toDateString();
                    $appointment->scheduled_time = now()->format('H:i');
                    $appointment->slot_key = null;
                } else {
                    $appointment->slot_key = $this->slot($counselor->id, $appointment->toArray());
                }
                $this->alert($counselor, $appointment, 'appointment', 'An appointment has been assigned to you. Review and accept schedule.');
            } elseif ($action === 'accept') {
                abort_unless($isCounselor || $isStudent, 403);
                if (! in_array($appointment->status, ['assigned', 'assigned_pending_accept', 'rescheduled'])) {
                    throw ValidationException::withMessages(['action' => 'Only assigned requests can be accepted.']);
                }
                if ($isStudent) {
                    $appointment->student_accepted_at = now()->toDateTimeString();
                }
                if ($isCounselor) {
                    $appointment->counselor_accepted_at = now()->toDateTimeString();
                }
                $appointment->status = 'accepted';
            } elseif ($action === 'reschedule') {
                abort_unless($isCounselor || $isStudent, 403);
                if ($isStudent && $appointment->counselor_id) {
                    throw ValidationException::withMessages(['action' => 'Rescheduling is not permitted once a counselor has been assigned.']);
                }
                $targetSlot = null;
                if ($appointment->counselor_id) {
                    $targetSlot = $this->slot($appointment->counselor_id, $data);
                    if (Appointment::where('slot_key', $targetSlot)->where('_id', '!=', $appointment->_id)->exists()) {
                        throw ValidationException::withMessages(['conflict' => 'That time is already reserved. Please choose another slot.']);
                    }
                }
                $appointment->scheduled_date = $data['scheduled_date'];
                $appointment->scheduled_time = $data['scheduled_time'];
                $appointment->slot_key = $targetSlot;
                $appointment->status = 'rescheduled';
                $appointment->student_accepted_at = null;
                $appointment->counselor_accepted_at = null;
            } elseif ($action === 'complete') {
                abort_unless($isCounselor, 403);
                if ($appointment->status !== 'accepted') {
                    throw ValidationException::withMessages(['action' => 'Accept the appointment before completing it.']);
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
            if (in_array($action, ['assign', 'accept', 'reschedule', 'complete', 'cancel'])) {
                $this->alert(User::findOrFail($student->user_id), $appointment, 'status', 'Your appointment status or schedule has changed. Open appointments for details.');
                if ($action !== 'assign' && $appointment->counselor_id && ($isStaff || $isStudent)) {
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
