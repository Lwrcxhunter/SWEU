<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\Student;
use App\Support\Ids;
use Illuminate\Support\Facades\DB;
use MongoDB\Driver\Exception\BulkWriteException;
use MongoDB\Operation\FindOneAndUpdate;

class CounselingCases
{
    public function createCaseFromAppointment(Appointment $appointment): CounselingCase
    {
        $create = function () use ($appointment) {
            if (! empty($appointment->case_id)) {
                return CounselingCase::findOrFail($appointment->case_id);
            }

            $appointmentId = Ids::object($appointment->id);
            $existing = CounselingCase::where('appointment_id', $appointmentId)->first();
            if ($existing) {
                return $existing;
            }

            abort_unless($appointment->counselor_id, 409, 'Assign a counselor before opening a case.');

            $student = Student::findOrFail($appointment->student_id);
            $openedAt = now();
            $case = CounselingCase::create([
                'case_number' => $this->nextCaseNumber((int) $openedAt->year),
                'appointment_id' => $appointmentId,
                'student_id' => Ids::object($student->id),
                'student_user_id' => Ids::object($student->user_id),
                'counselor_id' => Ids::object($appointment->counselor_id),
                'category' => $appointment->category ?? 'general_guidance',
                'status' => 'open',
                'opened_at' => $openedAt->toDateTimeString(),
                'closed_at' => null,
                'closed_reason' => null,
                'outcome' => null,
                'session_count' => 1,
            ]);

            $appointment->case_id = Ids::object($case->id);
            $appointment->save();

            $session = CounselingSession::where('appointment_id', $appointmentId)->first()
                ?? new CounselingSession(['appointment_id' => $appointmentId, 'version' => 0]);
            $session->fill([
                'case_id' => Ids::object($case->id),
                'student_id' => Ids::object($student->id),
                'counselor_id' => Ids::object($appointment->counselor_id),
                'session_date' => $appointment->scheduled_date,
                'time_slot' => $this->timeSlot($appointment->scheduled_time),
                'mode' => $this->mode($appointment->channel),
                'status' => $appointment->status === 'completed' ? 'completed' : 'scheduled',
                'is_follow_up' => false,
                'session_number' => 1,
                'completed_at' => $appointment->status === 'completed' ? $openedAt->toDateTimeString() : null,
            ]);
            $session->save();

            return $case;
        };

        return DB::connection('mongodb')->transactionLevel() > 0
            ? $create()
            : DB::transaction($create);
    }

    private function nextCaseNumber(int $year): string
    {
        $collection = DB::connection('mongodb')->getCollection('counseling_case_sequences');

        for ($attempt = 0; $attempt < 3; $attempt++) {
            try {
                $sequence = $collection->findOneAndUpdate(
                    ['_id' => $year],
                    ['$inc' => ['sequence' => 1]],
                    [
                        'upsert' => true,
                        'returnDocument' => FindOneAndUpdate::RETURN_DOCUMENT_AFTER,
                        'typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array'],
                    ],
                );

                return sprintf('CASE-%04d-%04d', $year, (int) $sequence['sequence']);
            } catch (BulkWriteException $exception) {
                if ((int) $exception->getCode() !== 11000 || $attempt === 2) {
                    throw $exception;
                }
            }
        }

        throw new \RuntimeException('Could not allocate a unique counseling case number.');
    }

    public function timeSlot(?string $time): string
    {
        return (int) substr((string) $time, 0, 2) < 12 ? 'AM' : 'PM';
    }

    public function mode(?string $channel): string
    {
        return in_array($channel, ['virtual', 'online', 'telecounseling'], true) ? 'Virtual' : 'F2F';
    }
}
