<?php

namespace App\Policies;

use App\Models\CounselingSession;
use App\Models\User;
use App\Support\Ids;

class CounselingSessionPolicy
{
    public function view(User $user, CounselingSession $session): bool
    {
        return $user->role === 'counselor' && $user->checkPermissionTo('notes.manage')
            && Ids::same($user->id, $session->counselor_id);
    }
}
