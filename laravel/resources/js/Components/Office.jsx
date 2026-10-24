import { Head, Link, router } from "@inertiajs/react";
import { useId } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Brand } from "@/Components/Sidebar";

export { Brand };

export default function Office({
    title,
    eyebrow = "Guidance & counseling",
    description,
    children,
    action,
}) {
    return (
        <AuthenticatedLayout
            title={title}
            eyebrow={eyebrow}
            description={description}
            action={action}
        >
            {children}
        </AuthenticatedLayout>
    );
}

export function Card({ title, description, children, className = "" }) {
    return (
        <section
            className={`rounded-2xl border border-sky-100 bg-white p-5 md:p-6 shadow-sm shadow-sky-950/5 ${className}`}
        >
            {title && (
                <h2 className="text-base font-semibold text-slate-900">
                    {title}
                </h2>
            )}
            {description && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                    {description}
                </p>
            )}
            <div className={title ? "mt-4" : ""}>{children}</div>
        </section>
    );
}

export function Field({
    label,
    form,
    name,
    type = "text",
    children,
    hint,
    ...props
}) {
    const id = useId();
    const error = form.errors[name];
    const shared = {
        id,
        name,
        value: form.data[name] ?? "",
        onChange: (e) => form.setData(name, e.target.value),
        "aria-invalid": !!error,
        "aria-describedby": `${id}-help`,
        className: "control",
        ...props,
    };
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-xs font-semibold text-slate-700"
            >
                {label}
            </label>
            {type === "textarea" ? (
                <textarea rows="4" {...shared} />
            ) : type === "select" ? (
                <select {...shared}>{children}</select>
            ) : (
                <input type={type} {...shared} />
            )}
            <div id={`${id}-help`}>
                {error ? (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">
                        {error}
                    </p>
                ) : (
                    hint && (
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            {hint}
                        </p>
                    )
                )}
            </div>
        </div>
    );
}

export function Check({ label, form, name }) {
    const id = useId();
    return (
        <div>
            <label
                htmlFor={id}
                className="flex items-start gap-3 text-sm leading-6 cursor-pointer text-slate-700"
            >
                <input
                    id={id}
                    type="checkbox"
                    checked={!!form.data[name]}
                    onChange={(e) => form.setData(name, e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                />
                <span>{label}</span>
            </label>
            {form.errors[name] && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                    {form.errors[name]}
                </p>
            )}
        </div>
    );
}

export function Button({
    children,
    secondary,
    loading = false,
    processing = false,
    disabled = false,
    className = "",
    ...props
}) {
    const isBusy = loading || processing;
    return (
        <button
            disabled={disabled || isBusy}
            aria-busy={isBusy}
            className={`${
                secondary
                    ? "border border-sky-200 bg-white text-sky-800 hover:bg-sky-50 focus:ring-sky-300"
                    : "bg-sky-600 hover:bg-sky-700 text-white font-medium focus:ring-sky-400"
            } inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {isBusy && (
                <svg
                    className="h-4 w-4 animate-spin text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

export function Errors({ errors }) {
    return Object.keys(errors).length ? (
        <div
            role="alert"
            className="my-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 shadow-sm"
        >
            <ul className="list-disc pl-4 space-y-1">
                {[...new Set(Object.values(errors))].map((e, i) => (
                    <li key={i}>{e}</li>
                ))}
            </ul>
        </div>
    ) : null;
}

export function Empty({
    title = "Nothing here yet",
    children = "New records will appear here as soon as they become available.",
    icon,
    action,
    className = "",
}) {
    return (
        <div
            className={`rounded-2xl border border-dashed border-sky-200 bg-white/70 px-6 py-10 text-center shadow-sm ${className}`}
        >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100 text-xl text-sky-600">
                {icon || "📋"}
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                {children}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function StatusBadge({ status, className = "" }) {
    switch (status) {
        case "pending_assignment":
        case "pending":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                        aria-hidden="true"
                    />
                    Awaiting Staff Assignment
                </span>
            );
        case "assigned_pending_accept":
        case "assigned":
        case "assigned_pending_counselor":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 border border-sky-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-sky-600"
                        aria-hidden="true"
                    />
                    Counselor Review Required
                </span>
            );
        case "counselor_accepted_pending_student":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                        aria-hidden="true"
                    />
                    Awaiting Student Confirmation
                </span>
            );
        case "reassignment_requested":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-600"
                        aria-hidden="true"
                    />
                    Reassignment Requested
                </span>
            );
        case "accepted":
        case "confirmed":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-emerald-600"
                        aria-hidden="true"
                    />
                    Confirmed Schedule
                </span>
            );
        case "rescheduled":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                        aria-hidden="true"
                    />
                    Rescheduled – Pending Confirmation
                </span>
            );
        case "cancelled":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-rose-600"
                        aria-hidden="true"
                    />
                    Cancelled
                </span>
            );
        case "completed":
            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 border border-sky-200 ${className}`}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-sky-600"
                        aria-hidden="true"
                    />
                    Completed
                </span>
            );
        default:
            return (
                <span
                    className={`inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 ${className}`}
                >
                    {status?.replaceAll("_", " ")}
                </span>
            );
    }
}

export function Badge({ value, className = "" }) {
    let style = "bg-sky-50 text-sky-800 border-sky-200";
    if (value === "urgent") {
        style = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (["completed", "closed", "accepted"].includes(value)) {
        style = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (["pending", "action_needed"].includes(value)) {
        style = "bg-amber-50 text-amber-700 border-amber-200";
    }

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${style} ${className}`}
        >
            {value?.replaceAll("_", " ")}
        </span>
    );
}

export function Pagination({ data }) {
    return (
        data?.last_page > 1 && (
            <nav
                aria-label="Pagination"
                className="mt-6 flex justify-between items-center text-sm"
            >
                <Button
                    secondary
                    disabled={!data.prev_page_url}
                    onClick={() => router.get(data.prev_page_url)}
                >
                    &larr; Previous
                </Button>
                <span className="text-xs text-slate-500 font-medium">
                    Page {data.current_page} of {data.last_page}
                </span>
                <Button
                    secondary
                    disabled={!data.next_page_url}
                    onClick={() => router.get(data.next_page_url)}
                >
                    Next &rarr;
                </Button>
            </nav>
        )
    );
}

export function AppointmentSummary({ item }) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {item.student?.full_name || "Unknown Student"}
                    </h3>
                    {item.student?.school_id_number && (
                        <span className="text-xs text-slate-400">
                            ({item.student.school_id_number})
                        </span>
                    )}
                    {item.urgency_level === "urgent" && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                            Urgent
                        </span>
                    )}
                </div>
                <StatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                    <span>📅</span>
                    <span>{item.scheduled_date || "Date to be scheduled"}</span>
                    {item.scheduled_time && (
                        <span>at {item.scheduled_time} (PST)</span>
                    )}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                    <span>👥</span>
                    <span>Face-to-Face (Guidance Office)</span>
                </span>
                {item.student?.college && (
                    <>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-medium text-slate-700">
                            College:{" "}
                            {typeof item.student.college === "string"
                                ? item.student.college
                                : item.student.college.code}
                        </span>
                    </>
                )}
            </div>
            <p className="text-[11px] text-slate-500">
                <strong className="text-slate-700">Assigned Counselor:</strong>{" "}
                {item.counselor_name || (
                    <span className="italic text-amber-700">
                        Awaiting counselor assignment
                    </span>
                )}
                {" &bull; "}
                <span className="capitalize">
                    {item.type ? item.type.replaceAll("_", " ") : "Request"}
                </span>
            </p>
        </div>
    );
}
