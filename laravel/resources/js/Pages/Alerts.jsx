import { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Office, {
    Card,
    Button,
    Empty,
    Pagination,
} from "@/Components/Office";
import {
    Bell,
    Calendar,
    ClipboardList,
    AlertTriangle,
    CheckCheck,
    Check,
    Clock,
    ArrowRight,
    Filter,
} from "lucide-react";

export default function Alerts({ alerts, filter = "all", counts = {} }) {
    const { auth } = usePage().props;
    const [markingAll, setMarkingAll] = useState(false);

    const activeFilter = filter || "all";
    const unreadTotal = counts.unread ?? 0;

    const tabs = [
        { key: "all", label: "All", count: counts.all ?? 0 },
        { key: "unread", label: "Unread", count: counts.unread ?? 0 },
        { key: "appointment", label: "Appointments", count: counts.appointment ?? 0 },
        { key: "testing", label: "Testing", count: counts.testing ?? 0 },
    ];

    const handleFilterChange = (tabKey) => {
        router.get(
            route("alerts.index", tabKey === "all" ? {} : { filter: tabKey }, false),
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleMarkAllRead = () => {
        setMarkingAll(true);
        router.patch(
            route("alerts.mark-all-read", {}, false),
            {},
            {
                preserveScroll: true,
                onFinish: () => setMarkingAll(false),
            }
        );
    };

    const handleMarkSingleRead = (id) => {
        router.patch(
            route("alerts.update", id, false),
            {},
            { preserveScroll: true }
        );
    };

    return (
        <Office
            title="Notifications"
            eyebrow="Communication Center"
            description={
                auth.user.preferences?.notification_refresh !== false
                    ? "Appointment updates, session alerts, and official testing notices. Real-time updates active."
                    : "Appointment updates, session alerts, and official testing notices."
            }
            action={
                unreadTotal > 0 && (
                    <Button
                        secondary
                        loading={markingAll}
                        onClick={handleMarkAllRead}
                        className="!bg-white/90 hover:!bg-white !text-sky-900 border-white/40 shadow-sm"
                    >
                        <CheckCheck className="h-4 w-4 text-sky-700" />
                        <span>Mark All as Read</span>
                    </Button>
                )
            }
        >
            <div className="space-y-6">
                {/* Filter Tabs and Quick Stats Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-sky-100 shadow-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {tabs.map((tab) => {
                            const isActive = activeFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        isActive
                                            ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                                            : "text-slate-600 hover:text-sky-800 hover:bg-sky-50"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            isActive
                                                ? "bg-white/25 text-white"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {unreadTotal > 0 && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium px-2">
                            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                            <span>
                                {unreadTotal} unread notification{unreadTotal > 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                </div>

                {/* Notifications Feed */}
                <Card className="!p-4 sm:!p-6">
                    {!alerts.data || alerts.data.length === 0 ? (
                        <Empty
                            title={
                                activeFilter === "unread"
                                    ? "All caught up!"
                                    : activeFilter === "appointment"
                                    ? "No appointment notifications"
                                    : activeFilter === "testing"
                                    ? "No testing notifications"
                                    : "No notifications yet"
                            }
                            children={
                                activeFilter === "unread"
                                    ? "You have acknowledged all your notifications. New updates will appear here."
                                    : activeFilter === "appointment"
                                    ? "There are no appointment or counseling session notifications at this time."
                                    : activeFilter === "testing"
                                    ? "There are no psychological testing or evaluation notices at this time."
                                    : "New notifications regarding your appointments and requests will appear here."
                            }
                            icon={
                                activeFilter === "unread"
                                    ? "✨"
                                    : activeFilter === "appointment"
                                    ? "📅"
                                    : activeFilter === "testing"
                                    ? "📝"
                                    : "🔔"
                            }
                            action={
                                activeFilter !== "all" && (
                                    <Button
                                        secondary
                                        onClick={() => handleFilterChange("all")}
                                        className="text-xs"
                                    >
                                        View All Notifications
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {alerts.data.map((a) => {
                                const isAppt = a.category === "appointment" || a.kind === "appointment";
                                const isTesting = a.category === "testing" || a.kind === "testing";
                                const isUrgent = a.category === "urgent" || a.kind === "urgent";

                                const Icon = isUrgent
                                    ? AlertTriangle
                                    : isTesting
                                    ? ClipboardList
                                    : isAppt
                                    ? Calendar
                                    : Bell;

                                const iconContainerStyle = isUrgent
                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                    : isTesting
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                    : isAppt
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200";

                                const badgeColor = isUrgent
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : isTesting
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : isAppt
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200";

                                const actionLabel = isAppt
                                    ? "View Appointment"
                                    : isTesting
                                    ? "View Testing"
                                    : "View Details";

                                return (
                                    <div
                                        key={a.id}
                                        className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-3 sm:px-4 rounded-xl transition duration-150 ${
                                            !a.read
                                                ? "bg-sky-50/40 border-l-4 border-l-sky-500 shadow-xs"
                                                : "hover:bg-slate-50/70"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                            {/* Category Icon */}
                                            <div
                                                className={`shrink-0 p-2.5 rounded-xl border ${iconContainerStyle} shadow-xs mt-0.5`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            {/* Text Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                        {a.title || "Office Notice"}
                                                    </span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badgeColor} capitalize`}
                                                    >
                                                        {a.category || a.kind}
                                                    </span>
                                                    {!a.read && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                                                            New
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium ml-auto sm:ml-0">
                                                        <Clock className="h-3 w-3" />
                                                        {a.created_at_human || "Recently"}
                                                    </span>
                                                </div>

                                                <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                                                    {a.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                                            {a.action_url && (
                                                <Link
                                                    href={a.action_url}
                                                    onClick={() => {
                                                        if (!a.read) {
                                                            handleMarkSingleRead(a.id);
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:text-sky-900 hover:border-sky-300 transition shadow-xs"
                                                >
                                                    <span>{actionLabel}</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            )}

                                            {!a.read && (
                                                <button
                                                    type="button"
                                                    title="Mark as read"
                                                    onClick={() => handleMarkSingleRead(a.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                                                >
                                                    <Check className="h-3.5 w-3.5 text-slate-500" />
                                                    <span className="hidden sm:inline">Mark read</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-4">
                        <Pagination data={alerts} />
                    </div>
                </Card>
            </div>
        </Office>
    );
}
