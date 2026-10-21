<?php

use App\Http\Middleware\ActiveAccount;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use MongoDB\Driver\Exception\BulkWriteException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias(['role' => RoleMiddleware::class, 'permission' => PermissionMiddleware::class]);
        $middleware->web(append: [ActiveAccount::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (BulkWriteException $e, Request $request) {
            if ($e->getCode() !== 11000) {
                return null;
            }
            if ($request->expectsJson()) {
                return response()->json(['message' => 'This record or appointment slot already exists. Refresh and try again.', 'errors' => ['conflict' => ['This record or appointment slot already exists.']]], 422);
            }

            return back()->withErrors(['conflict' => 'This record or appointment slot already exists. Refresh and try again.']);
        });
        $exceptions->dontReport([BulkWriteException::class]);
        $exceptions->dontFlash(['password', 'password_confirmation', 'notes', 'reason', 'personal_concerns', 'living_condition', 'medical_history', 'address', 'dob']);
    })->create();
