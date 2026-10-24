<?php

use App\Models\Appointment;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
use App\Support\Ids;

// The shared seeder refuses to modify anything except the isolated browser database.
require __DIR__.'/seed.php';

$date = today()->next('Monday')->toDateString();
$available = User::where('email', 'counselor@browser.test')->firstOrFail();
$available->update(['full_name' => 'Ana Santos', 'college_codes' => ['CAS']]);
$class = User::create(['full_name' => 'Ben Reyes', 'role' => 'counselor', 'active' => true, 'available' => true, 'on_duty' => true,
    'college_codes' => ['COT'], 'email' => 'class@browser.test',
    'class_schedule' => [['day' => 'Monday', 'start' => '09:00', 'end' => '11:00', 'subject' => 'PSYC 101']]]);
User::create(['full_name' => 'Clara Cruz', 'role' => 'counselor', 'active' => true, 'available' => true, 'on_duty' => true,
    'college_codes' => ['CAS'], 'email' => 'leave@browser.test',
    'leaves' => [['date' => $date, 'status' => 'approved', 'reason' => 'Private leave reason']]]);
$booked = User::create(['full_name' => 'Diego Flores', 'role' => 'counselor', 'active' => true, 'available' => true, 'on_duty' => true,
    'college_codes' => ['CAS'], 'email' => 'booked@browser.test']);
$student = Student::create(['user_id' => Ids::object(User::where('email', 'student@browser.test')->firstOrFail()->id),
    'school_id_number' => 'BROWSER-01', 'college' => ['code' => 'CAS'], 'phone_number' => '09123456789',
    'intake_record' => ['signed_agreement' => true]]);
foreach ([['09:30', null, 'pending_assignment'], ['09:30', $booked->id, 'assigned_pending_accept'], [null, null, 'pending_assignment']] as [$time, $counselor, $status]) {
    Appointment::create(['student_id' => Ids::object($student->id), 'counselor_id' => $counselor ? Ids::object($counselor) : null,
        'scheduled_date' => $date, 'scheduled_time' => $time, 'preferred_period' => 'AM', 'channel' => 'online',
        'type' => 'online_booking', 'urgency_level' => 'normal', 'status' => $status, 'version' => 1]);
}
TestingRequest::create(['status' => 'pending', 'student_count' => 30, 'requester_name' => 'Synthetic internship coordinator']);
