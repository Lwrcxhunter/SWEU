import { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import Office, {
    Card,
    Button,
    Pagination,
    StatusBadge,
} from "@/Components/Office";
import {
    Calendar,
    Clock,
    Plus,
    FileText,
    CheckCircle2,
    AlertCircle,
    MapPin,
    CalendarClock,
    ChevronDown,
} from "lucide-react";
import { parseDateBadge, formatSessionTime } from "@/Support/guidanceConstants";
import FollowUpBanner from "./FollowUpBanner";

function ChannelBadge({ channel }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>
                {channel === "face_to_face"
                    ? "Face-to-Face (Guidance Office)"
                    : "Virtual (Online)"}
            </span>
        </span>
    );
}

export default function BookAppointment({
    appointments,
    hasIntake,
    followUps = [],
}) {
    const [reschedulingId, setReschedulingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const rescheduleForm = useForm({
        action: "reschedule",
        scheduled_date: "",
        scheduled_time: "",
        version: 1,
    });

    const actionForm = useForm({
        action: "",
        version: 1,
    });

    const walkForm = useForm({});

    const handleAccept = (appointment) => {
        if (!confirm("Confirm this counselor-approved schedule?")) return;
        actionForm.setData({
            action: "student_confirm",
            version: appointment.version,
        });
        router.patch(
            route("appointments.update", appointment.id),
            {
                action: "student_confirm",
                version: appointment.version,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleCancel = (appointment) => {
        if (
            !confirm(
                "Are you sure you want to cancel this appointment request?",
            )
        )
            return;
        router.patch(
            route("appointments.update", appointment.id),
            {
                action: "cancel",
                version: appointment.version,
            },
            {
                preserveScroll: true,
                onSuccess: () => setCancellingId(null),
            },
        );
    };

    const handleRescheduleSubmit = (e, appointment) => {
        e.preventDefault();
        rescheduleForm.setData("version", appointment.version);
        rescheduleForm.patch(route("appointments.update", appointment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setReschedulingId(null);
                rescheduleForm.reset();
            },
        });
    };

    return (
        <Office
            title="My Counseling Appointments"
            eyebrow="Student Appointments"
            description="Manage your counseling sessions, review assigned counselor profiles, and track schedule confirmations."
            action={
                <div className="flex flex-wrap items-center gap-3">
                    {hasIntake ? (
                        <Link
                            href={route("appointments.request")}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-sky-700 shadow-sm hover:bg-sky-50 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Request a Session
                        </Link>
                    ) : (
                        <Link
                            href={route("personal-information.edit")}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
                        >
                            Complete Profile to Book
                        </Link>
                    )}
                </div>
            }
        >
            <FollowUpBanner appointments={followUps} />
            {!hasIntake && (
                <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">
                            Student Profile Incomplete
                        </p>
                        <p className="mt-1 text-xs text-amber-800 leading-5">
                            Before requesting a counseling session, please
                            complete your official SWEU personal and medical
                            information record.
                        </p>
                        <Link
                            href={route("personal-information.edit")}
                            className="inline-block mt-2 font-semibold text-xs text-amber-950 underline hover:no-underline"
                        >
                            Complete Personal Information &rarr;
                        </Link>
                    </div>
                </div>
            )}

            <div className="px-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Recent Appointments &amp; Requests
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">
                            {appointments?.data?.length || 0} session(s) on
                            record
                        </span>
                    </div>

                    {!appointments?.data.length ? (
                        <Card className="text-center py-12">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center text-xl mb-3">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                No appointments scheduled yet
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Guidance counselors are available to assist you
                                with academic, personal, or emotional concerns.
                            </p>
                            <div className="mt-5">
                                {hasIntake ? (
                                    <Link
                                        href={route("appointments.request")}
                                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Start Request Wizard</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={route(
                                            "personal-information.edit",
                                        )}
                                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition shadow-sm"
                                    >
                                        Complete Personal Details First
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {appointments.data.map((item) => {
                                const isPending =
                                    item.status === "pending_assignment" ||
                                    item.status === "pending";
                                const isAssignedPending =
                                    item.status ===
                                        "assigned_pending_counselor" ||
                                    item.status ===
                                        "counselor_accepted_pending_student" ||
                                    item.status === "reassignment_requested" ||
                                    item.status === "assigned_pending_accept" ||
                                    item.status === "assigned" ||
                                    item.status === "rescheduled";
                                const isAwaitingCounselor =
                                    item.status ===
                                    "assigned_pending_counselor";
                                const isAwaitingStudentConfirmation =
                                    item.status ===
                                    "counselor_accepted_pending_student";
                                const isAccepted = [
                                    "accepted",
                                    "confirmed",
                                ].includes(item.status);
                                const isRescheduled =
                                    item.status === "rescheduled";
                                const isCancelled = [
                                    "cancelled",
                                    "declined_by_student",
                                ].includes(item.status);
                                const isCompleted = item.status === "completed";
                                const isAssigned = Boolean(
                                    item.counselor ||
                                    item.counselor_id ||
                                    isAssignedPending ||
                                    isAccepted,
                                );

                                const dateInfo = parseDateBadge(
                                    item.scheduled_date,
                                );
                                const formattedTime = formatSessionTime(
                                    item.scheduled_time,
                                );

                                return (
                                    <Card
                                        key={item.id}
                                        className="transition-all hover:border-sky-200 hover:shadow-md"
                                    >
                                        {/* Top Bar: Date Badge + Session Info + Status */}
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
                                                                {
                                                                    dateInfo.weekday
                                                                }
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
                                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                                            <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                                                            <span>
                                                                {formattedTime
                                                                    ? `${formattedTime} PST`
                                                                    : item.preferred_period
                                                                      ? `${item.preferred_period.toUpperCase()} preferred window; time pending assignment`
                                                                      : "Schedule Pending Assignment"}
                                                            </span>
                                                        </h3>
                                                        {item.urgency_level ===
                                                            "urgent" && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wide">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                                                Urgent Priority
                                                            </span>
                                                        )}
                                                        {item.type ===
                                                            "follow_up" && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                                                                Follow-up
                                                                Session
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-600">
                                                        <span className="capitalize font-semibold text-slate-800">
                                                            {item.type
                                                                ? item.type.replaceAll(
                                                                      "_",
                                                                      " ",
                                                                  )
                                                                : "Counseling Session"}
                                                        </span>
                                                        <span className="text-slate-300">
                                                            •
                                                        </span>
                                                        <ChannelBadge
                                                            channel={
                                                                item.channel
                                                            }
                                                        />
                                                        {dateInfo && (
                                                            <>
                                                                <span className="text-slate-300">
                                                                    •
                                                                </span>
                                                                <span className="text-slate-500 font-medium">
                                                                    {
                                                                        dateInfo.fullDate
                                                                    }
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="self-start sm:self-center">
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                            </div>
                                        </div>

                                        {/* Middle Section: Assigned Counselor Details / Notice */}
                                        <div className="py-3.5">
                                            {item.counselor ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-sky-50/40 border border-sky-100 p-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                            {item.counselor.full_name?.charAt(
                                                                0,
                                                            ) || "C"}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-bold text-slate-900">
                                                                    {
                                                                        item
                                                                            .counselor
                                                                            .full_name
                                                                    }
                                                                </h4>
                                                                <span className="text-[10px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200/60">
                                                                    Assigned
                                                                    Counselor
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-0.5">
                                                                {item.counselor
                                                                    .designation ||
                                                                    "SWEU Guidance Counselor"}
                                                                <span className="text-slate-400 mx-1.5">
                                                                    •
                                                                </span>
                                                                <span className="text-slate-500">
                                                                    {
                                                                        item
                                                                            .counselor
                                                                            .email
                                                                    }
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 p-3.5 text-xs text-amber-900">
                                                    <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>
                                                        Your appointment request
                                                        is queued. Guidance
                                                        front desk staff is
                                                        assigning an available
                                                        counselor for you.
                                                    </span>
                                                </div>
                                            )}

                                            {/* Counselor Onboarding Note */}
                                            {item.onboarding_note && (
                                                <div className="mt-3 rounded-xl bg-sky-50 border-l-4 border-sky-500 p-3.5 text-xs text-sky-950">
                                                    <span className="font-bold block text-[10px] uppercase tracking-wider text-sky-800 mb-0.5">
                                                        Note from Counselor:
                                                    </span>
                                                    <p className="text-slate-800 leading-relaxed">
                                                        {item.onboarding_note}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Progressive Disclosure: Intake Details & Questionnaire */}
                                            {(item.initial_visit_questionnaire
                                                ?.reason ||
                                                item.initial_visit_questionnaire
                                                    ?.average_sleep ||
                                                item.student_accepted_at ||
                                                item.counselor_accepted_at) && (
                                                <details className="group mt-3.5 border-t border-sky-100/70 pt-2.5">
                                                    <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-medium text-sky-700 hover:text-sky-900 transition py-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                                                            <span>
                                                                View Intake
                                                                Details &amp;
                                                                Confirmation
                                                                History
                                                            </span>
                                                        </span>
                                                        <ChevronDown className="w-4 h-4 text-sky-600 transition-transform group-open:rotate-180" />
                                                    </summary>

                                                    <div className="mt-2.5 space-y-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 p-3.5 text-xs text-slate-700">
                                                        {item
                                                            .initial_visit_questionnaire
                                                            ?.reason && (
                                                            <div>
                                                                <span className="font-semibold text-slate-900 block text-[11px] mb-1">
                                                                    Reason for
                                                                    Visit:
                                                                </span>
                                                                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                                                                    {
                                                                        item
                                                                            .initial_visit_questionnaire
                                                                            .reason
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                        {item
                                                            .initial_visit_questionnaire
                                                            ?.average_sleep && (
                                                            <p className="text-slate-700">
                                                                <strong className="text-slate-900">
                                                                    Average
                                                                    Sleep:
                                                                </strong>{" "}
                                                                {
                                                                    item
                                                                        .initial_visit_questionnaire
                                                                        .average_sleep
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-emerald-700 font-medium pt-2 border-t border-slate-200/40">
                                                            {item.student_accepted_at && (
                                                                <span>
                                                                    ✓ Student
                                                                    Confirmed:{" "}
                                                                    {
                                                                        item.student_accepted_at
                                                                    }
                                                                </span>
                                                            )}
                                                            {item.counselor_accepted_at && (
                                                                <span>
                                                                    ✓ Counselor
                                                                    Confirmed:{" "}
                                                                    {
                                                                        item.counselor_accepted_at
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </details>
                                            )}
                                        </div>

                                        {item.student_decline_note && (
                                            <p className="mb-3 text-sm text-slate-700">
                                                Declined{" "}
                                                {item.student_declined_at}:{" "}
                                                {item.student_decline_note}
                                            </p>
                                        )}

                                        {/* Action Buttons Row */}
                                        <div className="border-t border-sky-100/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {isAwaitingCounselor && (
                                                    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-medium text-sky-900">
                                                        Your appointment is
                                                        awaiting counselor
                                                        acceptance. You can
                                                        confirm it after the
                                                        counselor approves the
                                                        schedule.
                                                    </p>
                                                )}

                                                {isAwaitingStudentConfirmation &&
                                                    item.type !==
                                                        "follow_up" && (
                                                        <button
                                                            onClick={() =>
                                                                handleAccept(
                                                                    item,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>
                                                                {item.type ===
                                                                "follow_up"
                                                                    ? "Confirm Follow-up Schedule"
                                                                    : "Confirm Schedule"}
                                                            </span>
                                                        </button>
                                                    )}

                                                {/* PDF Export for Confirmed, Completed or Assigned */}
                                                {(isAccepted ||
                                                    isCompleted ||
                                                    isAssignedPending) && (
                                                    <a
                                                        href={route(
                                                            "appointments.pdf",
                                                            item.id,
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50 transition shadow-sm"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                                                        <span>
                                                            Export PDF / Intake
                                                            Summary
                                                        </span>
                                                    </a>
                                                )}

                                                {/* Reschedule Button */}
                                                {!isCancelled &&
                                                    !isCompleted && (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isAssigned
                                                            }
                                                            title={
                                                                isAssigned
                                                                    ? "Reschedule is not possible once a counselor has been assigned."
                                                                    : "Reschedule appointment"
                                                            }
                                                            onClick={() => {
                                                                if (isAssigned)
                                                                    return;
                                                                if (
                                                                    reschedulingId ===
                                                                    item.id
                                                                ) {
                                                                    setReschedulingId(
                                                                        null,
                                                                    );
                                                                } else {
                                                                    setReschedulingId(
                                                                        item.id,
                                                                    );
                                                                    rescheduleForm.setData(
                                                                        {
                                                                            action: "reschedule",
                                                                            scheduled_date:
                                                                                item.scheduled_date ||
                                                                                "",
                                                                            scheduled_time:
                                                                                item.scheduled_time ||
                                                                                "",
                                                                            version:
                                                                                item.version,
                                                                        },
                                                                    );
                                                                }
                                                            }}
                                                            className={
                                                                isAssigned
                                                                    ? "rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
                                                                    : "rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50 transition shadow-sm"
                                                            }
                                                        >
                                                            {reschedulingId ===
                                                            item.id
                                                                ? "Cancel Editing"
                                                                : "Reschedule"}
                                                        </button>
                                                    )}
                                            </div>

                                            {/* Cancel Action */}
                                            {!isCancelled &&
                                                !isCompleted &&
                                                !(
                                                    isAwaitingStudentConfirmation &&
                                                    item.type === "follow_up"
                                                ) && (
                                                    <button
                                                        type="button"
                                                        disabled={isAccepted}
                                                        title={
                                                            isAccepted
                                                                ? "Cancellation is not allowed once an assigned schedule has been accepted."
                                                                : "Cancel Request"
                                                        }
                                                        onClick={() => {
                                                            if (isAccepted)
                                                                return;
                                                            handleCancel(item);
                                                        }}
                                                        className={
                                                            isAccepted
                                                                ? "text-xs font-medium text-slate-400 cursor-not-allowed opacity-60 px-2 py-1"
                                                                : "text-xs font-semibold text-rose-600 hover:text-rose-800 transition px-2 py-1"
                                                        }
                                                    >
                                                        Cancel Request
                                                    </button>
                                                )}
                                        </div>

                                        {/* Inline Reschedule Box */}
                                        {reschedulingId === item.id &&
                                            !isAssigned && (
                                                <form
                                                    onSubmit={(e) =>
                                                        handleRescheduleSubmit(
                                                            e,
                                                            item,
                                                        )
                                                    }
                                                    className="mt-3.5 p-4 bg-sky-50/60 rounded-xl border border-sky-200 flex flex-wrap items-end gap-3 text-xs"
                                                >
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                                            New Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={
                                                                rescheduleForm
                                                                    .data
                                                                    .scheduled_date
                                                            }
                                                            onChange={(e) =>
                                                                rescheduleForm.setData(
                                                                    "scheduled_date",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="rounded-lg border-sky-200 text-xs px-2.5 py-1.5 focus:ring-sky-400 focus:border-sky-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                                            New Time (30-min
                                                            interval)
                                                        </label>
                                                        <input
                                                            type="time"
                                                            step="1800"
                                                            required
                                                            value={
                                                                rescheduleForm
                                                                    .data
                                                                    .scheduled_time
                                                            }
                                                            onChange={(e) =>
                                                                rescheduleForm.setData(
                                                                    "scheduled_time",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="rounded-lg border-sky-200 text-xs px-2.5 py-1.5 focus:ring-sky-400 focus:border-sky-400"
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            rescheduleForm.processing
                                                        }
                                                        className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition shadow-sm"
                                                    >
                                                        Save New Schedule
                                                    </button>
                                                    {rescheduleForm.errors
                                                        .scheduled_time && (
                                                        <p className="w-full text-xs text-rose-600 mt-1">
                                                            {
                                                                rescheduleForm
                                                                    .errors
                                                                    .scheduled_time
                                                            }
                                                        </p>
                                                    )}
                                                    {rescheduleForm.errors
                                                        .conflict && (
                                                        <p className="w-full text-xs text-rose-600 mt-1">
                                                            {
                                                                rescheduleForm
                                                                    .errors
                                                                    .conflict
                                                            }
                                                        </p>
                                                    )}
                                                </form>
                                            )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <Pagination data={appointments} />
                </div>
            </div>
        </Office>
    );
}
