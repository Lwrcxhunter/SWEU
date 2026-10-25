import axios from "axios";
import { Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarPlus, FileText } from "lucide-react";
import Office, { Button, Card, Empty, Errors } from "@/Components/Office";

function displayValue(value) {
    if (Array.isArray(value)) return value.join(", ");
    return value || "Not provided";
}

function localDate(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CaseDetail({
    caseRecord,
    student,
    intake,
    intakeSubmittedAt,
    initialAppointmentId,
    sessions,
}) {
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsError, setSlotsError] = useState("");
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [caseError, setCaseError] = useState("");
    const [caseSuccess, setCaseSuccess] = useState("");
    const [processing, setProcessing] = useState(false);
    const followUp = useForm({
        targetDate: "",
        scheduledTime: "",
        mode: "F2F",
    });

    useEffect(() => {
        if (!followUp.data.targetDate || !showFollowUp) {
            setAvailableSlots([]);
            setSlotsError("");
            setSlotsLoading(false);
            return;
        }

        let active = true;
        setSlotsLoading(true);
        setAvailableSlots([]);
        setSlotsError("");
        followUp.setData("scheduledTime", "");
        axios
            .get(route("cases.follow-up-slots", caseRecord.id), {
                params: { date: followUp.data.targetDate },
            })
            .then(({ data }) => {
                if (active) setAvailableSlots(data.slots);
            })
            .catch((error) => {
                if (!active) return;
                setSlotsError(
                    error.response?.data?.message ||
                        "Available times could not be loaded. Try again.",
                );
            })
            .finally(() => {
                if (active) setSlotsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [caseRecord.id, followUp.data.targetDate, showFollowUp]);

    const submitFollowUp = (event) => {
        event.preventDefault();
        setProcessing(true);
        setCaseError("");
        setCaseSuccess("");
        followUp.clearErrors();
        axios
            .post(route("cases.follow-up", caseRecord.id), followUp.data)
            .then(() => {
                setShowFollowUp(false);
                setCaseSuccess(
                    "Follow-up scheduled; the student can review it in their appointments.",
                );
                followUp.reset();
                router.reload({ preserveScroll: true });
            })
            .catch((error) => {
                if (error.response?.data?.errors)
                    followUp.setError(error.response.data.errors);
                setCaseError(
                    error.response?.data?.message ||
                        "The follow-up could not be scheduled. Please try again.",
                );
            })
            .finally(() => setProcessing(false));
    };

    const closeCase = () => {
        if (
            !window.confirm(
                "Close this case? Its intake, appointments, and session history will remain available.",
            )
        ) {
            return;
        }

        setProcessing(true);
        setCaseError("");
        setCaseSuccess("");
        axios
            .post(route("cases.close", caseRecord.id))
            .then(() => {
                setCaseSuccess("Case closed. Its history remains available.");
                router.reload({ preserveScroll: true });
            })
            .catch((error) =>
                setCaseError(
                    error.response?.data?.message ||
                        "The case could not be closed. Please try again.",
                ),
            )
            .finally(() => setProcessing(false));
    };

    const latestSession = [...sessions].sort((left, right) =>
        `${right.session_date || ""} ${right.scheduled_time || ""}`.localeCompare(
            `${left.session_date || ""} ${left.scheduled_time || ""}`,
        ),
    )[0];
    const nextFollowUp = sessions
        .filter(
            (session) =>
                session.is_follow_up &&
                session.status === "scheduled" &&
                session.session_date >= localDate(),
        )
        .sort((left, right) =>
            `${left.session_date || ""} ${left.scheduled_time || ""}`.localeCompare(
                `${right.session_date || ""} ${right.scheduled_time || ""}`,
            ),
        )[0];

    return (
        <Office
            title={caseRecord.case_number}
            eyebrow="Counseling case"
            description={`${student.name} · ${caseRecord.category.replaceAll("_", " ")}`}
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={route("counselor.cases.index")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800 hover:underline"
                >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    All cases
                </Link>
                <div className="flex flex-wrap gap-2">
                    {initialAppointmentId && (
                        <>
                            <Link
                                href={route("notes.show", initialAppointmentId)}
                                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                            >
                                <FileText
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                />
                                Initial session notes
                            </Link>
                            <a
                                href={route(
                                    "appointments.pdf",
                                    initialAppointmentId,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                            >
                                Intake PDF
                            </a>
                        </>
                    )}
                </div>
            </div>

            {caseError && (
                <p
                    role="alert"
                    className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                >
                    {caseError}
                </p>
            )}
            {caseSuccess && (
                <p
                    role="status"
                    className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
                >
                    {caseSuccess}
                </p>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                    <Card title="Case overview">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Student
                                </dt>
                                <dd className="mt-1 font-medium text-slate-900">
                                    {student.name}
                                </dd>
                                <dd className="text-sm text-slate-600">
                                    {student.school_id_number}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Case status
                                </dt>
                                <dd className="mt-1 capitalize text-slate-900">
                                    {caseRecord.status.replaceAll("_", " ")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Opened
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {caseRecord.opened_at || "Not recorded"}
                                </dd>
                            </div>
                            {caseRecord.status === "closed" && (
                                <div>
                                    <dt className="text-xs text-slate-500">
                                        Closed by
                                    </dt>
                                    <dd className="mt-1 text-slate-900">
                                        {caseRecord.closed_by
                                            ? "You"
                                            : "Not recorded"}
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Assigned counselor
                                </dt>
                                <dd className="mt-1 text-slate-900">You</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Most recent session
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {latestSession?.session_date ||
                                        "No session recorded"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Next follow-up
                                </dt>
                                <dd className="mt-1 text-slate-900">
                                    {nextFollowUp?.session_date ||
                                        "None scheduled"}
                                </dd>
                            </div>
                        </dl>
                    </Card>

                    <Card
                        title="Intake information"
                        description="Private intake details are shown only to the counselor assigned to this case."
                    >
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Intake submitted
                                </dt>
                                <dd className="mt-1 text-sm text-slate-800">
                                    {intakeSubmittedAt || "Not recorded"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Living situation
                                </dt>
                                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                                    {displayValue(intake.living_condition)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Personal concerns
                                </dt>
                                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                                    {displayValue(intake.personal_concerns)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500">
                                    Referred by
                                </dt>
                                <dd className="mt-1 text-sm text-slate-800">
                                    {displayValue(intake.referred_by)}
                                </dd>
                            </div>
                            <p className="text-xs text-slate-500">
                                College:{" "}
                                {typeof student.college === "object"
                                    ? student.college?.name ||
                                      student.college?.code
                                    : student.college || "Not recorded"}
                                {student.year_level
                                    ? ` · Year ${student.year_level}`
                                    : ""}
                            </p>
                        </dl>
                    </Card>

                    <Card
                        title="Session history"
                        description="Each appointment has its own record. Newest sessions appear first; open one to review or update its notes."
                    >
                        {sessions.length === 0 ? (
                            <Empty>
                                No sessions are recorded for this case.
                            </Empty>
                        ) : (
                            <ol className="divide-y divide-slate-100">
                                {sessions.map((session) => (
                                    <li
                                        key={session.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                                    >
                                        <div>
                                            <h3 className="font-medium text-slate-900">
                                                Session {session.session_number}
                                                {session.is_follow_up
                                                    ? " · Follow-up"
                                                    : " · Initial"}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {session.session_date} ·{" "}
                                                {session.scheduled_time ||
                                                    session.time_slot}{" "}
                                                · {session.mode} ·{" "}
                                                {session.status.replaceAll(
                                                    "_",
                                                    " ",
                                                )}{" "}
                                                · Handled by you
                                            </p>
                                        </div>
                                        {session.appointment_id ? (
                                            <Link
                                                href={route(
                                                    "notes.show",
                                                    session.appointment_id,
                                                )}
                                                className="text-sm font-semibold text-sky-800 hover:underline"
                                            >
                                                Open session notes
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-slate-500">
                                                Session record only
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card
                        title="Case actions"
                        description="Appointments and case records are retained when a case is closed."
                    >
                        <div className="space-y-3">
                            {caseRecord.status !== "closed" && (
                                <>
                                    <Button
                                        type="button"
                                        onClick={() => setShowFollowUp(true)}
                                        className="w-full"
                                    >
                                        <CalendarPlus
                                            aria-hidden="true"
                                            className="mr-2 inline h-4 w-4"
                                        />
                                        Schedule follow-up
                                    </Button>
                                    <Button
                                        type="button"
                                        secondary
                                        disabled={processing}
                                        onClick={closeCase}
                                        className="w-full"
                                    >
                                        Close case
                                    </Button>
                                </>
                            )}
                            {caseRecord.status === "closed" && (
                                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                    Closed{" "}
                                    {caseRecord.closed_at ||
                                        "without a recorded date"}
                                    . The case history remains available.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {showFollowUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="case-followup-title"
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <h2
                            id="case-followup-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            Schedule a follow-up
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            The new appointment will stay in case{" "}
                            {caseRecord.case_number}.
                        </p>
                        <form
                            className="mt-5 space-y-4"
                            onSubmit={submitFollowUp}
                        >
                            <label className="block text-xs font-semibold text-slate-700">
                                Date
                                <input
                                    type="date"
                                    min={localDate(1)}
                                    required
                                    value={followUp.data.targetDate}
                                    onChange={(event) =>
                                        followUp.setData(
                                            "targetDate",
                                            event.target.value,
                                        )
                                    }
                                    className="control mt-2"
                                />
                            </label>
                            {followUp.data.targetDate && (
                                <label className="block text-xs font-semibold text-slate-700">
                                    Available 30-minute time
                                    <select
                                        required
                                        value={followUp.data.scheduledTime}
                                        onChange={(event) =>
                                            followUp.setData(
                                                "scheduledTime",
                                                event.target.value,
                                            )
                                        }
                                        className="control mt-2"
                                    >
                                        <option value="">
                                            Select an available time
                                        </option>
                                        {availableSlots.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            {followUp.data.targetDate && slotsLoading && (
                                <p
                                    role="status"
                                    className="text-sm text-slate-600"
                                >
                                    Loading available times...
                                </p>
                            )}
                            {followUp.data.targetDate &&
                                !slotsLoading &&
                                !slotsError &&
                                availableSlots.length === 0 && (
                                    <p className="text-sm text-amber-800">
                                        No available times for this date. Choose
                                        another date or update your schedule.
                                    </p>
                                )}
                            {slotsError && (
                                <p
                                    role="alert"
                                    className="text-sm text-rose-700"
                                >
                                    {slotsError}
                                </p>
                            )}
                            <label className="block text-xs font-semibold text-slate-700">
                                Session mode
                                <select
                                    value={followUp.data.mode}
                                    onChange={(event) =>
                                        followUp.setData(
                                            "mode",
                                            event.target.value,
                                        )
                                    }
                                    className="control mt-2"
                                >
                                    <option value="F2F">Face-to-face</option>
                                    <option value="Virtual">Virtual</option>
                                </select>
                            </label>
                            <Errors errors={followUp.errors} />
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    secondary
                                    disabled={processing}
                                    onClick={() => setShowFollowUp(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={
                                        processing ||
                                        slotsLoading ||
                                        !followUp.data.scheduledTime
                                    }
                                >
                                    {processing
                                        ? "Scheduling..."
                                        : "Schedule follow-up"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Office>
    );
}
