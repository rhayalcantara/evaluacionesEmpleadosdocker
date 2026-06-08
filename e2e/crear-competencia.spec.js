/**
 * Experiencia crear competencia — documenta pain points del flujo
 * Crea UNA competencia para vivir el proceso completo
 */
const { test } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const BASE    = 'http://192.168.7.222/evaluacionempleado-prueba';
const USUARIO = process.env.EVAL_USERNAME || 'CHANGE_ME';
const CLAVE   = process.env.EVAL_PASSWORD || (() => { throw new Error('Set EVAL_PASSWORD env var'); })();
const OUT_DIR = path.join(__dirname, 'capturas-competencia');
const ISSUES  = [];
let   idx = 0;

async function shot(page, label) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${String(idx++).padStart(2,'0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${path.basename(file)}`);
  return file;
}
function issue(cat, desc) { ISSUES.push({cat,desc}); console.log(`  ⚠️  [${cat}] ${desc}`); }
async function ok(msg)     { console.log(`  ✓  ${msg}`); }
async function dismissSwal(page) {
  const c = page.locator('.swal2-container');
  if (await c.count() === 0) return;
  const btn = c.locator('.swal2-confirm');
  await (await btn.count() > 0 ? btn.click() : page.keyboard.press('Escape'));
  await c.waitFor({ state:'hidden', timeout:5000 }).catch(()=>null);
  await page.waitForTimeout(300);
}
async function navMenu(page, menuText, itemText) {
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: menuText });
  if (await navItem.count() === 0) { issue('Nav', `"${menuText}" no encontrado`); return false; }
  await navItem.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(500);
  const item = navItem.first().locator('a.dropdown-item').filter({ hasText: itemText });
  if (await item.count() === 0) { issue('Nav', `"${itemText}" no en "${menuText}"`); await page.keyboard.press('Escape'); return false; }
  await item.first().click();
  await page.waitForTimeout(2000);
  return true;
}

