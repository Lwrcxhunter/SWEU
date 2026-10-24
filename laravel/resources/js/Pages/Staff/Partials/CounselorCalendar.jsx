import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const styles = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-900",
    in_class: "border-blue-200 bg-blue-50 text-blue-900",
    on_leave: "border-rose-200 bg-rose-50 text-rose-900",
    booked: "border-amber-200 bg-amber-50 text-amber-900",
};
const neutral = "border-slate-200 bg-slate-50 text-slate-600";
const dateLabel = (date, options) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("en-PH", options);
const shiftDate = (date, offset) => {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
};

export default function CounselorCalendar({
    counselors = [],
    colleges = [],
    calendar,
    onNavigate,
    busy,
}) {
    const [college, setCollege] = useState("all");
    const [search, setSearch] = useState("");
    const filtered = counselors.filter(
        (counselor) =>
            (college === "all" || counselor.college_codes.includes(college)) &&
            `${counselor.full_name} ${counselor.designation || ""}`
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
    );
    const move = (offset) =>
        onNavigate({
            calendar_date: shiftDate(
                calendar.date,
                offset * (calendar.view === "week" ? 7 : 1),
            ),
        });

    return (
        <section
            aria-label="Counselor availability"
            className="overflow-hidden rounded-2xl border border-sky-100 bg-white"
        >
            <div className="space-y-5 border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Counselor availability
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Counseling hours, teaching, approved leave and
                            reserved appointments. All times are Philippine
                            time.
                        </p>
                    </div>
                    <div
                        className="flex rounded-lg border border-slate-200 p-1"
                        aria-label="Calendar view"
                    >
                        {["day", "week"].map((view) => (
                            <button
                                key={view}
                                type="button"
                                disabled={busy}
                                aria-pressed={calendar.view === view}
                                onClick={() =>
                                    onNavigate({ calendar_view: view })
                                }
                                className={`rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-sky-600 ${calendar.view === view ? "bg-sky-800 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                {view === "day" ? "Day" : "Week"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex gap-1">
                        <button
                            type="button"
                            aria-label="Previous period"
                            disabled={busy}
                            onClick={() => move(-1)}
                            className="rounded-lg border p-2.5 hover:bg-slate-50"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                onNavigate({ calendar_date: calendar.today })
                            }
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            aria-label="Next period"
                            disabled={busy}
                            onClick={() => move(1)}
                            className="rounded-lg border p-2.5 hover:bg-slate-50"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <label className="min-w-0 max-w-full text-xs font-semibold text-slate-600">
                        Date
                        <input
                            className="control mt-1"
                            type="date"
                            value={calendar.date}
                            disabled={busy}
                            onChange={(event) =>
                                event.target.value &&
                                onNavigate({
                                    calendar_date: event.target.value,
                                })
                            }
                        />
                    </label>
                    <label className="min-w-0 max-w-full text-xs font-semibold text-slate-600">
                        College or department
                        <select
                            className="control mt-1"
                            value={college}
                            onChange={(event) => setCollege(event.target.value)}
                        >
                            <option value="all">All colleges and units</option>
                            {colleges.map((item) => (
                                <option key={item.code} value={item.code}>
                                    {item.code} — {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">
                        Find a counselor
                        <input
                            type="search"
                            className="control mt-1"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Name or designation"
                        />
                    </label>
                </div>
                <div
                    className="flex flex-wrap items-center gap-2 text-xs"
                    aria-label="Calendar legend"
                >
                    {[
                        ["available", "Available"],
                        ["in_class", "Teaching class"],
                        ["on_leave", "Approved leave"],
                        ["booked", "Booked"],
                        ["off_schedule", "Outside counseling hours"],
                    ].map(([status, label]) => (
                        <span
                            key={status}
                            className={`rounded-md border px-2 py-1 ${styles[status] || neutral}`}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>
            {!filtered.length ? (
                <div className="p-10 text-center">
                    <p className="font-semibold text-slate-800">
                        No counselors match these filters
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setCollege("all");
                            setSearch("");
                        }}
                        className="mt-3 text-sm font-semibold text-sky-800 underline"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div
                    className="overflow-x-auto"
                    tabIndex={0}
                    role="region"
                    aria-label="Counselor schedule grid"
                >
                    <table className="w-full border-collapse text-left">
                        <caption className="px-5 py-3 text-left text-sm text-slate-600">
                            {filtered.length} counselors •{" "}
                            {dateLabel(calendar.dates[0], {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                            {calendar.view === "week" &&
                                ` – ${dateLabel(calendar.dates.at(-1), { month: "short", day: "numeric" })}`}
                        </caption>
                        <thead className="border-y border-slate-200 bg-slate-50 text-sm text-slate-700">
                            <tr>
                                <th scope="col" className="min-w-44 p-4">
                                    Counselor
                                </th>
                                {calendar.dates.map((date) => (
                                    <th
                                        key={date}
                                        scope="col"
                                        className={`min-w-44 p-3 ${date === calendar.today ? "bg-sky-100 text-sky-900" : ""}`}
                                    >
                                        {dateLabel(date, {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                        {date === calendar.today && (
                                            <span className="mt-1 block text-xs font-normal">
                                                Today
                                            </span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filtered.map((counselor) => (
                                <tr key={counselor.id}>
                                    <th scope="row" className="p-4 align-top">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {counselor.full_name}
                                        </p>
                                        <p className="mt-1 text-xs font-normal text-slate-500">
                                            {counselor.college_codes.join(
                                                ", ",
                                            ) || "General guidance"}
                                        </p>
                                        <p className="mt-2 text-xs font-normal text-slate-600">
                                            {counselor.on_duty
                                                ? "On duty now"
                                                : "Off duty now"}
                                        </p>
                                        {counselor.uses_default_schedule && (
                                            <p className="mt-1 text-xs font-normal text-slate-500">
                                                Default office hours
                                            </p>
                                        )}
                                    </th>
                                    {calendar.dates.map((date) => (
                                        <td
                                            key={date}
                                            className="border-l border-slate-100 p-2 align-top"
                                        >
                                            {["AM", "PM"].map((period) => (
                                                <div
                                                    key={period}
                                                    className="mb-3 last:mb-0"
                                                >
                                                    <p className="mb-1 px-1 text-xs font-semibold text-slate-500">
                                                        {period}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {(
                                                            counselor
                                                                .calendar?.[
                                                                date
                                                            ]?.[period] || []
                                                        ).map((block) => (
                                                            <div
                                                                key={
                                                                    block.start
                                                                }
                                                                className={`rounded-md border px-2 py-2 ${styles[block.status] || neutral}`}
                                                            >
                                                                <p className="text-xs font-semibold">
                                                                    {block.status ===
                                                                    "in_class"
                                                                        ? "Teaching class"
                                                                        : block.badge}
                                                                </p>
                                                                <p className="mt-0.5 text-xs tabular-nums">
                                                                    {
                                                                        block.start
                                                                    }
                                                                    –{block.end}
                                                                </p>
                                                                {block.status ===
                                                                    "in_class" && (
                                                                    <p className="mt-1 text-xs">
                                                                        {
                                                                            block.reason
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
