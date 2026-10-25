import { useForm } from "@inertiajs/react";
import { Button, Errors } from "@/Components/Office";

export default function StaffTestingRow({ record }) {
    const form = useForm({});
    const next = { pending: "approved", approved: "completed" }[record.status];
    const college =
        typeof record.college === "string"
            ? record.college
            : record.college?.code;
    return (
        <article className="border-b border-slate-200 py-5 first:pt-0 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-slate-900">
                        {record.test_type || "Testing"} request
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                        {record.requester_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {record.requester_position}
                    </p>
                </div>
                <span
                    className={
                        "rounded-md border px-2 py-1 text-xs font-semibold " +
                        (record.status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800")
                    }
                >
                    {{
                        pending: "Needs review",
                        approved: "Approved",
                        completed: "Completed",
                    }[record.status] || record.status}
                </span>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                    <dt className="text-xs text-slate-500">
                        Preferred testing schedule
                    </dt>
                    <dd className="mt-1 font-medium text-slate-800">
                        {record.preferred_date || "Not provided"}{" "}
                        {record.preferred_date && record.preferred_session}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-500">
                        College / program
                    </dt>
                    <dd className="mt-1 text-slate-800">
                        {[college, record.program]
                            .filter(Boolean)
                            .join(" / ") || "Not provided"}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-500">Students</dt>
                    <dd className="mt-1 text-slate-800">
                        {record.student_count} student(s)
                        {record.year_level ? " / " + record.year_level : ""}
                    </dd>
                </div>
            </dl>
            <details className="mt-4 rounded-lg bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-sky-800">
                    View request details
                </summary>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>
                        <strong>Purpose: </strong>
                        {record.purpose || "Not provided"}
                    </p>
                    {record.details && (
                        <p className="whitespace-pre-wrap">
                            <strong>Additional details: </strong>
                            {record.details}
                        </p>
                    )}
                    <p>
                        <strong>Submitted: </strong>
                        {record.requested_at || "Not recorded"}
                    </p>
                </div>
            </details>
            <Errors errors={form.errors} />
            {next && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                        secondary
                        disabled={form.processing}
                        onClick={() => {
                            form.transform(() => ({
                                status: next,
                                previous_status: record.status,
                            }));
                            form.patch(route("testing.update", record.id), {
                                preserveScroll: true,
                            });
                        }}
                    >
                        {next === "approved"
                            ? "Approve request"
                            : "Mark testing completed"}
                    </Button>
                    <p className="text-xs text-slate-500">
                        {next === "approved"
                            ? "Review the requested schedule before approving."
                            : "Use after testing has been carried out."}
                    </p>
                </div>
            )}
        </article>
    );
}
