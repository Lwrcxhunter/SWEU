<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PsgcService
{
    private const BASE_URL = 'https://psgc.gitlab.io/api';

    public function getProvinces(): array
    {
        return Cache::remember('psgc_provinces', 86400, function () {
            try {
                $response = Http::timeout(3)->get(self::BASE_URL . '/provinces.json');
                if ($response->successful()) {
                    return collect($response->json())->map(fn ($p) => [
                        'code' => $p['code'] ?? '',
                        'name' => $p['name'] ?? '',
                    ])->sortBy('name')->values()->all();
                }
            } catch (\Throwable) {
            }

            return $this->fallbackProvinces();
        });
    }

    public function getCitiesMunicipalities(string $provinceCodeOrName): array
    {
        $cacheKey = 'psgc_cities_' . md5($provinceCodeOrName);

        return Cache::remember($cacheKey, 86400, function () use ($provinceCodeOrName) {
            // Find code if name was passed
            $province = collect($this->getProvinces())->first(function ($p) use ($provinceCodeOrName) {
                return strcasecmp($p['code'], $provinceCodeOrName) === 0
                    || strcasecmp($p['name'], $provinceCodeOrName) === 0;
            });

            $code = $province['code'] ?? $provinceCodeOrName;
            $name = $province['name'] ?? $provinceCodeOrName;

            if (strcasecmp($name, 'Bukidnon') === 0 || str_starts_with($code, '1013')) {
                return $this->bukidnonCities();
            }

            if (!empty($code) && is_numeric($code)) {
                try {
                    $response = Http::timeout(3)->get(self::BASE_URL . "/provinces/{$code}/cities-municipalities.json");
                    if ($response->successful()) {
                        return collect($response->json())->map(fn ($c) => [
                            'code' => $c['code'] ?? '',
                            'name' => $c['name'] ?? '',
                            'zip_code' => $c['zip_code'] ?? '',
                        ])->sortBy('name')->values()->all();
                    }
                } catch (\Throwable) {
                }
            }

            return $this->genericCities($name);
        });
    }

    public function getBarangays(string $cityCodeOrName): array
    {
        $cacheKey = 'psgc_barangays_' . md5($cityCodeOrName);

        return Cache::remember($cacheKey, 86400, function () use ($cityCodeOrName) {
            if (strcasecmp($cityCodeOrName, 'Malaybalay City') === 0 || strcasecmp($cityCodeOrName, 'City of Malaybalay') === 0 || $cityCodeOrName === '101312000') {
                return $this->malaybalayBarangays();
            }

            if (strcasecmp($cityCodeOrName, 'Valencia City') === 0 || strcasecmp($cityCodeOrName, 'City of Valencia') === 0 || $cityCodeOrName === '101321000') {
                return $this->valenciaBarangays();
            }

            if (is_numeric($cityCodeOrName)) {
                try {
                    $response = Http::timeout(3)->get(self::BASE_URL . "/cities-municipalities/{$cityCodeOrName}/barangays.json");
                    if ($response->successful()) {
                        return collect($response->json())->map(fn ($b) => [
                            'code' => $b['code'] ?? '',
                            'name' => $b['name'] ?? '',
                        ])->sortBy('name')->values()->all();
                    }
                } catch (\Throwable) {
                }
            }

            return $this->genericBarangays($cityCodeOrName);
        });
    }

    private function fallbackProvinces(): array
    {
        $list = [
            'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique', 'Apayao', 'Aurora',
            'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol', 'Bukidnon',
            'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes',
            'Cavite', 'Cebu', 'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur',
            'Davao Occidental', 'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao',
            'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga', 'La Union', 'Laguna',
            'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao del Norte', 'Maguindanao del Sur',
            'Marinduque', 'Masbate', 'Metro Manila', 'Misamis Occidental', 'Misamis Oriental',
            'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar', 'Nueva Ecija',
            'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Pampanga', 'Pangasinan',
            'Quezon', 'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon',
            'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte',
            'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte',
            'Zamboanga del Sur', 'Zamboanga Sibugay',
        ];

        return collect($list)->map(fn ($name, $i) => [
            'code' => str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
            'name' => $name,
        ])->sortBy('name')->values()->all();
    }

    private function bukidnonCities(): array
    {
        return [
            ['code' => '101301000', 'name' => 'Baungon', 'zip_code' => '8707'],
            ['code' => '101302000', 'name' => 'Cabanglasan', 'zip_code' => '8723'],
            ['code' => '101303000', 'name' => 'Damulog', 'zip_code' => '8721'],
            ['code' => '101304000', 'name' => 'Dangcagan', 'zip_code' => '8719'],
            ['code' => '101305000', 'name' => 'Don Carlos', 'zip_code' => '8712'],
            ['code' => '101306000', 'name' => 'Impasug-ong', 'zip_code' => '8702'],
            ['code' => '101307000', 'name' => 'Kadingilan', 'zip_code' => '8713'],
            ['code' => '101308000', 'name' => 'Kalilangan', 'zip_code' => '8718'],
            ['code' => '101309000', 'name' => 'Kibawe', 'zip_code' => '8720'],
            ['code' => '101310000', 'name' => 'Kitaotao', 'zip_code' => '8716'],
            ['code' => '101311000', 'name' => 'Lantapan', 'zip_code' => '8722'],
            ['code' => '101312000', 'name' => 'Libona', 'zip_code' => '8706'],
            ['code' => '101313000', 'name' => 'Malaybalay City', 'zip_code' => '8700'],
            ['code' => '101314000', 'name' => 'Malitbog', 'zip_code' => '8704'],
            ['code' => '101315000', 'name' => 'Manolo Fortich', 'zip_code' => '8703'],
            ['code' => '101316000', 'name' => 'Maramag', 'zip_code' => '8714'],
            ['code' => '101317000', 'name' => 'Pangantucan', 'zip_code' => '8717'],
            ['code' => '101318000', 'name' => 'Quezon', 'zip_code' => '8715'],
            ['code' => '101319000', 'name' => 'San Fernando', 'zip_code' => '8711'],
            ['code' => '101320000', 'name' => 'Sumilao', 'zip_code' => '8701'],
            ['code' => '101321000', 'name' => 'Talakag', 'zip_code' => '8708'],
            ['code' => '101322000', 'name' => 'Valencia City', 'zip_code' => '8709'],
        ];
    }

    private function malaybalayBarangays(): array
    {
        $b = [
            'Aglayan', 'Bangcud', 'Busdi', 'Cabangahan', 'Can-ayan', 'Capitan Angel', 'Casisang',
            'Dalwangan', 'Imbayao', 'Indalasa', 'Kalasungay', 'Kulaman', 'Kibalabag', 'Laguitas',
            'Linabo', 'Mampayag', 'Manding', 'Mapayag', 'Mapulo', 'Miglamin', 'Patpat',
            'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Poblacion 5',
            'Poblacion 6', 'Poblacion 7', 'Poblacion 8', 'Poblacion 9', 'Poblacion 10',
            'Poblacion 11', 'San Jose', 'San Martin', 'Santo Niño', 'Sila-e', 'Simaya',
            'Sinanglanan', 'Sumpong', 'Violeta', 'Zamboanguita',
        ];

        return collect($b)->map(fn ($name, $i) => [
            'code' => '101313' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
            'name' => $name,
        ])->sortBy('name')->values()->all();
    }

    private function valenciaBarangays(): array
    {
        $b = [
            'Bagontaas', 'Banlag', 'Barobo', 'Batangan', 'Catumbalon', 'Colonia', 'Concepcion',
            'Dagat-Kidavao', 'Guinoyoran', 'Kahaponan', 'Laligan', 'Lilingayon', 'Lourdes',
            'Lumbayao', 'Lurogan', 'Maapag', 'Mabuhay', 'Mailag', 'Mt. Nebo', 'Nabag-o',
            'Poblacion', 'San Carlos', 'San Isidro', 'Sugod', 'Tongantongan', 'Tugaya', 'Vintar',
        ];

        return collect($b)->map(fn ($name, $i) => [
            'code' => '101322' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
            'name' => $name,
        ])->sortBy('name')->values()->all();
    }

    private function genericCities(string $provinceName): array
    {
        return [
            ['code' => 'GEN01', 'name' => "{$provinceName} Capital", 'zip_code' => '8000'],
            ['code' => 'GEN02', 'name' => "{$provinceName} North District", 'zip_code' => '8001'],
            ['code' => 'GEN03', 'name' => "{$provinceName} South District", 'zip_code' => '8002'],
        ];
    }

    private function genericBarangays(string $cityName): array
    {
        return [
            ['code' => 'B01', 'name' => 'Poblacion'],
            ['code' => 'B02', 'name' => 'Barangay 1'],
            ['code' => 'B03', 'name' => 'Barangay 2'],
            ['code' => 'B04', 'name' => 'Central'],
        ];
    }
}
