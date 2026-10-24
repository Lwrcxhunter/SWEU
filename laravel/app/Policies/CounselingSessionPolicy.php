<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\CounselingSession;
use App\Models\User;
use App\Support\Ids;

class CounselingSessionPolicy
{
    public function view(User $user, CounselingSession $session): bool
    {
        if ($user->role === 'counselor' && $user->checkPermissionTo('notes.manage')
            && Ids::same($user->id, $session->counselor_id)) {
            return true;
        }

        return $user->role === 'head_counselor'
            && $user->checkPermissionTo('notes.audit.read')
            && AuditLog::where('actor_id', Ids::object($user->id))
                ->where('session_id', Ids::object($session->id))
                ->where('action', 'read_session_notes')
                ->exists();
    }
}
