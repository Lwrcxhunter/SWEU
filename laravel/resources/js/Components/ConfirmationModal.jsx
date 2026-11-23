import { useRef } from "react";
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Description,
} from "@headlessui/react";
import { LoaderCircle } from "lucide-react";

export default function ConfirmationModal({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    processingLabel = "Saving…",
    processing = false,
    destructive = false,
    errors = {},
    onConfirm,
    onClose,
}) {
    const cancelRef = useRef(null);
    const close = () => {
        if (!processing) onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={close}
            initialFocus={cancelRef}
            className="fixed inset-0 z-50"
        >
            <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto p-4">
                <div className="flex min-h-full items-center justify-center">
                    <DialogPanel
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        aria-busy={processing}
                    >
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {title}
                        </DialogTitle>
                        <Description className="mt-2 text-sm leading-6 text-slate-600">
                            {description}
                        </Description>
                        {Object.values(errors)
                            .flat()
                            .map((error, index) => (
                                <p
                                    key={index}
                                    role="alert"
                                    className="mt-3 text-sm text-rose-700"
                                >
                                    {error}
                                </p>
                            ))}
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                ref={cancelRef}
                                type="button"
                                disabled={processing}
                                onClick={close}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Go back
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => {
                                    if (!processing) onConfirm();
                                }}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-rose-700 hover:bg-rose-800" : "bg-sky-700 hover:bg-sky-800"}`}
                            >
                                {processing && (
                                    <LoaderCircle
                                        aria-hidden="true"
                                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                    />
                                )}
                                <span aria-live="polite">
                                    {processing
                                        ? processingLabel
                                        : confirmLabel}
                                </span>
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
