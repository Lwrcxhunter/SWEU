import { Link, useForm, usePage, router } from "@inertiajs/react";
import { useEffect } from "react";
import Office, {
    Card,
    Check,
    Button,
    Errors,
    Empty,
    Pagination,
} from "@/Components/Office";
import CounselorAppointmentCard from "@/Components/CounselorAppointmentCard";

export default function Dashboard({ appointments, followups }) {
    const { auth } = usePage().props;
    const availability = useForm({
        on_duty: auth.user.on_duty,
        available: auth.user.available,
    });
    useEffect(() => {
        const timer = setInterval(
            () => router.reload({ only: ["appointments", "followups"] }),
            15000,
        );
        return () => clearInterval(timer);
    }, []);
    return (
        <Office
            title="Care, one conversation at a time."
            eyebrow="Counselor workspace"
            description="Review your assigned requests and keep follow-ups in view."
        >
            <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
                <Card title="My appointments">
                    {!appointments.data.length ? (
                        <Empty>No assigned appointments yet.</Empty>
                    ) : (
                        <div className="space-y-4">
                            {appointments.data.map((a) => (
                                <CounselorAppointmentCard key={a.id} item={a} />
                            ))}
                        </div>
                    )}
                    <Pagination data={appointments} />
                </Card>
                <div className="space-y-6">
                    <Card title="My availability">
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                availability.patch(
                                    route("availability.update"),
                                );
                            }}
                        >
                            <Check
                                form={availability}
                                name="on_duty"
                                label="I am on duty"
                            />
                            <Check
                                form={availability}
                                name="available"
                                label="I am available for new assignments"
                            />
                            <Errors errors={availability.errors} />
                            <Button disabled={availability.processing}>
                                Update availability
                            </Button>
                        </form>
                    </Card>
                    <Card
                        title="Follow-up list"
                        description="Cases you flagged for continued support."
                    >
                        {followups.data.length ? (
                            followups.data.map((f) => (
                                <Link
                                    key={f.appointment_id}
                                    href={route("notes.show", f.appointment_id)}
                                    className="block border-b border-sky-100/70 py-4 hover:text-sky-700 transition"
                                >
                                    <p className="text-sm font-semibold text-slate-800">
                                        {f.student.full_name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Follow up: {f.next_followup_date}
                                    </p>
                                </Link>
                            ))
                        ) : (
                            <Empty>No follow-ups flagged.</Empty>
                        )}
                        <Pagination data={followups} />
                    </Card>
                </div>
            </div>
        </Office>
    );
}
