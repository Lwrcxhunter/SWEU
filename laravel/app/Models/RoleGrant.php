<?php

namespace App\Models;

// Mongo-native permission storage. Spatie's middleware and Gate integration call
// User::hasAnyRole / checkPermissionTo; no unsupported SQL pivot tables are used.
class RoleGrant extends Document
{
    protected $table = 'role_grants';
}
