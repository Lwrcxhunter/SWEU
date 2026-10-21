<?php

namespace App\Services;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PdfApiService
{
    protected ?string $endpoint;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->endpoint = config('services.pdf_api.endpoint', env('PDF_API_ENDPOINT'));
        $this->apiKey = config('services.pdf_api.key', env('PDF_API_KEY'));
    }

    /**
     * Converts HTML to PDF via configured PDF API (PDFShift, CraftMyPDF, or internal Puppeteer),
     * or falls back to print-optimized HTML document with automatic print dialog trigger.
     */
    public function generateFromHtml(string $html, string $filename = 'counseling_intake_form.pdf'): Response
    {
        if (! empty($this->endpoint)) {
            try {
                $req = Http::timeout(25);
                if ($this->apiKey) {
                    $req = $req->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'X-API-KEY' => $this->apiKey,
                    ]);
                }

                // Standard payload compatible with PDFShift, CraftMyPDF, and custom Puppeteer microservices
                $response = $req->post($this->endpoint, [
                    'source' => $html,
                    'html' => $html,
                    'format' => 'A4',
                    'landscape' => false,
                    'use_print' => true,
                    'margin' => [
                        'top' => '0mm',
                        'bottom' => '0mm',
                        'left' => '0mm',
                        'right' => '0mm',
                    ],
                ]);

                if ($response->successful()) {
                    $body = $response->body();
                    $contentType = $response->header('Content-Type');

                    // If API returned binary PDF
                    if (str_contains(strtolower($contentType), 'pdf') || str_starts_with($body, '%PDF-')) {
                        return response($body, 200, [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
                        ]);
                    }
                } else {
                    Log::warning('External PDF API returned non-200 status: ' . $response->status(), [
                        'body' => substr($response->body(), 0, 500),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('PdfApiService connection failed, utilizing print-ready fallback: ' . $e->getMessage());
            }
        }

        // Resilient fallback: High-fidelity document formatted for direct browser printing/PDF saving
        $printableHtml = str_replace(
            '</body>',
            '<script>window.addEventListener("DOMContentLoaded", () => { setTimeout(() => { window.print(); }, 400); });</script></body>',
            $html
        );

        return response($printableHtml, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="' . str_replace('.pdf', '.html', $filename) . '"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }
}
