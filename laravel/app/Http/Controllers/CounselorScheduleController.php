<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CounselorSchedule;
use App\Models\User;
use App\Services\CounselorAvailability;
use App\Services\CounselorSchedules;
use App\Support\Ids;
use App\Support\Views;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CounselorScheduleController extends Controller
{
    public function index(Request $request)
    {
        $schedule = CounselorSchedule::where('counselor_id', Ids::object($request->user()->id))->first();
        $appointments = Appointment::where('counselor_id', Ids::object($request->user()->id))
            ->whereIn('status', CounselorAvailability::ACTIVE_STATUSES)
            ->whereBetween('scheduled_date', [
                today()->subDays(30)->toDateString(),
                today()->addDays(90)->toDateString(),
            ])
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();
        $appointmentViews = collect(Views::appointments($appointments->all()))
            ->map(fn (array $appointment) => [
                'id' => $appointment['id'],
                'case_id' => $appointment['case_id'],
                'student_name' => $appointment['student']['full_name'] ?? 'Unavailable account',
                'scheduled_date' => $appointment['scheduled_date'],
                'scheduled_time' => $appointment['scheduled_time'],
                'type' => $appointment['type'],
                'status' => $appointment['status'],
            ])
            ->values()
            ->all();

        return Inertia::render('Counselor/Schedule', [
            'schedule' => $this->serialize($schedule),
            'appointments' => $appointmentViews,
        ]);
    }

    public function showMine(Request $request)
    {
        $schedule = CounselorSchedule::where('counselor_id', Ids::object($request->user()->id))->first();

        return response()->json(['schedule' => $this->serialize($schedule)]);
    }

    public function update(Request $request, CounselorSchedules $schedules)
    {
        $data = $request->validate([
            'availability' => 'present|array|max:70',
            'availability.*.dayOfWeek' => 'required|integer|between:0,6',
            'availability.*.startTime' => ['required', 'date_format:H:i'],
            'availability.*.endTime' => ['required', 'date_format:H:i'],
            'classSchedule' => 'present|array|max:70',
            'classSchedule.*.dayOfWeek' => 'required|integer|between:0,6',
            'classSchedule.*.startTime' => ['required', 'date_format:H:i'],
            'classSchedule.*.endTime' => ['required', 'date_format:H:i'],
            'classSchedule.*.label' => 'nullable|string|max:120',
            'leaves' => 'present|array|max:100',
            'leaves.*.startDateTime' => ['required', 'date_format:Y-m-d\TH:i'],
            'leaves.*.endDateTime' => ['required', 'date_format:Y-m-d\TH:i'],
            'leaves.*.reason' => 'required|string|max:500',
            'leaves.*.type' => ['required', Rule::in(['planned', 'official'])],
        ]);

        foreach (['availability', 'classSchedule'] as $category) {
            foreach ($data[$category] as $index => $entry) {
                if ($entry['endTime'] <= $entry['startTime']) {
                    return back()->withErrors([$category.'.'.$index.'.endTime' => 'End time must be after start time.']);
                }
            }
        }
        foreach ($data['leaves'] as $index => $leave) {
            if ($leave['endDateTime'] <= $leave['startDateTime']) {
                return back()->withErrors(['leaves.'.$index.'.endDateTime' => 'Leave end must be after its start.']);
            }
        }

        $schedule = $schedules->save((string) $request->user()->id, $data);

        return back()->with('success', 'Counselor schedule saved.')->with('schedule', $this->serialize($schedule));
    }

    public function showForStaff(string $counselor)
    {
        $user = User::findOrFail(Ids::object($counselor));
        abort_unless($user->role === 'counselor', 404);
        $schedule = CounselorSchedule::where('counselor_id', Ids::object($user->id))->first();

        $data = $this->serialize($schedule);
        $data['leaves'] = collect($data['leaves'])->map(fn ($leave) => [
            'startDateTime' => $leave['startDateTime'],
            'endDateTime' => $leave['endDateTime'],
            'type' => $leave['type'],
        ])->all();

        return response()->json(['counselor_id' => (string) $user->id, 'schedule' => $data]);
    }

    private function serialize(?CounselorSchedule $schedule): array
    {
        return [
            'availability' => $schedule?->availability ?? [],
            'classSchedule' => $schedule?->classSchedule ?? [],
            'leaves' => $schedule?->leaves ?? [],
        ];
    }
}
