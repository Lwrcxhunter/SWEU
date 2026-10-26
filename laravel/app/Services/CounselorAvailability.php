<?php

namespace App\Services;

use App\Models\CounselorSchedule;
use App\Models\User;
use App\Support\Ids;
use Carbon\CarbonImmutable;

class CounselorAvailability
{
    public const ACTIVE_STATUSES = [
        'pending',
        'pending_assignment',
        'assigned',
        'assigned_pending_accept',
        'assigned_pending_counselor',
        'counselor_accepted_pending_student',
        'reassignment_requested',
        'accepted',
        'confirmed',
        'rescheduled',
    ];

    // Appointments currently reserve one 30-minute slot throughout the application.
    public function check(User $counselor, string $date, ?string $time = null, ?string $period = null, iterable $bookings = [], ?string $excludeId = null): array
    {
        if (! $counselor->active) {
            return $this->result('unavailable', 'Unavailable', 'Not accepting new bookings.');
        }
        $savedSchedule = CounselorSchedule::where('counselor_id', Ids::object((string) $counselor->id))->first();
        foreach ($counselor->getLeaves() as $leave) {
            // Legacy entries without a status are official leave records.
            if (strtolower($leave['status'] ?? 'approved') !== 'approved') {
                continue;
            }
            $start = $leave['start_date'] ?? $leave['date'] ?? null;
            $end = $leave['end_date'] ?? $start;
            if ($start && $date >= $start && $date <= $end) {
                return $this->result('on_leave', 'On leave', 'On approved leave for this date.');
            }
        }
        if ($time && $savedSchedule) {
            $startAt = CarbonImmutable::parse($date.' '.$time, config('app.timezone'));
            $endAt = $startAt->addMinutes(30);
            foreach ($savedSchedule->leaves ?? [] as $leave) {
                $leaveStart = CarbonImmutable::parse($leave['startDateTime'], config('app.timezone'));
                $leaveEnd = CarbonImmutable::parse($leave['endDateTime'], config('app.timezone'));
                if ($startAt->lt($leaveEnd) && $endAt->gt($leaveStart)) {
                    return $this->result('on_leave', 'On leave', 'On approved leave for this date and time.');
                }
            }
        }
        if (! $time) {
            if (! $counselor->available) {
                return $this->result('unavailable', 'Unavailable', 'Not accepting new bookings.');
            }
            if (! in_array(strtoupper($period ?? ''), ['AM', 'PM'], true)) {
                return $this->result('unscheduled', 'Schedule needed', 'Choose a date and AM/PM preference first.');
            }
            $checks = [];
            $times = [];
            foreach ($this->times(strtoupper($period)) as $candidate) {
                $check = $this->check($counselor, $date, $candidate, $period, $bookings, $excludeId);
                $checks[] = $check;
                if ($check['available']) {
                    $times[] = $candidate;
                }
            }
            if ($times) {
                return array_merge($this->result('available', 'Available', 'Available times in the requested period.'), ['times' => $times]);
            }
            foreach (['in_class', 'booked'] as $status) {
                foreach ($checks as $check) {
                    if ($check['status'] === $status) {
                        return array_merge($check, ['reason' => 'No free counseling slots in this period. '.$check['reason']]);
                    }
                }
            }

            return $this->result('off_schedule', 'Outside counseling hours', 'No counseling hours in this period.');
        }

        $start = $this->minutes($time);
        $end = $start + 30;
        if ($period && strtoupper($period) !== ($start < 720 ? 'AM' : 'PM')) {
            return $this->result('off_schedule', 'Outside requested period', 'Choose a time within the student’s AM/PM preference.');
        }
        $day = CarbonImmutable::parse($date)->format('l');
        if (! $savedSchedule) {
            foreach ($counselor->getClassSchedule() as $class) {
                if (strcasecmp($class['day'] ?? '', $day) !== 0) {
                    continue;
                }
                [$classStart, $classEnd] = $this->range($class);
                if ($start < $classEnd && $end > $classStart) {
                    return $this->result('in_class', 'Has class at this time', $class['subject'] ?? 'Teaching class');
                }
            }
        }
        if ($savedSchedule) {
            $dayOfWeek = CarbonImmutable::parse($date)->dayOfWeek;
            foreach ($savedSchedule->classSchedule ?? [] as $class) {
                if ((int) $class['dayOfWeek'] === $dayOfWeek
                    && $start < $this->minutes($class['endTime'])
                    && $end > $this->minutes($class['startTime'])) {
                    return $this->result('in_class', 'Has class at this time', 'Teaching class');
                }
            }
        }
        foreach ($bookings as $booking) {
            if ((string) $booking->id === $excludeId || (string) $booking->counselor_id !== (string) $counselor->id
                || $booking->scheduled_date !== $date || ! in_array($booking->status, self::ACTIVE_STATUSES, true)) {
                continue;
            }
            if ($booking->scheduled_time) {
                $bookingStart = $this->minutes($booking->scheduled_time);
                if ($start < $bookingStart + 30 && $end > $bookingStart) {
                    return $this->result('booked', 'Already booked', 'An appointment already reserves this time.');
                }
            }
        }
        if (! $counselor->available) {
            return $this->result('unavailable', 'Unavailable', 'Not accepting new bookings.');
        }
        $withinHours = false;
        if ($savedSchedule) {
            $dayOfWeek = CarbonImmutable::parse($date)->dayOfWeek;
            foreach ($savedSchedule->availability ?? [] as $slot) {
                if ((int) $slot['dayOfWeek'] === $dayOfWeek
                    && $start >= $this->minutes($slot['startTime'])
                    && $end <= $this->minutes($slot['endTime'])) {
                    $withinHours = true;
                    break;
                }
            }
        } else {
            foreach ($counselor->getCounselorSchedule() as $slot) {
                [$slotStart, $slotEnd] = $this->range($slot);
                if (strcasecmp($slot['day'] ?? '', $day) === 0 && $start >= $slotStart && $end <= $slotEnd) {
                    $withinHours = true;
                    break;
                }
            }
        }
        if (! $withinHours) {
            return $this->result('off_schedule', 'Outside counseling hours', 'No counseling hours cover this appointment.');
        }

        return array_merge($this->result('available', 'Available', 'Available for counseling assignment.'), ['times' => [$time]]);
    }

