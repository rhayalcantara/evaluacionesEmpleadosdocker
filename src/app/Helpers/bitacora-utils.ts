/**
 * Lógica pura de la Bitácora de Eventos (Fase 3, RRHH).
 * Funciones sin estado: misma entrada → misma salida. Sin Angular, sin RxJS.
 */
import {
  IBitacoraEvento, IBitacoraEventoCompetencia, IBitacoraResumenCompetencia, ICompetenciaCatalogo,
  IValidacionEvento, TipoEvento, ImpactoEvento, TIPOS_EVENTO, IMPACTOS_EVENTO, DESCRIPCION_MIN, DESCRIPCION_MAX
} from '../Models/Bitacora/IBitacora';

/** Valores usados por el formulario nuevo (tipados por el modelo). */
const TIPO_POR_DEFECTO: TipoEvento = 'Logro';
const IMPACTO_POR_DEFECTO: ImpactoEvento = 'Medio';

/** Separa un entero por delante de 2 dígitos con ceros. */
function aDosDigitos(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 'YYYY-MM-DD' de la fecha local (sin UTC).
 * String que empieza por 'YYYY-MM-DD' → esas 10 caracteres (sin pasar por Date).
 * Lo demás pasa por new Date(); inválido → ''.
 */
export function fechaISO(fecha: Date | string | null | undefined): string {
  if (fecha === null || fecha === undefined) return '';
  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) return '';
    return `${fecha.getFullYear()}-${aDosDigitos(fecha.getMonth() + 1)}-${aDosDigitos(fecha.getDate())}`;
  }
  const texto = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const d = new Date(texto);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${aDosDigitos(d.getMonth() + 1)}-${aDosDigitos(d.getDate())}`;
}

/** Hoy en 'YYYY-MM-DD' local; `ahora` permite pruebas. */
export function hoyISO(ahora?: Date): string {
  return fechaISO(ahora ?? new Date());
}

/** Minúsculas, sin acentos, espacios colapsados, trim. null/undefined → ''. */
export function normalizarTexto(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Evento vacío listo para el formulario (inmutable por uso: se devuelven siempre nuevos). */
export function eventoNuevo(
  empleadoSecuencial: number,
  registradoPorSecuencial: number,
  ahora?: Date
): IBitacoraEvento {
  return {
    id: 0,
    empleadoSecuencial,
    registradoPorSecuencial,
    fechaEvento: hoyISO(ahora),
    fechaRegistro: null,
    fechaModificacion: null,
    tipo: TIPO_POR_DEFECTO,
    impacto: IMPACTO_POR_DEFECTO,
    descripcion: '',
    activo: true,
    competencias: [],
    registradoPorNombre: null
  };
}

/** Valida un evento; los errores aparecen en el orden fijo de la especificación. No muta. */
export function validarEvento(evento: IBitacoraEvento, ahora?: Date): IValidacionEvento {
  const errores: string[] = [];
  const empleados = evento.empleadoSecuencial;
  if (typeof empleados !== 'number' || !Number.isFinite(empleados) || empleados <= 0) {
    errores.push('Seleccione el colaborador.');
  }

  const fecha = fechaISO(evento.fechaEvento);
  if (!fecha) {
    errores.push('La fecha del evento es obligatoria.');
  } else if (fecha > hoyISO(ahora)) {
    errores.push('La fecha del evento no puede ser futura.'); // hoy inclusive es válido
  }

  if (!TIPOS_EVENTO.some((t) => t.valor === (evento.tipo as string))) {
    errores.push('Seleccione el tipo de evento.');
  }
  if (!IMPACTOS_EVENTO.some((i) => i.valor === (evento.impacto as string))) {
    errores.push('Seleccione el impacto.');
  }

  const descripcion = (evento.descripcion ?? '').trim();
  if (descripcion.length < DESCRIPCION_MIN) {
    errores.push(`La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.`);
  }
  if (descripcion.length > DESCRIPCION_MAX) {
    errores.push(`La descripción no puede superar ${DESCRIPCION_MAX} caracteres.`);
  }

  const competencias = evento.competencias ?? [];
  if (competencias.length === 0) {
    errores.push('Seleccione al menos una competencia.');
  }
  const vistos = new Set<number>();
  let hayRepetidos = false;
  for (const c of competencias) {
    if (vistos.has(c.objetivoId)) { hayRepetidos = true; break; }
    vistos.add(c.objetivoId);
  }
  if (hayRepetidos) errores.push('Hay competencias repetidas.');

  return { valido: errores.length === 0, errores };
}

/** Etiqueta del tipo según TIPOS_EVENTO; desconocido → el texto tal cual; null/undefined → ''. */
export function etiquetaTipo(tipo: string | null | undefined): string {
  if (tipo === null || tipo === undefined) return '';
  const encontrado = TIPOS_EVENTO.find((t) => t.valor === tipo);
  return encontrado ? encontrado.etiqueta : tipo;
}

/** Clase CSS del tipo; desconocido → 'evento-otro'. */
export function claseTipo(tipo: string | null | undefined): string {
  const encontrado = tipo === null || tipo === undefined
    ? undefined
    : TIPOS_EVENTO.find((t) => t.valor === tipo);
  return encontrado ? encontrado.clase : 'evento-otro';
}

/** Clase CSS del impacto; desconocido → 'impacto-otro'. */
export function claseImpacto(impacto: string | null | undefined): string {
  if (impacto === null || impacto === undefined) return 'impacto-otro';
  const valido = IMPACTOS_EVENTO.find((i) => i.valor === impacto);
  return valido ? `impacto-${valido.valor.toLowerCase()}` : 'impacto-otro';
}

/** Alterna una competencia: agrega si falta, quita si está. Devuelve array nuevo; no muta. */
export function alternarCompetencia(
  lista: IBitacoraEventoCompetencia[],
  objetivoId: number
): IBitacoraEventoCompetencia[] {
  const actual = lista ?? [];
  if (actual.some((c) => c.objetivoId === objetivoId)) {
    return actual.filter((c) => c.objetivoId !== objetivoId);
  }
  return [...actual, { id: 0, bitacoraEventoId: 0, objetivoId }];
}

/** true si la competencia ya está en la lista. */
export function tieneCompetencia(
  lista: IBitacoraEventoCompetencia[] | null | undefined,
  objetivoId: number
): boolean {
  return (lista ?? []).some((c) => c.objetivoId === objetivoId);
}

/** Agrupa el catálogo por grupo, conservando el orden de aparición. */
export function agruparCompetencias(
  catalogo: ICompetenciaCatalogo[]
): { grupoId: number; grupo: string; competencias: ICompetenciaCatalogo[] }[] {
  const grupos: { grupoId: number; grupo: string; competencias: ICompetenciaCatalogo[] }[] = [];
  for (const c of catalogo ?? []) {
    let destino = grupos.find((g) => g.grupoId === c.grupoId);
    if (!destino) {
      destino = { grupoId: c.grupoId, grupo: c.grupo, competencias: [] };
      grupos.push(destino);
    }
    destino.competencias.push(c);
  }
  return grupos;
}

/** Nombres de las competencias separados por ' · '; si falta nombre → '#<objetivoId>'. */
export function nombresCompetencias(evento: IBitacoraEvento): string {
  return (evento.competencias ?? [])
    .map((c) => (c.nombre && c.nombre.trim() ? c.nombre : `#${c.objetivoId}`))
    .join(' · ');
}

