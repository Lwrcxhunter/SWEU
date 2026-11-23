import { useState } from "react";
import { router } from "@inertiajs/react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Card, StatusBadge } from "@/Components/Office";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { parseDateBadge, formatSessionTime } from "@/Support/guidanceConstants";
import {
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    CalendarClock,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";

export default function FollowUpBanner({ appointments = [] }) {
    const [confirmingAppointment, setConfirmingAppointment] = useState(null);
    const [decliningAppointment, setDecliningAppointment] = useState(null);
    const [declineNote, setDeclineNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const [actionErrors, setActionErrors] = useState({});

    if (!appointments || appointments.length === 0) return null;

    const handleAcceptClick = (appointment) => {
        setActionErrors({});
        setConfirmingAppointment(appointment);
    };

    const submitConfirm = () => {
        if (!confirmingAppointment || processing) return;
        setProcessing(true);
        setActionErrors({});

        const url =
            typeof route === "function"
                ? route("appointments.update", confirmingAppointment.id, false)
                : `/appointments/${confirmingAppointment.id}`;

        router.patch(
            url,
            {
                action: "student_confirm",
                version: confirmingAppointment.version,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmingAppointment(null);
                    setProcessing(false);
                },
                onError: (errors) => {
                    console.error("Accept schedule error:", errors);
                    setActionErrors(errors);
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const handleDeclineClick = (appointment) => {
        setActionErrors({});
        setDeclineNote("");
        setDecliningAppointment(appointment);
    };

    const submitDecline = (e) => {
        e.preventDefault();
        if (!decliningAppointment || processing) return;

        const trimmed = declineNote.trim();
        if (!trimmed) {
            setActionErrors({ note: "Please explain why you are declining this follow-up session." });
            return;
        }

        setProcessing(true);
        setActionErrors({});

        const url =
            typeof route === "function"
                ? route("appointments.update", decliningAppointment.id, false)
                : `/appointments/${decliningAppointment.id}`;

        router.patch(
            url,
            {
                action: "student_decline",
                version: decliningAppointment.version,
                note: trimmed,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDecliningAppointment(null);
                    setDeclineNote("");
                    setProcessing(false);
                },
                onError: (errors) => {
                    console.error("Decline schedule error:", errors);
                    setActionErrors(errors);
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <section
            aria-label="Follow-up sessions awaiting your response"
            className="mb-6 space-y-4"
        >
            <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span>Follow-up Sessions Awaiting Your Confirmation</span>
                </h2>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5">
                    Action Required ({appointments.length})
                </span>
            </div>

            {Object.keys(actionErrors).length > 0 && !decliningAppointment && !confirmingAppointment && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        {Object.values(actionErrors).flat().map((msg, i) => (
                            <p key={i}>{msg}</p>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {appointments.map((appointment) => {
                    const dateInfo = parseDateBadge(appointment.scheduled_date);
                    const formattedTime = formatSessionTime(
                        appointment.scheduled_time,
                    );
                    const counselorName =
                        appointment.counselor_name ||
                        appointment.counselor?.full_name ||
                        "Assigned Counselor";
                    const initial =
                        counselorName.trim().charAt(0).toUpperCase() || "C";

                    return (
                        <Card
                            key={appointment.id}
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
                                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                                                <span>
                                                    {formattedTime
                                                        ? `${formattedTime} PST (Philippine Time)`
                                                        : appointment.scheduled_time
                                                          ? `${appointment.scheduled_time} (Philippine Time)`
                                                          : "Schedule Pending Assignment"}
                                                </span>
                                            </h3>

                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
                                                Follow-up Session
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-600">
                                            <span className="capitalize font-semibold text-slate-800">
                                                Follow-up Counseling
                                            </span>
                                            <span className="text-slate-300">
                                                •
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                <span>
                                                    {appointment.channel ===
                                                    "face_to_face"
                                                        ? "Face-to-Face (Guidance Office)"
                                                        : "Virtual (Online)"}
                                                </span>
                                            </span>
                                            {dateInfo && (
                                                <>
                                                    <span className="text-slate-300">
                                                        •
                                                    </span>
                                                    <span className="text-slate-500 font-medium">
                                                        {dateInfo.fullDate}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="self-start sm:self-center">
                                    <StatusBadge status={appointment.status} />
                                </div>
                            </div>

                            {/* Middle Section: Assigned Counselor Details */}
                            <div className="py-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-sky-50/40 border border-sky-100 p-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                            {initial}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-slate-900">
                                                    {counselorName}
                                                </h4>
                                                <span className="text-[10px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200/60">
                                                    Assigned Counselor
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {appointment.counselor
                                                    ?.designation ||
                                                    "SWEU Guidance Counselor"}
                                                {appointment.counselor
                                                    ?.email && (
                                                    <>
                                                        <span className="text-slate-400 mx-1.5">
                                                            •
                                                        </span>
                                                        <span className="text-slate-500">
                                                            {
                                                                appointment
                                                                    .counselor
                                                                    .email
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {appointment.onboarding_note && (
                                    <div className="mt-3 rounded-xl bg-sky-50 border-l-4 border-sky-500 p-3.5 text-xs text-sky-950">
                                        <span className="font-bold block text-[10px] uppercase tracking-wider text-sky-800 mb-0.5">
                                            Note from Counselor:
                                        </span>
                                        <p className="text-slate-800 leading-relaxed">
                                            {appointment.onboarding_note}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Bar: Action Buttons */}
                            <div className="border-t border-sky-100/80 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    Your counselor has proposed this follow-up
                                    schedule. Please confirm your attendance or
                                    request a change.
                                </p>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleAcceptClick(appointment)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Accept Schedule</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleDeclineClick(appointment)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition disabled:opacity-50"
                                    >
                                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Decline / Request Change</span>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Accept Confirmation Modal */}
            <ConfirmationModal
                open={Boolean(confirmingAppointment)}
                title="Confirm Follow-up Schedule?"
                description={
                    confirmingAppointment
                        ? `Are you sure you want to confirm your follow-up counseling session on ${confirmingAppointment.scheduled_date} at ${formatSessionTime(confirmingAppointment.scheduled_time) || confirmingAppointment.scheduled_time} (Philippine Time)?`
                        : "Confirm your follow-up session schedule."
                }
                confirmLabel="Confirm Schedule"
                processingLabel="Confirming..."
                processing={processing}
                errors={actionErrors}
                onConfirm={submitConfirm}
                onClose={() => {
                    if (!processing) {
                        setConfirmingAppointment(null);
                        setActionErrors({});
                    }
                }}
            />

            {/* Decline / Request Change Modal */}
            <Dialog
                open={Boolean(decliningAppointment)}
                onClose={() => {
                    if (!processing) {
                        setDecliningAppointment(null);
                        setActionErrors({});
                    }
                }}
                className="fixed inset-0 z-50"
            >
                <div
                    className="fixed inset-0 bg-slate-900/40"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 overflow-y-auto p-4">
                    <div className="flex min-h-full items-center justify-center">
                        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                Decline Follow-up / Request Change
                            </DialogTitle>
                            <p className="mt-1 text-xs text-slate-500">
                                Please provide a reason. Your note will be shared with your assigned counselor so they can coordinate a new schedule for you.
                            </p>
                            <form className="mt-4" onSubmit={submitDecline}>
                                <label
                                    htmlFor="follow-up-reason"
                                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                >
                                    Reason for declining / requesting change
                                </label>
                                <textarea
                                    id="follow-up-reason"
                                    data-autofocus
                                    required
                                    maxLength={1000}
                                    rows={4}
                                    placeholder="e.g., I have a conflicting class or exam at this time. Could we schedule on Friday morning instead?"
                                    value={declineNote}
                                    onChange={(event) =>
                                        setDeclineNote(event.target.value)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                                {Object.values(actionErrors)
                                    .flat()
                                    .map((error, index) => (
                                        <p
                                            key={index}
                                            role="alert"
                                            className="mt-2 text-xs font-medium text-rose-600"
                                        >
                                            {error}
                                        </p>
                                    ))}
                                <div className="mt-5 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => {
                                            setDecliningAppointment(null);
                                            setActionErrors({});
                                        }}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition disabled:opacity-50"
                                    >
                                        {processing && (
                                            <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                                        )}
                                        <span>Submit Reason</span>
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </section>
    );
}
