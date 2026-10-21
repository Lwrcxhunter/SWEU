import { router, usePage } from "@inertiajs/react";
import Office, {
    Card,
    Button,
    Empty,
    Badge,
    Pagination,
} from "@/Components/Office";
export default function Alerts({ alerts }) {
    const { auth } = usePage().props;
    return (
        <Office
            title="Notifications"
            description={
                auth.user.preferences?.notification_refresh !== false
                    ? "Appointment, testing and office updates. This page refreshes every 15 seconds."
                    : "Appointment, testing and office updates. Automatic refresh is off in your preferences."
            }
        >
            <Card>
                {!alerts.data.length ? (
                    <Empty>You’re all caught up.</Empty>
                ) : (
                    alerts.data.map((a) => (
                        <div
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-slate-100"
                        >
                            <div>
                                <Badge value={a.kind} />
                                <p className="mt-2 text-sm">{a.message}</p>
                            </div>
                            {!a.read && (
                                <Button
                                    secondary
                                    onClick={() =>
                                        router.patch(
                                            route("alerts.update", a.id),
                                        )
                                    }
                                >
                                    Mark read
                                </Button>
                            )}
                        </div>
                    ))
                )}
                <Pagination data={alerts} />
            </Card>
        </Office>
    );
}
