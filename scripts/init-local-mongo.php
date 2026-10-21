<?php

require __DIR__.'/../laravel/vendor/autoload.php';

// Local development only: this URI is intentionally independent of production .env.
$client = new MongoDB\Client('mongodb://127.0.0.1:27028/?directConnection=true');
try {
    $client->admin->command(['replSetGetStatus' => 1])->toArray();
    echo "Local replica set is ready.\n";
} catch (MongoDB\Driver\Exception\CommandException $e) {
    if ($e->getCode() !== 94) {
        throw $e;
    }
    $client->admin->command(['replSetInitiate' => ['_id' => 'guidance', 'members' => [['_id' => 0, 'host' => '127.0.0.1:27028']]]])->toArray();
    echo "Local replica set initialized.\n";
}
