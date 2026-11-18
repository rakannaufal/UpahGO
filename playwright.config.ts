import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/web",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://localhost:8081",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
        (process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : undefined),
    },
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: {
    command: "npm run preview",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
