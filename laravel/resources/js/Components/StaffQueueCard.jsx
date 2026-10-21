import { useForm } from "@inertiajs/react";
import { Button, Errors, Field, StatusBadge } from "@/Components/Office";
import { parseDateBadge, formatSessionTime } from "@/Support/guidanceConstants";
import {
    Calendar,
    Clock,
    Phone,
    Download,
    CalendarClock,
    Users,
    AlertCircle,
    UserCheck,
    MapPin,
} from "lucide-react";

export default function StaffQueueCard({ item, counselors = [] }) {
    const form = useForm({
        counselor_id: "",
        onboarding_note: "",
        scheduled_date: "",
        scheduled_time: "",
    });

    const perform = (action) => {
        form.transform((data) => ({ ...data, action, version: item.version }));
        form.patch(route("appointments.update", item.id), {
            preserveScroll: true,
        });
    };

    const closed = ["completed", "cancelled"].includes(item.status);
    const isWalkIn = item.type === "walk_in";
    const dateInfo = parseDateBadge(item.scheduled_date);
    const formattedTime = formatSessionTime(item.scheduled_time);

    const collegeCode = item.student?.college
        ? typeof item.student.college === "string"
            ? item.student.college
            : item.student.college.code
        : null;

    return (
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-xs transition-all hover:border-sky-200 hover:shadow-md">
            <Errors errors={form.errors} />

            {/* Top Bar: Queue/Date Badge + Student Triage Info + Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-sky-100/70">
                <div className="flex items-center gap-4">
                    {/* Left Badge: Walk-in Queue badge OR Calendar Badge */}
                    {isWalkIn ? (
                        <div className="w-14 rounded-xl border border-amber-200/80 bg-amber-50/60 shadow-xs text-center overflow-hidden shrink-0">
                            <div className="bg-amber-600 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                Walk-In
                            </div>
                            <div className="py-1 flex flex-col items-center justify-center">
                                <Users className="w-5 h-5 text-amber-700" />
                                <span className="block text-[8px] font-bold text-amber-800 tracking-wider uppercase mt-0.5">
                                    Queue
                                </span>
                            </div>
                        </div>
                    ) : dateInfo ? (
                        <div className="w-14 rounded-xl border border-sky-200/80 bg-white shadow-xs text-center overflow-hidden shrink-0">
                            <div className="bg-sky-600 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                {dateInfo.month}
                            </div>
                            <div className="py-0.5">
                                <span className="block text-xl font-black text-slate-900 leading-tight">
                                    {dateInfo.day}
                                </span>
                                <span className="block text-[9px] font-bold text-sky-700 tracking-wider">
                                    {dateInfo.weekday}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-xl border border-dashed border-sky-200 bg-sky-50/60 flex flex-col items-center justify-center text-center shrink-0">
                            <CalendarClock className="w-5 h-5 text-sky-500 mb-0.5" />
                            <span className="text-[9px] font-bold text-sky-700 uppercase tracking-tight">
                                Pending
                            </span>
                        </div>
                    )}

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                <span>
                                    {item.student?.full_name ||
                                        "Unknown Student"}
                                </span>
                                {item.student?.school_id_number && (
                                    <span className="text-xs font-normal text-slate-400">
                                        ({item.student.school_id_number})
                                    </span>
                                )}
                            </h3>
                            {item.urgency_level === "urgent" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                    Urgent Case
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                <Phone className="w-3.5 h-3.5 text-sky-600" />
                                <span>
                                    Contact:{" "}
                                    {item.student?.phone_number ||
                                        "None listed"}
                                </span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                <Clock className="w-3.5 h-3.5 text-sky-600" />
                                <span>
                                    {formattedTime
                                        ? `${formattedTime} PST`
                                        : isWalkIn
                                          ? "Walk-in Queue"
                                          : "Date to be scheduled"}
                                </span>
                            </span>
                            {collegeCode && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-medium text-slate-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md text-[11px]">
                                        College: {collegeCode}
                                    </span>
                                </>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                <span>Face-to-Face</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="self-start sm:self-center">
                    <StatusBadge status={item.status} />
                </div>
            </div>

            {/* Middle Section: Assigned Counselor Status OR Dispatch Notice */}
            <div className="py-3">
                {item.counselor_name ? (
                    <div className="flex items-center gap-2 rounded-xl bg-sky-50/60 border border-sky-100 px-3.5 py-2 text-xs text-sky-900">
                        <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                            <strong>Assigned Counselor:</strong>{" "}
                            {item.counselor_name}
                        </span>
                        {item.onboarding_note && (
                            <span className="text-slate-500 ml-2 italic">
                                ({item.onboarding_note})
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50/60 border border-amber-200/70 px-3.5 py-2 text-xs text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            <strong>Pending Assignment:</strong> Select an
                            available counselor below to dispatch.
                        </span>
                    </div>
                )}
            </div>

            {/* Embedded Counselor Assignment Form */}
            {!closed && item.status !== "accepted" && (
                <form
                    className="my-2 p-3.5 bg-sky-50/40 rounded-xl border border-sky-100 flex flex-wrap items-end gap-3 text-xs"
                    onSubmit={(e) => {
                        e.preventDefault();
                        perform("assign");
                    }}
                >
                    <Field
                        label="Assign counselor"
                        type="select"
                        form={form}
                        name="counselor_id"
                        required
                    >
                        <option value="">Choose an available counselor</option>
                        {counselors
                            .filter(
                                (c) =>
                                    c.available &&
                                    (item.urgency_level === "urgent"
                                        ? c.on_duty
                                        : true),
                            )
                            .map((c) => {
                                const isCollegeDesignate =
                                    item.student?.college?.code &&
                                    c.college_codes?.includes(
                                        item.student.college.code,
                                    );
                                const designationLabel =
                                    c.designation ||
                                    (c.college_codes?.length
                                        ? `${c.college_codes.join(", ")} Designate`
                                        : "Counselor");
                                return (
                                    <option key={c.id} value={c.id}>
                                        {c.full_name} — {designationLabel}
                                        {isCollegeDesignate
                                            ? " [Student's College Designate]"
                                            : ""}
                                        {c.on_duty ? " · On duty" : ""}
                                    </option>
                                );
                            })}
                    </Field>
                    <Field
                        label="Onboarding note (optional)"
                        form={form}
                        name="onboarding_note"
                        placeholder="e.g. Room 202, arrive 5 mins early"
                    />
                    <Button secondary disabled={form.processing}>
                        Assign
                    </Button>
                </form>
            )}

            {/* Bottom Action Bar */}
            <div className="border-t border-sky-100/80 pt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Urgent Flag Action for Walk-ins */}
                    {!closed && isWalkIn && item.urgency_level !== "urgent" && (
                        <Button
                            disabled={form.processing}
                            onClick={() => perform("urgent")}
                        >
                            Flag urgent & alert counselors
                        </Button>
                    )}

                    {/* PDF Export for Front Desk */}
                    <a
                        className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 inline-flex items-center gap-1.5 transition shadow-xs"
                        href={route("appointments.pdf", item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download className="w-4 h-4 text-sky-600" />
                        <span>Intake PDF</span>
                    </a>
                </div>

                {/* Cancel Action */}
                {!closed && (
                    <Button
                        secondary
                        disabled={form.processing}
                        onClick={() => {
                            if (window.confirm("Cancel this appointment?"))
                                perform("cancel");
                        }}
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}
