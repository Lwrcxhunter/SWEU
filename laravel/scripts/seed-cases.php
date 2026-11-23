<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\User;
use App\Services\CounselingCases;
use App\Support\Ids;

$counselor = User::where('full_name', 'like', '%Artemis Shaun Xena Labrador%')->first();
if (!$counselor) { echo "Counselor not found\n"; exit(1); }

$service = app(CounselingCases::class);
$appts = Appointment::where('counselor_id', Ids::object($counselor->id))->get();
$count = 0;
foreach ($appts as $appt) {
    try {
        $service->createCaseFromAppointment($appt);
        $count++;
    } catch (\Throwable $e) {
        // skip
    }
}
echo "Created $count counseling cases for {$counselor->full_name}\n";