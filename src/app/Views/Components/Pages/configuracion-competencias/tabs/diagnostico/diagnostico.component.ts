import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, from, map, mergeMap, of, toArray } from 'rxjs';

import { Departamento } from 'src/app/Controllers/Departamento';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { Metas } from 'src/app/Controllers/Metas';
import { Puestos } from 'src/app/Controllers/Puestos';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IEvaluacion } from 'src/app/Models/Evaluacion/IEvaluacion';
import { IMetaDts } from 'src/app/Models/Meta/IMeta';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcelService } from 'src/app/Services/excel.service';
import { LoggerService } from 'src/app/Services/logger.service';

/** Listado 1: puesto ocupado por gente activa que no tiene competencias en el periodo. */
export interface IPuestoSinCompetencias {
  puestoSecuencial: number;
  puesto: string;
  departamento: string;
  empleadosActivos: number;
  /** false cuando el API no puede listar las competencias de ese puesto (ver notas de la clase). */
  verificable: boolean;
  observacion: string;
}

/** Listado 2: puesto que no resuelve a una categoria valida (el empleado no ve competencias). */
export interface IPuestoSinCategoria {
  puestoSecuencial: number;
  puesto: string;
  categoriaPuestoId: number;
  problema: string;
  empleadosActivos: number;
  empleados: string;
}

/** Listado 3: empleado activo que no tiene evaluacion en el periodo. */
export interface IEmpleadoSinEvaluacion {
  secuencial: number;
  codigousuario: string;
  nombre: string;
  puestoSecuencial: number;
  cargo: string;
  departamento: string;
}

/**
 * Pestaña "Diagnóstico" de la pantalla de Configuración de Competencias.
 *
 * Responde por pantalla las tres preguntas que hoy se contestan por SQL
 * (Docs/proceso-configuracion-competencias-periodo8.md §1.1, §1.2, §5.2 y §5.3):
 *   1. ¿Qué puestos con gente activa se quedaron sin competencias en el periodo?
 *   2. ¿Qué puestos no resuelven a una categoría válida? (el empleado no ve nada)
 *   3. ¿Qué empleados activos no tienen evaluación en el periodo?
 *
 * ── PUNTO CIEGO DEL API, COMPROBADO CONTRA EL AMBIENTE DE PRUEBA ───────────────
 * Los CUATRO GET de GoalsController (`/api/Goals`, `/api/Goals/{id}`,
 * `/api/Goals/periodo` y `/api/Goals/puesto/{id}`) construyen la consulta con el
 * mismo cross-apply obligatorio contra la tabla de departamentos:
 *
 *     from depa in _context.Deparments.Where(x => x.secuencial == posi.DepartmentSecuencial)
 *
 * Si el `DepartmentSecuencial` del puesto no existe en el catálogo de
 * departamentos (caso típico: vale 0), la fila se cae de la consulta y el API
 * devuelve el puesto como si NO tuviera competencias.
 *
 * Medido el 2026-08-24 contra http://192.168.7.222:7071 (BD Evaluaciones_Test):
 * el puesto 19 (GERENTE GESTIÓN HUMANA, DepartmentSecuencial = 0) tiene 12
 * competencias en el periodo 7 y 12 en el periodo 8 en base de datos, y sin
 * embargo `/api/Goals` devuelve 0 filas suyas, `/api/Goals/periodo` 0 y
 * `/api/Goals/puesto/19` responde `{"count":0,"data":[]}`. NINGÚN endpoint sirve
 * para descartarlo. Los totales cuadran con el defecto: el periodo 8 tiene 115
 * filas en `Goal` y el API lista 103; el periodo 7 tiene 910 y lista 803.
 *
 * Por eso esta pestaña NO da por bueno un "no tiene competencias" cuando el
 * puesto es uno de los que el API no puede ver. Esos puestos se separan en un
 * bloque aparte, marcados como NO VERIFICABLES, para que nadie les cree las
 * competencias a mano y termine con el doble (el puesto 19 acabaría con 24).
 * La única comprobación concluyente para ese bloque es por SQL.
 *
 * El puesto es invisible para el API cuando su `departmentSecuencial` no aparece
 * en el catálogo que devuelve `GET /api/Departments`, que es justo la condición
 * que hace fallar el join del backend.
 *
 * ── SEGUNDO DEFECTO, TAMBIÉN COMPROBADO ───────────────────────────────────────
 * `GET /api/Positions` (el listado) proyecta a mano un `new Position { ... }` y
 * NO asigna `CategoriaPuestoId`, así que devuelve 0 en los 209 puestos. Usarlo
 * para el listado 2 marcaría como rotos TODOS los puestos. `GET /api/Positions/{id}`
 * sí devuelve la entidad completa con el valor real, y es el que se usa aquí,
 * pidiendo sólo los puestos que ocupa gente activa (90 en el ambiente de prueba).
 *
 * ── TERCER DETALLE ────────────────────────────────────────────────────────────
 * `Empleados` trae filas repetidas: 464 activas para 455 secuenciales distintos.
 * Todo se cuenta deduplicando por `secuencial`, como hacen las consultas SQL de
 * referencia con COUNT(DISTINCT ...).
 */
