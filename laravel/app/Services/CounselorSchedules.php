<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CounselorSchedule;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class CounselorSchedules
{
    public function __construct(private readonly CounselorAvailability $availability) {}

    public function validate(array $data): array
    {
        foreach (['availability', 'classSchedule', 'leaves'] as $category) {
            $entries = $data[$category] ?? [];
            for ($i = 0; $i < count($entries); $i++) {
                for ($j = $i + 1; $j < count($entries); $j++) {
                    if ($this->overlap($entries[$i], $entries[$j], $category)) {
                        throw ValidationException::withMessages([
                            $category => 'Schedule entries in the same section cannot overlap.',
                        ]);
                    }
                }
            }
        }

        foreach ($data['availability'] ?? [] as $available) {
            foreach ($data['classSchedule'] ?? [] as $class) {
                if ((int) $available['dayOfWeek'] === (int) $class['dayOfWeek']
                    && $this->timeOverlap($available['startTime'], $available['endTime'], $class['startTime'], $class['endTime'])) {
                    throw ValidationException::withMessages([
                        'availability' => 'Counseling availability cannot overlap a class block.',
                    ]);
                }
            }
        }

        return [
            'availability' => array_values($data['availability'] ?? []),
            'classSchedule' => array_values($data['classSchedule'] ?? []),
            'leaves' => array_values($data['leaves'] ?? []),
        ];
    }

    public function save(string $counselorId, array $schedule): CounselorSchedule
    {
        $data = $this->validate($schedule);
        $appointments = Appointment::where('counselor_id', Ids::object($counselorId))
            ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
            ->get(['_id', 'scheduled_date', 'scheduled_time']);
        $conflicts = $appointments->filter(fn (Appointment $appointment) => ! $this->allowsWithSchedule(
            $data,
            [
                'scheduled_date' => $appointment->scheduled_date,
                'scheduled_time' => $appointment->scheduled_time,
            ],
        ));

        if ($conflicts->isNotEmpty()) {
            $dates = $conflicts
                ->map(fn (Appointment $appointment) => trim($appointment->scheduled_date.' '.$appointment->scheduled_time))
                ->implode(', ');
            throw ValidationException::withMessages([
                'availability' => 'These changes conflict with existing appointments ('.$dates.'). Reschedule or cancel those appointments before saving.',
            ]);
        }

        return CounselorSchedule::updateOrCreate(
            ['counselor_id' => Ids::object($counselorId)],
            $data,
        );
    }

    public function allowsAppointment(string $counselorId, array $appointment): bool
    {
        $schedule = CounselorSchedule::where('counselor_id', Ids::object($counselorId))->first();
        if (! $schedule) {
            return true;
        }

        return $this->allowsWithSchedule($schedule->toArray(), $appointment);
    }

    private function allowsWithSchedule(array $schedule, array $appointment): bool
    {
        $date = Carbon::createFromFormat('Y-m-d', $appointment['scheduled_date'], config('app.timezone'));
        $weekday = $date->dayOfWeek;
        $start = $this->minutes($appointment['scheduled_time']);
        $end = $start + 30;
        $startAt = Carbon::createFromFormat('Y-m-d H:i', $appointment['scheduled_date'].' '.$appointment['scheduled_time'], config('app.timezone'));
        $endAt = $startAt->copy()->addMinutes(30);

        foreach ($schedule['leaves'] ?? [] as $leave) {
            $leaveStart = Carbon::parse($leave['startDateTime'], config('app.timezone'));
            $leaveEnd = Carbon::parse($leave['endDateTime'], config('app.timezone'));
            if ($startAt->lt($leaveEnd) && $endAt->gt($leaveStart)) {
                return false;
            }
        }

        $withinAvailability = collect($schedule['availability'] ?? [])->contains(
            fn ($entry) => (int) $entry['dayOfWeek'] === $weekday
                && $this->minutes($entry['startTime']) <= $start
                && $this->minutes($entry['endTime']) >= $end,
        );
        if (! $withinAvailability) {
            return false;
        }

        return ! collect($schedule['classSchedule'] ?? [])->contains(
            fn ($entry) => (int) $entry['dayOfWeek'] === $weekday
                && $this->timeOverlap(
                    $appointment['scheduled_time'],
                    $endAt->format('H:i'),
                    $entry['startTime'],
                    $entry['endTime'],
                ),
        );
    }

    private function overlap(array $left, array $right, string $category): bool
    {
        if ($category === 'leaves') {
            $leftStart = Carbon::parse($left['startDateTime'], config('app.timezone'));
            $leftEnd = Carbon::parse($left['endDateTime'], config('app.timezone'));
            $rightStart = Carbon::parse($right['startDateTime'], config('app.timezone'));
            $rightEnd = Carbon::parse($right['endDateTime'], config('app.timezone'));

            return $leftStart->lt($rightEnd) && $leftEnd->gt($rightStart);
        }

        return (int) $left['dayOfWeek'] === (int) $right['dayOfWeek']
            && $this->timeOverlap($left['startTime'], $left['endTime'], $right['startTime'], $right['endTime']);
    }

    private function timeOverlap(string $leftStart, string $leftEnd, string $rightStart, string $rightEnd): bool
    {
        return $this->minutes($leftStart) < $this->minutes($rightEnd)
            && $this->minutes($leftEnd) > $this->minutes($rightStart);
    }

    private function minutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return $hours * 60 + $minutes;
    }
}
