import { Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Office, { Button, Card, Empty, Pagination } from "@/Components/Office";
import CounselorAppointmentCard from "@/Components/CounselorAppointmentCard";

export default function Dashboard({ appointments, followups }) {
    const [exportRange, setExportRange] = useState("day");
    const [exportFormat, setExportFormat] = useState("csv");
    const [exportFrom, setExportFrom] = useState("");
    const [exportTo, setExportTo] = useState("");
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");

    useEffect(() => {
        let refreshing = false;
        let cancelToken;
        const poll = () => {
            if (document.hidden || refreshing) return;
            refreshing = true;
            router.reload({
                only: ["appointments", "followups"],
                preserveScroll: true,
                preserveState: true,
                onCancelToken: (token) => {
                    cancelToken = token;
                },
                onFinish: () => {
                    refreshing = false;
                },
            });
        };

        const timer = setInterval(poll, 45000);

        // Poll immediately when tab becomes visible again
        const onVisibility = () => {
            if (!document.hidden) poll();
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            clearInterval(timer);
            cancelToken?.cancel();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    const downloadReport = () => {
        setExportError("");
        if (
            exportRange === "custom" &&
            (!exportFrom || !exportTo || exportFrom > exportTo)
        ) {
            setExportError("Choose a valid custom date range.");
            return;
        }

        const params = new URLSearchParams({
            range: exportRange,
            format: exportFormat,
        });
        if (exportRange === "custom") {
            params.set("from", exportFrom);
            params.set("to", exportTo);
        }
        const url = `${route("counselor.reports.sessions")}?${params.toString()}`;
        if (exportFormat === "pdf")
            window.open(url, "_blank", "noopener,noreferrer");
        else window.location.assign(url);

        setExporting(true);
        window.setTimeout(() => setExporting(false), 1800);
    };

    return (
        <Office
            title="Care, one conversation at a time."
            eyebrow="Counselor workspace"
            description="Review your assigned requests and keep follow-ups in view."
        >
            <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
                <Card title="My appointments">
                    {!appointments.data.length ? (
                        <Empty>No assigned appointments yet.</Empty>
                    ) : (
                        <div className="space-y-4">
                            {appointments.data.map((a) => (
                                <CounselorAppointmentCard key={a.id} item={a} />
                            ))}
                        </div>
                    )}
                    <Pagination data={appointments} />
                </Card>
                <div className="space-y-6">
                    <Card title="Export case and session log">
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">
                                Date range
                                <select
                                    value={exportRange}
                                    onChange={(event) =>
                                        setExportRange(event.target.value)
                                    }
                                    className="control mt-2"
                                >
                                    <option value="day">Today</option>
                                    <option value="week">This week</option>
                                    <option value="month">This month</option>
                                    <option value="custom">Custom range</option>
                                </select>
                            </label>
                            {exportRange === "custom" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-xs font-semibold text-slate-700">
                                        From
                                        <input
                                            type="date"
                                            value={exportFrom}
                                            onChange={(event) =>
                                                setExportFrom(
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        To
                                        <input
                                            type="date"
                                            value={exportTo}
                                            onChange={(event) =>
                                                setExportTo(event.target.value)
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                </div>
                            )}
                            <label className="block text-xs font-semibold text-slate-700">
                                Format
                                <select
                                    value={exportFormat}
                                    onChange={(event) =>
                                        setExportFormat(event.target.value)
                                    }
                                    className="control mt-2"
                                >
                                    <option value="csv">CSV / Excel</option>
                                    <option value="pdf">Printable PDF</option>
                                </select>
                            </label>
                            {exportError && (
                                <p
                                    role="alert"
                                    className="text-xs text-rose-700"
                                >
                                    {exportError}
                                </p>
                            )}
                            <Button
                                type="button"
                                disabled={exporting}
                                onClick={downloadReport}
                            >
                                {exporting ? "Preparing export…" : "Download"}
                            </Button>
                            {exportFormat === "pdf" && (
                                <p className="text-[11px] leading-5 text-slate-500">
                                    Opens a print-ready page. Choose “Save as
                                    PDF” in the browser print dialog.
                                </p>
                            )}
                        </div>
                    </Card>
                    <Card
                        title="Weekly schedule"
                        description="Manage counseling hours, class blocks, and leave dates. Assignment status remains controlled separately."
                    >
                        <Link
                            href={route("counselor.schedule")}
                            className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                        >
                            Open schedule planner
                        </Link>
                    </Card>
                    <Card
                        title="Follow-up list"
                        description="Cases you flagged for continued support."
                    >
                        {followups.data.length ? (
                            followups.data.map((f) => (
                                <Link
                                    key={f.appointment_id}
                                    href={route("notes.show", f.appointment_id)}
                                    className="block border-b border-sky-100/70 py-4 hover:text-sky-700 transition"
                                >
                                    <p className="text-sm font-semibold text-slate-800">
                                        {f.student.full_name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Follow up: {f.next_followup_date}
                                    </p>
                                </Link>
                            ))
                        ) : (
                            <Empty>No follow-ups flagged.</Empty>
                        )}
                        <Pagination data={followups} />
                    </Card>
                </div>
            </div>
        </Office>
    );
}
