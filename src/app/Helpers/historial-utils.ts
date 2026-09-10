/**
 * Lógica pura del historial de evaluaciones.
 * SIN dependencias de Angular, SIN rxjs, SIN estado global mutable.
 */
import {
  IHistorialEvaluacionResumen,
  IEstadoEvaluacionOpcion,
  IResultadoComparable,
  IComparacionEvaluaciones,
  IEstadisticasHistorial,
  IEvolucionEvaluacion
} from '../Models/HistorialEvaluacion/IHistorialEvaluacion';

// ---------- Tipos de entrada (forma cruda del API) ----------

export interface EmpleadoFuente {
  secuencial: number;
  codigousuario?: string | null;
  nombreunido?: string | null;
  identificacion?: string | null;
  departamento?: string | null;
  cargo?: string | null;
}

export interface PeriodoFuente {
  id: number;
  descripcion?: string | null;
  tipo?: 'medio_ano' | 'final_ano' | null;
  fechaInicio?: Date | string | null;
  fechaFin?: Date | string | null;
}

export interface EvaluacionFuente {
  id: number;
  periodId: number;
  empleadoSecuencial: number;
  totalCalculo?: number | null;
  fechaRepuestas?: string | null;
  estadoevaluacion?: string | null;
  puntuaciondesempenocolaborador?: number | null;
  puntuacioncompetenciacolaborador?: number | null;
  puntuaciondesempenosupervidor?: number | null; // sic: así se llama en el API
  puntuacioncompetenciasupervisor?: number | null;
  totalcolaborador?: number | null;
  totalsupervisor?: number | null;
  entrevistaConSupervisor?: boolean | null;
  empleado?: EmpleadoFuente | null;
}

// ---------- Estado de evaluación ----------

export const SIN_INICIAR = 'SIN_INICIAR';

export const ESTADOS_EVALUACION: IEstadoEvaluacionOpcion[] = [
  { valor: 'Borrador', etiqueta: 'Borrador' },
  { valor: 'AutoEvaluado', etiqueta: 'Autoevaluado' },
  { valor: 'EvaluadoPorSupervisor', etiqueta: 'Evaluado por supervisor' },
  { valor: 'Enviado', etiqueta: 'Enviado al colaborador' },
  { valor: 'Completado', etiqueta: 'Completado' },
  { valor: SIN_INICIAR, etiqueta: 'Sin iniciar' }
];

export function normalizarEstado(estado: string | null | undefined): string {
  if (estado === null || estado === undefined) {
    return SIN_INICIAR;
  }
  const limpio = estado.trim();
  return limpio === '' ? SIN_INICIAR : limpio;
}

export function etiquetaEstado(estado: string | null | undefined): string {
  const normalizado = normalizarEstado(estado);
  const opcion = ESTADOS_EVALUACION.find(x => x.valor === normalizado);
  return opcion ? opcion.etiqueta : normalizado;
}

export function claseEstado(estado: string | null | undefined): string {
  switch (normalizarEstado(estado)) {
    case 'Borrador':
      return 'estado-borrador';
    case 'AutoEvaluado':
      return 'estado-autoevaluado';
    case 'EvaluadoPorSupervisor':
      return 'estado-supervisor';
    case 'Enviado':
      return 'estado-enviado';
    case 'Completado':
      return 'estado-completado';
    case SIN_INICIAR:
      return 'estado-sin-iniciar';
    default:
      return 'estado-default';
  }
}

export function coincideEstado(
  estadoItem: string | null | undefined,
  filtro: string | null | undefined
): boolean {
  if (filtro === null || filtro === undefined || filtro.trim() === '') {
    return true;
  }
  return normalizarEstado(estadoItem) === normalizarEstado(filtro);
}

// ---------- Texto ----------

export function normalizarTexto(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) {
    return '';
  }
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ---------- Mapeo a resumen ----------

function aTexto(valor: string | null | undefined): string {
  return (valor ?? '').trim();
}

function aNumero(valor: number | null | undefined): number {
  if (valor === null || valor === undefined) {
    return 0;
  }
  const n = Number(valor);
  return Number.isNaN(n) ? 0 : n;
}

