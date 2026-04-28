import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Evaluacion } from '../../../../Controllers/Evaluacion';
import { Periodos } from '../../../../Controllers/Periodos';
import { IReporte01 } from '../../../../Models/Evaluacion/IEvaluacion';
import { IPeriodo } from '../../../../Models/Periodos/IPeriodo';
import { ModelResponse } from '../../../../Models/Usuario/modelResponse';
import { DatosServiceService } from '../../../../Services/datos-service.service';

Chart.register(...registerables);

interface IEstadoItem {
  estadoKey: string;
  etiqueta: string;
  color: string;
  empleados: IReporte01[];
}

const ESTADOS_CONFIG: Omit<IEstadoItem, 'empleados'>[] = [
  { estadoKey: 'completado',            etiqueta: 'Completado',           color: '#28a745' },
  { estadoKey: 'evaluadoporsupervisor', etiqueta: 'Eval. Supervisor',     color: '#007bff' },
  { estadoKey: 'autoevaluado',          etiqueta: 'Auto Evaluado',        color: '#6f42c1' },
  { estadoKey: 'enviado',               etiqueta: 'Enviado',              color: '#fd7e14' },
  { estadoKey: 'borrador',              etiqueta: 'Borrador',             color: '#6c757d' },
  { estadoKey: 'rechazada',             etiqueta: 'Rechazada',            color: '#e83e8c' },
  { estadoKey: 'pendiente',             etiqueta: 'Pendiente',            color: '#dc3545' },
];

const EXTRA_COLORS = ['#17a2b8', '#ffc107', '#20c997', '#adb5bd'];

@Component({
  selector: 'app-reporte-estado-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-estado-evaluacion.component.html',
  styleUrls: ['./reporte-estado-evaluacion.component.css']
})
export class ReporteEstadoEvaluacionComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  periodos: IPeriodo[] = [];
  periodoSeleccionado: number = 0;
  loading: boolean = false;
  chart: Chart | null = null;
  estados: IEstadoItem[] = [];
  estadoAbierto: number | null = null;

  constructor(
    private evaluacionController: Evaluacion,
    private periodosController: Periodos,
    private datosService: DatosServiceService
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
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
    this.estados = [];
    this.estadoAbierto = null;
    this.chart?.destroy();
    this.chart = null;

    this.evaluacionController.GetEvaluacionReporte01(this.periodoSeleccionado).subscribe({
      next: (res: ModelResponse) => {
        if (res?.data) {
          this.procesarEstados(res.data as IReporte01[]);
        }
        this.loading = false;
        setTimeout(() => this.renderChart(), 120);
      },
      error: () => {
        this.datosService.showMessage('Error al cargar datos del período', 'Reporte', 'error');
        this.loading = false;
      }
    });
  }

  private procesarEstados(evaluaciones: IReporte01[]): void {
    const activos = evaluaciones.filter(e => !!e.colaborador);
    this.estados = ESTADOS_CONFIG.map(e => ({ ...e, empleados: [] }));
    let extraIdx = 0;

    for (const ev of activos) {
      const key = (ev.estatus_evaluacion ?? '').trim().toLowerCase();
      if (!key) continue;

      let found = this.estados.find(e => e.estadoKey === key);
      if (!found) {
        found = {
          estadoKey: key,
          etiqueta: ev.estatus_evaluacion ?? key,
          color: EXTRA_COLORS[extraIdx++ % EXTRA_COLORS.length],
          empleados: []
        };
        this.estados.push(found);
      }
      found.empleados.push(ev);
    }

    this.estados = this.estados.filter(e => e.empleados.length > 0);
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    if (this.estados.length === 0) return;

    this.chart?.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.estados.map(e => e.etiqueta),
        datasets: [{
          label: 'Evaluaciones',
          data: this.estados.map(e => e.empleados.length),
          backgroundColor: this.estados.map(e => e.color + 'CC'),
          borderColor: this.estados.map(e => e.color),
          borderWidth: 2,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y as number;
                const pct = this.totalEvaluaciones > 0
                  ? ((val / this.totalEvaluaciones) * 100).toFixed(1)
                  : '0';
                return ` ${val} evaluaciones (${pct}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            grid: { color: '#e9ecef' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  toggleEstado(i: number): void {
    this.estadoAbierto = this.estadoAbierto === i ? null : i;
  }

  porcentajeEstado(estado: IEstadoItem): number {
    if (!this.totalEvaluaciones) return 0;
    return Math.round((estado.empleados.length / this.totalEvaluaciones) * 1000) / 10;
  }

  get totalEvaluaciones(): number {
    return this.estados.reduce((s, e) => s + e.empleados.length, 0);
  }

  get totalCompletadas(): number {
    return this.estados.find(e => e.estadoKey === 'completado')?.empleados.length ?? 0;
  }

  get totalPendientes(): number {
    return this.totalEvaluaciones - this.totalCompletadas;
  }

  get porcentajeCompletado(): number {
    if (!this.totalEvaluaciones) return 0;
    return Math.round((this.totalCompletadas / this.totalEvaluaciones) * 1000) / 10;
  }

  get periodoDescripcion(): string {
    return this.periodos.find(p => p.id == this.periodoSeleccionado)?.descripcion ?? '';
  }

  onPeriodoChange(): void {
    this.cargarReporte();
  }
}
