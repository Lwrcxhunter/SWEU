<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class ScheduleEvent extends Document
{
    protected $table = 'schedule_events';

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_sample' => 'boolean',
    ];

    public function scopeForCounselor(Builder $query, $id): Builder
    {
        return $query->where('counselor_id', $id);
    }
}
