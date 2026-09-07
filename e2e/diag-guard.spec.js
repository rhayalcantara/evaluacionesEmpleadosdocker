/**
 * Comprobación aislada del RoleGuard.
 *
 * El paso 12 del recorrido dio un falso positivo: degradaba el rol estando YA en
 * /configuracion-competencias, y Angular no reejecuta los guards al navegar a la
 * ruta en la que ya estás, así que la pantalla seguía abierta sin que el guard
 * llegara a correr. Aquí se sale primero a Home y se entra después.
 */
const { test, expect } = require('@playwright/test');

const BASE    = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Falta EVAL_USERNAME'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta EVAL_PASSWORD'); })();

async function entrarPorMenu(page) {
  const menu = page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' });
  if (await menu.count() === 0) return false;
  await menu.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(600);
  const item = menu.first().locator('a.dropdown-item').filter({ hasText: 'Configuración de Competencias' });
  if (await item.count() === 0) return false;
  await item.first().click();
  await page.waitForTimeout(2500);
  return true;
}

test('el RoleGuard bloquea de verdad a un rol no administrador', async ({ page }) => {
  test.setTimeout(180000);

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 15000 }).catch(() => null);
  const inputs = page.locator('input[type="text"]');
  if (await inputs.count() >= 1) await inputs.first().fill(USUARIO);
  const pwd = page.locator('input[type="password"]');
  if (await pwd.count() > 0) await pwd.first().fill(CLAVE);
  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) await radio.check().catch(() => null);
  await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();

  // Esperar a que cargue el rol (navmenu pide EmpleadoRols despues del empleado)
  const menuConf = page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' });
  for (let i = 0; i < 30 && await menuConf.count() === 0; i++) await page.waitForTimeout(1000);
  console.log('  menú de administrador visible:', await menuConf.count() > 0);

  // A) Con rol 1 debe entrar
  const entro = await entrarPorMenu(page);
  console.log('  [rol 1] entró por el menú:', entro, '| URL:', page.url());
  console.log('  [rol 1] título en pantalla:', (await page.locator('h2.cc-titulo').allInnerTexts().catch(() => [])).join(' | ') || '(ninguno)');

  // Volver a Home para que la proxima navegacion sea real y el guard corra
  const inicio = page.locator('nav a.nav-link', { hasText: /^Inicio$/ });
  if (await inicio.count() > 0) { await inicio.first().click(); await page.waitForTimeout(2000); }
  console.log('  URL tras volver al inicio:', page.url());

  // B) Degradar el rol y volver a entrar por el menú: ahora sí hay navegación
  await page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('rol') || '{}');
    r.rolId = 2;
    localStorage.setItem('rol', JSON.stringify(r));
  });
  console.log('  rol degradado a 2 (Supervisor)');

  await entrarPorMenu(page);
  await page.waitForTimeout(2500);
  const urlFinal = page.url();
  const hayPantalla = await page.locator('h2.cc-titulo').count();
  const swal = await page.locator('.swal2-container').innerText().catch(() => '');
  console.log('  [rol 2] URL final     :', urlFinal);
  console.log('  [rol 2] pantalla nueva:', hayPantalla > 0 ? 'ABIERTA (el guard NO bloqueó)' : 'no se abrió');
  console.log('  [rol 2] mensaje       :', swal.replace(/\s+/g, ' ').slice(0, 160) || '(ninguno)');
  await page.screenshot({ path: 'e2e/capturas-crud-competencias/33-guard-verificado.png', fullPage: true });

  // Restaurar
  await page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('rol') || '{}');
    r.rolId = 1;
    localStorage.setItem('rol', JSON.stringify(r));
  });

  expect(hayPantalla, 'con rol 2 la pantalla no debe abrirse').toBe(0);
});
