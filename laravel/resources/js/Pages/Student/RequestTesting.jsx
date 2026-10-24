import { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import Office, {
    Card,
    Field,
    Button,
    Errors,
    Empty,
    StatusBadge,
    Pagination,
} from "@/Components/Office";
import {
    ClipboardCheck,
    Calendar,
    Users,
    GraduationCap,
    Building2,
    Clock,
    PlusCircle,
    CheckCircle2,
    FileText,
} from "lucide-react";

function TestingRow({ record, isStaff }) {
    const form = useForm({});
    const next = { pending: "approved", approved: "completed" }[record.status];

    return (
        <article className="py-4 border-b border-sky-100/70 last:border-b-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                            {record.purpose || "Psychological Evaluation"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            {record.test_type}
                        </span>
                        <StatusBadge value={record.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{record.requester_name}</strong> ({record.requester_position})
                        </span>
                        {record.college && (
                            <span>• {record.college} {record.program ? `· ${record.program}` : ""}</span>
                        )}
                        <span>• Cohort: <strong>{record.student_count || 1}</strong> student(s)</span>
                        {record.year_level && <span>({record.year_level})</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            <Calendar className="w-3 h-3 text-sky-500" />
                            Target Exam: {record.preferred_date || "To be scheduled"} ({record.preferred_session || "AM"})
                        </span>
                        {record.details && (
                            <span className="text-slate-500 italic max-w-md truncate">
                                "{record.details}"
                            </span>
                        )}
                    </div>
                </div>

                {isStaff && next && (
                    <Button
                        secondary
                        className="shrink-0 text-xs py-1.5 px-3"
                        disabled={form.processing}
                        onClick={() => {
                            form.transform(() => ({
                                status: next,
                                previous_status: record.status,
                            }));
                            form.patch(route("testing.update", record.id));
                        }}
                    >
                        Mark {next === "approved" ? "Approved" : "Completed"}
                    </Button>
                )}
            </div>
            <Errors errors={form.errors} />
        </article>
    );
}

export default function RequestTesting({
    requests,
    isStaff,
    colleges = [],
    programs = {},
}) {
    const { auth } = usePage().props;
    const [showForm, setShowForm] = useState(!isStaff);

    const form = useForm({
        requester_name: auth.user.full_name || "",
        requester_position: auth.user.role === "faculty" ? "Department Internship Coordinator" : "Academic Coordinator",
        college: colleges[0]?.code || "COT",
        program: "",
        year_level: "4th Year",
        student_count: 30,
        purpose: "Pre-Internship Psychological Evaluation",
        preferred_date: "",
        preferred_session: "AM",
        test_type: "GAMA",
        details: "",
    });

    const activePrograms = form.data.college && programs[form.data.college]
        ? programs[form.data.college]
        : [];

    return (
        <Office
            title="Standardized Psychological Testing & Evaluation"
            eyebrow="SWEU Psychometrics"
            description={
                isStaff
                    ? "Review and process institutional testing requests from Department Internship Coordinators."
                    : "Department Internship Coordinators submit batch psychological testing requests for student cohorts."
            }
            action={
                isStaff && (
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{showForm ? "Hide Form" : "New Testing Request"}</span>
                    </button>
                )
            }
        >
            <div className={`grid gap-6 ${showForm ? "xl:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
                {/* Requests List */}
                <Card
                    title={isStaff ? "Psychological Testing Queue" : "Your Testing Requests"}
                    description={`${requests.total || requests.data?.length || 0} batch testing request(s) on file.`}
                >
                    {!requests.data?.length ? (
                        <Empty>No testing requests submitted yet.</Empty>
                    ) : (
                        <div className="divide-y divide-sky-100/60">
                            {requests.data.map((r) => (
                                <TestingRow
                                    key={r.id}
                                    record={r}
                                    isStaff={isStaff}
                                />
                            ))}
                        </div>
                    )}
                    <Pagination data={requests} />
                </Card>

                {/* Coordinator Submission Form */}
                {showForm && (
                    <Card
                        title="Department Coordinator Testing Form"
                        description="Request standardized testing for pre-internship students or academic evaluation."
                    >
                        <form
                            className="space-y-4 text-xs"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(route("testing.store"), {
                                    onSuccess: () => {
                                        form.reset("details", "student_count");
                                        if (isStaff) setShowForm(false);
                                    },
                                });
                            }}
                        >
                            <Errors errors={form.errors} />

                            {/* Section 1: Coordinator Identity */}
                            <div className="space-y-3 pb-3 border-b border-sky-100">
                                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-sky-600" />
                                    1. Requester Information
                                </h4>

                                <Field
                                    form={form}
                                    name="requester_name"
                                    label="Requester Full Name"
                                    required
                                />

                                <Field
                                    form={form}
                                    name="requester_position"
                                    label="Official Position / Designation"
                                    placeholder="e.g. Department Internship Coordinator"
                                    required
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field
                                        form={form}
                                        name="college"
                                        label="College"
                                        type="select"
                                        required
                                    >
                                        {colleges.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} — {c.name}
                                            </option>
                                        ))}
                                    </Field>

                                    <Field
                                        form={form}
                                        name="year_level"
                                        label="Student Year Level"
                                        type="select"
                                        required
                                    >
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year (Internship Candidate)</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                    </Field>
                                </div>

                                {activePrograms.length > 0 ? (
                                    <Field
                                        form={form}
                                        name="program"
                                        label="Academic Program"
                                        type="select"
                                    >
                                        <option value="">Select program...</option>
                                        {activePrograms.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </Field>
                                ) : (
                                    <Field
                                        form={form}
                                        name="program"
                                        label="Academic Program"
                                        placeholder="e.g. BS Information Technology"
                                    />
                                )}
                            </div>

                            {/* Section 2: Cohort & Purpose */}
                            <div className="space-y-3 pb-3 border-b border-sky-100">
                                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                    2. Cohort &amp; Testing Purpose
                                </h4>

                                <Field
                                    form={form}
                                    name="student_count"
                                    label="Number of Student Examinees"
                                    type="number"
                                    min="1"
                                    max="500"
                                    required
                                />

                                <Field
                                    form={form}
                                    name="purpose"
                                    label="Purpose of Testing"
                                    type="select"
                                    required
                                >
                                    <option value="Pre-Internship Psychological Evaluation">
                                        Pre-Internship / Practicum Clearance
                                    </option>
                                    <option value="Academic Diagnostic Profiling">
                                        Academic Diagnostic Profiling
                                    </option>
                                    <option value="Board Exam Readiness Assessment">
                                        Board Exam Readiness Assessment
                                    </option>
                                    <option value="Special Psychological Evaluation">
                                        Special Departmental Evaluation
                                    </option>
                                </Field>

                                <Field
                                    form={form}
                                    name="test_type"
                                    label="Requested Assessment Tool"
                                    type="select"
                                    required
                                >
                                    <option value="GAMA">GAMA (General Ability Measure for Adults)</option>
                                    <option value="Personality Battery">Standard Personality Battery</option>
                                    <option value="Aptitude Test">Comprehensive Aptitude Battery</option>
                                    <option value="Other">Other (Specify below)</option>
                                </Field>
                            </div>

                            {/* Section 3: Proposed Schedule */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    3. Target Examination Schedule
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field
                                        form={form}
                                        name="preferred_date"
                                        label="Proposed Exam Date"
                                        type="date"
                                        required
                                    />

                                    <Field
                                        form={form}
                                        name="preferred_session"
                                        label="Preferred Session"
                                        type="select"
                                        required
                                    >
                                        <option value="AM">Morning (AM: 08:00 - 12:00)</option>
                                        <option value="PM">Afternoon (PM: 13:00 - 17:00)</option>
                                        <option value="Whole Day">Whole Day (Batch Groups)</option>
                                    </Field>
                                </div>

                                <Field
                                    form={form}
                                    name="details"
                                    label={
                                        form.data.test_type === "Other"
                                            ? "Specify Test & Batch Details *"
                                            : "Special Testing Venue / Batch Notes (optional)"
                                    }
                                    type="textarea"
                                    required={form.data.test_type === "Other"}
                                    placeholder="e.g. CAS Audio Visual Theater, 2 sections (4A & 4B)"
                                />
                            </div>

                            <Button disabled={form.processing} className="w-full mt-2">
                                Submit Institutional Request
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </Office>
    );
}