/**
 * Filtra por rango (inclusive, comparar 'YYYY-MM-DD'), tipo exacto y competencia.
 * Filtros null/undefined/'' se ignoran. Siempre excluye activo === false. No muta.
 */
export function filtrarEventos(
  eventos: IBitacoraEvento[],
  filtro: { desde?: string | null; hasta?: string | null; tipo?: string | null; objetivoId?: number | null }
): IBitacoraEvento[] {
  const desde = filtro.desde ?? '';
  const hasta = filtro.hasta ?? '';
  const tipo = filtro.tipo ?? '';
  const objetivoId = filtro.objetivoId ?? 0;
  return (eventos ?? []).filter((ev) => {
    if (ev.activo === false) return false;
    const fecha = fechaISO(ev.fechaEvento);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    if (tipo && ev.tipo !== tipo) return false;
    if (objetivoId && !(ev.competencias ?? []).some((c) => c.objetivoId === objetivoId)) return false;
    return true;
  });
}

/** Orden: fechaEvento desc, luego id desc. Devuelve copia. */
export function ordenarEventos(eventos: IBitacoraEvento[]): IBitacoraEvento[] {
  return [...(eventos ?? [])].sort((a, b) => {
    const fa = (a.fechaEvento ?? '').trim();
    const fb = (b.fechaEvento ?? '').trim();
    if (fa !== fb) return fa < fb ? 1 : -1;
    return b.id - a.id;
  });
}

