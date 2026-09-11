import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, throwError } from 'rxjs';
import { IObjetivo } from '../Models/Objetivo/IObjetivo';
import {
  IBitacoraEvento,
  IBitacoraFiltro,
  IBitacoraResumenCompetencia,
  IBitacoraResumenEmpleado,
  ICompetenciaCatalogo,
  IValidacionEvento
} from '../Models/Bitacora/IBitacora';
import { IBitacoraEventoCompetencia } from '../Models/Bitacora/IBitacora';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { validarEvento, eventoNuevo, fechaISO, filasExcel as filasExcelUtil, rangoPeriodo } from '../Helpers/bitacora-utils';
import { DatosServiceService } from '../Services/datos-service.service';
import { LoggerService } from '../Services/logger.service';

/** Shape del periodo activo (GET /api/Periods/activo). */
export interface IPeriodoActivo {
  id: number;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: string;
}

/**
 * Controlador de la bitácora de eventos (Fase 3, RRHH).
 * Solo HTTP, caché del catálogo de competencias y delegación a bitacora-utils;
 * toda la lógica pura vive en '../Helpers/bitacora-utils'.
 */
@Injectable({ providedIn: 'root' })
export class Bitacora {
  /** Caché de /api/Objetivoes para toda la vida del servicio. */
  private catalogoCache$?: Observable<ModelResponse<IObjetivo[]>>;

  constructor(
    private datos: DatosServiceService,
    private logger: LoggerService
  ) {}

  /** Ruta base del API de la bitácora. */
  readonly rutaapi: string = `${this.datos.URL}/api/BitacoraEventos`;

  /**
   * Lista eventos del colaborador con los filtros que tengan valor
   * (no envía parámetros nulos ni vacíos).
   */
  listar(filtro: IBitacoraFiltro): Observable<IBitacoraEvento[]> {
    const empleado = filtro?.empleadoSecuencial ?? 0;
    if (empleado <= 0) {
      this.logger.warn('listar: falta el colaborador');
      return throwError(() => new Error('Falta el colaborador.'));
    }

    const params: Record<string, string> = { empleadoid: String(empleado) };
    const desde = filtro.desde?.trim();
    const hasta = filtro.hasta?.trim();
    const tipo = filtro.tipo?.trim();
    const objetivoId = filtro.objetivoId ?? 0;
    if (desde) params['desde'] = encodeURIComponent(desde);
    if (hasta) params['hasta'] = encodeURIComponent(hasta);
    if (tipo) params['tipo'] = encodeURIComponent(tipo);
    if (objetivoId > 0) params['objetivoid'] = String(objetivoId);

    const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    const url = `${this.rutaapi}?${query}`;
    this.logger.debug('listar', { filtro });

    return this.datos.getbyid<IBitacoraEvento[]>(url);
  }

  /** Obtiene un evento por su id. */
  obtener(id: number): Observable<IBitacoraEvento> {
    this.logger.debug('obtener', { id });
    return this.datos.getbyid<IBitacoraEvento>(`${this.rutaapi}/${id}`);
  }

  /**
   * Crea (id 0/undefined → POST) o actualiza (id > 0 → PUT) tras validar.
   * El PUT responde 204: se emite el mismo evento enviado.
   */
  guardar(evento: IBitacoraEvento): Observable<IBitacoraEvento> {
    const validacion = validarEvento(evento);
    if (!validacion.valido) {
      const mensaje = validacion.errores.join(' ');
      this.logger.warn('guardar: evento inválido', { errores: validacion.errores });
      return throwError(() => new Error(mensaje));
    }

    const limpio = this.normalizarParaEnviar(evento);
    if (limpio.id && limpio.id > 0) {
      this.logger.debug('guardar (PUT)', { id: limpio.id });
      return this.datos.updatedatos<IBitacoraEvento>(`${this.rutaapi}/${limpio.id}`, limpio as IBitacoraEvento).pipe(
        map(() => evento) // 204 sin cuerpo: se emite el evento original enviado
      );
    }

    this.logger.debug('guardar (POST)', { empleadoSecuencial: limpio.empleadoSecuencial });
    return this.datos.insertardatos<IBitacoraEvento>(this.rutaapi, limpio as IBitacoraEvento);
  }

  /** Borrado lógico (con usuario secuencial de auditoría). Emite true al completar. */
  eliminar(id: number, secuencial: number): Observable<boolean> {
    this.logger.debug('eliminar', { id, secuencial });
    return this.datos.delbyid<boolean>(`${this.rutaapi}/${id}?secuencial=${secuencial}`).pipe(
      map(() => true) // 204 sin cuerpo: se emite true
    );
  }

  /** Resumen por competencia del colaborador en un periodo. */
  resumen(empleadoSecuencial: number, periodoId: number): Observable<IBitacoraResumenCompetencia[]> {
    this.logger.debug('resumen', { empleadoSecuencial, periodoId });
    return this.datos.getbyid<IBitacoraResumenCompetencia[]>(
      `${this.rutaapi}/resumen?empleadoid=${empleadoSecuencial}&periodoid=${periodoId}`
    );
  }

