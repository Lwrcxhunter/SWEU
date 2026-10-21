import { useEffect, useRef, useState } from "react";
import { Card, Button } from "@/Components/Office";

export default function WizardStep3Signature({
    appointmentForm,
    clientFullName,
    onBack,
    onContinue,
}) {
    const [signatureMode, setSignatureMode] = useState("drawn");
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(
        Boolean(appointmentForm.data.signature),
    );
    const [error, setError] = useState("");

    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const hasDrawnRef = useRef(Boolean(appointmentForm.data.signature));

    // Keep hasDrawnRef in sync with hasDrawn state
    useEffect(() => {
        hasDrawnRef.current = hasDrawn;
    }, [hasDrawn]);

    // Apply context stroke styles
    const applyContextStyles = (canvas, dpr = 1) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.strokeStyle = "#0369a1"; // sky-700
        ctx.lineWidth = 2.5 * dpr;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    };

    // Responsive High-DPI canvas setup
    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.round(rect.width * dpr);
        const targetHeight = Math.round(rect.height * dpr);

        if (canvas.width === targetWidth && canvas.height === targetHeight) {
            applyContextStyles(canvas, dpr);
            return;
        }

        // Preserve current drawing on dimension change
        let existingData = null;
        if (hasDrawnRef.current) {
            try {
                existingData = canvas.toDataURL("image/png");
            } catch {
                existingData = null;
            }
        }
        const signatureSrc = existingData || appointmentForm.data.signature;

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        applyContextStyles(canvas, dpr);

        if (signatureSrc && signatureSrc.startsWith("data:image")) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    setHasDrawn(true);
                    hasDrawnRef.current = true;
                }
            };
            img.src = signatureSrc;
        }
    };

    // Initialize canvas and observe size changes
    useEffect(() => {
        if (signatureMode !== "drawn") return;

        setupCanvas();

        const canvas = canvasRef.current;
        if (!canvas) return;

        let resizeObserver = null;
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                if (!isDrawingRef.current) {
                    setupCanvas();
                }
            });
            resizeObserver.observe(canvas);
        }

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [signatureMode]);

    // Precise sub-pixel coordinate mapping
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    // Unified Pointer Event Handlers
    const handlePointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // fallback if not supported
        }

        const { x, y } = getCoordinates(e);
        lastPointRef.current = { x, y };
        isDrawingRef.current = true;
        setIsDrawing(true);

        const ctx = canvas.getContext("2d");
        if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            applyContextStyles(canvas, dpr);
            ctx.beginPath();
            ctx.moveTo(x, y);
            // Single tap / click creates a point
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        setHasDrawn(true);
        hasDrawnRef.current = true;
        setError("");
    };

    const handlePointerMove = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas || !lastPointRef.current) return;

        const { x, y } = getCoordinates(e);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastPointRef.current = { x, y };
        setHasDrawn(true);
        hasDrawnRef.current = true;
    };

    const handlePointerUp = (e) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        setIsDrawing(false);
        lastPointRef.current = null;

        try {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        } catch {
            // ignore
        }

        const canvas = canvasRef.current;
        if (canvas) {
            appointmentForm.setData("signature", canvas.toDataURL("image/png"));
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasDrawn(false);
        hasDrawnRef.current = false;
        appointmentForm.setData("signature", "");
    };

    const handleProceed = (e) => {
        e.preventDefault();
        setError("");

        if (!appointmentForm.data.signed_declaration) {
            setError(
                "Please confirm your acknowledgment of the Sworn Truthfulness Statement and Ethical Record Policy.",
            );
            return;
        }

        if (
            signatureMode === "drawn" &&
            !hasDrawn &&
            !appointmentForm.data.signature
        ) {
            setError(
                "Please sign your digital signature on the signature pad above or switch to typed name.",
            );
            return;
        }

        if (
            signatureMode === "typed" &&
            !appointmentForm.data.typed_signature?.trim()
        ) {
            setError("Please enter your typed name signature.");
            return;
        }

        let finalSignatureDataUrl = null;
        if (signatureMode === "drawn" && canvasRef.current) {
            finalSignatureDataUrl = canvasRef.current.toDataURL("image/png");
            appointmentForm.setData("signature", finalSignatureDataUrl);
            appointmentForm.setData("signature_type", "drawn");
        } else if (signatureMode === "typed") {
            appointmentForm.setData(
                "signature",
                appointmentForm.data.typed_signature,
            );
            appointmentForm.setData("signature_type", "typed");
        }

        onContinue({
            signatureMode,
            hasDrawn,
            canvasDataUrl: finalSignatureDataUrl,
        });
    };

    return (
        <form onSubmit={handleProceed} className="space-y-6">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3">
                <span className="text-base">✍️</span>
                <div className="leading-relaxed">
                    <strong className="font-semibold block text-sky-900 mb-0.5">
                        Step 3 of 4: Verification &amp; Digital Signature
                    </strong>
                    Provide your electronic signature to certify that all
                    information submitted in your intake form is true, correct,
                    and authorized for ethical counseling use.
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm flex items-start gap-2.5"
                >
                    <svg
                        className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
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
                    <span>{error}</span>
                </div>
            )}

            <Card
                title="Digital Signature"
                description="Your signature will be embedded onto your official counseling intake document."
            >
                {/* Mode Switcher */}
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setSignatureMode("drawn");
                            appointmentForm.setData("signature_type", "drawn");
                        }}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                            signatureMode === "drawn"
                                ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                                : "bg-white text-slate-700 border-sky-200 hover:bg-sky-50"
                        }`}
                    >
                        ✏️ Draw Digital Signature
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSignatureMode("typed");
                            appointmentForm.setData("signature_type", "typed");
                        }}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                            signatureMode === "typed"
                                ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                                : "bg-white text-slate-700 border-sky-200 hover:bg-sky-50"
                        }`}
                    >
                        ⌨️ Type Full Name
                    </button>
                </div>

                {signatureMode === "drawn" ? (
                    <div>
                        <div className="relative border-2 border-dashed border-sky-200 hover:border-sky-300 rounded-xl bg-white p-2 transition">
                            <canvas
                                ref={canvasRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                className="relative z-10 w-full h-40 border border-slate-100 rounded-lg cursor-crosshair bg-transparent touch-none select-none"
                                style={{ touchAction: "none" }}
                            />
                            {/* Visual baseline guideline behind transparent canvas */}
                            <div className="pointer-events-none absolute inset-x-6 bottom-9 z-0 flex items-center gap-2 border-b border-dashed border-slate-200 pb-1 text-[11px] text-slate-300 select-none">
                                <span className="font-serif italic text-slate-400 font-semibold text-sm">
                                    ✕
                                </span>
                                <span className="text-[10px] tracking-wider uppercase text-slate-400 font-mono">
                                    Sign on the line
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2.5 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                {hasDrawn ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Signature captured
                                    </span>
                                ) : (
                                    <span className="text-slate-500 text-xs">
                                        Draw inside the signature box using your
                                        mouse, trackpad, or finger.
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={clearCanvas}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline px-2 py-1 rounded transition"
                            >
                                Clear Signature
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Type your full legal name:
                        </label>
                        <input
                            type="text"
                            value={appointmentForm.data.typed_signature}
                            onChange={(e) =>
                                appointmentForm.setData(
                                    "typed_signature",
                                    e.target.value,
                                )
                            }
                            placeholder={clientFullName}
                            className="w-full rounded-lg border-sky-200 text-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 font-serif italic"
                        />
                        <div className="mt-3 p-4 bg-sky-50/50 rounded-xl border border-sky-100 text-center">
                            <span className="text-xs text-slate-400 block mb-1">
                                Signature Preview:
                            </span>
                            <span className="font-serif italic text-2xl text-sky-800">
                                {appointmentForm.data.typed_signature ||
                                    clientFullName ||
                                    "Your Name"}
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {/* Sworn Truthfulness Declaration */}
            <Card title="Sworn Statement & Ethical Consent">
                <div className="border border-dashed border-sky-300 bg-sky-50/40 p-4 text-xs rounded-xl leading-relaxed text-slate-800 space-y-3">
                    <p>
                        <strong className="block text-sky-900 font-bold text-sm mb-1">
                            Sworn Truthfulness Statement:
                        </strong>
                        "I hereby swear and affirm that all personal, academic,
                        address, medical, and initial visit disclosures provided
                        in this counseling intake document are truthful,
                        accurate, and complete to the best of my knowledge."
                    </p>
                    <p className="border-t border-sky-100 pt-2 text-slate-600">
                        <strong className="text-slate-800">
                            Ethical Confidentiality Notice:
                        </strong>{" "}
                        I authorize BukSU SWEU Guidance and Counseling Services
                        to maintain this record under strict professional code
                        of ethics and confidentiality laws. Information will be
                        accessed solely by authorized guidance personnel.
                    </p>
                </div>

                <div className="mt-4">
                    <label className="flex items-start gap-3 text-xs text-slate-800 cursor-pointer">
                        <input
                            type="checkbox"
                            required
                            checked={appointmentForm.data.signed_declaration}
                            onChange={(e) =>
                                appointmentForm.setData(
                                    "signed_declaration",
                                    e.target.checked,
                                )
                            }
                            className="mt-0.5 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                        />
                        <span className="font-semibold leading-5">
                            I understand and agree to the Sworn Truthfulness
                            Statement and authorize BukSU SWEU to manage my
                            records ethically.
                        </span>
                    </label>
                </div>
            </Card>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                <Button secondary type="button" onClick={onBack}>
                    &larr; Back to Questionnaire
                </Button>
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow transition"
                >
                    <span>Proceed to Document Preview</span>
                    <span aria-hidden="true">&rarr;</span>
                </button>
            </div>
        </form>
    );
}
