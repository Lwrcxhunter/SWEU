import { Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { Button, Errors, Field, StatusBadge } from "@/Components/Office";
import { parseDateBadge, formatSessionTime } from "@/Support/guidanceConstants";
import {
    Calendar,
    Clock,
    FileText,
    Download,
    CheckCircle2,
    CalendarClock,
    MapPin,
    AlertCircle,
    ChevronDown,
    User,
} from "lucide-react";

export default function CounselorAppointmentCard({ item }) {
    const [isRescheduling, setIsRescheduling] = useState(false);
    const form = useForm({
        counselor_id: "",
        scheduled_date: item.scheduled_date || "",
        scheduled_time: item.scheduled_time || "",
    });

    const perform = (action) => {
        form.transform((data) => ({ ...data, action, version: item.version }));
        form.patch(route("appointments.update", item.id), {
            preserveScroll: true,
        });
    };

    const closed = ["completed", "cancelled"].includes(item.status);
    const isAssignedPending =
        item.status === "assigned" ||
        item.status === "assigned_pending_accept" ||
        item.status === "rescheduled";
    const isAccepted = item.status === "accepted";
    const dateInfo = parseDateBadge(item.scheduled_date);
    const formattedTime = formatSessionTime(item.scheduled_time);

    const collegeCode = item.student?.college
        ? typeof item.student.college === "string"
            ? item.student.college
            : item.student.college.code
        : null;

    return (
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-xs transition-all hover:border-sky-200 hover:shadow-md">
            <Errors errors={form.errors} />

            {/* Top Bar: Date Badge + Student Info + Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sky-100/70">
                <div className="flex items-center gap-4">
                    {/* Mini Calendar Date Badge */}
                    {dateInfo ? (
                        <div className="w-14 rounded-xl border border-sky-200/80 bg-white shadow-xs text-center overflow-hidden shrink-0">
                            <div className="bg-sky-600 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                {dateInfo.month}
                            </div>
                            <div className="py-0.5">
                                <span className="block text-xl font-black text-slate-900 leading-tight">
                                    {dateInfo.day}
                                </span>
                                <span className="block text-[9px] font-bold text-sky-700 tracking-wider">
                                    {dateInfo.weekday}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-xl border border-dashed border-sky-200 bg-sky-50/60 flex flex-col items-center justify-center text-center shrink-0">
                            <CalendarClock className="w-5 h-5 text-sky-500 mb-0.5" />
                            <span className="text-[9px] font-bold text-sky-700 uppercase tracking-tight">
                                Pending
                            </span>
                        </div>
                    )}

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <span>
                                    {item.student?.full_name ||
                                        "Unknown Student"}
                                </span>
                                {item.student?.school_id_number && (
                                    <span className="text-xs font-normal text-slate-400">
                                        ({item.student.school_id_number})
                                    </span>
                                )}
                            </h3>
                            {item.urgency_level === "urgent" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                    Urgent
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                <Clock className="w-3.5 h-3.5 text-sky-600" />
                                <span>
                                    {formattedTime
                                        ? `${formattedTime} PST`
                                        : "Date/Time to be scheduled"}
                                </span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="capitalize font-medium text-slate-700">
                                {item.type
                                    ? item.type.replaceAll("_", " ")
                                    : "Counseling Session"}
                            </span>
                            {collegeCode && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-medium text-slate-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md text-[11px]">
                                        College: {collegeCode}
                                        {item.student?.year_level
                                            ? ` · Year ${item.student.year_level}`
                                            : ""}
                                    </span>
                                </>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                <span>Guidance Office</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="self-start sm:self-center">
                    <StatusBadge status={item.status} />
                </div>
            </div>

            {/* Middle Section: Confirmation Status & Onboarding Notes */}
            <div className="py-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center gap-3">
                    {item.student_accepted_at ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                                Student Accepted: {item.student_accepted_at}
                            </span>
                        </span>
                    ) : isAssignedPending ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Awaiting student confirmation</span>
                        </span>
                    ) : null}

                    {item.counselor_accepted_at && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                                Counselor Confirmed:{" "}
                                {item.counselor_accepted_at}
                            </span>
                        </span>
                    )}
                </div>

                {item.onboarding_note && (
                    <div className="rounded-xl bg-sky-50/70 border border-sky-200/80 p-3 text-xs text-sky-950">
                        <span className="font-bold block text-[10px] uppercase tracking-wider text-sky-800 mb-0.5">
                            Counselor Onboarding Note:
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                            {item.onboarding_note}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions Bar */}
            <div className="border-t border-sky-100/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Accept request action */}
                    {isAssignedPending && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("accept")}
                        >
                            Accept request
                        </Button>
                    )}

                    {/* Complete session action */}
                    {isAccepted && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("complete")}
                        >
                            Complete session
                        </Button>
                    )}

                    {/* Clinical Notes Direct Link */}
                    <Link
                        className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 transition shadow-xs inline-flex items-center gap-1.5"
                        href={route("notes.show", item.id)}
                    >
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>View intake & notes</span>
                    </Link>

                    {/* Intake PDF export */}
                    <a
                        className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 inline-flex items-center gap-1.5 transition shadow-xs"
                        href={route("appointments.pdf", item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download className="w-4 h-4 text-sky-600" />
                        <span>Intake PDF</span>
                    </a>
                </div>

                {/* Secondary Actions (Reschedule toggle & Cancel) */}
                <div className="flex items-center gap-2">
                    {!closed && (
                        <button
                            type="button"
                            onClick={() => setIsRescheduling(!isRescheduling)}
                            className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition px-2 py-1"
                        >
                            {isRescheduling ? "Close Reschedule" : "Reschedule"}
                        </button>
                    )}

                    {!closed && (
                        <Button
                            secondary
                            disabled={form.processing}
                            onClick={() => {
                                if (window.confirm("Cancel this appointment?"))
                                    perform("cancel");
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Inline Reschedule Sub-form */}
            {isRescheduling && !closed && (
                <form
                    className="mt-4 p-4 bg-sky-50/60 rounded-xl border border-sky-200 flex flex-wrap items-end gap-3 text-xs"
                    onSubmit={(e) => {
                        e.preventDefault();
                        perform("reschedule");
                    }}
                >
                    <Field
                        label="New date"
                        type="date"
                        form={form}
                        name="scheduled_date"
                        required
                    />
                    <Field
                        label="New time"
                        type="time"
                        step="1800"
                        form={form}
                        name="scheduled_time"
                        required
                    />
                    <Button secondary disabled={form.processing}>
                        Save new schedule
                    </Button>
                </form>
            )}
        </div>
    );
}
