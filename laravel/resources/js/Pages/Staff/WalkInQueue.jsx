import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Office, { Pagination } from "@/Components/Office";
import StaffQueueCard from "@/Components/StaffQueueCard";
import CounselorCalendar from "./Partials/CounselorCalendar";
import {
    CalendarDays,
    ClipboardList,
    RefreshCw,
    Users,
    ArrowRight,
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
    const can = (permission) =>
        auth?.permissions?.includes(permission) ?? false;
    const [busy, setBusy] = useState(false);
    const [refreshError, setRefreshError] = useState(false);
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
                replace: true,
                onFinish: () => setBusy(false),
            },
        );
    };
    const refresh = () => {
        if (busy) return;
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
    }, [busy]);
    const stages = [
        ["all", "All requests", metrics.queue_total],
        ["unassigned", "Needs assignment", metrics.unassigned_count],
        ["waiting", "Awaiting response", metrics.waiting_count],
        ["confirmed", "Accepted", metrics.confirmed_count],
        ["urgent", "Urgent", metrics.urgent_count],
    ];

    return (
        <Office
            title="Front desk"
            description="Assign counseling requests, check counselor schedules and coordinate testing."
            action={
                <button
                    type="button"
                    onClick={refresh}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-900 disabled:opacity-60"
                >
                    <RefreshCw
                        size={16}
                        className={busy ? "motion-safe:animate-spin" : ""}
                    />
                    {busy ? "Updating…" : "Refresh"}
                </button>
            }
        >
            <div className="mb-6 grid divide-y divide-sky-100 overflow-hidden rounded-2xl border border-sky-100 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <button
                    type="button"
                    onClick={() =>
                        navigate({ tab: "queue", stage: "unassigned" })
                    }
                    className="flex items-center justify-between gap-4 p-5 text-left hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
                >
                    <div>
                        <p className="text-sm text-slate-600">
                            Needs assignment
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                            {metrics.unassigned_count ?? 0}
                        </p>
                    </div>
                    <Users className="text-sky-700" size={24} />
                </button>
                <button
                    type="button"
                    onClick={() => navigate({ tab: "calendar" })}
                    className="flex items-center justify-between gap-4 p-5 text-left hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600"
                >
                    <div>
                        <p className="text-sm text-slate-600">
                            Counselors on duty now
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                            {metrics.counselors_on_duty ?? 0}
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                of {metrics.counselors_total ?? 0}
                            </span>
                        </p>
                    </div>
                    <CalendarDays className="text-sky-700" size={24} />
                </button>
                <div className="flex items-center justify-between gap-4 p-5">
                    <div>
                        <p className="text-sm text-slate-600">
                            Testing Requests Status
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                            {metrics.open_testing_count ?? 0}
                            <span className="ml-2 text-sm font-normal text-slate-500">
                                pending
                            </span>
                        </p>
                        {can("testing.manage") && (
                            <Link
                                href={route("testing.index")}
                                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline"
                            >
                                Open testing queue <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>
                    <ClipboardList className="text-sky-700" size={24} />
                </div>
            </div>
            {metrics.urgent_count > 0 && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-rose-900">
                    <p className="text-sm">
                        <strong>
                            {metrics.urgent_count} urgent{" "}
                            {metrics.urgent_count === 1
                                ? "request"
                                : "requests"}
                        </strong>{" "}
                        requiring front-desk coordination.
                    </p>
                    <button
                        type="button"
                        className="text-sm font-semibold underline"
                        onClick={() =>
                            navigate({ tab: "queue", stage: "urgent" })
                        }
                    >
                        Review urgent requests
                    </button>
                </div>
            )}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                <nav aria-label="Front desk views" className="flex gap-5">
                    {[
                        ["queue", "Counseling queue"],
                        ["calendar", "Availability calendar"],
                    ].map(([tab, label]) => (
                        <button
                            key={tab}
                            type="button"
                            disabled={busy}
                            aria-current={
                                filters.tab === tab ? "page" : undefined
                            }
                            onClick={() => navigate({ tab })}
                            className={`border-b-2 px-1 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-sky-600 ${filters.tab === tab ? "border-sky-700 text-sky-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
                <p className="pb-2 text-xs text-slate-500" role="status">
                    {refreshError
                        ? "Refresh failed. Try refreshing again."
                        : "Refreshes every 15 seconds while idle"}
                </p>
            </div>
            {filters.tab === "calendar" ? (
                <CounselorCalendar
                    counselors={counselors}
                    colleges={colleges}
                    calendar={calendar}
                    onNavigate={navigate}
                    busy={busy}
                />
            ) : (
                <section aria-label="Counseling requests" className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Counseling requests
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Urgent requests appear first, then the oldest
                                requests.
                            </p>
                        </div>
                        {can("reports.view") && (
                            <Link
                                href={route("reports.index")}
                                className="text-sm font-semibold text-sky-800 hover:underline"
                            >
                                View reports
                            </Link>
                        )}
                    </div>
                    <div
                        className="flex flex-wrap gap-2"
                        aria-label="Filter requests by stage"
                    >
                        {stages.map(([stage, label, count]) => (
                            <button
                                key={stage}
                                type="button"
                                disabled={busy}
                                aria-pressed={filters.stage === stage}
                                onClick={() => navigate({ stage })}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-sky-600 ${filters.stage === stage ? "border-sky-800 bg-sky-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"}`}
                            >
                                {label}
                                <span
                                    className={`rounded px-1.5 text-xs tabular-nums ${filters.stage === stage ? "bg-white/20" : "bg-slate-100"}`}
                                >
                                    {count ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500">
                        Showing {appointments?.from ?? 0}–
                        {appointments?.to ?? 0} of {appointments?.total ?? 0}{" "}
                        requests
                    </p>
                    {appointments?.data?.length ? (
                        <div className="space-y-4">
                            {appointments.data.map((item) => (
                                <StaffQueueCard
                                    key={item.id}
                                    item={item}
                                    counselors={counselors}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                            <h3 className="font-semibold text-slate-800">
                                No requests in this view
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                New requests will appear here automatically. Use
                                All requests to see the full queue.
                            </p>
                        </div>
                    )}
                    <Pagination data={appointments} />
                </section>
            )}
        </Office>
    );
}
