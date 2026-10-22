import { defineConfig, devices } from '@playwright/test';

// Two kinds of browser checks against the built app:
// - `npm run test:a11y` (VLW-24): every page with a keyboard and on a phone, the API answered from fixtures
//   (e2e/mockApi.ts), so no API runs. The same projects run e2e/robustness.spec.ts (VLW-36): odd routes, input, files,
//   storage and answers never make a page throw.
// - `npm run test:e2e` (VLW-23): the main flows against the API's real Compose stack (e2e/flows.spec.ts).
// With E2E_BASE_URL set, such as https://localhost, the flows run against a deployed stack instead of the preview
// (VLW-25): the webapp's image behind the API's Caddy, one origin, its own /config.json and Content Security Policy.
const deployed = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: deployed ?? 'http://127.0.0.1:4173',
    // Animations take 1 ms (DESIGN.md › The promise, rule 5), so axe never measures a colour mid-fade.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testMatch: /(a11y|robustness)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'phone', testMatch: /(a11y|robustness)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 } } },
    {
      name: 'flows',
      testMatch: 'flows.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        // A rehearsal's certificate comes from Caddy's local CA; the API's own rehearsal checks it with curl.
        ignoreHTTPSErrors: !!deployed,
      },
    },
  ],
  // A deployed stack serves the app itself.
  webServer: deployed
    ? undefined
    : {
        command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
