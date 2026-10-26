import { router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, Heart, Leaf } from "lucide-react";
import { useMemo, useState } from "react";
import Office from "@/Components/Office";

const typeMeta = {
    appointment: { label: "Appointments", bg: "#e3f1e8", border: "#5fa38f" },
    meeting: { label: "Meetings", bg: "#e1edf6", border: "#5b9bd0" },
    workshop: { label: "Workshops / Seminars", bg: "#dcefeb", border: "#4f9c8f" },
    case_conference: { label: "Case Conferences", bg: "#ece6f4", border: "#9b86bd" },
    other: { label: "Other", bg: "#efece4", border: "#b5ada0" },
};

const dateLabel = (value, options) => new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T12:00:00`));
const timeLabel = (value) => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));

function EventCard({ event, day = false }) {
    const meta = typeMeta[event.type] || typeMeta.other;
    return (
        <div className="rounded-xl px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md" style={{ backgroundColor: meta.bg, borderLeft: `4px solid ${meta.border}` }}>
            {day && <p className="text-[11px] font-medium text-sage-700">{timeLabel(event.start)} - {timeLabel(event.end)}</p>}
            <p className="mt-1 text-sm font-semibold text-sage-900">{event.title}</p>
            <p className="mt-1 text-xs text-[#718078]">{event.location}</p>
        </div>
    );
}

function MiniCalendar({ miniCalendar, date, onSelect }) {
    return (
        <section className="rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)]">
            <h2 className="text-sm font-semibold text-sage-900">{miniCalendar.month}</h2>
            <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[10px] text-[#718078]">
                {["M", "T", "W", "T", "F", "S", "S"].map((item, index) => <span key={`${item}-${index}`} className="font-semibold">{item}</span>)}
                {miniCalendar.days.map((item) => (
                    <button
                        key={item.date}
                        type="button"
                        onClick={() => onSelect(item.date)}
                        aria-label={`${dateLabel(item.date, { month: "long", day: "numeric", year: "numeric" })}${item.activityCount ? `, ${item.activityCount} activit${item.activityCount === 1 ? "y" : "ies"}` : ""}`}
                        className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full text-xs transition ${
                            item.isFull
                                ? "bg-[#d96b62] font-semibold text-white"
                                : item.activityCount > 0
                                    ? "bg-sage-700 font-semibold text-white"
                                    : item.inMonth
                                        ? "text-sage-900 hover:bg-sage-100"
                                        : "text-[#c7cbc5]"
                        } ${item.selected ? "ring-2 ring-sage-900 ring-offset-1" : ""}`}
                    >
                        {item.day}
                    </button>
                ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] text-[#718078]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sage-700" />Has activities</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d96b62]" />Full day</span>
            </div>
        </section>
    );
}

function Filters({ types, onChange }) {
    const allSelected = types.length === Object.keys(typeMeta).length;
    return (
        <section className="rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)]">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-sage-900">Quick Filters</h2><button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-sage-700 hover:text-sage-900">Clear All</button></div>
            <div className="mt-4 space-y-3">
                {Object.entries(typeMeta).map(([type, meta]) => <label key={type} className="flex cursor-pointer items-center gap-3 text-xs text-[#53665e]"><input type="checkbox" checked={types.includes(type)} onChange={() => onChange(types.includes(type) ? types.filter((item) => item !== type) : [...types, type])} className="h-4 w-4 rounded border-[#cbd8d0] text-sage-900 focus:ring-sage-700" />{meta.label}</label>)}
            </div>
            {allSelected && <span className="sr-only">All schedule types selected</span>}
        </section>
    );
}

function WellnessCard() {
    return <div className="relative mt-6 flex items-center justify-between overflow-hidden rounded-2xl bg-[#f1eadc] p-5"><Leaf className="absolute -left-2 -bottom-5 h-24 w-24 rotate-[-18deg] text-[#d8c6a9]/70" strokeWidth={1} /><div className="relative pl-12"><p className="text-sm font-semibold text-sage-900">Take care of yourself.</p><p className="mt-1 text-xs text-[#718078]">Your well-being matters too.</p></div><Heart className="h-6 w-6 text-sage-900" fill="currentColor" /></div>;
}

function MainContent({ view, events, groups }) {
    if (view === "day") return events.length ? <div className="space-y-3">{events.map((event) => <div key={event.id} className="grid gap-3 sm:grid-cols-[82px_minmax(0,1fr)] sm:items-start"><span className="pt-3 text-xs font-medium text-[#718078]">{timeLabel(event.start)}</span><EventCard event={event} day /></div>)}</div> : <p className="py-16 text-center text-sm text-[#718078]">No activities scheduled for this day</p>;
    return <div className="space-y-6">{groups.map((group) => <section key={group.label}><div className="mb-3 flex items-baseline gap-2"><h3 className="text-sm font-semibold text-sage-900">{group.label}</h3><span className="text-xs text-[#718078]">{view === "week" ? dateLabel(group.date, { month: "short", day: "numeric" }) : group.range}</span></div>{group.events.length ? <div className={view === "month" ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>{group.events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <p className="text-xs text-[#a0aaa4]">No activities</p>}</section>)}</div>;
}

export default function Schedule({ view = "day", date, label, filters, events = [], groups = [], miniCalendar, counts = {} }) {
    const [activeTypes, setActiveTypes] = useState(filters.types);
    const enabled = activeTypes.length ? activeTypes : [];
    const navigate = (nextView, nextDate, nextTypes = enabled) => router.get("/schedule", { view: nextView, date: nextDate, types: nextTypes }, { preserveState: true, preserveScroll: true, replace: true });
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
        <Office title="My Schedule" eyebrow="Counselor workspace" description="View your daily, weekly, and monthly schedule of appointments and activities." action={null}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><button type="button" onClick={() => navigate(view, new Date().toISOString().slice(0, 10))} className="rounded-lg border border-[#d6e0d9] bg-cream px-4 py-2 text-xs font-semibold text-sage-900">Today</button><button type="button" aria-label="Previous period" onClick={() => shiftDate(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6e0d9] bg-cream text-sage-900"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next period" onClick={() => shiftDate(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d6e0d9] bg-cream text-sage-900"><ChevronRight className="h-4 w-4" /></button><strong className="ml-2 text-sm text-sage-900">{title}</strong></div>
                <div className="flex rounded-lg bg-cream p-1 shadow-sm ring-1 ring-[#d6e0d9]">{["day", "week", "month"].map((item) => <button key={item} type="button" onClick={() => navigate(item, date)} className={`rounded-md px-4 py-2 text-xs font-semibold capitalize transition ${view === item ? "bg-[#1f4d42] text-white" : "text-[#718078] hover:text-sage-900"}`}>{item}</button>)}</div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="space-y-5"><MiniCalendar miniCalendar={miniCalendar} date={date} onSelect={(nextDate) => navigate(view, nextDate)} /><Filters types={activeTypes} onChange={setTypes} /></aside>
                <section className="rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)] transition-opacity duration-200"><MainContent view={view} events={events} groups={groups} /><WellnessCard /></section>
            </div>
        </Office>
    );
}
