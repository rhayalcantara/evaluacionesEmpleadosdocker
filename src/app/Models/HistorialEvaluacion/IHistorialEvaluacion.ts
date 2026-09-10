/**
 * Interfaz para el resumen de evaluación en el historial
 * Contiene solo los datos necesarios para visualización en lista
 */
export interface IHistorialEvaluacionResumen {
  evaluacionId: number;
  periodId: number;
  periodoNombre: string;
  /** Tipo del periodo al que pertenece. Medio año no tiene puntuación comparable. */
  periodoTipo: 'medio_ano' | 'final_ano';
  /** Atajo de `periodoTipo === 'medio_ano'` para plantillas y filtros. */
  esMedioAno: boolean;
  fechaInicio: string;
  fechaFin: string;
  empleadoSecuencial: number;
  empleadoNombre: string;
  empleadoIdentificacion?: string;
  /** Código de usuario de red del empleado (p. ej. RALCANTARA). */
  codigoUsuario?: string;
  departamento?: string;
  puesto?: string;
  fechaRespuesta: string;
  /** Estado normalizado: uno de ESTADOS_EVALUACION (NULL/vacío → 'SIN_INICIAR'). */
  estadoEvaluacion: string;
  totalCalculo: number;
  puntuacionDesempenoColaborador: number;
  puntuacionCompetenciaColaborador: number;
  puntuacionDesempenoSupervisor: number;
  puntuacionCompetenciaSupervisor: number;
  totalColaborador: number;
  totalSupervisor: number;
  supervisorNombre?: string;
  entrevistaConSupervisor: boolean;
}

/**
 * Opción del filtro de estado: valor crudo de la BD y etiqueta legible.
 */
export interface IEstadoEvaluacionOpcion {
  valor: string;
  etiqueta: string;
}

/**
 * Resultado de la regla "¿se pueden comparar estas dos evaluaciones?"
 */
export interface IResultadoComparable {
  ok: boolean;
  motivo?: string;
}

/**
 * Filtros para búsqueda de historial
 */
export interface IHistorialEvaluacionFiltros {
  empleadoSecuencial?: number;
  periodoId?: number;
  estadoEvaluacion?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  departamento?: string;
  supervisor?: number;
}

/**
 * Comparación entre dos evaluaciones
 */
export interface IComparacionEvaluaciones {
  evaluacion1: IHistorialEvaluacionResumen;
  evaluacion2: IHistorialEvaluacionResumen;
  diferenciaTotal: number;
  diferenciaDesempeno: number;
  diferenciaCompetencia: number;
  tendencia: 'mejora' | 'igual' | 'decline';
}

/**
 * Estadísticas del historial de un empleado.
 * Los promedios, la mejor evaluación y la tendencia se calculan SOLO con
 * evaluaciones finales; las de medio año se cuentan pero no puntúan.
 */
export interface IEstadisticasHistorial {
  empleadoSecuencial: number;
  empleadoNombre: string;
  totalEvaluaciones: number;
  evaluacionesFinales: number;
  evaluacionesMedioAno: number;
  promedioGeneral: number;
  mejorEvaluacion: IHistorialEvaluacionResumen | null;
  evaluacionMasReciente: IHistorialEvaluacionResumen;
  tendenciaGeneral: 'mejora' | 'estable' | 'decline';
  promedioDesempeno: number;
  promedioCompetencias: number;
}

/**
 * Datos para gráfico de evolución (solo evaluaciones finales)
 */
export interface IEvolucionEvaluacion {
  periodo: string;
  fecha: string;
  totalCalculo: number;
  desempeno: number;
  competencias: number;
}
