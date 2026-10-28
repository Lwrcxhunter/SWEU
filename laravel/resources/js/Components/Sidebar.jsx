import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Calendar,
    IdCard,
    ClipboardList,
    Users,
    UserCheck,
    BarChart3,
    ShieldCheck,
    LogOut,
    X,
} from "lucide-react";

export function Brand({ light = false }) {
    return (
        <div className="flex items-center gap-3">
            <img
                src="/images/sweu-logo.png"
                alt="BukSU SWEU Logo"
                className="h-10 w-10 object-contain drop-shadow-sm shrink-0"
            />
            <div className="min-w-0">
                <div
                    className={`text-[15px] font-bold tracking-tight leading-tight ${
                        light ? "text-white" : "text-slate-800"
                    }`}
                >
                    BukSU{" "}
                    <span
                        className={
                            light
                                ? "text-[#a8d7c8] font-semibold"
                                : "text-[#2f7168] font-semibold"
                        }
                    >
                        Guidance
                    </span>
                </div>
                <div
                    className={`text-[8.5px] font-semibold uppercase tracking-wider leading-tight ${
                        light ? "text-[#c2d7cf]" : "text-slate-500"
                    }`}
                >
                    Student Welfare &amp; Engagement Unit
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ auth, menu, setMenu }) {
    const { url } = usePage();
    const calendarActive =
        new URLSearchParams(url.split("?")[1] || "").get("tab") === "calendar";
    const role = auth.user.role;
    const permissions = auth.permissions || [];
    const can = (perm) => permissions.includes(perm);

    const navItems = [];

    // Role-specific primary dashboard
    if (role === "student") {
        navItems.push({
            name: "student.dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        });
    } else if (role === "counselor" && can("appointments.manage")) {
        navItems.push({
            name: "counselor.dashboard",
            label: "Dashboard",
            icon: UserCheck,
        });
        if (can("notes.manage")) {
            navItems.push({
                name: "counselor.cases.index",
                label: "Appointments",
                icon: ClipboardList,
                active:
                    route().current("counselor.cases.index") &&
                    ["", "schedule", "history"].includes(
                        new URLSearchParams(url.split("?")[1] || "").get(
                            "tab",
                        ) || "",
                    ),
            });
            navItems.push({
                name: "counselor.schedule",
                label: "My Schedule",
                icon: Calendar,
            });
            navItems.push({
                name: "counselor.cases.index",
                href: `${route("counselor.cases.index")}?tab=ongoing`,
                label: "Cases",
                icon: Users,
                active:
                    route().current("counselor.cases.index") &&
                    new URLSearchParams(url.split("?")[1] || "").get("tab") ===
                        "ongoing",
            });
            navItems.push({
                name: "counselor.analytics",
                label: "Analytics",
                icon: BarChart3,
            });
        }
    } else if (role === "staff" && can("queue.manage")) {
        navItems.push({
            name: "queue.index",
            label: "Appointments",
            icon: LayoutDashboard,
            active: route().current("queue.index") && !calendarActive,
        });
        navItems.push({
            name: "queue.index",
            params: { tab: "calendar" },
            label: "Counselor schedules",
            icon: Calendar,
            active: route().current("queue.index") && calendarActive,
        });
    } else if (role === "admin" && can("users.manage")) {
        navItems.push({
            name: "admin.index",
            label: "People & Permissions",
            icon: ShieldCheck,
        });
    }

    // Student specific links
    if (role === "student") {
        if (can("appointments.book")) {
            navItems.push({
                name: "appointments.index",
                label: "Appointments",
                icon: Calendar,
            });
        }
        if (can("intake.manage")) {
            navItems.push({
                name: "personal-information.edit",
                label: "Personal Information",
                icon: IdCard,
            });
        }
    }

    // Faculty specific
    if (role === "faculty" && can("testing.request")) {
        navItems.push({
            name: "testing.index",
            label: "Testing requests",
            icon: ClipboardList,
        });
    }

    // Staff additional queues
    if (role === "staff") {
        if (can("testing.manage")) {
            navItems.push({
                name: "testing.index",
                label: "Testing requests",
                icon: ClipboardList,
            });
        }
        if (can("reports.view")) {
            navItems.push({
                name: "reports.index",
                label: "Reports & Analytics",
                ariaLabel: "Office reports",
                icon: BarChart3,
            });
        }
    }

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {menu && (
                <div
                    className="fixed inset-0 z-40 bg-[#102f2d]/55 backdrop-blur-xs lg:hidden transition-opacity"
                    onClick={() => setMenu(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Element */}
            <aside
                className={`workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#315C52] text-white transition-transform duration-200 ease-in-out lg:z-40 lg:h-dvh lg:translate-x-0 ${
                    menu
                        ? "translate-x-0 shadow-2xl"
                        : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Header / Brand */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
                    <Brand />
                    <button
                        type="button"
                        className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
                        onClick={() => setMenu(false)}
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Navigation */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 scrollbar-none">
                    <p
                        className={
                            role === "staff"
                                ? "px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/50"
                                : "px-3 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/50"
                        }
                    >
                        {role === "staff" ? "Staff workspace" : "Workspace"}
                    </p>
                    <nav aria-label="Main navigation" className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                item.active ?? route().current(item.name);
                            return (
                                <Link
                                    key={item.label}
                                    href={
                                        item.href ||
                                        route(item.name, item.params)
                                    }
                                    aria-label={item.ariaLabel || item.label}
                                    aria-current={isActive ? "page" : undefined}
                                    onClick={() => setMenu(false)}
                                    className={`workspace-nav-link flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition ${
                                        isActive
                                            ? "bg-[#DDEBE5] text-[#315C52] font-semibold shadow-sm shadow-black/10"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${isActive ? "text-[#315C52]" : "text-white/60"}`}
                                    />
                                    <span className="truncate">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer with Role Pill & Anchored Sign Out */}
                <div
                    className="shrink-0 border-t border-white/10 p-4"
                    data-testid="sidebar-signout"
                >
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <LogOut className="h-4 w-4 shrink-0 text-white/60" />
                        <span>Sign out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
