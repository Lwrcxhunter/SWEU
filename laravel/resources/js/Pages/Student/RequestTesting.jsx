import { useForm } from "@inertiajs/react";
import Office, {
    Card,
    Field,
    Button,
    Errors,
    Empty,
    Badge,
    Pagination,
} from "@/Components/Office";
function TestingRow({ record, isStaff }) {
    const form = useForm({});
    const next = { pending: "approved", approved: "completed" }[record.status];
    return (
        <article className="py-5 border-b border-slate-100">
            <div className="flex flex-wrap justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">
                        {record.test_type}
                        {isStaff ? ` | ${record.student.full_name}` : ""}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        {record.details}
                    </p>
                </div>
                <Badge value={record.status} />
            </div>
            <Errors errors={form.errors} />
            {isStaff && next && (
                <Button
                    secondary
                    className="mt-3"
                    disabled={form.processing}
                    onClick={() => {
                        form.transform(() => ({
                            status: next,
                            previous_status: record.status,
                        }));
                        form.patch(route("testing.update", record.id));
                    }}
                >
                    Mark {next}
                </Button>
            )}
        </article>
    );
}
export default function RequestTesting({ requests, isStaff }) {
    const form = useForm({ test_type: "GAMA", details: "" });
    return (
        <Office
            title="Understand your next steps."
            eyebrow="Psychological testing"
            description={
                isStaff
                    ? "Review and process student testing requests."
                    : "Request a testing form from the guidance office. A psychometrician will review your request."
            }
        >
            <div
                className={`grid gap-6 ${!isStaff ? "xl:grid-cols-[1fr_360px]" : ""}`}
            >
                <Card title={isStaff ? "Testing queue" : "Your requests"}>
                    {requests.data.length ? (
                        requests.data.map((r) => (
                            <TestingRow
                                key={r.id}
                                record={r}
                                isStaff={isStaff}
                            />
                        ))
                    ) : (
                        <Empty>No testing requests yet.</Empty>
                    )}
                    <Pagination data={requests} />
                </Card>
                {!isStaff && (
                    <Card title="Request a testing form">
                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(route("testing.store"), {
                                    onSuccess: () => form.reset(),
                                });
                            }}
                        >
                            <Field
                                form={form}
                                name="test_type"
                                label="Test type"
                                type="select"
                            >
                                <option>GAMA</option>
                                <option>Other</option>
                            </Field>
                            <Field
                                form={form}
                                name="details"
                                label={
                                    form.data.test_type === "Other"
                                        ? "Specify the test"
                                        : "Additional details (optional)"
                                }
                                type="textarea"
                                required={form.data.test_type === "Other"}
                            />
                            <Errors errors={form.errors} />
                            <Button disabled={form.processing}>
                                Submit request
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </Office>
    );
}
