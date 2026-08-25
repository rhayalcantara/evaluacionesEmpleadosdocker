// Config con la que se corre el recorrido de auditoría de T3.3
// (`e2e/crud-competencias.spec.js`) y los diagnósticos `e2e/diag-*.spec.js`.
//
// Sin ventana de navegador: la corrida dura minutos, hace cientos de acciones y
// no necesita a nadie mirando. La evidencia son las capturas, que se toman igual
// en headless. `playwright.config.js` (headed) sigue sirviendo para depurar un
// paso concreto a ojo.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e',
  use: { headless: true, viewport: { width: 1400, height: 900 }, video: 'off' },
  reporter: 'list',
});