test('Crear competencia — pain points', async ({ page }) => {
  test.setTimeout(0);

  // Capturar errores y logs de debug
  page.on('pageerror', e => { console.log(`  🔴 JS: ${e.message}`); });
  page.on('console',   m => {
    if (m.text().startsWith('[Periodo') || m.text().startsWith('[EvalP')) console.log(`  🔵 ${m.text()}`);
  });

  // ══ LOGIN ══
  console.log('\n══ LOGIN ══');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('input', { timeout: 8000 }).catch(() => null);

  const inputs = page.locator('input[type="text"]');
  if (await inputs.count() >= 1) await inputs.first().fill(USUARIO);
  const pwd = page.locator('input[type="password"]');
  if (await pwd.count() > 0) await pwd.first().fill(CLAVE);
  else if (await inputs.count() >= 2) await inputs.nth(1).fill(CLAVE);

  const radio = page.locator('input[type="radio"]').first();
  if (await radio.count() > 0) await radio.check();
  await page.locator('button').filter({ hasText: /Entrar|Ingresar/i }).first().click();

  await page.waitForSelector('nav.navbar', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);
  await shot(page, 'home');
  await ok('Login OK');

  // ══ NAVEGAR A COMPETENCIAS ══
  console.log('\n══ PASO 1: LISTA DE COMPETENCIAS ══');
  // Exact match: "Competencias" sin "Grupo" — usa regex ^...$
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' });
  await navItem.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(500);
  // getByRole exact para no matchear "Grupo Competencias"
  const itemComp = navItem.first().locator('a.dropdown-item').filter({ hasText: /^Competencias$/ });
  if (await itemComp.count() > 0) {
    await itemComp.first().click();
    await page.waitForTimeout(2000);
    await ok('Navegado a /Objetivo (Competencias)');
  } else {
    issue('Nav', 'Ítem exacto "Competencias" no encontrado');
  }
  await shot(page, 'lista-competencias');

  // Contar cuántas hay
  const filas = page.locator('table tbody tr');
  const nFilas = await filas.count();
  console.log(`  Competencias existentes: ${nFilas}`);
  if (nFilas > 0) {
    const headers = await page.locator('table thead th').allInnerTexts().catch(() => []);
    console.log(`  Columnas tabla: ${headers.join(' | ')}`);
    const primeraFila = await filas.first().locator('td').allInnerTexts().catch(() => []);
    console.log(`  Primera fila: ${primeraFila.join(' | ')}`);
  }

  // Botones disponibles
  const btns = await page.locator('button:visible').allInnerTexts();
  console.log(`  Botones: ${btns.filter(b=>b.trim()).join(' | ')}`);

  // ══ ABRIR FORMULARIO NUEVA COMPETENCIA ══
  console.log('\n══ PASO 2: ABRIR FORMULARIO ══');
  const btnAgregar = page.locator('button').filter({ hasText: /Agregar|Nuevo|Nueva/i });
  if (await btnAgregar.count() === 0) {
    issue('UI', 'Botón Agregar/Nuevo no encontrado en pantalla de competencias');
    await shot(page, 'sin-btn-agregar');
  } else {
    await btnAgregar.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'formulario-abierto');
    await ok('Formulario abierto');

    // ══ ANÁLISIS DEL FORMULARIO ══
    console.log('\n══ PASO 3: ANÁLISIS DEL FORMULARIO ══');

    // Ver todos los campos disponibles
    const allLabels = await page.locator('label').allInnerTexts().catch(() => []);
    console.log(`  Labels del form: ${allLabels.join(' | ')}`);

    const allSelects = page.locator('select');
    const nSelects = await allSelects.count();
    console.log(`  Selects (dropdowns): ${nSelects}`);
    for (let i = 0; i < nSelects; i++) {
      const selectId = await allSelects.nth(i).getAttribute('id').catch(() => `select-${i}`);
      const opts = await allSelects.nth(i).locator('option').allInnerTexts();
      console.log(`    #${selectId}: ${opts.length} opciones → [${opts.slice(0,4).join(', ')}${opts.length>4?'...':''}]`);
    }

    // Verificar si hay select de Período
    const periodoSel = page.locator('select#periodoId, select[formcontrolname="periodoId"]');
    if (await periodoSel.count() > 0) {
      const periodos = await periodoSel.first().locator('option').allInnerTexts();
      console.log(`  Períodos disponibles: ${periodos.join(' | ')}`);
      // ¿Aparece Medio Año 2026?
      const tieneNuevo = periodos.some(p => p.includes('2026') || p.includes('Medio'));
      if (!tieneNuevo) {
        issue('Datos', `Período "Medio Año 2026" NO aparece en dropdown del form. Opciones: ${periodos.join(', ')}`);
      } else {
        await ok('Período Medio Año 2026 disponible en dropdown ✓');
      }
    } else {
      issue('Form', 'Select de Período no encontrado en el formulario');
    }

    // ══ LLENAR UNA COMPETENCIA COMPLETA ══
    console.log('\n══ PASO 4: LLENAR COMPETENCIA ══');

    // Nombre
    const campoNombre = page.locator('#nombre, input[formcontrolname="nombre"]').first();
    if (await campoNombre.count() > 0) {
      await campoNombre.fill('Enfoque al Socio');
      await ok('Nombre llenado');
    } else { issue('Form', 'Campo Nombre no encontrado'); }

    // Descripción — el textarea
    const campoDesc = page.locator('#descripcion, textarea[formcontrolname="descripcion"]').first();
    if (await campoDesc.count() > 0) {
      const descLarga = `a) Yo Escucho cuidadosamente los requerimientos, quejas y sugerencias del socio y/o cliente interno, mostrando comprensión y respeto; realizo todas las gestiones para responder a las necesidades y requerimientos del socio y/o cliente interno.\nb) Yo realizo mi trabajo, manteniendo mi enfoque en las necesidades del socio y/o en el cliente interno. Constantemente sugiero mejoras a los métodos de trabajo, y acepto responsabilidades adicionales.`;
      await campoDesc.fill(descLarga);
      await ok('Descripción llenada (2 párrafos)');

      // Medir el textarea — ¿se ve todo?
      const box = await campoDesc.boundingBox();
      console.log(`  Textarea size: ${Math.round(box?.width||0)}×${Math.round(box?.height||0)}px`);
      if ((box?.height || 0) < 60) {
        issue('UX', `Textarea descripción muy pequeño (${Math.round(box?.height||0)}px) — texto de párrafos no visible al escribir`);
      }
    } else { issue('Form', 'Textarea descripción no encontrado'); }

    await shot(page, 'form-parcialmente-lleno');

    // Período
    if (await periodoSel.count() > 0) {
      const opts = await periodoSel.first().locator('option').allInnerTexts();
      // Seleccionar cualquier período válido (el más reciente)
      const ultimoId = await periodoSel.first().locator('option').last().getAttribute('value');
      if (ultimoId && ultimoId !== '') {
        await periodoSel.first().selectOption(ultimoId);
        await ok(`Período seleccionado (id=${ultimoId})`);
      }
    }

    // Estado
    const estadoSel = page.locator('select#estadoId, select[formcontrolname="estadoId"]').first();
    if (await estadoSel.count() > 0) {
      const estadoOpts = await estadoSel.locator('option').allInnerTexts();
      console.log(`  Estados: ${estadoOpts.join(' | ')}`);
      const activoOpt = estadoOpts.find(o => /activ/i.test(o));
      if (activoOpt) {
        await estadoSel.selectOption({ label: activoOpt });
        await ok(`Estado: ${activoOpt}`);
      } else {
        await estadoSel.locator('option').last().then(async el => {
          const val = await el.getAttribute('value');
          if (val) await estadoSel.selectOption(val);
        }).catch(() => null);
      }
    }

    // Grupo Competencia
    const grupoSel = page.locator('select#grupocompetenciaid, select[formcontrolname="grupoCompetenciaId"]').first();
    if (await grupoSel.count() > 0) {
      const grupoOpts = await grupoSel.locator('option').allInnerTexts();
      console.log(`  Grupos: ${grupoOpts.join(' | ')}`);
      const primerGrupo = grupoOpts.find(o => o.trim() && o !== 'Seleccione un grupo de competencia');
      if (primerGrupo) {
        await grupoSel.selectOption({ label: primerGrupo });
        await ok(`Grupo: ${primerGrupo}`);
      }
    }

    // Fecha
    const campoFecha = page.locator('#fecha, input[formcontrolname="fecha"]').first();
    if (await campoFecha.count() > 0) {
      await campoFecha.fill('2026-06-30');
      await ok('Fecha: 2026-06-30');
    }

    await shot(page, 'form-completo');

    // Verificar estado del botón Guardar
    const btnGuardar = page.locator('button[type="submit"]');
    if (await btnGuardar.count() > 0) {
      const disabled = await btnGuardar.first().getAttribute('disabled');
      const isDisabled = disabled !== null;
      console.log(`  Botón Guardar disabled: ${isDisabled}`);
      if (isDisabled) {
        issue('UX', 'Botón Guardar sigue deshabilitado con todos los campos llenos — validación bloquea el submit');
      }
    }

    // ══ GUARDAR ══
    console.log('\n══ PASO 5: GUARDAR ══');
    const btnSave = page.locator('button').filter({ hasText: /Guardar/i }).first();
    if (await btnSave.count() > 0 && !(await btnSave.isDisabled())) {
      await btnSave.click();
      await page.waitForTimeout(2500);

      const swal = page.locator('.swal2-popup');
      if (await swal.count() > 0) {
        const txt   = await swal.first().innerText().catch(() => '');
        const isErr = await page.locator('.swal2-icon-error, .swal2-icon-warning').count() > 0;
        await shot(page, isErr ? 'error-guardar' : 'ok-guardar');
        if (isErr) { issue('Backend', `Error al guardar: ${txt.substring(0,200)}`); }
        else        { await ok(`Guardado: ${txt.substring(0,60)}`); }
        await dismissSwal(page);
      } else {
        await shot(page, 'post-guardar-sin-swal');
        issue('UX', 'No apareció SweetAlert después de guardar — no hay feedback al usuario');
      }
    } else {
      issue('UX', 'Botón Guardar deshabilitado o no encontrado — no se pudo guardar');
      await shot(page, 'guardar-bloqueado');
    }

    // ══ POST-GUARDADO — ¿Qué sigue? ══
    console.log('\n══ PASO 6: POST-GUARDADO ══');
    await shot(page, 'post-guardado-pantalla');

    // ¿El form se cerró? ¿Quedó abierto para otra competencia?
    const formSigueAbierto = await page.locator('#nombre, input[formcontrolname="nombre"]').count() > 0;
    if (formSigueAbierto) {
      issue('UX', 'El formulario queda abierto tras guardar — el usuario debe cerrar manualmente y volver a abrir para la siguiente');
    } else {
      await ok('Form cerrado post-guardado');
    }

    // ¿La lista se actualizó?
    const filasPost = await page.locator('table tbody tr').count();
    console.log(`  Filas tras guardar: ${filasPost} (antes: ${nFilas})`);
    if (filasPost === nFilas) {
      issue('UX', 'Lista de competencias NO se actualiza tras guardar — debe refrescar manualmente');
    }
  }

  // ══ REPORTE ══
  console.log('\n══ REPORTE DE PAIN POINTS ══');
  ISSUES.forEach((iss, i) => console.log(`  ${i+1}. [${iss.cat}] ${iss.desc}`));

  const mdFile = path.join(OUT_DIR, 'pain-points-competencias.md');
  const lines = [
    '# Pain Points — Creación de Competencias por Período',
    '',
    `**Contexto:** ${nFilas} competencias existentes en DB (período 7). Para Medio Año 2026 hay que recrear las 12 manualmente.`,
    '',
    '---',
    '',
    `## Issues detectados (${ISSUES.length})`,
    '',
    ...ISSUES.map((iss,i) => `### ${i+1}. [${iss.cat}] ${iss.desc}\n`),
    '---',
    '',
    '## Propuestas de mejora (para discutir)',
    '',
    '1. **Copiar competencias del período anterior** — botón "Copiar de período..." que duplique las competencias cambiando solo el periodoId',
    '2. **Creación masiva** — seleccionar múltiples competencias y asignarles el nuevo período en un solo paso',
    '3. **Textarea auto-expand** — aumentar altura mínima del textarea de descripción',
    '4. **Form con nuevo tras guardar** — limpiar el form automáticamente tras guardar para agilizar la captura en serie',
    '5. **Filtro por período en la lista** — la lista actual muestra todas las competencias de todos los períodos mezcladas',
    '',
    '---',
    '',
    '## Capturas',
    '',
    ...(() => { try { return fs.readdirSync(OUT_DIR).filter(f=>f.endsWith('.png')).sort().map(f=>`- ![${f}](./${f})`); } catch(e){ return []; } })(),
  ];
  fs.writeFileSync(mdFile, lines.join('\n'), 'utf8');
  console.log(`\n✅ Reporte: ${mdFile}`);
});
