<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Referral;
use App\Models\TestingRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from']);
        $from = $data['from'] ?? now()->startOfMonth()->toDateString();
        $to = $data['to'] ?? today()->toDateString();
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->endOfDay();
        $rows = [];
        foreach ([Appointment::class => ['pending', 'assigned', 'accepted', 'completed', 'cancelled'],
            Referral::class => ['submitted', 'under_review', 'action_taken', 'closed'],
            TestingRequest::class => ['pending', 'approved', 'completed']] as $model => $statuses) {
            foreach ($statuses as $status) {
                $rows[] = ['service' => class_basename($model), 'status' => $status,
                    'count' => $model::whereBetween('created_at', [$start, $end])->where('status', $status)->count()];
            }
        }
        if ($request->boolean('download')) {
            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Service', 'Status', 'Count'], ',', '"', '');
                foreach ($rows as $row) {
                    fputcsv($out, array_values($row), ',', '"', '');
                }
                fclose($out);
            }, 'guidance-summary.csv', ['Content-Type' => 'text/csv', 'Cache-Control' => 'no-store']);
        }

        return Inertia::render('Staff/Reports', compact('rows', 'from', 'to'));
    }
}