  /** Resumen de todo el equipo de un supervisor (desde/hasta opcionales). */
  equipo(supervisorSecuencial: number, desde?: string | null, hasta?: string | null): Observable<IBitacoraResumenEmpleado[]> {
    const params = `supervisor=${supervisorSecuencial}`;
    const d = desde?.trim();
    const h = hasta?.trim();
    const query = params
      + (d ? `&desde=${encodeURIComponent(d)}` : '')
      + (h ? `&hasta=${encodeURIComponent(h)}` : '');
    this.logger.debug('equipo', { supervisorSecuencial, desde: desde ?? null, hasta: hasta ?? null });
    return this.datos.getbyid<IBitacoraResumenEmpleado[]>(`${this.rutaapi}/equipo?${query}`);
  }

  /**
   * Catálogo de competencias del periodo: /api/Objetivoes se pide UNA sola vez
   * (shareReplay(1)); luego se filtra por periodoId y se mapea.
   * Si el periodo no tiene competencias, emite [].
   */
  catalogoCompetencias(periodoId: number): Observable<ICompetenciaCatalogo[]> {
    if (!this.catalogoCache$) {
      this.catalogoCache$ = this.datos.getdatos<IObjetivo[]>(this.datos.URL + '/api/Objetivoes').pipe(
        shareReplay(1)
      );
    }
    this.logger.debug('catalogoCompetencias', { periodoId });
    return this.catalogoCache$.pipe(
      map((resp: ModelResponse<IObjetivo[]>) => {
        const delPeriodo = (resp?.data ?? []).filter((o: IObjetivo) => o.periodoId === periodoId);
        const mapeado: ICompetenciaCatalogo[] = delPeriodo.map((o: IObjetivo) => ({
          objetivoId: o.id,
          nombre: o.nombre,
          grupoId: o.grupoCompetenciaId,
          grupo: o.grupoCompetencia?.nombre ?? ''
        }));
        // Orden: primero grupo, luego id.
        return mapeado.sort((a, b) => a.grupoId - b.grupoId || a.objetivoId - b.objetivoId);
      })
    );
  }

  /** Descarta la caché del catálogo; la próxima llamada vuelve a pedir /api/Objetivoes. */
  limpiarCacheCatalogo(): void {
    this.catalogoCache$ = undefined;
  }

  /** Periodo activo según el API. */
  periodoActivo(): Observable<IPeriodoActivo> {
    this.logger.debug('periodoActivo');
    return this.datos.getbyid<IPeriodoActivo>(`${this.datos.URL}/api/Periods/activo`);
  }

  /** Atajo: evento nuevo del formulario. */
  nuevo(empleadoSecuencial: number, registradoPorSecuencial: number): IBitacoraEvento {
    return eventoNuevo(empleadoSecuencial, registradoPorSecuencial);
  }

  /** Atajo: validación del formulario. */
  validar(evento: IBitacoraEvento): IValidacionEvento {
    return validarEvento(evento);
  }

  /** Atajo: filas planas para exportar a Excel. */
  filasExcel(eventos: IBitacoraEvento[], nombreEmpleado: string): Record<string, string | number>[] {
    return filasExcelUtil(eventos, nombreEmpleado);
  }

  /** Rango de fechas del periodo (delegación para comodidad de componentes). */
  rangoPeriodo(periodo: IPeriodoActivo): { desde: string; hasta: string } {
    return rangoPeriodo(periodo);
  }

  /**
   * Texto legible de un error: `error.error.mensaje` si existe,
   * luego `error.message`, por último 'Error desconocido'.
   */
  mensajeError(error: unknown): string {
    const e = error as { error?: { mensaje?: unknown; errors?: Record<string, unknown> }; message?: unknown } | null;
    if (e && e.error && typeof e.error.mensaje === 'string' && e.error.mensaje.length > 0) {
      return e.error.mensaje;
    }
    // ProblemDetails de ASP.NET ({ errors: { Campo: ['texto'] } }): las DataAnnotations del modelo
    // se evalúan antes que la validación propia del API (PLAN-BITACORA §9.5).
    if (e && e.error && e.error.errors && typeof e.error.errors === 'object') {
      const textos = Object.values(e.error.errors)
        .flatMap(v => (Array.isArray(v) ? v : [v]))
        .filter((v): v is string => typeof v === 'string' && v.length > 0);
      if (textos.length > 0) { return textos.join(' '); }
    }
    if (e && typeof e.message === 'string' && e.message.length > 0) {
      return e.message;
    }
    return 'Error desconocido';
  }

  // ---------- Privados ----------

  /**
   * Normaliza antes de enviar: trim, fecha 'YYYY-MM-DD' y competencias con ids de referencia.
   * Devuelve el cuerpo de solicitud SIN las claves de solo lectura cuando no tengan valor:
   * nunca `registradoPorNombre` (solo lectura), y `fechaRegistro` solo si tiene valor.
   */
  private normalizarParaEnviar(evento: IBitacoraEvento): Partial<IBitacoraEvento> {
    const { fechaRegistro, registradoPorNombre, ...resto } = evento; // evita enviar ambas
    const descripcion = (evento.descripcion ?? '').trim();
    const fecha = fechaISO(evento.fechaEvento); // 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss' o Date
    const competencias: IBitacoraEventoCompetencia[] = (evento.competencias ?? []).map((c) => ({
      ...c,
      id: c.id ?? 0,
      bitacoraEventoId: evento.id ?? 0
    }));
    const cuerpo: Partial<IBitacoraEvento> = { ...resto, descripcion, fechaEvento: fecha, competencias };
    if (fechaRegistro) cuerpo.fechaRegistro = fechaRegistro;
    return cuerpo;
  }
}
