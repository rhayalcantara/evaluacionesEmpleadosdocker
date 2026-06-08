/**
 * LOCAL Medio Año 2026 — apunta a localhost:4200
 * navMenu escopado al li.nav-item padre para no cruzar dropdowns
 * Sin page.pause() — totalmente automático
 */

const { test } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE    = 'http://localhost:4200/evaluacionempleado';
const USUARIO = process.env.EVAL_USERNAME || 'CHANGE_ME';
const CLAVE   = process.env.EVAL_PASSWORD || '';
const OUT_DIR = path.join(__dirname, 'capturas-local-2026');
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

// Cierra cualquier SweetAlert2 abierto
async function dismissSwal(page) {
  const container = page.locator('.swal2-container');
  if (await container.count() === 0) return;
  const btnOk = container.locator('.swal2-confirm');
  if (await btnOk.count() > 0) {
    await btnOk.click().catch(() => null);
  } else {
    await page.keyboard.press('Escape');
  }
  await container.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(300);
}

// navMenu escopado: busca el li.nav-item que contiene menuText, luego el item dentro de él
async function navMenu(page, menuText, itemText) {
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: menuText });
  const cnt = await navItem.count();
  if (cnt === 0) {
    issue('Nav', `Menú "${menuText}" no encontrado`);
    await shot(page, `nav-no-${menuText.toLowerCase().replace(/\s+/g,'-')}`);
    return false;
  }

  // Usar el más específico si hay varios (ej. "Evaluaciones" está en todos los que tienen esa palabra)
  const toggle = navItem.first().locator('a.nav-link.dropdown-toggle');
  await toggle.click();
  await page.waitForTimeout(500);

  const item = navItem.first().locator('a.dropdown-item').filter({ hasText: itemText });
  const itemCnt = await item.count();
  if (itemCnt === 0) {
    issue('Nav', `Ítem "${itemText}" no encontrado bajo "${menuText}"`);
    await page.keyboard.press('Escape');
    return false;
  }
  await item.first().click();
  await page.waitForTimeout(2000);
  return true;
}

// ── TEST ──────────────────────────────────────────────────────────────────────

