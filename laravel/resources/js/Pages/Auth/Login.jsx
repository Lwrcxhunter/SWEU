import { Head, Link, useForm } from "@inertiajs/react";
import PortalGuest from "@/Layouts/PortalGuest";
import { Field, Button, Errors } from "@/Components/Office";
export default function Login() {
    const form = useForm({ email: "", password: "" });
    return (
        <PortalGuest>
            <Head title="Welcome back" />
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                Your private workspace
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back.
            </h2>
            <p className="mt-2 mb-6 text-sm text-slate-500">
                Sign in to connect with the University Guidance Office.
            </p>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route("login"), {
                        onFinish: () => form.reset("password"),
                    });
                }}
                className="space-y-4"
            >
                <Field
                    label="University email"
                    form={form}
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                />
                <Field
                    label="Password"
                    form={form}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                />
                <Errors errors={form.errors} />
                <Button disabled={form.processing} className="w-full">
                    {form.processing ? "Signing in..." : "Sign in"}
                </Button>
            </form>
            <p className="mt-6 text-sm text-slate-600">
                New here?{" "}
                <Link
                    href={route("register")}
                    className="font-semibold text-sky-700 hover:text-sky-900 underline transition"
                >
                    Create a student account
                </Link>
            </p>
            <p className="mt-8 border-t border-sky-100 pt-4 text-xs leading-5 text-slate-400">
                Using a shared terminal? Sign out when you finish. For account
                recovery, contact the guidance office.
            </p>
        </PortalGuest>
    );
}
