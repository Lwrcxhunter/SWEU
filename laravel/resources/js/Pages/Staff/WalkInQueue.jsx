import { Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import Office, { Card, Pagination } from "@/Components/Office";
import StaffQueueCard from "@/Components/StaffQueueCard";
import {
    Users,
    UserCheck,
    Share2,
    ClipboardList,
    Clock,
    RefreshCw,
    CheckCircle2,
    BarChart3,
    ArrowRight,
    AlertCircle,
} from "lucide-react";

export default function WalkInQueue({
    appointments,
    counselors = [],
    metrics = {},
}) {
    const { auth } = usePage().props;
    const can = (perm) => auth?.permissions?.includes(perm) ?? true;

    useEffect(() => {
        const timer = setInterval(
            () =>
                router.reload({
                    only: ["appointments", "counselors", "metrics"],
                }),
            15000,
        );
        return () => clearInterval(timer);
    }, []);

    const kpis = [
        {
            label: "Active Queue",
            count: metrics.queue_total ?? appointments?.total ?? 0,
            description:
                metrics.urgent_count > 0
                    ? `(${metrics.urgent_count} urgent)`
                    : null,
            icon: Clock,
            circleStyle: "bg-amber-50 text-amber-600 border-amber-100",
            link: null,
        },
        {
            label: "Available Counselors",
            count: metrics.counselors_available ?? 0,
            description: metrics.counselors_on_duty
                ? `of ${metrics.counselors_on_duty} on duty`
                : null,
            icon: UserCheck,
            circleStyle: "bg-sky-50 text-sky-600 border-sky-100",
            link: null,
        },
        {
            label: "Active Referrals",
            count: metrics.pending_referrals_count ?? 0,
            icon: Share2,
            circleStyle: "bg-emerald-50 text-emerald-600 border-emerald-100",
            link: can("referrals.manage") ? route("referrals.index") : null,
        },
        {
            label: "Testing Requests Status",
            count: metrics.open_testing_count ?? 0,
            icon: ClipboardList,
            circleStyle: "bg-indigo-50 text-indigo-600 border-indigo-100",
            link: can("testing.manage") ? route("testing.index") : null,
        },
    ];

    return (
        <Office
            title="A warm welcome. Timely support."
            eyebrow="Front-Desk Operations"
            description="Triage walk-ins, coordinate counselor availability, track active referrals, and review testing requests in real time."
            action={
                <div className="flex flex-wrap items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                        Auto-refreshes (15s)
                    </span>
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-sky-700 shadow-sm hover:bg-sky-50 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Now</span>
                    </button>
                </div>
            }
        >
            {/* SUMMARY METRIC CARDS (Consistent with Student Dashboard) */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((m) => {
                    const Icon = m.icon;
                    return (
                        <section
                            key={m.label}
                            className="relative flex items-center justify-between gap-3.5 rounded-2xl border border-sky-100/90 bg-white p-4 sm:p-5 shadow-sm shadow-sky-900/5 hover:border-sky-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                                {/* Left Circular Icon Badge */}
                                <div
                                    className={`flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full border ${m.circleStyle}`}
                                >
                                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.75]" />
                                </div>

                                {/* Center Details */}
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                                        {m.label}
                                    </h3>
                                    <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
                                        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
                                            {m.count}
                                        </span>
                                        {m.description && (
                                            <span className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                                                {m.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Far Right Arrow */}
                            <div className="shrink-0 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all">
                                <ArrowRight className="h-4 w-4" />
                            </div>

                            {/* Clickable Overlay Link */}
                            {m.link && (
                                <Link
                                    href={m.link}
                                    className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                                    aria-label={`View ${m.label}`}
                                />
                            )}
                        </section>
                    );
                })}
            </div>

            {/* Urgent Priority Alert Banner */}
            {metrics.urgent_count > 0 && (
                <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 sm:p-5 text-rose-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs text-lg">
                            ⚠️
                        </span>
                        <div>
                            <h3 className="font-bold text-sm text-rose-950">
                                High Priority Attention Required
                            </h3>
                            <p className="text-xs text-rose-800 mt-0.5">
                                There{" "}
                                {metrics.urgent_count === 1
                                    ? "is 1 student"
                                    : `are ${metrics.urgent_count} students`}{" "}
                                in the queue flagged with{" "}
                                <strong>Urgent Priority</strong>. Prompt
                                counselor assignment is recommended.
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-rose-600 text-white px-3 py-1 text-xs font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        {metrics.urgent_count} Urgent Case
                        {metrics.urgent_count === 1 ? "" : "s"}
                    </span>
                </div>
            )}

            {/* Main Operations Grid */}
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                {/* Left Column: Live Queue & Triage */}
                <Card
                    title="Live Student Queue & Assignment"
                    description={`${appointments?.total || 0} active request(s) across walk-in and online appointments. Urgent cases appear first.`}
                >
                    {!appointments?.data?.length ? (
                        <div className="rounded-2xl border-2 border-dashed border-sky-100 bg-sky-50/30 p-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-xs mb-3">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">
                                The Queue is Clear
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                There are currently no students waiting for
                                walk-in or pending online booking assignment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments?.data?.map((a) => (
                                <StaffQueueCard
                                    key={a.id}
                                    item={a}
                                    counselors={counselors}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination data={appointments} />
                </Card>

                {/* Right Column: Actions & Duty Roster */}
                <div className="space-y-6">
                    {/* Counselor Availability & Duty Board */}
                    <Card
                        title="Counselor Duty Board"
                        description={`${metrics.counselors_available ?? 0} available of ${metrics.counselors_on_duty ?? 0} on duty.`}
                    >
                        {counselors.length ? (
                            <div className="divide-y divide-sky-100/60">
                                {counselors.map((c) => (
                                    <div
                                        key={c.id}
                                        className="py-3 flex items-start justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {c.full_name}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                                                {c.designation ||
                                                    (c.college_codes?.length
                                                        ? c.college_codes.join(
                                                              " · ",
                                                          )
                                                        : "SWEU Counselor")}
                                            </p>
                                            {c.active_sessions_count > 0 && (
                                                <span className="inline-block mt-1 text-[10px] font-medium text-slate-500">
                                                    {c.active_sessions_count}{" "}
                                                    active assigned session(s)
                                                </span>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    c.on_duty && c.available
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : c.on_duty
                                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                          : "bg-slate-50 text-slate-500 border border-slate-200"
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        c.on_duty && c.available
                                                            ? "bg-emerald-500"
                                                            : c.on_duty
                                                              ? "bg-amber-500"
                                                              : "bg-slate-400"
                                                    }`}
                                                ></span>
                                                {c.on_duty && c.available
                                                    ? "Available"
                                                    : c.on_duty
                                                      ? "Busy"
                                                      : "Off Duty"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-500">
                                No counselors currently registered.
                            </div>
                        )}
                    </Card>

                    {/* Operational Quick Links */}
                    <Card
                        title="Operations Shortcuts"
                        description="Jump quickly to other SWEU guidance department workflows."
                    >
                        <div className="space-y-2">
                            <Link
                                href={route("referrals.index")}
                                className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/30 hover:bg-sky-50 hover:border-sky-200 transition text-xs font-semibold text-slate-700"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Share2 className="w-4 h-4 text-emerald-600" />
                                    <span>Referral Management Queue</span>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {metrics.pending_referrals_count ?? 0}
                                </span>
                            </Link>
                            <Link
                                href={route("testing.index")}
                                className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/30 hover:bg-sky-50 hover:border-sky-200 transition text-xs font-semibold text-slate-700"
                            >
                                <div className="flex items-center gap-2.5">
                                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                                    <span>Psychological Testing Queue</span>
                                </div>
                                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {metrics.open_testing_count ?? 0}
                                </span>
                            </Link>
                            <Link
                                href={route("reports.index")}
                                className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/30 hover:bg-sky-50 hover:border-sky-200 transition text-xs font-semibold text-slate-700"
                            >
                                <div className="flex items-center gap-2.5">
                                    <BarChart3 className="w-4 h-4 text-sky-600" />
                                    <span>Analytics &amp; Annual Reports</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </Office>
    );
}
