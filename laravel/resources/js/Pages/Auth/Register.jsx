import React, { useRef, useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import PortalGuest from "@/Layouts/PortalGuest";
import GoogleSignInButton from "@/Components/GoogleSignInButton";
import RecaptchaWidget from "@/Components/RecaptchaWidget";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Register() {
    const { integrations } = usePage().props;
    const recaptchaRef = useRef(null);
    const [authError, setAuthError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const googleClientId =
        integrations?.google?.client_id || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const recaptchaSiteKey =
        integrations?.recaptcha?.site_key ||
        import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const resolveRoute = (name, params = {}) => {
        try {
            if (typeof route === "function") {
                return route(name, params);
            }
        } catch {
            // Fallback gracefully
        }
        const fallbacks = {
            login: "/login",
            register: "/register",
            "auth.google": "/auth/google",
        };
        return fallbacks[name] || `/${name}`;
    };

    const form = useForm({
        full_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        recaptcha_token: "",
    });

    const handleGoogleSuccess = (credential) => {
        setAuthError("");
        setGoogleLoading(true);
        router.post(
            resolveRoute("auth.google"),
            {
                credential,
                recaptcha_token: form.data.recaptcha_token,
            },
            {
                onError: (errors) => {
                    setGoogleLoading(false);
                    const errorMsg =
                        errors?.google ||
                        errors?.email ||
                        errors?.recaptcha ||
                        (typeof errors === "object"
                            ? Object.values(errors)[0]
                            : null) ||
                        "Google registration failed. Please try again.";
                    setAuthError(errorMsg);
                    recaptchaRef.current?.reset();
                },
                onFinish: () => setGoogleLoading(false),
            }
        );
    };

    const handleGoogleError = (err) => {
        setAuthError(
            typeof err === "string"
                ? err
                : "Google registration could not be completed."
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setAuthError("");
        form.post(resolveRoute("register"), {
            onFinish: () => {
                form.reset("password", "password_confirmation");
                recaptchaRef.current?.reset();
            },
        });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/login";
        }
    };

    return (
        <PortalGuest>
            <Head title="Create student account" />

            <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
                    Student Registration
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Create account
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Sign up with your BukSU student account
                </p>
            </div>

            <button
                type="button"
                onClick={handleBack}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign in
            </button>

            {authError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                    {authError}
                </div>
            )}

            {form.errors && Object.keys(form.errors).length > 0 && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 space-y-1">
                    {Object.values(form.errors).map((err, i) => (
                        <p key={i}>{err}</p>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                    <label
                        htmlFor="full_name"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                        Full Name
                    </label>
                    <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-sky-50/30 transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            autoComplete="name"
                            placeholder="e.g. Juan P. Dela Cruz"
                            value={form.data.full_name}
                            onChange={(e) =>
                                form.setData("full_name", e.target.value)
                            }
                            required
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                        Student Institutional Email
                    </label>
                    <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-sky-50/30 transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="2401105814@student.buksu.edu.ph"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData("email", e.target.value)
                            }
                            required
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Must end with @student.buksu.edu.ph
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                        Password
                    </label>
                    <div className="relative flex w-full overflow-hidden rounded-lg border border-slate-200 bg-sky-50/30 transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="At least 12 characters"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData("password", e.target.value)
                            }
                            required
                            className="w-full bg-transparent px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-sky-600 transition-colors"
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                    >
                        Confirm Password
                    </label>
                    <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-sky-50/30 transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            value={form.data.password_confirmation}
                            onChange={(e) =>
                                form.setData(
                                    "password_confirmation",
                                    e.target.value
                                )
                            }
                            required
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Google reCAPTCHA v2 Checkbox */}
                {recaptchaSiteKey && (
                    <RecaptchaWidget
                        ref={recaptchaRef}
                        siteKey={recaptchaSiteKey}
                        onChange={(token) =>
                            form.setData("recaptcha_token", token)
                        }
                        onExpired={() => form.setData("recaptcha_token", "")}
                        onError={(err) => setAuthError(err)}
                    />
                )}

                {/* Original BukSU Sky Blue Button */}
                <button
                    type="submit"
                    disabled={form.processing || googleLoading}
                    className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-60 cursor-pointer"
                >
                    {form.processing
                        ? "Creating account..."
                        : "Create account"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>Or register with</span>
                    <span className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Google Sign-in */}
                <div className="flex min-h-10 w-full justify-center">
                    {googleClientId ? (
                        <GoogleSignInButton
                            clientId={googleClientId}
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            disabled={googleLoading || form.processing}
                        />
                    ) : (
                        <p className="text-center text-xs text-slate-400">
                            Google sign-in is currently unavailable.
                        </p>
                    )}
                </div>
            </form>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                    Already registered?{" "}
                    <Link
                        href={resolveRoute("login")}
                        className="font-semibold text-sky-600 hover:text-sky-800 underline transition"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </PortalGuest>
    );
}
