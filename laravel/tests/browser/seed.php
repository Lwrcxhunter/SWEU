<?php

use App\Models\User;
use App\Services\DatabaseSetup;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.connections.mongodb.database') !== 'buksu_guidance_browser_test'
    || ! str_starts_with(config('database.connections.mongodb.dsn'), 'mongodb://127.0.0.1:27028/')) {
    throw new RuntimeException('Browser fixtures require the isolated loopback browser-test database.');
}
$db = DB::connection()->getDatabase();
foreach (['users', 'students', 'appointments', 'counseling_sessions', 'testing_requests', 'office_alerts', 'role_grants'] as $collection) {
    $db->selectCollection($collection)->deleteMany([]);
}
app(DatabaseSetup::class)->run();
foreach (['student', 'faculty', 'staff', 'counselor', 'admin'] as $role) {
    User::create(['full_name' => ucfirst($role).' Browser Test', 'email' => $role.'@browser.test',
        'password' => 'BrowserTestPassword123!', 'role' => $role, 'active' => true,
        'college_codes' => $role === 'counselor' ? ['CAS', 'COB'] : [], 'on_duty' => $role === 'counselor', 'available' => $role === 'counselor']);
}
echo "Isolated browser fixtures ready.\n";
