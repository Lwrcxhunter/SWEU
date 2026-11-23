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

export function Brand({ light = true }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <img
                src="/images/sweu-logo.png"
                alt="BukSU SWEU Logo"
                className="h-14 w-14 object-contain drop-shadow-sm shrink-0"
            />
            <div className="min-w-0">
                <div
                    className={`text-[15px] font-bold tracking-tight leading-[1.15] ${
                        light ? "text-white" : "text-slate-800"
                    }`}
                >
                    <span className="block">BukSU</span>
                    <span
                        className={
                            light
                                    ? "text-white font-semibold"
                                    : "text-[#d8e8f2] font-semibold"
                        }
                    >
                        Guidance
                    </span>
                </div>
                <div
                    className={`mt-1 text-[9px] font-medium leading-[1.2] ${
                        light ? "text-white" : "text-slate-500"
                    }`}
                >
                    Student Welfare and Engagement Unit
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
                label: "Appointment",
                icon: ClipboardList,
                active:
                    route().current("counselor.cases.index") &&
                    ["", "schedule", "history"].includes(
                        new URLSearchParams(url.split("?")[1] || "").get("tab") || "",
                    ),
            });
            navItems.push({
                name: "schedule",
                label: "My Schedule",
                icon: Calendar,
            });
            navItems.push({
                name: "counselor.cases.index",
                href: `${route("counselor.cases.index")}?tab=ongoing`,
                label: "Counseling Cases",
                icon: Users,
                active:
                    route().current("counselor.cases.index") &&
                    new URLSearchParams(url.split("?")[1] || "").get("tab") ===
                        "ongoing",
            });
            navItems.push({
                name: "analytics",
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
                className={`workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-[224px] flex-col bg-[#2F6693] text-white transition-transform duration-200 ease-in-out lg:z-40 lg:h-dvh lg:translate-x-0 font-['Poppins'] ${
                    menu
                        ? "translate-x-0 shadow-2xl"
                        : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Header / Brand */}
                <div className="flex min-h-[104px] shrink-0 items-center justify-between border-b border-white/10 px-4 py-4">
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
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 scrollbar-none">
                    <nav aria-label="Main navigation" className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                item.active ?? route().current(item.name);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href || route(item.name, item.params)}
                                    aria-label={item.ariaLabel || item.label}
                                    aria-current={isActive ? "page" : undefined}
                                    onClick={() => setMenu(false)}
                                    className={`workspace-nav-link flex items-center gap-2.5 rounded-lg px-3 py-3 text-[13px] font-medium transition ${
                                        isActive
                                            ? "bg-[#DCEAF3] text-[#2F6693] font-semibold shadow-md shadow-black/20 ring-1 ring-[#A9C3BA]"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${isActive ? "text-[#2F6693]" : "text-white/60"}`}
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
