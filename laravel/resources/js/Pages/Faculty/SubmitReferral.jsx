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
function ReferralRow({ record, isStaff }) {
    const form = useForm({ status: "", previous_status: record.status });
    const next = {
        submitted: "under_review",
        under_review: "action_taken",
        action_taken: "closed",
    }[record.status];
    return (
        <article className="py-5 border-b border-slate-100">
            <div className="flex flex-wrap justify-between gap-3">
                <div>
                    <p className="font-semibold text-sm">
                        {record.student?.full_name ||
                            `Referral ${record.id.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Submitted{" "}
                        {new Date(record.submitted_at).toLocaleDateString(
                            "en-PH",
                            { timeZone: "Asia/Manila" },
                        )}
                    </p>
                </div>
                <Badge value={record.status} />
            </div>
            {isStaff && (
                <p className="mt-4 text-sm leading-6 whitespace-pre-wrap">
                    {record.reason}
                </p>
            )}
            <Errors errors={form.errors} />
            {isStaff && next && (
                <Button
                    className="mt-4"
                    secondary
                    disabled={form.processing}
                    onClick={() => {
                        form.transform(() => ({
                            status: next,
                            previous_status: record.status,
                        }));
                        form.patch(route("referrals.update", record.id));
                    }}
                >
                    Mark {next.replaceAll("_", " ")}
                </Button>
            )}
        </article>
    );
}
export default function SubmitReferral({ referrals, isStaff }) {
    const form = useForm({ school_id_number: "", reason: "" });
    return (
        <Office
            title={
                isStaff
                    ? "Connect a student to support."
                    : "Help someone take the first step."
            }
            eyebrow="Referrals"
            description={
                isStaff
                    ? "Review incoming referrals and record the office’s response."
                    : "Refer yourself or a fellow student. You can track the response status; counseling records remain private."
            }
        >
            <div
                className={`grid gap-6 ${!isStaff ? "xl:grid-cols-[1fr_380px]" : ""}`}
            >
                <Card
                    title={
                        isStaff ? "Referral queue" : "Your submitted referrals"
                    }
                >
                    {referrals.data.length ? (
                        referrals.data.map((r) => (
                            <ReferralRow
                                key={r.id}
                                record={r}
                                isStaff={isStaff}
                            />
                        ))
                    ) : (
                        <Empty>No referrals yet.</Empty>
                    )}
                    <Pagination data={referrals} />
                </Card>
                {!isStaff && (
                    <Card title="Submit a referral">
                        <form
                            className="space-y-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(route("referrals.store"), {
                                    onSuccess: () => form.reset(),
                                });
                            }}
                        >
                            <Field
                                form={form}
                                name="school_id_number"
                                label="Student ID number"
                                required
                                hint="The student must have an intake profile. Contact the guidance office if you need help."
                            />
                            <Field
                                form={form}
                                name="reason"
                                label="Reason for referral"
                                type="textarea"
                                required
                            />
                            <Errors errors={form.errors} />
                            <Button disabled={form.processing}>
                                Submit referral
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </Office>
    );
}
