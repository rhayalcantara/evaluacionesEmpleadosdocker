/**
 * Auditoría Playwright — Historial de Evaluaciones, Fase 1 (Docs/PLAN.md, F3)
 *
 * Recorre la pantalla "Evaluaciones → Historial de Evaluaciones" con el usuario que se
 * indique y deja una captura por paso en Docs/auditoria-historial/ más un resumen
 * Docs/auditoria-historial/auditoria.md. Solo lectura: no graba nada.
 *
 * Invocación (PowerShell, desde la raíz del repo, con `npx ng serve --configuration prueba
 * --port 4300` corriendo en otra terminal):
 *   $env:EVAL_USERNAME="..."; $env:EVAL_PASSWORD="..."
 *   $env:EVAL_BASE="http://localhost:4300/evaluacionempleado-prueba"
 *   npx playwright test e2e/historial-evaluaciones.spec.js
 *
 * Seguridad: credenciales SOLO por variables de entorno; aborta si la URL apunta a
 * producción (:7070 o http://192.168.7.222/evaluacionempleado).
 */
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE    = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Falta EVAL_USERNAME'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta EVAL_PASSWORD'); })();
if (/:7070/.test(BASE) || /192\.168\.7\.222\/evaluacionempleado(\/|$)/.test(BASE)) {
  throw new Error(`EVAL_BASE apunta a producción ("${BASE}"). Solo local contra :7071.`);
}

