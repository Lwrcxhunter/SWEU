import { useState } from "react";
import { Button } from "@/Components/Office";
import { FileText, CheckCircle2, ChevronRight, Eye } from "lucide-react";

function BukSUDocumentHeader() {
    return (
        <div className="pb-3 mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="w-[72px] shrink-0">
                    <img
                        src="/images/buksu-logo.png"
                        alt="BukSU Logo"
                        className="w-16 h-16 object-contain"
                    />
                </div>
                <div className="flex-1 text-center font-serif pr-[72px]">
                    <h2 className="text-[15px] font-bold text-slate-900 tracking-wide uppercase leading-tight font-serif">
                        Bukidnon State University
                    </h2>
                    <p className="text-[11px] text-slate-700 mt-0.5 font-serif">
                        Malaybalay City, Bukidnon 8700
                    </p>
                    <p className="text-[10px] text-slate-600 font-serif">
                        Tel (088) 813-5661 to 5663; Telefax (088) 813-2717,{" "}
                        <a
                            href="https://www.buksu.edu.ph"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline"
                        >
                            www.buksu.edu.ph
                        </a>
                    </p>
                </div>
            </div>
            <div className="border-b-[1.2px] border-slate-400 my-2"></div>
            <div className="text-center font-serif pt-0.5">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Student Welfare and Engagement Unit
                </p>
                <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mt-0.5">
                    Guidance and Counseling Services
                </p>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1 uppercase tracking-wider">
                    Counseling Intake Form
                </h3>
            </div>
        </div>
    );
}

