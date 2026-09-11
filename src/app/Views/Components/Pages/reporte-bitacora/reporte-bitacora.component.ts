import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Usuario } from 'src/app/Helpers/Interfaces';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Bitacora, IPeriodoActivo } from 'src/app/Controllers/Bitacora';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcelService } from 'src/app/Services/excel.service';
import {
  IBitacoraEvento,
  IBitacoraResumenCompetencia,
  IBitacoraResumenEmpleado
} from 'src/app/Models/Bitacora/IBitacora';
import { fechaCorta, fechaISO, rangoPeriodo, textoResumen as textoResumenUtil, claseTipo as claseTipoUtil, nombresCompetencias as nombresCompetenciasUtil } from 'src/app/Helpers/bitacora-utils';

/** Detalle de un colaborador: resumen por competencia y eventos del rango. */
interface IDetalleColaborador {
  empleado: IBitacoraResumenEmpleado;
  competencias: IBitacoraResumenCompetencia[];
  eventos: IBitacoraEvento[];
}

/** Página: Reporte de la Bitácora de Eventos (equipo y competencia) para RRHH y supervisores. */
@Component({
  selector: 'app-reporte-bitacora',
  templateUrl: './reporte-bitacora.component.html',
  styleUrls: ['./reporte-bitacora.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReporteBitacoraComponent implements OnInit {
  constructor(
    private bitacora: Bitacora,
    private empl: Empleados,
    private datos: DatosServiceService,
    private excel: ExcelService
  ) {}

  esAdmin: boolean = false;
  supervisores: IEmpleado[] = [];
  supervisorSel: number = 0;
  periodoId: number = 0;
  rango: { desde: string; hasta: string } = { desde: '', hasta: '' };
  filas: IBitacoraResumenEmpleado[] = [];
  cargando: boolean = false;
  error: string = '';
  detalle: IDetalleColaborador | null = null;
  /** true cuando se ha intentado al menos una consulta (para el aviso de sin filas). */
  consultado: boolean = false;

  // ---------- Inicialización ----------

  ngOnInit(): void {
    const usuario = this.leerUsuario();
    this.esAdmin = this.leerRolAdmin();

    // Rango por defecto: periodo de localStorage, si no el periodo activo del API.
    this.resolverRango(() => {
      this.resolverSupervisores(usuario);
    });
  }

  /** Usuario de localStorage (JSON local deserializado; corrupto → null). */
  private leerUsuario(): Usuario | null {
    const raw = localStorage.getItem('usuario');
    if (!raw || raw === 'null') return null;
    try { return JSON.parse(raw) as Usuario; } catch { return null; }
  }

  /** Rol de localStorage (JSON EmpleadoRol con rolId); falta o corrupto → supervisor. */
  private leerRolAdmin(): boolean {
    const raw = localStorage.getItem('rol');
    if (!raw) return false;
    try {
      const rol = JSON.parse(raw) as { rolId?: unknown };
      return rol && rol.rolId === 1;
    } catch { return false; }
  }

  /**
   * Fija `periodoId` y `rango` (rangoPeriodo) desde el periodo de localStorage
   * o, si no, del periodo activo del API.
   */
  private resolverRango(alFinalizar: () => void): void {
    const aplicar = (p: IPeriodoActivo) => {
      this.periodoId = p.id;
      this.rango = rangoPeriodo(p);
      alFinalizar();
    };

    const stored = localStorage.getItem('periodo');
    if (stored) {
      try {
        const p = JSON.parse(stored) as IPeriodo;
        if (p && p.id && (p.fechaInicio || p.fechaFin)) {
          aplicar({
            id: p.id,
            descripcion: p.descripcion ?? '',
            fechaInicio: fechaISO(p.fechaInicio),
            fechaFin: fechaISO(p.fechaFin),
            tipo: ''
          });
          return;
        }
      } catch { /* corrupto: se trata como ausente */ }
    }

    this.bitacora.periodoActivo().subscribe({
      next: (p) => { if (p && p.id) aplicar(p); else alFinalizar(); },
      error: () => alFinalizar()
    });
  }

  /**
   * Admin: jefaturas (esjefatura === 1) de Empleados.Gets, ordenadas por nombre.
   * Supervisor: solo él (se fija `supervisorSel` y se consulta al iniciar).
   */
  private resolverSupervisores(usuario: Usuario | null): void {
    if (this.esAdmin) {
      this.empl.Gets().subscribe({
        next: (resp) => {
          const lista = (resp?.data ?? []) as IEmpleado[];
          this.supervisores = lista
            .filter((e) => e.esjefatura === 1)
            .sort((a, b) => (a.nombreunido ?? '').localeCompare(b.nombreunido ?? ''));
          if (this.supervisores.length > 0) this.supervisorSel = this.supervisores[0].secuencial;
        },
        error: (err) => {
          this.error = this.bitacora.mensajeError(err);
        }
      });
      return;
    }

    // Supervisor: solo su propio equipo.
    const codigo = usuario?.codigo;
    if (!codigo) return;
    this.empl.GetByUsuario(codigo).subscribe({
      next: (rep: IEmpleado) => {
        this.supervisores = [rep];
        this.supervisorSel = rep.secuencial;
        this.consultar(); // solo al iniciar
      },
      error: () => { /* la página queda sin equipo; no rompe */ }
    });
  }

  // ---------- Consulta del equipo ----------

  consultar(): void {
    if (!this.supervisorSel) return;
    this.cargando = true;
    this.error = '';
    this.consultado = true;

    const desde = this.rango.desde?.trim() || null;
    const hasta = this.rango.hasta?.trim() || null;
    this.bitacora.equipo(this.supervisorSel, desde, hasta).subscribe({
      next: (filas) => {
        this.filas = filas ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.bitacora.mensajeError(err);
        this.cargando = false;
      }
    });
  }

  // ---------- Totales ----------

  get totales(): {
    logros: number; incumplimientos: number; iniciativas: number;
    conductas: number; total: number; colaboradores: number; conEventos: number;
  } {
    const t = { logros: 0, incumplimientos: 0, iniciativas: 0, conductas: 0, total: 0, colaboradores: 0, conEventos: 0 };
    for (const f of this.filas) {
      t.colaboradores++;
      t.logros += f.logros;
      t.incumplimientos += f.incumplimientos;
      t.iniciativas += f.iniciativas;
      t.conductas += f.conductas;
      t.total += f.total;
      if (f.total > 0) t.conEventos++;
    }
    return t;
  }

  // ---------- Detalle del colaborador ----------

  verDetalle(fila: IBitacoraResumenEmpleado): void {
    if (!fila) return;
    const sec = fila.empleadoSecuencial;
    const desde = this.rango.desde?.trim() || null;
    const hasta = this.rango.hasta?.trim() || null;

    forkJoin({
      competencias: this.bitacora.resumen(sec, this.periodoId),
      eventos: this.bitacora.listar({ empleadoSecuencial: sec, desde, hasta })
    }).subscribe({
      next: (r) => {
        this.detalle = {
          empleado: fila,
          competencias: r.competencias ?? [],
          eventos: r.eventos ?? []
        };
      },
      error: (err) => {
        this.datos.showMessage(this.bitacora.mensajeError(err), 'Reporte de Bitácora', 'error');
      }
    });
  }

  cerrarDetalle(): void {
    this.detalle = null;
  }

  // ---------- Exportación a Excel ----------

  exportarEquipo(): void {
    if (!this.filas.length) return;
    const filasExcel = this.filas.map((f) => ({
      'Colaborador': f.nombre ?? '',
      'Cargo': f.cargo ?? '',
      'Logros': f.logros,
      'Incumplimientos': f.incumplimientos,
      'Iniciativas': f.iniciativas,
      'Conductas': f.conductas,
      'Total': f.total,
      'Último evento': fechaCorta(f.ultimoEvento)
    }));
    this.excel.exportAsExcelFile(filasExcel, `bitacora_equipo_${this.supervisorSel}`);
  }

  exportarDetalle(): void {
    if (!this.detalle) return;
    this.excel.exportAsExcelFile(
      this.bitacora.filasExcel(this.detalle.eventos, this.detalle.empleado.nombre),
      `bitacora_${this.detalle.empleado.empleadoSecuencial}`
    );
  }

  // ---------- Delegación a utils ----------
  textoResumen(f: { logros: number; incumplimientos: number; iniciativas: number; conductas: number; total: number }): string {
    return textoResumenUtil(f);
  }
  fechaCorta(f: string | null | undefined): string { return fechaCorta(f); }
  claseTipo(t: string | null | undefined): string { return claseTipoUtil(t); }
  nombresCompetencias(ev: IBitacoraEvento): string {
    return nombresCompetenciasUtil(ev);
  }
}
