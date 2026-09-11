/**
 * Auditoría Playwright — Bitácora de Eventos de Desempeño, Fase 3 (Docs/PLAN-BITACORA.md, F3)
 *
 * Recorre con un SUPERVISOR: menú Evaluaciones → Bitácora de Eventos, selección de un colaborador,
 * validaciones del formulario, alta de un evento, edición, resumen en la evaluación de medio año del
 * colaborador y eliminación. Deja una captura por paso en Docs/auditoria-bitacora/ y un resumen
 * Docs/auditoria-bitacora/auditoria.md. Escribe SOLO en la base de prueba (:7071) y borra lo que crea.
 *
 * Invocación (PowerShell, desde la raíz del repo, con `npx ng serve --configuration prueba --port 4300`
 * corriendo en otra terminal):
 *   $env:EVAL_USERNAME="prodriguez"; $env:EVAL_PASSWORD="..."
 *   $env:EVAL_BASE="http://localhost:4300/evaluacionempleado-prueba"
 *   $env:EVAL_COLABORADOR="ALCANTARA"          # texto para ubicar al colaborador en el equipo
 *   npx playwright test e2e/bitacora-eventos.spec.js
 *
 * Seguridad: credenciales SOLO por variables de entorno; aborta si la URL apunta a producción.
 */
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE    = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Falta EVAL_USERNAME'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta EVAL_PASSWORD'); })();
const COLAB   = process.env.EVAL_COLABORADOR || 'ALCANTARA';
if (/:7070/.test(BASE) || /192\.168\.7\.222\/evaluacionempleado(\/|$)/.test(BASE)) {
  throw new Error(`EVAL_BASE apunta a producción ("${BASE}"). Solo local contra :7071.`);
}

const OUT_DIR = path.join(__dirname, '..', 'Docs', 'auditoria-bitacora');
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
const MARCA = `[audit-${Date.now().toString(36)}]`;
const DESC = `${MARCA} Situación: cierre de mes. Acción: presentó el informe consolidado a tiempo. Resultado: aprobado sin observaciones.`;

async function navMenu(page, menuText, itemText) {
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: menuText });
  if (await navItem.count() === 0) { issue(`Menú "${menuText}" no encontrado`); return false; }
  await navItem.first().locator('.dropdown-toggle').first().click();
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

test.setTimeout(300000);

