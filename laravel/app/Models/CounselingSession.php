<?php

namespace App\Models;

class CounselingSession extends Document
{
    protected $table = 'counseling_sessions';

    protected $hidden = ['encrypted_session_notes'];

    protected function casts(): array
    {
        return ['encrypted_session_notes' => 'encrypted', 'is_flagged_for_followup' => 'boolean'];
    }
}
