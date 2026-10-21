import { Link, usePage } from "@inertiajs/react";
import Office, { Card } from "@/Components/Office";
import { CalendarPlus, Share2, ClipboardList, ArrowRight } from "lucide-react";

function Detail({ label, children }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="mt-1 break-words whitespace-pre-line text-sm leading-6 text-slate-800">
                {children || "Not provided"}
            </dd>
        </div>
    );
}

function yesNo(value) {
    return value == null ? "Not provided" : value ? "Yes" : "No";
}

export default function Dashboard({ student, summary }) {
    const { auth } = usePage().props;
    const can = (permission) => auth.permissions.includes(permission);
    const firstName = auth.user.full_name.trim().split(/\s+/)[0];
    const medical = student?.medical_history ?? {};
    const family = medical.family_medical_history ?? {};
    const testing = summary.testing.filter((item) => item.count > 0);
    const openTesting = testing
        .filter((item) => item.status !== "completed")
        .reduce((total, item) => total + item.count, 0);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

    const hasIntake = Boolean(student?.intake_record?.signed_agreement);

    const quickActions = [
        {
            title: "Make an Appointment",
            tag: "Counseling Service",
            tagStyle: "bg-sky-50 text-sky-700 border-sky-200/70",
            description:
                "Book a confidential one-on-one session with your college guidance counselor.",
            icon: CalendarPlus,
            iconContainer:
                "bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600",
            actionLabel: "Book Session",
            actionColor: "text-sky-600 group-hover:text-sky-700",
            link: can("appointments.book")
                ? hasIntake
                    ? route("appointments.request")
                    : route("appointments.index")
                : null,
        },
        {
            title: "Refer Someone",
            tag: "Peer & Self Support",
            tagStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
            description:
                "Help a fellow BukSU student or submit a self-referral to connect with guidance counselors in a private, supportive space.",
            icon: Share2,
            iconContainer:
                "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600",
            actionLabel: "Submit Referral",
            actionColor: "text-emerald-600 group-hover:text-emerald-700",
            link: can("referrals.submit") ? route("referrals.index") : null,
        },
        {
            title: "Request for Testing Form",
            tag: "Psychological Testing",
            tagStyle: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
            description:
                "Request a standardized psychological testing evaluation form reviewed by a SWEU psychometrician.",
            icon: ClipboardList,
            iconContainer:
                "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600",
            actionLabel: "Request Testing",
            actionColor: "text-indigo-600 group-hover:text-indigo-700",
            link: can("testing.request") ? route("testing.index") : null,
        },
    ];

    return (
        <Office title="" eyebrow="" description="">
            {/* HERO WELCOME BANNER (Powder Blue Gradient) */}
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                        <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-white">
                            Student Wellness Portal
                        </span>
                        <span className="text-xs text-sky-100 hidden sm:inline">
                            • {dayOfWeek}, {formattedDate}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold md:text-3xl text-white tracking-tight">
                        Welcome back, {firstName}.
                    </h1>
                    <p className="text-xs md:text-sm text-sky-100 leading-relaxed">
                        Keep track of your counseling support and ensure BukSU
                        Guidance has your latest information.
                    </p>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            Quick Actions
                        </h2>
                        <p className="text-xs text-slate-500">
                            Fast access to essential BukSU student guidance
                            services
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <section
                                key={action.title}
                                className="group relative flex flex-col justify-between rounded-2xl border border-sky-100/90 bg-white p-5 sm:p-6 shadow-sm shadow-sky-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                            >
                                <div>
                                    {/* Top Row: Icon & Tag */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${action.iconContainer}`}
                                        >
                                            <Icon className="h-6 w-6 stroke-[1.75]" />
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${action.tagStyle}`}
                                        >
                                            {action.tag}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="mt-4">
                                        <h3 className="text-base font-bold text-slate-800 transition-colors group-hover:text-sky-700">
                                            {action.title}
                                        </h3>
                                        <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-slate-500">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Action Link / Button */}
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                                    <span
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${action.actionColor}`}
                                    >
                                        <span>{action.actionLabel}</span>
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </span>
                                </div>

                                {/* Clickable Overlay Link */}
                                {action.link && (
                                    <Link
                                        href={action.link}
                                        className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                                        aria-label={action.title}
                                    />
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>

            {/* TESTING TRACKER BANNER */}
            {testing.length > 0 && (
                <div
                    className="mb-8 rounded-xl border border-sky-200/80 bg-sky-50/70 p-4 text-sky-900 shadow-sm"
                    aria-label="Testing request tracker"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <ClipboardList className="h-4 w-4 text-sky-600" />
                        <p className="text-xs font-bold uppercase tracking-wider text-sky-900">
                            Your Testing Tracker
                        </p>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-sky-900">
                        {testing.map((item) => (
                            <li
                                key={`${item.type}-${item.status}`}
                                className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-lg border border-sky-100"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                <span>
                                    {item.count}{" "}
                                    {item.status.charAt(0).toUpperCase() +
                                        item.status.slice(1)}{" "}
                                    {item.type} Request
                                    {item.count === 1 ? "" : "s"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* CRITICAL INFORMATION REVIEW */}
            <Card
                title="Critical Information Review"
                description="Review your current contact and health details. Keeping them accurate helps the office coordinate your care."
            >
                {!student ? (
                    <div className="mb-6 rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-6 text-xs sm:text-sm leading-relaxed text-slate-600">
                        Your personal information has not been submitted yet.
                        Complete your intake before booking an appointment or
                        requesting testing.
                    </div>
                ) : (
                    <div className="space-y-7">
                        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <Detail label="Full name">
                                {student.personal_details?.first_name
                                    ? [
                                          student.personal_details.first_name,
                                          student.personal_details.middle_name,
                                          student.personal_details.last_name,
                                      ]
                                          .filter(Boolean)
                                          .join(" ")
                                    : student.full_name}
                            </Detail>
                            <Detail label="Student ID">
                                {student.personal_details?.school_id_number ||
                                    student.school_id_number}
                            </Detail>
                            <Detail label="College">
                                {student.personal_details?.college ||
                                    student.college?.name ||
                                    student.college?.code}
                            </Detail>
                            <Detail label="Program / Course">
                                {student.personal_details?.program ||
                                    "Not specified"}
                            </Detail>
                            <Detail label="Year level">
                                {student.personal_details?.year_level
                                    ? `Year ${student.personal_details.year_level}`
                                    : student.year_level
                                      ? `Year ${student.year_level}`
                                      : "Not specified"}
                            </Detail>
                            <Detail label="Mobile number">
                                {student.personal_details?.phone_number ||
                                    student.phone_number}
                            </Detail>
                            <Detail label="Date of birth">
                                {student.personal_details?.dob || student.dob}
                            </Detail>
                            <Detail label="Marital status">
                                {student.personal_details?.marital_status ||
                                    student.marital_status}
                            </Detail>
                            <Detail label="Residential address">
                                {[
                                    student.address?.street_subdivision ||
                                        student.address?.street,
                                    student.address?.barangay,
                                    student.address?.city_municipality ||
                                        student.address?.city,
                                    student.address?.province ||
                                        student.address?.state_province,
                                    student.address?.zip_code ||
                                        student.address?.postal_zip,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </Detail>
                            <Detail label="Religious affiliation">
                                {student.religious_affiliation}
                            </Detail>
                            <Detail label="Facebook / Messenger">
                                {student.facebook_messenger_username}
                            </Detail>
                        </dl>

                        {/* Emergency Contact */}
                        <section className="border-t border-sky-100 pt-5">
                            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-sky-800">
                                Emergency Contact
                            </h3>
                            <dl className="grid gap-5 sm:grid-cols-3">
                                <Detail label="Name">
                                    {student.emergency_contact?.name}
                                </Detail>
                                <Detail label="Relationship">
                                    {
                                        student.emergency_contact
                                            ?.relationship_to_client
                                    }
                                </Detail>
                                <Detail label="Contact number">
                                    {student.emergency_contact?.phone}
                                </Detail>
                            </dl>
                        </section>

                        {/* Medical History */}
                        <section className="border-t border-sky-100 pt-5">
                            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-sky-800">
                                Medical History &amp; Disclosures
                            </h3>
                            <dl className="grid gap-5 sm:grid-cols-2">
                                <Detail label="Reported conditions">
                                    {medical.conditions?.length
                                        ? medical.conditions.join(", ")
                                        : "No conditions reported"}
                                </Detail>
                                <Detail label="Other conditions">
                                    {medical.other_conditions_specify}
                                </Detail>
                                <Detail label="Taking prescription medications">
                                    {yesNo(medical.on_prescription_meds)}
                                </Detail>
                                <Detail label="Current medications">
                                    {medical.current_meds_specify}
                                </Detail>
                                <Detail label="Surgery in the past 5 years">
                                    {yesNo(medical.recent_surgeries_past_5_yrs)}
                                </Detail>
                                <Detail label="Surgery details">
                                    {medical.surgeries_specify}
                                </Detail>
                                <div className="sm:col-span-2">
                                    <Detail label="Family medical history notes">
                                        {medical.family_medical_history_notes ||
                                            "None noted"}
                                    </Detail>
                                </div>
                            </dl>

                            {/* Substance Usage */}
                            <h4 className="mb-4 mt-6 text-xs font-bold uppercase tracking-wider text-sky-800">
                                Substance Usage Questionnaire
                            </h4>
                            <dl className="grid gap-5 sm:grid-cols-2">
                                <Detail label="Tobacco, cigarettes, or vape">
                                    {medical.substance_use?.tobacco_vape ||
                                        family.tobacco_cigarettes_vape_use ||
                                        "No"}
                                </Detail>
                                <Detail label="Alcohol use">
                                    {medical.substance_use?.alcohol ||
                                        family.alcohol_use ||
                                        "No"}
                                </Detail>
                                <Detail label="Caffeine consumption">
                                    {medical.substance_use?.caffeine ||
                                        family.caffeine_use ||
                                        "No"}
                                </Detail>
                                <Detail label="Recreational / non-prescription drugs">
                                    {medical.substance_use?.drugs ||
                                        family.drug_use ||
                                        "No"}
                                </Detail>
                            </dl>
                        </section>
                    </div>
                )}

                {can("intake.manage") && (
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-sky-100 pt-6">
                        <p className="max-w-md text-xs leading-5 text-slate-500">
                            Review your details, make any changes, and confirm
                            the SWEU ethical use consent and truthfulness
                            statements before saving.
                        </p>
                        <Link
                            href={route("personal-information.edit")}
                            className="rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition"
                        >
                            Update My Information
                        </Link>
                    </div>
                )}
            </Card>
        </Office>
    );
}
