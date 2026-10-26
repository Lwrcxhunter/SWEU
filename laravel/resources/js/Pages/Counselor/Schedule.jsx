import { useState } from "react";
import { Link } from "@inertiajs/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, Heart } from "lucide-react";
import Office, { Empty } from "@/Components/Office";

function formatTime(value) {
    if (!value) return "Time to be confirmed";
    const [hour, minute] = value.split(":");
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

export default function Schedule({ appointments = [] }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("day");
    const [filters, setFilters] = useState({
        appointments: true,
        meetings: true,
        workshops: true,
        conferences: true,
        other: false,
    });
    const dateKey = selectedDate.toISOString().slice(0, 10);
    const dayAppointments = appointments.filter(
        (appointment) => appointment.scheduled_date === dateKey,
    );
    const calendarEvents = appointments
        .filter((appointment) => appointment.scheduled_date)
        .map((appointment) => ({
            id: appointment.id,
            title: `${appointment.student_name || "Student"} · ${appointment.type?.replaceAll("_", " ") || "Session"}`,
            start: `${appointment.scheduled_date}T${appointment.scheduled_time || "09:00"}`,
            backgroundColor: "#DDEBE5",
            borderColor: "#6F9D91",
            textColor: "#315C52",
            extendedProps: { appointment },
        }));
    const calendarDays = Array.from({ length: 35 }, (_, index) => {
        const date = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1,
        );
        date.setDate(index - date.getDay() + 1);
        return date;
    });
    const moveDate = (amount) =>
        setSelectedDate((current) => {
            const next = new Date(current);
            next.setDate(next.getDate() + amount);
            return next;
        });
    const openAppointment = (appointment) => {
        window.location.href = appointment.case_id
            ? route("counselor.cases.show", appointment.case_id)
            : route("notes.show", appointment.id);
    };

    return (
        <Office
            title="My schedule"
            eyebrow="Counselor schedule"
            description="View your daily, weekly, and monthly schedule of appointments and activities."
        >
            <div className="rounded-xl border border-[#E3E5DF] bg-white p-3 shadow-[0_8px_24px_rgba(49,92,82,0.06)] md:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E5DF] pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedDate(new Date())}
                            className="rounded-lg border border-[#E3E5DF] px-4 py-2 text-xs font-semibold text-[#315C52]"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => moveDate(-1)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E5DF] text-[#315C52]"
                        >
                            &lsaquo;
                        </button>
                        <button
                            type="button"
                            onClick={() => moveDate(1)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E5DF] text-[#315C52]"
                        >
                            &rsaquo;
                        </button>
                        <strong className="ml-3 text-sm text-[#315C52]">
                            {selectedDate.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </strong>
                    </div>
                    <div className="flex rounded-lg border border-[#E3E5DF] p-0.5">
                        {["day", "week", "month"].map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                className={`rounded-md px-4 py-2 text-xs font-semibold capitalize ${viewMode === mode ? "bg-[#315C52] text-white" : "text-[#6D7974]"}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 pt-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                    <aside className="rounded-lg border border-[#E3E5DF] bg-[#F7F5EF] p-3">
                        <div className="mb-3 flex items-center justify-between">
                            <strong className="text-xs text-[#315C52]">
                                {selectedDate.toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </strong>
                            <CalendarDays className="h-4 w-4 text-[#6F9D91]" />
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-[#6D7974]">
                            {["S", "M", "T", "W", "T", "F", "S"].map(
                                (day, index) => (
                                    <span key={`${day}-${index}`}>{day}</span>
                                ),
                            )}
                            {calendarDays.map((day) => {
                                const active =
                                    day.toDateString() ===
                                    selectedDate.toDateString();
                                return (
                                    <button
                                        key={day.toISOString()}
                                        type="button"
                                        onClick={() => setSelectedDate(day)}
                                        className={`rounded-md py-1 text-[10px] ${active ? "bg-[#315C52] font-bold text-white" : "text-[#6D7974] hover:bg-[#DDEBE5]"}`}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-5 border-t border-[#E3E5DF] pt-4">
                            <div className="mb-3 flex items-center justify-between">
                                <strong className="text-xs text-[#315C52]">
                                    Quick Filters
                                </strong>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFilters({
                                            appointments: false,
                                            meetings: false,
                                            workshops: false,
                                            conferences: false,
                                            other: false,
                                        })
                                    }
                                    className="text-[10px] text-[#6F9D91]"
                                >
                                    Clear All
                                </button>
                            </div>
                            {Object.keys(filters).map((filter) => (
                                <label
                                    key={filter}
                                    className="mb-2 flex items-center gap-2 text-[11px] capitalize text-[#6D7974]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters[filter]}
                                        onChange={(event) =>
                                            setFilters((current) => ({
                                                ...current,
                                                [filter]: event.target.checked,
                                            }))
                                        }
                                        className="h-3 w-3 rounded border-[#6F9D91] text-[#315C52] focus:ring-[#6F9D91]"
                                    />
                                    {filter}
                                </label>
                            ))}
                        </div>
                    </aside>

                    <div className="min-w-0">
                        {viewMode !== "day" ? (
                            <div className="counselor-calendar overflow-hidden rounded-lg border border-[#E3E5DF]">
                                <FullCalendar
                                    plugins={[
                                        dayGridPlugin,
                                        timeGridPlugin,
                                        interactionPlugin,
                                    ]}
                                    initialView={
                                        viewMode === "week"
                                            ? "timeGridWeek"
                                            : "dayGridMonth"
                                    }
                                    initialDate={dateKey}
                                    headerToolbar={false}
                                    events={calendarEvents}
                                    height="auto"
                                    eventClick={({ event }) =>
                                        openAppointment(
                                            event.extendedProps.appointment,
                                        )
                                    }
                                />
                            </div>
                        ) : dayAppointments.length === 0 ? (
                            <Empty>
                                No appointments are scheduled for this day.
                            </Empty>
                        ) : (
                            <div className="space-y-2">
                                {dayAppointments.map((appointment) => (
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
                                        className="block rounded-lg border-l-4 border-[#6FBAA2] bg-[#DDEBE5] p-3"
                                    >
                                        <p className="text-[11px] font-semibold text-[#6D7974]">
                                            {formatTime(
                                                appointment.scheduled_time,
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold capitalize text-[#315C52]">
                                            {appointment.type?.replaceAll(
                                                "_",
                                                " ",
                                            ) || "Counseling"}{" "}
                                            - {appointment.student_name}
                                        </p>
                                        <p className="mt-1 text-[11px] text-[#6D7974]">
                                            Counseling appointment
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F7F5EF] p-3">
                            <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#E8E4D9]">
                                <Heart className="h-7 w-7 text-[#315C52]" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#315C52]">
                                    Take care of yourself.
                                </p>
                                <p className="mt-1 text-[11px] text-[#6D7974]">
                                    Your well-being matters too.
                                </p>
                            </div>
                            <Heart className="ml-auto h-4 w-4 fill-[#315C52] text-[#315C52]" />
                        </div>
                    </div>
                </div>
            </div>
        </Office>
    );
}
