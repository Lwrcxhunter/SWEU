import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link, usePage } from "@inertiajs/react";

export function ExitIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
        >
            <path
                d="M9 4H5v16h4m6-12 4 4-4 4M9 12h10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SignOut({ className = "" }) {
    return (
        <Link
            href={route("logout")}
            method="post"
            as="button"
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${className}`}
        >
            <ExitIcon />
            Sign out
        </Link>
    );
}

export default function HeaderActions({ auth, unreadCount }) {
    const { unreadAlerts = [] } = usePage().props;
    const user = auth.user;
    const initial = user.full_name.trim().charAt(0).toUpperCase();
    const profileUrl =
        user.role === "student" && auth.permissions.includes("intake.manage")
            ? route("personal-information.edit")
            : `${route("account")}#profile`;
    const links = [
        ["Edit Profile", profileUrl],
        ["Settings & Preferences", route("account")],
    ];
    return (
        <div className="flex shrink-0 items-center gap-3">
            <Menu as="div" className="relative">
                <MenuButton
                    aria-label={`Notifications, ${unreadCount} unread`}
                    className="relative grid h-10 w-10 place-items-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-900 transition"
                >
                    <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    >
                        <path
                            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {unreadCount > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-5 text-white"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </MenuButton>
                <MenuItems className="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-sky-100 bg-white p-2 shadow-xl shadow-sky-950/10 focus:outline-none">
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                    <div className="py-1">
                        {unreadAlerts && unreadAlerts.length > 0 ? (
                            unreadAlerts.slice(0, 5).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="border-b border-slate-50 px-3 py-2.5 last:border-b-0 hover:bg-sky-50 transition rounded-lg"
                                >
                                    <p className="text-xs font-medium text-slate-800 line-clamp-2">
                                        {alert.message}
                                    </p>
                                    <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-sky-700">
                                        {alert.kind}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-slate-500">
                                No new notifications
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                        <MenuItem>
                            {({ focus }) => (
                                <Link
                                    href={route("notifications.index")}
                                    className={`block w-full rounded-lg px-3 py-2 text-center text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline transition ${focus ? "bg-sky-50" : ""}`}
                                >
                                    See All Notifications
                                </Link>
                            )}
                        </MenuItem>
                    </div>
                </MenuItems>
            </Menu>
            <Menu as="div" className="relative">
                <MenuButton
                    aria-label="Open profile menu"
                    className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-sky-50 border border-transparent hover:border-sky-100 transition"
                >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-600 text-sm font-bold text-white shadow-sm">
                        {initial}
                    </span>
                    <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-slate-500"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path d="m5 8 5 5 5-5" />
                    </svg>
                </MenuButton>
                <MenuItems className="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-sky-100 bg-white p-2 shadow-xl shadow-sky-950/10 focus:outline-none">
                    <div className="mb-2 flex gap-3 border-b border-sky-100/80 bg-sky-50/40 p-3 rounded-xl">
                        <span
                            aria-hidden="true"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-600 font-bold text-white shadow-sm"
                        >
                            {initial}
                        </span>
                        <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-slate-800">
                                {user.full_name}
                            </p>
                            <p className="mt-0.5 text-xs capitalize text-sky-700 font-medium">
                                {user.role}
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-500">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    {links.map(([label, href]) => (
                        <MenuItem key={label}>
                            {({ focus }) => (
                                <Link
                                    className={`block rounded-lg px-4 py-3 text-sm transition ${focus ? "bg-sky-50 text-sky-900" : "text-slate-700"}`}
                                    href={href}
                                >
                                    {label}
                                </Link>
                            )}
                        </MenuItem>
                    ))}
                    <div className="mt-1 border-t border-slate-100 pt-1">
                        <MenuItem>
                            {({ focus }) => (
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-rose-600 transition ${focus ? "bg-rose-50" : ""}`}
                                >
                                    <ExitIcon />
                                    Sign Out
                                </Link>
                            )}
                        </MenuItem>
                    </div>
                </MenuItems>
            </Menu>
        </div>
    );
}
