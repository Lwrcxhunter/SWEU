<?php

namespace App\Services;

use App\Models\RoleGrant;
use Illuminate\Support\Facades\DB;

class DatabaseSetup
{
    public function run(): void
    {
        $db = DB::connection('mongodb')->getDatabase();
        foreach (['users', 'students', 'appointments', 'counseling_cases', 'counseling_case_sequences', 'counseling_sessions', 'counselor_schedules', 'audit_logs', 'referrals', 'testing_requests', 'office_alerts', 'role_grants'] as $name) {
            if (! in_array($name, iterator_to_array($db->listCollectionNames()))) {
                $db->createCollection($name);
            }
        }
        $db->users->createIndex(['email' => 1], ['unique' => true]);
        $db->students->createIndex(['user_id' => 1], ['unique' => true]);
        $db->students->createIndex(['school_id_number' => 1], ['unique' => true]);
        $db->appointments->createIndex(['slot_key' => 1], ['unique' => true, 'partialFilterExpression' => ['slot_key' => ['$type' => 'string']]]);
        $db->appointments->createIndex(['counselor_id' => 1, 'scheduled_date' => 1]);
        $db->appointments->createIndex(['student_id' => 1, 'created_at' => -1]);
        $db->appointments->createIndex(['status' => 1, 'urgency_level' => -1, 'created_at' => 1]);
        $db->counseling_sessions->createIndex(['appointment_id' => 1], ['unique' => true]);
        $db->counseling_sessions->createIndex(
            ['case_id' => 1, 'session_number' => 1],
            [
                'unique' => true,
                'partialFilterExpression' => [
                    'case_id' => ['$type' => 'objectId'],
                    'session_number' => ['$type' => 'int'],
                ],
            ],
        );
        $db->counseling_cases->createIndex(['case_number' => 1], ['unique' => true]);
        $db->counseling_cases->createIndex(['appointment_id' => 1], ['unique' => true]);
        $db->counseling_cases->createIndex(['counselor_id' => 1, 'status' => 1]);
        $db->counseling_sessions->createIndex(['counselor_id' => 1, 'is_flagged_for_followup' => 1, 'next_followup_date' => 1]);
        $db->counselor_schedules->createIndex(['counselor_id' => 1], ['unique' => true]);
        $db->audit_logs->createIndex(['actor_id' => 1, 'created_at' => -1]);
        $db->audit_logs->createIndex(['session_id' => 1, 'created_at' => -1]);
        $db->referrals->createIndex(['referrer_id' => 1, 'created_at' => -1]);
        $db->referrals->createIndex(['student_id' => 1, 'status' => 1]);
        $db->testing_requests->createIndex(['student_id' => 1, 'created_at' => -1]);
        $db->office_alerts->createIndex(['user_id' => 1, 'created_at' => -1]);
        $db->role_grants->createIndex(['name' => 1], ['unique' => true]);
        foreach (config('guidance.permissions') as $role => $permissions) {
            RoleGrant::firstOrCreate(['name' => $role], ['permissions' => $permissions, 'revision' => 0]);
        }
    }
}
