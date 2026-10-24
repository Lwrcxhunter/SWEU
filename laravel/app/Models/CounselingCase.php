<?php

namespace App\Models;

class CounselingCase extends Document
{
    protected $table = 'counseling_cases';

    protected function casts(): array
    {
        return ['session_count' => 'integer'];
    }
}
