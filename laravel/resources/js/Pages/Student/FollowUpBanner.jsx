import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function FollowUpBanner({ appointments = [] }) {
    const [declining, setDeclining] = useState(null);
    const form = useForm({ note: "" });
    const respond = (appointment, action) => {
        form.transform((data) => ({
            ...data,
            action,
            version: appointment.version,
        })).patch(route("appointments.update", appointment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeclining(null);
                form.reset();
            },
        });
    };

    if (!appointments.length) return null;

    return (
        <section
            aria-label="Follow-up sessions awaiting your response"
            className="mb-6 space-y-3"
        >
            {appointments.map((appointment) => (
                <div
                    key={appointment.id}
                    className="rounded-xl border border-amber-300 bg-amber-50 p-5"
                >
                    <h2 className="font-semibold text-amber-950">
                        Your counselor scheduled a follow-up session
                    </h2>
                    <p className="mt-2 text-sm text-amber-900">
                        {appointment.scheduled_date} at{" "}
                        {appointment.scheduled_time} (Philippine time) ·{" "}
                        {appointment.channel === "face_to_face"
                            ? "Face-to-Face"
                            : "Virtual (Online)"}
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                        Counselor:{" "}
                        {appointment.counselor_name || "Assigned counselor"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={() => {
                                form.clearErrors();
                                respond(appointment, "student_confirm");
                            }}
                            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Accept Schedule
                        </button>
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={() => {
                                form.reset();
                                form.clearErrors();
                                setDeclining(appointment);
                            }}
                            className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50"
                        >
                            Decline / Request Change
                        </button>
                    </div>
                </div>
            ))}
            {!declining &&
                Object.values(form.errors).map((error, index) => (
                    <p
                        key={index}
                        role="alert"
                        className="text-sm text-red-700"
                    >
                        {error}
                    </p>
                ))}
            <Dialog
                open={Boolean(declining)}
                onClose={() => {
                    if (!form.processing) setDeclining(null);
                }}
                className="relative z-50"
            >
                <div
                    className="fixed inset-0 bg-slate-900/50"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
                    <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <DialogTitle className="text-lg font-semibold text-slate-900">
                            Decline / Request Change
                        </DialogTitle>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (form.data.note.trim())
                                    respond(declining, "student_decline");
                                else
                                    form.setError(
                                        "note",
                                        "Please provide a reason.",
                                    );
                            }}
                        >
                            <label
                                htmlFor="follow-up-reason"
                                className="mt-4 block text-sm font-medium text-slate-700"
                            >
                                Reason for declining follow-up session
                            </label>
                            <textarea
                                id="follow-up-reason"
                                data-autofocus
                                required
                                maxLength={1000}
                                rows={4}
                                value={form.data.note}
                                onChange={(event) =>
                                    form.setData("note", event.target.value)
                                }
                                className="mt-2 w-full rounded-lg border-slate-300"
                            />
                            <p className="mt-2 text-sm text-slate-600">
                                Your reason will be sent to your assigned
                                counselor to coordinate a new schedule.
                            </p>
                            {Object.values(form.errors).map((error, index) => (
                                <p
                                    key={index}
                                    role="alert"
                                    className="mt-2 text-sm text-red-700"
                                >
                                    {error}
                                </p>
                            ))}
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => setDeclining(null)}
                                    className="rounded-lg border px-4 py-2 text-sm"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    Submit Reason
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </section>
    );
}
