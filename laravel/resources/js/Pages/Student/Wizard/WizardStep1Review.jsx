import { useEffect, useState } from "react";
import { Card } from "@/Components/Office";
import {
    AddressFields,
    EmergencyFields,
} from "@/Components/StudentInformationFields";
import {
    MEDICAL_CONDITIONS,
    SUBSTANCE_OPTIONS,
    MARITAL_STATUS_OPTIONS,
    YEAR_LEVEL_OPTIONS,
} from "@/Support/guidanceConstants";

export default function WizardStep1Review({
    profileForm,
    colleges = [],
    programs = {},
    onUpdateProfile,
    onContinue,
    updateSuccess,
    updateFeedbackMessage,
}) {
    const [programOptions, setProgramOptions] = useState(() => {
        const col = profileForm.data.college;
        return programs?.[col] || [];
    });

    useEffect(() => {
        if (!profileForm.data.college) {
            setProgramOptions([]);
            return;
        }

        if (programs?.[profileForm.data.college]) {
            setProgramOptions(programs[profileForm.data.college]);
        } else {
            fetch(
                `/api/programs?college=${encodeURIComponent(profileForm.data.college)}`,
            )
                .then((res) => (res.ok ? res.json() : []))
                .then((data) =>
                    setProgramOptions(Array.isArray(data) ? data : []),
                )
                .catch(() => setProgramOptions([]));
        }
    }, [profileForm.data.college, programs]);

    const toggleCondition = (condition) => {
        const current = profileForm.data.medical_history.conditions || [];
        const next = current.includes(condition)
            ? current.filter((c) => c !== condition)
            : [...current, condition];
        profileForm.setData("medical_history", {
            ...profileForm.data.medical_history,
            conditions: next,
        });
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3">
                <span className="text-base">📋</span>
                <div className="leading-relaxed">
                    <strong className="font-semibold block text-sky-900 mb-0.5">
                        Step 1 of 4: Review Personal &amp; Medical Information
                    </strong>
                    Your intake record has been automatically pre-filled. Please
                    review and update any details that have changed before
                    requesting your appointment schedule.
                </div>
            </div>

            {/* Academic & Personal Details */}
            <Card
                title="Personal & Academic Information"
                description="Official student profile details."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={profileForm.data.first_name}
                            onChange={(e) =>
                                profileForm.setData(
                                    "first_name",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Middle Name
                        </label>
                        <input
                            type="text"
                            value={profileForm.data.middle_name}
                            onChange={(e) =>
                                profileForm.setData(
                                    "middle_name",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={profileForm.data.last_name}
                            onChange={(e) =>
                                profileForm.setData("last_name", e.target.value)
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Student ID Number
                        </label>
                        <input
                            type="text"
                            disabled
                            value={profileForm.data.school_id_number}
                            className="w-full rounded-lg border-slate-200 bg-slate-100 text-xs px-3 py-2 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            College / Unit *
                        </label>
                        <select
                            required
                            value={profileForm.data.college}
                            onChange={(e) => {
                                profileForm.setData({
                                    ...profileForm.data,
                                    college: e.target.value,
                                    program: "",
                                });
                            }}
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        >
                            <option value="">Select College</option>
                            {colleges.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Academic Program / Course *
                        </label>
                        <select
                            required
                            value={profileForm.data.program}
                            onChange={(e) =>
                                profileForm.setData("program", e.target.value)
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        >
                            <option value="">Select Course / Program</option>
                            {programOptions.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4 mt-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Year Level *
                        </label>
                        <select
                            required
                            value={profileForm.data.year_level}
                            onChange={(e) =>
                                profileForm.setData(
                                    "year_level",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        >
                            {YEAR_LEVEL_OPTIONS.map((yr) => (
                                <option key={yr} value={yr}>
                                    Year {yr}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            value={profileForm.data.dob}
                            onChange={(e) =>
                                profileForm.setData("dob", e.target.value)
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Marital Status
                        </label>
                        <select
                            value={profileForm.data.marital_status}
                            onChange={(e) =>
                                profileForm.setData(
                                    "marital_status",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        >
                            {MARITAL_STATUS_OPTIONS.map((ms) => (
                                <option key={ms} value={ms}>
                                    {ms}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Contact Phone *
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="0912 345 6789"
                            value={profileForm.data.phone_number}
                            onChange={(e) =>
                                profileForm.setData(
                                    "phone_number",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                </div>
            </Card>

            {/* Address via PSGC */}
            <AddressFields form={profileForm} />

            {/* Emergency Contact */}
            <EmergencyFields form={profileForm} />

            {/* Medical History & Substance Usage */}
            <Card
                title="Medical History & Disclosures"
                description="Confidential medical disclosures handled under strict guidance ethics."
            >
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Medical Conditions Checklist
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MEDICAL_CONDITIONS.map((cond) => {
                            const isChecked =
                                profileForm.data.medical_history.conditions.includes(
                                    cond,
                                );
                            return (
                                <button
                                    type="button"
                                    key={cond}
                                    onClick={() => toggleCondition(cond)}
                                    className={`text-left px-3 py-2 rounded-lg border text-xs transition flex items-center justify-between ${
                                        isChecked
                                            ? "bg-red-50 border-red-300 text-red-900 font-semibold shadow-sm"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    <span>{cond}</span>
                                    <span>{isChecked ? "✓" : "+"}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Prescription Medication Details
                        </label>
                        <input
                            type="text"
                            placeholder="Specify current prescription medications (or leave blank)"
                            value={
                                profileForm.data.medical_history
                                    .current_meds_specify
                            }
                            onChange={(e) =>
                                profileForm.setData("medical_history", {
                                    ...profileForm.data.medical_history,
                                    current_meds_specify: e.target.value,
                                    on_prescription_meds: Boolean(
                                        e.target.value.trim(),
                                    ),
                                })
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Past Surgeries (Past 5 Years)
                        </label>
                        <input
                            type="text"
                            placeholder="Specify past surgeries and year (or leave blank)"
                            value={
                                profileForm.data.medical_history
                                    .surgeries_specify
                            }
                            onChange={(e) =>
                                profileForm.setData("medical_history", {
                                    ...profileForm.data.medical_history,
                                    surgeries_specify: e.target.value,
                                    recent_surgeries_past_5_yrs: Boolean(
                                        e.target.value.trim(),
                                    ),
                                })
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        />
                    </div>
                </div>

                <div className="mt-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Family Medical History Notes
                    </label>
                    <textarea
                        rows={2}
                        value={
                            profileForm.data.medical_history
                                .family_medical_history_notes
                        }
                        onChange={(e) =>
                            profileForm.setData("medical_history", {
                                ...profileForm.data.medical_history,
                                family_medical_history_notes: e.target.value,
                            })
                        }
                        className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                        placeholder="Any family background of psychological or physical conditions..."
                    />
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Substance Usage Questionnaire
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            [
                                "tobacco_vape",
                                "Do you use tobacco, cigarettes, or vape?",
                            ],
                            ["alcohol", "Do you use alcohol?"],
                            ["caffeine", "Do you consume caffeine?"],
                            [
                                "drugs",
                                "Do you use recreational/non-prescription drugs?",
                            ],
                        ].map(([key, question]) => (
                            <div
                                key={key}
                                className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80"
                            >
                                <p className="text-xs font-medium text-slate-800 mb-2">
                                    {question}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SUBSTANCE_OPTIONS.map((opt) => {
                                        const isSelected =
                                            profileForm.data.medical_history
                                                .substance_use[key] === opt;
                                        return (
                                            <button
                                                type="button"
                                                key={opt}
                                                onClick={() => {
                                                    profileForm.setData(
                                                        "medical_history",
                                                        {
                                                            ...profileForm.data
                                                                .medical_history,
                                                            substance_use: {
                                                                ...profileForm
                                                                    .data
                                                                    .medical_history
                                                                    .substance_use,
                                                                [key]: opt,
                                                            },
                                                        },
                                                    );
                                                }}
                                                className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition ${
                                                    isSelected
                                                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Bottom Actions: Stacked Update (above) and Continue (below) */}
            <div className="pt-6 border-t border-slate-200 flex flex-col items-end gap-3">
                {updateFeedbackMessage && (
                    <div
                        className={`w-full sm:max-w-md rounded-xl p-3.5 text-xs flex items-start gap-2.5 transition-all shadow-sm ${
                            updateSuccess
                                ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
                                : "bg-red-50 border border-red-300 text-red-900"
                        }`}
                    >
                        {updateSuccess ? (
                            <svg
                                className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                        <div>
                            <p className="font-bold text-sm">
                                {updateSuccess
                                    ? "Information Updated!"
                                    : "Update Incomplete"}
                            </p>
                            <p className="mt-0.5 leading-relaxed">
                                {updateFeedbackMessage}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2.5 w-full sm:w-72">
                    <button
                        type="button"
                        onClick={onUpdateProfile}
                        disabled={profileForm.processing}
                        className={`w-full relative flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-md transition-all duration-150 disabled:opacity-50 ${
                            updateSuccess
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                                : "bg-[#22c55e] hover:bg-[#16a34a] active:bg-[#15803d] text-white ring-2 ring-green-300/80 hover:shadow-lg"
                        }`}
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-sm"></span>
                        </span>
                        <span>
                            {profileForm.processing
                                ? "Saving Updates..."
                                : updateSuccess
                                  ? "✓ Information Updated!"
                                  : "Update Information"}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:shadow transition"
                    >
                        <span>Continue to Questionnaire</span>
                        <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>
            </div>
        </form>
    );
}
