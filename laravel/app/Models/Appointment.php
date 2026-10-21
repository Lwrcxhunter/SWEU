<?php

namespace App\Models;

class Appointment extends Document
{
    protected $table = 'appointments';

    protected $hidden = ['slot_key'];
}
