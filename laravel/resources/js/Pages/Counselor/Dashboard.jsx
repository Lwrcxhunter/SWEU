import { Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import {
    Bell,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Heart,
    Megaphone,
    UsersRound,
} from "lucide-react";
import Office, { Empty, Pagination } from "@/Components/Office";

const updates = [
    {
        title: "Wellness Workshop: Managing Academic Stress",
        meta: "Oct 24, 2025 · 9:00 AM - 12:00 PM · Guidance Office",
        detail: "Open for all enrolled students. Limited slots.",
        icon: UsersRound,
        tone: "bg-[#DDEBE5] text-[#315C52]",
    },
    {
        title: "Mental Health Awareness Month",
        meta: "Oct 20, 2025 · University-wide",
        detail: "Let's break the stigma. Take care of your mind.",
        icon: Heart,
        tone: "bg-[#DDEBE5] text-[#315C52]",
    },
    {
        title: "Career Guidance Webinar",
        meta: "Oct 16, 2025 · 2:00 PM - 4:00 PM · Online (MS Teams)",
        detail: "For graduating students and final year.",
        icon: BriefcaseBusiness,
        tone: "bg-[#DDEBE5] text-[#315C52]",
    },
];

function StatCard({ label, value, detail, icon: Icon, tone }) {
    return (
        <div className="flex min-h-[116px] items-start gap-3 rounded-xl border border-[#DCE5DF] bg-white p-4 shadow-[0_8px_24px_rgba(49,92,82,0.06)]">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#315C52]">{label}</p>
                <p className="mt-1 text-2xl font-bold leading-none text-[#315C52]">{value}</p>
                <p className="mt-2 text-[10px] text-[#6F9D91]">{detail}</p>
            </div>
        </div>
    );
}

function formatTime(value) {
    if (!value) return "Time to be scheduled";
    const [hour, minute] = value.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function Dashboard({ appointments, followups }) {
    const { auth } = usePage().props;
    const firstName = auth.user.full_name?.trim().split(/\s+/)[0] || "Counselor";
    const appointmentItems = appointments.data || [];
    const pendingCount = appointmentItems.filter((item) =>
        ["pending", "pending_assignment", "assigned_pending_counselor"].includes(item.status),
    ).length;
    const completedCount = appointmentItems.filter((item) =>
        ["completed", "closed"].includes(item.status),
    ).length;

    useEffect(() => {
        let refreshing = false;
        let cancelToken;
        const poll = () => {
            if (document.hidden || refreshing) return;
            refreshing = true;
            router.reload({
                only: ["appointments", "followups"],
                preserveScroll: true,
                preserveState: true,
                onCancelToken: (token) => {
                    cancelToken = token;
                },
                onFinish: () => {
                    refreshing = false;
                },
            });
        };

        const timer = setInterval(poll, 45000);

        // Poll immediately when tab becomes visible again
        const onVisibility = () => {
            if (!document.hidden) poll();
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            clearInterval(timer);
            cancelToken?.cancel();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    const schedule = appointmentItems.slice(0, 5);

    return (
        <Office
            title={`Good morning, ${firstName}!`}
            eyebrow=""
            description="Here's a quick look at your day and the latest updates from the Guidance and Counseling Office."
        >
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Recent Updates"
                    value={updates.length}
                    detail="new announcements"
                    icon={Megaphone}
                    tone="bg-[#F3E7DC] text-[#8D684E]"
                />
                <StatCard
                    label="Today's Appointments"
                    value={appointmentItems.length}
                    detail="scheduled"
                    icon={CalendarDays}
                    tone="bg-[#DDEBE5] text-[#315C52]"
                />
                <StatCard
                    label="Pending Requests"
                    value={pendingCount}
                    detail="needs attention"
                    icon={Clock3}
                    tone="bg-[#F3E7DC] text-[#8D684E]"
                />
                <StatCard
                    label="Completed Sessions"
                    value={completedCount}
                    detail="this week"
                    icon={CheckCircle2}
                    tone="bg-[#E7EFE6] text-[#315C52]"
                />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                <section className="overflow-hidden rounded-xl border border-[#DCE5DF] bg-white shadow-[0_8px_24px_rgba(49,92,82,0.06)]">
                    <div className="flex items-center justify-between border-b border-[#EDF0EC] px-4 py-4">
                        <h2 className="text-sm font-bold text-[#315C52]">Recent Updates</h2>
                        <button type="button" className="text-[10px] font-semibold text-[#6F9D91] hover:text-[#315C52]">
                            View all
                        </button>
                    </div>
                    <div className="divide-y divide-[#EDF0EC] px-4">
                        {updates.map((update) => {
                            const Icon = update.icon;
                            return (
                                <div key={update.title} className="flex items-start gap-3 py-4">
                                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${update.tone}`}>
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-[#315C52]">{update.title}</p>
                                        <p className="mt-1 text-[10px] text-[#6F9D91]">{update.meta}</p>
                                        <p className="mt-1 text-[10px] text-[#6F9D91]">{update.detail}</p>
                                    </div>
                                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#6F9D91]" />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="space-y-5">
                    <section className="overflow-hidden rounded-xl border border-[#DCE5DF] bg-white shadow-[0_8px_24px_rgba(49,92,82,0.06)]">
                        <div className="flex items-center justify-between border-b border-[#EDF0EC] px-4 py-4">
                            <h2 className="text-sm font-bold text-[#315C52]">Today's Schedule</h2>
                            <Link href={route("counselor.schedule")} className="text-[10px] font-semibold text-[#6F9D91] hover:text-[#315C52]">
                                View calendar
                            </Link>
                        </div>
                        {schedule.length ? (
                            <div className="divide-y divide-[#EDF0EC] px-4">
                                {schedule.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={route("notes.show", item.id)}
                                        className="flex items-center gap-3 py-3 transition hover:bg-[#F7F5EF]"
                                    >
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[#6F9D91] text-[#315C52]">
                                            <Clock3 className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold text-[#315C52]">
                                                {formatTime(item.scheduled_time)}
                                            </p>
                                            <p className="truncate text-[10px] text-[#6F9D91]">
                                                {item.type?.replaceAll("_", " ") || "Individual Counseling"}
                                                {item.student?.full_name ? ` · ${item.student.full_name}` : ""}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[#DDEBE5] px-2 py-1 text-[9px] font-semibold capitalize text-[#315C52]">
                                            {item.type === "meeting" ? "Meeting" : "Session"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                <Empty>No appointments are scheduled.</Empty>
                            </div>
                        )}
                        <div className="px-4 pb-3">
                            <Pagination data={appointments} />
                        </div>
                    </section>

                    <div className="rounded-xl border border-[#E8E2D6] bg-[#F1EEE5] px-5 py-5">
                        <div className="flex items-center">
                            <p className="wellness-quote text-[11px] leading-5 text-[#6F8177]">
                                "You don't have to have it all figured out.<br />
                                You just have to take the next right step."
                                <span className="mt-1 block text-right text-[10px]">- Unknown</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Office>
    );
}
