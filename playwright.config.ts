import { defineConfig, devices } from '@playwright/test';

// Two kinds of browser checks against the built app:
// - `npm run test:a11y` (VLW-24): every page with a keyboard and on a phone, the API answered from fixtures
//   (e2e/mockApi.ts), so no API runs.
// - `npm run test:e2e` (VLW-23): the main flows against the API's real Compose stack (e2e/flows.spec.ts).
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // Animations take 1 ms (DESIGN.md › The promise, rule 5), so axe never measures a colour mid-fade.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testMatch: 'a11y.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'phone', testMatch: 'a11y.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 } } },
    { name: 'flows', testMatch: 'flows.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
