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

$deleted = 0;
foreach (Appointment::where('counselor_id', Ids::object($counselor->id))->get() as $appt) {
    $d = Carbon::parse($appt->scheduled_date);
    if ($d->isSaturday() || $d->isSunday()) {
        $appt->delete();
        $deleted++;
    }
}
// remove schedule events on weekends
$seDeleted = 0;
foreach (ScheduleEvent::where('counselor_id', Ids::object($counselor->id))->get() as $ev) {
    if ($ev->start_at->isSaturday() || $ev->start_at->isSunday()) {
        $ev->delete();
        $seDeleted++;
    }
}
echo "Deleted $deleted appointments and $seDeleted schedule events on weekends.\n";