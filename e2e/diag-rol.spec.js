/**
 * Diagnostico: por que el menu "Configuracion" no aparece tras iniciar sesion,
 * si el API devuelve rolId = 1 para el usuario del recorrido.
 * Solo lee: no escribe nada en la base.
 */
const { test } = require('@playwright/test');

const BASE    = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Falta EVAL_USERNAME'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta EVAL_PASSWORD'); })();

async function estado(page, momento) {
  const rol = await page.evaluate(() => localStorage.getItem('rol'));
  const empleado = await page.evaluate(() => localStorage.getItem('empleado'));
  const claves = await page.evaluate(() => Object.keys(localStorage));
  const menus = await page.locator('nav a.nav-link.dropdown-toggle').allInnerTexts().catch(() => []);
  console.log(`\n── ${momento} ──`);
  console.log('  claves en localStorage:', claves.join(', ') || '(vacio)');
  console.log('  rol      :', rol || '(no existe)');
  console.log('  empleado :', empleado ? empleado.slice(0, 160) : '(no existe)');
  console.log('  menus    :', menus.map(m => m.trim()).filter(Boolean).join(' | ') || '(ninguno)');
}

test('diagnostico de rol tras login', async ({ page }) => {
  test.setTimeout(180000);

  const llamadas = [];
  page.on('request', r => {
    if (r.url().includes('/api/')) llamadas.push(`${r.method()} ${r.url().split('/api/')[1]}`);
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 15000 }).catch(() => null);

  const inputs = page.locator('input[type="text"]');
  if (await inputs.count() >= 1) await inputs.first().fill(USUARIO);
  const pwd = page.locator('input[type="password"]');
  if (await pwd.count() > 0) await pwd.first().fill(CLAVE);
  else if (await inputs.count() >= 2) await inputs.nth(1).fill(CLAVE);
  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) await radio.check().catch(() => null);
  await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();

  await page.waitForSelector('nav.navbar', { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(4000);
  await estado(page, 'JUSTO DESPUES DEL LOGIN');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await estado(page, 'DESPUES DE RECARGAR');

  console.log('\n  llamadas al API observadas:', llamadas.length ? [...new Set(llamadas)].join(' | ') : '(ninguna)');

  // ¿Se puede entrar ya a la pantalla nueva?
  await page.goto(`${BASE}/configuracion-competencias`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('\n  URL tras navegar a configuracion-competencias:', page.url());
  const titulo = await page.locator('h2').allInnerTexts().catch(() => []);
  console.log('  titulos en pantalla:', titulo.join(' | ') || '(ninguno)');
  await page.screenshot({ path: 'e2e/capturas-crud-competencias/diag-rol.png', fullPage: true });
});