@Component({
  selector: 'app-cc-diagnostico',
  templateUrl: './diagnostico.component.html',
  styleUrls: ['./diagnostico.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule
  ],
  providers: [ExcelService]
})
export class DiagnosticoComponent implements OnChanges {

  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /**
   * Se emite tras cada alta, edición o baja para que el shell refresque los contadores.
   * El Diagnóstico sólo lee, así que en la práctica no lo emite nunca; se mantiene
   * porque forma parte del contrato de las pestañas.
   */
  @Output() cambios = new EventEmitter<void>();

  /** Cuántos GET /api/Positions/{id} se lanzan a la vez (hay QA usando el servidor). */
  private readonly CONCURRENCIA_PUESTOS = 4;

  private readonly titulo = 'Diagnóstico del periodo';

  public cargando = false;
  public analizado = false;
  public paso = '';

  /** Listado 1, sólo los puestos que el API puede confirmar. */
  public sinCompetencias: IPuestoSinCompetencias[] = [];

  /** Listado 1 bis: puestos que el API no puede confirmar por el defecto del join. */
  public noVerificables: IPuestoSinCompetencias[] = [];

  /** Listado 2. */
  public sinCategoria: IPuestoSinCategoria[] = [];

  /** Listado 3. */
  public sinEvaluacion: IEmpleadoSinEvaluacion[] = [];

  /** Contexto para que el usuario sepa sobre cuánto se está diagnosticando. */
  public totalEmpleadosActivos = 0;
  public totalPuestosOcupados = 0;
  public totalPuestosCiegos = 0;
  public totalCompetenciasPeriodo = 0;

  /** Avisos de lecturas que fallaron; el diagnóstico se muestra igual pero marcado. */
  public incidencias: string[] = [];

  public readonly columnasSinCompetencias = ['puestoSecuencial', 'puesto', 'departamento', 'empleadosActivos', 'observacion'];
  public readonly columnasSinCategoria = ['puestoSecuencial', 'puesto', 'categoriaPuestoId', 'problema', 'empleadosActivos'];
  public readonly columnasSinEvaluacion = ['secuencial', 'codigousuario', 'nombre', 'cargo', 'departamento'];

  constructor(
    private empleadosController: Empleados,
    private puestosController: Puestos,
    private departamentoController: Departamento,
    private metasController: Metas,
    private evaluacionController: Evaluacion,
    private excelService: ExcelService,
    private datosService: DatosServiceService,
    private logger: LoggerService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodoId'] && this.periodoId) {
      this.ejecutar();
    }
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  /**
   * Ejecuta el diagnóstico completo del periodo.
   * Descarga UNA sola vez cada catálogo y luego resuelve la categoría real de
   * los puestos ocupados con llamadas puntuales por id.
   */
  public ejecutar(): void {
    if (!this.periodoId || this.cargando) { return; }

    this.cargando = true;
    this.analizado = false;
    this.incidencias = [];
    this.paso = 'Leyendo empleados, puestos, departamentos, competencias y evaluaciones…';

    forkJoin({
      empleados: this.empleadosController.Gets().pipe(
        catchError(err => this.incidencia('empleados (GET /api/Empleadoes)', err, this.respuestaVacia()))
      ),
      puestos: this.puestosController.Gets().pipe(
        catchError(err => this.incidencia('puestos (GET /api/Positions)', err, this.respuestaVacia() as ModelResponse<IPuesto[]>))
      ),
      departamentos: this.departamentoController.Gets().pipe(
        catchError(err => this.incidencia('departamentos (GET /api/Departments)', err, this.respuestaVacia()))
      ),
      metas: this.metasController.getmetasperiodo(this.periodoId).pipe(
        catchError(err => this.incidencia('competencias del periodo (GET /api/Goals/periodo)', err, [] as IMetaDts[]))
      ),
      evaluaciones: this.evaluacionController.GetEvaluacionesPorPeriodo(this.periodoId).pipe(
        catchError(err => this.incidencia('evaluaciones (GET /api/Evaluacions)', err, [] as IEvaluacion[]))
      )
    }).subscribe({
      next: (r) => this.procesar(r),
      error: (err) => {
        this.cargando = false;
        this.logger.error('Diagnóstico: error ejecutando el diagnóstico', err, { periodoId: this.periodoId });
        this.datosService.showMessage(
          'No se pudo ejecutar el diagnóstico: ' + this.mensajeDe(err), this.titulo, 'error');
      }
    });
  }

