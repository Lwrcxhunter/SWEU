import {
    Menu as Dropdown,
    MenuButton,
    MenuItem,
    MenuItems,
} from "@headlessui/react";
import { Link, usePage } from "@inertiajs/react";
import {
    Bell,
    Menu as MenuIcon,
    LogOut,
    ChevronDown,
    User,
    Settings,
    CheckCircle2,
} from "lucide-react";

export default function Header({ auth, unreadCount = 0, onToggleMenu }) {
    const { unreadAlerts = [] } = usePage().props;
    const user = auth.user;
    const initial = user?.full_name?.trim()?.charAt(0)?.toUpperCase() || "U";

    const profileUrl =
        user.role === "student" && auth.permissions.includes("intake.manage")
            ? route("personal-information.edit")
            : `${route("account")}#profile`;

    const links = [
        { label: "Edit Profile", href: profileUrl, icon: User },
        {
            label: "Settings & Preferences",
            href: route("account"),
            icon: Settings,
        },
    ];

    return (
        <header className="workspace-header sticky top-0 z-30 flex h-[62px] shrink-0 items-center justify-between border-b border-[#E3E8EB] bg-white px-4 sm:px-6 lg:px-7 shadow-[0_8px_24px_rgba(49,92,82,0.12)]">
            {/* Mobile / Compact Sidebar Toggle */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleMenu}
                    className="rounded-lg p-2 text-[#2F6693] transition hover:bg-[#EEF5F9] lg:hidden"
                    aria-label="Menu"
                >
                    <MenuIcon className="h-5 w-5" />
                </button>
                <div className="hidden text-[12px] font-medium text-[#3F505B] sm:block">
                    Bukidnon State University &bull; SWEU Guidance System
                </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
                {/* Powder Blue Notification Bell */}
                <Dropdown as="div" className="relative">
                    <MenuButton
                        aria-label={`Notifications, ${unreadCount} unread`}
                        className="relative grid h-9 w-9 place-items-center rounded-full text-[#344C58] transition hover:bg-[#F1F6F8]"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span
                                aria-hidden="true"
                                className="absolute right-1 top-1 h-2.5 min-w-2.5 rounded-full bg-[#3E9B70] px-0.5 text-center text-[8px] font-bold leading-[10px] text-white ring-2 ring-white"
                            >
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </MenuButton>

                    <MenuItems className="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-sky-100 bg-white p-2 shadow-xl shadow-sky-950/10 focus:outline-none">
                        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>

                        <div className="py-1">
                            {unreadAlerts && unreadAlerts.length > 0 ? (
                                unreadAlerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="border-b border-slate-50 px-3 py-2.5 last:border-b-0 hover:bg-sky-50/50 transition rounded-lg"
                                    >
                                        <p className="text-xs font-medium text-slate-800 line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                                            {alert.kind}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-5 text-center text-xs text-slate-400">
                                    You're all caught up. No new notifications.
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                            <MenuItem>
                                {({ focus }) => (
                                    <Link
                                        href={route("notifications.index")}
                                        className={`block w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-sky-700 hover:text-sky-900 transition ${
                                            focus ? "bg-sky-50" : ""
                                        }`}
                                    >
                                        See All Notifications &rarr;
                                    </Link>
                                )}
                            </MenuItem>
                        </div>
                    </MenuItems>
                </Dropdown>

                {/* User Profile Menu */}
                <Dropdown as="div" className="relative">
                    <MenuButton
                        aria-label="Open profile menu"
                        className="flex items-center gap-2 rounded-full px-1.5 py-1 transition hover:bg-[#F5F8F9]"
                    >
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#44565B] font-medium text-[13px] text-white">
                            {initial}
                        </span>
                        <div className="hidden sm:block text-left">
                            <div className="text-[11px] font-semibold leading-tight text-[#263B43]">
                                {user.full_name}
                            </div>
                            <div className="text-[10px] capitalize leading-tight text-[#66849A]">
                                {user.role}
                            </div>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-[#71838D]" />
                    </MenuButton>

                    <MenuItems className="absolute right-0 z-50 mt-3 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-sky-100 bg-white p-2 shadow-xl shadow-sky-950/10 focus:outline-none">
                        {/* Profile Summary Card */}
                        <div className="mb-2 flex items-center gap-3 border-b border-sky-100/80 bg-sky-50/40 p-3 rounded-xl">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-600 font-bold text-white shadow-sm">
                                {initial}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900">
                                    {user.full_name}
                                </p>
                                <p className="mt-1 truncate text-[11px] text-slate-500">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="space-y-1">
                            {links.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <MenuItem key={link.label}>
                                        {({ focus }) => (
                                            <Link
                                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition ${
                                                    focus
                                                        ? "bg-sky-50 text-sky-900"
                                                        : ""
                                                }`}
                                                href={link.href}
                                            >
                                                <Icon className="h-4 w-4 text-sky-600 shrink-0" />
                                                <span>{link.label}</span>
                                            </Link>
                                        )}
                                    </MenuItem>
                                );
                            })}
                        </div>

                        {/* Sign Out Action */}
                        <div className="mt-1 border-t border-slate-100 pt-1">
                            <MenuItem>
                                {({ focus }) => (
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition ${
                                            focus ? "bg-rose-50" : ""
                                        }`}
                                    >
                                        <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                                        <span>Sign Out</span>
                                    </Link>
                                )}
                            </MenuItem>
                        </div>
                    </MenuItems>
                </Dropdown>
            </div>
        </header>
    );
}
