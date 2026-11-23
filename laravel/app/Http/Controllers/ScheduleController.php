<?php

namespace App\Http\Controllers;

use App\Models\ScheduleEvent;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    private const WEEK_STARTS_ON = Carbon::MONDAY;

    private const TYPES = ['appointment', 'meeting', 'workshop', 'case_conference', 'other'];

    public function index(Request $request)
    {
        $data = $request->validate([
            'view' => ['nullable', 'in:day,week,month'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'in:appointment,meeting,workshop,case_conference,other'],
        ]);
        $view = $data['view'] ?? 'day';
        $date = Carbon::parse($data['date'] ?? today(config('app.timezone'))->toDateString(), config('app.timezone'))->startOfDay();
        $types = $data['types'] ?? self::TYPES;
        $bounds = $this->bounds($view, $date);
        $events = ScheduleEvent::forCounselor(Ids::object($request->user()->id))
            ->whereIn('type', $types)
            ->where('start_at', '>=', $bounds[0])
            ->where('start_at', '<', $bounds[1])
            ->orderBy('start_at')
            ->get();

        $miniStart = $date->copy()->startOfMonth()->startOfWeek(Carbon::SUNDAY);
        $miniEnd = $date->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);
        $miniEvents = ScheduleEvent::forCounselor(Ids::object($request->user()->id))
            ->whereIn('type', $types)
            ->where('start_at', '>=', $miniStart)
            ->where('start_at', '<', $miniEnd)
            ->get(['start_at']);
        $eventCounts = $miniEvents
            ->map(fn (ScheduleEvent $event) => $event->start_at->setTimezone(config('app.timezone'))->toDateString())
            ->countBy()
            ->all();

        return Inertia::render('Schedule', [
            'view' => $view,
            'date' => $date->toDateString(),
            'label' => $this->label($view, $date),
            'filters' => ['types' => $types],
            'events' => $view === 'day' ? $events->map(fn (ScheduleEvent $event) => $this->dayEvent($event))->values()->all() : [],
            'groups' => $view === 'week' ? $this->weekGroups($events, $date) : ($view === 'month' ? $this->monthGroups($events, $date) : []),
            'miniCalendar' => $this->miniCalendar($date, $eventCounts),
            'counts' => $this->counts($request->user()->id),
        ]);
    }

    private function bounds(string $view, Carbon $date): array
    {
        if ($view === 'week') {
            $start = $date->copy()->startOfWeek(self::WEEK_STARTS_ON);
            return [$start, $start->copy()->addWeek()];
        }
        if ($view === 'month') {
            $start = $date->copy()->startOfMonth()->startOfWeek(self::WEEK_STARTS_ON);
            return [$start, $date->copy()->endOfMonth()->endOfWeek(self::WEEK_STARTS_ON)->addSecond()];
        }

        return [$date->copy()->startOfDay(), $date->copy()->addDay()];
    }

    private function label(string $view, Carbon $date): string
    {
        return match ($view) {
            'week' => $date->copy()->startOfWeek(self::WEEK_STARTS_ON)->format('M j').' - '.$date->copy()->endOfWeek(self::WEEK_STARTS_ON)->format('M j, Y'),
            'month' => $date->format('F Y'),
            default => $date->format('F j, Y'),
        };
    }

    private function dayEvent(ScheduleEvent $event): array
    {
        $timezone = config('app.timezone');
        return [
            'id' => (string) $event->id,
            'title' => $event->title,
            'type' => $event->type,
            'start' => $event->start_at->setTimezone($timezone)->toIso8601String(),
            'end' => $event->end_at->setTimezone($timezone)->toIso8601String(),
            'location' => $event->location,
        ];
    }

    private function compactEvent(ScheduleEvent $event): array
    {
        return [
            'id' => (string) $event->id,
            'title' => $event->title,
            'type' => $event->type,
            'location' => $event->location,
        ];
    }

    private function weekGroups($events, Carbon $date): array
    {
        $start = $date->copy()->startOfWeek(self::WEEK_STARTS_ON);
        $groups = [];
        for ($offset = 0; $offset < 7; $offset++) {
            $day = $start->copy()->addDays($offset);
            $dayEvents = $events->filter(fn (ScheduleEvent $event) => $event->start_at->setTimezone(config('app.timezone'))->isSameDay($day));
            if ($offset < 5 || $dayEvents->isNotEmpty()) {
                $groups[] = [
                    'label' => $day->format('l'),
                    'date' => $day->toDateString(),
                    'events' => $dayEvents->map(fn (ScheduleEvent $event) => $this->compactEvent($event))->values()->all(),
                ];
            }
        }
        return $groups;
    }

    private function monthGroups($events, Carbon $date): array
    {
        $start = $date->copy()->startOfMonth()->startOfWeek(self::WEEK_STARTS_ON);
        $end = $date->copy()->endOfMonth()->endOfWeek(self::WEEK_STARTS_ON);
        $groups = [];
        $week = 1;
        while ($start->lte($end)) {
            $weekEnd = $start->copy()->addDays(6);
            $weekEvents = $events->filter(function (ScheduleEvent $event) use ($start, $weekEnd) {
                $eventDate = $event->start_at->setTimezone(config('app.timezone'))->toDateString();
                return $eventDate >= $start->toDateString() && $eventDate <= $weekEnd->toDateString();
            });
            $groups[] = [
                'label' => 'Week '.$week,
                'range' => $start->format('M j').' - '.$weekEnd->format('M j'),
                'events' => $weekEvents->map(fn (ScheduleEvent $event) => $this->compactEvent($event))->values()->all(),
            ];
            $start->addWeek();
            $week++;
        }
        return $groups;
    }

    private function miniCalendar(Carbon $date, array $eventCounts): array
    {
        $start = $date->copy()->startOfMonth()->startOfWeek(Carbon::SUNDAY);
        $end = $date->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);
        $days = [];
        while ($start->lte($end)) {
            $days[] = [
                'date' => $start->toDateString(),
                'day' => $start->day,
                'inMonth' => $start->month === $date->month,
                'selected' => $start->isSameDay($date),
                'activityCount' => $eventCounts[$start->toDateString()] ?? 0,
                'isFull' => ($eventCounts[$start->toDateString()] ?? 0) >= 6,
            ];
            $start->addDay();
        }
        return ['month' => $date->format('F Y'), 'days' => $days];
    }

    private function counts($counselorId): array
    {
        return ScheduleEvent::forCounselor(Ids::object($counselorId))->get()->countBy('type')->all();
    }
}
