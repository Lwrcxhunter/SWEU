<?php

namespace App\Models;

class Referral extends Document
{
    protected $table = 'referrals';

    protected $hidden = ['reason'];
}
