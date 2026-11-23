import { Link, router } from "@inertiajs/react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import Office, { Badge, Empty } from "@/Components/Office";

const formatType = (value) => (value || "Individual Counseling").replaceAll("_", " ");
const formatDate = (value) => {
    if (!value) return "Not assigned";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "Not assigned" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const formatTime = (value) => {
    if (!value) return "Time to be scheduled";
    const [hour, minute] = value.split(":").map(Number);
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
};

function CaseList({ cases, tab }) {
    const [activeTab, setActiveTab] = useState(["ongoing", "hold", "closed"].includes(tab) ? tab : "ongoing");
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const categories = [...new Set(cases.data.map((record) => record.category).filter(Boolean))];
    const records = useMemo(() => cases.data.filter((record) => {
        const statusMatch = activeTab === "closed" ? record.status === "closed" : activeTab === "hold" ? ["hold", "on_hold"].includes(record.status) : ["open", "follow_up"].includes(record.status);
        const search = query.trim().toLowerCase();
        const queryMatch = !search || [record.student_name, record.student_id_number, record.case_number, record.category].filter(Boolean).some((value) => value.toLowerCase().includes(search));
        return statusMatch && (filter === "all" || record.category === filter) && queryMatch;
    }), [activeTab, cases.data, filter, query]);
    return (
        <Office backgroundImage="/images/dashboardbg.png" title="Counseling Cases" eyebrow="Counselor workspace" description="Manage and track ongoing and closed counseling cases.">
            <section className="rounded-xl border border-[#E3E5DF] bg-white p-3 shadow-[0_8px_24px_rgba(49,92,82,0.06)] md:p-4">
                <div className="flex items-center gap-2 border-b border-[#E3E5DF] px-2">
                    {[["ongoing", "Ongoing"], ["hold", "On Hold"], ["closed", "Closed"]].map(([value, name]) => (
                        <button key={value} type="button" onClick={() => { setActiveTab(value); setQuery(""); setFilter("all"); }} className={`border-b-2 px-3 py-3 text-xs font-semibold ${activeTab === value ? "border-[#315C52] text-[#263B36]" : "border-transparent text-[#6D7974]"}`}>{name}</button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 px-2 py-4">
                    <label className="relative min-w-[220px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F9D91]" />
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, ID, or case number..." className="control pl-9 text-xs" />
                    </label>
                    <label className="relative">
                        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#315C52]" />
                        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="control min-w-[110px] pl-9 text-xs capitalize"><option value="all">Filter</option>{categories.map((category) => <option key={category} value={category}>{formatType(category)}</option>)}</select>
                    </label>
                </div>
                {records.length === 0 ? <Empty>No counseling cases match this view.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="border-y border-[#E3E5DF] bg-[#F7F5EF] text-[#6D7974]"><tr>{["Student Name", "Case Type", "Assigned Date", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#E3E5DF]">{records.map((record) => <tr key={record.id}><td className="px-3 py-4 font-medium text-[#263B36]">{record.student_name}</td><td className="px-3 py-4 capitalize text-[#6D7974]">{formatType(record.category)}</td><td className="px-3 py-4 text-[#6D7974]">{formatDate(record.opened_at)}</td><td className="px-3 py-4">                <Badge value={record.status === "open" || record.status === "follow_up" ? "ongoing" : record.status} /></td><td className="px-3 py-4"><Link href={route("counselor.cases.show", record.id)} className="rounded-lg border border-[#DCE5DF] px-3 py-2 font-semibold text-[#2F6693]">View</Link></td></tr>)}</tbody></table></div>}
                <div className="flex justify-between px-2 pt-4 text-[11px] text-[#6D7974]"><span>Showing {records.length} of {cases.total} cases</span>{cases.last_page > 1 && <div className="flex gap-1"><button type="button" disabled={!cases.prev_page_url} onClick={() => router.get(cases.prev_page_url)} className="grid h-7 w-7 place-items-center rounded border disabled:opacity-40">&lsaquo;</button><span className="grid h-7 w-7 place-items-center rounded bg-[#315C52] text-white">{cases.current_page}</span><button type="button" disabled={!cases.next_page_url} onClick={() => router.get(cases.next_page_url)} className="grid h-7 w-7 place-items-center rounded border disabled:opacity-40">&rsaquo;</button></div>}</div>
            </section>
            <section className="mt-4 flex items-center gap-3 rounded-xl bg-[#F0EDE4] p-4"><FileText className="h-6 w-6 text-[#315C52]" /><div><p className="text-xs font-semibold text-[#315C52]">Every case matters.</p><p className="text-[11px] text-[#6D7974]">Your support creates a difference.</p></div></section>
        </Office>
    );
}

function AppointmentStatus({ status }) {
    const confirmed = ["accepted", "confirmed", "completed"].includes(status);
    const pending = [
        "pending",
        "pending_assignment",
        "assigned_pending_counselor",
        "assigned_pending_accept",
        "counselor_accepted_pending_student",
        "rescheduled",
        "reassignment_requested",
    ].includes(status);
    const label = confirmed
        ? status === "completed" ? "Completed" : "Confirmed"
        : pending
          ? "Pending"
          : (status || "Pending").replaceAll("_", " ");

    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            confirmed
                ? "bg-[#E1F0E2] text-[#47785B]"
                : pending
                  ? "bg-[#F5EAD8] text-[#916F3F]"
                  : "bg-[#EEF2F4] text-[#586B76]"
        }`}>
            {confirmed ? <CheckCircle2 className="h-3.5 w-3.5" /> : pending ? <Clock3 className="h-3.5 w-3.5" /> : null}
            <span className="capitalize">{label}</span>
        </span>
    );
}

function AppointmentTable({ appointments, emptyMessage }) {
    return appointments.length === 0 ? (
        <div className="border-t border-[#E8ECEE] px-5 py-10 text-center text-xs text-[#71838D]">
            {emptyMessage}
        </div>
    ) : (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-y border-[#E2E8EB] bg-[#F4F7F8] text-[#536671]">
                    <tr>
                        {["Date & Time", "Student", "Appointment Type", "Status", "Actions"].map((heading) => (
                            <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECEE]">
                    {appointments.map((appointment) => (
                        <tr key={appointment.id} className="transition-colors hover:bg-[#F9FBFC]">
                            <td className="px-4 py-3.5">
                                <p className="font-semibold text-[#344C58]">{formatDate(appointment.scheduled_date)}</p>
                                <p className="mt-0.5 text-[10px] text-[#71838D]">{formatTime(appointment.scheduled_time)}</p>
                            </td>
                            <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#DDEBDD] text-[10px] font-bold text-[#47785B]">
                                        {(appointment.student_name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase()}
                                    </span>
                                    <span className="font-medium text-[#344C58]">{appointment.student_name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 font-medium capitalize text-[#536671]">{formatType(appointment.type)}</td>
                            <td className="px-4 py-3.5"><AppointmentStatus status={appointment.status} /></td>
                            <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                    <Link href={appointment.case_id ? route("counselor.cases.show", appointment.case_id) : route("notes.show", appointment.id)} className="rounded-md bg-[#2F6693] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#275887]">
                                        View
                                    </Link>
                                    <button type="button" className="rounded-md bg-[#315C52] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#274A44]">
                                        Accept
                                    </button>
                                    <button type="button" className="rounded-md bg-[#9B3F3F] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#822F2F]">
                                        Cancel
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AppointmentSchedule({ appointments = [], historyAppointments = [], tab = "schedule" }) {
    const [selectedDate, setSelectedDate] = useState(localDate);
    const upcoming = appointments
        .filter((appointment) => appointment.scheduled_date === selectedDate)
        .sort((a, b) =>
            `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(
                `${b.scheduled_date} ${b.scheduled_time}`,
            ),
        );
    return (
        <Office backgroundImage="/images/dashboardbg.png"
            title="Appointments"
            eyebrow="Counselor workspace"
            description="View and manage your student appointments."
        >
            <div className="font-['Poppins']">
                <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-white/70 bg-[#F0F4F2] p-1 shadow-sm">
                    <Link
                        href={`${route("counselor.cases.index")}?tab=schedule`}
                        aria-current={tab === "schedule" ? "page" : undefined}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${tab === "schedule" ? "bg-[#315C52] text-white shadow-sm" : "text-[#536B63] hover:bg-white/75"}`}
                    >
                        Appointment Schedule
                    </Link>
                    <Link
                        href={`${route("counselor.cases.index")}?tab=history`}
                        aria-current={tab === "history" ? "page" : undefined}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${tab === "history" ? "bg-[#315C52] text-white shadow-sm" : "text-[#536B63] hover:bg-white/75"}`}
                    >
                        Appointment History
                    </Link>
                </div>
                <section className="overflow-hidden rounded-2xl border border-[#DCE5E9] bg-white shadow-[0_16px_40px_rgba(45,76,92,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(45,76,92,0.18)]">
                    {tab === "history" ? (
                        <AppointmentTable appointments={historyAppointments} emptyMessage="No completed or cancelled appointments have been recorded yet." />
                    ) : (
                        <>
                        <div className="flex items-center px-4 py-3.5 sm:px-5">
                            <div className="inline-flex h-10 items-center overflow-hidden rounded-full border border-[#E1E8EB] bg-white">
                                <button type="button" aria-label="Previous day" onClick={() => setSelectedDate((current) => { const date = new Date(`${current}T12:00:00`); date.setDate(date.getDate() - 1); return localDate(date); })} className="grid h-10 w-10 place-items-center text-[#526A77] transition hover:bg-[#F1F6F8]">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <label className="relative flex h-full min-w-40 cursor-pointer items-center justify-center gap-2 px-2 text-xs font-semibold text-[#344C58]">
                                    <CalendarDays className="h-4 w-4 text-[#2F6693]" />
                                    <span>{formatDate(selectedDate)}</span>
                                    <input type="date" aria-label="Choose appointment date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                                </label>
                                <button type="button" aria-label="Next day" onClick={() => setSelectedDate((current) => { const date = new Date(`${current}T12:00:00`); date.setDate(date.getDate() + 1); return localDate(date); })} className="grid h-10 w-10 place-items-center text-[#526A77] transition hover:bg-[#F1F6F8]">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <AppointmentTable appointments={upcoming.slice(0, 6)} emptyMessage="No appointments are scheduled for this day." />
                        </>
                    )}
                </section>
            </div>
        </Office>
    );
}

export default function Cases(props) {
    return ["schedule", "history"].includes(props.tab) ? <AppointmentSchedule {...props} /> : <CaseList {...props} />;
}