  /** Arma los tres listados con lo que devolvieron los catálogos. */
  private procesar(r: {
    empleados: ModelResponse; puestos: ModelResponse<IPuesto[]>; departamentos: ModelResponse;
    metas: IMetaDts[]; evaluaciones: IEvaluacion[];
  }): void {

    const empleados: IEmpleado[] = Array.isArray(r.empleados?.data) ? r.empleados.data : [];
    const puestos: IPuesto[] = Array.isArray(r.puestos?.data) ? r.puestos.data : [];
    const departamentos: IDepartamento[] = Array.isArray(r.departamentos?.data) ? r.departamentos.data : [];
    const metas: IMetaDts[] = r.metas ?? [];
    const evaluaciones: IEvaluacion[] = r.evaluaciones ?? [];

    // Activos deduplicados por secuencial (la tabla trae filas repetidas).
    const activos = new Map<number, IEmpleado>();
    for (const e of empleados) {
      if (!e || (e.codigoestado ?? '').toString().trim().toUpperCase() !== 'A') { continue; }
      if (!activos.has(e.secuencial)) { activos.set(e.secuencial, e); }
    }

    const puestosPorId = new Map<number, IPuesto>(puestos.map(p => [Number(p.secuencial), p]));
    const departamentosValidos = new Set<number>(departamentos.map(d => Number(d.secuencial)));

    // Puestos que el join del API deja fuera: su departamento no está en el catálogo.
    const puestosCiegos = new Set<number>();
    for (const p of puestos) {
      if (!departamentosValidos.has(Number(p.departmentSecuencial))) {
        puestosCiegos.add(Number(p.secuencial));
      }
    }

    // Empleados activos agrupados por el puesto que ocupan.
    const porPuesto = new Map<number, IEmpleado[]>();
    activos.forEach(e => {
      const sc = Number(e.scargo) || 0;
      if (!porPuesto.has(sc)) { porPuesto.set(sc, []); }
      porPuesto.get(sc)!.push(e);
    });

    const puestosConCompetencias = new Set<number>(
      metas.filter(m => !!m && Number(m.positionSecuencial) > 0).map(m => Number(m.positionSecuencial))
    );

    this.totalEmpleadosActivos = activos.size;
    this.totalPuestosOcupados = porPuesto.size;
    this.totalPuestosCiegos = puestosCiegos.size;
    this.totalCompetenciasPeriodo = metas.length;

    // ── Listado 1 ────────────────────────────────────────────────────────────
    const confirmados: IPuestoSinCompetencias[] = [];
    const ciegos: IPuestoSinCompetencias[] = [];

    porPuesto.forEach((suyos, secuencial) => {
      const puesto = puestosPorId.get(secuencial);
      // Si el SCARGO no existe en el catálogo no es un "puesto sin competencias":
      // es un puesto inexistente, y sale en el listado 2.
      if (!puesto) { return; }
      if (puestosConCompetencias.has(secuencial)) { return; }

      const esCiego = puestosCiegos.has(secuencial);
      const fila: IPuestoSinCompetencias = {
        puestoSecuencial: secuencial,
        puesto: puesto.descripcion ?? '',
        departamento: puesto.departamento ?? '',
        empleadosActivos: suyos.length,
        verificable: !esCiego,
        observacion: esCiego
          ? `NO VERIFICABLE: su departamento (${puesto.departmentSecuencial}) no existe en el catálogo, ` +
            'así que el API no puede listar sus competencias aunque las tenga. Confirme por SQL antes de crear nada.'
          : 'Sin competencias en el periodo'
      };
      (esCiego ? ciegos : confirmados).push(fila);
    });

    this.sinCompetencias = confirmados.sort(this.porDepartamentoYPuesto);
    this.noVerificables = ciegos.sort(this.porDepartamentoYPuesto);

    // ── Listado 3 ────────────────────────────────────────────────────────────
    const conEvaluacion = new Set<number>(
      evaluaciones.filter(ev => !!ev).map(ev => Number(ev.empleadoSecuencial))
    );

    this.sinEvaluacion = Array.from(activos.values())
      .filter(e => !conEvaluacion.has(Number(e.secuencial)))
      .map(e => ({
        secuencial: Number(e.secuencial),
        codigousuario: e.codigousuario ?? '',
        nombre: e.nombreunido ?? '',
        puestoSecuencial: Number(e.scargo) || 0,
        cargo: e.cargo ?? '',
        departamento: e.departamento ?? ''
      }))
      .sort((a, b) => a.departamento.localeCompare(b.departamento) || a.nombre.localeCompare(b.nombre));

    // ── Listado 2: necesita la categoría real, puesto por puesto ─────────────
    this.resolverCategorias(porPuesto, puestosPorId);
  }

