import { test, expect } from "@playwright/test";

test("student, staff, counselor, faculty and administrator workflows", async ({
    page,
}) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function login(role) {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");
        await page.getByLabel("University email").fill(`${role}@browser.test`);
        await page
            .getByLabel("Password", { exact: true })
            .fill("BrowserTestPassword123!");
        await page
            .getByRole("button", { name: "Sign in", exact: true })
            .click();
        await expect(
            page.getByRole("button", { name: "Sign out" }),
        ).toBeVisible();
    }
    async function logout() {
        await page.getByRole("button", { name: "Sign out" }).click();
        await expect(
            page.getByRole("button", { name: "Sign in", exact: true }),
        ).toBeVisible();
    }
    await login("student");
    await expect(
        page.getByRole("heading", { name: "Welcome back, Student." }),
    ).toBeVisible();
    await expect(
        page.getByText(
            "Your personal information has not been submitted yet.",
            { exact: false },
        ),
    ).toBeVisible();
    await expect(
        page.getByRole("link", {
            name: "Notifications, 0 unread",
            exact: true,
        }),
    ).toBeVisible();
    const signoutBounds = await page
        .getByTestId("sidebar-signout")
        .boundingBox();
    expect(signoutBounds.y + signoutBounds.height).toBe(1000);
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await expect(
        page.getByRole("menu").getByText("student@browser.test"),
    ).toBeVisible();
    await expect(
        page.getByRole("menuitem", {
            name: "Settings & Preferences",
            exact: true,
        }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
        page.getByRole("button", { name: "Open profile menu" }),
    ).toBeFocused();
    await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Your intake" })
        .click();
    await page
        .getByLabel("Student ID number", { exact: true })
        .fill("2026-98765");
    await page.getByLabel("College", { exact: true }).selectOption("CAS");
    await page.getByLabel("Year level").selectOption("2");
    await page.getByLabel("Mobile number", { exact: true }).fill("09123456789");
    await page.getByLabel("Emergency contact name").fill("Synthetic Guardian");
    await page.getByLabel("Emergency contact mobile").fill("+639123456789");
    await page.getByLabel("Relationship to you").fill("Parent");
    await page.getByLabel("Street / barangay").fill("Synthetic Street");
    await page.getByLabel("City / municipality").fill("Malaybalay");
    await page.getByLabel("State / province").fill("Bukidnon");
    await page.getByLabel("Postal / ZIP code").fill("8700");
    await page.getByLabel("Date of birth").fill("2004-05-12");
    await page.getByLabel("Marital status").fill("Single");
    await page
        .getByLabel("Religious affiliation")
        .fill("Synthetic affiliation");
    await page
        .getByLabel("Facebook / Messenger username")
        .fill("student.browser");
    await page.getByLabel("Anxiety", { exact: true }).check();
    await page.getByLabel("Asthma", { exact: true }).check();
    await page.getByLabel("Allergies", { exact: true }).check();
    await page.getByLabel("Other", { exact: true }).check();
    await page
        .getByLabel("Other medical conditions")
        .fill("Synthetic condition");
    await page
        .getByLabel("I am currently taking prescription medication.")
        .check();
    await page
        .getByLabel("Current prescription medications")
        .fill("Synthetic medication");
    await page
        .getByLabel("I have had surgery within the past 5 years.")
        .check();
    await page
        .getByLabel("Surgeries within the past 5 years", { exact: true })
        .fill("Synthetic surgery");
    await page.getByLabel("Tobacco, cigarettes or vape use").fill("None");
    await page.getByLabel("Alcohol use").fill("None");
    await page.getByLabel("Caffeine use").fill("Coffee");
    await page.getByLabel("Drug use", { exact: true }).fill("None");
    await page.getByLabel("I am completing this intake as a walk-in.").check();
    await page
        .getByLabel("Referred by", { exact: true })
        .fill("Synthetic faculty");
    await page.getByLabel("Current living situation").fill("With family");
    await page
        .getByLabel("What would you like support with?")
        .fill("Academic workload");
    await page
        .getByRole("button", { name: "Save information", exact: true })
        .click();
    await expect(page.getByRole("alert")).toContainText("sworn truthful");
    await expect(page).toHaveURL(/\/intake$/);
    await page.getByLabel("I have read and acknowledge").check();
    await page.getByLabel("I hereby swear").check();
    await page.getByRole("button", { name: "Save information" }).click();
    await expect(
        page.getByText("Your information has been updated successfully."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/student\/dashboard$/);
    await expect(
        page.getByText("Synthetic medication", { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText("Synthetic Street, Malaybalay, Bukidnon, 8700", {
            exact: true,
        }),
    ).toBeVisible();
    await page
        .getByRole("link", { name: "Update My Information", exact: true })
        .click();
    await expect(page.getByLabel("I hereby swear")).not.toBeChecked();
    await expect(
        page.getByLabel("I have read and acknowledge"),
    ).not.toBeChecked();
    await expect(
        page.getByLabel("Current prescription medications"),
    ).toHaveValue("Synthetic medication");
    await expect(page.getByLabel("Caffeine use")).toHaveValue("Coffee");
    await expect(page.getByLabel("Date of birth")).toHaveValue("2004-05-12");
    await page.getByLabel("City / municipality").fill("Updated Malaybalay");
    await page.getByLabel("I have read and acknowledge").check();
    await page.getByLabel("I hereby swear").check();
    await page
        .getByRole("button", { name: "Save information", exact: true })
        .click();
    await expect(
        page.getByText("Synthetic Street, Updated Malaybalay, Bukidnon, 8700", {
            exact: true,
        }),
    ).toBeVisible();
    await page.reload();
    await expect(
        page.getByText("Synthetic medication", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
        path: "test-results/student-dashboard-desktop.png",
        fullPage: true,
    });
    await page
        .getByRole("link", { name: "Manage appointments", exact: true })
        .click();
    await page.getByLabel("Preferred date").fill("2030-10-07");
    await page.getByLabel("Preferred time").fill("10:00");
    await page
        .getByRole("button", { name: "Request appointment", exact: true })
        .click();
    await expect(page.getByText("Your request has been routed")).toBeVisible();
    await page.getByRole("button", { name: "Join walk-in queue" }).click();
    await expect(
        page.getByText("You have joined the walk-in queue."),
    ).toBeVisible();
    await page.getByRole("link", { name: "Psychological testing" }).click();
    await page
        .getByRole("button", { name: "Submit request", exact: true })
        .click();
    await expect(page.getByText("Testing request submitted")).toBeVisible();
    await logout();

    await login("faculty");
    await page.getByLabel("Student ID number").fill("2026-98765");
    await page
        .getByLabel("Reason for referral")
        .fill("Synthetic referral for academic support.");
    await page
        .getByRole("button", { name: "Submit referral", exact: true })
        .click();
    await expect(
        page.getByText("Referral submitted.", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("Academic workload")).toHaveCount(0);
    await logout();

    await login("staff");
    await page
        .getByRole("button", { name: "Flag urgent & alert counselors" })
        .click();
    await expect(page.getByText("Appointment updated.")).toBeVisible();
    await expect(page.getByText("Academic workload")).toHaveCount(0);
    await page.screenshot({
        path: "test-results/staff-queue.png",
        fullPage: true,
    });
    await page.getByRole("link", { name: "Referral queue" }).click();
    await page.getByRole("button", { name: "Mark under review" }).click();
    await expect(page.getByText("Referral status updated.")).toBeVisible();
    await page.getByRole("link", { name: "Testing queue" }).click();
    await page.getByRole("button", { name: "Mark approved" }).click();
    await expect(page.getByText("Testing status updated.")).toBeVisible();
    await page.getByRole("link", { name: "Office reports" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download CSV" }).click();
    expect((await download).suggestedFilename()).toBe("guidance-summary.csv");
    await logout();

    await login("counselor");
    await expect(
        page.getByText("An urgent walk-in needs front-desk coordination."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept request" }).click();
    await expect(page.getByText("Appointment updated.")).toBeVisible();
    await page.getByRole("link", { name: "View intake & notes" }).click();
    await expect(
        page.getByText("Academic workload", { exact: true }),
    ).toBeVisible();
    await page
        .getByLabel("Confidential notes")
        .fill("Synthetic confidential browser note.");
    await page.getByLabel("Flag this student for follow-up").check();
    await page.getByLabel("Next follow-up date").fill("2030-10-10");
    await page.getByRole("button", { name: "Save private notes" }).click();
    await expect(page.getByText("Private session notes saved.")).toBeVisible();
    await page
        .getByLabel("Confidential notes")
        .fill("Synthetic confidential browser note updated.");
    await page.getByRole("button", { name: "Save private notes" }).click();
    await page.reload();
    await expect(page.getByLabel("Confidential notes")).toHaveValue(
        "Synthetic confidential browser note updated.",
    );
    expect(
        await page.evaluate(() => JSON.stringify(history.state)),
    ).not.toContain("Synthetic confidential browser note updated.");
    await page.getByRole("link", { name: "My caseload" }).click();
    await expect(page.getByText("Follow up: 2030-10-10")).toBeVisible();
    await page.screenshot({
        path: "test-results/counselor-dashboard.png",
        fullPage: true,
    });
    await logout();

    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Confidential notes")).toHaveCount(0);

    await login("student");
    await expect(
        page.getByRole("link", {
            name: "Notifications, 2 unread",
            exact: true,
        }),
    ).toBeVisible();
    await expect(
        page.getByText("1 Approved GAMA Request", { exact: true }),
    ).toBeVisible();
    await expect(
        page.locator("section").filter({
            has: page.getByRole("heading", {
                name: "Scheduled Appointments",
                exact: true,
            }),
        }),
    ).toContainText("1");
    await expect(
        page.locator("section").filter({
            has: page.getByRole("heading", {
                name: "Active Referrals",
                exact: true,
            }),
        }),
    ).toContainText("1");
    await page
        .getByRole("link", { name: "Notifications, 2 unread", exact: true })
        .click();
    await expect(
        page.getByText("Your GAMA testing request is now approved.", {
            exact: false,
        }),
    ).toBeVisible();
    await page
        .getByRole("button", { name: "Mark read", exact: true })
        .first()
        .click();
    await expect(
        page.getByRole("link", {
            name: "Notifications, 1 unread",
            exact: true,
        }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await page
        .getByRole("menuitem", { name: "Settings & Preferences", exact: true })
        .click();
    await page.getByLabel("Automatically refresh my notifications").uncheck();
    await page
        .getByRole("button", { name: "Save preferences", exact: true })
        .click();
    await expect(
        page.getByText("Your preferences have been saved."),
    ).toBeVisible();
    await page.reload();
    await expect(
        page.getByLabel("Automatically refresh my notifications"),
    ).not.toBeChecked();
    await page.getByLabel("Automatically refresh my notifications").check();
    await page
        .getByRole("button", { name: "Save preferences", exact: true })
        .click();
    await expect(
        page.getByText("Your preferences have been saved."),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await expect(
        page.getByRole("menu").getByText("student@browser.test"),
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBeTruthy();
    await page.screenshot({
        path: "test-results/student-mobile-profile-menu.png",
        fullPage: true,
    });
    await page
        .getByRole("menuitem", { name: "Edit Profile", exact: true })
        .click();
    await expect(page.getByLabel("Date of birth")).toHaveValue("2004-05-12");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBeTruthy();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(
        page.getByRole("heading", {
            name: "Critical Information Review",
            exact: true,
        }),
    ).toBeVisible();
    await page.screenshot({
        path: "test-results/student-dashboard-mobile.png",
        fullPage: true,
    });
    await page.getByRole("button", { name: "Open profile menu" }).click();
    await page.getByRole("menuitem", { name: "Sign Out", exact: true }).click();
    await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login("admin");
    await expect(
        page.getByText("Synthetic confidential browser note updated."),
    ).toHaveCount(0);
    await page.getByText("Counselor Browser Test", { exact: true }).click();
    await expect(
        page.getByLabel("College of Arts and Sciences", { exact: true }),
    ).toBeChecked();
    await expect(
        page.getByLabel("College of Business", { exact: true }),
    ).toBeChecked();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(
        page.getByRole("link", { name: "People & permissions" }),
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBeTruthy();
    await page.screenshot({
        path: "test-results/mobile-admin.png",
        fullPage: true,
    });
    expect(errors).toEqual([]);
});
