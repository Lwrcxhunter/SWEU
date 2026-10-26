import { router } from "@inertiajs/react";
import { useState } from "react";
import Office, { Button, Card, Empty } from "@/Components/Office";

const metricLabels = {
    activeCases: "Active cases",
    closedCases: "Closed cases",
    newCases: "Cases opened in period",
    upcomingAppointments: "Upcoming appointments in period",
    completedAppointments: "Completed appointments in period",
    cancelledAppointments: "Cancelled appointments in period",
    followUpSessions: "Follow-up sessions in period",
};

function Metric({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                {value}
            </p>
        </div>
    );
}

export default function Analytics({
    range,
    from,
    to,
    metrics,
    caseStatuses,
    trend,
}) {
    const [filters, setFilters] = useState({ range, from, to });
    const [processing, setProcessing] = useState(false);
    const [filterError, setFilterError] = useState("");
    const highest = Math.max(1, ...trend.map((item) => item.count));

    const submit = (event) => {
        event.preventDefault();
        if (
            filters.range === "custom" &&
            (!filters.from || !filters.to || filters.from > filters.to)
        ) {
            setFilterError("Choose a valid start and end date.");
            return;
        }
        setFilterError("");
        setProcessing(true);
        router.get(route("counselor.analytics"), filters, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Office
            title="Workload overview"
            eyebrow="Counselor analytics"
            description="Private, aggregate counts for your cases, appointments, and follow-up sessions. No intake details or clinical notes are included."
        >
            <Card title="Date range">
                <form
                    onSubmit={submit}
                    className="flex flex-wrap items-end gap-3"
                >
                    <label className="block min-w-40 text-xs font-semibold text-slate-700">
                        Period
                        <select
                            value={filters.range}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    range: event.target.value,
                                }))
                            }
                            className="control mt-2"
                        >
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="custom">Custom range</option>
                        </select>
                    </label>
                    {filters.range === "custom" && (
                        <>
                            <label className="block text-xs font-semibold text-slate-700">
                                From
                                <input
                                    type="date"
                                    required
                                    value={filters.from}
                                    onChange={(event) =>
                                        setFilters((current) => ({
                                            ...current,
                                            from: event.target.value,
                                        }))
                                    }
                                    className="control mt-2"
                                />
                            </label>
                            <label className="block text-xs font-semibold text-slate-700">
                                To
                                <input
                                    type="date"
                                    required
                                    value={filters.to}
                                    onChange={(event) =>
                                        setFilters((current) => ({
                                            ...current,
                                            to: event.target.value,
                                        }))
                                    }
                                    className="control mt-2"
                                />
                            </label>
                        </>
                    )}
                    <Button disabled={processing}>
                        {processing ? "Updating..." : "Apply filters"}
                    </Button>
                    {filterError && (
                        <p role="alert" className="text-sm text-rose-700">
                            {filterError}
                        </p>
                    )}
                    <p className="text-xs text-slate-500">
                        Showing {from} through {to}.
                    </p>
                </form>
            </Card>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(metricLabels).map(([key, label]) => (
                    <Metric key={key} label={label} value={metrics[key]} />
                ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <Card
                    title="Case status"
                    description="Current caseload, independent of the selected appointment date range."
                >
                    {Object.keys(caseStatuses).length === 0 ? (
                        <Empty>No case records are available yet.</Empty>
                    ) : (
                        <dl className="divide-y divide-slate-100">
                            {Object.entries(caseStatuses).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <dt className="capitalize text-slate-700">
                                            {status.replaceAll("_", " ")}
                                        </dt>
                                        <dd className="font-semibold tabular-nums text-slate-900">
                                            {count}
                                        </dd>
                                    </div>
                                ),
                            )}
                        </dl>
                    )}
                </Card>
                <Card
                    title="Appointment trend"
                    description="All appointments, including cancelled ones, grouped by date for short ranges, week for medium ranges, and month for longer ranges."
                >
                    {trend.length === 0 ? (
                        <Empty>No appointments fall within this period.</Empty>
                    ) : (
                        <div
                            className="space-y-3"
                            aria-label="Appointments by period"
                        >
                            {trend.map((item) => (
                                <div
                                    key={item.period}
                                    className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3"
                                >
                                    <span className="truncate text-xs text-slate-600">
                                        {item.period}
                                    </span>
                                    <div className="h-3 rounded-full bg-slate-100">
                                        <div
                                            className="h-3 rounded-full bg-sky-700"
                                            style={{
                                                width: `${Math.max(5, (item.count / highest) * 100)}%`,
                                            }}
                                            title={`${item.count} appointments`}
                                        />
                                    </div>
                                    <span className="text-right text-sm font-semibold tabular-nums text-slate-900">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Office>
    );
}
