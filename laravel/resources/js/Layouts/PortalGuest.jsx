import React from "react";
import { UserRound, ClipboardList, HeartHandshake } from "lucide-react";

export default function PortalGuest({ children }) {
    const features = [
        { label: "Profile Management", icon: UserRound },
        { label: "Appointment Triage", icon: ClipboardList },
        { label: "Wellbeing & Counseling", icon: HeartHandshake },
    ];

    return (
        <main
            className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-sky-950 bg-cover bg-center px-4 py-8 sm:px-8 lg:px-14"
            style={{
                backgroundImage:
                    "linear-gradient(135deg, rgba(8, 47, 73, 0.94), rgba(3, 105, 161, 0.86), rgba(7, 89, 133, 0.78)), url('/images/sweu-building.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Subtle atmospheric vignette */}
            <div className="absolute inset-0 bg-sky-950/20 backdrop-blur-[0.5px]" />

            <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
                {/* Left Section: Hero / Branding with BukSU SWEU Colors */}
                <section className="mx-auto flex w-full max-w-xl flex-col justify-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center -space-x-2">
                            <img
                                src="/images/buksu-logo.png"
                                alt="Bukidnon State University"
                                className="relative z-10 h-14 w-14 rounded-full bg-white object-contain p-1 shadow-md border border-white/20"
                            />
                            <img
                                src="/images/sweu-logo.png"
                                alt="Student Welfare & Engagement Unit"
                                className="relative z-0 h-14 w-14 rounded-full bg-white object-contain p-1 shadow-md border border-white/20"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold tracking-wide sm:text-base text-white">
                                Student Welfare & Engagement Unit
                            </p>
                            <p className="mt-0.5 text-xs text-sky-200">
                                Skills Today. Solutions Tomorrow.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 max-w-lg sm:mt-12">
                        <div className="mb-4 h-1 w-12 rounded-full bg-sky-400" />
                        <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-white">
                            Student Wellbeing & Guidance Counseling System
                        </h2>
                        <p className="mt-3.5 max-w-md text-sm leading-6 text-sky-100/90 sm:text-base">
                            A unified platform for student guidance, confidential counseling appointments, psychological testing, and wellbeing support.
                        </p>
                    </div>

                    <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-sky-400/25 pt-6 sm:mt-12 sm:gap-4">
                        {features.map(({ label, icon: Icon }) => (
                            <div
                                key={label}
                                className="flex flex-col items-center gap-2.5 text-center text-xs text-white/95 sm:text-sm"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-sky-300 shadow-sm transition hover:bg-white/15">
                                    <Icon
                                        aria-hidden="true"
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                    />
                                </div>
                                <span className="font-medium text-xs sm:text-sm text-sky-50">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right Section: Floating Card with Original Sky Blue Palette */}
                <section className="mx-auto w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-2xl sm:px-9 sm:py-9 border border-sky-100 shadow-sky-950/20">
                    {children}

                    <p className="mt-6 text-center text-[11px] text-slate-400">
                        © 2026 Bukidnon State University. All rights reserved.
                    </p>
                </section>
            </div>
        </main>
    );
}
