/**
 * CAPTURA MEDIO AÑO — verificación de la columna "Tipo" (pre-QA)
 *
 * Objetivo: validar en evaluacionempleado-prueba (DB evaluacion_test, que YA tiene
 * el período medio año Id 8 + objetivos + competencias) que la tabla
 * "Revisión de Objetivos del Año" muestra "Tipo" como COLUMNA (no como banda).
 *
 * NO crea períodos ni muta datos. Login + AutoEvaluación + captura + asserts.
 *
 * Ejecutar:
 *   EVAL_USERNAME=<usuario> EVAL_PASSWORD=<clave> \
 *     npx playwright test e2e/captura-medio-ano-prueba.spec.js --headed --timeout=0
 */

const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE    = process.env.EVAL_BASE || 'http://192.168.7.222/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || (() => { throw new Error('Set EVAL_USERNAME env var'); })();
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Set EVAL_PASSWORD env var'); })();
const OUT_DIR = path.join(__dirname, 'capturas-medio-ano-prueba');
const FINDINGS = [];
let   idx = 0;

// ── helpers ───────────────────────────────────────────────────────────────────
async function shot(page, label) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${String(idx++).padStart(2,'0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${path.basename(file)}`);
  return file;
}
async function vis(page, sel, ms = 4000) {
  return page.locator(sel).first().isVisible({ timeout: ms }).catch(() => false);
}
function ok(msg)   { console.log(`  ✅ ${msg}`); FINDINGS.push(`✅ ${msg}`); }
function warn(msg) { console.log(`  ⚠️  ${msg}`); FINDINGS.push(`⚠️ ${msg}`); }

async function navMenu(page, menuText, itemText) {
  if (!await vis(page, `a.dropdown-toggle:has-text("${menuText}")`)) {
    warn(`Menú "${menuText}" no visible (¿rol sin acceso?)`); return false;
  }
  await page.locator(`a.dropdown-toggle:has-text("${menuText}")`).first().click();
  await page.waitForTimeout(400);
  if (!await vis(page, `a.dropdown-item:has-text("${itemText}")`)) {
    warn(`Ítem "${itemText}" no encontrado en "${menuText}"`);
    await page.keyboard.press('Escape'); return false;
  }
  await page.locator(`a.dropdown-item:has-text("${itemText}")`).first().click();
  await page.waitForTimeout(1800);
  return true;
}

// ── TEST ──────────────────────────────────────────────────────────────────────
test('Medio Año — Tipo como columna', async ({ page }) => {
  test.setTimeout(0);
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });

  // ── PASO 1: LOGIN ──
  console.log('\n══ LOGIN ══');
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  const loginSelectors = [
    'input[type="text"]', 'input[placeholder*="usu" i]', 'input[placeholder*="céd" i]',
    'input[id*="user" i]', 'input[name*="user" i]',
    'input[formcontrolname*="user" i]', 'input[formcontrolname*="cedula" i]',
    'input[formcontrolname*="secuencial" i]',
  ];
  let loginFound = false;
  for (const sel of loginSelectors) {
    if (await vis(page, sel, 2000)) {
      await page.locator(sel).first().fill(USUARIO);
      loginFound = true; break;
    }
  }
  if (!loginFound) {
    await page.goto(`${BASE}/login`);
    await page.waitForTimeout(2000);
    for (const sel of loginSelectors) {
      if (await vis(page, sel, 2000)) { await page.locator(sel).first().fill(USUARIO); loginFound = true; break; }
    }
  }
  expect(loginFound, 'No se encontró el formulario de login').toBeTruthy();

  const allInputs = page.locator('input[type="text"], input[type="password"]');
  if (await allInputs.count() >= 2) await allInputs.nth(1).fill(CLAVE);
  if (await vis(page, 'input[type="radio"]', 1500)) await page.locator('input[type="radio"]').first().check();

  for (const sel of ['button:has-text("Entrar")', 'button[type="submit"]', 'button:has-text("Ingresar")']) {
    if (await vis(page, sel, 2000)) { await page.locator(sel).first().click(); break; }
  }
  await page.waitForTimeout(4000);
  await shot(page, 'post-login');
  ok('Login completado');

  // ── PASO 2: AUTOEVALUACIÓN (medio año activo = período 8) ──
  console.log('\n══ AUTOEVALUACIÓN ══');
  await navMenu(page, 'Evaluaciones', 'AutoEvaluación');
  await page.waitForTimeout(1500);
  await shot(page, 'lista-autoevaluacion');

  // Si hay lista, abrir la primera evaluación; si ya cargó el form, seguir
  if (!await vis(page, 'table.objetivos-table', 2500)) {
    const filas = page.locator('table tbody tr, mat-row');
    if (await filas.count() > 0) {
      await filas.first().click();
      await page.waitForTimeout(2500);
    }
  }

  // ── PASO 3: VERIFICAR TABLA DE OBJETIVOS ──
  console.log('\n══ TABLA DE OBJETIVOS ══');
  const tabla = page.locator('table.objetivos-table').first();
  const tablaVisible = await tabla.isVisible({ timeout: 6000 }).catch(() => false);

  if (!tablaVisible) {
    warn('No se encontró la tabla "Revisión de Objetivos del Año" (¿el usuario no tiene objetivos en el período medio año?)');
    await shot(page, 'sin-tabla-objetivos');
  } else {
    // Scroll a la sección y capturar
    await page.locator('h2:has-text("Revisión de Objetivos del Año")').first()
      .scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, 'tabla-objetivos');

    // 1) "Tipo" es la PRIMERA columna del encabezado
    const headers = (await tabla.locator('thead th').allInnerTexts()).map(s => s.trim());
    console.log(`  Encabezados: ${headers.join(' | ')}`);
    if (headers[0] === 'Tipo') ok('"Tipo" es la primera columna del encabezado');
    else warn(`La primera columna NO es "Tipo" (es "${headers[0]}")`);

    // 2) NO debe existir la banda agrupadora vieja
    const bandas = await tabla.locator('tr.tipo-header-row').count();
    if (bandas === 0) ok('Sin banda agrupadora vieja (tipo-header-row eliminada)');
    else warn(`Aún hay ${bandas} fila(s) banda tipo-header-row (layout viejo)`);

    // 3) Valores de la columna Tipo por fila de datos
    const filasDatos = tabla.locator('tbody tr');
    const nFilas = await filasDatos.count();
    const tipos = [];
    for (let i = 0; i < nFilas; i++) {
      const t = (await filasDatos.nth(i).locator('td').first().innerText().catch(() => '')).trim();
      if (t) tipos.push(t);
    }
    const distintos = [...new Set(tipos)];
    console.log(`  Filas: ${nFilas} | Tipos en columna: ${distintos.join(', ')}`);
    if (distintos.length > 0) ok(`Columna Tipo poblada con: ${distintos.join(', ')}`);
    else warn('La columna Tipo aparece vacía en todas las filas');

    const esperados = ['KRI', 'KPI', 'OBJETIVO', 'PROYECTO'];
    const presentes = esperados.filter(e => distintos.map(d => d.toUpperCase()).includes(e));
    console.log(`  Tipos esperados presentes: ${presentes.join(', ') || '(ninguno)'}`);
  }

  if (jsErrors.length) warn(`Errores JS en consola: ${jsErrors.slice(0,3).join(' | ')}`);
  else ok('Sin errores JS en consola');

  // ── REPORTE ──
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const md = [
    '# Verificación — Tipo como columna (Medio Año)',
    '',
    `**Ambiente:** ${BASE}`,
    '**DB:** evaluacion_test (período medio año Id 8)',
    `**Usuario prueba:** ${USUARIO}`,
    '',
    '## Resultados',
    '',
    ...FINDINGS.map(f => `- ${f}`),
    '',
    '## Capturas',
    '',
    ...fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort().map(f => `- ![${f}](./${f})`),
  ];
  fs.writeFileSync(path.join(OUT_DIR, 'resultado.md'), md.join('\n'), 'utf8');
  console.log(`\n✅ Reporte: ${path.join(OUT_DIR, 'resultado.md')}`);
});