/** Conteo por tipo; los tipos desconocidos solo suman al total. */
export function contarPorTipo(eventos: IBitacoraEvento[]): {
  logros: number; incumplimientos: number; iniciativas: number; conductas: number; total: number;
} {
  const conteo = { logros: 0, incumplimientos: 0, iniciativas: 0, conductas: 0 };
  for (const ev of eventos ?? []) {
    if (ev.tipo === 'Logro') conteo.logros++;
    else if (ev.tipo === 'Incumplimiento') conteo.incumplimientos++;
    else if (ev.tipo === 'Iniciativa') conteo.iniciativas++;
    else if (ev.tipo === 'Conducta') conteo.conductas++;
  }
  return { ...conteo, total: (eventos ?? []).length };
}

/** 'N tipo' con singular/plural correcto. */
function cuentaUnidad(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/** Texto corto de la fila de resumen: partes no nulas unidas por ' · '; total 0 → 'Sin eventos'. */
export function textoResumen(
  fila: Pick<IBitacoraResumenCompetencia, 'logros' | 'incumplimientos' | 'iniciativas' | 'conductas' | 'total'>
): string {
  if (!fila || fila.total === 0) return 'Sin eventos';
  const partes: string[] = [];
  if (fila.logros) partes.push(cuentaUnidad(fila.logros, 'logro', 'logros'));
  if (fila.incumplimientos) partes.push(cuentaUnidad(fila.incumplimientos, 'incumplimiento', 'incumplimientos'));
  if (fila.iniciativas) partes.push(cuentaUnidad(fila.iniciativas, 'iniciativa', 'iniciativas'));
  if (fila.conductas) partes.push(cuentaUnidad(fila.conductas, 'conducta', 'conductas'));
  return partes.join(' · ');
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY'; vacío o inválido → ''. */
export function fechaCorta(fecha: string | null | undefined): string {
  if (fecha === null || fecha === undefined) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha).trim());
  if (!m) return '';
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  // Verifica que sea una fecha real (evita '2026-13-40').
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (d.getUTCFullYear() !== anio || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Filas planas para Excel, conservando el orden de `eventos` (no reordena). */
export function filasExcel(eventos: IBitacoraEvento[], nombreEmpleado: string): Record<string, string | number>[] {
  return (eventos ?? []).map((ev) => {
    const fila: Record<string, string | number> = {};
    // Claves en el orden exacto requerido (order of insertion se conserva).
    fila['Colaborador'] = (nombreEmpleado ?? '').trim();
    fila['Fecha del evento'] = fechaCorta(ev.fechaEvento);
    fila['Tipo'] = etiquetaTipo(ev.tipo);
    fila['Impacto'] = ev.impacto ?? '';
    fila['Competencias'] = nombresCompetencias(ev);
    fila['Descripción'] = ev.descripcion ?? '';
    fila['Registrado por'] = ev.registradoPorNombre ?? '';
    fila['Fecha de registro'] = fechaCorta(ev.fechaRegistro);
    return fila;
  });
}

/** Rango de fechas de un periodo en 'YYYY-MM-DD'; entradas inválidas → ''. */
export function rangoPeriodo(
  periodo: { fechaInicio?: Date | string | null; fechaFin?: Date | string | null } | null | undefined
): { desde: string; hasta: string } {
  return {
    desde: fechaISO(periodo ? periodo.fechaInicio : undefined),
    hasta: fechaISO(periodo ? periodo.fechaFin : undefined)
  };
}