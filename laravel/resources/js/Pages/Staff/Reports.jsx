import { useForm } from "@inertiajs/react";
import Office, { Card, Field, Button, Errors } from "@/Components/Office";
export default function Reports({ rows, from, to }) {
    const form = useForm({ from, to });
    return (
        <Office
            title="The work behind the care."
            eyebrow="Office accomplishment reports"
            description="Aggregate service counts for the selected submission period. Exports contain no student identities or clinical notes."
        >
            <Card>
                <form
                    className="flex flex-wrap items-end gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.get(route("reports.index"));
                    }}
                >
                    <Field
                        form={form}
                        name="from"
                        label="From"
                        type="date"
                        required
                    />
                    <Field
                        form={form}
                        name="to"
                        label="Through"
                        type="date"
                        required
                    />
                    <Button disabled={form.processing}>Apply dates</Button>
                    <a
                        className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 transition shadow-xs"
                        href={route("reports.index", { from, to, download: 1 })}
                    >
                        Download CSV
                    </a>
                </form>
                <Errors errors={form.errors} />
                <div className="overflow-x-auto mt-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                                <th className="py-3 font-medium">Service</th>
                                <th className="font-medium">Status</th>
                                <th className="font-medium text-right">
                                    Count
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.service + r.status}
                                    className="border-b border-slate-100"
                                >
                                    <td className="py-4">
                                        {r.service.replace(
                                            /([a-z])([A-Z])/g,
                                            "$1 $2",
                                        )}
                                    </td>
                                    <td className="capitalize text-slate-500">
                                        {r.status.replaceAll("_", " ")}
                                    </td>
                                    <td className="text-right font-semibold">
                                        {r.count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </Office>
    );
}
