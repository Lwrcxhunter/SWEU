import { Link, router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, FileText, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import Office, { Badge, Empty } from "@/Components/Office";

const formatType = (value) => (value || "Individual Counseling").replaceAll("_", " ");
const formatDate = (value) => {
    if (!value) return "Not assigned";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not assigned" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
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
        <Office title="Counseling Cases" eyebrow="Counselor workspace" description="Manage and track ongoing and closed counseling cases.">
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
                {records.length === 0 ? <Empty>No counseling cases match this view.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead className="border-y border-[#E3E5DF] bg-[#F7F5EF] text-[#6D7974]"><tr>{["Student Name", "Case Type", "Assigned Date", "Status", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#E3E5DF]">{records.map((record) => <tr key={record.id}><td className="px-3 py-4 font-medium text-[#263B36]">{record.student_name}</td><td className="px-3 py-4 capitalize text-[#6D7974]">{formatType(record.category)}</td><td className="px-3 py-4 text-[#6D7974]">{formatDate(record.opened_at)}</td><td className="px-3 py-4"><Badge value={record.status === "open" || record.status === "follow_up" ? "ongoing" : record.status} /></td><td className="px-3 py-4"><Link href={route("counselor.cases.show", record.id)} className="rounded-lg border border-[#DCE5DF] px-3 py-2 font-semibold text-[#315C52]">View</Link></td></tr>)}</tbody></table></div>}
                <div className="flex justify-between px-2 pt-4 text-[11px] text-[#6D7974]"><span>Showing {records.length} of {cases.total} cases</span>{cases.last_page > 1 && <div className="flex gap-1"><button type="button" disabled={!cases.prev_page_url} onClick={() => router.get(cases.prev_page_url)} className="grid h-7 w-7 place-items-center rounded border disabled:opacity-40">&lsaquo;</button><span className="grid h-7 w-7 place-items-center rounded bg-[#315C52] text-white">{cases.current_page}</span><button type="button" disabled={!cases.next_page_url} onClick={() => router.get(cases.next_page_url)} className="grid h-7 w-7 place-items-center rounded border disabled:opacity-40">&rsaquo;</button></div>}</div>
            </section>
            <section className="mt-4 flex items-center gap-3 rounded-xl bg-[#F0EDE4] p-4"><FileText className="h-6 w-6 text-[#315C52]" /><div><p className="text-xs font-semibold text-[#315C52]">Every case matters.</p><p className="text-[11px] text-[#6D7974]">Your support creates a difference.</p></div></section>
        </Office>
    );
}

function AppointmentStatus({ status }) {
    return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${status === "pending" ? "bg-[#F9E8C7] text-[#9A6A20]" : "bg-[#DDEBE5] text-[#315C52]"}`}>{status?.replaceAll("_", " ") || "Pending"}</span>;
}

function Caseload({ appointments = [] }) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = appointments
        .filter((appointment) => appointment.scheduled_date >= today)
        .sort((a, b) =>
            `${a.scheduled_date} ${a.scheduled_time}`.localeCompare(
                `${b.scheduled_date} ${b.scheduled_time}`,
            ),
        );
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;

    return (
        <Office
            title="Caseload"
            eyebrow="Counselor workspace"
            description="View and manage your student appointments and caseload."
        >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="rounded-xl border border-[#E3E5DF] bg-white p-3 shadow-[0_8px_24px_rgba(49,92,82,0.06)] md:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3E5DF] px-2">
                        <div className="flex items-center gap-2">
                            <span className="border-b-2 border-[#315C52] px-3 py-3 text-xs font-semibold text-[#263B36]">
                                Appointment Schedule
                            </span>
                            <span className="px-3 py-3 text-xs text-[#6D7974]">
                                Appointment History
                            </span>
                        </div>
                        <Link
                            href={route("appointments.request")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#315C52] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#24483F]"
                        >
                            <span className="text-base leading-none">+</span>
                            Book Appointment
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 px-2 py-4">
                        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E5DF] text-[#315C52]">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="rounded-lg border border-[#E3E5DF] px-4 py-2 text-xs font-semibold text-[#315C52]">
                            {formatDate(today)} (Today)
                        </span>
                        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[#E3E5DF] text-[#315C52]">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    {upcoming.length === 0 ? (
                        <Empty>No upcoming appointments are scheduled.</Empty>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-xs">
                                <thead className="border-y border-[#E3E5DF] bg-[#F7F5EF] text-[#6D7974]">
                                    <tr>
                                        {["Time", "Student", "Service Type", "Status", "Actions"].map((heading) => (
                                            <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3E5DF]">
                                    {upcoming.slice(0, 6).map((appointment) => (
                                        <tr key={appointment.id}>
                                            <td className="px-3 py-4 text-[#6D7974]">{appointment.scheduled_time || "TBD"}</td>
                                            <td className="px-3 py-4 font-medium text-[#263B36]">{appointment.student_name}</td>
                                            <td className="px-3 py-4 capitalize text-[#6D7974]">{formatType(appointment.type)}</td>
                                            <td className="px-3 py-4"><AppointmentStatus status={appointment.status} /></td>
                                            <td className="px-3 py-4"><Link href={appointment.case_id ? route("counselor.cases.show", appointment.case_id) : route("notes.show", appointment.id)} className="rounded-lg border border-[#DCE5DF] px-3 py-2 font-semibold text-[#315C52]">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                <aside className="space-y-5">
                    <section className="rounded-xl border border-[#E3E5DF] bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-[#263B36]">Quick Stats</h2>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="relative grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(#315C52 ${appointments.length ? (confirmed / appointments.length) * 100 : 0}%, #E8C98A 0 100%)` }}>
                                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center">
                                    <strong className="text-xl text-[#315C52]">{appointments.length}</strong>
                                    <span className="text-[9px] text-[#6D7974]">Appointments</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-[11px] text-[#6D7974]">
                                <p>Confirmed {confirmed}</p><p>Pending {pending}</p><p>Cancelled {cancelled}</p>
                            </div>
                        </div>
                    </section>
                    <section className="rounded-xl border border-[#E3E5DF] bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-[#263B36]">Upcoming Notes</h2>
                        {upcoming.slice(0, 3).map((appointment) => (
                            <Link key={appointment.id} href={route("notes.show", appointment.id)} className="flex gap-3 border-b py-3 text-[11px] text-[#6D7974]">
                                <FileText className="h-4 w-4 text-[#8A6A5B]" />
                                <span><strong className="block text-[#263B36]">{appointment.student_name}</strong>{formatType(appointment.type)}<br />{formatDate(appointment.scheduled_date)}, {appointment.scheduled_time}</span>
                            </Link>
                        ))}
                    </section>
                </aside>
            </div>
        </Office>
    );
}

export default function Cases(props) {
    return props.tab === "schedule" ? <Caseload {...props} /> : <CaseList {...props} />;
}