test('Local Medio Año 2026', async ({ page }) => {
  test.setTimeout(0);

  const jsErrors = [];
  page.on('pageerror', e => { jsErrors.push(e.message); console.log(`  🔴 JS: ${e.message}`); });
  page.on('console',   m => {
    if (m.type() === 'error') { jsErrors.push(m.text()); console.log(`  🔴 CON: ${m.text()}`); }
    // Mostrar logs de debug del controller
    if (m.text().startsWith('[Periodo') || m.text().startsWith('[EvalP')) {
      console.log(`  🔵 ${m.text()}`);
    }
  });
  page.on('response', r => {
    if (r.url().includes('/api/Period') && !r.ok()) {
      console.log(`  🔴 HTTP ${r.status()} ${r.url()}`);
    }
  });

  // ══════════════════════════════════════════════════════
  // PASO 1 — Login
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 1: LOGIN ══');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, 'inicio');

  await page.waitForSelector('input', { timeout: 8000 }).catch(() => null);

  const inputs = page.locator('input[type="text"]');
  const nInputs = await inputs.count();
  if (nInputs >= 1) {
    await inputs.first().fill(USUARIO);
    await ok(`Usuario: ${USUARIO}`);
  }

  const pwdInputs = page.locator('input[type="password"]');
  if (await pwdInputs.count() > 0) {
    await pwdInputs.first().fill(CLAVE);
    await ok('Clave (type=password)');
  } else if (nInputs >= 2) {
    await inputs.nth(1).fill(CLAVE);
    await ok('Clave (type=text)');
  }

  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) { await radio.check(); }

  const btnEntrar = page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first();
  if (await btnEntrar.count() > 0) {
    await btnEntrar.click();
    await ok('Submit');
  }

  await page.waitForSelector('nav.navbar', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);
  await shot(page, 'post-login');

  const confMenu = await page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' }).count();
  if (confMenu === 0) {
    issue('Auth', 'Menú Configuración no visible — rol no es admin');
  } else {
    await ok('Login OK — menús admin visibles');
  }

  // ══════════════════════════════════════════════════════
  // PASO 2 — Crear período Medio Año 2026
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 2: CREAR PERÍODO ══');
  await dismissSwal(page);

  await navMenu(page, 'Configuraci', 'Periodos');
  await shot(page, 'lista-periodos');

  const yaExiste = await page.locator('text=Medio Año 2026').count() > 0;
  if (yaExiste) {
    await ok('Período Medio Año 2026 ya existe — saltar creación');
  } else {
    const btnAgregar = page.locator('button').filter({ hasText: 'Agregar' });
    if (await btnAgregar.count() === 0) {
      issue('UI', 'Botón Agregar no encontrado', await shot(page, 'sin-agregar'));
    } else {
      await btnAgregar.first().click();
      await page.waitForTimeout(1000);
      await shot(page, 'modal-nuevo');

      const campos = [
        { sel: '#descripcion', val: 'Evaluación de Medio Año 2026' },
        { sel: '#fechaInicio',  val: '2026-01-01' },
        { sel: '#fechaFin',     val: '2026-06-30' },
        { sel: '#activa',       val: 'true' },
      ];
      for (const c of campos) {
        const el = page.locator(c.sel).first();
        if (await el.count() > 0) { await el.fill(c.val); await ok(`${c.sel}=${c.val}`); }
        else { issue('Form', `Campo ${c.sel} no encontrado`); }
      }

      // Select tipo
      const tipoSel = page.locator('#tipo').first();
      if (await tipoSel.count() > 0) {
        const opciones = await tipoSel.locator('option').allInnerTexts();
        console.log(`  Opciones tipo: ${opciones.join(' | ')}`);
        await tipoSel.selectOption('medio_ano');
        await ok('tipo=medio_ano');
      } else {
        issue('Form', 'Select #tipo no encontrado');
      }

      await shot(page, 'form-lleno');

      const btnGuardar = page.locator('button').filter({ hasText: /Guardar/i });
      if (await btnGuardar.count() > 0) {
        await btnGuardar.first().click();
        await page.waitForTimeout(3000);
      }

      // Capturar y cerrar SweetAlert
      const swal = page.locator('.swal2-popup');
      if (await swal.count() > 0) {
        const txt   = await swal.first().innerText().catch(() => '');
        const isErr = await page.locator('.swal2-icon-error, .swal2-icon-warning').count() > 0;
        await shot(page, isErr ? 'error-guardar' : 'ok-guardar');
        if (isErr) { issue('Backend', `Error guardar período: ${txt.substring(0,200)}`); }
        else       { await ok(`Guardado: ${txt.substring(0,60)}`); }
        await dismissSwal(page);
      }

      await shot(page, 'post-guardar');
      const aparece = await page.locator('text=Medio Año 2026').count() > 0;
      if (!aparece) { issue('Datos', 'Período guardado pero NO aparece en la lista'); }
      else          { await ok('Período visible en lista ✓'); }
    }
  }

  // ══════════════════════════════════════════════════════
  // PASO 3 — Períodos de Evaluación → activar + cambiar estado
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 3: PERÍODOS DE EVALUACIÓN ══');
  await dismissSwal(page);

  await navMenu(page, 'Evaluaciones', 'Períodos de Evaluación');
  await shot(page, 'evaluation-periods');

  // Capturar logs de GetActivo (ya agregados al componente)
  await page.waitForTimeout(1500);

  const titulo = await page.locator('h1, h2, h3, .card-title').first().innerText().catch(() => 'N/D');
  console.log(`  Período mostrado: "${titulo}"`);

  const allBtns = await page.locator('button:visible').allInnerTexts();
  console.log(`  Botones: ${allBtns.filter(b=>b.trim()).join(' | ')}`);

  // Buscar botón Cambiar Estado
  const btnCambiar = page.locator('button').filter({ hasText: /Cambiar Estado/i });
  if (await btnCambiar.count() > 0) {
    await ok('Botón Cambiar Estado encontrado');
    await btnCambiar.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'form-cambiar-estado');

    const opts = await page.locator('select option, mat-option').allInnerTexts().catch(() => []);
    console.log(`  Opciones estado: ${opts.join(', ')}`);

    // Seleccionar "Evaluando"
    const sel = page.locator('select').first();
    if (await sel.count() > 0) {
      await sel.selectOption({ index: 1 }).catch(() => null);
      await page.waitForTimeout(300);
    }

    const btnConfirm = page.locator('button').filter({ hasText: /confirmar|cambiar|aplicar|guardar/i }).first();
    if (await btnConfirm.count() > 0) {
      await btnConfirm.click();
      await page.waitForTimeout(2000);
    }

    await dismissSwal(page);
    await shot(page, 'post-cambiar-estado');
  } else {
    issue('UI', 'Botón Cambiar Estado no encontrado');
    await shot(page, 'sin-cambiar-estado');
  }

  // ══════════════════════════════════════════════════════
  // PASO 4 — AutoEvaluación — ver evaluaciones generadas
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 4: AUTOEVALUACIÓN ══');
  await dismissSwal(page);

  await navMenu(page, 'Evaluaciones', 'AutoEvaluación');
  await page.waitForTimeout(2500);
  await shot(page, 'lista-evaluaciones');

  if (jsErrors.length > 0) {
    issue('JS', `Errores en consola al cargar evaluaciones: ${jsErrors.slice(0,3).join(' | ')}`);
    jsErrors.length = 0;
  }

  const filas = page.locator('table tbody tr');
  const nFilas = await filas.count();
  console.log(`  Evaluaciones en tabla: ${nFilas}`);

  if (nFilas === 0) {
    issue('Datos', 'Lista de evaluaciones vacía — no hay evaluaciones generadas para Medio Año 2026',
          await shot(page, 'lista-vacia'));
  } else {
    await ok(`${nFilas} evaluaciones en lista`);

    // Encabezados de columnas
    const headers = await page.locator('table thead th').allInnerTexts().catch(() => []);
    console.log(`  Columnas: ${headers.join(' | ')}`);

    // Abrir primera evaluación
    await filas.first().click();
    await page.waitForTimeout(3000);
    await shot(page, 'form-evaluacion');

    if (jsErrors.length > 0) {
      issue('JS', `Errores al abrir evaluación: ${jsErrors.slice(0,3).join(' | ')}`);
      jsErrors.length = 0;
    }

    console.log(`  URL: ${page.url()}`);

    // Verificar secciones del formulario
    const secciones = ['Competencias', 'Desempeño', 'Metas'];
    for (const s of secciones) {
      const el = page.locator(`text=${s}`).first();
      if (await el.count() > 0) { await ok(`Sección "${s}" presente`); }
      else { issue('UI', `Sección "${s}" no visible en formulario evaluación`); }
    }

    // Verificar campo firma (feature medio año)
    const hasFirma = await page.locator('[id*="firma"], [formcontrolname*="firma"], input[placeholder*="irma"]').count() > 0
                  || await page.locator('label').filter({ hasText: /firma/i }).count() > 0;
    if (!hasFirma) { issue('Feature', 'Campo firma/fecha no visible — feature medio año incompleto'); }
    else           { await ok('Campo firma visible ✓'); }

    await shot(page, 'form-evaluacion-detalle');
  }

  // ══════════════════════════════════════════════════════
  // PASO 5 — Evaluar Equipo (vista supervisor)
  // ══════════════════════════════════════════════════════
  console.log('\n══ PASO 5: EVALUAR EQUIPO ══');
  await dismissSwal(page);

  await navMenu(page, 'Evaluaciones', 'Evaluar Equipo');
  await page.waitForTimeout(2000);
  await shot(page, 'evaluar-equipo');

  const filasSup = page.locator('table tbody tr');
  const nSup = await filasSup.count();
  console.log(`  Filas Evaluar Equipo: ${nSup}`);
  if (nSup === 0) {
    issue('Datos', 'Evaluar Equipo vacío — sin subordinados o evaluaciones no generadas');
  }

  // ══════════════════════════════════════════════════════
  // REPORTE
  // ══════════════════════════════════════════════════════
  const mdFile = path.join(OUT_DIR, 'issues-medio-ano-2026.md');
  const lines  = [
    '# Issues — Evaluación Medio Año 2026 (local dev)',
    '',
    `**Fecha:** ${new Date().toLocaleDateString('es-DO')}`,
    `**Ambiente:** ${BASE} → API :7071 → DB Evaluaciones_Test`,
    `**Usuario:** ${USUARIO}`,
    '',
    '---',
    '',
  ];

  if (ISSUES.length === 0) {
    lines.push('> ✅ Sin issues detectados. Revisar capturas.');
  } else {
    lines.push(`## Issues (${ISSUES.length})`);
    lines.push('');
    ISSUES.forEach((iss, i) => {
      lines.push(`### ${i+1}. [${iss.cat}] ${iss.desc}`);
      if (iss.file) lines.push(`![captura](./${path.basename(iss.file)})`);
      lines.push('');
    });
  }

  lines.push('---', '', '## Capturas', '');
  try {
    fs.readdirSync(OUT_DIR).filter(f=>f.endsWith('.png')).sort()
      .forEach(f=>lines.push(`- ![${f}](./${f})`));
  } catch(e){}

  fs.writeFileSync(mdFile, lines.join('\n'), 'utf8');
  console.log(`\n✅ Reporte: ${mdFile}`);
  console.log(`   Issues:  ${ISSUES.length}`);
});
