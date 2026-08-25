/**
 * T3.3 — Verificación con Playwright del CRUD de Competencias
 * Rama: feature/crud-competencias
 *
 * Recorre la pantalla nueva "Configuración → Configuración de Competencias"
 * (ruta /configuracion-competencias, rol Administrador) y deja una captura por
 * paso en e2e/capturas-crud-competencias/, más un resumen pegable en
 * Docs/crud-competencias/03-Auditoria-Verificacion.md.
 *
 * ── DOS MODOS ────────────────────────────────────────────────────────────────
 *   EVAL_ESCRITURA=1   → recorrido COMPLETO: crea, edita, borra y clona.
 *   cualquier otro     → recorrido de SOLO LECTURA: recorre, captura y verifica
 *                        todo lo que no escriba; los pasos que escriben quedan
 *                        registrados como "omitido por modo lectura".
 *
 * ── INVOCACIÓN ───────────────────────────────────────────────────────────────
 *   # solo lectura (por defecto)
 *   $env:EVAL_USERNAME="..."; $env:EVAL_PASSWORD="..."
 *   $env:EVAL_BASE="http://localhost:4300/evaluacionempleado"
 *   npx playwright test e2e/crud-competencias.spec.js
 *
 *   # escritura
 *   $env:EVAL_ESCRITURA="1"
 *   npx playwright test e2e/crud-competencias.spec.js
 *
 * ── SEGURIDAD ────────────────────────────────────────────────────────────────
 *   - Credenciales SOLO por process.env. Nada escrito en este archivo.
 *   - Prohibido apuntar a producción: el guion aborta si la URL huele a :7070 o
 *     a http://192.168.7.222/evaluacionempleado. Solo local (ng serve
 *     --configuration prueba) contra el API de prueba :7071 / Evaluaciones_Test.
 *   - En modo escritura solo se tocan puestos de una lista blanca documentada, y
 *     el puesto 19 (GERENTE GESTION HUMANA) está explícitamente bloqueado: tiene
 *     12 metas que el API oculta (defecto A de 04-Defectos-API.md) y crearle
 *     competencias por pantalla lo dejaría con 24.
 *
 * Un paso que falla se registra con issue() y el recorrido continúa: el objetivo
 * es un informe completo, no abortar en el primer tropiezo.
 */

const { test } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

// ── Configuración de entorno ─────────────────────────────────────────────────

const BASE       = process.env.EVAL_BASE || 'http://localhost:4300/evaluacionempleado';
const USUARIO    = process.env.EVAL_USERNAME || (() => { throw new Error('Falta la variable EVAL_USERNAME'); })();
const CLAVE      = process.env.EVAL_PASSWORD || (() => { throw new Error('Falta la variable EVAL_PASSWORD'); })();
const ESCRITURA  = process.env.EVAL_ESCRITURA === '1';
const MODO       = ESCRITURA ? 'ESCRITURA' : 'SOLO LECTURA';

// Cortafuegos contra producción. No se negocia.
if (/:7070/.test(BASE) || /192\.168\.7\.222\/evaluacionempleado/.test(BASE)) {
  throw new Error(
    `EVAL_BASE apunta a producción ("${BASE}"). Esta verificación solo corre en local ` +
    `contra el API de prueba :7071. Use http://localhost:<puerto>/evaluacionempleado.`
  );
}

const OUT_DIR = path.join(__dirname, 'capturas-crud-competencias');

// Marca única de esta ejecución: va en la descripción de todo lo que cree el
// guion, para poder reconocerlo después y borrar SOLO lo suyo.
const SELLO = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
const MARCA = `[E2E-${SELLO}]`;

/**
 * Puestos donde el guion tiene permitido escribir.
 *
 * De 04-Defectos-API.md §A: de los 115 puestos con departamento 0, ocho están
 * ocupados por empleados activos (19, 33, 69, 94, 102, 221, 249, 255); de esos
 * ocho, seis esconden metas y solo DOS están genuinamente vacíos:
 *   94  ABOGADO JUNIOR
 *   102 OFICIAL DE NEGOCIOS FLOTANTE
 * Son los únicos grises donde crear competencias no puede duplicar nada.
 */
const PUESTOS_ESCRITURA_PERMITIDOS = [94, 102];

/** Puestos que el guion no toca bajo ningún concepto. */
const PUESTOS_PROHIBIDOS = [19];

// ── Estado del informe ───────────────────────────────────────────────────────

const PASOS  = [];   // { n, titulo, estado, capturas[], notas[], problemas[] }
const ISSUES = [];
let   pasoActual = null;
let   idx = 0;

// ── Helpers de registro ──────────────────────────────────────────────────────

async function shot(page, etiqueta) {
  if (!fs.existsSync(OUT_DIR)) { fs.mkdirSync(OUT_DIR, { recursive: true }); }
  const nombre = `${String(idx++).padStart(2, '0')}-${etiqueta}.png`;
  const file   = path.join(OUT_DIR, nombre);
  await page.screenshot({ path: file, fullPage: true }).catch(e => {
    console.log(`  ⚠️  no se pudo capturar "${etiqueta}": ${e.message}`);
  });
  if (pasoActual) { pasoActual.capturas.push(nombre); }
  console.log(`  📸 ${nombre}`);
  return nombre;
}

function issue(cat, desc) {
  const reg = { cat, desc, paso: pasoActual ? pasoActual.n : '-' };
  ISSUES.push(reg);
  if (pasoActual) { pasoActual.problemas.push(`[${cat}] ${desc}`); }
  console.log(`  ⚠️  [${cat}] ${desc}`);
}

async function ok(msg) {
  if (pasoActual) { pasoActual.notas.push(msg); }
  console.log(`  ✓  ${msg}`);
}

/** Dato observado que va al informe pero no es un aprobado ni un fallo. */
function nota(msg) {
  if (pasoActual) { pasoActual.notas.push(msg); }
  console.log(`  ·  ${msg}`);
}

/** Marca el paso ENTERO como no ejecutado y por qué. */
function omitir(motivo) {
  if (pasoActual) {
    pasoActual.estado = 'omitido';
    pasoActual.motivo = motivo;
    pasoActual.notas.push(`Omitido: ${motivo}`);
  }
  console.log(`  ⏭️  OMITIDO — ${motivo}`);
}

/**
 * Marca como no ejecutada UNA PARTE del paso (lo demás sí se verificó).
 * Es lo que corresponde, por ejemplo, al clonado en modo lectura: la
 * previsualización se comprueba y solo la ejecución se salta.
 */
function omitirParcial(motivo) {
  if (pasoActual) {
    if (pasoActual.estado === 'ok') { pasoActual.estado = 'parcial'; }
    pasoActual.parciales.push(motivo);
    pasoActual.notas.push(`Parte omitida: ${motivo}`);
  }
  console.log(`  ⏭️  PARTE OMITIDA — ${motivo}`);
}

const MOTIVO_LECTURA = 'modo SOLO LECTURA (EVAL_ESCRITURA distinto de "1"): escribe en la base';

/** El paso entero escribe: en modo lectura no se ejecuta nada de él. */
function omitirPorLectura() { omitir(MOTIVO_LECTURA); }

/** Solo una parte del paso escribe: el resto sí se verificó. */
function omitirParcialPorLectura(que) { omitirParcial(`${que} — ${MOTIVO_LECTURA}`); }

/**
 * Envuelve un paso: lo registra, lo ejecuta y captura cualquier excepción para
 * que el recorrido siga. Nunca deja que un tropiezo aborte el informe.
 */
async function ejecutarPaso(page, n, titulo, fn) {
  pasoActual = { n, titulo, estado: 'ok', capturas: [], notas: [], problemas: [], parciales: [], motivo: '' };
  PASOS.push(pasoActual);
  console.log(`\n══════ PASO ${n} — ${titulo} ══════`);
  try {
    await fn();
  } catch (e) {
    issue('Excepción', `El paso ${n} lanzó: ${e && e.message ? e.message : e}`);
    await shot(page, `paso${n}-excepcion`);
  }
  if (pasoActual.problemas.length > 0 && pasoActual.estado !== 'omitido') {
    pasoActual.estado = 'con problemas';
  }
  pasoActual = null;
}

// ── Helpers de interacción ───────────────────────────────────────────────────

async function dismissSwal(page) {
  const c = page.locator('.swal2-container');
  if (await c.count() === 0) { return ''; }
  const texto = await c.first().innerText().catch(() => '');
  const btn = c.locator('.swal2-confirm');
  if (await btn.count() > 0) { await btn.first().click().catch(() => null); }
  else { await page.keyboard.press('Escape').catch(() => null); }
  await c.waitFor({ state: 'hidden', timeout: 6000 }).catch(() => null);
  await page.waitForTimeout(300);
  return texto;
}

