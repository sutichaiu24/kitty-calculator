import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `file://${path.resolve(__dirname)}/index.html`,
    browserName: 'chromium',
    headless: false,
    launchOptions: {
      slowMo: 800,
    },
  },
});
