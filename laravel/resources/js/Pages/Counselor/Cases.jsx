import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import Office, { Badge, Card, Empty, Pagination } from "@/Components/Office";

export default function Cases({ cases }) {
    return (
        <Office
            title="Counseling cases"
            eyebrow="Counselor workspace"
            description="Keep each concern and its session history together in one private case file."
        >
            <Card title="My cases">
                {cases.data.length === 0 ? (
                    <Empty>
                        No counseling cases have been assigned to you.
                    </Empty>
                ) : (
                    <div className="divide-y divide-sky-100">
                        {cases.data.map((record) => (
                            <div
                                key={record.id}
                                className="flex flex-wrap items-center justify-between gap-4 py-4"
                            >
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        {record.case_number}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {record.student_name}
                                        {record.student_id_number
                                            ? ` · ${record.student_id_number}`
                                            : ""}
                                    </p>
                                    <p className="mt-1 text-xs capitalize text-slate-500">
                                        {record.category.replaceAll("_", " ")} ·{" "}
                                        {record.session_count} session
                                        {record.session_count === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge value={record.status} />
                                    <Link
                                        href={route(
                                            "counselor.cases.show",
                                            record.id,
                                        )}
                                        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                                    >
                                        View case
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="h-4 w-4"
                                        />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Pagination data={cases} />
            </Card>
        </Office>
    );
}
