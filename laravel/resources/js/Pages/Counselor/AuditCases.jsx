import { Link } from "@inertiajs/react";
import Office, { Card, Empty, Pagination } from "@/Components/Office";

export default function AuditCases({ cases }) {
    return (
        <Office
            title="Clinical audit"
            eyebrow="Head guidance counselor"
            description="Opening a case's notes is recorded in the audit log."
        >
            <Card title="Cases">
                {cases.data.length === 0 ? (
                    <Empty>No cases are available.</Empty>
                ) : (
                    <div className="divide-y divide-sky-100">
                        {cases.data.map((record) => (
                            <div
                                key={record.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-4"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {record.case_number}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {record.category} · {record.status} ·{" "}
                                        {record.session_count} sessions
                                    </p>
                                </div>
                                <a
                                    href={route("cases.show", record.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                                >
                                    Audited case details
                                </a>
                            </div>
                        ))}
                    </div>
                )}
                <Pagination data={cases} />
            </Card>
        </Office>
    );
}
