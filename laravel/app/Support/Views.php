<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use MongoDB\BSON\ObjectId;

class Views
{
    public static function user(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'college_codes' => $user->college_codes ?? [],
            'designation' => $user->designation ?? null,
            'preferences' => ['notification_refresh' => (bool) ($user->preferences['notification_refresh'] ?? true)],
            'on_duty' => (bool) $user->on_duty,
            'available' => (bool) $user->available,
        ];
    }

    public static function student(Student $student, ?User $user = null, bool $userLoaded = false): array
    {
        if (! $userLoaded) {
            $user = $user ?? ($student->user_id ? User::find($student->user_id) : null);
        }

        return [
            'id' => (string) $student->id,
            'full_name' => $user?->full_name ?? 'Unavailable account',
            'school_id_number' => $student->school_id_number,
            'college' => $student->college,
            'year_level' => $student->year_level,
            'phone_number' => $student->phone_number,
            'emergency_contact' => $student->emergency_contact,
        ];
    }

    public static function appointment(
        Appointment $appointment,
        ?Student $student = null,
        ?User $studentUser = null,
        ?User $counselor = null,
        bool $includeReassignmentNote = false,
        bool $relationsLoaded = false,
    ): array {
        if (! $relationsLoaded) {
            $student = $student ?? ($appointment->student_id ? Student::find($appointment->student_id) : null);
            $studentUser = $studentUser ?? ($student && $student->user_id ? User::find($student->user_id) : null);
            $counselor = $counselor ?? ($appointment->counselor_id ? User::find($appointment->counselor_id) : null);
        }

        return [
            'id' => (string) $appointment->id,
            'case_id' => $appointment->case_id ? (string) $appointment->case_id : null,
            'student' => $student ? self::student($student, $studentUser, userLoaded: true) : null,
            'counselor_id' => $appointment->counselor_id ? (string) $appointment->counselor_id : null,
            'counselor_name' => $counselor?->full_name,
            'counselor' => $counselor ? [
                'id' => (string) $counselor->id,
                'full_name' => $counselor->full_name,
                'email' => $counselor->email,
                'designation' => $counselor->designation ?? 'Counselor',
                'college_codes' => $counselor->college_codes ?? [],
                'on_duty' => (bool) $counselor->on_duty,
                'available' => (bool) $counselor->available,
            ] : null,
            'onboarding_note' => $appointment->onboarding_note ?? null,
            'reassignment_note' => $includeReassignmentNote ? ($appointment->reassignment_note ?? null) : null,
            'initial_visit_questionnaire' => $appointment->initial_visit_questionnaire ?? null,
            'signature' => $appointment->signature ?? null,
            'signed_at' => $appointment->signed_at ? ($appointment->signed_at instanceof \DateTimeInterface ? $appointment->signed_at->format('Y-m-d H:i:s') : (string) $appointment->signed_at) : null,
            'channel' => $appointment->channel,
            'type' => $appointment->type,
            'scheduled_date' => $appointment->scheduled_date,
            'scheduled_time' => $appointment->scheduled_time,
            'preferred_period' => $appointment->preferred_period ?? ($appointment->scheduled_time ? ((int) $appointment->scheduled_time < 12 ? 'AM' : 'PM') : null),
            'status' => $appointment->status,
            'student_accepted_at' => $appointment->student_accepted_at ?? null,
            'student_declined_at' => $appointment->student_declined_at ?? null,
            'student_decline_note' => $appointment->student_decline_note ?? null,
            'counselor_accepted_at' => $appointment->counselor_accepted_at ?? null,
            'version' => (int) $appointment->version,
        ];
    }

    /**
     * Batch-hydrate appointments to eliminate N+1 database queries.
     */
    public static function appointments(mixed $appointments, bool $includeReassignmentNote = false): mixed
    {
        if ($appointments === null) {
            return null;
        }

        $isPaginator = $appointments instanceof LengthAwarePaginator;
        $items = $isPaginator ? $appointments->items() : (is_array($appointments) ? $appointments : collect($appointments)->all());

        if (empty($items)) {
            return $isPaginator ? $appointments : [];
        }

        $studentIds = collect($items)->pluck('student_id')->filter()->unique()->values()->all();
        $counselorIds = collect($items)->pluck('counselor_id')->filter()->unique()->values()->all();

        $students = collect();
        if (! empty($studentIds)) {
            $studentObjectIds = array_map(
                fn ($id) => $id instanceof ObjectId ? $id : (preg_match('/^[a-f0-9]{24}$/i', (string) $id) ? new ObjectId((string) $id) : $id),
                $studentIds
            );
            $students = Student::whereIn('_id', $studentObjectIds)->get()->keyBy(fn ($s) => (string) $s->id);
        }

        $studentUserIds = $students->pluck('user_id')->filter()->unique()->values()->all();
        $allUserIds = collect($counselorIds)->concat($studentUserIds)->unique()->values()->all();

        $users = collect();
        if (! empty($allUserIds)) {
            $userObjectIds = array_map(
                fn ($id) => $id instanceof ObjectId ? $id : (preg_match('/^[a-f0-9]{24}$/i', (string) $id) ? new ObjectId((string) $id) : $id),
                $allUserIds
            );
            $users = User::whereIn('_id', $userObjectIds)->get()->keyBy(fn ($u) => (string) $u->id);
        }

        $transformer = function (Appointment $appointment) use ($students, $users, $includeReassignmentNote) {
            $student = $appointment->student_id ? $students->get((string) $appointment->student_id) : null;
            $studentUser = $student && $student->user_id ? $users->get((string) $student->user_id) : null;
            $counselor = $appointment->counselor_id ? $users->get((string) $appointment->counselor_id) : null;

            return self::appointment($appointment, $student, $studentUser, $counselor, $includeReassignmentNote, relationsLoaded: true);
        };

        if ($isPaginator) {
            return $appointments->through($transformer);
        }

        return collect($items)->map($transformer)->all();
    }

    public static function alert(OfficeAlert $alert, ?User $user = null): array
    {
        $role = $user?->role ?? 'student';
        $kind = (string) ($alert->kind ?? 'status');
        $message = (string) ($alert->message ?? '');
        $lowerMsg = strtolower($message);
        $hasAppointmentId = ! empty($alert->appointment_id);

        $category = 'general';
        if ($kind === 'testing' || str_contains($lowerMsg, 'test') || str_contains($lowerMsg, 'gama') || str_contains($lowerMsg, 'iq')) {
            $category = 'testing';
        } elseif ($kind === 'appointment' || $hasAppointmentId || str_contains($lowerMsg, 'appoint') || str_contains($lowerMsg, 'session') || str_contains($lowerMsg, 'counselor') || str_contains($lowerMsg, 'follow-up') || str_contains($lowerMsg, 'schedule')) {
            $category = 'appointment';
        } elseif ($kind === 'urgent') {
            $category = 'urgent';
        }

        if ($category === 'testing') {
            $title = 'Testing & Assessment';
            if (str_contains($lowerMsg, 'approved')) {
                $title = 'Testing Request Approved';
            } elseif (str_contains($lowerMsg, 'scheduled')) {
                $title = 'Testing Scheduled';
            } elseif (str_contains($lowerMsg, 'completed')) {
                $title = 'Testing Results Ready';
            }
        } elseif ($category === 'urgent') {
            $title = 'Urgent Notice';
        } elseif ($category === 'appointment') {
            if (str_contains($lowerMsg, 'follow-up') || str_contains($lowerMsg, 'follow up')) {
                $title = 'Follow-up Session';
            } elseif (str_contains($lowerMsg, 'cancel')) {
                $title = 'Appointment Cancelled';
            } elseif (str_contains($lowerMsg, 'reschedul')) {
                $title = 'Appointment Rescheduled';
            } elseif (str_contains($lowerMsg, 'confirmed') || str_contains($lowerMsg, 'accepted') || str_contains($lowerMsg, 'confirm your schedule')) {
                $title = 'Appointment Confirmed';
            } elseif (str_contains($lowerMsg, 'reassignment')) {
                $title = 'Reassignment Requested';
            } elseif (str_contains($lowerMsg, 'assigned')) {
                $title = 'Counselor Assigned';
            } elseif (str_contains($lowerMsg, 'declined')) {
                $title = 'Session Declined';
            } else {
                $title = 'Appointment Update';
            }
        } else {
            $title = 'Office Notification';
        }

        $actionUrl = match ($category) {
            'testing' => '/testing',
            'appointment' => match ($role) {
                'counselor' => '/counselor',
                'staff' => '/queue',
                'faculty' => '/testing',
                default => '/appointments',
            },
            default => '/alerts',
        };

        $createdAt = $alert->created_at;
        $createdAtHuman = 'Recently';
        $createdAtIso = null;
        if ($createdAt instanceof \DateTimeInterface) {
            $createdAtHuman = $createdAt->diffForHumans();
            $createdAtIso = $createdAt->toISOString();
        } elseif (! empty($createdAt)) {
            try {
                $carbon = Carbon::parse($createdAt);
                $createdAtHuman = $carbon->diffForHumans();
                $createdAtIso = $carbon->toISOString();
            } catch (\Throwable) {
                $createdAtHuman = (string) $createdAt;
            }
        }

        $readAt = $alert->read_at;
        $readAtIso = null;
        if ($readAt instanceof \DateTimeInterface) {
            $readAtIso = $readAt->toISOString();
        } elseif (! empty($readAt)) {
            $readAtIso = (string) $readAt;
        }

        return [
            'id' => (string) $alert->id,
            'message' => $message,
            'kind' => $kind,
            'category' => $category,
            'title' => $title,
            'read' => ! empty($alert->read_at),
            'read_at' => $readAtIso,
            'created_at' => $createdAtIso,
            'created_at_human' => $createdAtHuman,
            'action_url' => $actionUrl,
        ];
    }
}
