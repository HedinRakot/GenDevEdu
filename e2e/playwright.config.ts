import { defineConfig, devices } from '@playwright/test';

// Ziel ist der Expo-Web-Dev-Server (react-native-web), nicht mehr das gelöschte
// Vite-Frontend. Default-Port von `npx expo start --web` ist 8081.
const baseURL = process.env.BASE_URL || 'http://localhost:8081';

export default defineConfig({
  testDir: './tests',
  // Clerk-Testing-Token holen, bevor Tests laufen (braucht CLERK_*-Keys).
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    actionTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
