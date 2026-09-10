import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, switchMap, of, catchError, shareReplay } from 'rxjs';
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
import { IEmpleado } from '../Models/Empleado/IEmpleado';
import { IPeriodo } from '../Models/Periodos/IPeriodo';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import {
  mapearResumen,
  coincideEstado,
  ordenarPorFechaDesc,
  calcularEstadisticas,
  datosEvolucion,
  compararResumenes,
  filasExcel
} from '../Helpers/historial-utils';

/**
 * Catálogos (empleados y periodos) resueltos una sola vez por servicio.
 * Claves: «secuencial» para empleados e «id» para periodos.
 */
export interface ICatalogosHistorial {
  empleados: Map<number, IEmpleado>;
  periodos: Map<number, IPeriodo>;
}

@Injectable({
  providedIn: 'root'
})
export class HistorialEvaluacion {
  /** Caché de catálogos para toda la vida del servicio; `limpiarCacheCatalogos()` la descarta. */
  private catalogosCache$?: Observable<ICatalogosHistorial>;

  constructor(
    private datos: DatosServiceService,
    private logger: LoggerService,
    private evaluacionController: Evaluacion,
    private periodosController: Periodos,
    private empleadosController: Empleados
  ) {}

  /**
   * Catálogos cacheados con shareReplay(1): dos llamadas seguidas implican
   * UNA sola petición de empleados y UNA de periodos. Un fallo de cualquiera
   * de las dos peticiones deriva en un Map vacío (el observable no emite error).
   */
  public getCatalogos(): Observable<ICatalogosHistorial> {
    if (!this.catalogosCache$) {
      const empleados$ = this.empleadosController.Gets().pipe(
        map((respuesta: ModelResponse) => this.construirMapEmpleados(respuesta)),
        catchError((err: Error) => {
          this.logger.warn('Falló la carga del catálogo de empleados; se usa Map vacío', err);
          return of(new Map<number, IEmpleado>());
        })
      );

      const periodos$ = this.periodosController.Gets().pipe(
        map((respuesta: ModelResponse) => this.construirMapPeriodos(respuesta)),
        catchError((err: Error) => {
          this.logger.warn('Falló la carga del catálogo de periodos; se usa Map vacío', err);
          return of(new Map<number, IPeriodo>());
        })
      );

      this.catalogosCache$ = forkJoin({ empleados: empleados$, periodos: periodos$ }).pipe(
        map(({ empleados, periodos }) => ({ empleados, periodos })),
        shareReplay(1)
      );
    }

    return this.catalogosCache$;
  }

  /**
   * Olvida la caché de catálogos; la siguiente llamada a getCatalogos()
   * vuelve a pedir empleados y periodos.
   */
  public limpiarCacheCatalogos(): void {
    this.catalogosCache$ = undefined;
  }

  /**
   * Obtiene el historial completo de evaluaciones para un empleado.
   */
  public getHistorialPorEmpleado(empleadoSecuencial: number): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial para empleado', { empleadoSecuencial });

