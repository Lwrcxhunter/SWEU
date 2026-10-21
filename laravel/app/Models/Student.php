<?php

namespace App\Models;

class Student extends Document
{
    protected $table = 'students';

    protected $hidden = [
        'intake_record', 'medical_history', 'address', 'dob', 'marital_status',
        'religious_affiliation', 'facebook_messenger_username', 'personal_details',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'personal_details.dob' => 'date',
            'personal_details.year_level' => 'integer',
        ];
    }
}
