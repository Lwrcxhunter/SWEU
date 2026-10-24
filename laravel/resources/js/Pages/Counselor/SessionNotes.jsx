import axios from "axios";
import { Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import Office, {
    Card,
    Field,
    Check,
    Button,
    Errors,
    AppointmentSummary,
} from "@/Components/Office";
import { TIME_SLOTS } from "@/Support/guidanceConstants";

export default function SessionNotes({
    appointment,
    intake,
    session,
    caseRecord,
}) {
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [caseProcessing, setCaseProcessing] = useState(false);
    const [caseError, setCaseError] = useState("");
    const followUp = useForm({
        targetDate: "",
        timeSlot: "AM",
        mode: appointment.channel === "online" ? "Virtual" : "F2F",
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
    const editable =
        Boolean(session) ||
        ["accepted", "completed"].includes(appointment.status);
    const changeCase = async (action, payload = {}) => {
        setCaseProcessing(true);
        setCaseError("");
        followUp.clearErrors();
        try {
            await axios.post(route(`cases.${action}`, caseRecord.id), payload);
            setShowFollowUp(false);
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
                            />
                            <Field
                                form={followUp}
                                name="timeSlot"
                                label="Time slot"
                                type="select"
                                required
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </Field>
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
                                <Button disabled={caseProcessing}>
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