    public function day(User $counselor, string $date, iterable $bookings): array
    {
        $periods = [];
        foreach (['AM', 'PM'] as $period) {
            $blocks = [];
            foreach ($this->times($period) as $time) {
                $check = $this->check($counselor, $date, $time, $period, $bookings);
                $end = CarbonImmutable::parse($date.' '.$time)->addMinutes(30)->format('H:i');
                $last = count($blocks) - 1;
                if ($last >= 0 && $blocks[$last]['status'] === $check['status'] && $blocks[$last]['reason'] === $check['reason']) {
                    $blocks[$last]['end'] = $end;
                } else {
                    $blocks[] = array_merge($check, ['start' => $time, 'end' => $end]);
                }
            }
            $periods[$period] = $blocks;
        }

        return $periods;
    }

    public function times(string $period): array
    {
        $times = [];
        for ($minutes = $period === 'AM' ? 480 : 780; $minutes < ($period === 'AM' ? 720 : 1020); $minutes += 30) {
            $times[] = sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
        }

        return $times;
    }

    private function range(array $slot): array
    {
        $morning = strtoupper($slot['period'] ?? '') === 'AM';

        return [$this->minutes($slot['start'] ?? ($morning ? '08:00' : '13:00')), $this->minutes($slot['end'] ?? ($morning ? '12:00' : '17:00'))];
    }

    private function minutes(string $time): int
    {
        [$hour, $minute] = explode(':', $time);

        return (int) $hour * 60 + (int) $minute;
    }

    private function result(string $status, string $badge, string $reason): array
    {
        return ['status' => $status, 'available' => $status === 'available', 'badge' => $badge, 'reason' => $reason, 'times' => []];
    }
}
