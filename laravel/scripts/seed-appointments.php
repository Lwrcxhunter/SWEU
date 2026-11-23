<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\Student;
use App\Models\User;
use App\Support\Ids;

$counselor = User::where('full_name', 'like', '%Artemis Shaun Xena Labrador%')->first();
if (!$counselor) { echo "Counselor not found\n"; exit(1); }
$students = Student::all();
if ($students->isEmpty()) { echo "No students\n"; exit(1); }

$statuses = ['pending_assignment','assigned_pending_counselor','confirmed','completed','cancelled'];
$start = new DateTime('2026-11-23');
$end = new DateTime('2026-12-10');
$period = new DatePeriod($start, new DateInterval('P1D'), $end->modify('+1 day'));
$count = 0;
foreach ($period as $date) {
    // 1-3 appointments per day
    $n = rand(1,3);
    for ($i=0;$i<$n;$i++) {
        $student = $students->random();
        $time = sprintf('%02d:%02d', rand(8,16), [0,30][rand(0,1)]);
        Appointment::create([
            'student_id' => Ids::object($student->id),
            'counselor_id' => Ids::object($counselor->id),
            'channel' => rand(0,1) ? 'face_to_face' : 'virtual',
            'type' => 'online_booking',
            'urgency_level' => 'normal',
            'scheduled_date' => $date->format('Y-m-d'),
            'scheduled_time' => $time,
            'status' => $statuses[array_rand($statuses)],
            'version' => 1,
        ]);
        $count++;
    }
}
echo "Created $count appointments for {$counselor->full_name}\n";