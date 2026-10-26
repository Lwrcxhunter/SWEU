import { Link, usePage } from "@inertiajs/react";
import Office, { Card } from "@/Components/Office";
import { CalendarPlus } from "lucide-react";
import FollowUpBanner from "./FollowUpBanner";

export default function Dashboard({ student, summary, followUps = [] }) {
    const { auth } = usePage().props;
    const firstName = auth.user.full_name.trim().split(/\s+/)[0];
    const hasIntake = Boolean(student?.intake_record?.signed_agreement);

    return (
        <Office
            title={`Welcome back, ${firstName}.`}
            eyebrow="Student Appointments"
            description="Book a counseling session and respond to your follow-up schedules."
        >
            <FollowUpBanner appointments={followUps} />
            <Card
                className="mb-6"
                title="Make an Appointment"
                description="Request a confidential counseling session on your preferred date and morning or afternoon window."
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                        F2F or Virtual counseling
                    </span>
                    {auth.permissions.includes("appointments.book") && (
                        <Link
                            href={
                                hasIntake
                                    ? route("appointments.request")
                                    : route("appointments.index")
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                            <CalendarPlus className="h-5 w-5" /> Make an
                            Appointment
                        </Link>
                    )}
                </div>
                {!hasIntake && (
                    <p className="mt-4 text-sm text-slate-600">
                        Complete your personal information before booking your
                        first session.
                    </p>
                )}
            </Card>
            <Card title="Your Appointments">
                <dl className="flex flex-wrap gap-8 text-sm">
                    <div>
                        <dt className="text-slate-500">
                            Awaiting confirmation
                        </dt>
                        <dd className="mt-1 text-2xl font-semibold">
                            {summary.pending_appointments}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-slate-500">Confirmed sessions</dt>
                        <dd className="mt-1 text-2xl font-semibold">
                            {summary.scheduled_appointments}
                        </dd>
                    </div>
                </dl>
                <Link
                    href={route("appointments.index")}
                    className="mt-5 inline-block text-sm font-semibold text-sky-700 underline"
                >
                    View My Appointments
                </Link>
            </Card>
        </Office>
    );
}
