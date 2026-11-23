import { router } from "@inertiajs/react";
import { Calendar, ChevronLeft, ChevronRight, Heart, Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import Office from "@/Components/Office";

const typeMeta = {
    appointment: {
        label: "Appointments",
        bg: "#eaf6ee",
        border: "#287a55",
        text: "#15442f",
        badge: "#ccead7",
    },
    meeting: {
        label: "Meetings",
        bg: "#eaf3fa",
        border: "#3b86c6",
        text: "#1a466b",
        badge: "#cfe3f6",
    },
    workshop: {
        label: "Workshops / Seminars",
        bg: "#fef3e7",
        border: "#df8632",
        text: "#744011",
        badge: "#fde3c7",
    },
    case_conference: {
        label: "Case Conferences",
        bg: "#f3edfa",
        border: "#8c65cb",
        text: "#462e73",
        badge: "#e4d5f8",
    },
    other: {
        label: "Other",
        bg: "#f1f3f2",
        border: "#6f827a",
        text: "#333f3a",
        badge: "#dde3e0",
    },
};

const dateLabel = (value, options) =>
    new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T12:00:00`));

const timeLabel = (value) =>
    new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(value));

function MiniCalendar({ miniCalendar, date, onSelect }) {
    return (
        <section className="rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)]">
            <h2 className="text-sm font-bold text-sage-900">{miniCalendar.month}</h2>
            <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[10px] text-[#718078]">
                {["S", "M", "T", "W", "T", "F", "S"].map((item, index) => (
                    <span key={`${item}-${index}`} className="font-semibold">
                        {item}
                    </span>
                ))}
                {miniCalendar.days.map((item) => (
                    !item.inMonth ? <span key={item.date} className="h-8 w-8" /> : <button
                        key={item.date}
                        type="button"
                        onClick={() => onSelect(item.date)}
                        aria-label={`${dateLabel(item.date, { month: "long", day: "numeric", year: "numeric" })}${
                            item.activityCount
                                ? `, ${item.activityCount} activit${item.activityCount === 1 ? "y" : "ies"}`
                                : ""
                        }`}
                        className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full text-xs transition font-medium ${
                            item.selected
                                ? "bg-[#18453b] font-bold text-white shadow-sm ring-2 ring-[#18453b]/30 ring-offset-1"
                                : item.isFull
                                  ? "bg-[#d96b62] font-semibold text-white"
                                  : item.activityCount > 0
                                    ? "bg-[#315C52] font-semibold text-white"
                                    : item.inMonth
                                      ? "text-sage-900 hover:bg-sage-100"
                                      : "text-[#c7cbc5]"
                        }`}
                    >
                        {item.day}
                    </button>
                ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] text-[#718078]">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#18453b]" />
                    Selected
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sage-600" />
                    Has activities
                </span>
            </div>
        </section>
    );
}

function Filters({ types, onChange }) {
    const allTypes = Object.keys(typeMeta);
    return (
        <section className="rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)]">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-sage-900">Quick Filters</h2>
                <button
                    type="button"
                    onClick={() => onChange(allTypes)}
                    className="text-xs font-semibold text-sage-700 hover:text-sage-900 hover:underline"
                >
                    Clear All
                </button>
            </div>
            <div className="mt-4 space-y-3">
                {Object.entries(typeMeta).map(([type, meta]) => {
                    const isChecked = types.includes(type);
                    return (
                        <label
                            key={type}
                            className="flex cursor-pointer items-center gap-3 text-xs font-medium text-[#465a52] transition hover:text-sage-900"
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                    onChange(
                                        isChecked
                                            ? types.filter((item) => item !== type)
                                            : [...types, type]
                                    )
                                }
                                className="h-4 w-4 rounded border-[#cbd8d0] text-[#18453b] focus:ring-[#18453b]"
                            />
                            {meta.label}
                        </label>
                    );
                })}
            </div>
        </section>
    );
}

function WellnessCard() {
    return (
        <div className="relative mt-8 flex items-center justify-between overflow-hidden rounded-2xl bg-[#f4efe6] px-6 py-5 shadow-sm border border-[#ede5d8]">
            <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e8dece]/60 text-2xl">
                    🌿
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-800">Take care of yourself.</h4>
                    <p className="text-xs text-gray-500">Your well-being matters too.</p>
                </div>
            </div>
            <Heart className="h-6 w-6 text-[#18453b]" fill="currentColor" />
        </div>
    );
}

/**
 * DAY VIEW:
 * Displays schedule by time list for activities only (no blank time slots).
 * e.g., 8:00 AM – 9:00 AM : Counseling
 */
