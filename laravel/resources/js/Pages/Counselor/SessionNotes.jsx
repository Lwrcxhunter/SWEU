import { useForm } from "@inertiajs/react";
import Office, {
    Card,
    Field,
    Check,
    Button,
    Errors,
    AppointmentSummary,
} from "@/Components/Office";
import { TIME_SLOTS } from "@/Support/guidanceConstants";

export default function SessionNotes({ appointment, intake, session }) {
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
            </div>
        </Office>
    );
}