  /**
   * Construye el listado 2 preguntando la categoría real de cada puesto ocupado.
   * Sólo se piden por id los puestos que SÍ existen en el catálogo: pedir uno
   * inexistente daría 404 y el interceptor de errores abriría un cuadro de diálogo
   * por cada uno.
   */
  private resolverCategorias(porPuesto: Map<number, IEmpleado[]>,
                             puestosPorId: Map<number, IPuesto>): void {

    const filas: IPuestoSinCategoria[] = [];
    const aConsultar: number[] = [];

    porPuesto.forEach((suyos, secuencial) => {
      if (puestosPorId.has(secuencial)) {
        aConsultar.push(secuencial);
        return;
      }
      // SCARGO que no existe en el catálogo de puestos.
      filas.push({
        puestoSecuencial: secuencial,
        puesto: (suyos[0]?.cargo ?? '').toString(),
        categoriaPuestoId: 0,
        problema: 'SCARGO sin match en positions',
        empleadosActivos: suyos.length,
        empleados: this.nombresDe(suyos)
      });
    });

    this.paso = `Consultando la categoría real de ${aConsultar.length} puesto(s)…`;

    if (aConsultar.length === 0) {
      this.terminar(filas);
      return;
    }

    from(aConsultar).pipe(
      mergeMap(secuencial => this.puestosController.Get(String(secuencial)).pipe(
        map(puesto => ({ secuencial, puesto })),
        catchError((err) => {
          this.logger.warn('Diagnóstico: no se pudo leer la categoría de un puesto',
            { secuencial, error: this.mensajeDe(err) });
          this.incidencias.push(
            `No se pudo leer la categoría del puesto ${secuencial}; queda fuera del listado 2.`);
          return of({ secuencial, puesto: null as IPuesto | null });
        })
      ), this.CONCURRENCIA_PUESTOS),
      toArray()
    ).subscribe({
      next: (respuestas) => {
        for (const { secuencial, puesto } of respuestas) {
          if (!puesto) { continue; }
          const categoriaId = Number(puesto.categoriaPuestoId) || 0;
          if (categoriaId !== 0) { continue; }
          const suyos = porPuesto.get(secuencial) ?? [];
          filas.push({
            puestoSecuencial: secuencial,
            puesto: puesto.descripcion ?? puestosPorId.get(secuencial)?.descripcion ?? '',
            categoriaPuestoId: 0,
            problema: 'Puesto con CategoriaPuestoId = 0',
            empleadosActivos: suyos.length,
            empleados: this.nombresDe(suyos)
          });
        }
        this.terminar(filas);
      },
      error: (err) => {
        this.logger.error('Diagnóstico: error resolviendo las categorías de puesto', err);
        this.incidencias.push('Falló la consulta de categorías; el listado 2 puede estar incompleto.');
        this.terminar(filas);
      }
    });
  }

