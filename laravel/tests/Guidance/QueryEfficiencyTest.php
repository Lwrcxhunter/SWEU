<?php

namespace Tests\Guidance;

use App\Models\RoleGrant;
use App\Support\Views;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\ObjectId;

class QueryEfficiencyTest extends GuidanceTestCase
{
    public function test_permission_checks_reuse_one_role_lookup_per_request_and_revocations_are_fresh(): void
    {
        $staff = $this->user('staff');
        $db = DB::connection();
        $db->enableQueryLog();
        try {
            $this->actingAs($staff)->get('/queue')->assertOk();
            $this->assertCount(1, collect($db->getQueryLog())->filter(
                fn ($query) => str_contains($query['query'], 'role_grants'),
            ));
            RoleGrant::where('name', 'staff')->update(['permissions' => []]);
            $db->flushQueryLog();
            $this->get('/queue')->assertForbidden();
            $this->assertCount(1, collect($db->getQueryLog())->filter(
                fn ($query) => str_contains($query['query'], 'role_grants'),
            ));
        } finally {
            $db->disableQueryLog();
            $db->flushQueryLog();
        }
    }

    public function test_batch_hydration_does_not_retry_missing_relations(): void
    {
        $counselor = $this->user('counselor');
        $student = $this->student();
        $missingUser = $this->student();
        $missingUser->update(['user_id' => new ObjectId]);
        $rows = collect();
        for ($index = 0; $index < 12; $index++) {
            $row = $this->appointment($counselor, $index % 2 ? $missingUser : $student);
            if ($index % 3 === 0) {
                $row->update(['student_id' => new ObjectId]);
            }
            if ($index % 2) {
                $row->update(['counselor_id' => new ObjectId]);
            }
            $rows->push($row);
        }
        $db = DB::connection();
        $db->enableQueryLog();
        try {
            $result = Views::appointments($rows);
            $this->assertCount(2, $db->getQueryLog());
            $this->assertNull($result[0]['student']);
            $this->assertSame('Unavailable account', $result[1]['student']['full_name']);
            $this->assertNull($result[1]['counselor_name']);
            $this->assertSame((string) $student->id, $result[2]['student']['id']);
            $this->assertSame($counselor->full_name, $result[2]['counselor_name']);
            $db->flushQueryLog();
            $page = new \Illuminate\Pagination\LengthAwarePaginator($rows, 30, 12, 1);
            $resultPage = Views::appointments($page);
            $this->assertSame($page, $resultPage);
            $this->assertSame(30, $resultPage->total());
            $this->assertCount(2, $db->getQueryLog());
        } finally {
            $db->disableQueryLog();
            $db->flushQueryLog();
        }
    }

    public function test_individual_appointment_still_resolves_relations(): void
    {
        $counselor = $this->user('counselor');
        $student = $this->student();
        $appointment = $this->appointment($counselor, $student);
        $result = Views::appointment($appointment);
        $this->assertSame((string) $student->id, $result['student']['id']);
        $this->assertSame($counselor->full_name, $result['counselor_name']);
    }
}
