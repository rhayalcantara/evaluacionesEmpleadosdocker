// Config para grabar los videos de evidencia (uno por caso).
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1400, height: 900 },
    video: { mode: 'on', size: { width: 1400, height: 900 } },
  },
  outputDir: './e2e/videos-auditoria',
  reporter: 'list',
});
