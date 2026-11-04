import { defineConfig } from '@playwright/test';
const port = process.env.PLAYWRIGHT_PORT ?? '4173';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: 'docs/{arg}{ext}',
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: `npx esbuild src/index.ts --bundle --format=esm --target=es2020 --outfile=dist/flowio-home-assistant-cards.js --servedir=. --serve=127.0.0.1:${port}`,
    url: `http://127.0.0.1:${port}/demo/`,
    reuseExistingServer: !process.env.CI
  }
});
