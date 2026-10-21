<?php

use App\Models\User;
use App\Services\DatabaseSetup;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('guidance:setup', function () {
    app(DatabaseSetup::class)->run();
    $this->info('MongoDB collections, indexes and initial role grants are ready. Existing grants were preserved.');
})->purpose('Create MongoDB indexes and initial role grants without deleting data');
Artisan::command('guidance:admin', function () {
    $data = ['full_name' => $this->ask('Full name'), 'email' => strtolower($this->ask('Email')), 'password' => $this->secret('Password (12+ characters, mixed case and numbers)')];
    $validator = Validator::make($data, ['full_name' => 'required|string|max:150', 'email' => ['required', 'email:strict', 'not_regex:/[\r\n]/', 'unique:users'], 'password' => ['required', Password::defaults()]]);
    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }
    User::create($data + ['role' => 'admin', 'active' => true]);
    $this->info('Administrator created.');
})->purpose('Create an administrator with privately entered credentials');

Artisan::command('guidance:demo', function () {
    $password = 'Password123!';
    $accounts = [
        ['full_name' => 'Demo Admin', 'email' => 'admin@buksu.edu.ph', 'role' => 'admin'],
        ['full_name' => 'Demo Staff', 'email' => 'staff@buksu.edu.ph', 'role' => 'staff'],
        ['full_name' => 'Demo Faculty', 'email' => 'faculty@buksu.edu.ph', 'role' => 'faculty'],
        ['full_name' => 'Demo Student', 'email' => 'student@student.buksu.edu.ph', 'role' => 'student'],
        ['full_name' => 'Demo Counselor', 'email' => 'counselor@buksu.edu.ph', 'role' => 'counselor', 'college_codes' => ['CAS', 'COB'], 'designation' => 'CAS & COB Counselor', 'on_duty' => true, 'available' => true],
        [
            'full_name' => 'Sir Hananeel Jay A. Cabiling',
            'email' => 'hananeel.cabiling@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['COB', 'COBA'],
            'designation' => 'COB Guidance Designate',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Maam Helena S. Praile',
            'email' => 'helena.praile@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['CPAG'],
            'designation' => 'CPAG Designate',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Maam Artemis Shaun Xena Labrador',
            'email' => 'artemis.labrador@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['CON', 'COT'],
            'designation' => 'CON & COT Designate',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Maam Evangelne',
            'email' => 'evangeline@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['COE'],
            'designation' => 'SWEU Counselor',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Dr. Lora E Anar',
            'email' => 'lora.anar@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['COT', 'CAS', 'COBA', 'COE', 'CON', 'COL', 'COM', 'CPAG', 'COB'],
            'designation' => 'Director of SWE',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Maam Jennylyn B. Casino',
            'email' => 'jennylyn.casino@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['CAS'],
            'designation' => 'CAS Designate',
            'on_duty' => true,
            'available' => true,
        ],
        [
            'full_name' => 'Maam Ebbeth Joy Barcero-Tadle',
            'email' => 'ebbeth.barcero@buksu.edu.ph',
            'role' => 'counselor',
            'college_codes' => ['COL', 'COM'],
            'designation' => 'SWEU Counselor',
            'on_duty' => true,
            'available' => true,
        ],
    ];

    foreach ($accounts as $acc) {
        User::updateOrCreate(
            ['email' => $acc['email']],
            array_merge($acc, ['password' => $password, 'active' => true])
        );
        $this->line("Seeded: {$acc['email']} ({$acc['role']}) - {$acc['full_name']}");
    }
    $this->info("Demo & Counselor accounts ready. Password for all: {$password}");
})->purpose('Seed ready-to-use demo and counselor accounts in development');
