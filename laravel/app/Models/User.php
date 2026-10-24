<?php

namespace App\Models;

use App\Services\CounselorAvailability;
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

    public function getCounselorSchedule(): array
    {
        if (is_array($this->counseling_schedule)) {
            return $this->counseling_schedule;
        }

        return [
            ['day' => 'Monday', 'period' => 'AM', 'start' => '08:00', 'end' => '12:00', 'label' => 'Counseling Hours'],
            ['day' => 'Monday', 'period' => 'PM', 'start' => '13:00', 'end' => '17:00', 'label' => 'Counseling Hours'],
            ['day' => 'Tuesday', 'period' => 'AM', 'start' => '08:00', 'end' => '12:00', 'label' => 'Counseling Hours'],
            ['day' => 'Tuesday', 'period' => 'PM', 'start' => '13:00', 'end' => '17:00', 'label' => 'Counseling Hours'],
            ['day' => 'Wednesday', 'period' => 'AM', 'start' => '08:00', 'end' => '12:00', 'label' => 'Counseling Hours'],
            ['day' => 'Wednesday', 'period' => 'PM', 'start' => '13:00', 'end' => '17:00', 'label' => 'Counseling Hours'],
            ['day' => 'Thursday', 'period' => 'AM', 'start' => '08:00', 'end' => '12:00', 'label' => 'Counseling Hours'],
            ['day' => 'Thursday', 'period' => 'PM', 'start' => '13:00', 'end' => '17:00', 'label' => 'Counseling Hours'],
            ['day' => 'Friday', 'period' => 'AM', 'start' => '08:00', 'end' => '12:00', 'label' => 'Counseling Hours'],
            ['day' => 'Friday', 'period' => 'PM', 'start' => '13:00', 'end' => '17:00', 'label' => 'Counseling Hours'],
        ];
    }

    public function getClassSchedule(): array
    {
        if (! empty($this->class_schedule) && is_array($this->class_schedule)) {
            return $this->class_schedule;
        }

        return [];
    }

    public function getLeaves(): array
    {
        if (! empty($this->leaves) && is_array($this->leaves)) {
            return $this->leaves;
        }

        return [];
    }

    public function checkAvailability(string $date, ?string $time = null, ?string $preferredPeriod = null): array
    {
        return app(CounselorAvailability::class)->check($this, $date, $time, $preferredPeriod);
    }
}
