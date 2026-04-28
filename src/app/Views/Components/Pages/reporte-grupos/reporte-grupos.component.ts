import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Evaluacion } from '../../../../Controllers/Evaluacion';
import { Periodos } from '../../../../Controllers/Periodos';
import { IReporte01 } from '../../../../Models/Evaluacion/IEvaluacion';
import { ModelResponse } from '../../../../Models/Usuario/modelResponse';
import { IPeriodo } from '../../../../Models/Periodos/IPeriodo';
import { DatosServiceService } from '../../../../Services/datos-service.service';

interface IGrupoEvaluacion {
  nombre: string;
  rango: string;
  min: number;
  max: number;
  color: string;
  badgeClass: string;
  empleados: IReporte01[];
}

@Component({
  selector: 'app-reporte-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-grupos.component.html',
  styleUrls: ['./reporte-grupos.component.css']
})
export class ReporteGruposComponent implements OnInit {

  periodos: IPeriodo[] = [];
  periodoSeleccionado: number = 7;
  loading: boolean = false;
  reportData: IReporte01[] = [];

  grupos: IGrupoEvaluacion[] = [
    { nombre: 'Deficiente', rango: '0 - 59',    min: 0,  max: 59.99, color: '#dc3545', badgeClass: 'bg-danger',  empleados: [] },
    { nombre: 'Regular',    rango: '60 - 69',   min: 60, max: 69.99, color: '#fd7e14', badgeClass: 'bg-warning', empleados: [] },
    { nombre: 'Bueno',      rango: '70 - 79',   min: 70, max: 79.99, color: '#ffc107', badgeClass: 'bg-info',    empleados: [] },
    { nombre: 'Muy Bueno',  rango: '80 - 89',   min: 80, max: 89.99, color: '#198754', badgeClass: 'bg-success', empleados: [] },
    { nombre: 'Excelente',  rango: '90 - 110',  min: 90, max: 110,   color: '#0d6efd', badgeClass: 'bg-primary', empleados: [] },
  ];

  grupoAbierto: number | null = null;

  constructor(
    private evaluacionService: Evaluacion,
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
          this.cargarReporte();
        }
      },
      error: () => this.datosService.showMessage('Error al cargar períodos', 'Periodos', 'error')
    });
  }

  cargarReporte(): void {
    this.loading = true;
    this.grupos.forEach(g => g.empleados = []);

    this.evaluacionService.GetEvaluacionReporte01(this.periodoSeleccionado).subscribe({
      next: (res: ModelResponse) => {
        if (res?.data) {
          this.reportData = (res.data as IReporte01[]).filter(e => !!e.colaborador);
          this.agrupar();
        }
        this.loading = false;
      },
      error: () => {
        this.datosService.showMessage('Error al cargar datos del período', 'Reporte', 'error');
        this.loading = false;
      }
    });
  }

  agrupar(): void {
    this.grupos.forEach(g => g.empleados = []);
    for (const emp of this.reportData) {
      const total = emp.totalCalculo ?? 0;
      const grupo = this.grupos.find(g => total >= g.min && total <= g.max);
      if (grupo) grupo.empleados.push(emp);
    }
  }

  toggleGrupo(index: number): void {
    this.grupoAbierto = this.grupoAbierto === index ? null : index;
  }

  get totalEvaluaciones(): number {
    return this.reportData.length;
  }

  promedio(grupo: IGrupoEvaluacion): number {
    if (!grupo.empleados.length) return 0;
    const suma = grupo.empleados.reduce((acc, e) => acc + (e.totalCalculo ?? 0), 0);
    return Math.round((suma / grupo.empleados.length) * 100) / 100;
  }

  porcentajeGrupo(grupo: IGrupoEvaluacion): number {
    if (!this.totalEvaluaciones) return 0;
    return Math.round((grupo.empleados.length / this.totalEvaluaciones) * 1000) / 10;
  }
}
