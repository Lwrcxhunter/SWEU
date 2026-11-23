import { Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import Office, { Badge, Empty, Pagination } from "@/Components/Office";

const appointmentUrl = (appointment) =>
    appointment.case_id
        ? route("counselor.cases.show", appointment.case_id)
        : route("notes.show", appointment.id);

export default function Appointments({
    appointments = [],
    availableSlots = [],
    calendarRange,
    history,
    tab,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const requestedRange = useRef(null);
    const isHistory = tab === "history";
    const events = [
        ...availableSlots.map((slot) => ({
            ...slot,
            title: "Available",
            color: "#DDEBE5",
            textColor: "#315C52",
        })),
        ...appointments.map((appointment) => ({
            id: appointment.id,
            title: `${appointment.student_name} · ${(appointment.type || "Appointment").replaceAll("_", " ")}`,
            start: appointment.scheduled_time
                ? `${appointment.scheduled_date}T${appointment.scheduled_time}`
                : appointment.scheduled_date,
            allDay: !appointment.scheduled_time,
            color: "#315C52",
            url: appointmentUrl(appointment),
        })),
    ];

    function loadRange(info) {
        const start = info.startStr.slice(0, 10);
        const end = info.endStr.slice(0, 10);
        const key = `${start}/${end}`;
        if (
            (start === calendarRange?.start && end === calendarRange?.end) ||
            requestedRange.current === key
        )
            return;
        requestedRange.current = key;
        router.get(
            route("counselor.cases.index"),
            { tab: "schedule", start, end },
            {
                only: [
                    "appointments",
                    "availableSlots",
                    "calendarRange",
                    "tab",
                ],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => {
                    setLoading(true);
                    setError("");
                },
                onError: () =>
                    setError(
                        "Could not load this schedule. Please refresh and try again.",
                    ),
                onFinish: () => {
                    requestedRange.current = null;
                    setLoading(false);
                },
            },
        );
    }

    return (
        <Office
            title="Appointments"
            eyebrow="Counselor workspace"
            description="View your appointments, available counseling hours, and appointment history."
        >
            <section className="rounded-xl border border-[#E3E5DF] bg-white p-3 shadow-sm md:p-5">
                <nav
                    aria-label="Appointment views"
                    className="mb-5 flex gap-2 border-b border-[#E3E5DF]"
                >
                    {[
                        ["schedule", "Appointments"],
                        ["history", "Appointment History"],
                    ].map(([value, label]) => (
                        <Link
                            key={value}
                            href={route("counselor.cases.index", {
                                tab: value,
                            })}
                            aria-current={tab === value ? "page" : undefined}
                            className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === value ? "border-[#315C52] text-[#315C52]" : "border-transparent text-[#6D7974]"}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                {isHistory ? (
                    <>
                        <p className="mb-4 text-sm text-[#6D7974]">
                            Past appointments and completed or cancelled
                            requests, newest first.
                        </p>
                        {!history?.data?.length ? (
                            <Empty>No appointment history yet.</Empty>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-left text-sm">
                                    <thead className="border-y border-[#E3E5DF] bg-[#F7F5EF]">
                                        <tr>
                                            {[
                                                "Date",
                                                "Time",
                                                "Student",
                                                "Service Type",
                                                "Status",
                                                "Actions",
                                            ].map((label) => (
                                                <th
                                                    key={label}
                                                    className="px-3 py-3 font-semibold"
                                                >
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E3E5DF]">
                                        {history.data.map((appointment) => (
                                            <tr key={appointment.id}>
                                                <td className="px-3 py-4">
                                                    {appointment.scheduled_date ||
                                                        "Not scheduled"}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {appointment.scheduled_time ||
                                                        "—"}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {appointment.student
                                                        ?.full_name ||
                                                        "Unavailable account"}
                                                </td>
                                                <td className="px-3 py-4 capitalize">
                                                    {(
                                                        appointment.type ||
                                                        "Appointment"
                                                    ).replaceAll("_", " ")}
                                                </td>
                                                <td className="px-3 py-4">
                                                    <Badge
                                                        value={
                                                            appointment.status
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-4">
                                                    <Link
                                                        href={appointmentUrl(
                                                            appointment,
                                                        )}
                                                        className="font-semibold underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {history && <Pagination data={history} />}
                    </>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap gap-4 text-xs text-[#315C52]">
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded bg-[#DDEBE5]" />
                                Available hours
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded bg-[#315C52]" />
                                Booked appointment
                            </span>
                            <span role="status">
                                {loading
                                    ? "Loading schedule…"
                                    : "Availability excludes booked times, classes, and leave."}
                            </span>
                        </div>
                        {error && (
                            <p
                                role="alert"
                                className="mb-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}
                        <div className="overflow-x-auto" aria-busy={loading}>
                            <div className="min-w-[600px]">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "timeGridDay,timeGridWeek,dayGridMonth",
                                    }}
                                    buttonText={{
                                        today: "Today",
                                        day: "Day",
                                        week: "Week",
                                        month: "Month",
                                    }}
                                    events={loading ? [] : events}
                                    datesSet={loadRange}
                                    height="auto"
                                    nowIndicator
                                    slotMinTime="08:00:00"
                                    slotMaxTime="17:00:00"
                                    slotDuration="00:30:00"
                                    defaultTimedEventDuration="00:30:00"
                                    eventClick={(info) => {
                                        if (info.event.url) {
                                            info.jsEvent.preventDefault();
                                            router.visit(info.event.url);
                                        }
                                    }}
                                    dayMaxEvents={3}
                                    editable={false}
                                />
                            </div>
                        </div>
                    </>
                )}
            </section>
        </Office>
    );
}
