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
    hero,
    backgroundImage,
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
            className="min-h-screen text-[#315C52] font-sans antialiased"
            style={
                backgroundImage
                    ? {
                          backgroundImage: `url('${backgroundImage}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          backgroundAttachment: "fixed",
                      }
                    : { backgroundColor: "#F7F5EF" }
            }
        >
            <Head title={title} />

            {/* Sidebar Navigation */}
            <Sidebar auth={auth} menu={menu} setMenu={setMenu} />

            {/* Main App Layout */}
            <div className="lg:pl-[224px] flex flex-col min-h-screen transition-all">
                {/* Global Header */}
                <Header
                    auth={auth}
                    unreadCount={unreadAlertCount}
                    onToggleMenu={() => setMenu(!menu)}
                />

                {/* Main Content Area */}
                <main className="workspace-main flex-1 mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-5 lg:px-7">
                    {hero ? (
                        hero
                    ) : (
                        (title || eyebrow || action) && (
                            <div className="mb-7 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                                <div className="max-w-3xl space-y-1">
                                    {eyebrow && (
                                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7398B4]">
                                            {eyebrow}
                                        </span>
                                    )}
                                    {title && (
                                        <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#315C52] md:text-[30px]">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="text-sm leading-relaxed text-[#7398B4]">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {action && (
                                    <div className="shrink-0">
                                        {action}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {/* Urgent Alert Banner */}
                    {unreadAlerts.some((a) => a.kind === "urgent") && (
                        <div
                            role="alert"
                            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-xs text-rose-900 shadow-sm sm:text-sm"
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
                            className="mb-6 flex items-center gap-2 rounded-xl border border-[#cbded8] bg-[#edf4ef] px-5 py-4 text-xs text-[#245b54] shadow-sm sm:text-sm"
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


                </main>
            </div>
        </div>
    );
}
