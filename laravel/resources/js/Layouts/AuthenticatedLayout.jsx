import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Sidebar from "@/Components/Sidebar";
import Header from "@/Components/Header";

export default function AuthenticatedLayout({
    title,
    eyebrow = "Guidance & counseling",
    description,
    children,
    action,
}) {
    const {
        auth,
        flash,
        unreadAlerts = [],
        unreadAlertCount = 0,
    } = usePage().props;

    const [menu, setMenu] = useState(false);
    const refreshNotifications =
        auth.user.preferences?.notification_refresh ?? true;

    useEffect(() => {
        if (!refreshNotifications) return;
        const timer = setInterval(
            () =>
                router.reload({
                    only: [
                        "unreadAlerts",
                        "unreadAlertCount",
                        ...(route().current("alerts.index") ? ["alerts"] : []),
                    ],
                }),
            15000,
        );
        return () => clearInterval(timer);
    }, [refreshNotifications]);

    return (
        <div
            className="min-h-screen bg-sky-50/60 text-slate-800 font-sans antialiased"
        >
            <Head title={title} />

            {/* Sidebar Navigation */}
            <Sidebar auth={auth} menu={menu} setMenu={setMenu} />

            {/* Main App Layout */}
            <div className="lg:pl-64 flex flex-col min-h-screen transition-all">
                {/* Global Header */}
                <Header
                    auth={auth}
                    unreadCount={unreadAlertCount}
                    onToggleMenu={() => setMenu(!menu)}
                />

                {/* Main Content Area */}
                <main className="workspace-main flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    {/* Page Hero Header Banner (Powder Blue Gradient) */}
                    {(title || eyebrow || action) && (
                        <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2 max-w-2xl">
                                {eyebrow && (
                                    <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-white">
                                        {eyebrow}
                                    </span>
                                )}
                                {title && (
                                    <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-white">
                                        {title}
                                    </h1>
                                )}
                                {description && (
                                    <p className="text-sm leading-relaxed text-sky-100">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {action && (
                                <div className="shrink-0 pt-1 md:pt-0">
                                    {action}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Urgent Alert Banner */}
                    {unreadAlerts.some((a) => a.kind === "urgent") && (
                        <div
                            role="alert"
                            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-xs sm:text-sm text-rose-900 shadow-sm flex items-center justify-between gap-3"
                        >
                            <span>
                                An urgent walk-in needs front-desk coordination.
                            </span>
                            <Link
                                href={route("alerts.index")}
                                className="font-bold underline hover:text-rose-950 shrink-0"
                            >
                                Review alerts &rarr;
                            </Link>
                        </div>
                    )}

                    {/* Flash Message */}
                    {flash?.success && (
                        <div
                            role="status"
                            className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-xs sm:text-sm text-sky-900 shadow-sm flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5 text-sky-600 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* Page Body */}
                    {children}

                    {/* App Footer */}
                    <footer className="mt-16 border-t border-sky-100 pt-6 text-[11px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
                        <span>
                            Bukidnon State University &bull; Student Welfare and
                            Engagement Unit (SWEU)
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
