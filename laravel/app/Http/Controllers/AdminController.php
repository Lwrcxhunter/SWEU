<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\RoleGrant;
use App\Models\User;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        if ($this->wantsOnlyGlobalProps($request, 'Admin/Users', ['users', 'roles', 'colleges', 'grants', 'allowedPermissions'])) {
            return Inertia::render('Admin/Users', []);
        }

        return Inertia::render('Admin/Users', ['users' => User::orderBy('full_name')->paginate(20)->through(fn ($u) => Views::user($u) + ['active' => $u->active]),
            'roles' => config('guidance.roles'), 'colleges' => config('guidance.colleges'),
            'grants' => RoleGrant::all()->map(fn ($r) => ['role' => $r->name, 'permissions' => $r->permissions]),
            'allowedPermissions' => config('guidance.permissions')]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['full_name' => 'required|string|max:150',
            'email' => ['required', 'email:strict', 'lowercase', 'not_regex:/[\r\n]/', 'max:255', 'unique:users'],
            'password' => ['required', Password::defaults()], 'role' => ['required', Rule::in(config('guidance.roles'))],
            'designation' => 'nullable|string|max:150']);
        User::create($data + ['active' => true, 'college_codes' => [], 'on_duty' => false, 'available' => false]);

        return back()->with('success', 'Account created. Share its credentials through an approved private channel.');
    }

    public function update(Request $request, string $user)
    {
        $validCodes = array_merge(array_column(config('guidance.colleges'), 'code'), ['COB']);
        $data = $request->validate(['role' => ['required', Rule::in(config('guidance.roles'))],
            'active' => 'required|boolean', 'college_codes' => 'present|array',
            'college_codes.*' => ['string', 'distinct', Rule::in($validCodes)],
            'designation' => 'nullable|string|max:150',
            'on_duty' => 'required|boolean', 'available' => 'required|boolean']);
        DB::transaction(function () use ($request, $user, $data) {
            RoleGrant::where('name', 'admin')->increment('revision');
            $actor = User::findOrFail($request->user()->id);
            abort_unless($actor->active && $actor->role === 'admin', 403);
            $record = User::findOrFail(Ids::object($user));
            if (Ids::same($record->id, $actor->id) && ($data['role'] !== 'admin' || ! $data['active'])) {
                throw ValidationException::withMessages(['role' => 'You cannot disable or demote your own administrator account.']);
            }
            if ($record->role === 'admin' && ($data['role'] !== 'admin' || ! $data['active']) && User::where('role', 'admin')->where('active', true)->count() <= 1) {
                throw ValidationException::withMessages(['role' => 'At least one active administrator is required.']);
            }
            if ($record->role === 'counselor' && ($data['role'] !== 'counselor' || ! $data['active'])
                && Appointment::where('counselor_id', Ids::object($record->id))->whereIn('status', ['assigned', 'accepted'])->exists()) {
                throw ValidationException::withMessages(['role' => 'Resolve this counselor’s active appointments before disabling or changing their role.']);
            }
            if ($data['role'] !== 'counselor') {
                $data = [...$data, 'college_codes' => [], 'designation' => null, 'on_duty' => false, 'available' => false];
            }
            $record->update($data);
        });

        return back()->with('success', 'Account and college mappings updated.');
    }

    public function permissions(Request $request, string $role)
    {
        abort_unless(in_array($role, config('guidance.roles')), 404);
        $allowed = config('guidance.permissions.'.$role);
        $data = $request->validate(['permissions' => 'present|array', 'permissions.*' => ['string', 'distinct', Rule::in($allowed)]]);
        if ($role === 'admin' && array_diff($allowed, $data['permissions'])) {
            throw ValidationException::withMessages(['permissions' => 'Administrator recovery permissions must remain enabled.']);
        }
        RoleGrant::where('name', $role)->update(['permissions' => $data['permissions']]);

        return back()->with('success', 'Role permissions updated.');
    }

    public function availability(Request $request)
    {
        $data = $request->validate(['on_duty' => 'required|boolean', 'available' => 'required|boolean']);
        $request->user()->update($data);

        return back()->with('success', 'Availability updated.');
    }
}