    return forkJoin({
      evaluaciones: this.evaluacionController.GetEvaluacionesPorEmpleado(empleadoSecuencial),
      catalogos: this.getCatalogos()
    }).pipe(
      map(({ evaluaciones, catalogos }) => {
        const resumenes = (evaluaciones ?? []).map(ev => this.aResumen(ev, catalogos));
        return ordenarPorFechaDesc(resumenes);
      })
    );
  }

  /**
   * Obtiene el historial de todos los subordinados de un supervisor.
   * El catálogo se pide UNA vez para todos los subordinados.
   */
  public getHistorialSubordinados(
    supervisorSecuencial: number,
    fechaConsulta: string = new Date().toISOString().split('T')[0]
  ): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial de subordinados', { supervisorSecuencial, fechaConsulta });

    return this.empleadosController.Getsub(String(supervisorSecuencial), fechaConsulta).pipe(
      switchMap((respuesta: ModelResponse) => {
        const subordinados: IEmpleado[] = respuesta?.data ?? [];

        if (subordinados.length === 0) {
          this.logger.debug('No hay subordinados para este supervisor');
          return of([] as IHistorialEvaluacionResumen[]);
        }

        this.logger.debug('Subordinados encontrados', { cantidad: subordinados.length });

        // Catálogo UNA vez + evaluaciones de cada subordinado en paralelo.
        return forkJoin([
          this.getCatalogos(),
          ...subordinados.map(sub => this.evaluacionController.GetEvaluacionesPorEmpleado(sub.secuencial))
        ]).pipe(
          map((result: (ICatalogosHistorial | IEvaluacion[])[]) => {
            const catalogos = result[0] as ICatalogosHistorial;
            const historiales = result.slice(1) as IEvaluacion[][];
            const todos: IHistorialEvaluacionResumen[] = [];
            subordinados.forEach((sub, i) => {
              (historiales[i] ?? []).forEach(ev => {
                // El propio subordinado aporta nombre, identificación, usuario, etc.
                const periodo = catalogos.periodos.get(ev.periodId) ?? null;
                todos.push(mapearResumen(ev, sub, periodo));
              });
            });
            return ordenarPorFechaDesc(todos);
          })
        );
      })
    );
  }

  /**
   * Obtiene el historial global filtrado (empleado, periodo, estado y fechas).
   * 'SIN_INICIAR' encuentra las evaluaciones con estado null; con filtro de
   * fecha, las evaluaciones sin fecha válida quedan excluidas.
   */
  public getHistorialConFiltros(filtros: IHistorialEvaluacionFiltros): Observable<IHistorialEvaluacionResumen[]> {
    this.logger.debug('Obteniendo historial con filtros', filtros);

    return forkJoin({
      respuesta: this.datos.getdatos<IEvaluacion[]>(this.datos.URL + '/api/Evaluacions'),
      catalogos: this.getCatalogos()
    }).pipe(
      map(({ respuesta, catalogos }) => {
        const evaluaciones: IEvaluacion[] = respuesta?.data ?? [];

        const conFiltro = evaluaciones.filter(ev => {
          if (typeof filtros.empleadoSecuencial === 'number' && filtros.empleadoSecuencial > 0) {
            if (ev.empleadoSecuencial !== filtros.empleadoSecuencial) {
              return false;
            }
          }

          if (typeof filtros.periodoId === 'number' && filtros.periodoId > 0) {
            if (ev.periodId !== filtros.periodoId) {
              return false;
            }
          }

          if (filtros.estadoEvaluacion !== null && filtros.estadoEvaluacion !== undefined
              && filtros.estadoEvaluacion.trim() !== '') {
            if (!coincideEstado(ev.estadoevaluacion, filtros.estadoEvaluacion)) {
              return false;
            }
          }

          if (filtros.fechaDesde || filtros.fechaHasta) {
            const timestamp = new Date(ev.fechaRepuestas).getTime();
            if (Number.isNaN(timestamp)) {
              return false; // sin fecha válida → excluido cuando hay filtro de fecha
            }
            if (filtros.fechaDesde && timestamp < new Date(filtros.fechaDesde).getTime()) {
              return false;
            }
            if (filtros.fechaHasta && timestamp > new Date(filtros.fechaHasta).getTime()) {
              return false;
            }
          }

          return true;
        });

        const resumenes = conFiltro.map(ev => this.aResumen(ev, catalogos));
        return ordenarPorFechaDesc(resumenes);
      })
    );
  }

  /**
   * Compara dos evaluaciones. Si no son comparables (medio año o misma
   * evaluación) el observable emite error con el motivo de puedeComparar.
   */
  public compararEvaluaciones(
    evaluacionId1: number,
    evaluacionId2: number
  ): Observable<IComparacionEvaluaciones> {
    this.logger.debug('Comparando evaluaciones', { evaluacionId1, evaluacionId2 });

    return forkJoin({
      eval1: this.evaluacionController.Get(String(evaluacionId1)),
      eval2: this.evaluacionController.Get(String(evaluacionId2)),
      catalogos: this.getCatalogos()
    }).pipe(
      map(({ eval1, eval2, catalogos }) => {
        try {
          const resumen1 = this.aResumen(eval1, catalogos);
          const resumen2 = this.aResumen(eval2, catalogos);
          return compararResumenes(resumen1, resumen2);
        } catch (e) {
          // Mismo Error (con el motivo de puedeComparar) como error del observable.
          throw e;
        }
      })
    );
  }

  /**
   * Obtiene estadísticas del historial de un empleado
   * (promedios y tendencia solo con evaluaciones finales).
   */
  public getEstadisticasEmpleado(empleadoSecuencial: number): Observable<IEstadisticasHistorial> {
    this.logger.debug('Obteniendo estadísticas de empleado', { empleadoSecuencial });

    return this.getHistorialPorEmpleado(empleadoSecuencial).pipe(
      map((historial: IHistorialEvaluacionResumen[]) => calcularEstadisticas(historial))
    );
  }

  /**
   * Obtiene datos para gráfico de evolución (solo evaluaciones finales).
   */
  public getDatosEvolucion(empleadoSecuencial: number): Observable<IEvolucionEvaluacion[]> {
    this.logger.debug('Obteniendo datos de evolución', { empleadoSecuencial });

    return this.getHistorialPorEmpleado(empleadoSecuencial).pipe(
      map((historial: IHistorialEvaluacionResumen[]) => datosEvolucion(historial))
    );
  }

  /**
   * Exporta el historial a un formato compatible con Excel (síncrono).
   */
  public exportarHistorialAExcel(historial: IHistorialEvaluacionResumen[]): Record<string, string | number>[] {
    this.logger.info('Exportando historial a Excel', { cantidad: historial.length });

    return filasExcel(historial);
  }

  // ---------- Privados ----------

  /**
   * Mapea una evaluación cruda a resumen usando el catálogo de empleados
   * y periodos (con `ev.empleado` como último recurso si existe).
   */
  private aResumen(evaluacion: IEvaluacion, catalogos: ICatalogosHistorial): IHistorialEvaluacionResumen {
    const empleado = catalogos.empleados.get(evaluacion.empleadoSecuencial) ?? evaluacion.empleado ?? null;
    const periodo = catalogos.periodos.get(evaluacion.periodId) ?? null;
    return mapearResumen(evaluacion, empleado, periodo);
  }

  private construirMapEmpleados(respuesta: ModelResponse | null | undefined): Map<number, IEmpleado> {
    const mapa = new Map<number, IEmpleado>();
    const lista: IEmpleado[] = respuesta?.data ?? [];
    lista.forEach(e => mapa.set(e.secuencial, e));
    return mapa;
  }

  private construirMapPeriodos(respuesta: ModelResponse | null | undefined): Map<number, IPeriodo> {
    const mapa = new Map<number, IPeriodo>();
    const lista: IPeriodo[] = respuesta?.data ?? [];
    lista.forEach(p => mapa.set(p.id, p));
    return mapa;
  }
}