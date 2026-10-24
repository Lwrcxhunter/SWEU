import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button, Errors, Field, StatusBadge } from "@/Components/Office";
import { parseDateBadge, formatSessionTime } from "@/Support/guidanceConstants";
import { Clock, Download, MapPin, Phone, UserCheck, Users } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffQueueCard({ item, counselors = [] }) {
    const [assigning, setAssigning] = useState(false);
    const form = useForm({
        counselor_id: "",
        onboarding_note: "",
        scheduled_time: "",
    });

    const perform = (action) => {
        form.transform((data) => ({ ...data, action, version: item.version }));
        form.patch(route("appointments.update", item.id), {
            preserveScroll: true,
            onSuccess: () => {
                setAssigning(false);
                form.reset();
            },
        });
    };

    const closed = ["completed", "cancelled"].includes(item.status);
    const isWalkIn = item.type === "walk_in";
    const dateInfo = parseDateBadge(item.scheduled_date);
    const formattedTime = formatSessionTime(item.scheduled_time);
    const collegeCode =
        typeof item.student?.college === "string"
            ? item.student.college
            : item.student?.college?.code;
    const options = counselors
        .map((counselor) => ({
            ...counselor,
            availability: item.assignment_options?.find(
                (option) => option.id === counselor.id,
            ),
            designated: counselor.college_codes?.includes(collegeCode),
        }))
        .sort(
            (a, b) =>
                Number(!!b.availability?.available) -
                    Number(!!a.availability?.available) ||
                Number(!!b.designated) - Number(!!a.designated) ||
                a.full_name.localeCompare(b.full_name),
        );
    const selected = options.find(
        (option) => option.id === form.data.counselor_id,
    );
    const needsTime = !item.scheduled_time && item.urgency_level !== "urgent";
    const canAssign =
        selected?.availability?.available &&
        (!needsTime ||
            selected.availability.times.includes(form.data.scheduled_time));
    const canReassign =
        !closed &&
        ![
            "accepted",
            "confirmed",
            "completed",
            "cancelled",
            "counselor_accepted_pending_student",
        ].includes(item.status);
    const awaiting =
        item.status === "accepted"
            ? "Accepted appointment"
            : item.counselor_accepted_at
              ? "Awaiting student confirmation"
              : "Awaiting counselor acceptance";

    return (
        <article className="rounded-2xl border border-sky-100 bg-white p-5">
            <Errors errors={form.errors} />
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-sky-200 text-center">
                        <div className="bg-sky-700 px-1 py-1 text-xs font-semibold text-white">
                            {isWalkIn
                                ? "Walk-in"
                                : dateInfo?.month || "Request"}
                        </div>
                        <div className="flex min-h-12 flex-col items-center justify-center py-1">
                            {isWalkIn ? (
                                <Users size={20} className="text-sky-800" />
                            ) : (
                                <>
                                    <span className="text-xl font-semibold text-slate-900">
                                        {dateInfo?.day || "—"}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {dateInfo?.weekday}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            {item.student?.full_name ||
                                "Unavailable student account"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {item.student?.school_id_number}
                            {collegeCode ? ` / ${collegeCode}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                                <Clock size={14} />
                                {formattedTime
                                    ? `${formattedTime} PHT`
                                    : `${item.preferred_period || "Time not set"} requested`}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <MapPin size={14} />
                                {item.channel === "face_to_face"
                                    ? "Face-to-face"
                                    : "Virtual"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Phone size={14} />
                                {item.student?.phone_number ||
                                    "No contact number"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {item.urgency_level === "urgent" && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800">
                            Urgent
                        </span>
                    )}
                    <StatusBadge status={item.status} />
                </div>
            </div>

            <div className="my-4 border-t border-slate-100 pt-3 text-sm">
                {item.status === "reassignment_requested" &&
                    item.reassignment_note && (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                            <strong className="block text-[10px] uppercase tracking-wider text-amber-800">
                                Counselor reassignment note
                            </strong>
                            <p className="mt-1 leading-relaxed">
                                {item.reassignment_note}
                            </p>
                        </div>
                    )}
                {item.counselor_name ? (
                    <div className="flex items-start gap-2 text-slate-700">
                        <UserCheck
                            size={18}
                            className="mt-0.5 shrink-0 text-sky-700"
                        />
                        <div>
                            <p>
                                <strong>{item.counselor_name}</strong> —{" "}
                                {awaiting}
                            </p>
                            {item.onboarding_note && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {item.onboarding_note}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-amber-800">
                        Needs assignment. Check availability and send this
                        request to a counselor.
                    </p>
                )}
            </div>

            {canReassign && (
                <div className="mb-4">
                    <Button
                        secondary
                        disabled={form.processing}
                        onClick={() => setAssigning(!assigning)}
                        aria-expanded={assigning}
                    >
                        {assigning
                            ? "Hide assignment"
                            : item.counselor_id
                              ? "Reassign counselor"
                              : "Assign counselor"}
                    </Button>
                    {assigning && (
                        <form
                            className="mt-3 space-y-4 rounded-xl border border-sky-200 bg-sky-50/40 p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (canAssign) perform("assign");
                            }}
                        >
                            <p className="text-sm text-slate-700">
                                {item.urgency_level === "urgent"
                                    ? "Immediate walk-in: on-duty counselors only."
                                    : `${item.scheduled_date} / ${item.preferred_period || "Requested time"}${formattedTime ? ` / ${formattedTime}` : ""}`}
                                <span className="mt-1 block text-xs text-slate-500">
                                    Availability is checked again when you
                                    assign. The counselor reviews the assignment
                                    next.
                                </span>
                            </p>
                            <Field
                                label="Counselor"
                                type="select"
                                form={form}
                                name="counselor_id"
                                required
                                onChange={(event) =>
                                    form.setData({
                                        ...form.data,
                                        counselor_id: event.target.value,
                                        scheduled_time: "",
                                    })
                                }
                            >
                                <option value="">
                                    Choose an available counselor
                                </option>
                                {options.map((counselor) => (
                                    <option
                                        key={counselor.id}
                                        value={counselor.id}
                                        disabled={
                                            !counselor.availability?.available
                                        }
                                    >
                                        {counselor.full_name} —{" "}
                                        {counselor.availability?.badge ||
                                            "Availability unknown"}
                                        {counselor.availability?.available
                                            ? counselor.designated
                                                ? " (College designate, recommended)"
                                                : " (Recommended)"
                                            : ""}
                                    </option>
                                ))}
                            </Field>
                            {selected?.schedule && (
                                <div className="rounded-lg border border-sky-100 bg-white p-3 text-[11px] text-slate-600">
                                    <strong className="mb-1 block text-slate-800">
                                        Counselor schedule (read-only)
                                    </strong>
                                    {selected.schedule.availability.length
                                        ? selected.schedule.availability
                                              .map(
                                                  (entry) =>
                                                      `${WEEKDAYS[entry.dayOfWeek]} ${entry.startTime}–${entry.endTime}`,
                                              )
                                              .join(" · ")
                                        : "No recurring counseling hours configured"}
                                    {selected.schedule.classSchedule.length >
                                        0 && (
                                        <span className="mt-1 block">
                                            Class blocks:{" "}
                                            {selected.schedule.classSchedule
                                                .map(
                                                    (entry) =>
                                                        `${WEEKDAYS[entry.dayOfWeek]} ${entry.startTime}–${entry.endTime}`,
                                                )
                                                .join(" · ")}
                                        </span>
                                    )}
                                    {selected.schedule.leaves.length > 0 && (
                                        <span className="mt-1 block text-amber-800">
                                            {selected.schedule.leaves
                                                .map(
                                                    (leave) =>
                                                        `${leave.type} leave ${leave.startDateTime}–${leave.endDateTime}`,
                                                )
                                                .join(" · ")}
                                        </span>
                                    )}
                                </div>
                            )}
                            {selected && (
                                <p
                                    role="status"
                                    className={`text-sm ${selected.availability?.available ? "text-emerald-800" : "text-rose-700"}`}
                                >
                                    {selected.availability?.reason}
                                </p>
                            )}
                            {!options.some(
                                (option) => option.availability?.available,
                            ) && (
                                <p
                                    role="status"
                                    className="text-sm text-amber-800"
                                >
                                    No counselors are available for this
                                    request. Review the availability calendar
                                    and coordinate another schedule with the
                                    student.
                                </p>
                            )}
                            {needsTime && (
                                <Field
                                    label="Available time (PHT)"
                                    type="select"
                                    form={form}
                                    name="scheduled_time"
                                    required
                                >
                                    <option value="">
                                        Choose a time in the requested period
                                    </option>
                                    {(selected?.availability?.times || []).map(
                                        (time) => (
                                            <option key={time} value={time}>
                                                {formatSessionTime(time)}
                                            </option>
                                        ),
                                    )}
                                </Field>
                            )}
                            <Field
                                label="Arrival instructions (optional)"
                                form={form}
                                name="onboarding_note"
                                maxLength={500}
                                hint="Use this for the meeting location or arrival time. Avoid confidential counseling details."
                            />
                            <Button
                                type="submit"
                                disabled={form.processing || !canAssign}
                            >
                                {form.processing
                                    ? "Assigning…"
                                    : "Send assignment to counselor"}
                            </Button>
                        </form>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-3">
                    {!closed && isWalkIn && item.urgency_level !== "urgent" && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("urgent")}
                        >
                            Flag urgent & alert counselors
                        </Button>
                    )}
                    <a
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                        href={route("appointments.pdf", item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download size={16} />
                        Intake PDF
                    </a>
                </div>
                {!closed && (
                    <Button
                        secondary
                        disabled={form.processing}
                        onClick={() => {
                            if (window.confirm("Cancel this appointment?"))
                                perform("cancel");
                        }}
                    >
                        Cancel appointment
                    </Button>
                )}
            </div>
        </article>
    );
}
