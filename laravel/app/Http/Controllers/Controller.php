<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Determine if an Inertia partial reload only requests layout / global shared props (e.g. alerts).
     * If so, controllers can skip heavy database queries.
     */
    protected function wantsOnlyGlobalProps(Request $request, string $component, array $pageProps): bool
    {
        if ($request->header('X-Inertia-Partial-Component') !== $component) {
            return false;
        }

        $only = array_filter(array_map('trim', explode(',', (string) $request->header('X-Inertia-Partial-Data', ''))));
        if (empty($only)) {
            return false;
        }

        return empty(array_intersect($only, $pageProps));
    }
}
