import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, Observable, of } from 'rxjs';

import { Departamento } from 'src/app/Controllers/Departamento';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Metas } from 'src/app/Controllers/Metas';
import { Objetivo } from 'src/app/Controllers/Objetivo';
import { Periodos } from 'src/app/Controllers/Periodos';
import { Puestos } from 'src/app/Controllers/Puestos';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IMeta, IMetaDts, IResultadoLoteMetas, IResumenMetasPuesto } from 'src/app/Models/Meta/IMeta';
import { IObjetivoDts } from 'src/app/Models/Objetivo/IObjetivo';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { LoggerService } from 'src/app/Services/logger.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  DialogoClonadoMetasComponent,
  IDatosDialogoClonado,
  IResultadoDialogoClonado
} from './dialogo-clonado-metas.component';

/** Estado del semáforo de peso de un puesto. */
type EstadoPeso = 'ok' | 'falta' | 'exceso' | 'vacio' | 'desconocido';

/** Fila del listado de puestos. */
interface IFilaPuesto {
  secuencial: number;
  puesto: string;
  departamento: string;
  departmentSecuencial: number;
  /** true si algún empleado activo ocupa el puesto (`scargo` = secuencial). */
  ocupado: boolean;
  cantidad: number;
  pesoTotal: number;
  estado: EstadoPeso;
}

/** Fila de la tabla de competencias del puesto elegido. */
interface IFilaMeta {
  id: number;
  objetivoId: number;
  competencia: string;
  descripcion: string;
  peso: number;
  /** true si el objetivoId no pertenece al catálogo del periodo que se está viendo. */
  deOtroPeriodo: boolean;
  editando: boolean;
  bufObjetivoId: number;
  bufDescripcion: string;
  bufPeso: number;
}

/** Fila del panel de alta múltiple (una por competencia del catálogo del periodo). */
interface IFilaCatalogo {
  objetivoId: number;
  nombre: string;
  grupo: string;
  marcada: boolean;
  descripcion: string;
  peso: number;
  yaAsignada: boolean;
}

/**
 * Pestaña "Competencias por puesto" (entidad `Goal`) de Configuración de Competencias.
 *
 * Responsabilidades (T2.1):
 *   - Listar los puestos del catálogo con su nº de competencias, peso total y semáforo.
 *   - Filtrar por departamento, por nombre de puesto y por "sin competencias".
 *   - Ver, editar y eliminar (con confirmación) las competencias de un puesto.
 *   - Dar de alta varias competencias de una sola vez (`insertarLote`).
 *   - Clonar desde otro puesto o desde otro periodo, siempre con previsualización.
 *
 * Notas de implementación que conviene no deshacer:
 *   - El componente vive dentro de un `<ng-template matTabContent>`: se destruye al
 *     cambiar de pestaña. Todo su estado es descartable a propósito; nada se guarda
 *     entre visitas y cada entrada recarga desde el API.
 *   - `insertarLote` / `ejecutarClonado` son `defer`: una sola suscripción por
 *     operación, nunca `async` pipe.
 *   - `cambios` se emite una vez por operación completa, jamás por fila.
 */
@Component({
  selector: 'app-cc-competencias-puesto',
  templateUrl: './competencias-puesto.component.html',
  styleUrls: ['./competencias-puesto.component.css'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule,
    MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatSlideToggleModule,
    MatSortModule, MatTableModule, MatTooltipModule
  ]
})
export class CompetenciasPuestoComponent implements OnChanges, AfterViewInit {

  /** Periodo elegido en el selector del shell. */
  @Input() periodoId!: number;

  /** true cuando el periodo elegido es el periodo activo (para advertencias). */
  @Input() periodoActivo!: boolean;

  /**
   * Avisa al shell de que hubo **altas o bajas** (alta múltiple, borrado y clonado),
   * que son las que mueven sus contadores, para que los recalcule.
   *
   * La edición de una fila NO lo emite a propósito: cambiar el peso, la descripción o
   * la competencia de una meta no altera ninguno de los dos contadores del shell
   * (puestos con competencias y puestos con empleados activos), y cada emisión le
   * cuesta una relectura de las metas del periodo más `GET /api/Empleadoes` entero.
   * El semáforo sí se refresca, pero localmente.
   */
  @Output() cambios = new EventEmitter<void>();

