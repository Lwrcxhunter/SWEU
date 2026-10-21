import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import Office from "@/Components/Office";
import WizardStep1Review from "./Wizard/WizardStep1Review";
import WizardStep2Questionnaire from "./Wizard/WizardStep2Questionnaire";
import WizardStep3Signature from "./Wizard/WizardStep3Signature";
import WizardStep4Preview from "./Wizard/WizardStep4Preview";

const WIZARD_STEPS = [
    { num: 1, title: "1. Personal & Medical Review" },
    { num: 2, title: "2. Visit Questionnaire" },
    { num: 3, title: "3. Verification & Signature" },
    { num: 4, title: "4. Document Preview & Submit" },
];

export default function AppointmentWizard({
    student,
    colleges = [],
    programs = {},
}) {
    const [step, setStep] = useState(1);
    const personal = student?.personal_details ?? {};
    const addr = student?.address ?? {};
    const med = student?.medical_history ?? {};
    const sub = med?.substance_use ?? {};

    // Step 1: Profile & Medical in-place review form
    const profileForm = useForm({
        first_name: personal.first_name || "",
        middle_name: personal.middle_name || "",
        last_name: personal.last_name || "",
        school_id_number:
            personal.school_id_number || student?.school_id_number || "",
        college:
            personal.college ||
            (typeof student?.college === "string"
                ? student?.college
                : student?.college?.code || "CAS"),
        program: personal.program || "",
        year_level: String(personal.year_level || student?.year_level || "1"),
        dob: personal.dob || student?.dob || "",
        marital_status: personal.marital_status || "Single",
        phone_number: personal.phone_number || student?.phone_number || "",
        facebook_messenger_username: student?.facebook_messenger_username || "",
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
        is_sworn_truthful: true,
        signed_agreement: true,
    });

    // Step 2 & 3: Questionnaire and Signature form for Appointment Creation
    const appointmentForm = useForm({
        channel: "face_to_face",
        scheduled_date: "",
        scheduled_time: "09:00",
        reason: "",
        expectations: "",
        average_sleep: "6 - 7 hours",
        prior_consultation: false,
        prior_consultation_details: "",
        additional_comments: "",
        signed_declaration: false,
        signature: "",
        signature_type: "drawn",
        typed_signature:
            `${personal.first_name || ""} ${personal.last_name || ""}`.trim(),
    });

    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateFeedbackMessage, setUpdateFeedbackMessage] = useState("");

    // Step 1: Save profile updates
    const handleUpdateProfile = (e) => {
        if (e) e.preventDefault();
        setUpdateSuccess(false);
        setUpdateFeedbackMessage("");
        profileForm.post(route("personal-information.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setUpdateSuccess(true);
                setUpdateFeedbackMessage(
                    "Your personal and medical information has been updated and saved successfully.",
                );
                setTimeout(() => {
                    setUpdateSuccess(false);
                    setUpdateFeedbackMessage("");
                }, 4000);
            },
            onError: () => {
                setUpdateFeedbackMessage(
                    "Failed to update profile. Please ensure all required fields are filled properly.",
                );
            },
        });
    };

    // Step 4: Final submission to store appointment
    const handleFinalSubmit = () => {
        const payload = {
            channel: appointmentForm.data.channel || "face_to_face",
            scheduled_date: appointmentForm.data.scheduled_date,
            scheduled_time: appointmentForm.data.scheduled_time,
            reason: appointmentForm.data.reason,
            expectations: appointmentForm.data.expectations,
            average_sleep: appointmentForm.data.average_sleep,
            prior_consultation: appointmentForm.data.prior_consultation,
            prior_consultation_details:
                appointmentForm.data.prior_consultation_details,
            additional_comments: appointmentForm.data.additional_comments,
            signed_declaration: appointmentForm.data.signed_declaration,
            signature:
                appointmentForm.data.signature ||
                appointmentForm.data.typed_signature,
        };

        appointmentForm.post(route("appointments.store"), {
            data: payload,
            onSuccess: () => {
                // Controller will redirect to appointments index with flash message
            },
        });
    };

    const clientFullName =
        `${profileForm.data.first_name} ${profileForm.data.middle_name} ${profileForm.data.last_name}`.trim();

    return (
        <Office
            title="Request a Counseling Session"
            eyebrow="Guidance Intake Wizard"
            description="Complete the 4-step intake process to review personal data, state your visit concerns, verify information, and schedule a session."
            action={
                <Link
                    href={route("appointments.index")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-sky-700 shadow-sm hover:bg-sky-50 transition"
                >
                    &larr; Back to Appointments
                </Link>
            }
        >
            {/* Step Indicator Progress Bar */}
            <div className="mb-8">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-center">
                    {WIZARD_STEPS.map((s) => (
                        <button
                            key={s.num}
                            type="button"
                            onClick={() => s.num < step && setStep(s.num)}
                            disabled={s.num > step}
                            className={`p-2.5 rounded-xl border transition text-center ${
                                step === s.num
                                    ? "bg-sky-600 text-white border-sky-600 shadow-sm font-bold"
                                    : s.num < step
                                      ? "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
                                      : "bg-white/60 text-slate-400 border-sky-100 cursor-not-allowed"
                            }`}
                        >
                            <span className="hidden md:inline">{s.title}</span>
                            <span className="md:hidden">Step {s.num}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* STEP 1: REVIEW PERSONAL & MEDICAL INFORMATION */}
            {step === 1 && (
                <WizardStep1Review
                    profileForm={profileForm}
                    colleges={colleges}
                    programs={programs}
                    onUpdateProfile={handleUpdateProfile}
                    onContinue={() => setStep(2)}
                    updateSuccess={updateSuccess}
                    updateFeedbackMessage={updateFeedbackMessage}
                />
            )}

            {/* STEP 2: INITIAL VISIT QUESTIONNAIRE */}
            {step === 2 && (
                <WizardStep2Questionnaire
                    appointmentForm={appointmentForm}
                    onBack={() => setStep(1)}
                    onContinue={() => setStep(3)}
                />
            )}

            {/* STEP 3: TRUTHFULNESS VERIFICATION & DIGITAL SIGNATURE */}
            {step === 3 && (
                <WizardStep3Signature
                    appointmentForm={appointmentForm}
                    clientFullName={clientFullName}
                    onBack={() => setStep(2)}
                    onContinue={() => setStep(4)}
                />
            )}

            {/* STEP 4: DOCUMENT PREVIEW & SUBMISSION */}
            {step === 4 && (
                <WizardStep4Preview
                    profileForm={profileForm}
                    appointmentForm={appointmentForm}
                    clientFullName={clientFullName}
                    onBack={() => setStep(3)}
                    onSubmit={handleFinalSubmit}
                />
            )}
        </Office>
    );
}