function DayView({ events }) {
    if (!events.length) {
        return (
            <div className="py-16 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-50 text-sage-600">
                    <Calendar className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-sage-900">No activities scheduled</p>
                <p className="mt-1 text-xs text-gray-500">There are no appointments or events for this day.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => {
                const meta = typeMeta[event.type] || typeMeta.other;
                const timeString = `${timeLabel(event.start)} – ${timeLabel(event.end)}`;
                return (
                    <div
                        key={event.id}
                        className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center"
                    >
                        <span className="text-xs font-bold text-[#576b63] sm:text-right sm:pr-2">
                            {timeString}
                        </span>
                        <div
                            className="rounded-xl px-5 py-4 shadow-[0_2px_8px_rgba(47,93,80,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            style={{
                                backgroundColor: meta.bg,
                                borderLeft: `5px solid ${meta.border}`,
                            }}
                        >
                            <p
                                className="text-[11px] font-bold tracking-wide uppercase"
                                style={{ color: meta.border }}
                            >
                                {timeString}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-900">
                                {event.title}
                            </p>
                            {event.location && (
                                <p className="mt-1 text-xs text-gray-600">
                                    {event.location}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * WEEK VIEW:
 * Displays the day of the week (Monday, Tuesday, Wednesday, Thursday, Friday).
 * Displays ONLY the name of the activity for each day (no time, no location).
 */
function WeekView({ groups }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {groups.map((group) => (
                <div
                    key={group.label}
                    className="flex flex-col rounded-xl border border-[#e4ebe6] bg-[#fbfcfb] shadow-[0_2px_6px_rgba(47,93,80,0.04)]"
                >
                    <div className="border-b border-[#e4ebe6] bg-[#f2f6f4] px-3.5 py-3 text-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-sage-900">
                            {group.label}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                            {group.date ? dateLabel(group.date, { month: "short", day: "numeric" }) : ""}
                        </p>
                    </div>
                    <div className="flex-1 p-2.5 space-y-2 min-h-[160px]">
                        {group.events && group.events.length > 0 ? (
                            group.events.map((event) => {
                                const meta = typeMeta[event.type] || typeMeta.other;
                                return (
                                    <div
                                        key={event.id}
                                        className="rounded-lg px-3 py-2.5 text-xs font-semibold leading-snug shadow-sm transition hover:shadow"
                                        style={{
                                            backgroundColor: meta.bg,
                                            borderLeft: `4px solid ${meta.border}`,
                                            color: meta.text,
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex h-full items-center justify-center py-8">
                                <p className="text-center text-[11px] text-gray-400">
                                    No activities
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * MONTH VIEW:
 * Displays by week: Week 1, Week 2, Week 3, Week 4.
 * Displays ONLY the activities in that week (no time, no day).
 * Broader overview as user zooms out.
 */
function MonthView({ groups }) {
    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <div
                    key={group.label}
                    className="rounded-xl border border-[#e4ebe6] bg-[#fbfcfb] p-4 shadow-[0_2px_8px_rgba(47,93,80,0.04)]"
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e4ebe6] pb-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="rounded-md bg-[#18453b] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                                {group.label}
                            </span>
                            {group.range && (
                                <span className="text-xs font-medium text-gray-500">
                                    {group.range}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-sage-800">
                            {group.events?.length || 0} {group.events?.length === 1 ? "activity" : "activities"}
                        </span>
                    </div>

                    {group.events && group.events.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {group.events.map((event) => {
                                const meta = typeMeta[event.type] || typeMeta.other;
                                return (
                                    <div
                                        key={event.id}
                                        className="inline-flex items-center rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:scale-[1.02]"
                                        style={{
                                            backgroundColor: meta.bg,
                                            borderLeft: `4px solid ${meta.border}`,
                                            color: meta.text,
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-2 text-xs text-gray-400">
                            No activities scheduled for this week
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Schedule({
    view = "day",
    date,
    label,
    filters,
    events = [],
    groups = [],
    miniCalendar,
    counts = {},
}) {
    const [activeTypes, setActiveTypes] = useState(filters?.types || Object.keys(typeMeta));
    const enabled = activeTypes.length ? activeTypes : Object.keys(typeMeta);

    const navigate = (nextView, nextDate, nextTypes = enabled) =>
        router.get(
            "/schedule",
            { view: nextView, date: nextDate, types: nextTypes },
            { preserveState: true, preserveScroll: true, replace: true }
        );

    const shiftDate = (amount) => {
        const current = new Date(`${date}T12:00:00`);
        if (view === "day") current.setDate(current.getDate() + amount);
        if (view === "week") current.setDate(current.getDate() + amount * 7);
        if (view === "month") current.setMonth(current.getMonth() + amount);
        navigate(view, current.toISOString().slice(0, 10));
    };

    const setTypes = (next) => {
        setActiveTypes(next);
        navigate(view, date, next);
    };

    const title = useMemo(() => label, [label]);

    return (
        <Office
            title="My Schedule"
            eyebrow="Counselor workspace"
            description="View your daily, weekly, and monthly schedule of appointments and activities."
            action={null}
            backgroundImage="/images/dashboardbg.png"
        >
            {/* Top Navigation & Controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(view, new Date().toISOString().slice(0, 10))}
                        className="rounded-lg border border-[#d6e0d9] bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:border-gray-300"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        aria-label="Previous period"
                        onClick={() => shiftDate(-1)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6e0d9] bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next period"
                        onClick={() => shiftDate(1)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6e0d9] bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <strong className="ml-3 text-base font-bold text-gray-900 tracking-tight">
                        {title}
                    </strong>
                </div>

                {/* View toggle segmented control */}
                <div className="flex rounded-lg bg-gray-100/90 p-1 shadow-inner border border-gray-200/80">
                    {["day", "week", "month"].map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => navigate(item, date)}
                            className={`rounded-md px-5 py-1.5 text-xs font-bold capitalize transition duration-150 ${
                                view === item
                                    ? "bg-[#18453b] text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Schedule 2-Column Layout */}
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                {/* Left Panel: Mini Calendar & Quick Filters */}
                <aside className="space-y-5">
                    <MiniCalendar
                        miniCalendar={miniCalendar}
                        date={date}
                        onSelect={(nextDate) => navigate(view, nextDate)}
                    />
                    <Filters types={activeTypes} onChange={setTypes} />
                </aside>

                {/* Right Panel: Day/Week/Month Content + Wellness Banner */}
                <section className="flex flex-col justify-between rounded-2xl bg-cream p-6 shadow-[0_8px_28px_rgba(47,93,80,0.07)] transition-opacity duration-200">
                    <div className="flex-1">
                        {view === "day" && <DayView events={events} />}
                        {view === "week" && <WeekView groups={groups} />}
                        {view === "month" && <MonthView groups={groups} />}
                    </div>
                    <WellnessCard />
                </section>
            </div>
        </Office>
    );
}
