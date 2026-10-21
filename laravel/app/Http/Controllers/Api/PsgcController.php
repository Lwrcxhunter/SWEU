<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PsgcService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PsgcController extends Controller
{
    public function __construct(protected PsgcService $psgc)
    {
    }

    public function provinces(): JsonResponse
    {
        return response()->json($this->psgc->getProvinces());
    }

    public function cities(Request $request): JsonResponse
    {
        $province = (string) ($request->query('province') ?? $request->query('province_code') ?? '');

        return response()->json($this->psgc->getCitiesMunicipalities($province));
    }

    public function citiesMunicipalities(Request $request): JsonResponse
    {
        return $this->cities($request);
    }

    public function barangays(Request $request): JsonResponse
    {
        $city = (string) ($request->query('city') ?? $request->query('city_code') ?? '');

        return response()->json($this->psgc->getBarangays($city));
    }
}
