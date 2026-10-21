<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class User extends Document implements AuthenticatableContract, AuthorizableContract
{
    use HasFactory, \Illuminate\Auth\Authenticatable, \Illuminate\Foundation\Auth\Access\Authorizable, Notifiable;

    protected $connection = 'mongodb';

    protected $table = 'users';

    protected $guarded = ['_id', 'id'];

    protected $hidden = ['password', 'remember_token'];

    protected $attributes = ['role' => 'student', 'active' => true, 'available' => false, 'on_duty' => false];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'active' => 'boolean', 'available' => 'boolean', 'on_duty' => 'boolean'];
    }

    // Single-role MongoDB adapter for Spatie RoleMiddleware and PermissionRegistrar.
    // Grants are read afresh, so a revoked permission cannot survive a stale cache.
    public function hasAnyRole(...$roles): bool
    {
        $roles = count($roles) === 1 && is_array($roles[0]) ? $roles[0] : $roles;

        return $this->active && in_array($this->role, $roles, true);
    }

    public function hasRole($role, $guard = null): bool
    {
        return $this->hasAnyRole(is_array($role) ? $role : explode('|', $role));
    }

    public function checkPermissionTo($permission, $guard = null): bool
    {
        if (! $this->active || ! is_string($permission) || ($guard && $guard !== 'web')) {
            return false;
        }
        $allowed = config('guidance.permissions.'.$this->role, []);
        if (! in_array($permission, $allowed, true)) {
            return false;
        }
        $grants = RoleGrant::where('name', $this->role)->first();

        return $grants && in_array($permission, $grants->permissions ?? [], true);
    }

    public function hasAnyPermission(...$permissions): bool
    {
        $permissions = count($permissions) === 1 && is_array($permissions[0]) ? $permissions[0] : $permissions;
        foreach ($permissions as $permission) {
            if ($this->checkPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }
}
