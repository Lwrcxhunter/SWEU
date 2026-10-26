import axios from "axios";
import { Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Office, {
    Card,
    Field,
    Check,
    Button,
    Errors,
    AppointmentSummary,
} from "@/Components/Office";
import { TIME_SLOTS } from "@/Support/guidanceConstants";

function tomorrow() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function SessionNotes({
    appointment,
    intake,
    session,
    caseRecord,
}) {
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [caseProcessing, setCaseProcessing] = useState(false);
    const [caseError, setCaseError] = useState("");
    const [caseSuccess, setCaseSuccess] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsError, setSlotsError] = useState("");
    const [slotsLoading, setSlotsLoading] = useState(false);
    const followUp = useForm({
        targetDate: "",
<<<<<<< HEAD
        scheduledTime: "",
        mode: appointment.channel === "online" ? "Virtual" : "F2F",
=======
        timeSlot: "AM",
        mode: ["virtual", "online", "telecounseling"].includes(
            appointment.channel,
        )
            ? "Virtual"
            : "F2F",
>>>>>>> 47baedd8aad5f4594ef4f42774f1752249fe60fb
    });
    const form = useForm({
        notes: session?.notes || "",
        is_flagged_for_followup: session?.is_flagged_for_followup || false,
        next_followup_date: session?.next_followup_date || "",
        next_followup_time:
            session?.next_followup_time ||
            appointment.scheduled_time ||
            "10:00",
        version: session?.version || 0,
    });
    useEffect(() => {
        if (!followUp.data.targetDate || !showFollowUp || !caseRecord) {
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
    }, [caseRecord?.id, followUp.data.targetDate, showFollowUp]);
    const editable =
        Boolean(session) ||
        ["accepted", "completed"].includes(appointment.status);
    const changeCase = async (action, payload = {}) => {
        setCaseProcessing(true);
        setCaseError("");
        setCaseSuccess("");
        followUp.clearErrors();
        try {
            await axios.post(route(`cases.${action}`, caseRecord.id), payload);
            setShowFollowUp(false);
            setCaseSuccess(
                action === "close"
                    ? "Case closed. Its history remains available."
                    : "Follow-up scheduled; the student can review it in their appointments.",
            );
            router.reload({ preserveScroll: true });
        } catch (error) {
            const response = error.response?.data;
            if (response?.errors) followUp.setError(response.errors);
            setCaseError(
                response?.message ||
                    "The case could not be updated. Please try again.",
            );
        } finally {
            setCaseProcessing(false);
        }
    };
    return (
        <Office
            title="A private space for care."
            eyebrow="Counseling record"
            description="Session notes are visible only to you as the assigned counselor."
        >
            <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
                <div className="space-y-6">
                    <Card>
                        <AppointmentSummary item={appointment} />
                    </Card>
                    <Card title="Student intake">
                        <dl className="space-y-5 text-sm">
                            <div>
                                <dt className="text-slate-500 text-xs">
                                    Living situation
                                </dt>
                                <dd className="mt-2 whitespace-pre-wrap">
                                    {intake?.living_condition}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 text-xs">
                                    Personal concerns
                                </dt>
                                <dd className="mt-2 whitespace-pre-wrap">
                                    {intake?.personal_concerns?.join("\n")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 text-xs">
                                    Contact
                                </dt>
                                <dd className="mt-2">
                                    {appointment.student.phone_number}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500 text-xs">
                                    Emergency contact
                                </dt>
                                <dd className="mt-2">
                                    {
                                        appointment.student.emergency_contact
                                            ?.name
                                    }
                                    <br />
                                    {
                                        appointment.student.emergency_contact
                                            ?.phone
                                    }
                                </dd>
                            </div>
                        </dl>
                    </Card>
                </div>
                <Card
                    title="Session notes"
                    description="Record your observations and next steps after the conversation."
                >
                    {!editable && (
                        <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                            Accept this appointment before saving notes.
                        </p>
                    )}
                    <form
                        className="space-y-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put(route("notes.store", appointment.id), {
                                preserveScroll: true,
                                onSuccess: (page) =>
                                    form.setData(
                                        "version",
                                        page.props.session.version,
                                    ),
                            });
                        }}
                    >
                        <Field
                            form={form}
                            name="notes"
                            label="Confidential notes"
                            type="textarea"
                            rows="12"
                            required
                            disabled={!editable}
                        />
                        <div className="rounded-xl bg-[#f5f5ef] p-5 space-y-4">
                            <Check
                                form={form}
                                name="is_flagged_for_followup"
                                label="Flag this student for follow-up"
                            />
                            {form.data.is_flagged_for_followup && (
                                <div className="space-y-3 pt-1">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            form={form}
                                            name="next_followup_date"
                                            label="Next follow-up date"
                                            type="date"
                                            required
                                        />
                                        <Field
                                            form={form}
                                            name="next_followup_time"
                                            label="Follow-up time slot"
                                            type="select"
                                            required
                                        >
                                            {TIME_SLOTS.map((slot) => (
                                                <option key={slot} value={slot}>
                                                    {slot}
                                                </option>
                                            ))}
                                        </Field>
                                    </div>
                                    <div className="rounded-lg bg-sky-50 border border-sky-200/80 p-3 text-xs text-sky-800 flex items-start gap-2">
                                        <span className="text-sm">ℹ️</span>
                                        <span className="leading-relaxed">
                                            Saving this follow-up schedule will
                                            automatically place an appointment
                                            on the student's dashboard awaiting
                                            their confirmation.
                                        </span>
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-slate-500">
                                Uncheck this flag when follow-up is resolved.
                            </p>
                        </div>
                        <Errors errors={form.errors} />
                        <Button disabled={!editable || form.processing}>
                            Save private notes
                        </Button>
                    </form>
                </Card>
                {caseRecord && (
                    <Card
                        title={`Case ${caseRecord.case_number}`}
                        description={`Status: ${caseRecord.status.replaceAll("_", " ")} · ${caseRecord.category.replaceAll("_", " ")}`}
                    >
                        {caseError && (
                            <p
                                role="alert"
                                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
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
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Session history
                            </h3>
                            <ol className="space-y-3 border-l-2 border-sky-100 pl-4">
                                {caseRecord.sessions.map((item) => (
                                    <li
                                        key={item.id}
                                        className="relative rounded-lg border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <span className="absolute -left-[22px] top-4 h-2 w-2 rounded-full bg-sky-500" />
                                        <Link
                                            href={route(
                                                "notes.show",
                                                item.appointment_id,
                                            )}
                                            className="text-sm font-semibold text-sky-800 hover:text-sky-950"
                                        >
                                            Session {item.session_number}
                                        </Link>
                                        <p className="mt-1 text-xs text-slate-600">
                                            {item.session_date} ·{" "}
                                            {item.time_slot} · {item.mode} ·{" "}
                                            {item.status.replaceAll("_", " ")}
                                            {item.is_follow_up
                                                ? " · Follow-up"
                                                : ""}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        {caseRecord.status !== "closed" && (
                            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                                <Button
                                    disabled={caseProcessing}
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Close this case and mark the current session completed?",
                                            )
                                        ) {
                                            changeCase("close");
                                        }
                                    }}
                                >
                                    Close Case
                                </Button>
                                <Button
                                    secondary
                                    disabled={caseProcessing}
                                    onClick={() => {
                                        setCaseError("");
                                        followUp.clearErrors();
                                        setShowFollowUp(true);
                                    }}
                                >
                                    Schedule Follow-Up
                                </Button>
                            </div>
                        )}
                    </Card>
                )}
            </div>
            {showFollowUp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget)
                            setShowFollowUp(false);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="follow-up-title"
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <h2
                            id="follow-up-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            Schedule a follow-up
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            The new session will remain in case{" "}
                            {caseRecord.case_number}.
                        </p>
                        <form
                            className="mt-5 space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                changeCase("follow-up", followUp.data);
                            }}
                        >
                            <Field
                                form={followUp}
                                name="targetDate"
                                label="Date"
                                type="date"
                                required
                                min={tomorrow()}
                            />
                            {followUp.data.targetDate && (
                                <Field
                                    form={followUp}
                                    name="scheduledTime"
                                    label="Available 30-minute time"
                                    type="select"
                                    required
                                    disabled={slotsLoading}
                                >
                                    <option value="">
                                        {slotsLoading
                                            ? "Loading available times..."
                                            : "Select an available time"}
                                    </option>
                                    {availableSlots.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </Field>
                            )}
                            {slotsError && (
                                <p
                                    role="alert"
                                    className="text-sm text-rose-700"
                                >
                                    {slotsError}
                                </p>
                            )}
                            {followUp.data.targetDate &&
                                !slotsLoading &&
                                !slotsError &&
                                availableSlots.length === 0 && (
                                    <p className="text-sm text-amber-800">
                                        No available times on this date. Choose
                                        a different date or update your
                                        schedule.
                                    </p>
                                )}
                            <Field
                                form={followUp}
                                name="mode"
                                label="Session mode"
                                type="select"
                                required
                            >
                                <option value="F2F">Face-to-face</option>
                                <option value="Virtual">Virtual</option>
                            </Field>
                            <Errors errors={followUp.errors} />
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    secondary
                                    type="button"
                                    disabled={caseProcessing}
                                    onClick={() => setShowFollowUp(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={
                                        caseProcessing ||
                                        slotsLoading ||
                                        !followUp.data.scheduledTime
                                    }
                                >
                                    {caseProcessing
                                        ? "Scheduling..."
                                        : "Schedule Follow-Up"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Office>
    );
}
