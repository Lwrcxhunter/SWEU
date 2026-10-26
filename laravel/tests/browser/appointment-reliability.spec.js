import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Serve synthetic Inertia pages with the real built assets; no accounts or database writes.
const origin = process.env.UI_TEST_ORIGIN || "http://localhost:8000";
const pagination = (data = []) => ({
    data,
    links: [],
    total: data.length,
    current_page: 1,
    last_page: 1,
});
const appointment = {
    id: "ui-test",
    version: 3,
    status: "counselor_accepted_pending_student",
    type: "online_booking",
    channel: "face_to_face",
    scheduled_date: "2030-10-07",
    scheduled_time: "10:00",
    counselor_id: "counselor",
    counselor_name: "Test Counselor",
    student: {
        full_name: "Test Student",
        school_id_number: "TEST-001",
        college: { code: "CAS" },
    },
};

async function fixture(page, component, role, extra = {}) {
    const manifest = JSON.parse(
        readFileSync(
            new URL("../../public/build/manifest.json", import.meta.url),
            "utf8",
        ),
    );
    const entry = manifest["resources/js/app.jsx"];
    const data = {
        component,
        url: "/__appointment-ui",
        version: "ui-test",
        props: {
            errors: {},
            flash: {},
            unreadAlerts: [],
            unreadAlertCount: 0,
            auth: {
                user: {
                    full_name: "Test User",
                    role,
                    preferences: { notification_refresh: false },
                },
                permissions: ["queue.manage"],
            },
            appointments: pagination([appointment]),
            followups: pagination(),
            followUps: [],
            hasIntake: true,
            counselors: [],
            filters: {},
            metrics: {},
            calendar: { date: "2030-10-07", view: "day" },
            ...extra,
        },
    };
    await page.route("**/__appointment-ui", async (route) => {
        if (route.request().headers()["x-inertia"])
            return route.fulfill({
                json: data,
                headers: { "X-Inertia": "true" },
            });
        const encoded = JSON.stringify(data)
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;");
        await route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html><head>${(entry.css || []).map((css) => `<link rel="stylesheet" href="/build/${css}">`).join("")}</head><body><div id="app" data-page="${encoded}"></div><script>window.route=(name,id)=>name ? (name==='appointments.update' ? '/__appointment-action/'+id : '/__link/'+name) : {current:()=>false};</script><script type="module" src="/build/${entry.file}"></script></body></html>`,
        });
    });
    await page.goto(`${origin}/__appointment-ui`);
    return data;
}

test("student confirmation is accessible, prevents duplicate requests, and allows retry after validation errors", async ({
    page,
}) => {
    const data = await fixture(page, "Student/BookAppointment", "student");
    let requests = 0;
    let release;
    await page.route("**/__appointment-action/*", async (route) => {
        requests++;
        expect(route.request().postDataJSON()).toEqual({
            action: "student_confirm",
            version: 3,
        });
        await new Promise((resolve) => {
            release = resolve;
        });
        await route.fulfill({
            json: {
                ...data,
                props: {
                    ...data.props,
                    errors: { action: "Schedule changed. Please try again." },
                },
            },
            headers: { "X-Inertia": "true" },
        });
    });
    await page
        .getByRole("button", { name: "Confirm Schedule", exact: true })
        .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Go back" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(requests).toBe(0);
    await expect(
        page.getByRole("button", { name: "Confirm Schedule", exact: true }),
    ).toBeFocused();
    await page
        .getByRole("button", { name: "Confirm Schedule", exact: true })
        .click();
    await dialog
        .getByRole("button", { name: "Confirm schedule", exact: true })
        .evaluate((button) => {
            button.click();
            button.click();
        });
    await expect(
        dialog.getByRole("button", { name: /Confirming/ }),
    ).toBeDisabled();
    await expect(
        dialog.getByRole("button", { name: "Go back" }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await expect.poll(() => requests).toBe(1);
    release();
    await expect(dialog.getByRole("alert")).toHaveText(
        "Schedule changed. Please try again.",
    );
    await expect(
        dialog.getByRole("button", { name: "Confirm schedule", exact: true }),
    ).toBeEnabled();
    await dialog
        .getByRole("button", { name: "Confirm schedule", exact: true })
        .click();
    await expect.poll(() => requests).toBe(2);
    release();
});

for (const role of ["student", "staff"]) {
    test(`${role} cancellation uses a modal and submits once`, async ({
        page,
    }) => {
        const data = await fixture(
            page,
            role === "student"
                ? "Student/BookAppointment"
                : "Staff/WalkInQueue",
            role,
        );
        let requests = 0;
        let release;
        await page.route("**/__appointment-action/*", async (route) => {
            requests++;
            expect(route.request().postDataJSON()).toMatchObject({
                action: "cancel",
                version: 3,
            });
            await new Promise((resolve) => {
                release = resolve;
            });
            await route.fulfill({
                json: {
                    ...data,
                    props: {
                        ...data.props,
                        appointments: pagination([
                            { ...appointment, status: "cancelled" },
                        ]),
                    },
                },
                headers: { "X-Inertia": "true" },
            });
        });
        if (role === "staff")
            await page.locator("article button[aria-expanded]").click();
        await page
            .getByRole("button", {
                name:
                    role === "student"
                        ? "Cancel Request"
                        : "Cancel appointment",
                exact: true,
            })
            .click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: "Go back" }).click();
        expect(requests).toBe(0);
        await page
            .getByRole("button", {
                name:
                    role === "student"
                        ? "Cancel Request"
                        : "Cancel appointment",
                exact: true,
            })
            .click();
        await dialog
            .getByRole("button", { name: "Cancel appointment", exact: true })
            .evaluate((button) => {
                button.click();
                button.click();
            });
        await expect(
            dialog.getByRole("button", { name: /Cancelling/ }),
        ).toBeDisabled();
        await expect.poll(() => requests).toBe(1);
        release();
        await expect(dialog).toHaveCount(0);
    });
}

test("counselor polling waits 45 seconds, skips hidden tabs, and does not overlap", async ({
    page,
}) => {
    await page.clock.install();
    const data = await fixture(page, "Counselor/Dashboard", "counselor", {
        appointments: pagination(),
    });
    let requests = 0;
    let release;
    await page.route("**/__appointment-ui", async (route) => {
        requests++;
        await new Promise((resolve) => {
            release = resolve;
        });
        await route.fulfill({ json: data, headers: { "X-Inertia": "true" } });
    });
    await expect(page.getByText("No assigned appointments yet.")).toBeVisible();
    await page.clock.runFor(15000);
    expect(requests).toBe(0);
    await page.evaluate(() =>
        Object.defineProperty(document, "hidden", {
            configurable: true,
            value: true,
        }),
    );
    await page.clock.runFor(30000);
    expect(requests).toBe(0);
    await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
            configurable: true,
            value: false,
        });
        document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => requests).toBe(1);
    await page.clock.runFor(45000);
    expect(requests).toBe(1);
    release();
    await page.waitForResponse((response) =>
        response.url().endsWith("/__appointment-ui"),
    );
    await page.clock.runFor(45000);
    await expect.poll(() => requests).toBe(2);
    release();
});
