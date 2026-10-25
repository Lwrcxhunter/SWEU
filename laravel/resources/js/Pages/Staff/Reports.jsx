import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Office, { Card, Button, StatusBadge } from "@/Components/Office";
import {
    Download,
    Filter,
    BarChart3,
    Calendar,
    Building2,
    Users,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Printer,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Briefcase,
    Activity,
    Clock,
    TrendingUp,
    PieChart,
    Sparkles,
    Sun,
    Moon,
} from "lucide-react";

export default function Reports({
    rows = [],
    kpis = {},
    analytics = {},
    collegeBreakdown = [],
    counselorBreakdown = [],
    recentRecords = [],
    colleges = [],
    counselors = [],
    filters = {},
    from,
    to,
}) {
    // Top-Level Hub Mode: "analytics" (Visual Insights) vs "reports" (Accreditation & Records)
    const [hubView, setHubView] = useState("analytics");
    const [reportTab, setReportTab] = useState("services"); // "services", "colleges", "counselors", "activity"
    const [filtersOpen, setFiltersOpen] = useState(true);

    const form = useForm({
        preset: filters.preset || "this_month",
        from: filters.from || from || "",
        to: filters.to || to || "",
        service: filters.service || "all",
        status: filters.status || "all",
        college: filters.college || "all",
        counselor_id: filters.counselor_id || "all",
        type: filters.type || "all",
        urgency: filters.urgency || "all",
    });

    const activeFilterCount = [
        form.data.preset !== "this_month",
        form.data.service !== "all",
        form.data.status !== "all",
        form.data.college !== "all",
        form.data.counselor_id !== "all",
        form.data.type !== "all",
        form.data.urgency !== "all",
        form.data.preset === "custom",
    ].filter(Boolean).length;

    const handleApplyFilters = (e) => {
        if (e) e.preventDefault();
        form.get(route("reports.index"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePresetChange = (newPreset) => {
        form.setData("preset", newPreset);
        router.get(
            route("reports.index"),
            {
                ...form.data,
                preset: newPreset,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilters = () => {
        router.get(
            route("reports.index"),
            { preset: "this_month" },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const completionRate =
        kpis.total_appointments > 0
            ? Math.round(
                  (kpis.completed_appointments / kpis.total_appointments) * 100,
              )
            : 0;

    const totalServiceCount = rows.reduce((sum, r) => sum + (r.count || 0), 0);

    // Max values for chart scalings
    const monthlyData = analytics.monthlyTrends || [];
    const maxMonthlyTotal = Math.max(
        ...monthlyData.map((m) => m.total || 0),
        10,
    );

    const dayData = analytics.dayOfWeekDistribution || [];
    const maxDayCount = Math.max(...dayData.map((d) => d.count || 0), 5);

    const topColleges = [...collegeBreakdown]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return (
        <Office
            title="Reports & Analytics Hub"
            eyebrow={null}
        >
            {/* Print-Only Official University Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-6">
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                    Bukidnon State University
                </h1>
                <p className="text-sm font-semibold text-slate-700">
                    Student Welfare and Evaluation Unit (SWEU) · Guidance and Counseling Office
                </p>
                <h2 className="mt-4 text-lg font-bold text-slate-900 underline">
                    OFFICIAL GUIDANCE ACCOMPLISHMENT & PERFORMANCE REPORT
                </h2>
                <div className="mt-2 text-xs text-slate-600 flex justify-center gap-6">
                    <span>
                        <strong>Reporting Period:</strong> {from} to {to}
                    </span>
                    <span>
                        <strong>Generated:</strong> {new Date().toLocaleDateString("en-PH")}
                    </span>
                    {form.data.college !== "all" && (
                        <span>
                            <strong>College:</strong> {form.data.college}
                        </span>
                    )}
                </div>
            </div>

            {/* Top Toolbar (Hidden on Print) */}
            <div className="print:hidden mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Guidance Reports & Analytics</span>
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5">
                                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Reporting Period: <span className="font-semibold text-slate-700">{from}</span> to{" "}
                        <span className="font-semibold text-slate-700">{to}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.98]"
                    >
                        <Printer size={14} className="text-slate-500" />
                        Print Report
                    </button>

                    <a
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-sky-800 shadow-xs hover:bg-sky-50 transition active:scale-[0.98]"
                        href={route("reports.index", { ...form.data, download: 1 })}
                    >
                        <Download size={14} className="text-sky-600" />
                        Download CSV
                    </a>

                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                        >
                            <RotateCcw size={13} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Mode Switcher: Analytics vs Accomplishment Reports (Hidden on Print) */}
            <div className="print:hidden mb-6 flex rounded-2xl bg-slate-200/60 p-1 border border-slate-200/80 shadow-inner max-w-md">
                <button
                    type="button"
                    onClick={() => setHubView("analytics")}
                    className={
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all " +
                        (hubView === "analytics"
                            ? "bg-white text-sky-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900")
                    }
                >
                    <BarChart3 size={15} className={hubView === "analytics" ? "text-sky-600" : "text-slate-400"} />
                    <span>Analytics & Trends</span>
                </button>
                <button
                    type="button"
                    onClick={() => setHubView("reports")}
                    className={
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all " +
                        (hubView === "reports"
                            ? "bg-white text-sky-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900")
                    }
                >
                    <FileText size={15} className={hubView === "reports" ? "text-sky-600" : "text-slate-400"} />
                    <span>Accomplishment Reports</span>
                </button>
            </div>

            {/* Quick Date Presets (Hidden on Print) */}
            <div className="print:hidden mb-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                    <Calendar size={13} />
                    Range:
                </span>
                {[
                    ["today", "Today"],
                    ["this_week", "This Week"],
                    ["this_month", "This Month"],
                    ["last_month", "Last Month"],
                    ["semester", "Current Semester"],
                    ["school_year", "Academic Year"],
                    ["all", "All Time"],
                    ["custom", "Custom Dates"],
                ].map(([key, label]) => {
                    const active = form.data.preset === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handlePresetChange(key)}
                            className={
                                "rounded-lg px-2.5 py-1 text-xs font-semibold transition " +
                                (active
                                    ? "bg-sky-700 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")
                            }
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Collapsible Filter Bar (Hidden on Print) */}
            <div className="print:hidden mb-6 rounded-2xl border border-sky-100 bg-white shadow-xs overflow-hidden">
                <div
                    className="flex items-center justify-between px-4 py-3 bg-slate-50/60 border-b border-sky-100 cursor-pointer select-none"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={15} className="text-sky-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Data Filtering Criteria
                        </span>
                    </div>
                    <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition"
                        aria-label="Toggle filters"
                    >
                        {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {filtersOpen && (
                    <form onSubmit={handleApplyFilters} className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {/* Service Type */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Service Module
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.service}
                                    onChange={(e) => form.setData("service", e.target.value)}
                                >
                                    <option value="all">All Services</option>
                                    <option value="appointments">Counseling Appointments & Walk-ins</option>
                                    <option value="testing">Psychological Testing Requests</option>
                                    <option value="cases">Counseling Cases</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Status
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.status}
                                    onChange={(e) => form.setData("status", e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="assigned">Assigned / Awaiting Counselor</option>
                                    <option value="confirmed">Confirmed / Accepted</option>
                                    <option value="completed">Completed / Closed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="approved">Approved (Testing)</option>
                                </select>
                            </div>

                            {/* College */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    College / Academic Unit
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.college}
                                    onChange={(e) => form.setData("college", e.target.value)}
                                >
                                    <option value="all">All Colleges</option>
                                    {colleges.map((col) => (
                                        <option key={col.code} value={col.code}>
                                            {col.code} — {col.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Counselor */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Assigned Counselor
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.counselor_id}
                                    onChange={(e) => form.setData("counselor_id", e.target.value)}
                                >
                                    <option value="all">All Counselors</option>
                                    {counselors.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Appointment Delivery Type */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Appointment Delivery
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.type}
                                    onChange={(e) => form.setData("type", e.target.value)}
                                >
                                    <option value="all">All Delivery Modes</option>
                                    <option value="walk_in">Walk-in Visit</option>
                                    <option value="scheduled">Scheduled Pre-booking</option>
                                </select>
                            </div>

                            {/* Urgency */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Urgency Level
                                </label>
                                <select
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.urgency}
                                    onChange={(e) => form.setData("urgency", e.target.value)}
                                >
                                    <option value="all">All Urgency Levels</option>
                                    <option value="urgent">Urgent / Immediate Crisis</option>
                                    <option value="standard">Standard Routine</option>
                                </select>
                            </div>

                            {/* Custom Dates: From */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.from}
                                    onChange={(e) => {
                                        form.setData({
                                            ...form.data,
                                            from: e.target.value,
                                            preset: "custom",
                                        });
                                    }}
                                />
                            </div>

                            {/* Custom Dates: To */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Through Date
                                </label>
                                <input
                                    type="date"
                                    className="control w-full text-xs rounded-xl"
                                    value={form.data.to}
                                    onChange={(e) => {
                                        form.setData({
                                            ...form.data,
                                            to: e.target.value,
                                            preset: "custom",
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Active range: <strong className="text-slate-800">{from}</strong> to <strong className="text-slate-800">{to}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Reset
                                </button>
                                <Button className="rounded-xl px-4 py-2 text-xs">
                                    <Filter size={13} />
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Executive KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
                {/* Total Appointments */}
                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Appointments
                        </span>
                        <div className="rounded-lg bg-sky-50 p-1.5 text-sky-700">
                            <Calendar size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                        {kpis.total_appointments || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        {kpis.walk_ins || 0} Walk-ins · {kpis.scheduled || 0} Scheduled
                    </div>
                </div>

                {/* Urgent Interventions */}
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-rose-700 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                            Urgent Cases
                        </span>
                        <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-rose-900 tabular-nums flex items-center gap-2">
                        <span>{kpis.urgent || 0}</span>
                        {(kpis.urgent || 0) > 0 && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                        )}
                    </div>
                    <div className="mt-1 text-[11px] text-rose-700 font-medium">
                        Immediate crisis triage
                    </div>
                </div>

                {/* Completed Sessions */}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-700 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            Completed
                        </span>
                        <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-900 tabular-nums">
                        {kpis.completed_appointments || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                        {completionRate}% completion rate
                    </div>
                </div>

                {/* Testing Requests */}
                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Testing
                        </span>
                        <div className="rounded-lg bg-sky-50 p-1.5 text-sky-700">
                            <FileText size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                        {kpis.total_testing || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        {kpis.approved_testing || 0} Approved · {kpis.completed_testing || 0} Done
                    </div>
                </div>

                {/* Counseling Cases */}
                <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Cases Opened
                        </span>
                        <div className="rounded-lg bg-sky-50 p-1.5 text-sky-700">
                            <Briefcase size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                        {kpis.total_cases || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                        {kpis.closed_cases || 0} Closed · {(kpis.total_cases || 0) - (kpis.closed_cases || 0)} Active
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW 1: ANALYTICS & VISUAL TRENDS                                         */}
            {/* ========================================================================= */}
            {hubView === "analytics" && (
                <div className="space-y-6">
                    {/* Monthly Volume Trend Chart */}
                    <Card>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-sky-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-sky-600" />
                                    <span>Six-Month Service Volume Trends</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Historical trajectory of counseling appointments, walk-ins, and psychological tests
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 text-slate-700">
                                    <span className="w-3 h-3 rounded-sm bg-sky-600 inline-block"></span>
                                    Appointments
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-700">
                                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                                    Testing
                                </span>
                            </div>
                        </div>

                        {monthlyData.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                                No historical trend data recorded yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end pt-8 pb-4 h-56">
                                {monthlyData.map((m, idx) => {
                                    const apptHeight = Math.round(((m.appointments || 0) / maxMonthlyTotal) * 100);
                                    const testHeight = Math.round(((m.testing || 0) / maxMonthlyTotal) * 100);
                                    return (
                                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-14 flex items-end justify-center gap-1.5 h-40 pb-2 border-b border-slate-200">
                                                {/* Appointments bar */}
                                                <div
                                                    className="w-1/2 bg-sky-600 rounded-t-md transition-all group-hover:bg-sky-700 relative"
                                                    style={{ height: `${Math.max(apptHeight, 4)}%` }}
                                                    title={`${m.month} Appointments: ${m.appointments}`}
                                                >
                                                    <span className="opacity-0 group-hover:opacity-100 transition absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded-md pointer-events-none whitespace-nowrap z-10">
                                                        {m.appointments}
                                                    </span>
                                                </div>
                                                {/* Testing bar */}
                                                <div
                                                    className="w-1/2 bg-emerald-500 rounded-t-md transition-all group-hover:bg-emerald-600 relative"
                                                    style={{ height: `${Math.max(testHeight, 4)}%` }}
                                                    title={`${m.month} Testing: ${m.testing}`}
                                                >
                                                    <span className="opacity-0 group-hover:opacity-100 transition absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded-md pointer-events-none whitespace-nowrap z-10">
                                                        {m.testing}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="mt-2 text-[10px] sm:text-xs font-bold text-slate-600 truncate max-w-full text-center">
                                                {m.month.split(" ")[0]}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold tabular-nums">
                                                {m.total} total
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Operational Patterns: Day of Week & Peak Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Day of the Week Pattern */}
                        <Card>
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-sky-600" />
                                        <span>Busiest Days of the Week</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Helps staff staff on-duty triage desks accordingly
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {dayData.map((d) => {
                                    const widthPct = Math.round(((d.count || 0) / maxDayCount) * 100);
                                    return (
                                        <div key={d.day} className="flex items-center gap-3 text-xs">
                                            <span className="w-10 font-bold text-slate-700">
                                                {d.day}
                                            </span>
                                            <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full bg-sky-600 rounded-full transition-all"
                                                    style={{ width: `${Math.max(widthPct, 3)}%` }}
                                                ></div>
                                            </div>
                                            <span className="w-16 text-right font-semibold text-slate-700 tabular-nums">
                                                {d.count} ({d.percentage}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Consultation Time & Delivery Split */}
                        <Card>
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Clock size={16} className="text-sky-600" />
                                        <span>Time-of-Day & Triage Distribution</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Morning vs Afternoon consultation preferences
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5 pt-2">
                                {/* Morning vs Afternoon split */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="flex items-center gap-1 text-amber-700">
                                            <Sun size={13} />
                                            Morning (8 AM – 12 PM): {analytics.timeOfDay?.morning || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-indigo-700">
                                            <Moon size={13} />
                                            Afternoon (1 PM – 5 PM): {analytics.timeOfDay?.afternoon || 0}
                                        </span>
                                    </div>
                                    <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                                        <div
                                            className="h-full bg-amber-400 transition-all"
                                            style={{ width: `${analytics.timeOfDay?.morning_pct || 50}%` }}
                                            title={`Morning: ${analytics.timeOfDay?.morning_pct}%`}
                                        ></div>
                                        <div
                                            className="h-full bg-indigo-500 transition-all"
                                            style={{ width: `${analytics.timeOfDay?.afternoon_pct || 50}%` }}
                                            title={`Afternoon: ${analytics.timeOfDay?.afternoon_pct}%`}
                                        ></div>
                                    </div>
                                </div>

                                {/* Walk-in vs Scheduled Pre-booking */}
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-700">
                                            Walk-in Visits: {analytics.typeRatio?.walk_in || 0} ({analytics.typeRatio?.walk_in_pct || 0}%)
                                        </span>
                                        <span className="text-slate-500">
                                            Scheduled: {analytics.typeRatio?.scheduled || 0}
                                        </span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                                        <div
                                            className="h-full bg-sky-600 transition-all"
                                            style={{ width: `${analytics.typeRatio?.walk_in_pct || 0}%` }}
                                        ></div>
                                        <div
                                            className="h-full bg-slate-300 transition-all"
                                            style={{ width: `${100 - (analytics.typeRatio?.walk_in_pct || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Urgency: Crisis vs Routine */}
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-rose-700 flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            Urgent Crisis: {analytics.urgencyRatio?.urgent || 0} ({analytics.urgencyRatio?.urgent_pct || 0}%)
                                        </span>
                                        <span className="text-slate-600">
                                            Standard Routine: {analytics.urgencyRatio?.standard || 0}
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                                        <div
                                            className="h-full bg-rose-600 transition-all"
                                            style={{ width: `${analytics.urgencyRatio?.urgent_pct || 0}%` }}
                                        ></div>
                                        <div
                                            className="h-full bg-slate-300 transition-all"
                                            style={{ width: `${100 - (analytics.urgencyRatio?.urgent_pct || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Top 5 College Demand Leaderboard */}
                    <Card>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 size={16} className="text-sky-600" />
                                    <span>Highest Demand by Academic College</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Colleges with the highest student welfare interactions
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setHubView("reports");
                                    setReportTab("colleges");
                                }}
                                className="text-xs font-bold text-sky-700 hover:text-sky-900 transition underline"
                            >
                                View all colleges →
                            </button>
                        </div>

                        <div className="space-y-4 pt-1">
                            {topColleges.map((col, rank) => (
                                <div key={col.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-48">
                                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px]">
                                            {rank + 1}
                                        </span>
                                        <div>
                                            <strong className="text-slate-800">{col.code}</strong>
                                            <span className="text-slate-400 ml-1.5 hidden sm:inline">
                                                {col.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-1 max-w-md">
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full bg-sky-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, col.percentage || 0)}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-bold text-slate-800 tabular-nums w-20 text-right">
                                            {col.total} ({col.percentage}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: ACCOMPLISHMENT REPORTS & DETAILED AUDIT                            */}
            {/* ========================================================================= */}
            {hubView === "reports" && (
                <div>
                    {/* View Tabs Navigation (Hidden on Print) */}
                    <div className="print:hidden border-b border-sky-100 mb-6 flex flex-wrap gap-2">
                        {[
                            { id: "services", label: "Service Breakdown", icon: BarChart3, count: rows.length },
                            { id: "colleges", label: "College Distribution", icon: Building2, count: collegeBreakdown.length },
                            { id: "counselors", label: "Counselor Caseload", icon: Users, count: counselorBreakdown.length },
                            { id: "activity", label: "Operational Activity Log", icon: Activity, count: recentRecords.length },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = reportTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setReportTab(tab.id)}
                                    className={
                                        "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all " +
                                        (isActive
                                            ? "border-sky-700 text-sky-800 bg-sky-50/50 rounded-t-xl"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")
                                    }
                                >
                                    <Icon size={15} />
                                    <span>{tab.label}</span>
                                    <span
                                        className={
                                            "rounded-full px-2 py-0.5 text-[10px] tabular-nums " +
                                            (isActive ? "bg-sky-200/80 text-sky-900" : "bg-slate-100 text-slate-600")
                                        }
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab 1: Service Metrics Matrix (Official Accreditation View) */}
                    {(reportTab === "services" || typeof window === "undefined") && (
                        <Card className="mb-6">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Institutional Service Summary Metrics
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Official distribution of requests across core guidance services
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-slate-700 tabular-nums">
                                    Total Volume: {totalServiceCount}
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-sky-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-sky-100 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            <th className="py-3 px-4">Service</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Volume</th>
                                            <th className="py-3 px-4 text-right">Share (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sky-50">
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-8 text-center text-xs text-slate-500">
                                                    No service records found for the selected filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((r) => {
                                                const share =
                                                    totalServiceCount > 0
                                                        ? Math.round(((r.count || 0) / totalServiceCount) * 100)
                                                        : 0;
                                                return (
                                                    <tr
                                                        key={r.service + r.status}
                                                        className="hover:bg-sky-50/30 transition-colors"
                                                    >
                                                        <td className="py-3 px-4 font-semibold text-slate-800">
                                                            {r.service === "Appointment"
                                                                ? "Counseling Appointment"
                                                                : r.service === "TestingRequest"
                                                                  ? "Psychological Testing"
                                                                  : r.service.replace(/([a-z])([A-Z])/g, "$1 $2")}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                                                                {r.status.replaceAll("_", " ")}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                                                            {r.count}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-xs text-slate-500 tabular-nums">
                                                            {share}%
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Tab 2: College Distribution */}
                    {reportTab === "colleges" && (
                        <Card className="mb-6">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Student Services by College / Academic Unit
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Utilization and service touchpoints across colleges
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-sky-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-sky-100 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            <th className="py-3 px-4">Code</th>
                                            <th className="py-3 px-4">College Name</th>
                                            <th className="py-3 px-4 text-right">Appointments</th>
                                            <th className="py-3 px-4 text-right">Testing</th>
                                            <th className="py-3 px-4 text-right">Total</th>
                                            <th className="py-3 px-4 text-right w-36">Distribution</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sky-50">
                                        {collegeBreakdown.map((col) => (
                                            <tr
                                                key={col.code}
                                                className="hover:bg-sky-50/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-bold text-sky-800">
                                                    {col.code}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-slate-800">
                                                    {col.name}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-700 tabular-nums">
                                                    {col.appointments}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-700 tabular-nums">
                                                    {col.testing}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                                                    {col.total}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                className="h-full bg-sky-600 rounded-full"
                                                                style={{ width: `${Math.min(100, col.percentage || 0)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-600 tabular-nums w-8">
                                                            {col.percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Tab 3: Counselor Caseload & Performance */}
                    {reportTab === "counselors" && (
                        <Card className="mb-6">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Counselor Caseload & Service Distribution
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Active assignments, completed consultations, and crisis interventions
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-sky-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-sky-100 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            <th className="py-3 px-4">Counselor Name</th>
                                            <th className="py-3 px-4 text-right">Assigned</th>
                                            <th className="py-3 px-4 text-right">Completed Sessions</th>
                                            <th className="py-3 px-4 text-right">Urgent Handled</th>
                                            <th className="py-3 px-4 text-right">Cases Managed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sky-50">
                                        {counselorBreakdown.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-xs text-slate-500">
                                                    No counselor records registered in the system.
                                                </td>
                                            </tr>
                                        ) : (
                                            counselorBreakdown.map((cb) => (
                                                <tr
                                                    key={cb.id}
                                                    className="hover:bg-sky-50/30 transition-colors"
                                                >
                                                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold">
                                                            {cb.name.charAt(0)}
                                                        </div>
                                                        <span>{cb.name}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium text-slate-800 tabular-nums">
                                                        {cb.assigned}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
                                                        {cb.completed}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-rose-700 tabular-nums">
                                                        {cb.urgent}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium text-slate-800 tabular-nums">
                                                        {cb.cases}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Tab 4: Filtered Activity Log (Confidentiality-Safe) */}
                    {reportTab === "activity" && (
                        <Card className="mb-6">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Operational Activity Log
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Confidentiality-protected log of recent service transactions
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                    Showing up to 20 recent records
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-sky-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-sky-100 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4">Service</th>
                                            <th className="py-3 px-4">College</th>
                                            <th className="py-3 px-4">Mode / Type</th>
                                            <th className="py-3 px-4">Urgency</th>
                                            <th className="py-3 px-4">Assigned To</th>
                                            <th className="py-3 px-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sky-50">
                                        {recentRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-xs text-slate-500">
                                                    No operational records match the current filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentRecords.map((rec) => (
                                                <tr
                                                    key={rec.id}
                                                    className="hover:bg-sky-50/30 transition-colors text-xs"
                                                >
                                                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                                                        {rec.date} <span className="text-slate-400">· {rec.time}</span>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-900">
                                                        {rec.service}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                                                            {rec.college}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700">
                                                        {rec.type}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {rec.urgency === "urgent" ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                                                                Urgent
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 font-medium">Standard</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700 font-medium">
                                                        {rec.counselor}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <StatusBadge status={rec.status} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Print-Only Official Sign-off Block */}
            <div className="hidden print:block mt-12 pt-8 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-8 text-xs text-slate-800">
                    <div>
                        <p className="font-semibold text-slate-500 mb-12">Prepared by:</p>
                        <p className="font-bold border-b border-slate-800 pb-1 w-64">
                            Guidance Office Staff / Psychometrician
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Student Welfare and Evaluation Unit</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-500 mb-12">Noted by:</p>
                        <p className="font-bold border-b border-slate-800 pb-1 w-64">
                            University Guidance Center Director
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Bukidnon State University</p>
                    </div>
                </div>
            </div>
        </Office>
    );
}