const OUT_DIR = path.join(__dirname, '..', 'Docs', 'auditoria-historial');
let idx = 1;
const resumen = [];
const shot = async (page, etiqueta) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const nombre = `${String(idx++).padStart(2, '0')}-${etiqueta}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, nombre), fullPage: true }).catch(() => null);
  return nombre;
};
const ok = (t) => { resumen.push(`- ✅ ${t}`); console.log('  ✅ ' + t); };
const issue = (t) => { resumen.push(`- ❌ ${t}`); console.log('  ❌ ' + t); };
const nota = (t) => { resumen.push(`- ℹ️ ${t}`); console.log('  ℹ️ ' + t); };

async function navMenu(page, menuText, itemText) {
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: menuText });
  if (await navItem.count() === 0) { issue(`Menú "${menuText}" no encontrado`); return false; }
  await navItem.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(500);
  const item = navItem.first().locator('a.dropdown-item').filter({ hasText: itemText });
  if (await item.count() === 0) { issue(`Ítem "${itemText}" no está bajo "${menuText}"`); return false; }
  const urlAntes = page.url();
  await item.first().click();
  await page.waitForFunction(u => location.href !== u, urlAntes, { timeout: 12000 }).catch(() => null);
  return true;
}

async function cerrarSwal(page) {
  const btn = page.locator('.swal2-confirm');
  if (await btn.count() > 0) { await btn.first().click().catch(() => null); await page.waitForTimeout(300); }
}

async function elegirMatOption(page, formLabel, optionText) {
  const field = page.locator('mat-form-field').filter({ hasText: formLabel }).first();
  await field.locator('mat-select').click();
  const opt = page.locator('mat-option').filter({ hasText: optionText }).first();
  if (await opt.count() === 0) { await page.keyboard.press('Escape'); return false; }
  await opt.click();
  return true;
}

test.setTimeout(240000);

test('Historial de Evaluaciones — Fase 1', async ({ page }) => {
  // 1. Login
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const texto = page.locator('input[type="text"], input:not([type])');
  await texto.first().fill(USUARIO);
  const clave = page.locator('input[type="password"]');
  if (await clave.count() > 0) { await clave.first().fill(CLAVE); } else { await texto.nth(1).fill(CLAVE); }
  await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();
  const menuEval = page.locator('li.nav-item.dropdown').filter({ hasText: 'Evaluaciones' });
  for (let i = 0; i < 30 && await menuEval.count() === 0; i++) { await page.waitForTimeout(1000); }
  if (await menuEval.count() === 0) { issue('Login: el menú Evaluaciones no apareció en 30 s'); }
  else { ok('Login correcto'); }
  await shot(page, 'post-login');

  // 2. Navegar al historial
  const llego = await navMenu(page, 'Evaluaciones', 'Historial de Evaluaciones');
  await page.waitForTimeout(1500);
  await cerrarSwal(page);
  await shot(page, 'historial-inicial');
  const rolTxt = await page.locator('.subtitle').first().textContent().catch(() => '');
  nota(`Rol mostrado: ${(rolTxt || '').trim().replace(/\s+/g, ' ')}`);
  if (!llego) { issue('No se pudo llegar a la pantalla de historial'); }

  // 3. Filtro de estado: opciones reales
  const estadoField = page.locator('mat-form-field').filter({ hasText: 'Estado' }).first();
  await estadoField.locator('mat-select').click();
  await page.waitForTimeout(400);
  const opciones = (await page.locator('mat-option').allTextContents()).map(t => t.trim());
  await shot(page, 'filtro-estado-opciones');
  await page.keyboard.press('Escape');
  const esperadas = ['Borrador', 'Autoevaluado', 'Evaluado por supervisor', 'Enviado al colaborador', 'Completado', 'Sin iniciar'];
  const faltan = esperadas.filter(e => !opciones.includes(e));
  const viejas = ['Completada', 'Pendiente', 'En Proceso', 'Aprobada', 'Rechazada'].filter(v => opciones.includes(v));
  if (faltan.length === 0 && viejas.length === 0) { ok(`Filtro de estado con los 6 estados reales: ${opciones.filter(o => o !== 'Todos').join(', ')}`); }
  else { issue(`Filtro de estado: faltan [${faltan}] / viejas presentes [${viejas}]`); }

  // 4. Periodo 8 + Completado → filas con nombre e identificación
  const periodoOk = await elegirMatOption(page, 'Período', /Mitad|Medio|2026/i);
  const estadoOk = await elegirMatOption(page, 'Estado', 'Completado');
  await page.locator('button').filter({ hasText: 'Filtrar' }).first().click();
  await page.waitForTimeout(4000);
  await cerrarSwal(page);
  await shot(page, 'filtro-periodo8-completado');
  const filas = page.locator('table.historial-table tbody tr');
  const nFilas = await filas.count();
  nota(`Periodo elegido: ${periodoOk}, estado elegido: ${estadoOk}, filas: ${nFilas}`);
  if (nFilas > 0) {
    const primera = await filas.first().textContent();
    const sinNA = !/N\/A/.test(primera || '');
    const conIdent = /\d{3}-?\d{7}-?\d/.test(primera || '');
    if (sinNA && conIdent) { ok('Las filas traen nombre e identificación (sin N/A)'); }
    else { issue(`Primera fila sin identificación o con N/A: "${(primera || '').trim().replace(/\s+/g, ' ').slice(0, 160)}"`); }
    const medio = await page.locator('tr.fila-medio-ano').count();
    const guiones = await page.locator('tr.fila-medio-ano .sin-puntuacion').count();
    const deshab = await page.locator('tr.fila-medio-ano input[type="checkbox"]:disabled').count();
    if (medio > 0 && guiones === medio * 3 && deshab === medio) { ok(`${medio} filas de medio año marcadas, sin puntuación y sin checkbox`); }
    else if (medio === 0) { nota('Ninguna fila de medio año en esta página (¿periodo elegido es final?)'); }
    else { issue(`Medio año: filas=${medio}, guiones=${guiones} (esperado ${medio * 3}), checkbox deshabilitados=${deshab}`); }
    const badges = await page.locator('table.historial-table .badge').allTextContents();
    const crudos = badges.filter(b => /EvaluadoPorSupervisor|SIN_INICIAR|AutoEvaluado/.test(b));
    if (crudos.length === 0) { ok('Los badges de estado muestran etiquetas legibles'); } else { issue(`Badges con valor crudo: ${crudos.slice(0, 3)}`); }
  } else {
    issue('El filtro periodo + Completado no devolvió filas');
  }

  // 5. Búsqueda por secuencial y por usuario
  const buscar = page.locator('mat-form-field').filter({ hasText: 'Buscar' }).first().locator('input');
  await buscar.fill('525'); await buscar.press('Enter'); await page.waitForTimeout(800);
  const n525 = await filas.count();
  await shot(page, 'busqueda-525');
  await buscar.fill('ralcantara'); await buscar.press('Enter'); await page.waitForTimeout(800);
  const nUser = await filas.count();
  await shot(page, 'busqueda-usuario');
  if (n525 > 0 && n525 === nUser) { ok(`Buscar "525" y "ralcantara" devuelven las mismas ${n525} filas`); }
  else { nota(`Buscar 525 → ${n525} filas; ralcantara → ${nUser} filas (depende de que 525 esté en el conjunto filtrado)`); }
  await buscar.fill(''); await buscar.press('Enter'); await page.waitForTimeout(500);

  // 6. Estadísticas de un empleado (botón warn de la primera fila)
  const btnStats = page.locator('table.historial-table button[color="warn"]').first();
  if (await btnStats.count() > 0) {
    await btnStats.click(); await page.waitForTimeout(3000); await cerrarSwal(page);
    await shot(page, 'estadisticas');
    const card = await page.locator('.estadisticas-card').textContent().catch(() => '');
    if (/Finales:\s*\d+\s*·\s*Medio año:\s*\d+/.test(card || '')) { ok('Panel de estadísticas con conteo Finales / Medio año'); }
    else { issue('Panel de estadísticas sin el conteo Finales / Medio año'); }
  } else { nota('Sin botón de estadísticas (rol empleado)'); }

  // 7. Comparar: seleccionar dos finales si las hay
  const checks = page.locator('table.historial-table input[type="checkbox"]:not(:disabled)');
  if (await checks.count() >= 2) {
    await checks.nth(0).click(); await checks.nth(1).click();
    await page.locator('button').filter({ hasText: 'Comparar' }).first().click();
    await page.waitForTimeout(3000);
    await shot(page, 'comparacion');
    const dialogo = await page.locator('mat-dialog-container').count();
    const swal = await page.locator('.swal2-container').count();
    if (dialogo > 0) { ok('Comparación de dos finales abre el diálogo'); }
    else if (swal > 0) { nota('Comparar mostró un aviso: ' + (await page.locator('.swal2-html-container').textContent().catch(() => ''))); }
    else { issue('Comparar no abrió diálogo ni aviso'); }
    await page.keyboard.press('Escape').catch(() => null); await cerrarSwal(page);
  } else { nota('Menos de dos evaluaciones finales seleccionables para comparar'); }

  // Resumen
  const md = ['# Auditoría Playwright — Historial de Evaluaciones (Fase 1)', '',
    `Fecha: ${new Date().toISOString()}  ·  Base: ${BASE}  ·  Usuario: ${USUARIO}`, '', ...resumen, '',
    '## Capturas', ...fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).map(f => `- ${f}`)].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'auditoria.md'), md, 'utf8');
  console.log(md);
});