export default function WizardStep4Preview({
    profileForm,
    appointmentForm,
    clientFullName,
    onBack,
    onSubmit,
}) {
    const [pageView, setPageView] = useState("all"); // "all" | "page1" | "page2"

    const todayDate = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const conditionsList = profileForm.data.medical_history?.conditions || [];
    const otherConditions =
        profileForm.data.medical_history?.other_conditions_specify;
    const substance = profileForm.data.medical_history?.substance_use || {};

    const formattedFullName = profileForm.data.last_name
        ? `${profileForm.data.last_name}, ${profileForm.data.first_name} ${profileForm.data.middle_name || ""}`.trim()
        : clientFullName;

    return (
        <div className="space-y-6">
            {/* Step Header Notice */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div>
                    <span className="font-semibold block text-sm text-sky-900">
                        Step 4 of 4: Official 2-Page Document Preview
                    </span>
                    <p className="mt-0.5 text-slate-600">
                        Review your completed counseling intake record across
                        both official pages. Clicking &ldquo;Submit Appointment
                        Request&rdquo; will register your session and prepare
                        your downloadable 2-page PDF summary.
                    </p>
                </div>
                <div className="inline-flex rounded-xl bg-white p-1 border border-sky-200/80 shadow-xs self-start md:self-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => setPageView("all")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            pageView === "all"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                        }`}
                    >
                        Both Pages (Continuous)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPageView("page1")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            pageView === "page1"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                        }`}
                    >
                        Page 1
                    </button>
                    <button
                        type="button"
                        onClick={() => setPageView("page2")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            pageView === "page2"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                        }`}
                    >
                        Page 2
                    </button>
                </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="max-w-4xl mx-auto space-y-6">
                {/* ================= PAGE 1 ================= */}
                {(pageView === "all" || pageView === "page1") && (
                    <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md p-6 md:p-8 font-sans text-xs relative">
                        <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Page 1 of 2
                        </div>

                        {/* Official BukSU Header */}
                        <BukSUDocumentHeader />

                        {/* Section 01: Personal & Academic Details */}
                        <div className="mb-4">
                            <div className="bg-emerald-50 border-l-4 border-emerald-900 rounded-r px-2.5 py-1 text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                                01 / Personal &amp; Academic Details
                            </div>
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <tbody>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Full Name
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold"
                                        >
                                            {formattedFullName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Student ID Number
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold">
                                            {profileForm.data
                                                .school_id_number || "N/A"}
                                        </td>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            College / Unit
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold">
                                            {profileForm.data.college || "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Academic Program
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data.program ||
                                                "Not specified"}
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Year Level
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold">
                                            {profileForm.data.year_level ||
                                                "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Date of Birth
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900">
                                            {profileForm.data.dob || "N/A"}
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Marital Status
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data.marital_status ||
                                                "Single"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Phone / Contact
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data.phone_number ||
                                                "N/A"}
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Facebook Messenger
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data
                                                .facebook_messenger_username ||
                                                "N/A"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Section 02: Residential Address */}
                        <div className="mb-4">
                            <div className="bg-emerald-50 border-l-4 border-emerald-900 rounded-r px-2.5 py-1 text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                                02 / Residential Address
                            </div>
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <tbody>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Street / Subdivision / House No.
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium"
                                        >
                                            {profileForm.data.address
                                                ?.street_subdivision || "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Barangay
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900">
                                            {profileForm.data.address
                                                ?.barangay || "N/A"}
                                        </td>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            City / Municipality
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data.address
                                                ?.city_municipality || "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Province
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900">
                                            {profileForm.data.address
                                                ?.province || "N/A"}
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Postal / ZIP Code
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold">
                                            {profileForm.data.address
                                                ?.zip_code || "N/A"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Section 03: Emergency Contact */}
                        <div className="mb-4">
                            <div className="bg-emerald-50 border-l-4 border-emerald-900 rounded-r px-2.5 py-1 text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                                03 / Emergency Contact
                            </div>
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <tbody>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Contact Person
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold">
                                            {profileForm.data.emergency_name ||
                                                "N/A"}
                                        </td>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Relationship to Student
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {profileForm.data
                                                .emergency_relationship ||
                                                "N/A"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Emergency Phone
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold"
                                        >
                                            {profileForm.data.emergency_phone ||
                                                "N/A"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Section 04: Medical History & Substance Usage */}
                        <div className="mb-4">
                            <div className="bg-emerald-50 border-l-4 border-emerald-900 rounded-r px-2.5 py-1 text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                                04 / Medical History &amp; Substance Usage
                            </div>
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <tbody>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Existing Medical Conditions
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-800 leading-relaxed"
                                        >
                                            {conditionsList.length > 0 ? (
                                                <span>
                                                    {conditionsList.join(", ")}
                                                    {otherConditions && (
                                                        <span className="text-slate-600 font-medium">
                                                            {" "}
                                                            (Other:{" "}
                                                            {otherConditions})
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">
                                                    No chronic medical
                                                    conditions disclosed.
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Prescription Medication
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-800">
                                            {profileForm.data.medical_history
                                                ?.on_prescription_meds ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                        YES
                                                    </span>
                                                    <span className="text-slate-700">
                                                        {profileForm.data
                                                            .medical_history
                                                            ?.current_meds_specify
                                                            ? `(${profileForm.data.medical_history.current_meds_specify})`
                                                            : ""}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    NO
                                                </span>
                                            )}
                                        </td>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Surgeries in Past 5 Years
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-800">
                                            {profileForm.data.medical_history
                                                ?.recent_surgeries_past_5_yrs ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                        YES
                                                    </span>
                                                    <span className="text-slate-700">
                                                        {profileForm.data
                                                            .medical_history
                                                            ?.surgeries_specify
                                                            ? `(${profileForm.data.medical_history.surgeries_specify})`
                                                            : ""}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    NO
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Family Medical History Notes
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-800"
                                        >
                                            {profileForm.data.medical_history
                                                ?.family_medical_history_notes || (
                                                <span className="text-slate-500 italic">
                                                    None recorded.
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Substance Usage Questionnaire
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-800"
                                        >
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                <div>
                                                    • Tobacco / Cigarettes /
                                                    Vape:{" "}
                                                    <strong>
                                                        {substance.tobacco_vape ||
                                                            "No"}
                                                    </strong>
                                                </div>
                                                <div>
                                                    • Alcohol Consumption:{" "}
                                                    <strong>
                                                        {substance.alcohol ||
                                                            "No"}
                                                    </strong>
                                                </div>
                                                <div>
                                                    • Caffeine Usage:{" "}
                                                    <strong>
                                                        {substance.caffeine ||
                                                            "No"}
                                                    </strong>
                                                </div>
                                                <div>
                                                    • Recreational / Non-Rx
                                                    Drugs:{" "}
                                                    <strong>
                                                        {substance.drugs ||
                                                            "No"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Page 1 Footer */}
                        <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-serif">
                            <span>
                                Bukidnon State University • Student Welfare and
                                Engagement Unit (SWEU)
                            </span>
                            <span className="font-sans font-semibold text-slate-600">
                                Page 1 of 2
                            </span>
                            <span>Guidance and Counseling Services</span>
                        </div>
                    </div>
                )}

                {/* Page Separator Divider for Continuous View */}
                {pageView === "all" && (
                    <div className="my-6 flex items-center justify-center gap-3">
                        <div className="h-px bg-slate-300 flex-1"></div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-xs">
                            <span>📄</span>
                            <span>End of Page 1 • Page 2 of 2 Below</span>
                        </span>
                        <div className="h-px bg-slate-300 flex-1"></div>
                    </div>
                )}

                {/* ================= PAGE 2 ================= */}
                {(pageView === "all" || pageView === "page2") && (
                    <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-md p-6 md:p-8 font-sans text-xs relative flex flex-col min-h-[580px]">
                        <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Page 2 of 2
                        </div>

                        {/* Repeating BukSU Official Header */}
                        <BukSUDocumentHeader />

                        {/* Section 05: Initial Visit Questionnaire & Appointment Details */}
                        <div className="mb-4">
                            <div className="bg-emerald-50 border-l-4 border-emerald-900 rounded-r px-2.5 py-1 text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                                05 / Initial Visit Questionnaire &amp;
                                Appointment Details
                            </div>
                            <table className="w-full border-collapse border border-slate-200 text-[11px]">
                                <tbody>
                                    <tr>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Counseling Type / Venue
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold">
                                            {appointmentForm.data.channel ===
                                            "virtual"
                                                ? "VIRTUAL (ONLINE)"
                                                : "FACE-TO-FACE (SWEU GUIDANCE OFFICE)"}
                                        </td>
                                        <th className="w-1/4 border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Preferred Schedule
                                        </th>
                                        <td className="w-1/4 border border-slate-200 px-2.5 py-1.5 text-slate-900 font-semibold">
                                            {appointmentForm.data
                                                .scheduled_date ||
                                                "To be scheduled"}{" "}
                                            {appointmentForm.data.scheduled_time
                                                ? new Date(`2000-01-01T${appointmentForm.data.scheduled_time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                                                : "To be scheduled"}{" "}
                                            (Philippine time)
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Assigned Counselor
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-700 italic">
                                            Pending SWEU Staff Assignment
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Appointment Status
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-bold uppercase">
                                            SUBMITTED / PENDING ASSIGNMENT
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Reason for Initial Visit
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-900 leading-relaxed font-medium"
                                        >
                                            {appointmentForm.data.reason ||
                                                "Not specified"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Session Expectations
                                        </th>
                                        <td
                                            colSpan="3"
                                            className="border border-slate-200 px-2.5 py-1.5 text-slate-800 leading-relaxed"
                                        >
                                            {appointmentForm.data
                                                .expectations ||
                                                "Not specified"}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Average Sleep per Night
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium">
                                            {appointmentForm.data
                                                .average_sleep ||
                                                "Not specified"}
                                        </td>
                                        <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                            Prior Mental Health Consultation
                                        </th>
                                        <td className="border border-slate-200 px-2.5 py-1.5 text-slate-800">
                                            {appointmentForm.data
                                                .prior_consultation ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        YES
                                                    </span>
                                                    <span className="text-slate-700 text-[10px]">
                                                        {appointmentForm.data
                                                            .prior_consultation_details
                                                            ? `(${appointmentForm.data.prior_consultation_details})`
                                                            : ""}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    NO
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {appointmentForm.data
                                        .additional_comments && (
                                        <tr>
                                            <th className="border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-left font-semibold text-slate-600">
                                                Additional Notes / Concerns
                                            </th>
                                            <td
                                                colSpan="3"
                                                className="border border-slate-200 px-2.5 py-1.5 text-slate-800"
                                            >
                                                {
                                                    appointmentForm.data
                                                        .additional_comments
                                                }
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Anchored Bottom Block of Page 2 */}
                        <div className="mt-auto pt-4">
                            {/* Sworn Truthfulness Statement */}
                            <div className="border border-dashed border-emerald-800/60 bg-emerald-50/30 p-3 text-[11px] rounded-lg leading-relaxed text-slate-800 mb-6">
                                <strong className="block text-emerald-950 font-bold mb-0.5">
                                    Sworn Truthfulness Statement:
                                </strong>
                                &ldquo;This signature indicates that all
                                information provided in this intake form is
                                truthful, accurate, and complete to the best of
                                my knowledge. I authorize BukSU SWEU Guidance
                                and Counseling Services to handle this record
                                under strict ethical confidentiality
                                standards.&rdquo;
                            </div>

                            {/* Signature & Timestamp Block */}
                            <div className="pt-2 flex justify-between items-end mb-6">
                                <div className="w-1/2 text-center">
                                    <div className="min-h-[48px] flex items-center justify-center border-b-[1.5px] border-slate-900 pb-1">
                                        {appointmentForm.data.signature?.startsWith(
                                            "data:image",
                                        ) ? (
                                            <img
                                                src={
                                                    appointmentForm.data
                                                        .signature
                                                }
                                                alt="Client Signature"
                                                className="max-h-12 object-contain"
                                            />
                                        ) : (
                                            <span className="font-serif italic text-xl text-emerald-950">
                                                {appointmentForm.data
                                                    .signature ||
                                                    appointmentForm.data
                                                        .typed_signature ||
                                                    clientFullName}
                                            </span>
                                        )}
                                    </div>
                                    <span className="block font-bold text-[10px] uppercase mt-1.5 text-slate-900 tracking-wide">
                                        {clientFullName}
                                    </span>
                                    <span className="block text-[9px] text-slate-500">
                                        Client Signature over Printed Name
                                    </span>
                                </div>

                                <div className="w-1/3 text-center">
                                    <div className="min-h-[48px] flex items-end justify-center border-b-[1.5px] border-slate-900 pb-1 font-semibold text-slate-900 text-xs">
                                        {todayDate}
                                    </div>
                                    <span className="block font-bold text-[10px] uppercase mt-1.5 text-slate-900 tracking-wide">
                                        DATE &amp; SUBMISSION TIMESTAMP
                                    </span>
                                </div>
                            </div>

                            {/* Page 2 Document Footer */}
                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-serif">
                                <span>
                                    Bukidnon State University • Student Welfare
                                    and Engagement Unit (SWEU)
                                </span>
                                <span className="font-sans font-semibold text-slate-600">
                                    Page 2 of 2
                                </span>
                                <span>Guidance and Counseling Services</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {Object.values(appointmentForm.errors).map((error, index) => (
                <p key={index} role="alert" className="text-sm text-red-700">
                    {error}
                </p>
            ))}

            {/* Actions Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <Button secondary type="button" onClick={onBack}>
                    &larr; Back to Signature
                </Button>
                <Button
                    type="button"
                    loading={appointmentForm.processing}
                    disabled={appointmentForm.processing}
                    onClick={onSubmit}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 text-sm font-bold shadow-md flex items-center gap-2"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Appointment Request</span>
                </Button>
            </div>
        </div>
    );
}
