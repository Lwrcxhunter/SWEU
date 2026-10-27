<?php

namespace App\Models;

// Mongo-native permission storage. Spatie's middleware and Gate integration call
// User::hasAnyRole / checkPermissionTo; no unsupported SQL pivot tables are used.
class RoleGrant extends Document
{
    protected $table = 'role_grants';

    public static function permissionsFor(string $role): array
    {
        // Request-local only: raw database updates and revocations are visible
        // on the next request without a shared cache invalidation race.
        $request = request();
        $grants = $request->attributes->get('guidance.role_grants', []);
        if (! array_key_exists($role, $grants)) {
            $grants[$role] = static::where('name', $role)->first()?->permissions ?? [];
            $request->attributes->set('guidance.role_grants', $grants);
        }

        return $grants[$role];
    }
}
