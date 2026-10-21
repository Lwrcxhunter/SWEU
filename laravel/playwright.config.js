import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/browser",
    testMatch: "*.spec.js",
    workers: 1,
    timeout: 90000,
    use: {
        baseURL: "http://127.0.0.1:8001",
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 },
        screenshot: "only-on-failure",
    },
    reporter: "list",
});
