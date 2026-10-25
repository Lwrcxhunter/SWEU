import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar as CalendarIcon,
    Clock,
    Building,
    RotateCcw,
} from "lucide-react";
import { formatSessionTime } from "@/Support/guidanceConstants";

const styles = {
    available: "border-emerald-300 bg-emerald-50/90 text-emerald-900 shadow-xs",
    in_class: "border-blue-300 bg-blue-50/90 text-blue-900 shadow-xs",
    on_leave: "border-rose-300 bg-rose-50/90 text-rose-900 shadow-xs",
    booked: "border-amber-300 bg-amber-50/90 text-amber-900 shadow-xs",
};
const neutral = "border-slate-200 bg-slate-50 text-slate-500";
const label = {
    available: "Available",
    in_class: "Class",
    on_leave: "On leave",
    booked: "Booked",
    off_schedule: "Outside hours",
    unavailable: "Unavailable",
};
const dateLabel = (date, options) =>
    new Date(date + "T12:00:00").toLocaleDateString("en-PH", options);
const shiftDate = (date, offset) => {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
};
const minutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};
const blocksFor = (counselor, date) =>
    ["AM", "PM"].flatMap((p) => counselor.calendar?.[date]?.[p] || []);
const timeRange = (block) =>
    formatSessionTime(block.start) + " – " + formatSessionTime(block.end);
const hours = Array.from({ length: 9 }, (_, i) => i + 8);
const slots = Array.from(
    { length: 18 },
    (_, i) =>
        String(8 + Math.floor(i / 2)).padStart(2, "0") +
        (i % 2 ? ":30" : ":00"),
);

function ScheduleBlock({ block, compact = false }) {
    return (
        <div
            className={
                "h-full overflow-hidden rounded-xl border px-2 py-2 transition-all hover:shadow-sm " +
                (styles[block.status] || neutral)
            }
            tabIndex={0}
            aria-label={
                (label[block.status] || block.badge) +
                ": " +
                timeRange(block) +
                ". " +
                block.reason
            }
            title={
                (label[block.status] || block.badge) +
                ": " +
                timeRange(block) +
                ". " +
                block.reason
            }
        >
            <p
                className={
                    compact ? "text-[10px] font-bold" : "text-xs font-bold"
                }
            >
                {compact && block.available
                    ? "Free"
                    : label[block.status] || block.badge}
            </p>
            <p className="mt-1 text-[11px] tabular-nums font-semibold">
                {compact ? (
                    <>
                        <span className="block">{block.start}</span>
                        <span className="block">–{block.end}</span>
                    </>
                ) : (
                    timeRange(block)
                )}
            </p>
            {block.status === "in_class" && (
                <p className="mt-1 text-[11px] font-medium leading-tight">
                    {block.reason}
                </p>
            )}
        </div>
    );
}

