<?php

namespace Database\Seeders;

use App\Services\DatabaseSetup;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(DatabaseSetup::class)->run();
    }
}
