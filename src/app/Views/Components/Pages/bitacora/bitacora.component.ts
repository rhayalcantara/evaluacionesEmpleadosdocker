import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Usuario } from 'src/app/Helpers/Interfaces';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Bitacora } from 'src/app/Controllers/Bitacora';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcelService } from 'src/app/Services/excel.service';
import {
  IBitacoraEvento, IBitacoraFiltro, ICompetenciaCatalogo,
  TIPOS_EVENTO, IMPACTOS_EVENTO, DESCRIPCION_MIN, DESCRIPCION_MAX
} from 'src/app/Models/Bitacora/IBitacora';
import {
  filtrarEventos, ordenarEventos, contarPorTipo, agruparCompetencias,
  alternarCompetencia, tieneCompetencia, nombresCompetencias,
  fechaCorta, claseTipo, claseImpacto, hoyISO, normalizarTexto
} from 'src/app/Helpers/bitacora-utils';

/** Página de la bitácora de eventos de desempeño para el supervisor (láminas 1 y 3). */
@Component({
  selector: 'app-bitacora',
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BitacoraComponent implements OnInit {
  constructor(
    private bitacora: Bitacora,
    private empl: Empleados,
    private datos: DatosServiceService,
    private excel: ExcelService
  ) {}

  // ---------- Estado ----------
  supervisor: IEmpleado | null = null;   // usuario logueado (GetByUsuario)
  equipo: IEmpleado[] = [];              // subordinados
  seleccionado: IEmpleado | null = null;
  periodoId: number = 0;                 // de localStorage; si no, periodoActivo().id
  /** Periodo completo (con fechas) resuelto para pasar a getsubordinados. */
  private periodo: IPeriodo | null = null;
  /** true cuando el sondeo de subordinados terminó (cargó datos o agotó 10 s). */
  equipoCargado: boolean = false;
  catalogo: ICompetenciaCatalogo[] = [];
  grupos: { grupoId: number; grupo: string; competencias: ICompetenciaCatalogo[] }[] = [];
  eventos: IBitacoraEvento[] = [];       // tal cual vienen del API (ya ordenados)
  filtro: { desde: string; hasta: string; tipo: string; objetivoId: number | null } = {
    desde: '', hasta: '', tipo: '', objetivoId: null
  };
  cargando: boolean = false;
  error: string = '';
  busqueda: string = '';                 // buscador de la columna de equipo

  // ---------- Formulario (diálogo propio con Bootstrap) ----------
  editando: IBitacoraEvento | null = null;   // null = diálogo cerrado
  erroresForm: string[] = [];
  guardando: boolean = false;

  readonly tipos = TIPOS_EVENTO;
  readonly impactos = IMPACTOS_EVENTO;
  readonly descMin = DESCRIPCION_MIN;
  readonly descMax = DESCRIPCION_MAX;
  readonly hoy = hoyISO();

  /** Usuario de localStorage (JSON local deserializado). */
  private get usuario(): Usuario | null {
    const raw = localStorage.getItem('usuario');
    if (!raw || raw === 'null') return null;
    try { return JSON.parse(raw) as Usuario; } catch { return null; }
  }

  ngOnInit(): void {
    // Encadena: 1) resolver el periodo (localStorage primero, activo del API si no),
    //           2) cargar supervisor + equipo y sondear arraymodelsubordinados.
    this.cargarPeriodo(() => this.cargarEquipo());
  }

  /**
   * Resuelve el periodo completo (con fechaFin para la consulta de equipo),
   * fija `periodoId`, carga el catálogo de competencias e invoca `alFinalizar`
   * una vez resuelto. El periodo localStorage corrupto se trata como ausente.
   */
  private cargarPeriodo(alFinalizar: () => void): void {
    const aplicar = (p: IPeriodo, id: number) => {
      this.periodo = p;
      if (id) this.periodoId = id;
      this.bitacora.catalogoCompetencias(id).subscribe({
        next: (cat) => {
          this.catalogo = cat ?? [];
          this.grupos = agruparCompetencias(this.catalogo);
        },
        error: () => { /* sin catálogo el formulario no muestra competencias */ }
      });
      alFinalizar();
    };

    const stored = localStorage.getItem('periodo');
    if (stored) {
      try {
        const p = JSON.parse(stored) as IPeriodo;
        if (p && p.id) { aplicar(p, p.id); return; }
      } catch { /* corrupto: se trata como ausente */ }
    }

    this.bitacora.periodoActivo().subscribe({
      next: (p) => {
        if (!p || !p.id) return;
        // IPeriodoActivo → IPeriodo (fechas como Date, tipo restringido).
        aplicar({
          id: p.id,
          descripcion: p.descripcion ?? '',
          fechaInicio: new Date(p.fechaInicio),
          fechaFin: new Date(p.fechaFin),
          activa: true,
          estadoid: 0,
          tipo: p.tipo as IPeriodo['tipo']
        }, p.id);
      },
      error: () => { /* sin periodo activo: sin catálogo ni equipo */ }
    });
  }

  /**
   * Pide el empleado por código de usuario y —solo si el periodo ya quedó
   * resuelto— fija `empl.model`, llama a getsubordinados(periodo) y suelta
   * el sondeo de arraymodelsubordinados.
   */
  private cargarEquipo(): void {
    const usuario = this.usuario;
    if (!usuario?.codigo) return;

    this.empl.GetByUsuario(usuario.codigo).subscribe({
      next: (rep: IEmpleado) => {
        this.supervisor = rep;
        // Empleados.retorna en seco si model.secuencial == 0: hay que fijarlo primero.
        this.empl.model = rep;
        if (this.periodo) {
          this.empl.getsubordinados(this.periodo);
          this.sondearEquipo();
        }
      },
      error: () => { /* la página queda sin equipo; no rompe */ }
    });
  }

  /** Sondeo de arraymodelsubordinados (patrón de evaluar-subordinados). */
  private sondearEquipo(): void {
    const terminar = () => { this.equipoCargado = true; };
    const poll = setInterval(() => {
      if (this.empl.arraymodelsubordinados && this.empl.arraymodelsubordinados.length > 0) {
        clearInterval(poll);
        this.equipo = [...this.empl.arraymodelsubordinados];
        terminar();
      }
    }, 300);
    setTimeout(() => {
      clearInterval(poll);
      terminar();
    }, 10000);
  }

  // ---------- Selección de colaborador ----------

  /** Lista visibles del equipo según el buscador (sin acentos, en minúsculas). */
  get equipoVisible(): IEmpleado[] {
    const q = normalizarTexto(this.busqueda ?? '');
    if (!q) return this.equipo;
    return this.equipo.filter((e) =>
      normalizarTexto(e.nombreunido ?? '').includes(q) ||
      normalizarTexto(e.cargo ?? '').includes(q)
    );
  }

  /** Fija el colaborador, limpia filtros y recarga sus eventos. */
  seleccionar(emp: IEmpleado): void {
    this.seleccionado = emp;
    this.limpiarFiltros();
    this.cargarEventos();
  }

  /** Pide la lista del API con solo los filtros que tengan valor. */
  cargarEventos(): void {
    if (!this.seleccionado) return;
    this.cargando = true;
    this.error = '';
    const filtro: IBitacoraFiltro = { empleadoSecuencial: this.seleccionado.secuencial };
    const desde = this.filtro.desde?.trim();
    const hasta = this.filtro.hasta?.trim();
    const tipo = this.filtro.tipo?.trim();
    const objetivoId = this.filtro.objetivoId ?? 0;
    if (desde) filtro.desde = desde;
    if (hasta) filtro.hasta = hasta;
    if (tipo) filtro.tipo = tipo as IBitacoraFiltro['tipo'];
    if (objetivoId > 0) filtro.objetivoId = objetivoId;

    this.bitacora.listar(filtro).subscribe({
      next: (evs) => {
        this.eventos = evs ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.bitacora.mensajeError(err);
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtro = { desde: '', hasta: '', tipo: '', objetivoId: null };
  }

  // ---------- Lista y contadores (defensa en cliente) ----------

  get eventosVisibles(): IBitacoraEvento[] {
    return ordenarEventos(filtrarEventos(this.eventos, this.filtro));
  }

  get conteo(): { logros: number; incumplimientos: number; iniciativas: number; conductas: number; total: number } {
    return contarPorTipo(this.eventosVisibles);
  }

  // ---------- Formulario ----------

  nuevoEvento(): void {
    if (!this.seleccionado || !this.supervisor) return;
    this.erroresForm = [];
    this.editando = this.bitacora.nuevo(this.seleccionado.secuencial, this.supervisor.secuencial);
  }

  editar(ev: IBitacoraEvento): void {
    this.erroresForm = [];
    this.editando = JSON.parse(JSON.stringify(ev)) as IBitacoraEvento;
  }

  esPropio(ev: IBitacoraEvento): boolean {
    return this.supervisor !== null && ev.registradoPorSecuencial === this.supervisor.secuencial;
  }

  alternar(objetivoId: number): void {
    if (!this.editando) return;
    this.editando.competencias = alternarCompetencia(this.editando.competencias, objetivoId);
  }

  tiene(objetivoId: number): boolean {
    return this.editando ? tieneCompetencia(this.editando.competencias, objetivoId) : false;
  }

  get caracteres(): number {
    return this.editando ? (this.editando.descripcion ?? '').trim().length : 0;
  }

  /** Valida en cliente; si ok guarda en el API y refresca la lista. */
  guardar(): void {
    if (!this.editando) return;
    const validacion = this.bitacora.validar(this.editando);
    if (!validacion.valido) {
      this.erroresForm = validacion.errores;
      return;
    }
    this.erroresForm = [];
    this.guardando = true;
    this.bitacora.guardar(this.editando).subscribe({
      next: () => {
        this.guardando = false;
        this.datos.showMessage('Evento guardado correctamente.', 'Bitácora', 'success');
        this.editando = null;
        this.cargarEventos();
      },
      error: (err) => {
        this.guardando = false;
        this.datos.showMessage(this.bitacora.mensajeError(err), 'Bitácora', 'error');
      }
    });
  }

  cancelar(): void {
    this.editando = null;
    this.erroresForm = [];
  }

  /** Pide confirmación y elimina el evento del supervisor. */
  eliminar(ev: IBitacoraEvento): void {
    if (!this.supervisor) return;
    Swal.fire({
      title: 'Eliminar evento',
      text: `¿Eliminar el evento del ${fechaCorta(ev.fechaEvento)} de tipo ${ev.tipo}?`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.bitacora.eliminar(ev.id, this.supervisor!.secuencial).subscribe({
        next: () => {
          this.datos.showMessage('Evento eliminado.', 'Bitácora', 'success');
          this.cargarEventos();
        },
        error: (err) => this.datos.showMessage(this.bitacora.mensajeError(err), 'Bitácora', 'error')
      });
    });
  }

  exportar(): void {
    if (!this.seleccionado) return;
    this.excel.exportAsExcelFile(
      this.bitacora.filasExcel(this.eventosVisibles, this.seleccionado.nombreunido),
      `bitacora_${this.seleccionado.secuencial}`
    );
  }

  // ---------- Delegación a utils ----------
  nombresCompetencias(ev: IBitacoraEvento): string { return nombresCompetencias(ev); }
  fechaCorta(f: string | null | undefined): string { return fechaCorta(f); }
  claseTipo(t: string | null | undefined): string { return claseTipo(t); }
  claseImpacto(i: string | null | undefined): string { return claseImpacto(i); }
}