export default function CounselorCalendar({
    counselors = [],
    colleges = [],
    calendar,
    onNavigate,
    busy,
}) {
    const [college, setCollege] = useState("all");
    const [search, setSearch] = useState("");
    const [atTime, setAtTime] = useState("");
    const isDay = calendar.view === "day";
    const filtered = counselors.filter(
        (c) =>
            (college === "all" || c.college_codes.includes(college)) &&
            (c.full_name + " " + (c.designation || ""))
                .toLowerCase()
                .includes(search.trim().toLowerCase()) &&
            (!isDay ||
                !atTime ||
                blocksFor(c, calendar.date).some(
                    (b) =>
                        b.available &&
                        minutes(b.start) <= minutes(atTime) &&
                        minutes(b.end) >= minutes(atTime) + 30,
                )),
    );
    const move = (offset) =>
        onNavigate({
            calendar_date: shiftDate(calendar.date, offset * (isDay ? 1 : 7)),
        });
    const clear = () => {
        setCollege("all");
        setSearch("");
        setAtTime("");
    };

    return (
        <section
            aria-label="Counselor availability"
            className="staff-calendar overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm shadow-sky-950/5"
        >
            <div className="space-y-4 border-b border-sky-100/80 p-4 md:p-6 bg-slate-50/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-sky-600" />
                            {dateLabel(calendar.dates[0], {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                            {!isDay &&
                                " – " +
                                    dateLabel(calendar.dates.at(-1), {
                                        month: "short",
                                        day: "numeric",
                                    })}
                        </h2>
                    </div>
                    <div
                        className="inline-flex rounded-xl border border-sky-200/80 bg-white p-1 shadow-xs"
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
                                className={
                                    "rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] " +
                                    (calendar.view === view
                                        ? "bg-sky-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-sky-800 hover:bg-sky-50")
                                }
                            >
                                {view === "day" ? "Day" : "Week"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            aria-label="Previous period"
                            disabled={busy}
                            onClick={() => move(-1)}
                            className="rounded-xl border border-sky-200 bg-white p-2.5 text-sky-800 shadow-xs hover:bg-sky-50 hover:border-sky-300 active:scale-[0.98] transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                onNavigate({ calendar_date: calendar.today })
                            }
                            className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-sky-800 shadow-xs hover:bg-sky-50 hover:border-sky-300 active:scale-[0.98] transition-all"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            aria-label="Next period"
                            disabled={busy}
                            onClick={() => move(1)}
                            className="rounded-xl border border-sky-200 bg-white p-2.5 text-sky-800 shadow-xs hover:bg-sky-50 hover:border-sky-300 active:scale-[0.98] transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <label className="min-w-0 max-w-full text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date
                        <input
                            className="control mt-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                            type="date"
                            value={calendar.date}
                            disabled={busy}
                            onChange={(e) =>
                                e.target.value &&
                                onNavigate({ calendar_date: e.target.value })
                            }
                        />
                    </label>

                    <label className="min-w-0 max-w-full text-xs font-bold uppercase tracking-wider text-slate-500">
                        College or department
                        <select
                            className="control mt-1.5 max-w-64 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                        >
                            <option value="all">All colleges and units</option>
                            {colleges.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code} — {c.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="min-w-44 flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Find a counselor
                        <div className="relative mt-1.5">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3.5 top-3 text-sky-500"
                            />
                            <input
                                type="search"
                                className="control rounded-xl border border-sky-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Name or designation"
                            />
                        </div>
                    </label>

                    {isDay && (
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Available at
                            <select
                                className="control mt-1.5 min-w-32 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                                value={atTime}
                                onChange={(e) => setAtTime(e.target.value)}
                            >
                                <option value="">Any time</option>
                                {slots
                                    .filter((s) => !s.startsWith("12:"))
                                    .map((s) => (
                                        <option key={s} value={s}>
                                            {formatSessionTime(s)}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    )}

                    {(college !== "all" || search || atTime) && (
                        <button
                            type="button"
                            onClick={clear}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] transition-all"
                        >
                            <RotateCcw size={14} />
                            Clear filters
                        </button>
                    )}
                </div>

                <div
                    className="flex flex-wrap items-center gap-2 pt-2 border-t border-sky-100 text-xs"
                    aria-label="Calendar legend"
                >
                    {[
                        ["available", "Available"],
                        ["in_class", "Teaching class"],
                        ["on_leave", "On leave"],
                        ["booked", "Booked"],
                        ["off_schedule", "Outside counseling hours"],
                    ].map(([status, text]) => (
                        <span
                            key={status}
                            className={
                                "rounded-full border px-2.5 py-1 font-semibold " +
                                (styles[status] || neutral)
                            }
                        >
                            {text}
                        </span>
                    ))}
                    <span className="ml-auto text-xs font-medium text-slate-500">
                        All times PHT · {filtered.length} of {counselors.length}{" "}
                        counselors
                    </span>
                </div>
            </div>

            {!filtered.length ? (
                <div className="p-12 text-center rounded-2xl bg-slate-50/50 m-5 border border-dashed border-sky-200">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 text-xl">
                        🔍
                    </div>
                    <p className="font-bold text-slate-800 text-base">
                        No counselors match these filters
                    </p>
                    <button
                        type="button"
                        onClick={clear}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-800 shadow-xs hover:bg-sky-50 active:scale-[0.98] transition-all"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div
                    className="max-h-[70vh] overflow-auto"
                    tabIndex={0}
                    role="region"
                    aria-label="Counselor schedule grid"
                >
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <caption className="sr-only">
                            Counselor schedules in Philippine time. Scroll
                            horizontally to compare all times or days.
                        </caption>
                        <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th
                                    scope="col"
                                    className="sticky left-0 z-30 min-w-44 border-b border-sky-100 bg-slate-50 p-4 md:min-w-52"
                                >
                                    Counselor
                                </th>
                                {isDay
                                    ? hours.map((h) => (
                                          <th
                                              scope="col"
                                              key={h}
                                              className="min-w-28 border-b border-l border-sky-100 p-3"
                                          >
                                              {formatSessionTime(
                                                  String(h).padStart(2, "0") +
                                                      ":00",
                                              )}
                                          </th>
                                      ))
                                    : calendar.dates.map((date) => (
                                          <th
                                              scope="col"
                                              key={date}
                                              className={
                                                  "min-w-44 border-b border-l border-sky-100 p-3 " +
                                                  (date === calendar.today
                                                      ? "bg-sky-100/80 text-sky-900 font-extrabold"
                                                      : "")
                                              }
                                          >
                                              <button
                                                  type="button"
                                                  className="text-left hover:underline"
                                                  onClick={() =>
                                                      onNavigate({
                                                          calendar_date: date,
                                                          calendar_view: "day",
                                                      })
                                                  }
                                              >
                                                  {dateLabel(date, {
                                                      weekday: "short",
                                                      month: "short",
                                                      day: "numeric",
                                                  })}
                                                  {date === calendar.today && (
                                                      <span className="block text-sky-700 font-bold">
                                                          Today
                                                      </span>
                                                  )}
                                              </button>
                                          </th>
                                      ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((counselor) => (
                                <tr
                                    key={counselor.id}
                                    className="hover:bg-sky-50/20 transition-colors"
                                >
                                    <th
                                        scope="row"
                                        className="sticky left-0 z-10 w-48 border-b border-r border-sky-100 bg-white/95 backdrop-blur-sm p-4 align-top"
                                    >
                                        <p className="text-sm font-bold text-slate-900">
                                            {counselor.full_name}
                                        </p>
                                        <p className="mt-1">
                                            <span className="inline-block text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-100 rounded px-1.5 py-0.5">
                                                {counselor.college_codes.join(
                                                    ", ",
                                                ) || "General guidance"}
                                            </span>
                                        </p>
                                        <p className="mt-2 text-xs font-medium flex items-center gap-1.5">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    counselor.on_duty
                                                        ? "bg-emerald-500 animate-pulse"
                                                        : "bg-slate-300"
                                                }`}
                                            />
                                            <span
                                                className={
                                                    counselor.on_duty
                                                        ? "text-emerald-700 font-semibold"
                                                        : "text-slate-400"
                                                }
                                            >
                                                {counselor.on_duty
                                                    ? "On duty now"
                                                    : "Off duty now"}
                                            </span>
                                        </p>
                                        {counselor.uses_default_schedule && (
                                            <p className="mt-1 text-[11px] font-normal text-slate-400">
                                                Default office hours
                                            </p>
                                        )}
                                    </th>
                                    {isDay ? (
                                        <td
                                            colSpan={9}
                                            className="min-w-[1008px] border-b border-sky-100 p-0 align-top"
                                        >
                                            <div
                                                className="grid min-h-28 grid-cols-18 gap-1 p-2"
                                                style={{
                                                    backgroundImage:
                                                        "repeating-linear-gradient(to right, transparent 0, transparent calc(11.111% - 1px), #f1f5f9 calc(11.111% - 1px), #f1f5f9 11.111%)",
                                                }}
                                            >
                                                {blocksFor(
                                                    counselor,
                                                    calendar.date,
                                                ).map((block) => (
                                                    <div
                                                        key={block.start}
                                                        style={{
                                                            gridColumn:
                                                                1 +
                                                                (minutes(
                                                                    block.start,
                                                                ) -
                                                                    480) /
                                                                    30 +
                                                                " / span " +
                                                                (minutes(
                                                                    block.end,
                                                                ) -
                                                                    minutes(
                                                                        block.start,
                                                                    )) /
                                                                    30,
                                                            gridRow: 1,
                                                        }}
                                                    >
                                                        <ScheduleBlock
                                                            block={block}
                                                            compact={
                                                                minutes(
                                                                    block.end,
                                                                ) -
                                                                    minutes(
                                                                        block.start,
                                                                    ) <=
                                                                30
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    ) : (
                                        calendar.dates.map((date) => {
                                            const blocks = blocksFor(
                                                counselor,
                                                date,
                                            );
                                            const free = blocks
                                                .filter((b) => b.available)
                                                .reduce(
                                                    (sum, b) =>
                                                        sum +
                                                        minutes(b.end) -
                                                        minutes(b.start),
                                                    0,
                                                );
                                            const states = [
                                                ...new Set(
                                                    blocks
                                                        .filter(
                                                            (b) =>
                                                                !b.available &&
                                                                styles[
                                                                    b.status
                                                                ],
                                                        )
                                                        .map((b) => b.status),
                                                ),
                                            ];
                                            return (
                                                <td
                                                    key={date}
                                                    className="border-b border-l border-sky-100 p-3 align-top"
                                                >
                                                    <p
                                                        className={
                                                            "text-xs font-bold " +
                                                            (free
                                                                ? "text-emerald-700"
                                                                : "text-slate-400")
                                                        }
                                                    >
                                                        {free
                                                            ? free / 60 +
                                                              " hrs available"
                                                            : "No open slots"}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {states.map((s) => (
                                                            <span
                                                                key={s}
                                                                className={
                                                                    "rounded-md border px-2 py-0.5 text-[11px] font-semibold " +
                                                                    styles[s]
                                                                }
                                                            >
                                                                {label[s]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <details className="mt-3">
                                                        <summary className="cursor-pointer text-xs font-semibold text-sky-700 hover:text-sky-900 select-none">
                                                            Time blocks
                                                        </summary>
                                                        <div className="mt-2 space-y-1">
                                                            {blocks.map(
                                                                (block) => (
                                                                    <ScheduleBlock
                                                                        key={
                                                                            block.start
                                                                        }
                                                                        block={
                                                                            block
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </details>
                                                </td>
                                            );
                                        })
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="border-t border-sky-100 bg-slate-50/50 px-5 py-3 text-xs leading-5 text-slate-500">
                Schedule view: 8:00 AM–5:00 PM, with a noon break. “On duty now”
                applies to urgent walk-ins; use the dated time blocks for
                advance bookings. Availability is checked again when assigning.
            </p>
        </section>
    );
}
