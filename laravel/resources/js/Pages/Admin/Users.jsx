import { useForm } from "@inertiajs/react";
import Office, {
    Card,
    Field,
    Check,
    Button,
    Errors,
    Pagination,
    Badge,
} from "@/Components/Office";
function UserRow({ user, roles, colleges }) {
    const form = useForm({
        role: user.role,
        active: user.active,
        college_codes: user.college_codes,
        on_duty: user.on_duty,
        available: user.available,
    });
    return (
        <details className="border-b border-slate-200 py-5">
            <summary className="cursor-pointer flex flex-wrap justify-between gap-2">
                <span>
                    <span className="text-sm font-semibold">
                        {user.full_name}
                    </span>
                    <span className="block mt-1 text-xs text-slate-500">
                        {user.email}
                    </span>
                </span>
                <Badge value={user.active ? user.role : "disabled"} />
            </summary>
            <form
                className="mt-5 space-y-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.patch(route("admin.update", user.id));
                }}
            >
                <div className="grid gap-5 md:grid-cols-2">
                    <Field form={form} name="role" label="Role" type="select">
                        {roles.map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </Field>
                    <Check
                        form={form}
                        name="active"
                        label="Account is active"
                    />
                </div>
                {form.data.role === "counselor" && (
                    <>
                        <fieldset>
                            <legend className="text-sm font-medium mb-3">
                                Assigned colleges
                            </legend>
                            <div className="grid gap-3 md:grid-cols-2">
                                {colleges.map((c) => (
                                    <label
                                        key={c.code}
                                        className="flex gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            className="accent-sky-600"
                                            checked={form.data.college_codes.includes(
                                                c.code,
                                            )}
                                            onChange={(e) =>
                                                form.setData(
                                                    "college_codes",
                                                    e.target.checked
                                                        ? [
                                                              ...form.data
                                                                  .college_codes,
                                                              c.code,
                                                          ]
                                                        : form.data.college_codes.filter(
                                                              (x) =>
                                                                  x !== c.code,
                                                          ),
                                                )
                                            }
                                        />
                                        {c.name}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div className="flex flex-wrap gap-6">
                            <Check form={form} name="on_duty" label="On duty" />
                            <Check
                                form={form}
                                name="available"
                                label="Available for new assignments"
                            />
                        </div>
                    </>
                )}
                <Errors errors={form.errors} />
                <Button disabled={form.processing}>Save account</Button>
            </form>
        </details>
    );
}
function Grants({ record, allowed }) {
    const form = useForm({ permissions: record.permissions });
    return (
        <form
            className="border-b border-slate-100 py-5"
            onSubmit={(e) => {
                e.preventDefault();
                form.patch(route("admin.permissions", record.role));
            }}
        >
            <h3 className="font-semibold capitalize mb-3">{record.role}</h3>
            <div className="flex flex-wrap gap-4">
                {allowed.map((p) => (
                    <label key={p} className="text-xs flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="accent-sky-600"
                            checked={form.data.permissions.includes(p)}
                            onChange={(e) =>
                                form.setData(
                                    "permissions",
                                    e.target.checked
                                        ? [...form.data.permissions, p]
                                        : form.data.permissions.filter(
                                              (x) => x !== p,
                                          ),
                                )
                            }
                        />
                        {p}
                    </label>
                ))}
            </div>
            <Errors errors={form.errors} />
            <Button secondary className="mt-4" disabled={form.processing}>
                Save {record.role} permissions
            </Button>
        </form>
    );
}
export default function Users({
    users,
    roles,
    colleges,
    grants,
    allowedPermissions,
}) {
    const form = useForm({
        full_name: "",
        email: "",
        password: "",
        role: "faculty",
    });
    return (
        <Office
            title="The people behind the support."
            eyebrow="System administration"
            description="Manage accounts, college coverage, and role permissions. Administration does not grant access to clinical notes."
        >
            <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
                <Card title="User accounts">
                    {users.data.map((u) => (
                        <UserRow
                            key={u.id}
                            user={u}
                            roles={roles}
                            colleges={colleges}
                        />
                    ))}
                    <Pagination data={users} />
                </Card>
                <Card title="Create an account">
                    <form
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post(route("admin.store"), {
                                onSuccess: () => form.reset(),
                            });
                        }}
                    >
                        <Field
                            form={form}
                            name="full_name"
                            label="Full name"
                            required
                        />
                        <Field
                            form={form}
                            name="email"
                            label="Email"
                            type="email"
                            required
                        />
                        <Field
                            form={form}
                            name="password"
                            label="Initial password"
                            type="password"
                            required
                            autoComplete="new-password"
                            hint="12+ characters, uppercase, lowercase and a number."
                        />
                        <Field
                            form={form}
                            name="role"
                            label="Role"
                            type="select"
                        >
                            {roles.map((r) => (
                                <option key={r}>{r}</option>
                            ))}
                        </Field>
                        <Errors errors={form.errors} />
                        <Button disabled={form.processing}>
                            Create account
                        </Button>
                    </form>
                </Card>
            </div>
            <Card
                title="Role permissions"
                description="Permissions can be restricted within a role’s responsibilities. Clinical access always requires the assigned counselor."
                className="mt-6"
            >
                {grants.map((r) => (
                    <Grants
                        key={r.role}
                        record={r}
                        allowed={allowedPermissions[r.role]}
                    />
                ))}
            </Card>
        </Office>
    );
}
