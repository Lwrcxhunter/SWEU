<?php

namespace App\Support;

use MongoDB\BSON\ObjectId;

class Ids
{
    public static function object(string|ObjectId $id): ObjectId
    {
        abort_unless($id instanceof ObjectId || preg_match('/^[a-f0-9]{24}$/i', $id), 404);

        return $id instanceof ObjectId ? $id : new ObjectId($id);
    }

    public static function same($left, $right): bool
    {
        return $left !== null && $right !== null && (string) $left === (string) $right;
    }
}
