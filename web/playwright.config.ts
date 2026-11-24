import { defineConfig } from "@playwright/test";

/**
 * End-to-end: the real API (fresh, in-memory, seeded with the brief's data)
 * and a production build of the web app, on their own ports so they never
 * clash with `pnpm dev`. Uses the installed Chrome by default; set
 * PW_CHANNEL=chromium after `pnpm exec playwright install chromium` instead.
 */
const API_PORT = 4010;
const WEB_PORT = 5180;
const WEB_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // One API instance holds state; run in order.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: WEB_URL,
    channel: process.env.PW_CHANNEL ?? "chrome",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --dir ../api build && node ../api/dist/main.js",
      url: `http://localhost:${API_PORT}/api/health`,
      env: {
        PORT: String(API_PORT),
        SEED_ON_STARTUP: "true",
        FRONTEND_URL: WEB_URL,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // Separate outDir so the e2e API URL never ends up in the normal dist.
      command: `vite build --outDir dist-e2e && vite preview --outDir dist-e2e --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/api/v1` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
