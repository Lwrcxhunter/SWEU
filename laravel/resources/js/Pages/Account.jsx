import { Link, useForm, usePage } from "@inertiajs/react";
import Office, {
    Card,
    Field,
    Check,
    Button,
    Errors,
} from "@/Components/Office";
export default function Account() {
    const { auth } = usePage().props;
    const profile = useForm({ full_name: auth.user.full_name });
    const preferences = useForm({
        notification_refresh:
            auth.user.preferences?.notification_refresh ?? true,
    });
    const form = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    return (
        <Office
            title="Settings & preferences"
            description="Manage your account and how your workspace stays up to date."
        >
            <div className="max-w-2xl space-y-6">
                <div id="profile">
                    <Card title="Your profile">
                        <form
                            className="space-y-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                profile.patch(route("account.profile"));
                            }}
                        >
                            <Field
                                form={profile}
                                name="full_name"
                                label="Full name"
                                required
                                maxLength={150}
                                autoComplete="name"
                            />
                            <p className="break-all text-sm text-slate-500">
                                {auth.user.email}
                            </p>
                            <Errors errors={profile.errors} />
                            <Button disabled={profile.processing}>
                                Save profile
                            </Button>
                            {auth.user.role === "student" &&
                                auth.permissions.includes("intake.manage") && (
                                    <Link
                                        className="ml-4 inline-block text-sm font-medium text-sky-700 hover:text-sky-900 underline transition"
                                        href={route("intake.edit")}
                                    >
                                        Edit personal & medical information
                                    </Link>
                                )}
                        </form>
                    </Card>
                </div>
                <Card
                    title="Notification preferences"
                    description="Unread notifications are always available from the bell. Turn on automatic refresh to update the count every 15 seconds while you work."
                >
                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            preferences.patch(route("account.preferences"));
                        }}
                    >
                        <Check
                            form={preferences}
                            name="notification_refresh"
                            label="Automatically refresh my notifications"
                        />
                        <Errors errors={preferences.errors} />
                        <Button disabled={preferences.processing}>
                            Save preferences
                        </Button>
                    </form>
                </Card>
                <Card title="Change password">
                    <form
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put(route("password.update"), {
                                onSuccess: () => form.reset(),
                            });
                        }}
                    >
                        <Field
                            form={form}
                            name="current_password"
                            label="Current password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                        <Field
                            form={form}
                            name="password"
                            label="New password"
                            type="password"
                            autoComplete="new-password"
                            required
                            hint="12+ characters, uppercase, lowercase and a number."
                        />
                        <Field
                            form={form}
                            name="password_confirmation"
                            label="Confirm new password"
                            type="password"
                            autoComplete="new-password"
                            required
                        />
                        <Errors errors={form.errors} />
                        {form.recentlySuccessful && (
                            <p
                                role="status"
                                className="text-sm font-medium text-emerald-700"
                            >
                                Password updated.
                            </p>
                        )}
                        <Button disabled={form.processing}>
                            Update password
                        </Button>
                    </form>
                </Card>
            </div>
        </Office>
    );
}
