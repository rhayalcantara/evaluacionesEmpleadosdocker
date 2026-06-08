/**
 * AUTO Medio Año 2026
 * Script totalmente automático — sin page.pause()
 * Usa Playwright API correcta para nav Bootstrap
 * Ejecutar: npx playwright test e2e/auto-medio-ano-2026.spec.js --headed --timeout=0
 */

const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE    = 'http://192.168.7.222/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || 'CHANGE_ME';
const CLAVE   = process.env.EVAL_PASSWORD || '';
const OUT_DIR = path.join(__dirname, 'capturas-auto-2026');
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
  ISSUES.push({ cat, desc, file: file || null });
  console.log(`  ⚠️  [${cat}] ${desc}`);
}

async function ok(msg) { console.log(`  ✓  ${msg}`); }

// Cierra cualquier SweetAlert2 abierto — intenta botón OK, luego Escape, luego espera cierre
async function dismissSwal(page, label = '') {
  const swal = page.locator('.swal2-container');
  if (await swal.count() === 0) return;
  // Intentar click en botón de confirmación
  const btnOk = swal.locator('.swal2-confirm');
  if (await btnOk.count() > 0) {
    await btnOk.click().catch(() => null);
  } else {
    await page.keyboard.press('Escape');
  }
  // Esperar a que desaparezca
  await swal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(400);
  if (label) console.log(`  ✓  SweetAlert cerrado (${label})`);
}

// Navega via click en dropdown Bootstrap — usa filter({hasText}) que sí respeta acentos
async function navMenu(page, menuText, itemText) {
  // Click en el toggle del menú principal
  const toggle = page.locator('a.nav-link.dropdown-toggle').filter({ hasText: menuText });
  const count = await toggle.count();
  if (count === 0) {
    issue('Nav', `Toggle "${menuText}" no encontrado (count=0) — rolId no es 1?`);
    await shot(page, `nav-fail-${menuText.toLowerCase().replace(/\s/g,'-')}`);
    return false;
  }
  await toggle.first().click();
  await page.waitForTimeout(500);

  // Click en el ítem del dropdown
  const item = page.locator('a.dropdown-item').filter({ hasText: itemText });
  const itemCount = await item.count();
  if (itemCount === 0) {
    issue('Nav', `Ítem "${itemText}" no encontrado bajo "${menuText}"`);
    await page.keyboard.press('Escape');
    return false;
  }
  await item.first().click();
  await page.waitForTimeout(2000);
  return true;
}

// ── TEST ──────────────────────────────────────────────────────────────────────

