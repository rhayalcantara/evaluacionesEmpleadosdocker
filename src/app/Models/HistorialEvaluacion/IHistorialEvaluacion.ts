/**
 * Interfaz para el resumen de evaluación en el historial
 * Contiene solo los datos necesarios para visualización en lista
 */
export interface IHistorialEvaluacionResumen {
  evaluacionId: number;
  periodId: number;
  periodoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  empleadoSecuencial: number;
  empleadoNombre: string;
  empleadoIdentificacion?: string;
  departamento?: string;
  puesto?: string;
  fechaRespuesta: string;
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
 * Estadísticas del historial de un empleado
 */
export interface IEstadisticasHistorial {
  empleadoSecuencial: number;
  empleadoNombre: string;
  totalEvaluaciones: number;
  promedioGeneral: number;
  mejorEvaluacion: IHistorialEvaluacionResumen;
  evaluacionMasReciente: IHistorialEvaluacionResumen;
  tendenciaGeneral: 'mejora' | 'estable' | 'decline';
  promedioDesempeno: number;
  promedioCompetencias: number;
}

/**
 * Datos para gráfico de evolución
 */
export interface IEvolucionEvaluacion {
  periodo: string;
  fecha: string;
  totalCalculo: number;
  desempeno: number;
  competencias: number;
}
