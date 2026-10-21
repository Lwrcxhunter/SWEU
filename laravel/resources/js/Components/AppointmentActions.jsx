import { Link, useForm } from "@inertiajs/react";
import { Button, Errors, Field } from "./Office";

export default function AppointmentActions({
    item,
    counselors,
    staff = false,
}) {
    const form = useForm({
        counselor_id: "",
        scheduled_date: "",
        scheduled_time: "",
    });
    const perform = (action) => {
        form.transform((data) => ({ ...data, action, version: item.version }));
        form.patch(route("appointments.update", item.id), {
            preserveScroll: true,
        });
    };
    const closed = ["completed", "cancelled"].includes(item.status);
    return (
        <div className="mt-5">
            <Errors errors={form.errors} />
            <div className="flex flex-wrap items-center gap-2">
                {!staff &&
                    (item.status === "assigned" ||
                        item.status === "assigned_pending_accept" ||
                        item.status === "rescheduled") && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("accept")}
                        >
                            Accept request
                        </Button>
                    )}
                {!staff && item.status === "accepted" && (
                    <Button
                        disabled={form.processing}
                        onClick={() => perform("complete")}
                    >
                        Complete session
                    </Button>
                )}
                <a
                    className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 inline-flex items-center gap-1.5 transition"
                    href={route("appointments.pdf", item.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Intake PDF
                </a>
                {!staff && (
                    <Link
                        className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 transition"
                        href={route("notes.show", item.id)}
                    >
                        View intake & notes
                    </Link>
                )}
                {staff &&
                    !closed &&
                    item.type === "walk_in" &&
                    item.urgency_level !== "urgent" && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("urgent")}
                        >
                            Flag urgent & alert counselors
                        </Button>
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
            {!closed &&
                (staff ? (
                    item.status !== "accepted" && (
                        <form
                            className="mt-5 flex flex-wrap items-end gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                perform("assign");
                            }}
                        >
                            <Field
                                label="Assign counselor"
                                type="select"
                                form={form}
                                name="counselor_id"
                                required
                            >
                                <option value="">
                                    Choose an available counselor
                                </option>
                                {counselors
                                    .filter(
                                        (c) =>
                                            c.available &&
                                            (item.urgency_level === "urgent"
                                                ? c.on_duty
                                                : true),
                                    )
                                    .map((c) => {
                                        const isCollegeDesignate =
                                            item.student?.college?.code &&
                                            c.college_codes?.includes(
                                                item.student.college.code,
                                            );
                                        const designationLabel =
                                            c.designation ||
                                            (c.college_codes?.length
                                                ? `${c.college_codes.join(", ")} Designate`
                                                : "Counselor");
                                        return (
                                            <option key={c.id} value={c.id}>
                                                {c.full_name} —{" "}
                                                {designationLabel}
                                                {isCollegeDesignate
                                                    ? " [Student's College Designate]"
                                                    : ""}
                                                {c.on_duty ? " · On duty" : ""}
                                            </option>
                                        );
                                    })}
                            </Field>
                            <Field
                                label="Onboarding note (optional)"
                                form={form}
                                name="onboarding_note"
                                placeholder="e.g. Room 202, arrive 5 mins early"
                            />
                            <Button secondary disabled={form.processing}>
                                Assign
                            </Button>
                        </form>
                    )
                ) : (
                    <details className="mt-5 text-sm">
                        <summary className="cursor-pointer font-medium text-sky-700 hover:text-sky-900 transition">
                            Reschedule appointment
                        </summary>
                        <form
                            className="mt-4 flex flex-wrap items-end gap-3"
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
                    </details>
                ))}
        </div>
    );
}