  /**
   * Tolerancia del semáforo de peso. La suma de `weight` llega en crudo desde el API
   * (sin redondear), así que comparar contra 100 con `===` daría rojo por decimales.
   */
  private readonly TOLERANCIA_PESO: number = 0.5;

  private readonly titulo: string = 'Competencias por puesto';

  // ── Catálogos ────────────────────────────────────────────────────────────────
  public puestos: IPuesto[] = [];
  public departamentos: IDepartamento[] = [];
  public periodos: IPeriodo[] = [];
  /** Competencias del catálogo del periodo que se está viendo. */
  public catalogoPeriodo: IObjetivoDts[] = [];

  // ── Listado de puestos ───────────────────────────────────────────────────────
  public columnasPuestos: string[] = ['departamento', 'puesto', 'cantidad', 'peso', 'semaforo', 'acciones'];
  public tamanosPagina: number[] = [10, 25, 50, 100];
  public tablaPuestos = new MatTableDataSource<IFilaPuesto>();
  private filasPuestos: IFilaPuesto[] = [];

  public filtroDepartamento: number | null = null;
  public filtroPuesto: string = '';
  public soloSinCompetencias: boolean = false;
  public soloOcupados: boolean = false;

  /** Secuenciales de puesto (`scargo`) ocupados por al menos un empleado activo. */
  private puestosOcupados = new Set<number>();

  /** Puestos en gris: sin departamento, sin metas visibles y **ocupados**. */
  public puestosSinDatoFiable: number = 0;

  /** Todos los puestos sin departamento y sin metas visibles, ocupados o no. */
  public puestosSinDepartamentoSinMetas: number = 0;

  /** Puestos del catálogo ocupados por algún empleado activo. */
  public totalPuestosOcupados: number = 0;

  // ── Puesto elegido ───────────────────────────────────────────────────────────
  public puestoSeleccionado: IFilaPuesto | null = null;
  public columnasMetas: string[] = ['competencia', 'descripcion', 'peso', 'acciones'];
  public metasDelPuesto: IFilaMeta[] = [];

  // ── Alta múltiple ────────────────────────────────────────────────────────────
  public filasCatalogo: IFilaCatalogo[] = [];
  public panelAltaAbierto: boolean = false;

