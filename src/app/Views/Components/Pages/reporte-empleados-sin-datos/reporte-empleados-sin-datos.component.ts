import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Evaluacion } from '../../../../Controllers/Evaluacion';
import { Periodos } from '../../../../Controllers/Periodos';
import { IReporte01 } from '../../../../Models/Evaluacion/IEvaluacion';
import { IPeriodo } from '../../../../Models/Periodos/IPeriodo';
import { ModelResponse } from '../../../../Models/Usuario/modelResponse';
import { DatosServiceService } from '../../../../Services/datos-service.service';

@Component({
  selector: 'app-reporte-empleados-sin-datos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-empleados-sin-datos.component.html',
  styleUrls: ['./reporte-empleados-sin-datos.component.css']
})
export class ReporteEmpleadosSinDatosComponent implements OnInit {

  periodos: IPeriodo[] = [];
  periodoSeleccionado: number = 0;
  loading: boolean = false;
  registros: IReporte01[] = [];

  constructor(
    private evaluacionController: Evaluacion,
    private periodosController: Periodos,
    private datosService: DatosServiceService
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
    this.registros = [];

    this.evaluacionController.GetEvaluacionReporte01(this.periodoSeleccionado).subscribe({
      next: (res: ModelResponse) => {
        if (res?.data) {
          const todos = res.data as any[];
          const vistos = new Set<number>();
          this.registros = todos.filter(e => {
            // codigoestado puede venir en cualquier casing según el backend
            const estado = (e.codigoestado ?? e.CODIGOESTADO ?? e.CodigoEstado ?? '').toUpperCase();
            if (estado !== 'I') return false;
            if (vistos.has(e.evaluacionid)) return false;
            vistos.add(e.evaluacionid);
            return true;
          });
        }
        this.loading = false;
      },
      error: () => {
        this.datosService.showMessage('Error al cargar datos del período', 'Reporte', 'error');
        this.loading = false;
      }
    });
  }

  onPeriodoChange(): void {
    this.cargarReporte();
  }

  get periodoNombre(): string {
    return this.periodos.find(p => p.id === this.periodoSeleccionado)?.descripcion ?? '';
  }

  getEstadoClass(estado: string): string {
    const e = (estado ?? '').toLowerCase();
    if (e === 'completado') return 'badge bg-success';
    if (e === 'evaluadoporsupervisor') return 'badge bg-primary';
    if (e === 'enviado') return 'badge bg-warning text-dark';
    if (e === 'autoevaluado') return 'badge bg-purple';
    if (e === 'borrador') return 'badge bg-secondary';
    return 'badge bg-danger';
  }

  getEstadoEmpleadoLabel(codigo: string): string {
    switch ((codigo ?? '').toUpperCase()) {
      case 'A': return 'Activo';
      case 'I': return 'Inactivo';
      case 'H': return 'Hold';
      case 'N': return 'Nuevo';
      default:  return codigo ?? '—';
    }
  }

  getEstadoEmpleadoClass(codigo: string): string {
    switch ((codigo ?? '').toUpperCase()) {
      case 'A': return 'badge bg-success';
      case 'I': return 'badge bg-danger';
      case 'H': return 'badge bg-warning text-dark';
      case 'N': return 'badge bg-info text-dark';
      default:  return 'badge bg-secondary';
    }
  }
}
