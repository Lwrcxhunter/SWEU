import { useState } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import Office, {
    Button,
    Card,
    Check,
    Empty,
    Errors,
} from "@/Components/Office";

const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
const orderedDays = [1, 2, 3, 4, 5, 6, 0];
const blankSchedule = { availability: [], classSchedule: [], leaves: [] };

function localDate() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const emptyDraft = (section) =>
    section === "leaves"
        ? {
              startDateTime: "",
              endDateTime: "",
              reason: "",
              type: "planned",
          }
        : {
              dayOfWeek: "1",
              startTime: "09:00",
              endTime: "12:00",
              ...(section === "classSchedule" ? { label: "" } : {}),
          };

function formatEntry(section, entry) {
    if (section === "leaves") {
        return `${entry.startDateTime.replace("T", " ")} – ${entry.endDateTime.replace("T", " ")} · ${entry.type} · ${entry.reason}`;
    }

    return `${dayNames[entry.dayOfWeek]} · ${entry.startTime}–${entry.endTime}${entry.label ? ` · ${entry.label}` : ""}`;
}

export default function Schedule({
    schedule = blankSchedule,
    appointments = [],
}) {
    const { auth } = usePage().props;
    const [data, setData] = useState({
        availability: schedule.availability || [],
        classSchedule: schedule.classSchedule || [],
        leaves: schedule.leaves || [],
    });
    const [section, setSection] = useState("availability");
    const [weekOffset, setWeekOffset] = useState(0);
    const [draft, setDraft] = useState(emptyDraft("availability"));
    const [editingIndex, setEditingIndex] = useState(null);
    const saveForm = useForm(blankSchedule);
    const statusForm = useForm({
        on_duty: auth.user.on_duty,
        available: auth.user.available,
    });

    const updateDraft = (name, value) =>
        setDraft((current) => ({ ...current, [name]: value }));

    const selectSection = (value) => {
        setSection(value);
        setEditingIndex(null);
        setDraft(emptyDraft(value));
    };

    const submitEntry = (event) => {
        event.preventDefault();
        const entries = [...data[section]];
        const entry = {
            ...draft,
            ...(section === "leaves"
                ? {}
                : { dayOfWeek: Number(draft.dayOfWeek) }),
        };
        if (editingIndex === null) entries.push(entry);
        else entries[editingIndex] = entry;
        setData((current) => ({ ...current, [section]: entries }));
        setEditingIndex(null);
        setDraft(emptyDraft(section));
    };

    const editEntry = (name, index) => {
        setSection(name);
        setEditingIndex(index);
        setDraft({
            ...data[name][index],
            dayOfWeek: String(data[name][index].dayOfWeek ?? 1),
        });
    };

    const deleteEntry = (name, index) =>
        setData((current) => ({
            ...current,
            [name]: current[name].filter(
                (_, entryIndex) => entryIndex !== index,
            ),
        }));

    const saveSchedule = (event) => {
        event.preventDefault();
        saveForm.transform(() => data);
        saveForm.put(route("counselor.schedule.update"), {
            preserveScroll: true,
        });
    };

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const previewDays = orderedDays.map((dayOfWeek, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return {
            dayOfWeek,
            label: dayNames[dayOfWeek],
            dateKey,
            availability: data.availability.filter(
                (entry) => Number(entry.dayOfWeek) === dayOfWeek,
            ),
            classes: data.classSchedule.filter(
                (entry) => Number(entry.dayOfWeek) === dayOfWeek,
            ),
            leaves: data.leaves.filter(
                (entry) =>
                    entry.startDateTime.slice(0, 10) <= dateKey &&
                    entry.endDateTime.slice(0, 10) >= dateKey,
            ),
            appointments: appointments.filter(
                (appointment) => appointment.scheduled_date === dateKey,
            ),
        };
    });
    const upcomingAppointments = appointments
        .filter((appointment) => appointment.scheduled_date >= localDate())
        .sort((left, right) =>
            `${left.scheduled_date} ${left.scheduled_time}`.localeCompare(
                `${right.scheduled_date} ${right.scheduled_time}`,
            ),
        );

    return (
        <Office
            title="Plan your week"
            eyebrow="Counselor schedule"
            description="Set counseling availability, teaching blocks, and leave. Overlapping commitments are rejected before saving."
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                    <Card title="Visual weekly preview">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-3 text-xs">
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
                                    Available for counseling
                                </span>
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-900">
                                    In class
                                </span>
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                                    Unavailable
                                </span>
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-900">
                                    Appointment
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setWeekOffset((current) => current - 1)
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Previous week
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeekOffset(0)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    This week
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setWeekOffset((current) => current + 1)
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Next week
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {previewDays.map((day) => (
                                <section
                                    key={day.dayOfWeek}
                                    className="rounded-xl border border-slate-200 p-3"
                                >
                                    <h3 className="font-semibold text-slate-900">
                                        {day.label}
                                    </h3>
                                    <p className="mb-2 text-[11px] text-slate-500">
                                        {day.dateKey}
                                    </p>
                                    <div className="space-y-1.5">
                                        {day.availability.map(
                                            (entry, index) => (
                                                <p
                                                    key={`a-${index}`}
                                                    className="rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-950"
                                                >
                                                    Available {entry.startTime}–
                                                    {entry.endTime}
                                                </p>
                                            ),
                                        )}
                                        {day.classes.map((entry, index) => (
                                            <p
                                                key={`c-${index}`}
                                                className="rounded-md bg-sky-100 px-2 py-1 text-xs text-sky-950"
                                            >
                                                Class {entry.startTime}–
                                                {entry.endTime}
                                                {entry.label
                                                    ? ` · ${entry.label}`
                                                    : ""}
                                            </p>
                                        ))}
                                        {day.leaves.map((entry, index) => (
                                            <p
                                                key={`l-${index}`}
                                                className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-950"
                                            >
                                                Unavailable{" "}
                                                {entry.startDateTime.slice(
                                                    11,
                                                    16,
                                                )}
                                                –
                                                {entry.endDateTime.slice(
                                                    11,
                                                    16,
                                                )}{" "}
                                                · {entry.type}
                                            </p>
                                        ))}
                                        {day.appointments.map((appointment) => (
                                            <Link
                                                key={appointment.id}
                                                href={
                                                    appointment.case_id
                                                        ? route(
                                                              "counselor.cases.show",
                                                              appointment.case_id,
                                                          )
                                                        : route(
                                                              "notes.show",
                                                              appointment.id,
                                                          )
                                                }
                                                className="block rounded-md bg-indigo-100 px-2 py-1 text-xs text-indigo-950 hover:bg-indigo-200"
                                            >
                                                Appointment{" "}
                                                {appointment.scheduled_time} ·{" "}
                                                {appointment.student_name} ·{" "}
                                                {appointment.status.replaceAll(
                                                    "_",
                                                    " ",
                                                )}
                                            </Link>
                                        ))}
                                        {!day.availability.length &&
                                            !day.classes.length &&
                                            !day.leaves.length &&
                                            !day.appointments.length && (
                                                <p className="text-xs text-slate-400">
                                                    No scheduled entries
                                                </p>
                                            )}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </Card>

                    <Card
                        title="Upcoming appointments"
                        description="Open an appointment or its case folder without leaving the schedule workspace."
                    >
                        {upcomingAppointments.length === 0 ? (
                            <Empty>
                                No upcoming appointments are scheduled.
                            </Empty>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {upcomingAppointments.map((appointment) => (
                                    <li
                                        key={appointment.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {appointment.scheduled_date} ·{" "}
                                                {appointment.scheduled_time}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {appointment.student_name} ·{" "}
                                                {appointment.type.replaceAll(
                                                    "_",
                                                    " ",
                                                )}{" "}
                                                ·{" "}
                                                {appointment.status.replaceAll(
                                                    "_",
                                                    " ",
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            href={
                                                appointment.case_id
                                                    ? route(
                                                          "counselor.cases.show",
                                                          appointment.case_id,
                                                      )
                                                    : route(
                                                          "notes.show",
                                                          appointment.id,
                                                      )
                                            }
                                            className="text-sm font-semibold text-sky-800 hover:underline"
                                        >
                                            {appointment.case_id
                                                ? "View case"
                                                : "Open appointment"}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    {[
                        ["availability", "Counseling Availability"],
                        ["classSchedule", "Class Teaching Schedule"],
                        ["leaves", "Leave Dates and Times"],
                    ].map(([name, title]) => (
                        <Card key={name} title={title}>
                            {data[name].length ? (
                                <ul className="mb-4 divide-y divide-slate-100">
                                    {data[name].map((entry, index) => (
                                        <li
                                            key={`${name}-${index}`}
                                            className="flex flex-wrap items-center justify-between gap-3 py-3"
                                        >
                                            <span className="text-sm text-slate-700">
                                                {formatEntry(name, entry)}
                                            </span>
                                            <span className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className="text-xs font-semibold text-sky-700 hover:underline"
                                                    onClick={() =>
                                                        editEntry(name, index)
                                                    }
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-xs font-semibold text-rose-700 hover:underline"
                                                    onClick={() =>
                                                        deleteEntry(name, index)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mb-4 text-xs text-slate-500">
                                    No entries added.
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => selectSection(name)}
                                className="text-xs font-semibold text-sky-700 hover:underline"
                            >
                                Add {title.toLowerCase()} entry
                            </button>
                        </Card>
                    ))}

                    <Card
                        title={
                            editingIndex === null
                                ? "Add schedule entry"
                                : "Edit schedule entry"
                        }
                    >
                        <form onSubmit={submitEntry} className="space-y-4">
                            <label className="block text-xs font-semibold text-slate-700">
                                Section
                                <select
                                    value={section}
                                    onChange={(event) =>
                                        selectSection(event.target.value)
                                    }
                                    className="control mt-2"
                                >
                                    <option value="availability">
                                        Counseling availability
                                    </option>
                                    <option value="classSchedule">
                                        Class teaching schedule
                                    </option>
                                    <option value="leaves">Leave</option>
                                </select>
                            </label>
                            {section === "leaves" ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Starts
                                        <input
                                            type="datetime-local"
                                            required
                                            value={draft.startDateTime}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "startDateTime",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Ends
                                        <input
                                            type="datetime-local"
                                            required
                                            value={draft.endDateTime}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "endDateTime",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Type
                                        <select
                                            value={draft.type}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "type",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        >
                                            <option value="planned">
                                                Planned
                                            </option>
                                            <option value="official">
                                                Official
                                            </option>
                                        </select>
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Reason
                                        <input
                                            required
                                            maxLength="500"
                                            value={draft.reason}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "reason",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Day
                                        <select
                                            value={draft.dayOfWeek}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "dayOfWeek",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        >
                                            {orderedDays.map((day) => (
                                                <option key={day} value={day}>
                                                    {dayNames[day]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Starts
                                        <input
                                            type="time"
                                            required
                                            value={draft.startTime}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "startTime",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-700">
                                        Ends
                                        <input
                                            type="time"
                                            required
                                            value={draft.endTime}
                                            onChange={(event) =>
                                                updateDraft(
                                                    "endTime",
                                                    event.target.value,
                                                )
                                            }
                                            className="control mt-2"
                                        />
                                    </label>
                                    {section === "classSchedule" && (
                                        <label className="text-xs font-semibold text-slate-700 md:col-span-3">
                                            Label (optional)
                                            <input
                                                maxLength="120"
                                                value={draft.label || ""}
                                                onChange={(event) =>
                                                    updateDraft(
                                                        "label",
                                                        event.target.value,
                                                    )
                                                }
                                                className="control mt-2"
                                            />
                                        </label>
                                    )}
                                </div>
                            )}
                            <Button>
                                {editingIndex === null
                                    ? "Add entry"
                                    : "Update entry"}
                            </Button>
                            {editingIndex !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setDraft(emptyDraft(section));
                                    }}
                                    className="ml-3 text-xs font-semibold text-slate-600"
                                >
                                    Cancel edit
                                </button>
                            )}
                        </form>
                    </Card>

                    <Card title="Assignment status">
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                statusForm.patch(route("availability.update"), {
                                    preserveScroll: true,
                                });
                            }}
                        >
                            <Check
                                form={statusForm}
                                name="on_duty"
                                label="I am on duty"
                            />
                            <Check
                                form={statusForm}
                                name="available"
                                label="I am available for new assignments"
                            />
                            <Errors errors={statusForm.errors} />
                            <Button disabled={statusForm.processing}>
                                Save assignment status
                            </Button>
                        </form>
                    </Card>
                </div>

                <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                    <Errors errors={saveForm.errors} />
                    <Card
                        title="Save changes"
                        description="Your planner updates are not applied to the database until saved."
                    >
                        <form onSubmit={saveSchedule}>
                            <Button disabled={saveForm.processing}>
                                Save weekly schedule
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </Office>
    );
}
