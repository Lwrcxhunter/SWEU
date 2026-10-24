<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Counselor session log</title>
    <style>
        body { color: #172033; font: 14px Arial, sans-serif; margin: 32px; }
        h1 { font-size: 20px; margin-bottom: 6px; }
        p { color: #475569; margin-top: 0; }
        table { border-collapse: collapse; margin-top: 24px; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        th { background: #e0f2fe; }
        @media print { body { margin: 12mm; } }
    </style>
</head>
<body>
    <h1>Counselor session log</h1>
    <p>{{ $from }} through {{ $to }}</p>
    <table>
        <thead>
            <tr>@foreach ($columns as $column)<th>{{ $column }}</th>@endforeach</tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>@foreach ($row as $value)<td>{{ $value }}</td>@endforeach</tr>
            @empty
                <tr><td colspan="{{ count($columns) }}">No sessions in this date range.</td></tr>
            @endforelse
        </tbody>
    </table>
    <script>window.addEventListener("load", () => window.setTimeout(() => window.print(), 250));</script>
</body>
</html>