test('Auto Medio Año 2026', async ({ page }) => {
  test.setTimeout(0);

  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('console',   m => { if (m.type() === 'error') jsErrors.push(m.text()); });

  // ══════════════════════════════════════════════════════
  // PASO 1 — Login automático
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 1: LOGIN ══');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, 'inicio');

  // Esperar formulario de login
  await page.waitForSelector('input[type="text"]', { timeout: 8000 }).catch(() => null);

  const inputs = page.locator('input[type="text"]');
  const nInputs = await inputs.count();
  console.log(`  Inputs texto encontrados: ${nInputs}`);

  if (nInputs >= 1) {
    await inputs.first().fill(USUARIO);
    await ok(`Usuario: ${USUARIO}`);
  } else {
    issue('Auth', 'Campo usuario no encontrado');
  }

  if (nInputs >= 2) {
    await inputs.nth(1).fill(CLAVE);
    await ok(`Clave llenada`);
  } else {
    // Intento con input password
    const pwdInput = page.locator('input[type="password"]');
    if (await pwdInput.count() > 0) {
      await pwdInput.first().fill(CLAVE);
      await ok('Clave llenada (type=password)');
    } else {
      issue('Auth', 'Campo clave no encontrado');
    }
  }

  // Radio Empleado
  const radios = page.locator('input[type="radio"]');
  if (await radios.count() > 0) {
    await radios.first().check();
    await ok('Radio Empleado checked');
  }

  // Submit
  const submitBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await ok('Submit clicked');
  }

  // Esperar redirect a la app principal (navbar aparece)
  await page.waitForSelector('nav.navbar', { timeout: 12000 }).catch(() => null);
  await page.waitForTimeout(2000); // esperar que Angular cargue el rol
  await shot(page, 'post-login');

  // Verificar que estamos en el home con nav completo
  const navBar = await page.locator('nav.navbar').count();
  if (navBar === 0) {
    issue('Auth', 'Navbar no visible después del login');
  } else {
    const confMenu = await page.locator('a.nav-link.dropdown-toggle').filter({ hasText: 'Configuraci' }).count();
    if (confMenu === 0) {
      issue('Auth', 'Menú Configuración ausente — usuario puede no tener rolId=1');
    } else {
      await ok('Login OK — menú Configuración visible');
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 2 — Crear período Medio Año 2026
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 2: CREAR PERÍODO ══');

  const navOk = await navMenu(page, 'Configuraci', 'Periodos');
  await shot(page, 'lista-periodos');

  if (!navOk) {
    issue('Nav', 'No se pudo llegar a /Periodo');
  } else {
    await ok('En /Periodo');

    // ¿Ya existe el período?
    const periodoExiste = await page.locator('text=Evaluación de Medio Año 2026').count() > 0
                       || await page.locator('text=Medio Año 2026').count() > 0;

    if (periodoExiste) {
      await ok('Período "Evaluación de Medio Año 2026" ya existe — saltando creación');
    } else {
      // Buscar botón Agregar
      const btnAgregar = page.locator('button').filter({ hasText: 'Agregar' });
      const nBtnAgregar = await btnAgregar.count();
      console.log(`  Botones Agregar: ${nBtnAgregar}`);

      if (nBtnAgregar === 0) {
        const file = await shot(page, 'sin-btn-agregar');
        issue('UI', 'Botón Agregar no encontrado en /Periodo', file);

        // Listar todos los botones visibles para debug
        const allBtns = await page.locator('button').allInnerTexts();
        console.log(`  Botones disponibles: ${allBtns.join(' | ')}`);
      } else {
        await btnAgregar.first().click();
        await page.waitForTimeout(1200);
        await shot(page, 'modal-agregar');

        // Llenar campos por ID
        const campos = [
          { sel: '#descripcion', val: 'Evaluación de Medio Año 2026' },
          { sel: '#fechaInicio',  val: '2026-01-01' },
          { sel: '#fechaFin',     val: '2026-06-30' },
          { sel: '#activa',       val: 'true' },
        ];

        for (const c of campos) {
          const el = page.locator(c.sel).first();
          if (await el.count() > 0) {
            await el.fill(c.val);
            await ok(`${c.sel} = ${c.val}`);
          } else {
            const file = await shot(page, `campo-ausente-${c.sel.replace('#','')}`);
            issue('Form', `Campo ${c.sel} no encontrado en el formulario`, file);
          }
        }

        // Select tipo
        const tipoSel = page.locator('#tipo').first();
        if (await tipoSel.count() > 0) {
          // Ver opciones disponibles
          const opciones = await tipoSel.locator('option').allInnerTexts();
          console.log(`  Opciones #tipo: ${opciones.join(', ')}`);
          if (opciones.some(o => o.includes('medio_ano') || o.toLowerCase().includes('medio'))) {
            await tipoSel.selectOption('medio_ano');
            await ok('tipo = medio_ano seleccionado');
          } else {
            issue('Form', `Opción "medio_ano" no encontrada. Opciones: ${opciones.join(', ')}`);
          }
        } else {
          const file = await shot(page, 'select-tipo-ausente');
          issue('Form', 'Select #tipo no encontrado — campo tipo ausente del formulario', file);
        }

        await shot(page, 'form-lleno');

        // Guardar
        const btnGuardar = page.locator('button[type="submit"]').filter({ hasText: 'Guardar' });
        const nGuardar = await btnGuardar.count();
        if (nGuardar === 0) {
          // Fallback: cualquier botón Guardar
          const anyGuardar = page.locator('button').filter({ hasText: 'Guardar' });
          if (await anyGuardar.count() > 0) {
            await anyGuardar.first().click();
          } else {
            const file = await shot(page, 'sin-btn-guardar');
            issue('UI', 'Botón Guardar no encontrado en el formulario de período', file);
          }
        } else {
          await btnGuardar.first().click();
        }

        await page.waitForTimeout(3000);

        // Detectar SweetAlert
        const swal = page.locator('.swal2-popup');
        if (await swal.count() > 0) {
          const txt    = await swal.first().innerText().catch(() => '');
          const isErr  = await page.locator('.swal2-icon-error, .swal2-icon-warning').count() > 0;
          const file   = await shot(page, isErr ? 'error-guardar' : 'ok-guardar');
          if (isErr) {
            issue('Backend', `Error al guardar período: ${txt.substring(0,200)}`, file);
          } else {
            await ok(`Período guardado OK: ${txt.substring(0,80)}`);
          }
          await dismissSwal(page, 'post-guardar');
        }

        await shot(page, 'post-guardar');

        // ¿Aparece en la lista?
        const existe = await page.locator('text=Medio Año 2026').count() > 0
                    || await page.locator('text=Evaluación de Medio Año 2026').count() > 0;
        if (existe) {
          await ok('Período visible en la lista ✓');
        } else {
          const file = await shot(page, 'lista-sin-nuevo');
          issue('Datos', 'El período nuevo no aparece en la lista tras guardar', file);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 3 — Períodos de Evaluación → generar / activar
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 3: PERÍODOS DE EVALUACIÓN ══');
  await dismissSwal(page, 'inicio-paso3'); // limpiar cualquier swal pendiente

  const navEval = await navMenu(page, 'Evaluaciones', 'Per');
  await shot(page, 'evaluation-periods');

  if (!navEval) {
    issue('Nav', 'No se pudo llegar a /evaluation-periods');
  } else {
    await ok('En /evaluation-periods');

    // Ver estado actual del período
    const titulo = await page.locator('h1, h2, .period-title, .card-title').first().innerText().catch(() => 'N/D');
    console.log(`  Período activo/mostrado: "${titulo}"`);

    // Listar todos los botones disponibles en esta vista
    const allBtns = await page.locator('button').allInnerTexts();
    console.log(`  Botones visibles: ${allBtns.filter(b => b.trim()).join(' | ')}`);

    // Buscar el período medio año para activarlo
    const periodoRows = page.locator('tr, .period-card, .card').filter({ hasText: 'Medio Año' });
    const nRows = await periodoRows.count();
    console.log(`  Filas con "Medio Año": ${nRows}`);

    if (nRows > 0) {
      await shot(page, 'periodo-medio-ano-visible');
      await ok('Período Medio Año visible en la lista');

      // Buscar botones de acción en esa fila
      const rowBtns = await periodoRows.first().locator('button').allInnerTexts();
      console.log(`  Botones en fila Medio Año: ${rowBtns.join(' | ')}`);

      // Click en el primer botón de acción (Activar / Cambiar Estado / etc.)
      const actionBtn = periodoRows.first().locator('button').first();
      if (await actionBtn.count() > 0) {
        await actionBtn.click();
        await page.waitForTimeout(2000);
        await shot(page, 'accion-periodo');

        const swal = page.locator('.swal2-popup');
        if (await swal.count() > 0) {
          const txt  = await swal.first().innerText().catch(() => '');
          const isErr = await page.locator('.swal2-icon-error, .swal2-icon-warning').count() > 0;
          await shot(page, isErr ? 'error-accion' : 'ok-accion');
          if (isErr) {
            issue('Backend', `Error al accionar período: ${txt.substring(0,200)}`);
          } else {
            await ok(`Acción OK: ${txt.substring(0,80)}`);
          }
          await dismissSwal(page, 'accion-periodo');
        }
      }
    } else {
      const file = await shot(page, 'medio-ano-no-encontrado');
      issue('Datos', 'Período "Medio Año" no aparece en /evaluation-periods después de crearlo', file);

      // Mostrar todos los períodos visibles
      const allRows = await page.locator('tr td:first-child, .card-title').allInnerTexts().catch(() => []);
      console.log(`  Períodos listados: ${allRows.join(' | ')}`);
    }

    // Buscar botón "Cambiar Estado" genérico
    const btnCambiar = page.locator('button').filter({ hasText: 'Cambiar Estado' });
    if (await btnCambiar.count() > 0) {
      await ok('Botón "Cambiar Estado" encontrado');
      await btnCambiar.first().click();
      await page.waitForTimeout(1500);
      await shot(page, 'form-cambiar-estado');

      const opts = await page.locator('select option').allInnerTexts().catch(() => []);
      console.log(`  Opciones de estado: ${opts.join(', ')}`);

      // Intentar seleccionar "Evaluando" (estado 3)
      const selEstado = page.locator('select').first();
      if (await selEstado.count() > 0) {
        await selEstado.selectOption({ label: /Evaluando/i }).catch(() => null);
        await page.waitForTimeout(500);

        const btnConfirm = page.locator('button[type="submit"], button').filter({ hasText: /confirmar|aplicar|cambiar|guardar/i }).first();
        if (await btnConfirm.count() > 0) {
          await btnConfirm.click();
          await page.waitForTimeout(2000);
          await shot(page, 'post-cambiar-estado');
        }
      }

      // Cerrar modal si sigue abierto
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      const file = await shot(page, 'sin-btn-cambiar-estado');
      issue('UI', 'Botón "Cambiar Estado" no encontrado en /evaluation-periods', file);
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 4 — AutoEvaluación — revisar evaluaciones
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 4: AUTOEVALUACIÓN ══');
  await dismissSwal(page, 'inicio-paso4');

  await navMenu(page, 'Evaluaciones', 'AutoEvaluaci');
  await page.waitForTimeout(2000);
  await shot(page, 'lista-evaluaciones');

  // Errores JS acumulados
  if (jsErrors.length > 0) {
    issue('JS', `Errores en consola: ${jsErrors.slice(0,5).join(' | ')}`);
    jsErrors.length = 0;
  }

  // Contar filas
  const filas = page.locator('table tbody tr');
  const nFilas = await filas.count();
  console.log(`  Evaluaciones en tabla: ${nFilas}`);

  if (nFilas === 0) {
    const file = await shot(page, 'lista-vacia');
    issue('Datos', 'Lista de evaluaciones vacía — no hay evaluaciones para Medio Año 2026', file);
  } else {
    await ok(`${nFilas} evaluaciones visibles`);

    // Ver texto de las primeras filas
    const primerasFilas = await filas.locator('td').allInnerTexts();
    console.log(`  Primera fila: ${primerasFilas.slice(0,4).join(' | ')}`);

    // Abrir la primera evaluación
    await filas.first().click();
    await page.waitForTimeout(3000);
    await shot(page, 'detalle-evaluacion');

    if (jsErrors.length > 0) {
      issue('JS', `Errores al abrir evaluación: ${jsErrors.slice(0,3).join(' | ')}`);
      jsErrors.length = 0;
    }

    // Revisar URL actual
    const url = page.url();
    console.log(`  URL tras click: ${url}`);

    // Verificar contenido del formulario
    const seccionesEsperadas = ['Competencias', 'Desempe', 'Metas'];
    for (const seccion of seccionesEsperadas) {
      const el = page.locator(`text=${seccion}`).first();
      if (await el.count() > 0) {
        await ok(`Sección "${seccion}" presente`);
      } else {
        issue('UI', `Sección "${seccion}" no encontrada en el formulario de evaluación`);
      }
    }

    // Verificar campos de firma/fecha (feature medio año)
    const firmaEl = page.locator('text=Firma, text=firma, input[placeholder*="irma"]').first();
    if (await firmaEl.count() > 0) {
      await ok('Campo firma presente');
    } else {
      issue('Feature', 'Campo "Firma" no visible en evaluación medio año');
    }

    await shot(page, 'detalle-evaluacion-2');
  }

  // ══════════════════════════════════════════════════════
  // PASO 5 — Vista Supervisor: Evaluar Equipo
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 5: EVALUAR EQUIPO (SUPERVISOR) ══');
  await dismissSwal(page, 'inicio-paso5');

  const navSup = await navMenu(page, 'Evaluaciones', 'Evaluar Equipo');
  await shot(page, 'evaluar-equipo');

  if (!navSup) {
    issue('Nav', '"Evaluar Equipo" no visible — usuario sin subordinados o sin rol supervisor');
  } else {
    const filasSup = page.locator('table tbody tr');
    const nFilasSup = await filasSup.count();
    console.log(`  Subordinados/evaluaciones supervisor: ${nFilasSup}`);
    if (nFilasSup === 0) {
      issue('Datos', 'Vista "Evaluar Equipo" no muestra subordinados para Medio Año 2026');
    } else {
      await ok(`${nFilasSup} filas en Evaluar Equipo`);
    }
  }

  // ══════════════════════════════════════════════════════
  // REPORTE FINAL
  // ══════════════════════════════════════════════════════
  const mdFile = path.join(OUT_DIR, 'issues-medio-ano-2026.md');
  const lines  = [
    '# Issues — Evaluación Medio Año 2026 (Prueba Automatizada)',
    '',
    `**Fecha:** ${new Date().toLocaleDateString('es-DO')}`,
    `**Ambiente:** ${BASE}`,
    `**DB:** Evaluaciones_Test`,
    `**Usuario:** ${USUARIO}`,
    '',
    '---',
    '',
  ];

  if (ISSUES.length === 0) {
    lines.push('> ✅ Sin issues detectados automáticamente. Revisar capturas para confirmación visual.');
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
  try {
    fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort()
      .forEach(f => lines.push(`- ![${f}](./${f})`));
  } catch (e) {}

  fs.writeFileSync(mdFile, lines.join('\n'), 'utf8');
  console.log(`\n✅ Reporte: ${mdFile}`);
  console.log(`   Issues:  ${ISSUES.length}`);
});