  private terminar(filasSinCategoria: IPuestoSinCategoria[]): void {
    this.sinCategoria = filasSinCategoria.sort((a, b) =>
      a.problema.localeCompare(b.problema) || a.puestoSecuencial - b.puestoSecuencial);

    this.cargando = false;
    this.analizado = true;
    this.paso = '';

    this.logger.info('Diagnóstico: terminado', {
      periodoId: this.periodoId,
      empleadosActivos: this.totalEmpleadosActivos,
      puestosOcupados: this.totalPuestosOcupados,
      sinCompetencias: this.sinCompetencias.length,
      noVerificables: this.noVerificables.length,
      sinCategoria: this.sinCategoria.length,
      sinEvaluacion: this.sinEvaluacion.length,
      incidencias: this.incidencias.length
    });
  }

  // ── Exportación ───────────────────────────────────────────────────────────

  /**
   * Listado 1 a Excel. Se exportan juntos los confirmados y los no verificables,
   * con una columna que los distingue: quien reciba el archivo tiene que ver el
   * aviso, no sólo la lista.
   */
  public exportarSinCompetencias(): void {
    const filas = [...this.sinCompetencias, ...this.noVerificables].map(f => ({
      'Puesto (secuencial)': f.puestoSecuencial,
      'Puesto': f.puesto,
      'Departamento': f.departamento,
      'Empleados activos': f.empleadosActivos,
      'Confirmado por el API': f.verificable ? 'Sí' : 'NO — verificar por SQL',
      'Observación': f.observacion
    }));
    this.exportar(filas, `puestos-sin-competencias-periodo-${this.periodoId}`);
  }

  public exportarSinCategoria(): void {
    const filas = this.sinCategoria.map(f => ({
      'Puesto (secuencial)': f.puestoSecuencial,
      'Puesto': f.puesto,
      'CategoriaPuestoId': f.categoriaPuestoId,
      'Problema': f.problema,
      'Empleados activos': f.empleadosActivos,
      'Empleados': f.empleados
    }));
    this.exportar(filas, `puestos-sin-categoria-periodo-${this.periodoId}`);
  }

  public exportarSinEvaluacion(): void {
    const filas = this.sinEvaluacion.map(f => ({
      'Secuencial': f.secuencial,
      'Usuario': f.codigousuario,
      'Empleado': f.nombre,
      'Puesto (secuencial)': f.puestoSecuencial,
      'Cargo': f.cargo,
      'Departamento': f.departamento
    }));
    this.exportar(filas, `empleados-sin-evaluacion-periodo-${this.periodoId}`);
  }

  private exportar(filas: any[], nombre: string): void {
    if (filas.length === 0) {
      this.datosService.showMessage('No hay filas que exportar en este listado.', this.titulo, 'info');
      return;
    }
    try {
      this.excelService.exportAsExcelFile(filas, nombre);
      this.logger.info('Diagnóstico: listado exportado', { nombre, filas: filas.length });
    } catch (err: any) {
      this.logger.error('Diagnóstico: error exportando a Excel', err, { nombre });
      this.datosService.showMessage(
        'No se pudo generar el Excel: ' + this.mensajeDe(err), this.titulo, 'error');
    }
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  private porDepartamentoYPuesto = (a: IPuestoSinCompetencias, b: IPuestoSinCompetencias): number =>
    a.departamento.localeCompare(b.departamento) || a.puesto.localeCompare(b.puesto);

  private nombresDe(empleados: IEmpleado[]): string {
    return empleados.map(e => `${e.secuencial} ${e.nombreunido}`).join('; ');
  }

  private respuestaVacia(): ModelResponse {
    return { exito: 0, mensaje: '', count: 0, data: [] };
  }

  /** Registra una lectura fallida y sigue adelante con un valor vacío. */
  private incidencia<T>(que: string, err: any, vacio: T) {
    this.logger.error(`Diagnóstico: falló la lectura de ${que}`, err, { periodoId: this.periodoId });
    this.incidencias.push(`No se pudo leer ${que}: ${this.mensajeDe(err)}. El diagnóstico queda incompleto.`);
    return of(vacio);
  }

  private mensajeDe(err: any): string {
    return err?.error?.mensaje ?? err?.error?.title ?? err?.message ?? 'error desconocido';
  }
}
