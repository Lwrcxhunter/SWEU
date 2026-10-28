import { test, expect } from "@playwright/test";
import { build } from "esbuild";

test("appointment calendar switches ranges and history displays records", async ({
    page,
}) => {
    // Exercise the real calendar component; navigation and the surrounding shell
    // are stubbed so this regression check does not depend on seeded accounts.
    const bundle = await build({
        stdin: {
            contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
                import Appointments from './resources/js/Pages/Counselor/Cases.jsx';
                window.route=(name,params)=>'/'+name+(params ? '?'+new URLSearchParams(typeof params==='object'?params:{id:params}) : '');
                window.requests=[]; const root=createRoot(document.getElementById('app'));
                window.renderAppointments=(props)=>root.render(<Appointments {...props}/>);`,
            resolveDir: process.cwd(),
            loader: "jsx",
        },
        bundle: true,
        write: false,
        format: "iife",
        jsx: "automatic",
        plugins: [
            {
                name: "test-adapters",
                setup(builder) {
                    builder.onResolve(
                        { filter: /^@inertiajs\/react$/ },
                        () => ({ path: "inertia", namespace: "test" }),
                    );
                    builder.onResolve(
                        { filter: /^@\/Components\/Office$/ },
                        () => ({ path: "office", namespace: "test" }),
                    );
                    builder.onLoad(
                        { filter: /.*/, namespace: "test" },
                        ({ path }) => ({
                            loader: "jsx",
                            resolveDir: process.cwd(),
                            contents:
                                path === "inertia"
                                    ? `import React from 'react'; export const Link=({children,...props})=><a {...props}>{children}</a>;
                        export const router={get:(url,params,options)=>{window.requests.push(params);options?.onStart?.();options?.onFinish?.();},visit:(url)=>window.visited=url};`
                                    : `import React from 'react'; export default function Office({title,children}){return <main><h1>{title}</h1>{children}</main>}
                        export const Empty=({children})=><p>{children}</p>, Badge=({value})=><span>{value}</span>, Pagination=()=>null;`,
                        }),
                    );
                },
            },
        ],
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent('<div id="app"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate(() => window.renderAppointments({ tab: "schedule" }));
    await expect(
        page.getByRole("heading", { name: "Appointments", exact: true }),
    ).toBeVisible();
    for (const name of ["Day", "Week", "Month"]) {
        await page.getByRole("button", { name, exact: true }).click();
        await expect(
            page.locator(
                `.fc-${name === "Month" ? "dayGridMonth" : `timeGrid${name}`}-view`,
            ),
        ).toBeVisible();
    }
    await page.getByRole("button", { name: "Next month" }).click();
    const ranges = await page.evaluate(() => window.requests);
    const lengths = ranges.map(
        ({ start, end }) => (new Date(end) - new Date(start)) / 86400000,
    );
    expect(lengths).toContain(1);
    expect(lengths).toContain(7);
    expect(lengths.some((length) => length >= 28)).toBe(true);
    await expect(
        page.getByRole("link", { name: "Appointment History" }),
    ).toHaveAttribute("href", /tab=history/);
    await expect(
        page.getByText("Book Appointment", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("Quick Stats", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Upcoming Notes", { exact: true })).toHaveCount(
        0,
    );
    await page.evaluate(() =>
        window.renderAppointments({
            tab: "history",
            history: {
                data: [
                    {
                        id: "past",
                        student: { full_name: "Test Student" },
                        scheduled_date: "2026-01-01",
                        scheduled_time: "10:00",
                        status: "completed",
                    },
                ],
            },
        }),
    );
    await expect(
        page.getByRole("cell", { name: "Test Student" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "completed" })).toBeVisible();
    expect(errors).toEqual([]);
});