test('Bitácora de Eventos — Fase 3', async ({ page }) => {
  const diag = [];
  page.on('console', m => { if (m.type() === 'error') diag.push('console: ' + m.text().slice(0, 220)); });
  page.on('pageerror', e => diag.push('pageerror: ' + String(e).slice(0, 220)));
  page.on('response', r => { if (r.status() >= 400) diag.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => diag.push(`requestfailed ${r.url()} ${r.failure()?.errorText}`));
  // 1. Login
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 20000 }).catch(() => null);
  const texto = page.locator('input[type="text"]');
  if (await texto.count() >= 1) { await texto.first().fill(USUARIO); } else { issue('Login: sin campo de usuario'); }
  const clave = page.locator('input[type="password"]');
  if (await clave.count() > 0) { await clave.first().fill(CLAVE); } else if (await texto.count() >= 2) { await texto.nth(1).fill(CLAVE); }
  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) { await radio.check().catch(() => null); }
  await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();
  await page.waitForSelector('nav.navbar', { timeout: 25000 }).catch(() => null);
  await page.waitForTimeout(2500);
  await cerrarSwal(page);
  // El rol llega después del login; se espera al ítem "Bitácora de Eventos" (rol 1-2).
  const evalMenu = page.locator('li.nav-item.dropdown').filter({ hasText: 'Evaluaciones' });
  let itemBit = evalMenu.locator('a.dropdown-item').filter({ hasText: 'Bitácora' });
  for (let i = 0; i < 40 && await itemBit.count() === 0; i++) { await page.waitForTimeout(1000); }
  if (await itemBit.count() === 0) { issue('El ítem "Bitácora de Eventos" no apareció en el menú Evaluaciones en 40 s (¿rol supervisor?)'); }
  else { ok('Login correcto; el menú muestra "Bitácora de Eventos" para el rol del usuario'); }
  await shot(page, 'post-login');

  // 2. Navegar a la bitácora
  const llego = await navMenu(page, 'Evaluaciones', 'Bitácora');
  await page.waitForTimeout(1200);
  const swalNav = (await page.locator('.swal2-title, .swal2-html-container').allTextContents()).map(t => t.trim()).filter(Boolean);
  if (swalNav.length) { nota(`Aviso al navegar: ${swalNav.join(' — ')}`); }
  nota(`URL tras el clic: ${page.url()} · rol en localStorage: ${await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('rol') || 'null')?.rolId; } catch { return 'ERR'; } })}`);
  await shot(page, 'tras-clic-bitacora');
  if (diag.length) { nota('Diagnóstico del navegador: ' + diag.slice(-6).join(' || ')); }
  await page.waitForTimeout(1300);
  await cerrarSwal(page);
  await shot(page, 'bitacora-inicial');
  if (!llego || !/\/Bitacora/i.test(page.url())) { issue(`No se llegó a /Bitacora (url: ${page.url()})`); }
  else { ok('Ruta /Bitacora cargada'); }
  const guia = await page.locator('.alerta-guia').count();
  if (guia > 0) { ok('Guía "hechos, no interpretaciones" visible antes de elegir colaborador'); } else { issue('No se muestra la guía inicial (.alerta-guia)'); }

  // 3. Equipo y selección
  const items = page.locator('.equipo-item');
  for (let i = 0; i < 15 && await items.count() === 0; i++) { await page.waitForTimeout(1000); }
  const nEquipo = await items.count();
  if (nEquipo === 0) { issue('El equipo no cargó (0 .equipo-item en 15 s)'); }
  else { ok(`Equipo cargado: ${nEquipo} colaborador(es)`); }
  await page.locator('input[placeholder*="Buscar"]').first().fill(COLAB).catch(() => null);
  await page.waitForTimeout(500);
  const objetivo = page.locator('.equipo-item').filter({ hasText: new RegExp(COLAB, 'i') }).first();
  if (await objetivo.count() === 0) { issue(`No se encontró al colaborador "${COLAB}" en el equipo`); }
  else { await objetivo.click(); await page.waitForTimeout(2500); ok(`Colaborador "${COLAB}" seleccionado`); }
  await shot(page, 'colaborador-seleccionado');
  const cabecera = await page.locator('.cabecera-colaborador').count();
  if (cabecera > 0) { ok('Cabecera del colaborador con conteos por tipo'); } else { issue('Falta la cabecera .cabecera-colaborador'); }
  const antes = await page.locator('.evento-card').count();
  nota(`Eventos visibles antes de la prueba: ${antes}`);

  // 4. Validaciones del formulario
  await page.locator('button').filter({ hasText: 'Registrar evento' }).first().click();
  await page.waitForTimeout(600);
  await shot(page, 'dialogo-nuevo');
  const modal = page.locator('.modal.d-block');
  if (await modal.count() === 0) { issue('El diálogo de registro no se abrió'); }
  await modal.locator('button').filter({ hasText: /^Guardar$/ }).first().click();
  await page.waitForTimeout(500);
  const errores = (await modal.locator('.alert-warning li').allTextContents()).map(t => t.trim());
  await shot(page, 'validacion-vacio');
  if (errores.some(e => /30 caracteres/.test(e)) && errores.some(e => /competencia/i.test(e))) { ok(`Validación en cliente: ${errores.length} mensajes (descripción y competencias)`); }
  else { issue(`Validación en cliente incompleta: [${errores.join(' | ')}]`); }
  // fecha futura
  const fecha = modal.locator('input[type="date"]').first();
  const manana = new Date(); manana.setDate(manana.getDate() + 1);
  await fecha.fill(manana.toISOString().slice(0, 10));
  await modal.locator('button').filter({ hasText: /^Guardar$/ }).first().click();
  await page.waitForTimeout(400);
  const errFut = (await modal.locator('.alert-warning li').allTextContents()).join(' ');
  if (/futura/.test(errFut)) { ok('Fecha futura rechazada en cliente'); } else { issue('Fecha futura no fue rechazada'); }

  // 5. Alta válida
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  await fecha.fill(ayer.toISOString().slice(0, 10));
  await modal.locator('.btn-group button').filter({ hasText: 'Iniciativa' }).first().click();
  await modal.locator('select').first().selectOption({ label: 'Alto' }).catch(() => null);
  await modal.locator('textarea').first().fill(DESC);
  const checks = modal.locator('input[type="checkbox"]');
  const nChecks = await checks.count();
  if (nChecks >= 2) { await checks.nth(0).check(); await checks.nth(1).check(); ok(`Competencias del periodo listadas: ${nChecks}`); }
  else { issue(`Solo ${nChecks} competencias en el diálogo`); }
  await shot(page, 'dialogo-lleno');
  await modal.locator('button').filter({ hasText: /^Guardar$/ }).first().click();
  await page.waitForTimeout(2500);
  await cerrarSwal(page);
  await shot(page, 'evento-creado');
  const creada = page.locator('.evento-card').filter({ hasText: MARCA });
  if (await creada.count() === 1) { ok('Evento creado y visible en la lista (con marcador)'); }
  else { issue(`El evento creado no aparece en la lista (${await creada.count()} coincidencias)`); }
  const primeraCard = page.locator('.evento-card').first();
  if ((await primeraCard.textContent() || '').includes(MARCA)) { ok('El evento nuevo aparece primero (orden por fecha del hecho desc)'); }
  else { nota('El evento nuevo no es el primero: hay eventos con fecha del hecho más reciente'); }
  const badge = creada.locator('.badge').filter({ hasText: 'Iniciativa' });
  if (await badge.count() > 0) { ok('Badge de tipo "Iniciativa" en la tarjeta'); } else { issue('La tarjeta no muestra el tipo Iniciativa'); }

  // 6. Filtro por tipo
  const selTipo = page.locator('select').filter({ has: page.locator('option', { hasText: 'Iniciativa' }) }).first();
  await selTipo.selectOption({ label: 'Conducta' }).catch(() => null);
  await page.waitForTimeout(1500);
  const conFiltro = await page.locator('.evento-card').filter({ hasText: MARCA }).count();
  if (conFiltro === 0) { ok('Filtro por tipo Conducta oculta el evento de tipo Iniciativa'); } else { issue('El filtro por tipo no excluyó el evento'); }
  await page.locator('button').filter({ hasText: 'Limpiar' }).first().click();
  await page.waitForTimeout(1500);
  await shot(page, 'filtros-limpios');

  // 7. Edición (solo propio)
  const btnEditar = creada.locator('button').filter({ hasText: 'Editar' });
  if (await btnEditar.count() === 0) { issue('El evento propio no muestra el botón Editar'); }
  else {
    await btnEditar.first().click(); await page.waitForTimeout(600);
    const m2 = page.locator('.modal.d-block');
    await m2.locator('select').first().selectOption({ label: 'Bajo' }).catch(() => null);
    await m2.locator('button').filter({ hasText: /^Guardar$/ }).first().click();
    await page.waitForTimeout(2500); await cerrarSwal(page);
    const impacto = await page.locator('.evento-card').filter({ hasText: MARCA }).locator('.badge').filter({ hasText: /Bajo/ }).count();
    if (impacto > 0) { ok('Edición aplicada: impacto Alto → Bajo'); } else { issue('La edición no se reflejó en la tarjeta'); }
    await shot(page, 'evento-editado');
  }

  // 8. Resumen en la evaluación de medio año del colaborador
  const fueEval = await navMenu(page, 'Evaluaciones', 'Evaluar Equipo');
  await page.waitForTimeout(3000); await cerrarSwal(page);
  if (fueEval) {
    const card = page.locator('app-card-empleado, table tbody tr').filter({ hasText: new RegExp(COLAB, 'i') }).first();
    for (let i = 0; i < 20 && await card.count() === 0; i++) { await page.waitForTimeout(1000); }
    const btnEval = card.locator('button').filter({ hasText: /Evaluar/i }).first();
    for (let i = 0; i < 15 && await btnEval.count() === 0; i++) { await page.waitForTimeout(1000); }
    await shot(page, 'evaluar-equipo');
    if (await btnEval.count() === 0) { nota(`La tarjeta de ${COLAB} no muestra "Evaluar Empleado" (estado de la evaluación no editable por el supervisor)`); }
    if (await btnEval.count() > 0) {
      await btnEval.click(); await page.waitForTimeout(5000); await cerrarSwal(page);
      const resumenes = page.locator('app-bitacora-resumen');
      const n = await resumenes.count();
      const textos = (await resumenes.allTextContents()).map(t => t.trim());
      const conEventos = textos.filter(t => /logro|incumplimiento|iniciativa|conducta/i.test(t)).length;
      await shot(page, 'evaluacion-con-resumen');
      if (n > 0) { ok(`${n} resúmenes de bitácora incrustados en las competencias; ${conEventos} con eventos`); } else { issue('No hay <app-bitacora-resumen> en el formulario del supervisor'); }
      const ver = resumenes.locator('button').filter({ hasText: 'Ver' }).first();
      if (await ver.count() > 0) { await ver.click(); await page.waitForTimeout(500); await shot(page, 'resumen-desplegado'); ok('Despliegue de eventos desde la competencia'); }
      const cerrar = page.locator('button').filter({ hasText: /Cancelar|Cerrar|Inicio/ }).first();
      await cerrar.click().catch(() => null); await page.waitForTimeout(800);
    } else { nota('No se encontró el botón de evaluar del colaborador en Evaluar Equipo; se omite la verificación del resumen'); }
  }

  // 8b. Reporte de bitácora (menú Reportes)
  let fueRep = await navMenu(page, 'Evaluaciones', 'Reporte de mi Bitácora');
  if (!fueRep) { fueRep = await navMenu(page, 'Reportes', 'Reporte Bitácora'); }
  await page.waitForTimeout(3500); await cerrarSwal(page);
  if (fueRep && /ReporteBitacora/i.test(page.url())) {
    const filasRep = await page.locator('table tbody tr').count();
    const tarjetas = await page.locator('.tarjeta-total').count();
    await shot(page, 'reporte-equipo');
    if (tarjetas === 7 && filasRep > 0) { ok(`Reporte de bitácora: ${tarjetas} tarjetas de totales y ${filasRep} filas de equipo`); }
    else { issue(`Reporte de bitácora: ${tarjetas} tarjetas, ${filasRep} filas`); }
    const filaCol = page.locator('table tbody tr').filter({ hasText: new RegExp(COLAB, 'i') }).first();
    const ver = filaCol.locator('button').filter({ hasText: 'Ver' }).first();
    if (await ver.count() > 0) {
      await ver.click(); await page.waitForTimeout(2500); await cerrarSwal(page);
      const det = await page.locator('.detalle').count();
      const compFilas = await page.locator('.competencia-fila').count();
      await shot(page, 'reporte-detalle');
      if (det > 0 && compFilas >= 12) { ok(`Detalle del colaborador con ${compFilas} competencias y sus eventos`); } else { issue(`Detalle del reporte: detalle=${det}, competencias=${compFilas}`); }
      const conMarca = (await page.locator('.detalle').textContent().catch(() => '') || '').includes(MARCA);
      if (conMarca) { ok('El evento de prueba aparece en el detalle del reporte'); } else { nota('El evento de prueba no aparece en el detalle (revisar rango por defecto)'); }
    } else { issue(`El reporte no tiene fila para ${COLAB} o falta el botón Ver`); }
  } else { issue(`No se llegó a /ReporteBitacora (url: ${page.url()})`); }

  // 9. Eliminación y limpieza
  await navMenu(page, 'Evaluaciones', 'Bitácora'); await page.waitForTimeout(2500);
  await page.locator('input[placeholder*="Buscar"]').first().fill(COLAB).catch(() => null); await page.waitForTimeout(500);
  await page.locator('.equipo-item').filter({ hasText: new RegExp(COLAB, 'i') }).first().click().catch(() => null);
  await page.waitForTimeout(2500);
  const aBorrar = page.locator('.evento-card').filter({ hasText: MARCA });
  if (await aBorrar.count() > 0) {
    await aBorrar.locator('button').filter({ hasText: 'Eliminar' }).first().click();
    await page.waitForTimeout(600);
    await shot(page, 'confirmar-eliminar');
    await page.locator('.swal2-confirm').first().click(); await page.waitForTimeout(2500); await cerrarSwal(page);
    const quedan = await page.locator('.evento-card').filter({ hasText: MARCA }).count();
    if (quedan === 0) { ok('Evento eliminado (borrado lógico) y fuera de la lista'); } else { issue('El evento sigue en la lista tras eliminar'); }
    await shot(page, 'evento-eliminado');
  } else { issue('No se encontró el evento de prueba para eliminarlo: revisar la base de prueba y borrarlo a mano'); }

  // 10. Resumen
  const md = ['# Auditoría Playwright — Bitácora de Eventos (Fase 3)', '', `Fecha: ${new Date().toISOString()}`, `Usuario: ${USUARIO} · Base: ${BASE}`, `Marcador de los datos de prueba: ${MARCA}`, '', ...resumen, ''].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'auditoria.md'), md, 'utf8');
  console.log(md);
});
