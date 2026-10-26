<?php

namespace Database\Seeders;

use App\Models\CounselingSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use MongoDB\BSON\ObjectId;

class SessionSeeder extends Seeder
{
    public function run(): void
    {
        $counselors = User::where('role', 'counselor')->get();
        if ($counselors->isEmpty()) {
            $this->command->error('No counselor accounts were found.');
            return;
        }
        CounselingSession::where('analytics_seed', true)->delete();

        $concerns = ['academic', 'personal', 'career', 'mental_health', 'other'];
        $services = ['individual_counseling', 'follow_up_session', 'crisis_support', 'group_guidance', 'referral'];
        $statuses = ['completed', 'completed', 'completed', 'scheduled', 'follow-up'];
        $start = Carbon::now()->startOfMonth()->subMonths(3);

        foreach ($counselors as $counselorIndex => $counselor) {
            foreach (range(0, 64) as $index) {
                $sequence = ($counselorIndex * 65) + $index;
                $date = $start->copy()->addDays(($sequence * 2) % 112);
                $status = $statuses[$sequence % count($statuses)];
                CounselingSession::create([
                    'appointment_id' => new ObjectId(),
                    'counselor_id' => $counselor->id,
                    'session_date' => $date->toDateString(),
                    'concern_category' => $concerns[$sequence % count($concerns)],
                    'service_type' => $services[$sequence % count($services)],
                    'status' => $status,
                    'is_follow_up' => $status === 'follow-up' || $sequence % 7 === 0,
                    'session_number' => ($sequence % 3) + 1,
                    'time_slot' => ['09:00', '10:30', '13:30', '15:00'][$sequence % 4],
                    'mode' => $sequence % 3 === 0 ? 'online' : 'face_to_face',
                    'completed_at' => $status === 'completed' ? $date->copy()->setTime(15, 0)->toDateTimeString() : null,
                    'version' => 1,
                    'analytics_seed' => true,
                ]);
            }
        }
    }
}
