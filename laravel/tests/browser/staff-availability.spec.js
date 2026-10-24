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

test("staff sees conflicts, assigns a free time and navigates the dated roster", async ({
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
        page.getByRole("heading", { name: "Front desk", exact: true }),
    ).toBeVisible();
    await expect(
        page.getByRole("link", { name: "Open testing queue" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /referral/i })).toHaveCount(0);
    await page
        .getByRole("region", { name: "Counseling requests" })
        .getByRole("button", { name: "Needs assignment 2", exact: true })
        .click();
    await expect(page.locator("article")).toHaveCount(2);
    const request = page.locator("article").first();
    await expect(request.getByText("Virtual", { exact: true })).toBeVisible();
    await request
        .getByRole("button", { name: "Assign counselor", exact: true })
        .click();
    await expect(
        request.getByRole("option", { name: /Ana Santos.*Available/ }),
    ).toBeEnabled();
    await expect(
        request.getByRole("option", { name: /Ben Reyes.*Has class/ }),
    ).toBeDisabled();
    await expect(
        request.getByRole("option", { name: /Clara Cruz.*On leave/ }),
    ).toBeDisabled();
    await expect(
        request.getByRole("option", { name: /Diego Flores.*Already booked/ }),
    ).toBeDisabled();
    await request.getByLabel("Counselor", { exact: true }).selectOption({
        label: "Ana Santos — Available (College designate, recommended)",
    });
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
    await periodRequest.getByLabel("Counselor", { exact: true }).selectOption({
        label: "Ana Santos — Available (College designate, recommended)",
    });
    await expect(
        periodRequest.getByLabel("Available time (PHT)"),
    ).toBeVisible();
    await expect(
        periodRequest
            .getByLabel("Available time (PHT)")
            .locator('option[value="09:30"]'),
    ).toHaveCount(0);
    const requestedDate = await page
        .locator("form p")
        .filter({ hasText: /\d{4}-\d{2}-\d{2} \/ AM/ })
        .first()
        .innerText();
    const date = requestedDate.match(/\d{4}-\d{2}-\d{2}/)[0];
    await periodRequest
        .getByLabel("Available time (PHT)")
        .selectOption("10:30");
    await periodRequest
        .getByRole("button", { name: "Send assignment to counselor" })
        .click();
    await expect(page.locator("article")).toHaveCount(0);
    await page
        .getByRole("button", { name: "Availability calendar", exact: true })
        .click();
    await page.getByLabel("Date", { exact: true }).fill(date);
    await expect(page.getByLabel("Date", { exact: true })).toHaveValue(date);
    await page.getByRole("button", { name: "Day", exact: true }).click();
    await expect(page.getByRole("columnheader")).toHaveCount(2);
    await expect(page.getByText("PSYC 101", { exact: true })).toBeVisible();
    await expect(page.getByText("Private leave reason")).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
        path: "test-results/staff-calendar-desktop.png",
        fullPage: true,
        animations: "disabled",
    });
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
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
        .poll(async () => (await page.locator("main").boundingBox()).width)
        .toBe(390);
    await page.evaluate(() => window.scrollTo(0, 0));
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
    expect(errors).toEqual([]);
});
