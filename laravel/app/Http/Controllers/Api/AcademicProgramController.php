<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicProgramController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $allPrograms = config('guidance.programs', []);
        $college = $request->query('college');

        if ($college) {
            $programs = $allPrograms[$college] ?? $allPrograms[strtoupper($college)] ?? [];

            return response()->json($programs);
        }

        return response()->json($allPrograms);
    }

    public function index(Request $request): JsonResponse
    {
        return $this->__invoke($request);
    }
}
