import { useEffect, useState } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import Office, { Card, Field, Button, Errors } from "@/Components/Office";
import {
    AddressFields,
    EmergencyFields,
    MedicalHistoryFields,
} from "@/Components/StudentInformationFields";

export default function PersonalInformation({
    student,
    colleges = [],
    programs = {},
}) {
    const { auth } = usePage().props;
    const personal = student?.personal_details ?? {};
    const addr = student?.address ?? {};
    const med = student?.medical_history ?? {};
    const sub = med?.substance_use ?? {};

    const nameParts = (auth.user?.full_name || "").trim().split(/\s+/);
    const defaultFirst = nameParts[0] || "";
    const defaultLast =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const defaultMiddle =
        nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    const form = useForm({
        first_name: personal.first_name || defaultFirst,
        middle_name: personal.middle_name || defaultMiddle,
        last_name: personal.last_name || defaultLast,
        school_id_number:
            personal.school_id_number || student?.school_id_number || "",
        college:
            personal.college ||
            (typeof student?.college === "string"
                ? student?.college
                : student?.college?.code || ""),
        program: personal.program || "",
        year_level: String(personal.year_level || student?.year_level || "1"),
        dob: personal.dob || student?.dob || "",
        marital_status: personal.marital_status || "Single",
        phone_number: personal.phone_number || student?.phone_number || "",
        facebook_messenger_username: student?.facebook_messenger_username || "",
        religious_affiliation: student?.religious_affiliation || "",
        address: {
            province: addr.province || addr.state_province || "",
            city_municipality: addr.city_municipality || addr.city || "",
            barangay: addr.barangay || "",
            zip_code: addr.zip_code || addr.postal_zip || "",
            street_subdivision: addr.street_subdivision || addr.street || "",
        },
        emergency_name: student?.emergency_contact?.name || "",
        emergency_relationship:
            student?.emergency_contact?.relationship_to_client || "",
        emergency_phone: student?.emergency_contact?.phone || "",
        medical_history: {
            conditions: med.conditions || [],
            other_conditions_specify: med.other_conditions_specify || "",
            on_prescription_meds: med.on_prescription_meds ?? false,
            current_meds_specify: med.current_meds_specify || "",
            recent_surgeries_past_5_yrs:
                med.recent_surgeries_past_5_yrs ?? false,
            surgeries_specify: med.surgeries_specify || "",
            family_medical_history_notes:
                med.family_medical_history_notes || "",
            substance_use: {
                tobacco_vape: sub.tobacco_vape || "No",
                alcohol: sub.alcohol || "No",
                caffeine: sub.caffeine || "No",
                drugs: sub.drugs || "No",
            },
        },
        is_sworn_truthful: false,
        signed_agreement: false,
    });

    const [programOptions, setProgramOptions] = useState(() => {
        const col = form.data.college;
        return programs?.[col] || [];
    });

    useEffect(() => {
        if (!form.data.college) {
            setProgramOptions([]);
            return;
        }

        if (programs?.[form.data.college]) {
            setProgramOptions(programs[form.data.college]);
        } else {
            fetch(
                `/api/programs?college=${encodeURIComponent(form.data.college)}`,
            )
                .then((res) => (res.ok ? res.json() : []))
                .then((data) =>
                    setProgramOptions(Array.isArray(data) ? data : []),
                )
                .catch(() => setProgramOptions([]));
        }
    }, [form.data.college, programs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route("personal-information.store"));
    };

    return (
        <Office
            title="Personal information"
            eyebrow="Student profile & intake record"
            description="Keep your contact, academic, and medical profile up to date. Medical and sensitive personal details remain confidential."
        >
            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                <Errors errors={form.errors} />

                <Card
                    title="01 / Personal & academic details"
                    description="Your official identity and academic enrollment record."
                >
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field
                            form={form}
                            name="first_name"
                            label="First name"
                            required
                            maxLength={100}
                            autoComplete="given-name"
                        />
                        <Field
                            form={form}
                            name="middle_name"
                            label="Middle name"
                            maxLength={100}
                            autoComplete="additional-name"
                            hint="Optional"
                        />
                        <Field
                            form={form}
                            name="last_name"
                            label="Last name"
                            required
                            maxLength={100}
                            autoComplete="family-name"
                        />
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div>
                            <p className="mb-2 text-sm font-medium">
                                University email
                            </p>
                            <p className="break-all rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 border border-slate-200">
                                {auth.user?.email}
                            </p>
                        </div>
                        <Field
                            form={form}
                            name="school_id_number"
                            label="Student ID number"
                            required
                            maxLength={20}
                            placeholder="e.g., 2024-12345"
                        />
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <div>
                            <label
                                htmlFor="college"
                                className="mb-2 block text-sm font-medium"
                            >
                                College <span className="text-red-600">*</span>
                            </label>
                            <select
                                id="college"
                                name="college"
                                value={form.data.college}
                                onChange={(e) => {
                                    form.setData((prev) => ({
                                        ...prev,
                                        college: e.target.value,
                                        program: "",
                                    }));
                                }}
                                className="control"
                                required
                            >
                                <option value="">Select your college</option>
                                {colleges.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                            {form.errors.college && (
                                <p className="mt-1 text-xs text-red-700">
                                    {form.errors.college}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="program"
                                className="mb-2 block text-sm font-medium"
                            >
                                Program / Course
                            </label>
                            <select
                                id="program"
                                name="program"
                                value={form.data.program}
                                onChange={(e) =>
                                    form.setData("program", e.target.value)
                                }
                                disabled={!form.data.college}
                                className="control"
                            >
                                <option value="">
                                    {!form.data.college
                                        ? "Select a college first"
                                        : "Select your program"}
                                </option>
                                {form.data.program &&
                                    !programOptions.includes(
                                        form.data.program,
                                    ) && (
                                        <option value={form.data.program}>
                                            {form.data.program}
                                        </option>
                                    )}
                                {programOptions.map((prog) => (
                                    <option key={prog} value={prog}>
                                        {prog}
                                    </option>
                                ))}
                            </select>
                            {form.errors.program && (
                                <p className="mt-1 text-xs text-red-700">
                                    {form.errors.program}
                                </p>
                            )}
                        </div>

                        <Field
                            form={form}
                            name="year_level"
                            label="Year level"
                            type="select"
                            required
                        >
                            <option value="">Select Year Level</option>
                            {["1", "2", "3", "4"].map((v) => (
                                <option key={v} value={v}>
                                    Year {v}
                                </option>
                            ))}
                        </Field>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <Field
                            form={form}
                            name="phone_number"
                            label="Mobile number"
                            type="tel"
                            required
                            hint="09xxxxxxxxx or +639xxxxxxxxx"
                        />
                        <Field
                            form={form}
                            name="facebook_messenger_username"
                            label="Facebook / Messenger username"
                            maxLength={150}
                            placeholder="e.g., firstname.lastname"
                        />
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <Field
                            form={form}
                            name="dob"
                            label="Date of birth"
                            type="date"
                            autoComplete="bday"
                        />
                        <Field
                            form={form}
                            name="marital_status"
                            label="Marital status"
                            maxLength={100}
                            placeholder="e.g., Single, Married"
                        />
                        <Field
                            form={form}
                            name="religious_affiliation"
                            label="Religious affiliation"
                            maxLength={150}
                            placeholder="e.g., Roman Catholic, Protestant, Islam"
                        />
                    </div>
                </Card>

                <AddressFields form={form} />
                <EmergencyFields form={form} />
                <MedicalHistoryFields form={form} />

                <Card className="border-sky-200 bg-sky-50/40">
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-start gap-3 text-xs leading-5 text-slate-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.signed_agreement}
                                    onChange={(e) =>
                                        form.setData(
                                            "signed_agreement",
                                            e.target.checked,
                                        )
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    required
                                />
                                <span>
                                    <strong className="font-semibold text-slate-900">
                                        Consent &amp; Ethical Use Authorization:
                                    </strong>{" "}
                                    I hereby authorize the BukSU Student Welfare
                                    and Engagement Unit (SWEU) to collect,
                                    process, and use my information for ethical
                                    counseling, guidance services, and official
                                    university support in accordance with
                                    professional confidentiality and data
                                    privacy standards.
                                </span>
                            </label>
                            {form.errors.signed_agreement && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                                    {form.errors.signed_agreement}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="flex items-start gap-3 text-xs leading-5 text-slate-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_sworn_truthful}
                                    onChange={(e) =>
                                        form.setData(
                                            "is_sworn_truthful",
                                            e.target.checked,
                                        )
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    required
                                />
                                <span>
                                    <strong className="font-semibold text-slate-900">
                                        Sworn Truthfulness Statement:
                                    </strong>{" "}
                                    I hereby swear that all information provided
                                    is true, correct, and complete.
                                </span>
                            </label>
                            {form.errors.is_sworn_truthful && (
                                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                                    {form.errors.is_sworn_truthful}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-sky-100">
                            <Link
                                href={route("student.dashboard")}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                            >
                                Cancel & Return to Dashboard
                            </Link>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2.5"
                            >
                                {form.processing
                                    ? "Saving..."
                                    : "Save Information"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>
        </Office>
    );
}
