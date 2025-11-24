import { Injectable } from '@angular/core';
import { Observable, map, forkJoin } from 'rxjs';
import { DatosServiceService } from '../Services/datos-service.service';
import { LoggerService } from '../Services/logger.service';
import { Evaluacion } from './Evaluacion';
import { Periodos } from './Periodos';
import { Empleados } from './Empleados';
import {
  IHistorialEvaluacionResumen,
  IHistorialEvaluacionFiltros,
  IComparacionEvaluaciones,
  IEstadisticasHistorial,
  IEvolucionEvaluacion
} from '../Models/HistorialEvaluacion/IHistorialEvaluacion';
import { IEvaluacion } from '../Models/Evaluacion/IEvaluacion';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class HistorialEvaluacion {
  private rutaapi: string = this.datos.URL + '/api/Evaluacions';

  constructor(
    private datos: DatosServiceService,
    private logger: LoggerService,
    private evaluacionController: Evaluacion,
    private periodosController: Periodos,
    private empleadosController: Empleados
  ) {}

  /**
   * Obtiene el historial completo de evaluaciones para un empleado
   */
  public getHistorialPorEmpleado(empleadoSecuencial: number): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial para empleado', { empleadoSecuencial });

    return this.evaluacionController.GetEvaluacionesPorEmpleado(empleadoSecuencial).pipe(
      map((evaluaciones: IEvaluacion[]) => {
        return evaluaciones
          .map(ev => this.mapearAResumen(ev))
          .sort((a, b) => new Date(b.fechaRespuesta).getTime() - new Date(a.fechaRespuesta).getTime());
      })
    );
  }

  /**
   * Obtiene el historial de todos los subordinados de un supervisor
   */
  public getHistorialSubordinados(
    supervisorSecuencial: number,
    fechaConsulta: string = new Date().toISOString().split('T')[0]
  ): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial de subordinados', { supervisorSecuencial });

    // Primero obtenemos los subordinados del supervisor usando Getsub
    return this.empleadosController.Getsub(supervisorSecuencial.toString(), fechaConsulta).pipe(
      map((response: ModelResponse) => {
        const subordinados: any[] = response.data;

        if (subordinados.length === 0) {
          return [];
        }

        const historiales: Observable<IHistorialEvaluacionResumen[]>[] = subordinados.map(sub =>
          this.getHistorialPorEmpleado(sub.secuencial)
        );

        // Combinar todos los historiales
        return forkJoin(historiales).pipe(
          map(historiales => {
            const todosLosHistoriales: IHistorialEvaluacionResumen[] = [];
            historiales.forEach(hist => todosLosHistoriales.push(...hist));
            return todosLosHistoriales.sort((a, b) =>
              new Date(b.fechaRespuesta).getTime() - new Date(a.fechaRespuesta).getTime()
            );
          })
        );
      }),
      // Aplanar el Observable anidado
      map((obs: any) => obs)
    ) as any;
  }

  /**
   * Obtiene historial filtrado
   */
  public getHistorialConFiltros(filtros: IHistorialEvaluacionFiltros): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial con filtros', filtros);

    return this.datos.getdatos<ModelResponse>(this.rutaapi).pipe(
      map((response: ModelResponse) => {
        let evaluaciones: IEvaluacion[] = response.data;

        // Aplicar filtros
        if (filtros.empleadoSecuencial) {
          evaluaciones = evaluaciones.filter(ev => ev.empleadoSecuencial === filtros.empleadoSecuencial);
        }

        if (filtros.periodoId) {
          evaluaciones = evaluaciones.filter(ev => ev.periodId === filtros.periodoId);
        }

        if (filtros.estadoEvaluacion) {
          evaluaciones = evaluaciones.filter(ev => ev.estadoevaluacion === filtros.estadoEvaluacion);
        }

        if (filtros.fechaDesde) {
          evaluaciones = evaluaciones.filter(ev =>
            new Date(ev.fechaRepuestas) >= new Date(filtros.fechaDesde!)
          );
        }

        if (filtros.fechaHasta) {
          evaluaciones = evaluaciones.filter(ev =>
            new Date(ev.fechaRepuestas) <= new Date(filtros.fechaHasta!)
          );
        }

        return evaluaciones
          .map(ev => this.mapearAResumen(ev))
          .sort((a, b) => new Date(b.fechaRespuesta).getTime() - new Date(a.fechaRespuesta).getTime());
      })
    );
  }

  /**
   * Compara dos evaluaciones
   */
  public compararEvaluaciones(
    evaluacionId1: number,
    evaluacionId2: number
  ): Observable<IComparacionEvaluaciones> {
    this.logger.debug('Comparando evaluaciones', { evaluacionId1, evaluacionId2 });

    return forkJoin({
      eval1: this.evaluacionController.Get(evaluacionId1.toString()),
      eval2: this.evaluacionController.Get(evaluacionId2.toString())
    }).pipe(
      map(({ eval1, eval2 }) => {
        const resumen1 = this.mapearAResumen(eval1);
        const resumen2 = this.mapearAResumen(eval2);

        const diferenciaTotal = resumen2.totalCalculo - resumen1.totalCalculo;
        const diferenciaDesempeno = resumen2.puntuacionDesempenoColaborador - resumen1.puntuacionDesempenoColaborador;
        const diferenciaCompetencia = resumen2.puntuacionCompetenciaColaborador - resumen1.puntuacionCompetenciaColaborador;

        let tendencia: 'mejora' | 'igual' | 'decline';
        if (diferenciaTotal > 0) {
          tendencia = 'mejora';
        } else if (diferenciaTotal < 0) {
          tendencia = 'decline';
        } else {
          tendencia = 'igual';
        }

        return {
          evaluacion1: resumen1,
          evaluacion2: resumen2,
          diferenciaTotal,
          diferenciaDesempeno,
          diferenciaCompetencia,
          tendencia
        };
      })
    );
  }

  /**
   * Obtiene estadísticas del historial de un empleado
   */
  public getEstadisticasEmpleado(empleadoSecuencial: number): Observable<IEstadisticasHistorial> {
    this.logger.debug('Obteniendo estadísticas de empleado', { empleadoSecuencial });

    return this.getHistorialPorEmpleado(empleadoSecuencial).pipe(
      map((historial: IHistorialEvaluacionResumen[]) => {
        if (historial.length === 0) {
          throw new Error('No hay evaluaciones para este empleado');
        }

        const totalEvaluaciones = historial.length;
        const promedioGeneral = historial.reduce((sum, ev) => sum + ev.totalCalculo, 0) / totalEvaluaciones;
        const promedioDesempeno = historial.reduce((sum, ev) => sum + ev.puntuacionDesempenoColaborador, 0) / totalEvaluaciones;
        const promedioCompetencias = historial.reduce((sum, ev) => sum + ev.puntuacionCompetenciaColaborador, 0) / totalEvaluaciones;

        // Mejor evaluación
        const mejorEvaluacion = historial.reduce((max, ev) =>
          ev.totalCalculo > max.totalCalculo ? ev : max
        );

        // Evaluación más reciente
        const evaluacionMasReciente = historial[0];

        // Calcular tendencia (comparar últimas 3 evaluaciones)
        let tendenciaGeneral: 'mejora' | 'estable' | 'decline' = 'estable';
        if (historial.length >= 2) {
          const ultimaEval = historial[0].totalCalculo;
          const penultimaEval = historial[1].totalCalculo;

          if (ultimaEval > penultimaEval + 5) {
            tendenciaGeneral = 'mejora';
          } else if (ultimaEval < penultimaEval - 5) {
            tendenciaGeneral = 'decline';
          }
        }

        return {
          empleadoSecuencial,
          empleadoNombre: historial[0].empleadoNombre,
          totalEvaluaciones,
          promedioGeneral,
          mejorEvaluacion,
          evaluacionMasReciente,
          tendenciaGeneral,
          promedioDesempeno,
          promedioCompetencias
        };
      })
    );
  }

  /**
   * Obtiene datos para gráfico de evolución
   */
  public getDatosEvolucion(empleadoSecuencial: number): Observable<IEvolucionEvaluacion[]> {
    this.logger.debug('Obteniendo datos de evolución', { empleadoSecuencial });

    return this.getHistorialPorEmpleado(empleadoSecuencial).pipe(
      map((historial: IHistorialEvaluacionResumen[]) => {
        return historial
          .reverse() // Mostrar desde la más antigua a la más reciente
          .map(ev => ({
            periodo: ev.periodoNombre,
            fecha: ev.fechaRespuesta,
            totalCalculo: ev.totalCalculo,
            desempeno: ev.puntuacionDesempenoColaborador,
            competencias: ev.puntuacionCompetenciaColaborador
          }));
      })
    );
  }

  /**
   * Mapea una evaluación completa a un resumen para el historial
   */
  private mapearAResumen(evaluacion: IEvaluacion): IHistorialEvaluacionResumen {
    return {
      evaluacionId: evaluacion.id,
      periodId: evaluacion.periodId,
      periodoNombre: `Período ${evaluacion.periodId}`, // TODO: Obtener nombre real del período
      fechaInicio: '', // TODO: Obtener del período
      fechaFin: '', // TODO: Obtener del período
      empleadoSecuencial: evaluacion.empleadoSecuencial,
      empleadoNombre: evaluacion.empleado?.nombre || 'N/A',
      empleadoIdentificacion: evaluacion.empleado?.identificacion,
      departamento: evaluacion.empleado?.departamento,
      puesto: evaluacion.empleado?.puesto,
      fechaRespuesta: evaluacion.fechaRepuestas,
      estadoEvaluacion: evaluacion.estadoevaluacion,
      totalCalculo: evaluacion.totalCalculo,
      puntuacionDesempenoColaborador: evaluacion.puntuaciondesempenocolaborador,
      puntuacionCompetenciaColaborador: evaluacion.puntuacioncompetenciacolaborador,
      puntuacionDesempenoSupervisor: evaluacion.puntuaciondesempenosupervidor,
      puntuacionCompetenciaSupervisor: evaluacion.puntuacioncompetenciasupervisor,
      totalColaborador: evaluacion.totalcolaborador,
      totalSupervisor: evaluacion.totalsupervisor,
      supervisorNombre: undefined, // TODO: Obtener del empleado
      entrevistaConSupervisor: evaluacion.entrevistaConSupervisor
    };
  }

  /**
   * Exporta el historial a un formato compatible con Excel
   */
  public exportarHistorialAExcel(historial: IHistorialEvaluacionResumen[]): any[] {
    this.logger.info('Exportando historial a Excel', { cantidad: historial.length });

    return historial.map(ev => ({
      'ID Evaluación': ev.evaluacionId,
      'Período': ev.periodoNombre,
      'Empleado': ev.empleadoNombre,
      'Identificación': ev.empleadoIdentificacion || 'N/A',
      'Departamento': ev.departamento || 'N/A',
      'Puesto': ev.puesto || 'N/A',
      'Fecha': ev.fechaRespuesta,
      'Estado': ev.estadoEvaluacion,
      'Total': ev.totalCalculo.toFixed(2),
      'Desempeño Colaborador': ev.puntuacionDesempenoColaborador.toFixed(2),
      'Competencias Colaborador': ev.puntuacionCompetenciaColaborador.toFixed(2),
      'Total Colaborador': ev.totalColaborador.toFixed(2),
      'Desempeño Supervisor': ev.puntuacionDesempenoSupervisor.toFixed(2),
      'Competencias Supervisor': ev.puntuacionCompetenciaSupervisor.toFixed(2),
      'Total Supervisor': ev.totalSupervisor.toFixed(2),
      'Entrevista con Supervisor': ev.entrevistaConSupervisor ? 'Sí' : 'No'
    }));
  }
}
