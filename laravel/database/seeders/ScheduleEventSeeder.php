<?php

namespace Database\Seeders;

use App\Models\ScheduleEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ScheduleEventSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'counselor')->get();
        if ($users->isEmpty()) {
            $users = collect([User::firstOrFail()]);
        }
        $templates = [
            ['Individual Counseling - J. Dela Cruz', 'appointment', 'Counseling Room 1'],
            ['Case Conference', 'case_conference', 'Conference Room'],
            ['Group Counseling (SHS)', 'appointment', 'Counseling Room 2'],
            ['Academic Guidance - M. Santos', 'appointment', 'Counseling Room 1'],
            ['Faculty Consultation', 'meeting', 'Office 3'],
            ['Career Guidance Seminar', 'workshop', 'Auditorium'],
            ['Mental Health Awareness Workshop', 'workshop', 'Function Hall'],
            ['Department Coordination Meeting', 'meeting', 'Conference Room'],
            ['Records Review', 'other', 'Office 3'],
        ];
        $timezone = config('app.timezone');
        $today = Carbon::today($timezone);

        foreach ($users as $user) {
            foreach (range(-7, 21) as $dayOffset) {
                $date = $today->copy()->addDays($dayOffset);
                if ($date->isSunday()) {
                    continue;
                }
                $count = $date->isSaturday()
                    ? 1
                    : ($date->isSameDay($today->copy()->addDay()) ? 6 : 3 + ($date->day % 3));
                foreach (range(0, $count - 1) as $slot) {
                    [$title, $type, $location] = $templates[($date->day + $slot + abs($dayOffset)) % count($templates)];
                    $start = $date->copy()->setTime(8 + ($slot * 2), $slot % 2 ? 30 : 0);
                    $end = $start->copy()->addHour();
                    $seedKey = 'schedule-'.(string) $user->id.'-'.$date->toDateString().'-'.$slot;
                    ScheduleEvent::updateOrCreate(
                        ['seed_key' => $seedKey],
                        [
                            'title' => $title,
                            'type' => $type,
                            'start_at' => $start,
                            'end_at' => $end,
                            'location' => $location,
                            'counselor_id' => $user->id,
                            'notes' => 'Sample schedule activity for counselor planning.',
                            'is_sample' => true,
                        ],
                    );
                }
            }
        }
        $this->command->info("Schedule samples attached to {$users->count()} counselor accounts.");
    }
}
