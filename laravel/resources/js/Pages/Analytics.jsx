import { router } from "@inertiajs/react";
import { CalendarDays, Leaf } from "lucide-react";
import { useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    LabelList,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Office from "@/Components/Office";

const chartColors = ["#2f5d50", "#7a9a6f", "#d98f5c", "#5fa38f", "#b9a7c9"];
const pretty = (value) => value.replaceAll("_", " ");

function TooltipCard({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg bg-white px-3 py-2 text-xs text-[#1f3d35] shadow-lg ring-1 ring-black/5">
            <p className="font-semibold">{label}</p>
            {payload.map((item) => (
                <p key={item.dataKey} className="mt-1 text-[#6b7b74]">
                    {item.name || item.dataKey}: <strong className="text-[#2f5d50]">{item.value}</strong>
                </p>
            ))}
        </div>
    );
}

function Card({ title, children, className = "" }) {
    return (
        <section className={`rounded-2xl bg-cream p-5 shadow-[0_8px_28px_rgba(47,93,80,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-md ${className}`}>
            <h2 className="text-sm font-semibold text-sage-900">{title}</h2>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function ChangeBadge({ value }) {
    return <span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">↑ {Math.abs(value)}%</span>;
}

function DateRangePicker({ filters }) {
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState(filters);
    const apply = () => {
        setOpen(false);
        router.get("/analytics", range, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-cream px-4 py-2.5 text-xs font-semibold text-sage-900 shadow-sm ring-1 ring-sage-100 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sage-700/30">
                <CalendarDays className="h-4 w-4 text-sage-700" />
                {filters.from} — {filters.to}
            </button>
            {open && (
                <div className="absolute right-0 z-10 mt-2 grid w-64 gap-3 rounded-xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                    <label className="text-xs font-medium text-sage-900">
                        From
                        <input type="date" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} className="control mt-1 text-xs" />
                    </label>
                    <label className="text-xs font-medium text-sage-900">
                        To
                        <input type="date" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} className="control mt-1 text-xs" />
                    </label>
                    <button type="button" onClick={apply} className="rounded-lg bg-sage-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sage-700">Apply range</button>
                </div>
            )}
        </div>
    );
}

function TotalSessions({ total, followUps, change, trend }) {
    return (
        <Card title="Total Sessions">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-4xl font-semibold tracking-tight text-sage-900">{total}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">{followUps} follow-up</span><ChangeBadge value={change} /><span className="text-xs text-[#718078]">vs. last month</span></div>
                </div>
                <div className="h-20 w-32">
                    <ResponsiveContainer>
                        <AreaChart data={trend}>
                            <defs><linearGradient id="sessionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5fa38f" stopOpacity=".45" /><stop offset="100%" stopColor="#5fa38f" stopOpacity="0" /></linearGradient></defs>
                            <Area type="monotone" dataKey="v" stroke="#2f5d50" strokeWidth={2} fill="url(#sessionFill)" animationDuration={1100} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
}

function Concerns({ data, total }) {
    return (
        <Card title="Most Common Concerns">
            <div className="flex items-center gap-4">
                <div className="relative h-40 w-40 shrink-0">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2} cornerRadius={4} animationDuration={1100}>
                                {data.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
                            </Pie>
                            <Tooltip content={<TooltipCard />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-xl text-sage-900">{total}</strong><span className="text-[10px] text-[#718078]">Total</span></div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    {data.map((item, index) => <div key={item.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 text-[#53665e]"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /> <span className="truncate">{item.name}</span></span><strong className="text-sage-900">{item.value}%</strong></div>)}
                </div>
            </div>
        </Card>
    );
}

function Referrals({ referrals }) {
    return (
        <Card title="Student Referrals">
            <div className="flex items-start justify-between">
                <div><p className="text-4xl font-semibold tracking-tight text-sage-900">{referrals.total}</p><div className="mt-2 flex items-center gap-2"><ChangeBadge value={referrals.change} /><span className="text-xs text-[#718078]">this period</span></div></div>
                <div className="h-24 w-36"><ResponsiveContainer><BarChart data={referrals.series}><XAxis dataKey="m" hide /><YAxis hide /><Tooltip content={<TooltipCard />} /><Bar dataKey="v" fill="#7a9a9a" radius={[5, 5, 0, 0]} animationDuration={1100} /></BarChart></ResponsiveContainer></div>
            </div>
        </Card>
    );
}

function ServiceTypes({ data }) {
    return (
        <Card title="Sessions by Service Type">
            <div className="h-48">
                <ResponsiveContainer>
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 4, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" width={122} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#53665e" }} tickFormatter={pretty} />
                        <Tooltip content={<TooltipCard />} />
                        <Bar dataKey="value" fill="#5fa38f" barSize={12} radius={4} background={{ fill: "#edf0eb", radius: 4 }} animationDuration={1100}>
                            <LabelList dataKey="value" position="right" formatter={(value) => `${value}%`} style={{ fill: "#1f3d35", fontSize: 10, fontWeight: 600 }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function MonthlyTrend({ data }) {
    return (
        <Card title="Monthly Trend" className="xl:col-span-2">
            <div className="h-64">
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#dcebe3" strokeDasharray="4 5" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#718078" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#718078" }} />
                        <Tooltip content={<TooltipCard />} />
                        <Line type="monotone" dataKey="appointments" name="Appointments" stroke="#7a9a6f" strokeWidth={2} dot={{ r: 3 }} animationDuration={1100} />
                        <Line type="monotone" dataKey="completed" name="Completed Sessions" stroke="#2f5d50" strokeWidth={2} dot={{ r: 3 }} animationDuration={1100} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-5 text-xs text-[#53665e]"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#7a9a6f]" />Appointments</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2f5d50]" />Completed Sessions</span></div>
        </Card>
    );
}

export default function Analytics({ total, followUps = 1, totalChange, sessionsTrend, concerns, referrals, serviceTypes, monthly, topConcerns, filters }) {
    return (
        <Office title="Analytics" eyebrow="Counselor workspace" description="View insights and trends from your counseling activities." action={<DateRangePicker filters={filters} />}>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <TotalSessions total={total} followUps={followUps} change={totalChange} trend={sessionsTrend} />
                <Concerns data={concerns} total={total} />
                <Referrals referrals={referrals} />
                <ServiceTypes data={serviceTypes} />
                <MonthlyTrend data={monthly} />
                <Card title="Top 5 Student Concerns (This Month)">
                    <div className="space-y-4">{topConcerns.map((item, index) => <div key={item.name} className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-sage-100 text-xs font-semibold text-sage-900">{index + 1}</span><span className="flex-1 text-[#53665e]">{item.name}</span><strong className="text-sage-900">{item.count}</strong></div>)}</div>
                </Card>
                <section className="relative overflow-hidden rounded-2xl bg-[#f1eadc] p-6 text-sage-900 md:col-span-2 xl:col-span-2">
                    <Leaf className="absolute -bottom-4 -right-2 h-32 w-32 rotate-[-18deg] text-[#d8c6a9]/70" strokeWidth={1} />
                    <p className="relative max-w-md font-serif text-2xl leading-relaxed">“Progress isn’t always visible, but it’s always happening.”</p>
                    <span className="relative mt-4 block text-xs text-[#718078]">A gentle reminder for every conversation.</span>
                </section>
            </div>
        </Office>
    );
}
