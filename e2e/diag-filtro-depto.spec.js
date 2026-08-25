/**
 * ¿Se puede abrir el filtro por departamento y elegir una opción?
 * La corrida definitiva se quedó colgada ahí (90 min sin avanzar), y hay que
 * saber si el que no responde es el desplegable de la pantalla o el guion.
 * Tiempos cortos a propósito: aquí queremos que falle rápido, no que espere.
 */
const { test } = require('@playwright/test');

const BASE    = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Falta EVAL_USERNAME'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta EVAL_PASSWORD'); })();

test('el filtro por departamento se abre y filtra', async ({ page }) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(10000);          // <- clave: que no espere para siempre

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 15000 }).catch(() => null);
  await page.locator('input[type="text"]').first().fill(USUARIO);
  const pwd = page.locator('input[type="password"]');
  if (await pwd.count() > 0) await pwd.first().fill(CLAVE);
  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) await radio.check().catch(() => null);
  await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();

  const menu = page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' });
  for (let i = 0; i < 30 && await menu.count() === 0; i++) await page.waitForTimeout(1000);
  await menu.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(600);
  await menu.first().locator('a.dropdown-item').filter({ hasText: 'Configuración de Competencias' }).first().click();
  await page.waitForTimeout(3000);
  console.log('  pantalla:', (await page.locator('h2.cc-titulo').allInnerTexts().catch(() => [])).join('') || '(ninguna)');

  const sel = page.locator('.cp-filtros mat-select').first();
  console.log('  mat-select de filtros encontrados:', await page.locator('.cp-filtros mat-select').count());
  console.log('  visible:', await sel.isVisible().catch(e => 'error: ' + e.message));
  console.log('  habilitado:', await sel.isEnabled().catch(e => 'error: ' + e.message));

  // ¿Hay algún overlay abierto tapando la pantalla antes de tocar nada?
  console.log('  overlays abiertos antes de hacer clic:', await page.locator('.cdk-overlay-container .cdk-overlay-pane').count());

  const caja = await sel.boundingBox().catch(() => null);
  console.log('  boundingBox:', caja ? `${Math.round(caja.width)}x${Math.round(caja.height)} en (${Math.round(caja.x)},${Math.round(caja.y)})` : '(sin caja)');
  const tapa = caja ? await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return '(nada en ese punto)';
    return `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').slice(0, 3).join('.') : ''}`;
  }, [caja.x + caja.width / 2, caja.y + caja.height / 2]) : '(sin caja)';
  console.log('  elemento en el centro del desplegable:', tapa);

  const t0 = Date.now();
  try {
    await sel.click({ timeout: 8000 });
    console.log(`  clic en el desplegable OK (${Date.now() - t0} ms)`);
  } catch (e) {
    console.log(`  FALLO al hacer clic (${Date.now() - t0} ms):\n${e.message.split('\n').slice(0, 12).join('\n')}`);
    await page.screenshot({ path: 'e2e/capturas-crud-competencias/diag-depto-fallo-clic.png', fullPage: true });

    // ¿Y si se pulsa el disparador interno de Material en vez del custom element?
    const t2 = Date.now();
    try {
      await page.locator('.cp-filtros .mat-mdc-select-trigger').first().click({ timeout: 8000 });
      console.log(`  clic en .mat-mdc-select-trigger OK (${Date.now() - t2} ms) — el problema es el selector, no la pantalla`);
    } catch (e2) {
      console.log(`  tambien falla el trigger interno (${Date.now() - t2} ms): ${e2.message.split('\n')[0]}`);
    }
    // La pregunta que importa: ¿le pasa esto a una persona, o solo a Playwright,
    // que se niega a pulsar cuando otro elemento recibiria el evento?
    // Se hace un clic real en el centro del campo, sin comprobaciones previas.
    try {
      await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await page.waitForTimeout(900);
      const abiertoRaton = await page.locator('.cdk-overlay-container mat-option').count();
      console.log(`  clic REAL de raton sobre la etiqueta -> opciones visibles: ${abiertoRaton}` +
                  (abiertoRaton > 0 ? '  => una persona SI puede abrirlo; es artefacto de Playwright'
                                    : '  => una persona TAMPOCO puede abrirlo; es defecto de la pantalla'));
      if (abiertoRaton > 0) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    } catch (e4) {
      console.log('  el clic real de raton fallo:', e4.message.split('\n')[0]);
    }

    // ¿Y con teclado, que no depende de la posición del puntero?
    try {
      await sel.focus({ timeout: 5000 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      console.log('  tras Enter, opciones visibles:', await page.locator('.cdk-overlay-container mat-option').count());
    } catch (e3) {
      console.log('  el foco por teclado tambien falla:', e3.message.split('\n')[0]);
    }
    return;
  }

  await page.waitForTimeout(800);
  const opciones = page.locator('.cdk-overlay-container mat-option');
  const n = await opciones.count();
  console.log('  opciones en el desplegable:', n);
  if (n > 0) {
    const textos = await opciones.allInnerTexts();
    console.log('  primeras opciones:', textos.slice(0, 5).map(t => t.trim()).join(' | '));
    const t1 = Date.now();
    try {
      await opciones.nth(1).click({ timeout: 8000 });
      console.log(`  opción elegida OK (${Date.now() - t1} ms)`);
      await page.waitForTimeout(1200);
      console.log('  filas tras filtrar:', await page.locator('table tbody tr').count());
      console.log('  conteo que declara la pantalla:', (await page.locator('.cp-pie, .cp-conteo').allInnerTexts().catch(() => [])).join(' ').trim().slice(0, 160));
    } catch (e) {
      console.log(`  FALLO al elegir opción (${Date.now() - t1} ms):`, e.message.split('\n')[0]);
    }
  }
  await page.screenshot({ path: 'e2e/capturas-crud-competencias/diag-depto.png', fullPage: true });
});
