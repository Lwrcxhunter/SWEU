import { router } from "@inertiajs/react";
import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Office, { Button, Empty } from "@/Components/Office";

const colors = ["#315C52", "#6F9D91", "#E8C98A", "#CFAF9A", "#B6C7BB"];
const label = (value) => (value || "Other").replaceAll("_", " ");

function MetricCard({ title, value, note, children }) {
    return (
        <section className="rounded-xl border border-[#E3E5DF] bg-white p-4 shadow-[0_8px_24px_rgba(49,92,82,0.05)]">
            <p className="text-[11px] font-semibold text-[#263B36]">{title}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
                <strong className="text-2xl tabular-nums text-[#263B36]">
                    {value}
                </strong>
                {children}
            </div>
            <p className="mt-1 text-[10px] text-[#6D7974]">{note}</p>
        </section>
    );
}

function Panel({ title, children, className = "" }) {
    return (
        <section
            className={`rounded-xl border border-[#E3E5DF] bg-white p-4 shadow-[0_8px_24px_rgba(49,92,82,0.05)] ${className}`}
        >
            <h2 className="text-xs font-semibold capitalize text-[#263B36]">
                {title}
            </h2>
            <div className="mt-3">{children}</div>
        </section>
    );
}

export default function Analytics({
    range,
    from,
    to,
    metrics,
    trend,
    serviceBreakdown = {},
    concernBreakdown = {},
}) {
    const [filters, setFilters] = useState({ range, from, to });
    const [processing, setProcessing] = useState(false);
    const [filterError, setFilterError] = useState("");
    const serviceData = Object.entries(serviceBreakdown).map(
        ([name, value]) => ({ name: label(name), value }),
    );
    const concernData = Object.entries(concernBreakdown)
        .map(([name, value]) => ({ name: label(name), value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 5);
    const trendData = trend.map((item) => ({
        period: item.period.slice(5),
        appointments: item.count,
    }));
    const totalSessions =
        Number(metrics.completedAppointments || 0) +
        Number(metrics.followUpSessions || 0);

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
            title="Analytics"
            eyebrow="Counselor analytics"
            description="View insights and trends from your counseling activities."
        >
            <div className="mb-4 flex justify-end">
                <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
                    <label className="text-[10px] font-semibold text-[#6D7974]">
                        Reporting period
                        <select
                            value={filters.range}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    range: event.target.value,
                                }))
                            }
                            className="control mt-1 min-w-[130px] text-xs"
                        >
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="custom">Custom range</option>
                        </select>
                    </label>
                    {filters.range === "custom" && (
                        <>
                            <input
                                type="date"
                                value={filters.from}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        from: event.target.value,
                                    }))
                                }
                                className="control text-xs"
                            />
                            <input
                                type="date"
                                value={filters.to}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        to: event.target.value,
                                    }))
                                }
                                className="control text-xs"
                            />
                        </>
                    )}
                    <Button disabled={processing}>
                        {processing ? "Updating..." : "Apply"}
                    </Button>
                </form>
            </div>
            {filterError && (
                <p role="alert" className="mb-4 text-xs text-rose-700">
                    {filterError}
                </p>
            )}

            <div className="grid gap-3 md:grid-cols-3">
                <MetricCard
                    title="Total Sessions"
                    value={totalSessions}
                    note={`For ${from} through ${to}`}
                >
                    <span className="rounded-full bg-[#DDEBE5] px-2 py-1 text-[10px] text-[#315C52]">
                        {metrics.followUpSessions || 0} follow-up
                    </span>
                </MetricCard>
                <Panel title="Most common concern">
                    {concernData.length === 0 ? (
                        <Empty>No case records are available yet.</Empty>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-24 w-24">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={concernData}
                                            dataKey="value"
                                            innerRadius={27}
                                            outerRadius={42}
                                            paddingAngle={3}
                                        >
                                            {concernData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={colors[index % colors.length]}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1 text-[10px] text-[#6D7974]">
                                {concernData.slice(0, 4).map((item, index) => (
                                    <p key={item.name} className="capitalize">
                                        <span
                                            className="mr-1 inline-block h-2 w-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    colors[index % colors.length],
                                            }}
                                        />
                                        {item.name} {item.value}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </Panel>
                <MetricCard
                    title="Student Referrals"
                    value={metrics.newCases}
                    note="Cases opened in selected period"
                >
                    <span className="text-xs text-[#6F9D91]">New cases</span>
                </MetricCard>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Panel title="Sessions by service type">
                    {serviceData.length === 0 ? (
                        <Empty>No service data is available yet.</Empty>
                    ) : (
                        <div className="h-44">
                            <ResponsiveContainer>
                                <BarChart
                                    data={serviceData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        tick={{ fontSize: 10, fill: "#6D7974" }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="value"
                                        fill="#6F9D91"
                                        radius={[0, 4, 4, 0]}
                                        barSize={10}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>
                <Panel title="Monthly trend">
                    {trendData.length === 0 ? (
                        <Empty>No trend data is available yet.</Empty>
                    ) : (
                        <div className="h-44">
                            <ResponsiveContainer>
                                <BarChart data={trendData}>
                                    <CartesianGrid
                                        stroke="#E3E5DF"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 10, fill: "#6D7974" }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 10, fill: "#6D7974" }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="appointments"
                                        fill="#315C52"
                                        radius={[4, 4, 0, 0]}
                                        barSize={16}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Panel>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <Panel title="Top 5 student concerns">
                    {concernData.length === 0 ? (
                        <Empty>No concern data is available yet.</Empty>
                    ) : (
                        <ol className="space-y-2">
                            {concernData.map((item, index) => (
                                <li
                                    key={item.name}
                                    className="flex items-center justify-between border-b border-[#E3E5DF] pb-2 text-[11px]"
                                >
                                    <span className="flex gap-3 capitalize text-[#6D7974]">
                                        <strong className="text-[#315C52]">
                                            {index + 1}
                                        </strong>
                                        {item.name}
                                    </span>
                                    <strong className="text-[#315C52]">
                                        {item.value}
                                    </strong>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
                <section className="flex min-h-[150px] items-center rounded-xl bg-[#F0EDE4] p-5">
                    <div>
                        <p className="wellness-quote text-sm text-[#315C52]">
                            “Progress isn't always visible, but it's always
                            happening.”
                        </p>
                        <p className="mt-3 text-xs text-[#6D7974]">
                            Keep supporting each student with care.
                        </p>
                    </div>
                </section>
            </div>
        </Office>
    );
}