function isoValida(x: Date | string | null | undefined): string {
  if (x === null || x === undefined || x === '') {
    return '';
  }
  const d = new Date(x);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function mapearResumen(
  ev: EvaluacionFuente,
  empleado?: EmpleadoFuente | null,
  periodo?: PeriodoFuente | null
): IHistorialEvaluacionResumen {
  const fuenteEmpleado: EmpleadoFuente | null | undefined =
    empleado ?? ev.empleado ?? null;

  const nombreUnido = aTexto(fuenteEmpleado?.nombreunido);
  const empleadoNombre =
    nombreUnido !== ''
      ? nombreUnido
      : `Empleado ${ev.empleadoSecuencial}`;

  const medioAno = esMedioAno(periodo);
  const periodoDescripcion = aTexto(periodo?.descripcion);

  return {
    evaluacionId: ev.id,
    periodId: ev.periodId,
    periodoNombre:
      periodoDescripcion !== ''
        ? periodoDescripcion
        : `Período ${ev.periodId}`,
    periodoTipo: medioAno ? 'medio_ano' : 'final_ano',
    esMedioAno: medioAno,
    fechaInicio: isoValida(periodo?.fechaInicio),
    fechaFin: isoValida(periodo?.fechaFin),
    empleadoSecuencial: ev.empleadoSecuencial,
    empleadoNombre,
    empleadoIdentificacion: aTexto(fuenteEmpleado?.identificacion),
    codigoUsuario: aTexto(fuenteEmpleado?.codigousuario),
    departamento: aTexto(fuenteEmpleado?.departamento),
    puesto: aTexto(fuenteEmpleado?.cargo),
    fechaRespuesta: ev.fechaRepuestas ?? '',
    estadoEvaluacion: normalizarEstado(ev.estadoevaluacion),
    totalCalculo: aNumero(ev.totalCalculo),
    puntuacionDesempenoColaborador: aNumero(ev.puntuaciondesempenocolaborador),
    puntuacionCompetenciaColaborador: aNumero(ev.puntuacioncompetenciacolaborador),
    puntuacionDesempenoSupervisor: aNumero(ev.puntuaciondesempenosupervidor),
    puntuacionCompetenciaSupervisor: aNumero(ev.puntuacioncompetenciasupervisor),
    totalColaborador: aNumero(ev.totalcolaborador),
    totalSupervisor: aNumero(ev.totalsupervisor),
    supervisorNombre: undefined,
    entrevistaConSupervisor: Boolean(ev.entrevistaConSupervisor)
  };
}

// ---------- Filtro y orden ----------

export function coincideBusqueda(
  item: IHistorialEvaluacionResumen,
  texto: string | null | undefined
): boolean {
  if (texto === null || texto === undefined || texto.trim() === '') {
    return true;
  }
  const busqueda = normalizarTexto(texto);
  if (busqueda === '') {
    return true;
  }
  const campos = [
    item.empleadoNombre,
    item.empleadoIdentificacion,
    String(item.empleadoSecuencial),
    item.codigoUsuario,
    item.periodoNombre,
    item.departamento
  ];
  return campos.some(c => normalizarTexto(c).includes(busqueda));
}

function timestampValido(fecha: string | null | undefined): number | null {
  if (fecha === null || fecha === undefined || fecha === '') {
    return null;
  }
  const t = new Date(fecha).getTime();
  return Number.isNaN(t) ? null : t;
}

export function ordenarPorFechaDesc(
  items: IHistorialEvaluacionResumen[]
): IHistorialEvaluacionResumen[] {
  return [...items].sort((a, b) => {
    const ta = timestampValido(a.fechaRespuesta);
    const tb = timestampValido(b.fechaRespuesta);
    if (ta === null && tb === null) {
      return 0;
    }
    if (ta === null) {
      return 1; // inválidas/vacías al final
    }
    if (tb === null) {
      return -1;
    }
    return tb - ta;
  });
}

// ---------- Periodo ----------

export function esMedioAno(
  periodo: PeriodoFuente | null | undefined
): boolean {
  return periodo?.tipo === 'medio_ano';
}

// ---------- Estadísticas ----------

function media(
  valores: number[]
): number {
  if (valores.length === 0) {
    return 0;
  }
  return valores.reduce((acc, x) => acc + x, 0) / valores.length;
}

export function calcularEstadisticas(
  historial: IHistorialEvaluacionResumen[]
): IEstadisticasHistorial {
  if (historial.length === 0) {
    throw new Error('No hay evaluaciones para este empleado');
  }

  const finales = historial.filter(x => !x.esMedioAno);

  let mejorEvaluacion: IHistorialEvaluacionResumen | null = null;
  for (const f of finales) {
    if (mejorEvaluacion === null || f.totalCalculo > mejorEvaluacion.totalCalculo) {
      mejorEvaluacion = f;
    }
  }

  const evaluacionMasReciente = ordenarPorFechaDesc(historial)[0];

  const finalesDesc = ordenarPorFechaDesc(finales);
  let tendenciaGeneral: 'mejora' | 'estable' | 'decline' = 'estable';
  if (finalesDesc.length >= 2) {
    const ultima = finalesDesc[0];
    const penultima = finalesDesc[1];
    if (ultima.totalCalculo > penultima.totalCalculo + 5) {
      tendenciaGeneral = 'mejora';
    } else if (ultima.totalCalculo < penultima.totalCalculo - 5) {
      tendenciaGeneral = 'decline';
    }
  }

  return {
    empleadoSecuencial: historial[0].empleadoSecuencial,
    empleadoNombre: historial[0].empleadoNombre,
    totalEvaluaciones: historial.length,
    evaluacionesFinales: finales.length,
    evaluacionesMedioAno: historial.length - finales.length,
    promedioGeneral: media(finales.map(x => x.totalCalculo)),
    mejorEvaluacion,
    evaluacionMasReciente,
    tendenciaGeneral,
    promedioDesempeno: media(
      finales.map(x => x.puntuacionDesempenoColaborador)
    ),
    promedioCompetencias: media(
      finales.map(x => x.puntuacionCompetenciaColaborador)
    )
  };
}

// ---------- Evolución ----------

export function datosEvolucion(
  historial: IHistorialEvaluacionResumen[]
): IEvolucionEvaluacion[] {
  const finales = historial.filter(x => !x.esMedioAno);

  // Orden ascendente por fechaRespuesta; fechas inválidas/vacías van al final.
  const ascendente = [...finales].sort((a, b) => {
    const ta = timestampValido(a.fechaRespuesta);
    const tb = timestampValido(b.fechaRespuesta);
    if (ta === null && tb === null) {
      return 0;
    }
    if (ta === null) {
      return 1;
    }
    if (tb === null) {
      return -1;
    }
    return ta - tb;
  });

  return ascendente.map(f => ({
    periodo: f.periodoNombre,
    fecha: f.fechaRespuesta,
    totalCalculo: f.totalCalculo,
    desempeno: f.puntuacionDesempenoColaborador,
    competencias: f.puntuacionCompetenciaColaborador
  }));
}

// ---------- Comparación ----------

export function puedeComparar(
  a: IHistorialEvaluacionResumen,
  b: IHistorialEvaluacionResumen
): IResultadoComparable {
  if (a.evaluacionId === b.evaluacionId) {
    return {
      ok: false,
      motivo: 'Seleccione dos evaluaciones distintas'
    };
  }
  if (a.esMedioAno || b.esMedioAno) {
    return {
      ok: false,
      motivo:
        'Las evaluaciones de medio año no tienen puntuación comparable; seleccione dos evaluaciones finales'
    };
  }
  return { ok: true };
}

export function compararResumenes(
  a: IHistorialEvaluacionResumen,
  b: IHistorialEvaluacionResumen
): IComparacionEvaluaciones {
  const comprobacion = puedeComparar(a, b);
  if (!comprobacion.ok) {
    throw new Error(comprobacion.motivo ?? 'Evaluaciones no comparables');
  }

  const diferenciaTotal = b.totalCalculo - a.totalCalculo;
  const tendencia: 'mejora' | 'igual' | 'decline' =
    diferenciaTotal > 0 ? 'mejora' : diferenciaTotal < 0 ? 'decline' : 'igual';

  return {
    evaluacion1: a,
    evaluacion2: b,
    diferenciaTotal,
    diferenciaDesempeno:
      b.puntuacionDesempenoColaborador - a.puntuacionDesempenoColaborador,
    diferenciaCompetencia:
      b.puntuacionCompetenciaColaborador - a.puntuacionCompetenciaColaborador,
    tendencia
  };
}

// ---------- Export a Excel ----------

export function filasExcel(
  historial: IHistorialEvaluacionResumen[]
): Record<string, string | number>[] {
  return historial.map(item => {
    const numero = (valor: number): string =>
      item.esMedioAno ? '' : valor.toFixed(2);

    return {
      'ID Evaluación': item.evaluacionId,
      'Período': item.periodoNombre,
      'Tipo': item.esMedioAno ? 'Medio año' : 'Final',
      'Empleado': item.empleadoNombre,
      'Identificación': item.empleadoIdentificacion ?? '',
      'Usuario': item.codigoUsuario ?? '',
      'Departamento': item.departamento ?? '',
      'Puesto': item.puesto ?? '',
      'Fecha': item.fechaRespuesta,
      'Estado': etiquetaEstado(item.estadoEvaluacion),
      'Total': numero(item.totalCalculo),
      'Desempeño Colaborador':
        numero(item.puntuacionDesempenoColaborador),
      'Competencias Colaborador':
        numero(item.puntuacionCompetenciaColaborador),
      'Total Colaborador': numero(item.totalColaborador),
      'Desempeño Supervisor':
        numero(item.puntuacionDesempenoSupervisor),
      'Competencias Supervisor':
        numero(item.puntuacionCompetenciaSupervisor),
      'Total Supervisor': numero(item.totalSupervisor),
      'Entrevista con Supervisor':
        item.entrevistaConSupervisor ? 'Sí' : 'No'
    };
  });
}
