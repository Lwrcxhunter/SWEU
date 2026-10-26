import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Office, { Button } from "@/Components/Office";
import StaffQueueCard from "@/Components/StaffQueueCard";
import CounselorCalendar from "./Partials/CounselorCalendar";
import {
    CalendarDays,
    RefreshCw,
    Search,
    ListFilter,
    Filter,
    X,
    AlertTriangle,
    ArrowRight,
    ChevronDown,
    CheckCircle2,
} from "lucide-react";

export default function WalkInQueue({
    appointments,
    counselors = [],
    colleges = [],
    metrics = {},
    calendar,
    filters,
}) {
    const { auth } = usePage().props;
    const can = (permission) => auth?.permissions?.includes(permission);
    const [busy, setBusy] = useState(false);
    const [refreshError, setRefreshError] = useState(false);
    const [search, setSearch] = useState(filters.search || "");
    const [date, setDate] = useState(filters.appointment_date || "");
    const [loadedAppointments, setLoadedAppointments] = useState(
        appointments?.data || [],
    );
    const [loadingMore, setLoadingMore] = useState(false);
    const isCalendar = filters.tab === "calendar";

    useEffect(() => {
        setSearch(filters.search || "");
        setDate(filters.appointment_date || "");
    }, [filters.search, filters.appointment_date]);

    useEffect(() => {
        setLoadedAppointments(appointments?.data || []);
    }, [filters.stage, filters.search, filters.appointment_date]);

    useEffect(() => {
        if (appointments?.current_page === 1) {
            setLoadedAppointments((prev) => {
                if (!prev.length) return appointments?.data || [];
                const freshMap = new Map(
                    (appointments?.data || []).map((item) => [item.id, item]),
                );
                const updated = prev.map(
                    (item) => freshMap.get(item.id) || item,
                );
                const prevIds = new Set(prev.map((item) => item.id));
                const brandNew = (appointments?.data || []).filter(
                    (item) => !prevIds.has(item.id),
                );
                return [...brandNew, ...updated];
            });
        }
    }, [appointments]);

    const handleLoadMore = () => {
        if (!appointments?.next_page_url || loadingMore) return;
        setLoadingMore(true);
        router.get(
            appointments.next_page_url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ["appointments"],
                onSuccess: (page) => {
                    const newItems = page.props.appointments?.data || [];
                    setLoadedAppointments((prev) => {
                        const existingIds = new Set(
                            prev.map((item) => item.id),
                        );
                        const filteredNew = newItems.filter(
                            (item) => !existingIds.has(item.id),
                        );
                        return [...prev, ...filteredNew];
                    });
                },
                onFinish: () => setLoadingMore(false),
            },
        );
    };

    const navigate = (changes = {}) => {
        setBusy(true);
        router.get(
            route("queue.index"),
            {
                ...filters,
                calendar_date: calendar.date,
                calendar_view: calendar.view,
                ...changes,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };

    const refresh = () => {
        if (busy || loadingMore) return;
        setBusy(true);
        router.reload({
            only: ["appointments", "counselors", "metrics", "calendar"],
            onSuccess: () => setRefreshError(false),
            onError: () => setRefreshError(true),
            onFinish: () => setBusy(false),
        });
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (!document.hidden && !document.activeElement?.closest("form"))
                refresh();
        }, 15000);
        return () => clearInterval(timer);
    }, [busy, loadingMore, filters]);

    const stages = [
        ["all", "All appointments", metrics.queue_total],
        ["unassigned", "Needs assignment", metrics.unassigned_count],
        ["waiting", "Awaiting counselor", metrics.waiting_count],
        ["student", "Awaiting student", metrics.student_count],
        ["confirmed", "Confirmed", metrics.confirmed_count],
        ["completed", "Completed", metrics.completed_count],
        ["cancelled", "Cancelled", metrics.cancelled_count],
    ];

    return (
        <Office
            eyebrow={null}
            title={isCalendar ? "Counselor schedules" : "Appointments"}
            action={
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={busy}
                        aria-label="Refresh staff workspace"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-xs md:text-sm font-semibold text-white backdrop-blur-md shadow-sm hover:bg-white/25 hover:border-white/40 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={busy ? "motion-safe:animate-spin" : ""}
                        />
                        <span>{busy ? "Updating…" : "Refresh"}</span>
                    </button>
                    {isCalendar && (
                        <Link
                            href={route("queue.index")}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-sky-700 shadow-md hover:bg-sky-50 active:scale-[0.98] transition-all"
                        >
                            <ListFilter size={16} />
                            <span>View appointments</span>
                        </Link>
                    )}
                </div>
            }
        >
            {!isCalendar && metrics.urgent_count > 0 && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 md:p-5 text-sm text-rose-950 shadow-sm shadow-rose-950/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                            <AlertTriangle size={18} />
                        </div>
                        <p className="font-bold text-rose-900">
                            {metrics.urgent_count} urgent walk-in
                            {metrics.urgent_count > 1 ? "s" : ""} require
                            immediate triage
                        </p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] transition-all"
                        onClick={() => navigate({ stage: "urgent" })}
                    >
                        <span>Review</span>
                        <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {isCalendar ? (
                <CounselorCalendar
                    counselors={counselors}
                    colleges={colleges}
                    calendar={calendar}
                    onNavigate={navigate}
                    busy={busy}
                />
            ) : (
                <section aria-label="Counseling requests" className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                Student appointments
                            </h2>
                        </div>
                        <Link
                            href={route("queue.index", { tab: "calendar" })}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-semibold text-sky-800 shadow-xs hover:bg-sky-50 hover:border-sky-300 transition-all active:scale-[0.98]"
                        >
                            <CalendarDays size={15} className="text-sky-600" />
                            <span>View counselor schedules</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Filter Card */}
                    <div className="staff-filters overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm shadow-sky-950/5">
                        <form
                            className="flex flex-wrap items-end gap-3 border-b border-sky-100/80 p-4 md:p-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                navigate({ search, appointment_date: date });
                            }}
                        >
                            <label className="min-w-56 flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Find a student
                                <div className="relative mt-1.5">
                                    <Search
                                        size={16}
                                        className="pointer-events-none absolute left-3.5 top-3 text-sky-500"
                                    />
                                    <input
                                        type="search"
                                        className="control rounded-xl border border-sky-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                                        placeholder="Student name or ID number"
                                        value={search}
                                        maxLength={100}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </div>
                            </label>
                            <label className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Appointment date
                                <input
                                    type="date"
                                    className="control mt-1.5 rounded-xl border border-sky-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </label>
                            <Button
                                type="submit"
                                disabled={busy}
                                className="rounded-xl px-5 py-2.5 active:scale-[0.98] transition-all"
                            >
                                <Filter size={15} />
                                Apply filters
                            </Button>
                            {(filters.search || filters.appointment_date) && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] transition-all"
                                    onClick={() =>
                                        navigate({
                                            search: "",
                                            appointment_date: "",
                                        })
                                    }
                                >
                                    <X size={15} />
                                    Clear filters
                                </button>
                            )}
                        </form>
                        <div
                            className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50"
                            aria-label="Filter appointments by status"
                        >
                            {stages.map(([stage, label, count]) => (
                                <button
                                    key={stage}
                                    type="button"
                                    disabled={busy}
                                    aria-pressed={filters.stage === stage}
                                    onClick={() => navigate({ stage })}
                                    className={
                                        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs md:text-sm font-semibold transition-all duration-150 active:scale-[0.98] " +
                                        (filters.stage === stage
                                            ? "bg-sky-600 text-white shadow-sm shadow-sky-600/25"
                                            : "bg-white text-slate-600 border border-slate-200/80 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200")
                                    }
                                >
                                    {label}
                                    <span
                                        className={
                                            "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums " +
                                            (filters.stage === stage
                                                ? "bg-white/20 text-white"
                                                : "bg-sky-50 text-sky-700")
                                        }
                                    >
                                        {count ?? 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-slate-500 font-medium px-1">
                        <p className="tabular-nums font-semibold text-slate-700">
                            Showing {loadedAppointments.length} of{" "}
                            {appointments?.total ?? 0} appointments
                        </p>
                    </div>

                    {loadedAppointments?.length ? (
                        <div className="space-y-3.5">
                            {loadedAppointments.map((item) => (
                                <StaffQueueCard
                                    key={item.id}
                                    item={item}
                                    counselors={counselors}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-sky-200 bg-white/80 px-6 py-10 text-center shadow-sm">
                            <h3 className="font-bold text-slate-800 text-base">
                                No appointments found
                            </h3>
                            <Button
                                secondary
                                className="mt-3 rounded-xl px-4 py-2"
                                onClick={() =>
                                    navigate({
                                        stage: "all",
                                        search: "",
                                        appointment_date: "",
                                    })
                                }
                            >
                                Reset filters
                            </Button>
                        </div>
                    )}

                    {appointments?.next_page_url ? (
                        <div className="pt-2 flex flex-col items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="group inline-flex items-center gap-2.5 rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm shadow-sky-950/5 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800 active:scale-[0.98] transition-all disabled:opacity-60"
                            >
                                {loadingMore ? (
                                    <>
                                        <RefreshCw
                                            size={16}
                                            className="animate-spin text-sky-600"
                                        />
                                        <span>Loading more appointments…</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown
                                            size={16}
                                            className="text-sky-500 group-hover:translate-y-0.5 transition-transform"
                                        />
                                        <span>Load more appointments</span>
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-slate-500 font-medium">
                                Showing{" "}
                                <span className="font-semibold text-slate-700">
                                    {loadedAppointments.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-700">
                                    {appointments?.total ?? 0}
                                </span>{" "}
                                appointments
                            </p>
                        </div>
                    ) : loadedAppointments.length > 0 &&
                      (appointments?.total ?? 0) > 0 ? (
                        <div className="pt-2 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                            <CheckCircle2
                                size={14}
                                className="text-emerald-500"
                            />
                            <span>
                                All {appointments?.total} appointments loaded
                            </span>
                        </div>
                    ) : null}
                </section>
            )}
            <p
                className="mt-6 text-xs text-slate-400 flex items-center gap-1.5"
                role="status"
            >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {refreshError
                    ? "Update failed. Click Refresh."
                    : "Live updates active (PHT)"}
            </p>
        </Office>
    );
}
