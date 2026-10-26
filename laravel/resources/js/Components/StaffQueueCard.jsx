import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { Button, Errors, Field } from "@/Components/Office";
import { formatSessionTime } from "@/Support/guidanceConstants";
import {
    CalendarDays,
    Check,
    ChevronDown,
    Clock,
    Download,
    UserCheck,
    MapPin,
    Video,
    Globe,
} from "lucide-react";

const labels = {
    pending: "Needs assignment",
    pending_assignment: "Needs assignment",
    assigned: "Awaiting counselor",
    assigned_pending_accept: "Awaiting counselor",
    assigned_pending_counselor: "Awaiting counselor",
    rescheduled: "Awaiting counselor",
    counselor_accepted_pending_student: "Awaiting student",
    reassignment_requested: "Reassignment requested",
    accepted: "Confirmed",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
};

const dateLabel = (date) =>
    date
        ? new Date(date + "T12:00:00").toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
              weekday: "short",
          })
        : "Date to be arranged";

export default function StaffQueueCard({ item, counselors = [] }) {
    const [expanded, setExpanded] = useState(false);
    const form = useForm({
        counselor_id: "",
        onboarding_note: "",
        scheduled_time: "",
    });
    const closed = ["completed", "cancelled"].includes(item.status);
    const canAssignRequest =
        !closed &&
        ![
            "accepted",
            "confirmed",
            "counselor_accepted_pending_student",
        ].includes(item.status);
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
    const available = options.filter((c) => c.availability?.available);
    const unavailable = options.filter((c) => !c.availability?.available);
    const selected = options.find((c) => c.id === form.data.counselor_id);
    const needsTime = !item.scheduled_time;
    const canAssign =
        selected?.availability?.available &&
        (!needsTime ||
            selected.availability.times.includes(form.data.scheduled_time));

    const perform = (action) => {
        form.transform((data) => ({ ...data, action, version: item.version }));
        form.patch(route("appointments.update", item.id), {
            preserveScroll: true,
            onSuccess: () => {
                setExpanded(false);
                form.reset();
            },
        });
    };

    const stateColor = ["accepted", "confirmed", "completed"].includes(
        item.status,
    )
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : closed
          ? "bg-slate-100 text-slate-600 border-slate-200"
          : "bg-amber-50 text-amber-900 border-amber-200";

    const action = canAssignRequest
        ? item.counselor_id
            ? "Reassign counselor"
            : "Assign counselor"
        : "View details";

    const studentInitial = (
        item.student?.full_name?.trim()?.charAt(0) || "S"
    ).toUpperCase();

    return (
        <article
            className={
                "staff-appointment overflow-hidden rounded-2xl border bg-white shadow-sm shadow-sky-950/5 transition-all duration-200 " +
                (expanded
                    ? "border-sky-400 ring-2 ring-sky-100 shadow-md"
                    : "border-sky-100 hover:border-sky-200 hover:shadow-md")
            }
            data-expanded={expanded}
        >
            <div className="grid items-center gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:p-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 font-bold text-sm shadow-xs">
                        {studentInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                                {item.student?.full_name ||
                                    "Unavailable student account"}
                            </h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">
                            <span className="font-semibold text-slate-700">
                                {item.student?.school_id_number}
                            </span>
                            {collegeCode ? " • " + collegeCode : ""}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                            {item.type === "walk_in"
                                ? "Walk-in"
                                : item.type === "follow_up"
                                  ? "Follow-up session"
                                  : "Student booking"}
                        </p>
                    </div>
                </div>

                <div className="text-sm text-slate-700 space-y-1">
                    <p className="flex items-center gap-2 font-medium">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-sky-600"
                        />
                        <span>{dateLabel(item.scheduled_date)}</span>
                    </p>
                    <p className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock size={15} className="shrink-0 text-sky-600" />
                        <span>
                            {formatSessionTime(item.scheduled_time) ||
                                item.preferred_period ||
                                "To be arranged"}
                        </span>
                    </p>
                    <p className="pl-6 text-xs text-slate-500">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                            {{
                                face_to_face: "Face-to-face",
                                online: "Online",
                                telecounseling: "Telecounseling",
                                virtual: "Virtual",
                            }[item.channel] ||
                                item.channel ||
                                "Not specified"}
                        </span>
                    </p>
                </div>

                <div className="space-y-1.5">
                    <span
                        className={
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border shadow-xs " +
                            stateColor
                        }
                    >
                        <span
                            className={
                                "h-1.5 w-1.5 rounded-full " +
                                ([
                                    "accepted",
                                    "confirmed",
                                    "completed",
                                ].includes(item.status)
                                    ? "bg-emerald-600"
                                    : closed
                                      ? "bg-slate-400"
                                      : "bg-amber-500 animate-pulse")
                            }
                        />
                        {labels[item.status] ||
                            item.status.replaceAll("_", " ")}
                    </span>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <UserCheck
                            size={14}
                            className="shrink-0 text-sky-600"
                        />
                        <span>{item.counselor_name || "Unassigned"}</span>
                    </p>
                </div>

                <Button
                    secondary={!canAssignRequest}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                    aria-controls={"request-" + item.id}
                    disabled={form.processing}
                    className="justify-self-start lg:justify-self-end rounded-xl px-4 py-2 font-semibold active:scale-[0.98] transition-all"
                >
                    <span>{expanded ? "Close" : action}</span>
                    <ChevronDown
                        size={15}
                        className={
                            "transition-transform duration-200 " +
                            (expanded ? "rotate-180" : "")
                        }
                    />
                </Button>
            </div>

            {expanded && (
                <div
                    id={"request-" + item.id}
                    className="border-t border-sky-100 bg-slate-50/70 p-5 lg:p-6 space-y-5"
                >
                    <Errors errors={form.errors} />
                    {item.reassignment_note &&
                        item.status === "reassignment_requested" && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-xs">
                                <strong className="font-bold text-amber-900 flex items-center gap-2">
                                    Counselor requested reassignment
                                </strong>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-amber-800">
                                    {item.reassignment_note}
                                </p>
                            </div>
                        )}

                    {!closed && (
                        <ol
                            aria-label="Appointment progress"
                            className="mb-5 grid gap-2.5 text-xs sm:grid-cols-3 font-semibold"
                        >
                            {[
                                [
                                    "Assignment sent",
                                    !!item.counselor_id &&
                                        item.status !==
                                            "reassignment_requested",
                                ],
                                [
                                    "Counselor accepted",
                                    !!item.counselor_accepted_at ||
                                        [
                                            "confirmed",
                                            "accepted",
                                            "counselor_accepted_pending_student",
                                        ].includes(item.status),
                                ],
                                [
                                    "Student confirmed",
                                    ["confirmed", "accepted"].includes(
                                        item.status,
                                    ),
                                ],
                            ].map(([label, done], index) => (
                                <li
                                    key={label}
                                    className={
                                        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-xs transition-all " +
                                        (done
                                            ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                                            : "border-slate-200 bg-white text-slate-500")
                                    }
                                >
                                    <span
                                        className={
                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                                            (done
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 text-slate-600")
                                        }
                                    >
                                        {done ? (
                                            <Check size={14} strokeWidth={3} />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span>{label}</span>
                                </li>
                            ))}
                        </ol>
                    )}

                    {canAssignRequest ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (canAssign) perform("assign");
                            }}
                            className="space-y-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h4 className="font-bold text-slate-900 text-base">
                                    Choose a counselor
                                </h4>
                                <Link
                                    href={route("queue.index", {
                                        tab: "calendar",
                                        calendar_date:
                                            item.scheduled_date || undefined,
                                        calendar_view: "day",
                                    })}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 underline"
                                >
                                    <CalendarDays size={14} />
                                    <span>View this day's schedules</span>
                                </Link>
                            </div>

                            <fieldset>
                                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {available.length} Available
                                </legend>
                                {available.length ? (
                                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                                        {available.map((counselor) => (
                                            <label
                                                key={counselor.id}
                                                className={
                                                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-150 " +
                                                    (selected?.id ===
                                                    counselor.id
                                                        ? "border-sky-500 bg-sky-50/80 ring-2 ring-sky-400 shadow-sm"
                                                        : "border-slate-200/90 bg-white hover:border-sky-300 hover:shadow-xs")
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name={
                                                        "counselor-" + item.id
                                                    }
                                                    value={counselor.id}
                                                    checked={
                                                        form.data
                                                            .counselor_id ===
                                                        counselor.id
                                                    }
                                                    onChange={() =>
                                                        form.setData({
                                                            ...form.data,
                                                            counselor_id:
                                                                counselor.id,
                                                            scheduled_time: "",
                                                        })
                                                    }
                                                    className="mt-1 text-sky-600 focus:ring-sky-400"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-bold text-slate-900">
                                                        {counselor.full_name}
                                                    </span>
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Available
                                                        {counselor.designated
                                                            ? " · College designate"
                                                            : ""}
                                                    </span>
                                                    <span className="mt-1.5 block text-xs text-slate-500">
                                                        {counselor.college_codes.join(
                                                            ", ",
                                                        ) || "General guidance"}
                                                        {needsTime
                                                            ? " • " +
                                                              counselor
                                                                  .availability
                                                                  .times
                                                                  .length +
                                                              " open time slots"
                                                            : ""}
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                                        No counselors available for this slot.
                                    </div>
                                )}
                            </fieldset>

                            {!!unavailable.length && (
                                <details className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all">
                                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 select-none">
                                        Unavailable counselors (
                                        {unavailable.length})
                                    </summary>
                                    <ul className="mt-3 divide-y divide-slate-100">
                                        {unavailable.map((c) => (
                                            <li
                                                key={c.id}
                                                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs"
                                            >
                                                <span className="font-semibold text-slate-700">
                                                    {c.full_name}
                                                </span>
                                                <span className="text-slate-500 flex items-center gap-1.5">
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                                                        {c.availability
                                                            ?.badge ||
                                                            "Availability unknown"}
                                                    </span>
                                                    {c.availability?.reason && (
                                                        <span className="text-slate-400 text-[11px]">
                                                            (
                                                            {
                                                                c.availability
                                                                    .reason
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}

                            {needsTime && (
                                <div className="max-w-sm">
                                    <Field
                                        label="Available time (PHT)"
                                        type="select"
                                        form={form}
                                        name="scheduled_time"
                                        required
                                        disabled={!selected}
                                    >
                                        <option value="">
                                            Choose an available time
                                        </option>
                                        {(
                                            selected?.availability?.times || []
                                        ).map((time) => (
                                            <option key={time} value={time}>
                                                {formatSessionTime(time)}
                                            </option>
                                        ))}
                                    </Field>
                                </div>
                            )}

                            <Field
                                label="Arrival instructions (optional)"
                                form={form}
                                name="onboarding_note"
                                maxLength={500}
                            />

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Button
                                    disabled={form.processing || !canAssign}
                                    className="rounded-xl px-5 py-2.5 font-bold shadow-md shadow-sky-600/20 active:scale-[0.98]"
                                >
                                    {form.processing
                                        ? "Sending assignment…"
                                        : "Send assignment to counselor"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="rounded-xl border border-sky-100 bg-white p-4 text-xs sm:text-sm text-slate-600 space-y-2">
                            <p className="font-medium text-slate-700">
                                {item.status ===
                                "counselor_accepted_pending_student"
                                    ? "Awaiting student confirmation."
                                    : closed
                                      ? "Appointment " +
                                        labels[item.status].toLowerCase() +
                                        "."
                                      : "Confirmed with " +
                                        (item.counselor_name ||
                                            "assigned counselor") +
                                        "."}
                            </p>
                            {item.onboarding_note && (
                                <p className="whitespace-pre-wrap rounded-lg bg-sky-50/60 p-2.5 text-xs text-sky-900 border border-sky-100">
                                    <strong className="font-bold">
                                        Instructions:{" "}
                                    </strong>
                                    {item.onboarding_note}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 pt-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <p className="text-xs font-medium text-slate-500">
                                Phone:{" "}
                                <span className="font-semibold text-slate-700">
                                    {item.student?.phone_number || "—"}
                                </span>
                            </p>
                            <a
                                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 shadow-xs hover:bg-sky-50 hover:border-sky-300 transition-all active:scale-[0.98]"
                                href={route("appointments.pdf", item.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Download size={14} className="text-sky-600" />
                                Intake PDF
                            </a>
                        </div>
                        {!closed && (
                            <div className="flex flex-wrap gap-2.5">
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98] transition-all"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Cancel this appointment? The student will be notified.",
                                            )
                                        )
                                            perform("cancel");
                                    }}
                                >
                                    Cancel appointment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}
