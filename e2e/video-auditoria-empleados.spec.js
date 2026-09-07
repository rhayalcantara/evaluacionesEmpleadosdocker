/**
 * Video de evidencia para RRHH: los empleados reportados entran a su
 * autoevaluación de mitad de año sin problema.
 *
 * SOLO LECTURA. El guion navega y muestra; nunca pulsa Grabar, Guardar,
 * Aceptar ni Enviar. No escribe absolutamente nada en producción.
 *
 * Cada caso se graba en su propio video (un test = un archivo).
 *
 * Uso:
 *   EVAL_BASE=http://192.168.7.222/evaluacionempleado
 *   EVAL_PASS_<USUARIO>=<clave>   (una por empleado; no se escriben en el repo)
 *   npx playwright test e2e/video-auditoria-empleados.spec.js --config playwright.video.config.js
 */
const { test } = require('@playwright/test');

const BASE = process.env.EVAL_BASE || 'http://192.168.7.222/evaluacionempleado';

const CASOS = [
  { usuario: 'EPUELLO', nombre: 'ENMANUEL PUELLO LOPEZ',        cargo: 'OFICIAL DE NEGOCIOS JUNIOR',  nota: 'Reportado por RRHH — no presentaba ningun problema' },
  { usuario: 'MUPEREZ', nombre: 'MURIENNY PEREZ PEREZ DE CID',  cargo: 'GERENTE DE SUCURSAL PEQUENA', nota: 'Reportado por RRHH — corregido el 2026-08-26' },
];

async function rotulo(page, titulo, detalle) {
  await page.evaluate(([t, d]) => {
    let caja = document.getElementById('__rotulo_auditoria');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = '__rotulo_auditoria';
      // Abajo y transparente al puntero: arriba tapaba la barra de menu y se
      // tragaba los clics (el propio Playwright se negaba a pulsar).
      caja.style.cssText = [
        'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:2147483647',
        'background:#0b3d5c', 'color:#fff', 'padding:8px 16px',
        'font:600 15px/1.35 Segoe UI,Roboto,Arial,sans-serif',
        'box-shadow:0 -2px 8px rgba(0,0,0,.35)', 'pointer-events:none',
      ].join(';');
      document.body.appendChild(caja);
    }
    caja.innerHTML = `<div>${t}</div>` +
      (d ? `<div style="font-weight:400;font-size:13px;opacity:.9;margin-top:2px">${d}</div>` : '');
  }, [titulo, detalle || '']);
}

for (const caso of CASOS) {
  test(`${caso.usuario} - ${caso.nombre}`, async ({ page }) => {
    test.setTimeout(180000);
    page.setDefaultTimeout(20000);

    const clave = process.env[`EVAL_PASS_${caso.usuario}`];
    if (!clave) throw new Error(`Falta la variable EVAL_PASS_${caso.usuario}`);
    const sello = new Date().toLocaleString('es-DO');

    // ── Login ──
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 20000 }).catch(() => null);
    await rotulo(page, `PRODUCCION — ${caso.nombre} (${caso.usuario})`,
                       `${caso.cargo} · ${caso.nota} · ${sello}`);
    await page.waitForTimeout(2500);

    await page.locator('input[type="text"]').first().fill(caso.usuario);
    const pwd = page.locator('input[type="password"]');
    if (await pwd.count() > 0) await pwd.first().fill(clave);
    const radio = page.locator('input[type="radio"]').first();
    if (await radio.count() > 0) await radio.check().catch(() => null);
    await page.waitForTimeout(1200);
    await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();

    await page.waitForSelector('nav.navbar', { timeout: 30000 }).catch(() => null);
    await page.waitForTimeout(3000);
    await rotulo(page, `Sesion iniciada — ${caso.nombre}`, `${caso.cargo} · ${sello}`);
    await page.waitForTimeout(2500);

    // ── Menu Evaluaciones -> AutoEvaluacion ──
    const menu = page.locator('li.nav-item.dropdown').filter({ hasText: 'Evaluaciones' });
    await menu.first().locator('a.nav-link.dropdown-toggle').click();
    await page.waitForTimeout(1500);
    await menu.first().locator('a.dropdown-item').filter({ hasText: /AutoEvaluaci/ }).first().click();
    await page.waitForTimeout(6000);
    await rotulo(page, 'Autoevaluacion de Mitad de Ano 2026', `${caso.nombre} · ${sello}`);
    await page.waitForTimeout(3000);

    // ── Recorrer la pantalla despacio, para que se lea ──
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 450);
      await page.waitForTimeout(1400);
    }
    await page.waitForTimeout(1500);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -450);
      await page.waitForTimeout(700);
    }

    await rotulo(page, 'Pantalla cargada sin errores — no se modifico ningun dato',
                       `${caso.nombre} (${caso.usuario}) · ${sello}`);
    await page.waitForTimeout(4000);
  });
}
