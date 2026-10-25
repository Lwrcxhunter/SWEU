import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const seed = (file) =>
    execFileSync("php", [file], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            PHPRC: path.resolve("../.runtime/php.ini"),
            MONGODB_DATABASE: "buksu_guidance_browser_test",
        },
    });
test.beforeAll(() => seed("tests/browser/seed-staff.php"));
test.afterAll(() => seed("tests/browser/seed.php"));

test("staff finds bookings, assigns by availability and navigates schedules and requests", async ({
    page,
}) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await page.getByLabel("University email").fill("staff@browser.test");
    await page
        .getByLabel("Password", { exact: true })
        .fill("BrowserTestPassword123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
        page.getByRole("heading", { name: "Appointments", exact: true }),
    ).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(
        nav.getByRole("link", { name: "Testing requests" }),
    ).toBeVisible();
    await page
        .getByRole("region", { name: "Counseling requests" })
        .getByRole("button", { name: "Needs assignment 2", exact: true })
        .click();
    await expect(page.locator("article")).toHaveCount(2);
    const request = page.locator("article").first();
    await expect(request.getByText("Online", { exact: true })).toBeVisible();
    await request
        .getByRole("button", { name: "Assign counselor", exact: true })
        .click();
    await expect(
        request.getByRole("radio", { name: /Ana Santos/ }),
    ).toBeVisible();
    await request.getByText(/Unavailable counselors/).click();
    await expect(request.getByText("Has class at this time")).toBeVisible();
    await expect(request.getByText(/^On leave/)).toBeVisible();
    await expect(request.getByText(/^Already booked/)).toBeVisible();
    await request.getByRole("radio", { name: /Ana Santos/ }).check();
    const scheduleHref = await request
        .getByRole("link", { name: "View this day's schedules" })
        .getAttribute("href");
    const date = new URL(scheduleHref).searchParams.get("calendar_date");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
        path: "test-results/staff-queue-desktop.png",
        fullPage: true,
        animations: "disabled",
    });
    await request
        .getByRole("button", { name: "Send assignment to counselor" })
        .click();
    await expect(page.locator("article")).toHaveCount(1);
    const periodRequest = page.locator("article");
    await periodRequest
        .getByRole("button", { name: "Assign counselor", exact: true })
        .click();
    await periodRequest.getByRole("radio", { name: /Ana Santos/ }).check();
    await expect(
        periodRequest
            .getByLabel("Available time (PHT)")
            .locator('option[value="09:30"]'),
    ).toHaveCount(0);
    await periodRequest
        .getByLabel("Available time (PHT)")
        .selectOption("10:30");
    await periodRequest
        .getByRole("button", { name: "Send assignment to counselor" })
        .click();
    await expect(page.locator("article")).toHaveCount(0);
    await page
        .getByRole("button", { name: "All appointments 5", exact: true })
        .click();
    await expect(
        page.getByRole("button", { name: "All appointments 5", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Find a student").fill("BROWSER-01");
    await page.getByLabel("Appointment date", { exact: true }).fill(date);
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.locator("article")).toHaveCount(5);
    await page
        .getByRole("button", { name: "Completed 1", exact: true })
        .click();
    await expect(page.locator("article")).toHaveCount(1);
    await expect(
        page
            .locator("article")
            .getByRole("button", { name: "Assign counselor", exact: true }),
    ).toHaveCount(0);
    await page
        .getByRole("button", { name: "All appointments 5", exact: true })
        .click();
    await expect(
        page.getByRole("button", { name: "All appointments 5", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
        path: "test-results/staff-queue-mobile.png",
        fullPage: true,
        animations: "disabled",
    });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav.getByRole("link", { name: "Counselor schedules" }).click();
    await page.getByLabel("Date", { exact: true }).fill(date);
    await expect(
        page.getByRole("heading", { name: "Counselor schedules", exact: true }),
    ).toBeVisible();
    await expect(
        nav.getByRole("link", { name: "Counselor schedules" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("PSYC 101", { exact: true })).toBeVisible();
    await expect(page.getByText("Private leave reason")).toHaveCount(0);
    await page.screenshot({
        path: "test-results/staff-calendar-desktop.png",
        fullPage: true,
        animations: "disabled",
    });
    await page.getByLabel("Available at").selectOption("09:30");
    await expect(
        page.getByText("No counselors match these filters"),
    ).toBeVisible();
    await page
        .getByRole("button", { name: "Clear filters", exact: true })
        .click();
    await page.getByLabel("College or department").selectOption("COT");
    await expect(page.getByRole("rowheader")).toHaveCount(1);
    await expect(page.getByRole("rowheader")).toContainText("Ben Reyes");
    await page.getByLabel("Find a counselor").fill("No matching counselor");
    await expect(
        page.getByText("No counselors match these filters"),
    ).toBeVisible();
    await page
        .getByRole("button", { name: "Clear filters", exact: true })
        .click();
    await page.getByRole("button", { name: "Next period" }).click();
    await expect(page.getByLabel("Date", { exact: true })).not.toHaveValue(
        date,
    );
    await page.getByRole("button", { name: "Previous period" }).click();
    await expect(page.getByLabel("Date", { exact: true })).toHaveValue(date);
    await page.getByRole("button", { name: "Week", exact: true }).click();
    await expect(page.getByRole("columnheader")).toHaveCount(8);
    await page.screenshot({
        path: "test-results/staff-calendar-week.png",
        fullPage: true,
        animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
        path: "test-results/staff-calendar-mobile.png",
        fullPage: true,
        animations: "disabled",
    });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav.getByRole("link", { name: "Testing requests" }).click();
    await expect(
        page.getByRole("heading", { name: "Testing requests", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Needs review 1" }).click();
    await expect(
        page.getByRole("button", { name: "Needs review 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByText("View request details", { exact: true }).click();
    await page.screenshot({
        path: "test-results/staff-testing-desktop.png",
        fullPage: true,
        animations: "disabled",
    });
    await page
        .getByRole("button", { name: "Approve request", exact: true })
        .click();
    await expect(page.locator("article")).toHaveCount(0);
    await page.getByRole("button", { name: "Approved 1", exact: true }).click();
    await expect(
        page.getByRole("button", { name: "Mark testing completed" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
});
