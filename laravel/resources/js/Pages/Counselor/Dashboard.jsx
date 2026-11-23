import { Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import {
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Heart,
    Megaphone,
    UsersRound,
} from "lucide-react";
import Office, { Empty } from "@/Components/Office";

const updates = [
    {
        title: "Wellness Workshop: Managing Academic Stress",
        meta: "Oct 24, 2025 · 9:00 AM - 12:00 PM · Guidance Office",
        detail: "Open for all enrolled students. Limited slots.",
        icon: UsersRound,
        tone: "bg-[#DCEAF3] text-[#2F6693]",
    },
    {
        title: "Mental Health Awareness Month",
        meta: "Oct 20, 2025 · University-wide",
        detail: "Let's break the stigma. Take care of your mind.",
        icon: Heart,
        tone: "bg-[#DCEAF3] text-[#2F6693]",
    },
    {
        title: "Career Guidance Webinar",
        meta: "Oct 16, 2025 · 2:00 PM - 4:00 PM · Online (MS Teams)",
        detail: "For graduating students and final year.",
        icon: BriefcaseBusiness,
        tone: "bg-[#DCEAF3] text-[#2F6693]",
    },
];

function Hero({ firstName }) {
    return (
        <section className="relative mb-5 min-h-[92px] px-6 py-4 sm:px-7">
            {/* Botanical accent */}
            <svg
                aria-hidden="true"
                viewBox="0 0 240 240"
                className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 text-[#315C52] opacity-[0.07]"
            >
                <g fill="currentColor">
                    <path d="M120 230c0-70 30-130 90-180-10 70-40 130-90 180Z" />
                    <path d="M110 230c0-60-30-110-90-150 20 70 50 120 90 150Z" />
                    <path d="M122 232c0-45 22-88 62-118-12 52-34 92-62 118Z" opacity=".65" />
                    <path d="M100 228c0-40-22-78-58-104 12 46 32 82 58 104Z" opacity=".65" />
                </g>
            </svg>

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                    <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#315C52] md:text-[30px]">
                        Good morning, {firstName}!
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7398B4]">
                        Here's a quick look at your day and the latest updates
                        from the Guidance and Counseling Office.
                    </p>
                </div>

                <div className="shrink-0 md:max-w-[220px] md:pl-6">
                    <p className="wellness-quote text-sm font-bold italic text-[#315C52]">
                        You are not alone.
                    </p>
                    <p className="wellness-quote text-sm italic text-[#6F8177]">
                        We're here to support you.
                    </p>
                    <span className="mt-2 block h-[4px] w-24 rounded-full bg-[#315C52]" />
                </div>
            </div>
        </section>
    );
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
    return (
        <Link
            href="#"
            className="group flex min-h-[112px] items-center gap-3 rounded-xl border border-[#E4E8E6] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(49,92,82,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8CCD7] hover:shadow-[0_16px_40px_rgba(49,92,82,0.18)] slide-up-slow"
        >
            <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone}`}
            >
                <Icon
                    className="h-[21px] w-[21px]"
                    aria-hidden="true"
                />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold leading-tight text-[#344C58]">
                    {label}
                </p>
                <p className="mt-1 text-[23px] font-bold leading-none text-[#344C58]">
                    {value}
                </p>
                <p className="mt-1 text-[9px] leading-tight text-[#71838D]">{detail}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#8A9DA7]" />
        </Link>
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
    const firstName =
        auth.user.full_name?.trim().split(/\s+/)[0] || "Counselor";
    const appointmentItems = appointments.data || [];
    const pendingCount = appointmentItems.filter((item) =>
        ["pending", "pending_assignment", "assigned_pending_counselor"].includes(
            item.status,
        ),
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
            title="Dashboard"
            hero={<Hero firstName={firstName} />}
            backgroundImage="/images/dashboardbg.png"
        >
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Recent Updates"
                    value={updates.length}
                    detail="new announcements"
                    icon={Megaphone}
                    tone="bg-[#D8EDF5] text-[#276284]"
                />
                <StatCard
                    label="Today's Appointments"
                    value={appointmentItems.length}
                    detail="scheduled"
                    icon={CalendarDays}
                    tone="bg-[#DDEBDD] text-[#47785B]"
                />
                <StatCard
                    label="Pending Requests"
                    value={pendingCount}
                    detail="needs attention"
                    icon={Clock3}
                    tone="bg-[#F0E2D0] text-[#846346]"
                />
                <StatCard
                    label="Completed Sessions"
                    value={completedCount}
                    detail="this week"
                    icon={CheckCircle2}
                    tone="bg-[#D8EDF5] text-[#276284]"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                <section className="overflow-hidden rounded-lg border border-[#E1E6E1] bg-white shadow-[0_14px_36px_rgba(49,92,82,0.14)] min-h-[360px] slide-up-slow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(49,92,82,0.18)]">
                    <div className="flex items-center justify-between border-b border-[#EDF0EC] px-4 py-3">
                        <h2 className="text-[13px] font-bold text-[#315C52]">
                            Recent Updates
                        </h2>
                        <Link
                            href="#"
                            className="flex items-center gap-1 text-[10px] font-semibold text-[#7398B4] hover:text-[#2F6693]"
                        >
                            View all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-[#EDF0EC] px-4">
                        {updates.map((update) => {
                            const Icon = update.icon;
                            return (
                                <Link
                                    key={update.title}
                                    href="#"
                                    className="flex items-start gap-3 py-3 transition hover:bg-[#F7F9F7]"
                                >
                                    <span
                                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${update.tone}`}
                                    >
                                        <Icon
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-[#315C52]">
                                            {update.title}
                                        </p>
                                        <p className="mt-1 text-[10px] text-[#7398B4]">
                                            {update.meta}
                                        </p>
                                        <p className="mt-1 text-[10px] text-[#7398B4]">
                                            {update.detail}
                                        </p>
                                    </div>
                                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#7398B4]" />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <div>
                    <section className="overflow-hidden rounded-lg border border-[#E1E6E1] bg-white shadow-[0_14px_36px_rgba(49,92,82,0.14)] min-h-[360px] slide-up-slow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(49,92,82,0.18)]">
                        <div className="flex items-center justify-between border-b border-[#EDF0EC] px-4 py-3">
                            <h2 className="text-[13px] font-bold text-[#315C52]">
                                Today's Schedule
                            </h2>
                            <Link
                                href={route("counselor.schedule")}
                                className="flex items-center gap-1 text-[10px] font-semibold text-[#7398B4] hover:text-[#2F6693]"
                            >
                                View calendar <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {schedule.length ? (
                            <div className="divide-y divide-[#EDF0EC] px-5">
                                {schedule.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={route("notes.show", item.id)}
                                        className="flex items-center gap-4 py-4 transition hover:bg-[#F7F9F7]"
                                    >
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#7398B4] text-[#2F6693]">
                                            <Clock3 className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-semibold text-[#315C52]">
                                                {formatTime(item.scheduled_time)}
                                            </p>
                                            <p className="truncate text-[12px] text-[#7398B4]">
                                                {item.type?.replaceAll("_", " ") ||
                                                    "Individual Counseling"}
                                                {item.student?.full_name
                                                    ? ` · ${item.student.full_name}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[#DCEAF3] px-2.5 py-1.5 text-[11px] font-semibold capitalize text-[#2F6693]">
                                            {item.type === "meeting"
                                                ? "Meeting"
                                                : "Session"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                <Empty>No appointments are scheduled.</Empty>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </Office>
    );
}
