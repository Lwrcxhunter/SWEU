<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\ScheduleEvent;
use App\Models\User;
use App\Support\Ids;
use Carbon\Carbon;

$counselor = User::where('full_name', 'like', '%Artemis Shaun Xena Labrador%')->first();
if (!$counselor) { echo "Counselor not found\n"; exit(1); }

$appointments = Appointment::where('counselor_id', Ids::object($counselor->id))->get();
$count = 0;
foreach ($appointments as $appt) {
    $date = $appt->scheduled_date;
    $time = $appt->scheduled_time ?: '09:00';
    $start = Carbon::parse("$date $time", config('app.timezone'));
    $end = $start->copy()->addHour();
    $seedKey = 'appt-'.(string)$appt->id;
    ScheduleEvent::updateOrCreate(
        ['seed_key' => $seedKey],
        [
            'title' => 'Appointment: '.($appt->student_name ?? 'Student'),
            'type' => 'appointment',
            'start_at' => $start,
            'end_at' => $end,
            'location' => $appt->channel === 'virtual' ? 'Virtual' : 'Guidance Office',
            'counselor_id' => Ids::object($counselor->id),
            'notes' => 'Synced from appointment.',
            'is_sample' => false,
        ]
    );
    $count++;
}
echo "Synced $count schedule events for {$counselor->full_name}\n";