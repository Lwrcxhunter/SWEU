import { Card, Button } from "@/Components/Office";
import { TIME_SLOTS, AVERAGE_SLEEP_OPTIONS } from "@/Support/guidanceConstants";

export default function WizardStep2Questionnaire({
    appointmentForm,
    onBack,
    onContinue,
}) {
    const minDate = new Date().toISOString().split("T")[0];

    const handleSubmit = (e) => {
        e.preventDefault();
        onContinue();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3">
                <span className="text-base">📝</span>
                <div className="leading-relaxed">
                    <strong className="font-semibold block text-sky-900 mb-0.5">
                        Step 2 of 4: Initial Visit Questionnaire &amp; Schedule
                    </strong>
                    Please provide the reasons for your visit and request your
                    preferred face-to-face counseling schedule at the SWEU
                    guidance office.
                </div>
            </div>

            {/* Schedule Preference */}
            <Card
                title="Session Venue & Preferred Schedule"
                description="Counseling sessions are conducted in-person at the SWEU Guidance Office."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Counseling Venue
                        </label>
                        <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3.5 py-2.5 text-xs font-medium text-sky-900 flex items-center gap-2">
                            <span>👥</span>
                            <span>Face-to-Face (SWEU Guidance Office)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Preferred Date *
                            </label>
                            <input
                                type="date"
                                required
                                min={minDate}
                                value={appointmentForm.data.scheduled_date}
                                onChange={(e) =>
                                    appointmentForm.setData(
                                        "scheduled_date",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Preferred Time *
                            </label>
                            <select
                                required
                                value={appointmentForm.data.scheduled_time}
                                onChange={(e) =>
                                    appointmentForm.setData(
                                        "scheduled_time",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            >
                                {TIME_SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot} (PST)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Questionnaire */}
            <Card
                title="Initial Visit Questionnaire"
                description="Help your guidance designate prepare for your session."
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            1. Reason for Initial Visit *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={appointmentForm.data.reason}
                            onChange={(e) =>
                                appointmentForm.setData(
                                    "reason",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            placeholder="Describe what brings you to guidance counseling (academic, personal, emotional, or career guidance)..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            2. Session Expectations *
                        </label>
                        <textarea
                            required
                            rows={2}
                            value={appointmentForm.data.expectations}
                            onChange={(e) =>
                                appointmentForm.setData(
                                    "expectations",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            placeholder="What do you hope to achieve or discuss during this counseling session?"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                3. Average Sleep per Night *
                            </label>
                            <select
                                required
                                value={appointmentForm.data.average_sleep}
                                onChange={(e) =>
                                    appointmentForm.setData(
                                        "average_sleep",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            >
                                {AVERAGE_SLEEP_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                4. Prior Mental Health Consultation *
                            </label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="prior_consultation"
                                        checked={
                                            appointmentForm.data
                                                .prior_consultation === false
                                        }
                                        onChange={() =>
                                            appointmentForm.setData(
                                                "prior_consultation",
                                                false,
                                            )
                                        }
                                        className="text-sky-600 focus:ring-sky-400 accent-sky-600"
                                    />
                                    <span>No prior consultation</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="prior_consultation"
                                        checked={
                                            appointmentForm.data
                                                .prior_consultation === true
                                        }
                                        onChange={() =>
                                            appointmentForm.setData(
                                                "prior_consultation",
                                                true,
                                            )
                                        }
                                        className="text-sky-600 focus:ring-sky-400 accent-sky-600"
                                    />
                                    <span>Yes, consulted previously</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {appointmentForm.data.prior_consultation && (
                        <div className="rounded-lg bg-sky-50/50 p-3 border border-sky-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Prior Consultation Details *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Specify past professional, clinic, or counseling experience..."
                                value={
                                    appointmentForm.data
                                        .prior_consultation_details
                                }
                                onChange={(e) =>
                                    appointmentForm.setData(
                                        "prior_consultation_details",
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            5. Additional Comments or Concerns (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={appointmentForm.data.additional_comments}
                            onChange={(e) =>
                                appointmentForm.setData(
                                    "additional_comments",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-lg border-sky-200 text-xs px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                            placeholder="Any specific accommodations, physical access needs, or notes..."
                        />
                    </div>
                </div>
            </Card>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                <Button secondary type="button" onClick={onBack}>
                    &larr; Back to Step 1
                </Button>
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow transition"
                >
                    <span>Proceed to Verification &amp; Signature</span>
                    <span aria-hidden="true">&rarr;</span>
                </button>
            </div>
        </form>
    );
}
