import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1080 },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/api/session",
    reuseExistingServer: !process.env.CI,
    env: {
      NANOMQ_API_URL: process.env.TEST_BROKER_URL || "http://127.0.0.1:18081",
      NANOMQ_SESSION_SECRET: "isolated-e2e-session-encryption-key-at-least-32",
      NANOMQ_SECURE_COOKIE: "false",
    },
  },
});