  // ── Banderas ─────────────────────────────────────────────────────────────────
  public cargandoListado: boolean = false;
  public cargandoDetalle: boolean = false;
  public guardandoLote: boolean = false;
  public guardandoFila: boolean = false;
  public eliminando: boolean = false;
  /** Mensaje real del último error del API; se pinta en una franja, no se traga. */
  public errorApi: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private metasController: Metas,
    private puestosController: Puestos,
    private departamentoController: Departamento,
    private objetivoController: Objetivo,
    private periodosController: Periodos,
    private empleadosController: Empleados,
    private datosService: DatosServiceService,
    private dialog: MatDialog,
    private logger: LoggerService
  ) { }

  ngAfterViewInit(): void {
    this.tablaPuestos.paginator = this.paginator;
    this.tablaPuestos.sort = this.sort;
    // La columna se llama "peso" pero el dato vive en `pesoTotal`: sin este acceso
    // el encabezado ordenable no ordenaría nada.
    this.tablaPuestos.sortingDataAccessor = (fila: IFilaPuesto, columna: string) =>
      columna === 'peso' ? fila.pesoTotal : (fila as any)[columna];
  }

  /**
   * El shell puede cambiar el periodo con la pestaña abierta (el componente no se
   * destruye en ese caso), así que la recarga cuelga de ngOnChanges y no de ngOnInit.
   */
  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['periodoId'] && this.periodoId) {
      this.puestoSeleccionado = null;
      this.metasDelPuesto = [];
      this.panelAltaAbierto = false;
      this.cargarListado();
    }
  }

  // ══ Carga ════════════════════════════════════════════════════════════════════

  /**
   * Carga el listado de puestos del periodo.
   *
   * El semáforo sale de `resumenPorPuesto(periodoId)`: UNA sola llamada para todo el
   * listado. No se usa `pesoTotalPorPuesto` por fila, que descargaría la tabla entera
   * de metas tantas veces como puestos haya.
   *
   * El esqueleto del listado son los puestos de `/api/Positions` (el catálogo completo,
   * que sí incluye los puestos con departamento huérfano) y no las filas del resumen:
   * así aparecen también los puestos con cero competencias, que son justo los que hay
   * que configurar.
   */
  public cargarListado(): void {
    if (!this.periodoId) { return; }

    this.cargandoListado = true;
    this.errorApi = '';
    const periodo = this.periodoId;

    forkJoin({
      resumen: this.metasController.resumenPorPuesto(periodo)
        .pipe(this.alFallar<IResumenMetasPuesto[]>('resumen de metas del periodo', [])),
      puestos: this.puestosController.Gets()
        .pipe(this.alFallar<ModelResponse<IPuesto[]>>('catálogo de puestos', this.respuestaVacia())),
      departamentos: this.departamentoController.Gets()
        .pipe(this.alFallar<ModelResponse>('catálogo de departamentos', this.respuestaVacia())),
      catalogo: this.objetivoController.Gets()
        .pipe(this.alFallar<ModelResponse>('catálogo de competencias', this.respuestaVacia())),
      periodos: this.periodosController.Gets()
        .pipe(this.alFallar<ModelResponse>('lista de periodos', this.respuestaVacia())),
      empleados: this.empleadosController.Gets()
        .pipe(this.alFallar<ModelResponse>('empleados (ocupación de los puestos)', this.respuestaVacia()))
    }).subscribe({
      next: (rep) => {
        this.cargandoListado = false;

        const listaPuestos: IPuesto[] = Array.isArray(rep.puestos?.data) ? rep.puestos.data : [];
        this.puestos = [...listaPuestos].sort((a, b) => a.descripcion.localeCompare(b.descripcion));

        const listaDeptos: IDepartamento[] = Array.isArray(rep.departamentos?.data) ? rep.departamentos.data : [];
        this.departamentos = [...listaDeptos].sort((a, b) => a.nombre.localeCompare(b.nombre));

        const listaPeriodos: IPeriodo[] = Array.isArray(rep.periodos?.data) ? rep.periodos.data : [];
        this.periodos = [...listaPeriodos].sort((a, b) => b.id - a.id);

        // Ocupación del puesto: `scargo` de los empleados con codigoestado 'A'.
        // Es el mismo criterio que usan el shell y la pestaña de Diagnóstico.
        const listaEmpleados: IEmpleado[] = Array.isArray(rep.empleados?.data) ? rep.empleados.data : [];
        this.puestosOcupados = new Set<number>(
          listaEmpleados.filter(e => !!e && e.codigoestado === 'A' && e.scargo > 0).map(e => e.scargo)
        );

        const listaCatalogo: IObjetivoDts[] = Array.isArray(rep.catalogo?.data) ? rep.catalogo.data : [];
        this.catalogoPeriodo = listaCatalogo
          .filter(o => Number(o.periodoId) === periodo)
          .sort((a, b) =>
            (a.grupoCompetencia?.nombre ?? '').localeCompare(b.grupoCompetencia?.nombre ?? '') ||
            a.nombre.localeCompare(b.nombre));

        this.construirFilas(rep.resumen ?? []);
        this.aplicarFiltros();

        // si había un puesto abierto, se vuelve a resolver contra las filas nuevas
        if (this.puestoSeleccionado) {
          const vigente = this.filasPuestos.find(f => f.secuencial === this.puestoSeleccionado!.secuencial);
          this.puestoSeleccionado = vigente ?? null;
        }
      },
      error: (err) => {
        this.cargandoListado = false;
        this.errorApi = this.mensajeError(err);
        this.logger.error('Competencias por puesto: error cargando el listado', err instanceof Error ? err : undefined);
      }
    });
  }

  /** Cruza el catálogo de puestos con el resumen de metas del periodo. */
  private construirFilas(resumen: IResumenMetasPuesto[]): void {
    const porPuesto = new Map<number, IResumenMetasPuesto>();
    (resumen ?? []).forEach(r => porPuesto.set(r.puestoSecuencial, r));

    this.filasPuestos = this.puestos.map((p: IPuesto) => {
      const r = porPuesto.get(p.secuencial);
      const cantidad = r ? r.cantidad : 0;
      const pesoTotal = r ? r.pesoTotal : 0;
      const departamento = Number(p.departmentSecuencial) || 0;
      const ocupado = this.puestosOcupados.has(p.secuencial);
      return {
        secuencial: p.secuencial,
        puesto: (p.descripcion ?? '').trim(),
        departamento: (p.departamento ?? '').trim(),
        departmentSecuencial: departamento,
        ocupado: ocupado,
        cantidad: cantidad,
        pesoTotal: pesoTotal,
        estado: this.clasificarPeso(cantidad, pesoTotal, departamento, ocupado)
      } as IFilaPuesto;
    });

    this.puestosSinDatoFiable = this.filasPuestos.filter(f => f.estado === 'desconocido').length;
    this.puestosSinDepartamentoSinMetas =
      this.filasPuestos.filter(f => f.departmentSecuencial === 0 && f.cantidad === 0).length;
    this.totalPuestosOcupados = this.filasPuestos.filter(f => f.ocupado).length;
  }

  /**
   * Semáforo de peso.
   *   verde  = suma 100 (con tolerancia)
   *   ámbar  = no llega a 100
   *   rojo   = se pasa de 100, o está en cero
   *   gris   = está en cero, el puesto no tiene departamento asignado Y hay empleados
   *            activos ocupándolo.
   *
   * Sobre el gris: el API no lista las metas de los puestos con departamento en 0, así
   * que en ellos el cero no está confirmado (caso real del puesto 19, con 12 metas en
   * base de datos que /api/Goals no devuelve). Pero eso solo tiene consecuencias donde
   * hay gente evaluándose: un puesto vacante con cero metas no le hace daño a nadie, y
   * marcarlo como dudoso solo esconde el trabajo pendiente de verdad. Por eso el gris
   * se limita a los puestos ocupados, y en todo caso su mensaje sigue siendo "sin
   * competencias": la duda se añade, no sustituye a la llamada a la acción.
   */
  private clasificarPeso(cantidad: number, pesoTotal: number,
                         departmentSecuencial: number, ocupado: boolean): EstadoPeso {
    if (cantidad === 0) {
      return (departmentSecuencial === 0 && ocupado) ? 'desconocido' : 'vacio';
    }
    if (Math.abs(pesoTotal - 100) <= this.TOLERANCIA_PESO) { return 'ok'; }
    return pesoTotal > 100 ? 'exceso' : 'falta';
  }

  public textoSemaforo(estado: EstadoPeso): string {
    switch (estado) {
      case 'ok': return 'Suma 100';
      case 'falta': return 'No llega a 100';
      case 'exceso': return 'Se pasa de 100';
      case 'vacio': return 'Sin competencias';
      default: return 'Sin competencias (sin confirmar)';
    }
  }

  public ayudaSemaforo(fila: IFilaPuesto): string {
    if (fila.estado === 'desconocido') {
      return 'Este puesto está ocupado y aparece sin competencias, así que hay que configurarlo. ' +
             'Ojo: como no tiene departamento asignado (departamento 0), el API no lista sus metas, ' +
             'y en algún caso aislado el puesto sí las tiene en base de datos. Abrir el detalle NO ' +
             'sirve para descartarlo: se lee del mismo API y saldría igual de vacío. Confirme por SQL ' +
             'antes de crear nada, o le duplicará las que ya tenga.';
    }
    if (fila.estado === 'vacio') {
      return fila.ocupado
        ? 'Puesto ocupado y sin competencias en el periodo: sus empleados no podrán ser evaluados.'
        : 'Puesto sin competencias en el periodo. Ahora mismo no lo ocupa ningún empleado activo.';
    }
    return `Peso total ${this.formatearPeso(fila.pesoTotal)} en ${fila.cantidad} competencia(s).`;
  }

  public formatearPeso(peso: number): string {
    const n = Number(peso) || 0;
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  // ══ Filtros ══════════════════════════════════════════════════════════════════

  public aplicarFiltros(): void {
    const texto = (this.filtroPuesto ?? '').trim().toLowerCase();

    this.tablaPuestos.data = this.filasPuestos.filter(f => {
      if (this.filtroDepartamento != null && f.departmentSecuencial !== this.filtroDepartamento) { return false; }
      if (texto && !f.puesto.toLowerCase().includes(texto)) { return false; }
      if (this.soloSinCompetencias && f.cantidad > 0) { return false; }
      if (this.soloOcupados && !f.ocupado) { return false; }
      return true;
    });

    if (this.paginator) { this.paginator.firstPage(); }
  }

  public limpiarFiltros(): void {
    this.filtroDepartamento = null;
    this.filtroPuesto = '';
    this.soloSinCompetencias = false;
    this.soloOcupados = false;
    this.aplicarFiltros();
  }

  // ══ Detalle del puesto ═══════════════════════════════════════════════════════

  public seleccionarPuesto(fila: IFilaPuesto): void {
    this.puestoSeleccionado = fila;
    this.panelAltaAbierto = false;
    this.cargarDetalle();
  }

  public cerrarDetalle(): void {
    this.puestoSeleccionado = null;
    this.metasDelPuesto = [];
    this.filasCatalogo = [];
    this.panelAltaAbierto = false;
  }

  /**
   * Carga las competencias del puesto elegido.
   *
   * Se usa `getmetasperiodo(periodoId)` y se filtra el puesto en el cliente, en lugar
   * de `GetMetasPorPeriodoYPuesto`, porque ese método se apoya en `GET /api/Goals`
   * (medido contra el API de prueba: 15,5 MB y ~22 s por llamada, para las 7.612 filas
   * de todos los periodos), mientras que `GET /api/Goals/periodo` devuelve solo el
   * periodo (~200 KB y ~3 s). Los dos endpoints tienen exactamente el mismo punto
   * ciego con los puestos de departamento 0 —comprobado fila a fila para los periodos
   * 7 y 8—, así que no se pierde información al preferir el más barato.
   */
  private cargarDetalle(): void {
    if (!this.puestoSeleccionado || !this.periodoId) { return; }

    const secuencial = this.puestoSeleccionado.secuencial;
    this.cargandoDetalle = true;
    this.errorApi = '';

    this.metasController.getmetasperiodo(this.periodoId).subscribe({
      next: (metas: IMetaDts[]) => {
        this.cargandoDetalle = false;
        const idsCatalogo = new Set<number>(this.catalogoPeriodo.map(o => o.id));

        this.metasDelPuesto = (metas ?? [])
          .filter(m => Number(m.positionSecuencial) === secuencial)
          .map(m => {
            const objetivoId = this.metasController.objetivoDe(m);
            return {
              id: Number(m.id),
              objetivoId: objetivoId,
              competencia: (m.objj ?? m.objetivo?.nombre ?? '').toString(),
              descripcion: (m.name ?? '').toString(),
              peso: Number(m.weight) || 0,
              deOtroPeriodo: objetivoId > 0 && idsCatalogo.size > 0 && !idsCatalogo.has(objetivoId),
              editando: false,
              bufObjetivoId: objetivoId,
              bufDescripcion: (m.name ?? '').toString(),
              bufPeso: Number(m.weight) || 0
            } as IFilaMeta;
          })
          .sort((a, b) => a.competencia.localeCompare(b.competencia));

        this.prepararCatalogo();
      },
      error: (err) => {
        this.cargandoDetalle = false;
        this.errorApi = this.mensajeError(err);
        this.logger.error('Competencias por puesto: error cargando el detalle del puesto',
                          err instanceof Error ? err : undefined, { puesto: secuencial });
      }
    });
  }

  /** Suma de pesos de las competencias que se están mostrando. */
  public get pesoDelDetalle(): number {
    return this.metasDelPuesto.reduce((s, m) => s + (Number(m.peso) || 0), 0);
  }

  public get estadoDetalle(): EstadoPeso {
    return this.clasificarPeso(this.metasDelPuesto.length, this.pesoDelDetalle,
                               this.puestoSeleccionado?.departmentSecuencial ?? 0,
                               this.puestoSeleccionado?.ocupado === true);
  }

  public get hayCompetenciasDeOtroPeriodo(): boolean {
    return this.metasDelPuesto.some(m => m.deOtroPeriodo);
  }

  // ══ Edición de una fila ══════════════════════════════════════════════════════

  public editar(fila: IFilaMeta): void {
    this.metasDelPuesto.forEach(f => f.editando = false);
    fila.bufObjetivoId = fila.objetivoId;
    fila.bufDescripcion = fila.descripcion;
    fila.bufPeso = fila.peso;
    fila.editando = true;
  }

  public cancelarEdicion(fila: IFilaMeta): void {
    fila.editando = false;
  }

  public guardarEdicion(fila: IFilaMeta): void {
    if (this.guardandoFila || !this.puestoSeleccionado) { return; }

    const descripcion = (fila.bufDescripcion ?? '').toString().trim();
    const peso = Number(fila.bufPeso);
    const objetivoId = Number(fila.bufObjetivoId) || 0;

    if (!descripcion) {
      this.datosService.showMessage('La descripción no puede quedar vacía.', this.titulo, 'warning');
      return;
    }
    if (!(peso > 0)) {
      this.datosService.showMessage('El peso debe ser mayor que cero.', this.titulo, 'warning');
      return;
    }
    if (objetivoId <= 0) {
      this.datosService.showMessage('Debe elegir la competencia del catálogo.', this.titulo, 'warning');
      return;
    }

    const payload: IMeta = {
      id: fila.id,
      name: descripcion,
      periodId: this.periodoId,
      weight: peso,
      positionSecuencial: this.puestoSeleccionado.secuencial,
      objetivoid: objetivoId
    };

    this.guardandoFila = true;
    this.errorApi = '';

    this.metasController.Update(payload).subscribe({
      next: () => {
        this.guardandoFila = false;
        fila.editando = false;
        this.datosService.showMessage('Competencia actualizada.', this.titulo, 'success');
        // Se recarga listado y detalle para que el semáforo refleje el peso nuevo.
        // No se emite `cambios`: una edición no altera los contadores del shell
        // (nº de puestos con competencias), y cada emisión le cuesta al shell una
        // relectura completa de metas y empleados.
        this.cargarListado();
        this.cargarDetalle();
      },
      error: (err) => {
        this.guardandoFila = false;
        this.errorApi = this.mensajeError(err);
        this.datosService.showMessage('No se pudo actualizar: ' + this.errorApi, this.titulo, 'error');
        this.logger.error('Competencias por puesto: error actualizando una meta',
                          err instanceof Error ? err : undefined, { id: fila.id });
      }
    });
  }

  // ══ Eliminación ══════════════════════════════════════════════════════════════

  public eliminar(fila: IFilaMeta): void {
    if (this.eliminando || !this.puestoSeleccionado) { return; }

    let mensaje = `Se eliminará la competencia "${fila.competencia}" (peso ${this.formatearPeso(fila.peso)}) ` +
                  `del puesto ${this.puestoSeleccionado.puesto}. Esta acción no se puede deshacer.`;

    if (this.periodoActivo) {
      mensaje += ' ATENCIÓN: este es el PERIODO ACTIVO. Puede haber evaluaciones en curso que ' +
                 'incluyan esta competencia; al borrarla, esas evaluaciones se quedan sin ella y ' +
                 'su peso total dejará de sumar 100.';
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '520px',
      data: { title: 'Eliminar competencia del puesto', message: mensaje }
    }).afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado === true) { this.ejecutarEliminacion(fila); }
    });
  }

  private ejecutarEliminacion(fila: IFilaMeta): void {
    this.eliminando = true;
    this.errorApi = '';

    this.metasController.Delete(fila.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.datosService.showMessage('Competencia eliminada.', this.titulo, 'success');
        this.cargarListado();
        this.cargarDetalle();
        this.cambios.emit();
      },
      error: (err) => {
        this.eliminando = false;
        this.errorApi = this.mensajeError(err);
        this.datosService.showMessage('No se pudo eliminar: ' + this.errorApi, this.titulo, 'error');
        this.logger.error('Competencias por puesto: error eliminando una meta',
                          err instanceof Error ? err : undefined, { id: fila.id });
      }
    });
  }

  // ══ Alta múltiple ════════════════════════════════════════════════════════════

  /** Arma el panel de alta con el catálogo del periodo, marcando lo ya asignado. */
  private prepararCatalogo(): void {
    const asignadas = new Set<number>(this.metasDelPuesto.map(m => m.objetivoId));

    this.filasCatalogo = this.catalogoPeriodo.map((o: IObjetivoDts) => ({
      objetivoId: o.id,
      nombre: o.nombre,
      grupo: (o.grupoCompetencia?.nombre ?? o.grupoc ?? '').toString(),
      marcada: false,
      // La descripción del catálogo va en primera persona ("Yo escucho…") y la del
      // Goal en tercera; se propone como punto de partida y el usuario la ajusta.
      descripcion: (o.descripcion ?? '').toString(),
      peso: 0,
      yaAsignada: asignadas.has(o.id)
    }));
  }

  public get seleccionadasParaAlta(): IFilaCatalogo[] {
    return this.filasCatalogo.filter(f => f.marcada && !f.yaAsignada);
  }

  public get pesoSeleccionadoParaAlta(): number {
    return this.seleccionadasParaAlta.reduce((s, f) => s + (Number(f.peso) || 0), 0);
  }

  /** Marca todas las competencias que aún no tiene el puesto. */
  public marcarPendientes(): void {
    this.filasCatalogo.forEach(f => { if (!f.yaAsignada) { f.marcada = true; } });
  }

  public desmarcarTodas(): void {
    this.filasCatalogo.forEach(f => f.marcada = false);
  }

  /**
   * Reparte 100 puntos entre las competencias marcadas, dejando el resto de la
   * división en la última fila para que la suma dé exactamente 100.
   */
  public repartirPesos(): void {
    const filas = this.seleccionadasParaAlta;
    if (filas.length === 0) { return; }
    const base = Math.floor(100 / filas.length);
    filas.forEach(f => f.peso = base);
    filas[filas.length - 1].peso = 100 - base * (filas.length - 1);
  }

  /**
   * Alta múltiple con `insertarLote`.
   *
   * `insertarLote` devuelve un `defer`: CADA suscripción vuelve a ejecutar el lote
   * completo. Por eso hay una sola llamada a `subscribe`, sin `async` pipe, y el
   * botón queda bloqueado por `guardandoLote` mientras dura la operación.
   * `cambios` se emite UNA vez, al terminar el lote entero, nunca por fila.
   */
  public guardarLote(): void {
    if (this.guardandoLote || !this.puestoSeleccionado) { return; }

    const filas = this.seleccionadasParaAlta;
    if (filas.length === 0) {
      this.datosService.showMessage('Marque al menos una competencia del catálogo.', this.titulo, 'warning');
      return;
    }
    if (filas.some(f => !(Number(f.peso) > 0))) {
      this.datosService.showMessage('Todas las competencias marcadas necesitan un peso mayor que cero.',
                                    this.titulo, 'warning');
      return;
    }
    if (filas.some(f => !(f.descripcion ?? '').toString().trim())) {
      this.datosService.showMessage('Todas las competencias marcadas necesitan una descripción.',
                                    this.titulo, 'warning');
      return;
    }

    const puesto = this.puestoSeleccionado.secuencial;
    const metas: IMeta[] = filas.map(f => ({
      id: 0,
      name: f.descripcion.toString().trim(),
      periodId: this.periodoId,
      weight: Number(f.peso),
      positionSecuencial: puesto,
      objetivoid: f.objetivoId
    }));

    this.guardandoLote = true;
    this.errorApi = '';
    this.logger.info('Competencias por puesto: alta múltiple', { puesto, periodo: this.periodoId, filas: metas.length });

    this.metasController.insertarLote(metas).subscribe({
      next: (resultado: IResultadoLoteMetas) => {
        this.guardandoLote = false;
        this.reportarLote(resultado, 'Alta múltiple');
        this.panelAltaAbierto = false;
        this.cargarListado();
        this.cargarDetalle();
        this.cambios.emit();
      },
      error: (err) => {
        this.guardandoLote = false;
        this.errorApi = this.mensajeError(err);
        this.datosService.showMessage('El alta múltiple falló: ' + this.errorApi, this.titulo, 'error');
        this.logger.error('Competencias por puesto: error en el alta múltiple',
                          err instanceof Error ? err : undefined);
      }
    });
  }

  // ══ Clonado ══════════════════════════════════════════════════════════════════

  /**
   * Abre el diálogo de clonado. Todo el flujo (previsualizar → ver advertencias →
   * ejecutar) vive dentro del diálogo; aquí solo se recoge el resultado.
   */
  public abrirClonado(): void {
    if (!this.periodoId) { return; }

    const datos: IDatosDialogoClonado = {
      periodoDestinoId: this.periodoId,
      periodoDestinoNombre: this.periodos.find(p => p.id === this.periodoId)?.descripcion ?? `Periodo ${this.periodoId}`,
      periodoDestinoActivo: this.periodoActivo === true,
      puestoDestinoSecuencial: this.puestoSeleccionado ? this.puestoSeleccionado.secuencial : null,
      periodos: this.periodos,
      puestos: this.puestos
    };

    this.dialog.open(DialogoClonadoMetasComponent, { width: '780px', maxHeight: '90vh', data: datos })
      .afterClosed().subscribe((rep: IResultadoDialogoClonado | null) => {
        if (rep && rep.ejecutado) {
          this.reportarLote(rep.resultado, 'Clonado');
          this.cargarListado();
          if (this.puestoSeleccionado) { this.cargarDetalle(); }
          this.cambios.emit();
        }
      });
  }

  // ══ Utilidades ═══════════════════════════════════════════════════════════════

  /**
   * Muestra el resultado de un lote. Si alguna fila falló se enseñan los mensajes
   * reales que devolvió el API, no un "ocurrió un error" genérico.
   */
  private reportarLote(resultado: IResultadoLoteMetas, etiqueta: string): void {
    if (!resultado) { return; }

    if (resultado.fallidas === 0) {
      this.datosService.showMessage(`${etiqueta}: se crearon ${resultado.creadas} competencia(s).`,
                                    this.titulo, 'success');
      return;
    }

    const detalle = (resultado.errores ?? []).slice(0, 5).join('\n');
    const resto = (resultado.errores ?? []).length > 5
      ? `\n(y ${(resultado.errores ?? []).length - 5} error(es) más; el detalle completo está en la consola)`
      : '';

    this.errorApi = detalle;
    this.datosService.showMessage(
      `${etiqueta}: se crearon ${resultado.creadas} y fallaron ${resultado.fallidas}.\n${detalle}${resto}`,
      this.titulo,
      resultado.creadas > 0 ? 'warning' : 'error'
    );
    this.logger.warn(`Competencias por puesto: ${etiqueta.toLowerCase()} con fallos`, resultado.errores);
  }

  /**
   * Deja pasar el fallo de una consulta sin tumbar el resto del forkJoin, pero
   * guardando el mensaje REAL del API para pintarlo en la franja de error.
   */
  private alFallar<T>(etiqueta: string, alterno: T): (fuente: Observable<T>) => Observable<T> {
    return (fuente: Observable<T>) => fuente.pipe(
      catchError((err: any) => {
        const detalle = this.mensajeError(err);
        this.errorApi = this.errorApi ? `${this.errorApi} | ${etiqueta}: ${detalle}` : `${etiqueta}: ${detalle}`;
        this.logger.error(`Competencias por puesto: falló la carga de ${etiqueta}`,
                          err instanceof Error ? err : undefined);
        return of(alterno);
      })
    );
  }

  private respuestaVacia(): any {
    return { exito: 0, mensaje: '', count: 0, data: [] };
  }

  /** Mensaje real del API; el texto genérico solo aparece si no viene ninguno. */
  private mensajeError(err: any): string {
    return err?.error?.mensaje
        ?? err?.error?.title
        ?? (typeof err?.error === 'string' ? err.error : null)
        ?? err?.message
        ?? 'El API no devolvió ningún detalle del error.';
  }

  public cerrarError(): void {
    this.errorApi = '';
  }
}
