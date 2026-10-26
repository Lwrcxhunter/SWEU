<?php

return [
    'default' => 'mongodb',
    'connections' => ['mongodb' => [
        'driver' => 'mongodb',
        'dsn' => env('MONGODB_URI', ''),
        'database' => env('MONGODB_DATABASE', 'buksu_guidance'),
    ]],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
];
