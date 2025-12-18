// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
        use: {
    // Your Vercel URL
    baseURL: 'http://localhost:3000', // Changed from Vercel to Localhost,
    trace: 'on-first-retry',
  },
      dependencies: ['setup'], // <--- This line tells Chromium to wait for setup
    },
  ],
});