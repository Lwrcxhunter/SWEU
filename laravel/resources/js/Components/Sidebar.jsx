import { Link } from "@inertiajs/react";
import {
    LayoutDashboard,
    Calendar,
    IdCard,
    Share2,
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
                    className={`text-base font-bold tracking-tight leading-tight ${
                        light ? "text-white" : "text-slate-800"
                    }`}
                >
                    BukSU{" "}
                    <span
                        className={
                            light
                                ? "text-sky-300 font-semibold"
                                : "text-sky-600 font-semibold"
                        }
                    >
                        Guidance
                    </span>
                </div>
                <div
                    className={`text-[8.5px] font-semibold uppercase tracking-wider leading-tight ${
                        light ? "text-sky-100/80" : "text-slate-500"
                    }`}
                >
                    Student Welfare &amp; Engagement Unit
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ auth, menu, setMenu }) {
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
            label: "My Caseload",
            icon: UserCheck,
        });
        navItems.push({
            name: "counselor.schedule",
            label: "My Schedule",
            icon: Calendar,
        });
        if (can("notes.manage")) {
            navItems.push({
                name: "counselor.cases.index",
                label: "Counseling Cases",
                icon: ClipboardList,
            });
            navItems.push({
                name: "counselor.analytics",
                label: "Analytics",
                icon: BarChart3,
            });
        }
    } else if (role === "head_counselor" && can("notes.audit.read")) {
        navItems.push({
            name: "head.audit.index",
            label: "Clinical Audit",
            icon: ShieldCheck,
        });
    } else if (role === "staff" && can("queue.manage")) {
        navItems.push({
            name: "queue.index",
            label: "Front-Desk Dashboard",
            icon: LayoutDashboard,
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
    if (
        role === "faculty" &&
        can("referrals.submit") &&
        !navItems.some((i) => i.name === "referrals.index")
    ) {
        navItems.push({
            name: "referrals.index",
            label: "Referrals",
            icon: Share2,
        });
    }

    // Staff additional queues
    if (role === "staff") {
        if (can("testing.manage")) {
            navItems.push({
                name: "testing.index",
                label: "Testing Queue",
                icon: ClipboardList,
            });
        }
        if (can("reports.view")) {
            navItems.push({
                name: "reports.index",
                label: "Office Reports",
                icon: BarChart3,
            });
        }
    }

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {menu && (
                <div
                    className="fixed inset-0 z-40 bg-sky-950/40 backdrop-blur-xs lg:hidden transition-opacity"
                    onClick={() => setMenu(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Element */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white border-r border-sky-100 text-slate-800 transition-transform duration-200 ease-in-out lg:z-40 lg:h-dvh lg:translate-x-0 ${
                    menu
                        ? "translate-x-0 shadow-2xl"
                        : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Header / Brand */}
                <div className="flex shrink-0 items-center justify-between px-6 py-6 border-b border-sky-100/60">
                    <Brand />
                    <button
                        type="button"
                        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-sky-100/80 transition"
                        onClick={() => setMenu(false)}
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Navigation */}
                <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none px-4 py-5">
                    <p className="px-3 pb-3 text-[10px] font-bold tracking-[.2em] uppercase text-sky-800/60">
                        Workspace
                    </p>
                    <nav aria-label="Main navigation" className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = route().current(item.name);
                            return (
                                <Link
                                    key={item.name}
                                    href={route(item.name)}
                                    onClick={() => setMenu(false)}
                                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                                        isActive
                                            ? "bg-sky-600 text-white font-semibold shadow-sm shadow-sky-600/25"
                                            : "text-slate-600 hover:bg-sky-100/70 hover:text-sky-900"
                                    }`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}
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
                    className="shrink-0 border-t border-sky-100 bg-white/60 p-4"
                    data-testid="sidebar-signout"
                >
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                        <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
                        <span>Sign out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
