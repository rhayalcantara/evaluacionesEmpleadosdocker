const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  use: {
    headless: false,
    viewport: { width: 1400, height: 900 },
    video: 'retain-on-failure',
  },
  reporter: 'list',
});
