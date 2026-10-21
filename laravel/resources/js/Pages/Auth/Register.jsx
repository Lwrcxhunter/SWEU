import { Head, Link, useForm } from "@inertiajs/react";
import PortalGuest from "@/Layouts/PortalGuest";
import { Field, Button, Errors } from "@/Components/Office";
export default function Register() {
    const form = useForm({
        full_name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });
    return (
        <PortalGuest>
            <Head title="Create an account" />
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                Start with a small step
            </p>
            <h2 className="mt-3 mb-2 text-3xl font-bold tracking-tight text-slate-900">
                Your support starts here.
            </h2>
            <p className="mb-6 text-sm text-slate-500">
                Create your student account to request university support.
            </p>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route("register"), {
                        onFinish: () =>
                            form.reset("password", "password_confirmation"),
                    });
                }}
                className="space-y-4"
            >
                <Field
                    label="Full name"
                    form={form}
                    name="full_name"
                    required
                    autoComplete="name"
                />
                <Field
                    label="University email"
                    form={form}
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                />
                <Field
                    label="Password"
                    form={form}
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    hint="At least 12 characters, with uppercase, lowercase and a number."
                />
                <Field
                    label="Confirm password"
                    form={form}
                    name="password_confirmation"
                    type="password"
                    required
                    autoComplete="new-password"
                />
                <Errors errors={form.errors} />
                <Button disabled={form.processing} className="w-full">
                    Create student account
                </Button>
            </form>
            <p className="mt-6 text-sm text-slate-600">
                Already registered?{" "}
                <Link
                    href={route("login")}
                    className="font-semibold text-sky-700 hover:text-sky-900 underline transition"
                >
                    Sign in
                </Link>
            </p>
        </PortalGuest>
    );
}
