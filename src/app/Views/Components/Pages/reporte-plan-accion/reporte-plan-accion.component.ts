import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Evaluacion } from '../../../../Controllers/Evaluacion';
import { Periodos } from '../../../../Controllers/Periodos';
import { Empleados } from '../../../../Controllers/Empleados';
import { IPeriodo } from '../../../../Models/Periodos/IPeriodo';
import { IEmpleado } from '../../../../Models/Empleado/IEmpleado';
import { IEvaluacion } from '../../../../Models/Evaluacion/IEvaluacion';
import { IAccionPlan } from '../../../../Models/Evaluacion/IAccionPlan';
import { ModelResponse } from '../../../../Models/Usuario/modelResponse';
import { DatosServiceService } from '../../../../Services/datos-service.service';
import { ExcelService } from '../../../../Services/excel.service';

interface IFilaPlanAccion {
  empleado: string;
  departamento: string;
  estadoEvaluacion: string;
  numero: number;
  accion: string;
  objetivoCompetencia: string;
  responsable: string;
  soporte: string;
  recursos: string;
  fechaCierre: string | null;
  vencida: boolean;
}

@Component({
  selector: 'app-reporte-plan-accion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  providers: [ExcelService],
  templateUrl: './reporte-plan-accion.component.html',
  styleUrls: ['./reporte-plan-accion.component.css']
})
export class ReportePlanAccionComponent implements OnInit {

  periodos: IPeriodo[] = [];
  periodoSeleccionado: number = 0;
  loading: boolean = false;
  filas: IFilaPlanAccion[] = [];
  filtro: string = '';
  soloVencidas: boolean = false;

  constructor(
    private evaluacionController: Evaluacion,
    private periodosController: Periodos,
    private empleadosController: Empleados,
    private datosService: DatosServiceService,
    private excelService: ExcelService
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.periodosController.Gets().subscribe({
      next: (res: ModelResponse) => {
        if (res?.data) {
          this.periodos = res.data;
          if (this.periodos.length > 0) {
            this.periodoSeleccionado = this.periodos[0].id;
            this.cargarReporte();
          }
        }
      },
      error: () => this.datosService.showMessage('Error al cargar períodos', 'Períodos', 'error')
    });
  }

  cargarReporte(): void {
    if (!this.periodoSeleccionado) return;
    this.loading = true;
    this.filas = [];

    forkJoin({
      evaluaciones: this.evaluacionController.Gets(),
      empleados: this.empleadosController.Gets()
    }).subscribe({
      next: ({ evaluaciones, empleados }) => {
        const listaEmpleados: IEmpleado[] = empleados?.data ?? [];
        const porSecuencial = new Map<number, IEmpleado>(listaEmpleados.map(e => [e.secuencial, e]));
        const delPeriodo: IEvaluacion[] = (evaluaciones?.data ?? [])
          .filter((ev: IEvaluacion) => ev.periodId == this.periodoSeleccionado);

        this.filas = delPeriodo.flatMap(ev => this.extraerFilas(ev, porSecuencial));
        this.loading = false;
      },
      error: () => {
        this.datosService.showMessage('Error al cargar los datos del reporte', 'Reporte Plan de Acción', 'error');
        this.loading = false;
      }
    });
  }

  /** Extrae las filas del plan de acción guardado como JSON en colaboradorCompromisos. */
  private extraerFilas(ev: IEvaluacion, porSecuencial: Map<number, IEmpleado>): IFilaPlanAccion[] {
    let plan: IAccionPlan[] = [];
    try {
      const obj = JSON.parse(ev.colaboradorCompromisos ?? '');
      if (obj && typeof obj === 'object' && Array.isArray(obj.planAccion)) {
        plan = obj.planAccion;
      }
    } catch {
      return []; // texto plano del formato anterior: no hay matriz
    }

    const empleado = porSecuencial.get(ev.empleadoSecuencial);
    const hoy = new Date().toISOString().split('T')[0];

    return plan.map(a => ({
      empleado: empleado?.nombreunido ?? `Secuencial ${ev.empleadoSecuencial}`,
      departamento: empleado?.departamento ?? '',
      estadoEvaluacion: ev.estadoevaluacion ?? '',
      numero: a.numero,
      accion: a.accion ?? '',
      objetivoCompetencia: a.objetivoCompetenciaTexto ?? '',
      responsable: a.responsableTexto ?? '',
      soporte: a.soporteTexto ?? '',
      recursos: a.recursos ?? '',
      fechaCierre: a.fechaCierre ?? null,
      vencida: !!a.fechaCierre && a.fechaCierre < hoy
    }));
  }

  get filasVisibles(): IFilaPlanAccion[] {
    const texto = this.filtro.trim().toLowerCase();
    return this.filas.filter(f => {
      if (this.soloVencidas && !f.vencida) return false;
      if (!texto) return true;
      return f.empleado.toLowerCase().includes(texto)
        || f.departamento.toLowerCase().includes(texto)
        || f.accion.toLowerCase().includes(texto)
        || f.responsable.toLowerCase().includes(texto)
        || f.soporte.toLowerCase().includes(texto);
    });
  }

  get totalEmpleadosConPlan(): number {
    return new Set(this.filas.map(f => f.empleado)).size;
  }

  get totalVencidas(): number {
    return this.filas.filter(f => f.vencida).length;
  }

  get periodoDescripcion(): string {
    return this.periodos.find(p => p.id == this.periodoSeleccionado)?.descripcion ?? '';
  }

  onPeriodoChange(): void {
    this.cargarReporte();
  }

  exportarExcel(): void {
    if (this.filasVisibles.length === 0) {
      this.datosService.showMessage('No hay datos para exportar', 'Reporte Plan de Acción', 'info');
      return;
    }
    const datos = this.filasVisibles.map(f => ({
      'Empleado': f.empleado,
      'Departamento': f.departamento,
      'Estado Evaluación': f.estadoEvaluacion,
      '#': f.numero,
      'Acción': f.accion,
      'Objetivo o competencia que impacta': f.objetivoCompetencia,
      'Responsable': f.responsable,
      'Soporte Requerido de': f.soporte,
      'Recursos requeridos': f.recursos,
      'Fecha de cierre': f.fechaCierre ?? '',
      'Vencida': f.vencida ? 'Sí' : 'No'
    }));
    this.excelService.exportAsExcelFile(datos, `plan_accion_${this.periodoDescripcion || this.periodoSeleccionado}`);
  }
}
