/**
 * PRUEBA MEDIO AÑO 2026
 * Login automático + navegación SPA por clicks de menú (sin page.goto post-login)
 * Ejecutar: npx playwright test e2e/prueba-medio-ano-2026.spec.js --headed --timeout=0
 */

const { test } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE    = 'http://192.168.7.222/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || 'CHANGE_ME';
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Set EVAL_PASSWORD env var'); })();
const OUT_DIR = path.join(__dirname, 'capturas-medio-ano-2026');
const ISSUES  = [];
let   idx = 0;

// ── helpers ───────────────────────────────────────────────────────────────────

async function shot(page, label) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${String(idx++).padStart(2,'0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${path.basename(file)}`);
  return file;
}

function issue(cat, desc, file) {
  ISSUES.push({ cat, desc, file });
  console.log(`  ⚠️  [${cat}] ${desc}`);
}

async function ok(msg) { console.log(`  ✅ ${msg}`); }

async function vis(page, sel, ms = 4000) {
  return page.locator(sel).first().isVisible({ timeout: ms }).catch(() => false);
}

// Navega dentro de la SPA usando clicks de menú (no page.goto)
async function navMenu(page, menuText, itemText) {
  const toggle = page.locator(`a.dropdown-toggle:has-text("${menuText}")`).first();
  if (!await vis(page, `a.dropdown-toggle:has-text("${menuText}")`)) {
    issue('Nav', `Menú "${menuText}" no visible — ¿el usuario no tiene rolId=1?`);
    return false;
  }
  await toggle.click();
  await page.waitForTimeout(400);
  const item = page.locator(`a.dropdown-item:has-text("${itemText}")`).first();
  if (!await vis(page, `a.dropdown-item:has-text("${itemText}")`)) {
    issue('Nav', `Ítem "${itemText}" no encontrado en menú "${menuText}"`);
    await page.keyboard.press('Escape');
    return false;
  }
  await item.click();
  await page.waitForTimeout(1800);
  return true;
}

// ── TEST ──────────────────────────────────────────────────────────────────────

test('Medio Año 2026', async ({ page }) => {
  test.setTimeout(0);

  // Capturar errores JS
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push(m.text()); });

  // ══════════════════════════════════════════════════════
  // PASO 1 — Login automático
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 1: LOGIN ══');
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  await shot(page, 'inicio');

  // Detectar si hay formulario de login
  const loginSelectors = [
    'input[type="text"]',
    'input[placeholder*="usu" i]',
    'input[placeholder*="céd" i]',
    'input[id*="user" i]',
    'input[name*="user" i]',
    'input[formcontrolname*="user" i]',
    'input[formcontrolname*="cedula" i]',
    'input[formcontrolname*="secuencial" i]',
  ];

  let loginFound = false;
  for (const sel of loginSelectors) {
    if (await vis(page, sel, 2000)) {
      loginFound = true;
      console.log(`  Login form detectado (selector: ${sel})`);
      await page.locator(sel).first().fill(USUARIO);
      break;
    }
  }

  if (!loginFound) {
    // Intentar navegar a la ruta de login
    await page.goto(`${BASE}/login`);
    await page.waitForTimeout(2000);
    await shot(page, 'login-page');
    for (const sel of loginSelectors) {
      if (await vis(page, sel, 2000)) {
        loginFound = true;
        await page.locator(sel).first().fill(USUARIO);
        break;
      }
    }
  }

  if (loginFound) {
    // Clave: puede ser text o password — llenar el segundo input de texto
    const allInputs = page.locator('input[type="text"], input[type="password"]');
    const nInputs   = await allInputs.count();
    if (nInputs >= 2) {
      await allInputs.nth(1).fill(CLAVE);
      ok(`Clave llenada (input #2 de ${nInputs})`);
    } else {
      issue('Form', 'No se encontró el campo Clave en el login');
    }

    // Radio "Empleado" (seleccionar explícitamente)
    const radioEmp = page.locator('input[type="radio"]').first();
    if (await vis(page, 'input[type="radio"]', 1500)) {
      await radioEmp.check();
      ok('Tipo de Usuario: Empleado seleccionado');
    }

    // Submit — el botón dice "Entrar"
    const submitSelectors = ['button:has-text("Entrar")', 'button[type="submit"]', 'button:has-text("Ingresar")', 'button:has-text("Login")'];
    for (const sel of submitSelectors) {
      if (await vis(page, sel, 2000)) {
        await page.locator(sel).first().click();
        ok(`Submit: ${sel}`);
        break;
      }
    }
    await page.waitForTimeout(4000);
    await shot(page, 'post-login');
    ok('Login completado');
  } else {
    // Ya está logueado o el login es externo
    if (await vis(page, 'text=LogOut, text=logout, a:has-text("Salir")', 1500)) {
      ok('Sesión ya activa');
    } else {
      issue('Auth', 'No se detectó formulario de login ni sesión activa');
      console.log('  👉 Inicia sesión manualmente y presiona RESUME.');
      await page.pause();
      await shot(page, 'post-login-manual');
    }
  }

  // Verificar que Home cargó
  if (!await vis(page, 'text=Bienvenidos, a:has-text("Inicio"), .navbar', 3000)) {
    issue('Auth', 'Home no cargó después del login');
    await shot(page, 'home-no-cargo');
  } else {
    ok('Home cargado correctamente');
  }
  await shot(page, 'home');

  // ══════════════════════════════════════════════════════
  // PASO 2 — Crear período Medio Año 2026
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 2: CREAR PERÍODO ══');

  const navOk = await navMenu(page, 'Configuración', 'Periodos');
  await shot(page, 'lista-periodos');

  if (!navOk) {
    issue('Nav', 'No se pudo navegar a Periodos via menú');
  } else {
    ok('En /Periodo');

    // Clic en Agregar
    if (await vis(page, 'button:has-text("Agregar"), button.btn-outline-success')) {
      await page.locator('button:has-text("Agregar"), button.btn-outline-success').first().click();
      await page.waitForTimeout(1000);
      await shot(page, 'modal-abierto');
      ok('Modal de Agregar abierto');

      // Llenar formulario
      const campos = [
        { sel: '#descripcion',  val: 'Evaluación de Medio Año 2026', label: 'descripcion' },
        { sel: '#fechaInicio',  val: '2026-01-01', label: 'fechaInicio' },
        { sel: '#fechaFin',     val: '2026-06-30', label: 'fechaFin'   },
        { sel: '#activa',       val: 'true',       label: 'activa'     },
      ];

      for (const c of campos) {
        if (await vis(page, c.sel)) {
          await page.locator(c.sel).first().fill(c.val);
          ok(`${c.label} = ${c.val}`);
        } else {
          issue('Form', `Campo ${c.sel} no encontrado`);
        }
      }

      // Select tipo = medio_ano
      if (await vis(page, '#tipo')) {
        await page.locator('#tipo').first().selectOption('medio_ano');
        ok('tipo = medio_ano');
      } else {
        issue('Form', 'Select #tipo no encontrado — no se pudo elegir medio_ano');
      }

      await shot(page, 'form-lleno');

      // Guardar
      if (await vis(page, 'button[type="submit"]:has-text("Guardar"), button:has-text("Guardar")')) {
        await page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Guardar")').first().click();
        await page.waitForTimeout(2500);

        // Detectar SweetAlert
        if (await vis(page, '.swal2-popup', 2000)) {
          const txt    = await page.locator('.swal2-popup').first().innerText().catch(() => '');
          const isErr  = await vis(page, '.swal2-icon-error, .swal2-icon-warning');
          if (isErr) {
            issue('Backend', `Error al guardar período: ${txt.substring(0,150)}`, await shot(page, 'error-guardar'));
          } else {
            ok(`Período guardado: ${txt.substring(0,60)}`);
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(400);
        }

        await shot(page, 'post-guardar');

        // Verificar que aparece en la lista
        if (await vis(page, 'text=Evaluación de Medio Año 2026', 3000)) {
          ok('Período "Evaluación de Medio Año 2026" visible en la lista ✓');
        } else {
          issue('Datos', 'El período nuevo NO aparece en la lista después de guardar', await shot(page, 'lista-post-guardar'));
        }
      } else {
        issue('UI', 'Botón Guardar no encontrado en el formulario');
        await shot(page, 'sin-btn-guardar');
      }
    } else {
      issue('UI', 'Botón Agregar no visible en la lista de Periodos');
      await shot(page, 'sin-btn-agregar');
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 3 — Períodos de Evaluación (cambiar estado)
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 3: PERÍODOS DE EVALUACIÓN ══');

  await navMenu(page, 'Evaluaciones', 'Períodos de Evaluación');
  await shot(page, 'evaluation-periods');

  // Ver período activo
  const titulo = await page.locator('.period-title, h1').first().innerText().catch(() => '');
  console.log(`  Período activo: "${titulo}"`);
  if (titulo && !titulo.includes('2026')) {
    issue('Flujo', `Período activo sigue siendo "${titulo}" — el nuevo no quedó activo`);
  }

  const btnCambiar = page.locator('button:has-text("Cambiar Estado"), button.change-state-btn').first();
  if (await vis(page, 'button:has-text("Cambiar Estado"), button.change-state-btn')) {
    await btnCambiar.click();
    await page.waitForTimeout(1200);
    await shot(page, 'form-cambiar-estado');

    // Ver opciones disponibles
    const opts = await page.locator('select option, mat-option').allInnerTexts().catch(() => []);
    console.log(`  Opciones de estado: ${opts.join(', ') || '(ninguna detectada)'}`);
    if (opts.length === 0) {
      issue('UI', 'No se encontraron opciones de estado en el formulario de cambio');
    }

    console.log('  👉 Cambia el estado manualmente (si es necesario) y presiona RESUME.');
    await page.pause();
    await shot(page, 'post-cambio-estado');
  } else {
    issue('UI', 'Botón "Cambiar Estado" no encontrado');
    console.log('  👉 Explora manualmente la sección y presiona RESUME.');
    await page.pause();
  }

  // ══════════════════════════════════════════════════════
  // PASO 4 — Verificar evaluaciones generadas
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 4: EVALUACIONES ══');

  await navMenu(page, 'Evaluaciones', 'AutoEvaluación');
  await page.waitForTimeout(2000);
  const fEval = await shot(page, 'lista-evaluaciones');

  const filas = page.locator('table tbody tr, mat-row');
  const nFilas = await filas.count();
  console.log(`  Evaluaciones visibles: ${nFilas}`);

  if (nFilas === 0) {
    issue('Datos', 'Lista de evaluaciones vacía — no se generaron evaluaciones para Medio Año 2026', fEval);
  } else {
    // Abrir primera evaluación
    await filas.first().click();
    await page.waitForTimeout(2500);
    await shot(page, 'detalle-evaluacion');

    if (jsErrors.length > 0) {
      issue('JS', `Errores en consola: ${jsErrors.slice(0,3).join(' | ')}`);
      jsErrors.length = 0;
    }

    // Revisar secciones del formulario medio año
    const tabs = ['Competencias', 'Metas', 'Desempeño', 'Retroalimentación'];
    for (const t of tabs) {
      const el = page.locator(`[role="tab"]:has-text("${t}"), mat-tab:has-text("${t}"), button:has-text("${t}")`).first();
      if (await vis(page, `[role="tab"]:has-text("${t}"), mat-tab:has-text("${t}"), button:has-text("${t}")`)) {
        await el.click();
        await page.waitForTimeout(800);
        const f = await shot(page, `tab-${t.toLowerCase().replace(/[óé]/g, c => ({ó:'o',é:'e'}[c]))}`);
        if (await vis(page, 'text=/sin.*dato|no.*registros|vacío/i', 1500)) {
          issue('Datos', `Tab "${t}" aparece vacío`, f);
        }
      } else {
        issue('UI', `Tab "${t}" no encontrado en el formulario de evaluación`);
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 5 — Flujo completo colaborador
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 5: EXPLORACIÓN LIBRE ══');
  console.log('  👉 Navega, explora errores. RESUME al terminar.');
  await page.pause();
  await shot(page, 'final');

  // ══════════════════════════════════════════════════════
  // REPORTE MD
  // ══════════════════════════════════════════════════════
  const mdFile = path.join(OUT_DIR, 'issues-medio-ano-2026.md');
  const lines  = [
    '# Issues — Evaluación Medio Año 2026',
    '',
    `**Fecha:** ${new Date().toLocaleDateString('es-DO')}`,
    `**Ambiente:** ${BASE}`,
    `**DB:** Evaluaciones_Test`,
    `**Usuario prueba:** ${USUARIO}`,
    '',
    '---',
    '',
  ];

  if (ISSUES.length === 0) {
    lines.push('> ✅ Sin issues automáticos detectados. Revisar capturas.');
  } else {
    lines.push(`## Issues detectados (${ISSUES.length})`);
    lines.push('');
    ISSUES.forEach((iss, i) => {
      lines.push(`### ${i + 1}. [${iss.cat}] ${iss.desc}`);
      if (iss.file) lines.push(`![captura](./${path.basename(iss.file)})`);
      lines.push('');
    });
  }

  lines.push('---', '', '## Capturas en orden', '');
  fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort()
    .forEach(f => lines.push(`- ![${f}](./${f})`));

  fs.writeFileSync(mdFile, lines.join('\n'), 'utf8');
  console.log(`\n✅ Reporte: ${mdFile}`);
  console.log(`   Issues: ${ISSUES.length}`);
});