/** Devuelve el texto del SweetAlert si lo hay, sin cerrarlo. */
async function textoSwal(page) {
  const p = page.locator('.swal2-popup');
  if (await p.count() === 0) { return ''; }
  return (await p.first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
}

async function navMenu(page, menuText, itemText) {
  const navItem = page.locator('li.nav-item.dropdown').filter({ hasText: menuText });
  if (await navItem.count() === 0) {
    issue('Nav', `Menú "${menuText}" no encontrado (¿el usuario no es rol 1?)`);
    return false;
  }
  await navItem.first().locator('a.nav-link.dropdown-toggle').click();
  await page.waitForTimeout(500);
  const item = navItem.first().locator('a.dropdown-item').filter({ hasText: itemText });
  if (await item.count() === 0) {
    issue('Nav', `Ítem "${itemText}" no está bajo "${menuText}"`);
    await page.keyboard.press('Escape').catch(() => null);
    return false;
  }
  await item.first().click();
  await page.waitForTimeout(2500);
  return true;
}

/** Cambia de pestaña del mat-tab-group del shell. */
async function irAPestana(page, patron, etiqueta) {
  const tab = page.locator('[role="tab"]').filter({ hasText: patron }).first();
  if (await tab.count() === 0) {
    issue('UI', `Pestaña "${etiqueta}" no encontrada en el mat-tab-group`);
    return false;
  }
  await tab.click();
  await page.waitForTimeout(2000);
  return true;
}

/** Abre un mat-select y devuelve los textos de sus opciones. No elige nada. */
async function opcionesDe(page, selectLocator) {
  await selectLocator.click();
  await page.waitForTimeout(600);
  const opciones = page.locator('.cdk-overlay-container mat-option');
  const textos = (await opciones.allInnerTexts().catch(() => [])).map(t => t.replace(/\s+/g, ' ').trim());
  return { opciones, textos };
}

async function cerrarOverlay(page) {
  await page.keyboard.press('Escape').catch(() => null);
  await page.waitForTimeout(400);
}

/** Espera a que desaparezcan todas las barras de progreso de la pantalla. */
async function esperarQuieto(page, timeout = 90000) {
  const barra = page.locator('mat-progress-bar');
  const limite = Date.now() + timeout;
  await page.waitForTimeout(400);
  while (Date.now() < limite) {
    const n = await barra.count().catch(() => 0);
    if (n === 0) { break; }
    const visibles = await barra.filter({ visible: true }).count().catch(() => 0);
    if (visibles === 0) { break; }
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(400);
}

const limpiar = (t) => (t || '').replace(/\s+/g, ' ').trim();
const num     = (t) => { const m = limpiar(t).match(/-?[\d.]+/); return m ? Number(m[0]) : NaN; };

// ── Lectura de la tabla de puestos ───────────────────────────────────────────

/**
 * Lee el listado de puestos de la pestaña "Competencias por puesto".
 * Columnas: departamento | puesto (con #secuencial) | cantidad | peso | semáforo | acciones
 */
async function leerFilasPuestos(page) {
  const filas = page.locator('.cp-scroll table tbody tr');
  const total = await filas.count();
  const salida = [];
  for (let i = 0; i < total; i++) {
    const fila = filas.nth(i);
    const celdas = await fila.locator('td').allInnerTexts().catch(() => []);
    if (celdas.length < 5) { continue; }
    const puestoTxt = limpiar(celdas[1]);
    const m = puestoTxt.match(/#(\d+)/);
    const clase = await fila.locator('.cp-sem').first().getAttribute('class').catch(() => '') || '';
    salida.push({
      i,
      departamento: limpiar(celdas[0]),
      puesto:       puestoTxt.replace(/#\d+/, '').trim(),
      secuencial:   m ? Number(m[1]) : null,
      cantidad:     num(celdas[2]) || 0,
      peso:         num(celdas[3]) || 0,
      semaforo:     limpiar(celdas[4]),
      // 'ok' | 'falta' | 'exceso' | 'vacio' | 'desconocido'
      estado: (clase.match(/cp-(ok|falta|exceso|vacio|desconocido)\b/) || [null, 'desconocido'])[1]
    });
  }
  return salida;
}

/** Sube el tamaño de página del paginador para ver el catálogo completo. */
async function ampliarPaginador(page, tamano = 100) {
  const sel = page.locator('mat-paginator mat-select').first();
  if (await sel.count() === 0) { return false; }
  const { opciones, textos } = await opcionesDe(page, sel);
  const i = textos.findIndex(t => t === String(tamano));
  if (i < 0) { await cerrarOverlay(page); return false; }
  await opciones.nth(i).click();
  await page.waitForTimeout(800);
  return true;
}

/** Vuelve a la primera página del paginador, si no está ya en ella. */
async function primeraPagina(page) {
  const btn = page.locator('mat-paginator .mat-mdc-paginator-navigation-first').first();
  if (await btn.count() > 0 && !(await btn.isDisabled().catch(() => true))) {
    await btn.click();
    await page.waitForTimeout(600);
  }
}

/**
 * Lee TODAS las filas del listado recorriendo el paginador.
 * Imprescindible: el catálogo tiene 209 puestos y el tamaño máximo de página es
 * 100, así que quedarse con la primera página se saltaría puestos (94 y 102,
 * los únicos donde el guion tiene permitido escribir, entre ellos).
 */
async function leerTodasLasFilas(page) {
  await ampliarPaginador(page, 100);
  await primeraPagina(page);
  const todas = [];
  let guardia = 0;
  while (guardia++ < 20) {
    todas.push(...await leerFilasPuestos(page));
    const siguiente = page.locator('mat-paginator .mat-mdc-paginator-navigation-next').first();
    if (await siguiente.count() === 0) { break; }
    if (await siguiente.isDisabled().catch(() => true)) { break; }
    await siguiente.click();
    await page.waitForTimeout(700);
  }
  await primeraPagina(page);
  return todas;
}

/** Abre el detalle de un puesto usando el filtro de texto (evita paginar). */
async function abrirPuesto(page, fila) {
  if (PUESTOS_PROHIBIDOS.includes(fila.secuencial)) {
    issue('Seguridad', `Se intentó abrir el puesto ${fila.secuencial}, que está en la lista de prohibidos`);
    return false;
  }
  const filtro = page.locator('.cp-filtros input').first();
  await filtro.fill(fila.puesto.slice(0, 30));
  await page.waitForTimeout(900);
  // Filtrar no reposiciona el paginador: si veníamos de la página 2, el filtro
  // dejaría la tabla en blanco y el puesto parecería no existir.
  await primeraPagina(page);
  const candidatas = await leerFilasPuestos(page);
  const objetivo = candidatas.find(f => f.secuencial === fila.secuencial);
  if (!objetivo) {
    issue('UI', `Tras filtrar por "${fila.puesto}" no aparece el puesto #${fila.secuencial}`);
    return false;
  }
  await page.locator('.cp-scroll table tbody tr').nth(objetivo.i)
    .locator('button').filter({ hasText: /Configurar/ }).first().click();
  await esperarQuieto(page);
  await page.waitForTimeout(800);
  return true;
}

/** Lee la tabla de competencias del detalle abierto. */
async function leerFilasDetalle(page) {
  const tabla = page.locator('.cp-detalle table.cp-tabla');
  if (await tabla.count() === 0) { return []; }
  const filas = tabla.first().locator('tbody tr');
  const total = await filas.count();
  const salida = [];
  for (let i = 0; i < total; i++) {
    const celdas = await filas.nth(i).locator('td').allInnerTexts().catch(() => []);
    if (celdas.length < 3) { continue; }
    salida.push({
      i,
      competencia: limpiar(celdas[0]),
      descripcion: limpiar(celdas[1]),
      peso: num(celdas[2]) || 0
    });
  }
  return salida;
}

/** Estado y peso que muestra la cabecera del detalle. */
async function leerCabeceraDetalle(page) {
  const sem = page.locator('.cp-detalle-cab .cp-sem').first();
  if (await sem.count() === 0) { return { texto: '', estado: '', peso: NaN }; }
  const texto = limpiar(await sem.innerText().catch(() => ''));
  const clase = await sem.getAttribute('class').catch(() => '') || '';
  const mp = texto.match(/peso\s+([\d.]+)/i);
  return {
    texto,
    estado: (clase.match(/cp-(ok|falta|exceso|vacio|desconocido)\b/) || [null, ''])[1],
    peso: mp ? Number(mp[1]) : NaN
  };
}

/** Recarga el listado + detalle desde el API (nada de fiarse del estado en pantalla). */
async function releer(page) {
  const btn = page.locator('.cp-filtros button').filter({ hasText: /Actualizar/ }).first();
  if (await btn.count() > 0) { await btn.click(); }
  await esperarQuieto(page);
  await page.waitForTimeout(800);
}

// ═════════════════════════════════════════════════════════════════════════════
//                                   TEST
// ═════════════════════════════════════════════════════════════════════════════

test(`CRUD de Competencias — verificación T3.3 [${MODO}]`, async ({ page }) => {
  test.setTimeout(0);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  MODO: ${MODO.padEnd(53)}║`);
  console.log(`║  URL:  ${BASE.padEnd(53)}║`);
  console.log(`║  Marca de esta ejecución: ${MARCA.padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  if (!ESCRITURA) {
    console.log('  Los pasos 5, 6, 7, el "ejecutar" del 8 y el marcado del 9 quedarán');
    console.log('  registrados como "omitido por modo lectura".');
  }

  const erroresJs = [];
  page.on('pageerror', e => { erroresJs.push(e.message); console.log(`  🔴 JS: ${e.message}`); });
  page.on('console', m => {
    if (m.type() === 'error') { erroresJs.push(m.text()); }
  });

  // Contexto compartido entre pasos
  const ctx = {
    puestoEscritura: null,   // fila del puesto usado para el alta múltiple
    creadas: 0,              // competencias creadas por el guion
    puestoAmbar: null,       // fila usada para la prueba del semáforo verde
    diag: {},                // cifras de la pestaña Diagnóstico
    periodoTexto: ''
  };

  // ── PASO 1 — Login y navegación ────────────────────────────────────────────
  await ejecutarPaso(page, 1, 'Login y navegación por el menú hasta la pantalla nueva', async () => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 15000 }).catch(() => null);
    await shot(page, 'login');

    const texto = page.locator('input[type="text"]');
    if (await texto.count() >= 1) { await texto.first().fill(USUARIO); }
    else { issue('Login', 'No se encontró el campo de usuario'); }

    const clave = page.locator('input[type="password"]');
    if (await clave.count() > 0) { await clave.first().fill(CLAVE); }
    else if (await texto.count() >= 2) { await texto.nth(1).fill(CLAVE); }
    else { issue('Login', 'No se encontró el campo de clave'); }

    const radio = page.locator('input[type="radio"]').first();
    if (await radio.count() > 0) { await radio.check().catch(() => null); }

    await page.locator('button').filter({ hasText: /Entrar|Ingresar|Login/i }).first().click();
    await page.waitForSelector('nav.navbar', { timeout: 25000 }).catch(() => null);
    await page.waitForTimeout(2500);
    await dismissSwal(page);
    await shot(page, 'post-login');

    // El menú de administrador no está listo al terminar el login: navmenu carga
    // primero el periodo, luego el empleado y solo entonces busca el rol
    // (GET /api/EmpleadoRols, ~196 kB). Hay que esperar a que aparezca en vez de
    // suponer un tiempo fijo, o se concluye en falso que el usuario no es Admin.
    const menuConf = page.locator('li.nav-item.dropdown').filter({ hasText: 'Configuraci' });
    let menuVisible = false;
    for (let i = 0; i < 30; i++) {
      if (await menuConf.count() > 0) { menuVisible = true; break; }
      await page.waitForTimeout(1000);
    }
    if (!menuVisible) {
      const rolGuardado = await page.evaluate(() => localStorage.getItem('rol')).catch(() => null);
      issue('Auth', 'El menú "Configuración" no apareció en 30 s. rol en localStorage: ' +
                    (rolGuardado || '(no existe)') + '. Sin rol Admin el resto del recorrido no es válido.');
    } else {
      await ok(`Login correcto y menús de administrador visibles`);
    }

    const llego = await navMenu(page, 'Configuraci', 'Configuración de Competencias');
    if (!llego) {
      // OJO: no sirve navegar por URL. navmenu.component.ts:86 llama a
      // router.navigate(['Home']) al terminar de cargar el empleado, así que
      // cualquier enlace directo con recarga completa termina en Home. La única
      // navegación válida en esta app es por el menú.
      issue('Nav', 'No se pudo llegar por el menú. La navegación directa por URL no es alternativa: ' +
                   'navmenu.component.ts:86 redirige a Home en cada arranque de sesión.');
    }

    await esperarQuieto(page);
    const titulo = page.locator('h2.cc-titulo');
    if (await titulo.count() === 0) {
      issue('UI', 'No se cargó la pantalla "Configuración de Competencias" (falta h2.cc-titulo)');
    } else {
      await ok(`Pantalla abierta: "${limpiar(await titulo.first().innerText())}"`);
    }
    if (!page.url().includes('configuracion-competencias')) {
      issue('Nav', `La URL tras navegar no es la esperada: ${page.url()}`);
    }
    await shot(page, 'pantalla-configuracion-competencias');
  });

  // ── PASO 2 — Selector de periodo ───────────────────────────────────────────
  await ejecutarPaso(page, 2, 'Selector de periodo: ofrece los periodos y preselecciona el activo', async () => {
    const selector = page.locator('.cc-encabezado mat-select').first();
    if (await selector.count() === 0) {
      issue('UI', 'No hay selector de periodo en la franja del shell');
      return;
    }

    const preseleccion = limpiar(await selector.innerText().catch(() => ''));
    ctx.periodoTexto = preseleccion;
    nota(`Periodo preseleccionado: "${preseleccion}"`);
    if (!preseleccion) {
      issue('Datos', 'El selector de periodo abrió vacío: no preseleccionó ninguno');
    } else if (!/activo/i.test(preseleccion)) {
      issue('Requisito', `El periodo preseleccionado ("${preseleccion}") no está marcado como activo. ` +
                         'El shell debe abrir con el periodo activo.');
    } else {
      await ok('El periodo activo viene preseleccionado (la opción lleva el sufijo "— activo")');
    }

    const { textos } = await opcionesDe(page, selector);
    await shot(page, 'selector-periodos-desplegado');
    nota(`Periodos ofrecidos (${textos.length}): ${textos.join(' | ')}`);
    if (textos.length === 0) {
      issue('Datos', 'El selector no ofrece ningún periodo');
    } else if (textos.length < 2) {
      issue('Datos', `El selector ofrece un solo periodo (${textos[0]}); se esperaban varios en Evaluaciones_Test`);
    } else {
      await ok(`El selector ofrece ${textos.length} periodos`);
    }
    const activos = textos.filter(t => /activo/i.test(t));
    if (activos.length !== 1) {
      issue('Datos', `Se esperaba exactamente un periodo marcado como activo; hay ${activos.length}`);
    }
    await cerrarOverlay(page);
    await esperarQuieto(page);
  });

  // ── PASO 3 — Franja de resumen ─────────────────────────────────────────────
  await ejecutarPaso(page, 3, 'Franja de resumen del shell: contadores del periodo', async () => {
    await esperarQuieto(page);
    const datos = page.locator('.cc-resumen .cc-dato');
    const n = await datos.count();
    if (n === 0) {
      issue('UI', 'La franja de resumen (.cc-resumen) no se pintó');
      await shot(page, 'resumen-ausente');
      return;
    }
    const leidos = [];
    for (let i = 0; i < n; i++) {
      const et = limpiar(await datos.nth(i).locator('.cc-etiqueta').innerText().catch(() => ''));
      const va = limpiar(await datos.nth(i).locator('.cc-valor').innerText().catch(() => ''));
      leidos.push(`${et} = ${va}`);
    }
    leidos.forEach(l => nota(l));
    await shot(page, 'franja-resumen');

    const conComp = leidos.find(l => /Puestos con competencias/i.test(l));
    const conEmp  = leidos.find(l => /Puestos con empleados activos/i.test(l));
    if (!conComp || !conEmp) {
      issue('UI', 'Faltan contadores en la franja de resumen (se esperan "Puestos con competencias" y "Puestos con empleados activos")');
    } else {
      const a = num(conComp), b = num(conEmp);
      await ok(`Contadores leídos: ${a} puestos con competencias / ${b} puestos ocupados`);
      if (!(a > 0)) {
        issue('Datos', 'El contador "Puestos con competencias" es 0; en el periodo 8 de prueba deberían ser 10');
      }
      // El aviso de periodo activo debe estar si el periodo lo es
      if (/activo/i.test(ctx.periodoTexto) && await page.locator('.cc-aviso').count() === 0) {
        issue('UI', 'El periodo es el activo pero no aparece el aviso de "los cambios pueden afectar evaluaciones en curso"');
      }
    }
  });

  // ── PASO 4 — Pestaña Competencias por puesto ───────────────────────────────
  await ejecutarPaso(page, 4, 'Pestaña "Competencias por puesto": listado, semáforo, filtros y detalle', async () => {
    await irAPestana(page, /Competencias por puesto/i, 'Competencias por puesto');
    await esperarQuieto(page);
    await shot(page, 'tab-competencias-puesto');

    // 4.a — Los cuatro filtros
    const selDepto  = page.locator('.cp-filtros mat-select');
    const inpPuesto = page.locator('.cp-filtros input');
    const toggles   = page.locator('.cp-filtros mat-slide-toggle');
    const nSel = await selDepto.count(), nInp = await inpPuesto.count(), nTog = await toggles.count();
    nota(`Filtros presentes: ${nSel} select(Departamento), ${nInp} input(Puesto), ${nTog} interruptor(es)`);
    if (nSel < 1) { issue('UI', 'Falta el filtro por departamento'); }
    if (nInp < 1) { issue('UI', 'Falta el filtro por nombre de puesto'); }
    if (nTog < 2) { issue('UI', `Se esperaban 2 interruptores ("solo sin competencias" y "solo ocupados"); hay ${nTog}`); }

    // 4.b — Listado con semáforo (se recorre el paginador entero: 209 puestos)
    let filas = await leerTodasLasFilas(page);
    nota(`Filas leídas en el listado, recorriendo todas las páginas: ${filas.length}`);
    const conteo = limpiar(await page.locator('.cp-conteo').first().innerText().catch(() => ''));
    if (conteo) { nota(`Conteo que declara la pantalla: "${conteo}"`); }
    if (filas.length === 0) {
      issue('Datos', 'El listado de puestos salió vacío');
      return;
    }
    const porEstado = filas.reduce((acc, f) => { acc[f.estado] = (acc[f.estado] || 0) + 1; return acc; }, {});
    nota(`Semáforo: ${Object.entries(porEstado).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    // OJO: en el periodo 8 ningún puesto suma 100. NO es un fallo.
    if (!porEstado.ok) {
      nota('No hay ningún semáforo verde. En el periodo 8 es lo esperado: los 10 puestos ' +
           'configurados suman 96 o 99. Se prueba el verde a propósito en el paso 6.');
    }
    if (await page.locator('.cp-sem').count() === 0) {
      issue('UI', 'Ninguna fila pinta el semáforo (.cp-sem)');
    } else {
      await ok('El listado pinta el semáforo por fila');
    }

    // 4.c — Aviso de los puestos con departamento 0 (defecto A a la vista, no escondido)
    const avisos = page.locator('.cp-caja.cp-aviso');
    let textoAviso = '';
    for (let i = 0; i < await avisos.count(); i++) {
      const t = limpiar(await avisos.nth(i).innerText().catch(() => ''));
      if (/departamento/i.test(t)) { textoAviso = t; break; }
    }
    if (!textoAviso) {
      issue('Requisito', 'No aparece el aviso de los puestos con departamento 0. El defecto A del API ' +
                         'quedaría escondido: el usuario podría crear competencias duplicadas.');
    } else {
      await ok('Aviso del punto ciego del API presente');
      nota(`Texto del aviso: "${textoAviso.slice(0, 260)}…"`);
      if (!/SQL/i.test(textoAviso)) {
        issue('Requisito', 'El aviso no remite a comprobar por SQL, que es la única comprobación definitiva');
      }
    }
    await shot(page, 'listado-puestos-semaforo-y-aviso');

    // 4.d — Los filtros funcionan de verdad
    const antes = filas.length;
    await page.locator('.cp-filtros mat-slide-toggle').first().click();
    await page.waitForTimeout(900);
    await primeraPagina(page);
    const sinComp = await leerFilasPuestos(page);
    nota(`"Solo puestos sin competencias": ${antes} en total → ${sinComp.length} en la primera página`);
    if (sinComp.some(f => f.cantidad > 0)) {
      issue('Filtro', 'Con "solo puestos sin competencias" activo siguen apareciendo puestos con competencias');
    } else {
      await ok('El interruptor "solo puestos sin competencias" filtra correctamente');
    }
    const btnLimpiar = page.locator('.cp-filtros button').filter({ hasText: /Limpiar/ }).first();
    await btnLimpiar.click();
    await page.waitForTimeout(900);

    const conNombre = filas.find(f => f.cantidad > 0 && !PUESTOS_PROHIBIDOS.includes(f.secuencial));
    if (conNombre) {
      await page.locator('.cp-filtros input').first().fill(conNombre.puesto.slice(0, 12));
      await page.waitForTimeout(900);
      await primeraPagina(page);
      const filtradas = await leerFilasPuestos(page);
      nota(`Filtro por texto "${conNombre.puesto.slice(0, 12)}": ${filtradas.length} fila(s)`);
      if (filtradas.length === 0 || filtradas.length >= antes) {
        issue('Filtro', 'El filtro por nombre de puesto no acotó el listado');
      } else {
        await ok('El filtro por nombre de puesto acota el listado');
      }
      await shot(page, 'filtros-aplicados');
    }
    await btnLimpiar.click();
    await page.waitForTimeout(900);
    filas = await leerTodasLasFilas(page);

    // 4.e — Detalle de un puesto CON competencias
    const conCompetencias = filas.find(f => f.cantidad > 0 && !PUESTOS_PROHIBIDOS.includes(f.secuencial));
    if (!conCompetencias) {
      issue('Datos', 'No hay ningún puesto con competencias que abrir en el detalle');
    } else {
      const abierto = await abrirPuesto(page, conCompetencias);
      if (abierto) {
        const det = await leerFilasDetalle(page);
        const cab = await leerCabeceraDetalle(page);
        nota(`Detalle de "${conCompetencias.puesto}" (#${conCompetencias.secuencial}): ` +
             `${det.length} competencia(s), cabecera "${cab.texto}"`);
        if (det.length !== conCompetencias.cantidad) {
          issue('Datos', `El listado decía ${conCompetencias.cantidad} competencias y el detalle muestra ${det.length}`);
        } else {
          await ok('El detalle coincide con el conteo del listado');
        }
        await shot(page, 'detalle-puesto-con-competencias');
      }
    }

    // Se guardan candidatos para los pasos 5 y 6
    ctx.puestoAmbar = filas.find(f => f.estado === 'falta' && !PUESTOS_PROHIBIDOS.includes(f.secuencial)) || null;
    ctx.puestoEscritura = filas.find(f =>
      PUESTOS_ESCRITURA_PERMITIDOS.includes(f.secuencial) && f.cantidad === 0) || null;
    if (ctx.puestoAmbar) {
      nota(`Candidato ámbar para el paso 6: ${ctx.puestoAmbar.puesto} (#${ctx.puestoAmbar.secuencial}, peso ${ctx.puestoAmbar.peso})`);
    }
    if (ctx.puestoEscritura) {
      nota(`Candidato para el alta múltiple: ${ctx.puestoEscritura.puesto} (#${ctx.puestoEscritura.secuencial})`);
    }

    // Cerrar el detalle para no arrastrar estado
    const cerrar = page.locator('.cp-detalle-cab button[aria-label="Cerrar detalle"]');
    if (await cerrar.count() > 0) { await cerrar.first().click(); await page.waitForTimeout(500); }
  });

  // ── PASO 5 — Alta múltiple (solo escritura) ────────────────────────────────
  await ejecutarPaso(page, 5, 'Alta múltiple sobre un puesto gris genuinamente vacío', async () => {
    nota(`Lista blanca de escritura: puestos ${PUESTOS_ESCRITURA_PERMITIDOS.join(', ')} ` +
         '(los dos grises que 04-Defectos-API.md §A confirma genuinamente vacíos). ' +
         `Prohibido: ${PUESTOS_PROHIBIDOS.join(', ')} (puesto 19: 12 metas ocultas por el defecto A).`);

    if (!ESCRITURA) { omitirPorLectura(); await shot(page, 'alta-multiple-omitida'); return; }

    if (!ctx.puestoEscritura) {
      omitir('ninguno de los puestos de la lista blanca (94, 102) aparece vacío en el listado; ' +
             'escribir en cualquier otro sitio no es seguro');
      issue('Datos', 'No se encontró un puesto gris genuinamente vacío de la lista blanca. ' +
                     'Revisar por SQL si 94/102 siguen vacíos en el periodo elegido.');
      return;
    }
    if (PUESTOS_PROHIBIDOS.includes(ctx.puestoEscritura.secuencial)) {
      omitir('el candidato cayó en la lista de puestos prohibidos');
      return;
    }

    const p = ctx.puestoEscritura;
    if (!(await abrirPuesto(page, p))) { return; }

    const previas = await leerFilasDetalle(page);
    nota(`Estado inicial de #${p.secuencial}: ${previas.length} competencia(s) según el API`);
    if (previas.length !== 0) {
      omitir(`el puesto #${p.secuencial} ya tiene ${previas.length} fila(s); no se escribe encima`);
      return;
    }

    // Abrir el panel de alta múltiple
    const panel = page.locator('mat-expansion-panel.cp-panel');
    if (await panel.count() === 0) {
      issue('UI', 'No hay panel "Agregar competencias del catálogo"');
      return;
    }
    await panel.first().locator('mat-expansion-panel-header').click();
    await page.waitForTimeout(900);
    await shot(page, 'panel-alta-multiple-abierto');

    const catalogo = page.locator('.cp-alta');
    const nCat = await catalogo.count();
    nota(`Competencias del catálogo del periodo disponibles: ${nCat}`);
    if (nCat === 0) {
      issue('Datos', 'El catálogo del periodo está vacío: no hay nada que asignar. ' +
                     'Debe verse el aviso que remite a la pestaña "Catálogo y categorías".');
      return;
    }

    const aCrear = Math.min(2, nCat);
    for (let i = 0; i < aCrear; i++) {
      const fila = catalogo.nth(i);
      await fila.locator('mat-checkbox input').first().check().catch(() => null);
      await page.waitForTimeout(400);
      const ta = fila.locator('textarea').first();
      if (await ta.count() > 0) {
        await ta.fill(`${MARCA} Descripción de prueba automatizada T3.3 — borrar si queda huérfana.`);
      }
      const peso = fila.locator('input[type="number"]').first();
      if (await peso.count() > 0) { await peso.fill('50'); }
    }
    await page.waitForTimeout(500);
    await shot(page, 'alta-multiple-marcadas');

    const btnGuardar = page.locator('.cp-panel-acc button').filter({ hasText: /Guardar/ }).first();
    if (await btnGuardar.count() === 0 || await btnGuardar.isDisabled()) {
      issue('UI', 'El botón de guardar el lote no está disponible con competencias marcadas');
      return;
    }
    await btnGuardar.click();
    await esperarQuieto(page, 180000);
    const msg = await textoSwal(page);
    nota(`Respuesta del alta múltiple: "${msg.slice(0, 200)}"`);
    await dismissSwal(page);
    await esperarQuieto(page);
    await shot(page, 'alta-multiple-resultado');

    // Verificación de verdad: releer del API, no fiarse del 200
    await releer(page);
    if (!(await abrirPuesto(page, p))) { return; }
    const despues = await leerFilasDetalle(page);
    const mias = despues.filter(f => f.descripcion.includes(MARCA));
    ctx.creadas = mias.length;
    nota(`Tras releer: ${despues.length} fila(s) en el puesto, ${mias.length} con la marca de esta ejecución`);
    if (mias.length !== aCrear) {
      issue('Backend', `Se pidieron ${aCrear} altas y al releer solo hay ${mias.length} con la marca ${MARCA}. ` +
                       'El API responde 200 sin procesar en algunos casos: comprobar por SQL.');
    } else {
      await ok(`Las ${aCrear} competencias quedaron guardadas y se confirman releyendo del API`);
    }
    await shot(page, 'alta-multiple-verificada');
  });

  // ── PASO 6 — Edición de peso hasta el verde (solo escritura) ───────────────
  await ejecutarPaso(page, 6, 'Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde', async () => {
    nota('En el periodo 8 los 10 puestos configurados suman 96 o 99: NINGÚN semáforo verde es lo correcto, ' +
         'no un fallo. El verde se prueba ajustando un peso a propósito y luego se restaura.');

    if (!ESCRITURA) { omitirPorLectura(); return; }
    if (!ctx.puestoAmbar) {
      omitir('no se encontró ningún puesto en ámbar ("No llega a 100") que ajustar');
      return;
    }

    const p = ctx.puestoAmbar;
    await releer(page);
    if (!(await abrirPuesto(page, p))) { return; }

    const cab0 = await leerCabeceraDetalle(page);
    const det0 = await leerFilasDetalle(page);
    if (det0.length === 0) { issue('Datos', `El puesto #${p.secuencial} no tiene filas que editar`); return; }
    const delta = Math.round((100 - cab0.peso) * 100) / 100;
    nota(`Estado inicial: peso ${cab0.peso}, semáforo "${cab0.texto}" (clase cp-${cab0.estado}); falta ${delta}`);
    if (cab0.estado !== 'falta') {
      issue('Datos', `Se esperaba el puesto en ámbar y está en "${cab0.estado}"`);
    }
    await shot(page, 'peso-antes-ambar');

    const filaObjetivo = det0[0];
    const pesoOriginal = filaObjetivo.peso;
    const pesoNuevo = Math.round((pesoOriginal + delta) * 100) / 100;

    // ── ajustar a 100 ──
    const filas = page.locator('.cp-detalle table.cp-tabla tbody tr');
    await filas.nth(filaObjetivo.i).locator('td.cp-acc button').nth(0).click();   // editar
    await page.waitForTimeout(700);
    await filas.nth(filaObjetivo.i).locator('input[type="number"]').first().fill(String(pesoNuevo));
    await filas.nth(filaObjetivo.i).locator('td.cp-acc button').nth(0).click();   // guardar
    await esperarQuieto(page, 120000);
    nota(`Guardado: peso ${pesoOriginal} → ${pesoNuevo}. Respuesta: "${(await textoSwal(page)).slice(0, 140)}"`);
    await dismissSwal(page);
    await esperarQuieto(page);

    const cab1 = await leerCabeceraDetalle(page);
    nota(`Tras el ajuste: peso ${cab1.peso}, semáforo "${cab1.texto}" (clase cp-${cab1.estado})`);
    if (cab1.estado === 'ok') {
      await ok('El semáforo pasó de ámbar a VERDE al sumar exactamente 100');
    } else {
      issue('Requisito', `Con el peso en ${cab1.peso} el semáforo quedó en "${cab1.estado}" y no en verde`);
    }
    await shot(page, 'peso-ajustado-verde');

    // Confirmar en el listado, no solo en la cabecera
    await releer(page);
    await primeraPagina(page);
    const enListado = (await leerFilasPuestos(page)).find(f => f.secuencial === p.secuencial);
    if (enListado) {
      nota(`En el listado tras releer: peso ${enListado.peso}, estado ${enListado.estado} ("${enListado.semaforo}")`);
      if (enListado.estado !== 'ok') {
        issue('Requisito', 'El listado no refleja el verde tras la edición (el semáforo no se recalculó)');
      }
    }
    await shot(page, 'listado-con-verde');

    // ── restaurar el peso original ──
    if (!(await abrirPuesto(page, p))) {
      issue('Limpieza', `No se pudo reabrir #${p.secuencial} para restaurar el peso ${pesoOriginal}. ` +
                        'REVISAR A MANO: queda alterado.');
      return;
    }
    const det2 = await leerFilasDetalle(page);
    const restaurar = det2.find(f => f.competencia === filaObjetivo.competencia) || det2[0];
    await filas.nth(restaurar.i).locator('td.cp-acc button').nth(0).click();
    await page.waitForTimeout(700);
    await filas.nth(restaurar.i).locator('input[type="number"]').first().fill(String(pesoOriginal));
    await filas.nth(restaurar.i).locator('td.cp-acc button').nth(0).click();
    await esperarQuieto(page, 120000);
    await dismissSwal(page);
    await esperarQuieto(page);
    const cab2 = await leerCabeceraDetalle(page);
    if (Math.abs(cab2.peso - cab0.peso) <= 0.5) {
      await ok(`Peso restaurado al valor original (${cab0.peso}): la base queda como estaba`);
    } else {
      issue('Limpieza', `El peso quedó en ${cab2.peso} y el original era ${cab0.peso}. REVISAR A MANO.`);
    }
    await shot(page, 'peso-restaurado');
  });

  // ── PASO 7 — Borrado con confirmación (solo escritura) ─────────────────────
  await ejecutarPaso(page, 7, 'Borrado con confirmación de las filas creadas por el guion', async () => {
    if (!ESCRITURA) { omitirPorLectura(); return; }
    if (!ctx.puestoEscritura || ctx.creadas === 0) {
      omitir('el paso 5 no llegó a crear ninguna fila, así que no hay nada propio que borrar');
      return;
    }

    const p = ctx.puestoEscritura;
    await releer(page);
    if (!(await abrirPuesto(page, p))) { return; }

    let restantes = (await leerFilasDetalle(page)).filter(f => f.descripcion.includes(MARCA));
    nota(`Filas propias a borrar en #${p.secuencial}: ${restantes.length}`);
    await shot(page, 'borrado-antes');

    let borradas = 0;
    let vueltas = 0;
    while (restantes.length > 0 && vueltas < 10) {
      vueltas++;
      const objetivo = restantes[0];
      const filas = page.locator('.cp-detalle table.cp-tabla tbody tr');
      await filas.nth(objetivo.i).locator('td.cp-acc button').nth(1).click();   // eliminar
      await page.waitForTimeout(900);

      const dialogo = page.locator('mat-dialog-container');
      if (await dialogo.count() === 0) {
        issue('Requisito', 'El borrado NO pidió confirmación: no apareció el diálogo');
        break;
      }
      const textoDialogo = limpiar(await dialogo.first().innerText().catch(() => ''));
      if (borradas === 0) {
        await ok('El borrado pide confirmación con ConfirmDialogComponent');
        nota(`Texto de la confirmación: "${textoDialogo.slice(0, 260)}"`);
        if (/activo/i.test(ctx.periodoTexto) && !/PERIODO ACTIVO/i.test(textoDialogo)) {
          issue('Requisito', 'Se está en el periodo activo y la confirmación no avisa de las evaluaciones en curso');
        }
        await shot(page, 'borrado-confirmacion');
      }
      await dialogo.locator('button').filter({ hasText: /^S[ií]$/ }).first().click();
      await esperarQuieto(page, 120000);
      await dismissSwal(page);
      await esperarQuieto(page);
      borradas++;
      restantes = (await leerFilasDetalle(page)).filter(f => f.descripcion.includes(MARCA));
    }

    // Verificación releyendo del API
    await releer(page);
    if (!(await abrirPuesto(page, p))) { return; }
    const quedan = (await leerFilasDetalle(page)).filter(f => f.descripcion.includes(MARCA));
    nota(`Borradas ${borradas}; tras releer quedan ${quedan.length} filas con la marca ${MARCA}`);
    if (quedan.length === 0) {
      await ok('Las filas creadas por el guion desaparecieron y la relectura lo confirma');
    } else {
      issue('Backend', `Quedan ${quedan.length} filas marcadas ${MARCA} tras el borrado. ` +
                       'LIMPIAR A MANO por SQL en Evaluaciones_Test.');
    }
    await shot(page, 'borrado-verificado');
  });

  // ── PASO 8 — Clonado: previsualizar siempre, ejecutar solo en escritura ────
  await ejecutarPaso(page, 8, 'Clonado: previsualización (los dos modos) y ejecución (solo escritura)', async () => {
    const btnClonar = page.locator('.cp-filtros button').filter({ hasText: /Clonar/ }).first();
    if (await btnClonar.count() === 0) {
      issue('UI', 'No hay botón "Clonar…" en la pestaña de competencias por puesto');
      return;
    }
    await btnClonar.click();
    await page.waitForTimeout(1200);

    const dialogo = page.locator('mat-dialog-container');
    if (await dialogo.count() === 0) {
      issue('UI', 'El botón "Clonar…" no abrió ningún diálogo');
      return;
    }
    await shot(page, 'clonado-dialogo-abierto');

    const selects = dialogo.locator('mat-select');   // 0=periodo origen, 1=puesto origen, 2=puesto destino
    nota(`Selectores del diálogo de clonado: ${await selects.count()} (periodo origen, puesto origen, puesto destino)`);

    // La previsualización NO escribe: se ejecuta en los dos modos.
    const btnPrev = dialogo.locator('button').filter({ hasText: /Previsualizar/ }).first();
    if (await btnPrev.count() === 0) {
      issue('UI', 'El diálogo no ofrece "Previsualizar"');
      return;
    }
    if (await btnPrev.isDisabled()) {
      issue('UI', '"Previsualizar" está deshabilitado nada más abrir: no hay periodo de origen preseleccionado');
    }

    const btnEjec = dialogo.locator('button').filter({ hasText: /Ejecutar clonado/ }).first();
    if (await btnEjec.count() > 0 && !(await btnEjec.isDisabled())) {
      issue('Requisito', '"Ejecutar clonado" está habilitado ANTES de previsualizar: se podría escribir a ciegas');
    } else {
      await ok('"Ejecutar clonado" nace deshabilitado: no se puede escribir sin previsualizar');
    }

    await btnPrev.click();
    // La previsualización recorre las metas existentes: puede tardar bastante.
    await esperarQuieto(page, 300000);
    await page.waitForTimeout(1500);
    await shot(page, 'clonado-previsualizacion');

    const cifras = dialogo.locator('.dc-cifra');
    const nCifras = await cifras.count();
    if (nCifras < 3) {
      const err = limpiar(await dialogo.locator('.dc-peligro').first().innerText().catch(() => ''));
      issue('Requisito', `La previsualización no muestra las tres cifras (hay ${nCifras}). ` +
                         (err ? `Mensaje en pantalla: "${err.slice(0, 200)}"` : ''));
    } else {
      const leidas = [];
      for (let i = 0; i < nCifras; i++) { leidas.push(limpiar(await cifras.nth(i).innerText())); }
      leidas.forEach(c => nota(`Cifra: ${c.replace(/\n/g, ' ')}`));
      await ok('La previsualización muestra las tres cifras (se crearían / se saltan / advertencias)');
    }

    const avisos = dialogo.locator('.dc-caja.dc-aviso, .dc-caja.dc-peligro');
    const nAvisos = await avisos.count();
    if (nAvisos === 0) {
      issue('Requisito', 'La previsualización no muestra ninguna advertencia. El defecto A del API ' +
                         '(clonado de periodo completo que copia de menos en silencio) quedaría escondido.');
    } else {
      for (let i = 0; i < nAvisos; i++) {
        nota(`Advertencia: "${limpiar(await avisos.nth(i).innerText()).slice(0, 220)}"`);
      }
      const todo = limpiar(await dialogo.first().innerText());
      if (/departamento/i.test(todo) && /0/.test(todo)) {
        await ok('El diálogo advierte del punto ciego de los puestos con departamento 0');
      } else {
        issue('Requisito', 'Ninguna advertencia menciona los puestos con departamento 0');
      }
    }

    const chkAvisos = dialogo.locator('mat-checkbox');
    if (await chkAvisos.count() > 0) {
      await ok('Hay que marcar "He leído las advertencias" antes de poder ejecutar');
    }

    // ── ejecución ──
    if (!ESCRITURA) {
      omitirParcialPorLectura('ejecución del clonado (la previsualización sí se verificó: no escribe)');
      await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
      await page.waitForTimeout(800);
      return;
    }

    // En escritura solo se ejecuta contra un puesto destino de la lista blanca y
    // partiendo de un detalle vacío, para poder deshacerlo entero después.
    const destinoSeguro = ctx.puestoEscritura;
    if (!destinoSeguro) {
      omitirParcial('ejecución del clonado: no hay puesto de destino de la lista blanca (94, 102) donde ' +
                    'escribir sin ensuciar la base');
      await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
      return;
    }

    // Fijar puesto de destino = el seguro. (Selector 2 del diálogo.)
    if (await selects.count() >= 3) {
      const { opciones, textos } = await opcionesDe(page, selects.nth(2));
      const i = textos.findIndex(t => new RegExp(`\\(${destinoSeguro.secuencial}\\)\\s*$`).test(t));
      if (i < 0) {
        await cerrarOverlay(page);
        omitirParcial(`ejecución del clonado: el puesto de destino #${destinoSeguro.secuencial} no está ` +
                      'en el selector del diálogo');
        await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
        return;
      }
      await opciones.nth(i).click();
      await page.waitForTimeout(600);
      nota(`Puesto de destino fijado: ${textos[i]}`);
    }

    // Cambiar el destino invalida la previsualización: hay que rehacerla.
    await btnPrev.click();
    await esperarQuieto(page, 300000);
    await page.waitForTimeout(1500);
    await shot(page, 'clonado-previsualizacion-destino-seguro');

    const nACrear = num(await dialogo.locator('.dc-cifra').first().innerText().catch(() => '0')) || 0;
    nota(`Filas que se crearían sobre #${destinoSeguro.secuencial}: ${nACrear}`);
    if (nACrear === 0) {
      omitirParcial('ejecución del clonado: la previsualización no encontró nada que crear con esta combinación');
      await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
      return;
    }
    if (nACrear > 20) {
      omitirParcial(`ejecución del clonado: crearía ${nACrear} filas y el guion no ejecuta clonados masivos ` +
                    'en la base de prueba');
      issue('Cobertura', `Ejecución del clonado no probada: ${nACrear} filas es demasiado para deshacer con garantías`);
      await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
      return;
    }

    if (await chkAvisos.count() > 0) {
      await chkAvisos.first().locator('input').check().catch(() => null);
      await page.waitForTimeout(400);
    }
    if (await btnEjec.isDisabled()) {
      issue('UI', '"Ejecutar clonado" sigue deshabilitado tras previsualizar y aceptar las advertencias');
      await dialogo.locator('button').filter({ hasText: /^Cerrar$/ }).first().click().catch(() => null);
      return;
    }
    await btnEjec.click();
    await esperarQuieto(page, 300000);
    const msg = await textoSwal(page);
    nota(`Resultado del clonado: "${msg.slice(0, 220)}"`);
    await dismissSwal(page);
    await esperarQuieto(page);
    await shot(page, 'clonado-ejecutado');

    // Verificación + limpieza: el puesto destino estaba vacío, así que todo lo
    // que haya ahora lo creó este guion y hay que quitarlo.
    await releer(page);
    if (!(await abrirPuesto(page, destinoSeguro))) {
      issue('Limpieza', `No se pudo reabrir #${destinoSeguro.secuencial} para limpiar el clonado. LIMPIAR A MANO.`);
      return;
    }
    let clonadas = await leerFilasDetalle(page);
    nota(`Tras releer, el puesto #${destinoSeguro.secuencial} tiene ${clonadas.length} fila(s)`);
    if (clonadas.length === 0) {
      issue('Backend', 'El clonado dijo haber creado filas pero al releer el puesto sigue vacío. Comprobar por SQL.');
      return;
    }
    await ok(`El clonado creó ${clonadas.length} fila(s), confirmadas releyendo del API`);
    await shot(page, 'clonado-verificado');

    let vueltas = 0;
    while (clonadas.length > 0 && vueltas < 30) {
      vueltas++;
      const filas = page.locator('.cp-detalle table.cp-tabla tbody tr');
      await filas.nth(clonadas[0].i).locator('td.cp-acc button').nth(1).click();
      await page.waitForTimeout(800);
      const dlg = page.locator('mat-dialog-container');
      if (await dlg.count() === 0) { break; }
      await dlg.locator('button').filter({ hasText: /^S[ií]$/ }).first().click();
      await esperarQuieto(page, 120000);
      await dismissSwal(page);
      await esperarQuieto(page);
      clonadas = await leerFilasDetalle(page);
    }
    if (clonadas.length === 0) {
      await ok('Limpieza terminada: el puesto de destino vuelve a estar vacío, como estaba antes');
    } else {
      issue('Limpieza', `Quedan ${clonadas.length} filas clonadas en el puesto #${destinoSeguro.secuencial}. ` +
                        'LIMPIAR A MANO por SQL en Evaluaciones_Test.');
    }
    await shot(page, 'clonado-limpieza');
  });

  // ── PASO 9 — Catálogo y categorías ─────────────────────────────────────────
  await ejecutarPaso(page, 9, 'Pestaña "Catálogo y categorías": catálogo agrupado y matriz de vinculación', async () => {
    await irAPestana(page, /Cat.logo y categor/i, 'Catálogo y categorías');
    await esperarQuieto(page, 180000);
    await shot(page, 'tab-catalogo-categorias');

    if (await page.locator('.cat-vacio').count() > 0) {
      nota('El periodo no tiene competencias en el catálogo: se muestra la explicación y la opción de copiar de otro periodo');
      await ok('El caso "catálogo vacío" se explica en vez de pintar una matriz en blanco');
      await shot(page, 'catalogo-vacio-explicado');
      omitirParcial('matriz de vinculación: el periodo no tiene competencias en el catálogo, no hay matriz que verificar');
      return;
    }

    const grupos = page.locator('.cat-bloque mat-expansion-panel');
    const comps  = page.locator('.cat-comp');
    nota(`Catálogo agrupado: ${await grupos.count()} grupo(s), ${await comps.count()} competencia(s)`);
    if (await grupos.count() === 0) {
      issue('UI', 'El catálogo no aparece agrupado por GrupoCompetencia');
    } else {
      await ok('El catálogo se muestra agrupado por grupo de competencia');
    }
    const cab = limpiar(await page.locator('.cat-bloque .cat-cab').first().innerText().catch(() => ''));
    nota(`Cabecera del catálogo: "${cab}"`);

    const matriz = page.locator('table.cat-matriz');
    if (await matriz.count() === 0) {
      issue('UI', 'No se pintó la matriz de vinculación competencia ↔ categoría');
      return;
    }
    const columnas = (await matriz.locator('thead th').allInnerTexts()).map(limpiar);
    const filasMat = matriz.locator('tbody tr');
    nota(`Matriz: ${await filasMat.count()} fila(s) × ${Math.max(columnas.length - 1, 0)} categoría(s) ` +
         `[${columnas.slice(1).join(', ')}]`);
    await ok('La matriz de vinculación se pinta con competencias en filas y categorías en columnas');
    await shot(page, 'matriz-vinculacion');

    if (!ESCRITURA) {
      omitirParcialPorLectura('marcar y desmarcar una casilla de la matriz (escribe en CompetenciaCategoriaPuesto); ' +
                              'el catálogo agrupado y la matriz sí se capturaron y verificaron');
      return;
    }

    // Buscar una casilla desmarcada para marcarla y volver a dejarla como estaba.
    let objetivo = null;
    const nFilas = await filasMat.count();
    for (let r = 0; r < nFilas && !objetivo; r++) {
      const celdas = filasMat.nth(r).locator('td mat-checkbox input');
      const nc = await celdas.count();
      for (let c = 0; c < nc; c++) {
        const marcado = await celdas.nth(c).isChecked().catch(() => true);
        const inhabilitado = await celdas.nth(c).isDisabled().catch(() => true);
        if (!marcado && !inhabilitado) { objetivo = { r, c }; break; }
      }
    }
    if (!objetivo) {
      omitirParcial('marcado de la matriz: no hay ninguna casilla desmarcada y habilitada que alternar ' +
                    'sin alterar el estado real');
      return;
    }
    const nombreComp = limpiar(await filasMat.nth(objetivo.r).locator('th').first().innerText().catch(() => ''));
    const nombreCat  = columnas[objetivo.c + 1] || `columna ${objetivo.c + 1}`;
    nota(`Casilla elegida: "${nombreComp}" × "${nombreCat}" (fila ${objetivo.r}, columna ${objetivo.c})`);

    const casilla = () => page.locator('table.cat-matriz tbody tr').nth(objetivo.r)
      .locator('td mat-checkbox input').nth(objetivo.c);

    // marcar
    await casilla().check();
    await esperarQuieto(page, 120000);
    await dismissSwal(page);
    await page.locator('.cat-barra button').filter({ hasText: /Recargar/ }).first().click();
    await esperarQuieto(page, 180000);
    const tras1 = await casilla().isChecked().catch(() => false);
    if (tras1) { await ok('Marcar la casilla creó el vínculo y la relectura lo confirma'); }
    else { issue('Backend', `Se marcó "${nombreComp}"×"${nombreCat}" y tras recargar sigue desmarcada`); }
    await shot(page, 'matriz-casilla-marcada');

    // desmarcar (deja el estado como estaba)
    await casilla().uncheck();
    await esperarQuieto(page, 120000);
    await dismissSwal(page);
    await page.locator('.cat-barra button').filter({ hasText: /Recargar/ }).first().click();
    await esperarQuieto(page, 180000);
    const tras2 = await casilla().isChecked().catch(() => true);
    if (!tras2) { await ok('Desmarcar la casilla borró el vínculo y la relectura lo confirma; estado original restaurado'); }
    else { issue('Limpieza', `La casilla "${nombreComp}"×"${nombreCat}" quedó MARCADA. Deshacer a mano.`); }
    await shot(page, 'matriz-casilla-restaurada');
  });

  // ── PASO 10 — Ponderación ──────────────────────────────────────────────────
  await ejecutarPaso(page, 10, 'Pestaña "Ponderación": valores del periodo y bloqueo si no suma 100', async () => {
    await irAPestana(page, /Ponderaci/i, 'Ponderación');
    await esperarQuieto(page, 120000);
    await shot(page, 'tab-ponderacion');

    if (await page.locator('.pnd-falta').count() > 0) {
      nota('Este periodo NO tiene ponderación configurada: la pantalla lo avisa y ofrece copiarla de otro periodo');
      await ok('El caso "sin ponderación" se detecta y se explica');
      omitirParcial('validación de la suma 100: este periodo no tiene filas de ponderación que editar; ' +
                    'crearlas sería escribir');
      await shot(page, 'ponderacion-sin-configurar');
      return;
    }

    const campos = page.locator('.pnd-fila input[type="number"]');
    if (await campos.count() < 2) {
      issue('UI', 'No se encontraron los dos campos de porcentaje');
      return;
    }
    const desempeno0 = await campos.nth(0).inputValue();
    const competencia0 = await campos.nth(1).inputValue();
    const suma0 = limpiar(await page.locator('.pnd-suma').first().innerText().catch(() => ''));
    nota(`Valores del periodo: Desempeño ${desempeno0} % / Competencia ${competencia0} % — ${suma0}`);
    if (Number(desempeno0) + Number(competencia0) === 100) {
      await ok('Los dos porcentajes del periodo suman 100');
    } else {
      issue('Datos', `La ponderación del periodo suma ${Number(desempeno0) + Number(competencia0)} y debería sumar 100`);
    }

    const btnGuardar = page.locator('.pnd-acciones button').filter({ hasText: /Guardar/ }).first();
    const habilitadoAntes = await btnGuardar.count() > 0 && !(await btnGuardar.isDisabled());
    nota(`Botón Guardar con los valores actuales: ${habilitadoAntes ? 'habilitado' : 'deshabilitado'}`);

    // Valor inválido: NO se guarda, solo se comprueba que el botón se bloquea.
    const invalido = String(Number(desempeno0) + 25);
    await campos.nth(0).fill(invalido);
    await campos.nth(0).blur().catch(() => null);
    await page.waitForTimeout(700);
    const sumaMal = limpiar(await page.locator('.pnd-suma').first().innerText().catch(() => ''));
    const bloqueado = await btnGuardar.count() > 0 ? await btnGuardar.isDisabled() : false;
    nota(`Con Desempeño=${invalido}: "${sumaMal}"; Guardar ${bloqueado ? 'deshabilitado' : 'HABILITADO'}`);
    if (bloqueado) {
      await ok('Con una suma distinta de 100 el botón Guardar queda deshabilitado (no se llegó a guardar nada)');
    } else {
      issue('Requisito', `Con la suma en ${Number(invalido) + Number(competencia0)} el botón Guardar sigue habilitado`);
    }
    await shot(page, 'ponderacion-suma-invalida');

    // Restaurar en pantalla (nunca se pulsó Guardar, así que la base no cambió)
    await campos.nth(0).fill(desempeno0);
    await page.waitForTimeout(600);
    const sumaFin = limpiar(await page.locator('.pnd-suma').first().innerText().catch(() => ''));
    nota(`Restaurado en pantalla: "${sumaFin}" (nunca se pulsó Guardar: la base no se tocó)`);
    await shot(page, 'ponderacion-restaurada');
  });

  // ── PASO 11 — Diagnóstico ──────────────────────────────────────────────────
  await ejecutarPaso(page, 11, 'Pestaña "Diagnóstico": tres listados, conteos y bloque de no verificables', async () => {
    await irAPestana(page, /Diagn.stico/i, 'Diagnóstico');
    // El diagnóstico resuelve la categoría puesto por puesto (defecto B): ~90 llamadas.
    await page.locator('.dgn-contexto').first().waitFor({ state: 'visible', timeout: 420000 }).catch(() => null);
    await esperarQuieto(page, 420000);
    await shot(page, 'tab-diagnostico');

    const contexto = limpiar(await page.locator('.dgn-contexto').first().innerText().catch(() => ''));
    if (!contexto) {
      issue('UI', 'El diagnóstico no terminó de ejecutarse (no apareció la franja de contexto)');
      return;
    }
    nota(`Contexto: ${contexto.replace(/\n/g, ' · ')}`);

    const tarjetas = page.locator('mat-card.dgn-tarjeta');
    const nT = await tarjetas.count();
    if (nT < 3) {
      issue('Requisito', `Se esperaban los tres listados del plan y hay ${nT}`);
    } else {
      await ok('Los tres listados del diagnóstico están presentes');
    }
    for (let i = 0; i < nT; i++) {
      const h = limpiar(await tarjetas.nth(i).locator('h3').first().innerText().catch(() => ''));
      const c = num(await tarjetas.nth(i).locator('.dgn-conteo').first().innerText().catch(() => ''));
      nota(`Listado ${i + 1}: "${h}" → conteo ${isNaN(c) ? '?' : c}`);
      ctx.diag[`listado${i + 1}`] = { titulo: h, conteo: c };
    }

    // ── Bloque de "no verificables": el defecto A tiene que estar a la vista ──
    const alerta = page.locator('.dgn-alerta').first();
    if (await alerta.count() === 0) {
      issue('Requisito', 'Falta la advertencia del límite conocido del listado 1. El defecto A quedaría escondido.');
    } else {
      const t = limpiar(await alerta.innerText());
      nota(`Advertencia del listado 1: "${t.slice(0, 400)}"`);
      if (!/19/.test(t) || !/GEST/i.test(t)) {
        issue('Requisito', 'La advertencia no cita el caso comprobado del puesto 19 (GERENTE GESTIÓN HUMANA)');
      } else {
        await ok('La advertencia cita el caso comprobado del puesto 19 con sus 12 competencias reales');
      }
      const mCiegos = t.match(/De los\s+(\d+)\s+puestos ocupados,\s+(\d+)/i);
      if (mCiegos) {
        ctx.diag.puestosOcupados = Number(mCiegos[1]);
        ctx.diag.puestosCiegos   = Number(mCiegos[2]);
        nota(`Puestos ocupados en pantalla: ${mCiegos[1]}; puestos invisibles para /api/Goals: ${mCiegos[2]}`);
        // Contraste con 04-Defectos-API.md §A: 115 puestos con Departmentsecuencial = 0
        if (Number(mCiegos[2]) !== 115) {
          issue('Contraste', `04-Defectos-API.md §A documenta 115 puestos con departamento 0 y la pantalla ` +
                             `muestra ${mCiegos[2]}. Reconciliar por SQL antes de dar el número por bueno.`);
        } else {
          await ok('Los 115 puestos ciegos de 04-Defectos-API.md §A coinciden con lo que muestra la pantalla');
        }
      } else {
        issue('Contraste', 'No se pudo leer de la advertencia el número de puestos invisibles para el API');
      }
    }
    await shot(page, 'diagnostico-advertencia-defecto-A');

    const noVerif = page.locator('.dgn-noverif');
    if (await noVerif.count() === 0) {
      nota('No hay bloque de "no verificables": la pantalla afirma que ningún puesto ocupado cae en esa situación');
      issue('Contraste', '04-Defectos-API.md §A documenta 8 puestos ciegos ocupados (19, 33, 69, 94, 102, 221, 249, 255). ' +
                         'Que no aparezca ninguno en el periodo elegido hay que confirmarlo por SQL.');
    } else {
      const t = limpiar(await noVerif.first().innerText());
      const cuenta = num(await noVerif.first().locator('.dgn-conteo').first().innerText().catch(() => ''));
      ctx.diag.noVerificables = cuenta;
      nota(`Bloque "no verificables": ${cuenta} puesto(s)`);
      await ok('El bloque de "no verificables" existe, va aparte del listado 1 y trae su advertencia');
      if (!/SELECT/i.test(t)) {
        issue('Requisito', 'El bloque de no verificables no ofrece la consulta SQL de comprobación');
      } else {
        await ok('El bloque incluye la consulta SQL que sí da la respuesta definitiva');
      }
      const filasNV = await noVerif.first().locator('tbody tr').allInnerTexts().catch(() => []);
      const tiene19 = filasNV.some(f => /(^|\D)19(\D|$)/.test(limpiar(f).split(' ')[0]));
      nota(`Puestos listados como no verificables: ${filasNV.map(f => limpiar(f).split(' ')[0]).join(', ')}`);
      if (tiene19) {
        await ok('El puesto 19 aparece en "no verificables": el defecto A se muestra, no se esconde');
      } else {
        issue('Requisito', 'El puesto 19 NO aparece en el bloque de no verificables. O el API cambió, o la ' +
                           'pantalla está dando por bueno un cero que no lo es: comprobar por SQL.');
      }
      // Contraste con el documento: en el periodo 8 se esperan los 8 ocupados ciegos
      if (!isNaN(cuenta) && cuenta !== 8) {
        issue('Contraste', `04-Defectos-API.md §A documenta 8 puestos ciegos ocupados y la pantalla lista ${cuenta}. ` +
                           'Diferencia esperable si cambió la ocupación; confirmar por SQL.');
      }
      await shot(page, 'diagnostico-no-verificables');
    }

    // ── Listado 2: la mitigación del defecto B tiene que notarse ──
    if (ctx.diag.listado2 && !isNaN(ctx.diag.listado2.conteo)) {
      const c2 = ctx.diag.listado2.conteo;
      nota(`Listado 2 (puestos sin categoría válida): ${c2}`);
      if (c2 >= 209) {
        issue('Requisito', `El listado 2 marca ${c2} puestos sin categoría. GET /api/Positions devuelve ` +
                           'categoriaPuestoId = 0 para los 209 (defecto B): la pantalla estaría creyéndose ese cero ' +
                           'en vez de resolver la categoría puesto por puesto.');
      } else {
        await ok(`El listado 2 no se cree el cero del listado del API (${c2} puestos, no los 209 del defecto B)`);
      }
    }

    for (let i = 0; i < nT; i++) {
      const tabla = tarjetas.nth(i).locator('table').first();
      if (await tabla.count() > 0) {
        const filas = await tabla.locator('tbody tr').count();
        nota(`Listado ${i + 1}: ${filas} fila(s) pintadas en la tabla`);
      } else {
        nota(`Listado ${i + 1}: sin tabla (mensaje de "ninguno")`);
      }
    }
    await shot(page, 'diagnostico-listados');
  });

  // ── PASO 12 — Guard de rol ─────────────────────────────────────────────────
  await ejecutarPaso(page, 12, 'Guard de seguridad: la ruta exige rol Administrador', async () => {
    nota('El usuario del recorrido es Administrador, así que la comprobación definitiva —entrar con un ' +
         'usuario real de rol 2 (Supervisor) o 3 (Empleado)— queda documentada en 03-Auditoria-Verificacion.md. ' +
         'Aquí se hace la comprobación equivalente en cliente: se degrada el rol guardado en localStorage ' +
         '(que es de donde lo lee RoleGuard vía SegurityService.getRolId) y se navega por URL directa.');

    const rolOriginal = await page.evaluate(() => localStorage.getItem('rol'));
    if (rolOriginal === null) {
      omitir('no hay clave "rol" en localStorage: no se puede degradar el rol desde el navegador');
      return;
    }
    nota(`Valor original de localStorage["rol"]: ${String(rolOriginal).slice(0, 120)}`);

    await page.evaluate(() => {
      const crudo = localStorage.getItem('rol') || '{}';
      const r = JSON.parse(crudo);
      if (r && typeof r === 'object') {
        if ('rolId' in r) { r.rolId = 2; }
        if (r.rol && typeof r.rol === 'object') { r.rol.id = 2; }
        if (!('rolId' in r) && !r.rol) { r.rolId = 2; }
        localStorage.setItem('rol', JSON.stringify(r));
      }
    });
    await ok('Rol degradado a 2 (Supervisor) en el navegador');

    // Hay que entrar por el menú, no por URL: una navegación con recarga completa
    // termina siempre en Home por navmenu.component.ts:86, y además el arranque
    // vuelve a leer el rol del API y deshace la degradación. Al hacerlo por el
    // menú (navegación interna, sin recarga) el guard sí se ejerce de verdad:
    // lee el rol degradado de localStorage vía SegurityService.getRolId().
    await navMenu(page, 'Configuraci', 'Configuración de Competencias');
    await page.waitForTimeout(3000);
    const swal = await textoSwal(page);
    const urlFinal = page.url();
    const hayPantalla = await page.locator('h2.cc-titulo').count();
    nota(`URL tras intentar entrar con rol 2: ${urlFinal}`);
    nota(`Mensaje en pantalla: "${swal.slice(0, 200)}"`);
    await shot(page, 'guard-rol-no-admin');

    if (hayPantalla > 0 && /configuracion-competencias/.test(urlFinal)) {
      issue('Seguridad', 'Con rol 2 la pantalla "Configuración de Competencias" se abrió igualmente: ' +
                         'el RoleGuard no bloqueó la URL directa');
    } else {
      await ok('Con rol 2 la ruta no se abre');
      if (/Acceso Denegado|permisos/i.test(swal)) {
        await ok('Se muestra el aviso "Acceso Denegado / No tiene permisos para acceder a esta página"');
      } else {
        issue('UX', 'La ruta se bloqueó pero no se vio el mensaje de acceso denegado');
      }
      if (!/\/Home/.test(urlFinal)) {
        nota(`Redirección esperada a /Home; la URL final fue ${urlFinal}`);
      }
    }
    await dismissSwal(page);

    // Restaurar el rol para no dejar la sesión del navegador tocada
    await page.evaluate(v => { if (v !== null) { localStorage.setItem('rol', v); } }, rolOriginal);
    await ok('Rol original restaurado en localStorage');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //                                 RESUMEN
  // ═══════════════════════════════════════════════════════════════════════════

  const ejecutados   = PASOS.filter(p => p.estado === 'ok').length;
  const parciales    = PASOS.filter(p => p.estado === 'parcial').length;
  const conProblemas = PASOS.filter(p => p.estado === 'con problemas').length;
  const omitidos     = PASOS.filter(p => p.estado === 'omitido').length;
  const totalOmisiones = PASOS.reduce((s, p) => s + p.parciales.length, 0) + omitidos;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMEN DE LA EJECUCIÓN                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Modo:                 ${MODO}`);
  console.log(`  URL:                  ${BASE}`);
  console.log(`  Marca:                ${MARCA}`);
  console.log(`  Pasos correctos:      ${ejecutados} de ${PASOS.length}`);
  console.log(`  Parciales:            ${parciales}`);
  console.log(`  Con problemas:        ${conProblemas}`);
  console.log(`  Omitidos por entero:  ${omitidos}`);
  console.log(`  Omisiones totales:    ${totalOmisiones} (pasos enteros + partes)`);
  console.log(`  Problemas:            ${ISSUES.length}`);
  console.log(`  Errores JS:           ${erroresJs.length}`);
  console.log('');
  const ICONO = { ok: '✓', parcial: '◐', omitido: '⏭', 'con problemas': '⚠' };
  PASOS.forEach(p => {
    console.log(`  ${ICONO[p.estado] || '?'} ${p.n}. ${p.titulo} — ${p.estado.toUpperCase()}` +
                `${p.motivo ? ` (${p.motivo})` : ''}`);
    p.parciales.forEach(m => console.log(`      ⏭ parte omitida: ${m}`));
  });
  if (ISSUES.length > 0) {
    console.log('\n  PROBLEMAS ENCONTRADOS');
    ISSUES.forEach((i, k) => console.log(`   ${k + 1}. (paso ${i.paso}) [${i.cat}] ${i.desc}`));
  }

  // ── Bloque pegable en 03-Auditoria-Verificacion.md ─────────────────────────
  const md = [];
  md.push(`## Ejecución del ${new Date().toISOString().slice(0, 16).replace('T', ' ')} — modo ${MODO}`);
  md.push('');
  md.push(`- **URL:** \`${BASE}\` (local, \`ng serve --configuration prueba\` → API \`:7071\`, BD \`Evaluaciones_Test\`)`);
  md.push(`- **Marca de la ejecución:** \`${MARCA}\``);
  md.push(`- **Resultado:** ${ejecutados} paso(s) correctos, ${parciales} parcial(es), ${conProblemas} con problemas, ` +
          `${omitidos} omitido(s) por entero, ${ISSUES.length} problema(s), ${erroresJs.length} error(es) de JavaScript en consola.`);
  md.push('');
  md.push('| # | Paso | Captura(s) | Resultado |');
  md.push('|---|---|---|---|');
  PASOS.forEach(p => {
    const caps = p.capturas.length > 0
      ? p.capturas.map(c => `\`${c}\``).join('<br>')
      : '—';
    let res;
    if (p.estado === 'omitido') { res = `Omitido — ${p.motivo}`; }
    else if (p.estado === 'con problemas') { res = `Con problemas — ${p.problemas.join('; ')}`; }
    else if (p.estado === 'parcial') { res = `Parcial — omitido: ${p.parciales.join('; ')}`; }
    else { res = 'Correcto'; }
    md.push(`| ${p.n} | ${p.titulo} | ${caps} | ${res.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`);
  });
  md.push('');
  md.push('### Detalle observado por paso');
  md.push('');
  PASOS.forEach(p => {
    md.push(`**${p.n}. ${p.titulo}** — _${p.estado}_`);
    if (p.notas.length === 0) { md.push(''); md.push('- (sin observaciones)'); }
    p.notas.forEach(n => md.push(`- ${n.replace(/\|/g, '\\|')}`));
    p.problemas.forEach(n => md.push(`- ⚠️ ${n.replace(/\|/g, '\\|')}`));
    md.push('');
  });
  if (ISSUES.length > 0) {
    md.push('### Problemas encontrados');
    md.push('');
    md.push('| # | Paso | Categoría | Descripción |');
    md.push('|---|---|---|---|');
    ISSUES.forEach((i, k) => md.push(`| ${k + 1} | ${i.paso} | ${i.cat} | ${i.desc.replace(/\|/g, '\\|')} |`));
    md.push('');
  }
  if (erroresJs.length > 0) {
    md.push('### Errores de JavaScript en consola');
    md.push('');
    [...new Set(erroresJs)].slice(0, 25).forEach(e => md.push(`- \`${e.replace(/`/g, "'").slice(0, 240)}\``));
    md.push('');
  }

  if (!fs.existsSync(OUT_DIR)) { fs.mkdirSync(OUT_DIR, { recursive: true }); }
  const salida = path.join(OUT_DIR, `resumen-${MODO === 'ESCRITURA' ? 'escritura' : 'lectura'}-${SELLO}.md`);
  fs.writeFileSync(salida, md.join('\n'), 'utf8');

  console.log('\n──────── BLOQUE PARA 03-Auditoria-Verificacion.md ────────');
  console.log(md.join('\n'));
  console.log('──────────────────────────────────────────────────────────');
  console.log(`\n✅ Resumen guardado en: ${salida}`);
  console.log(`   Capturas en: ${OUT_DIR}`);
});
