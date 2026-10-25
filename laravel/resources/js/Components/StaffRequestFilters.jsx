import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Button } from "@/Components/Office";

export default function StaffRequestFilters({
    routeName,
    filters = {},
    counts = {},
    stages,
    searchable = false,
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [busy, setBusy] = useState(false);
    useEffect(() => setSearch(filters.search || ""), [filters.search]);
    const navigate = (changes) => {
        setBusy(true);
        router.get(
            route(routeName),
            { ...filters, ...changes },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setBusy(false),
            },
        );
    };
    return (
        <div className="staff-filters mb-5 rounded-xl border border-slate-200 bg-white p-3">
            <div
                className="flex flex-wrap gap-1"
                aria-label="Filter requests by status"
            >
                {[["all", "All requests"], ...stages].map(([status, label]) => (
                    <button
                        type="button"
                        key={status}
                        disabled={busy}
                        aria-pressed={filters.status === status}
                        onClick={() => navigate({ status })}
                        className={
                            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
                            (filters.status === status
                                ? "bg-sky-800 text-white"
                                : "text-slate-600 hover:bg-slate-100")
                        }
                    >
                        {label}
                        <span className="text-xs tabular-nums">
                            {status === "all"
                                ? Object.values(counts).reduce(
                                      (sum, count) => sum + count,
                                      0,
                                  )
                                : counts[status] || 0}
                        </span>
                    </button>
                ))}
            </div>
            {searchable && (
                <form
                    className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        navigate({ search });
                    }}
                >
                    <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">
                        Find a request
                        <input
                            type="search"
                            className="control mt-1"
                            value={search}
                            maxLength={100}
                            placeholder="Requester name, college or program"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                    <Button secondary disabled={busy}>
                        Search requests
                    </Button>
                    {filters.search && (
                        <button
                            type="button"
                            className="py-2 text-sm font-semibold text-sky-800 underline"
                            onClick={() => navigate({ search: "" })}
                        >
                            Clear search
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
