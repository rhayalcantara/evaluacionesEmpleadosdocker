import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Evaluacion } from '../../../Controllers/Evaluacion';
import { PeriodosEvaluacion } from '../../../Controllers/PeriodosEvaluacion';
import { IReporte01 } from '../../../Models/Evaluacion/IEvaluacion';
import { ModelResponse } from '../../../Models/Usuario/modelResponse';
import { IPeriodoEvaluacion } from '../../../Models/PeriodoEvaluacion/IPeriodoEvaluacion';
import { DatosServiceService } from '../../../Services/datos-service.service';
import { ComunicacionService } from '../../../Services/comunicacion.service';
import { TablesComponent } from '../../Components/tables/tables.component';


@Component({
  selector: 'app-evaluacion-reporte',
  templateUrl: './evaluacion-reporte.component.html',
  styleUrls: ['./evaluacion-reporte.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TablesComponent],
  providers: [DecimalPipe]
})
export class EvaluacionReporteComponent implements OnInit {
  reportData: IReporte01[] = [];
  filteredData: IReporte01[] = [];
  currentPeriodId: number = 0;
  loading: boolean = false;
  error: string | null = null;
  periodo: IPeriodoEvaluacion = {} as IPeriodoEvaluacion;
  
  // Pagination config
  config: any = {
    id: 'evaluacion-reporte',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  // Filter properties
  term: string = '';
  selectedStatus: string = '';
  selectedDepartment: string = '';
  departments: string[] = [];
  campos: string[] = ['identificacion', 'colaborador', 'departamento', 'posision', 'supersivos', 'estatus_evaluacion', 'puntuaciondesempenocolaborador', 'totalcolaborador', 'puntuaciondesempenosupervidor', 'puntuacioncompetenciasupervisor', 'totalCalculo'];
  titulos: string[] = ['ID', 'Colaborador', 'Departamento', 'Posición', 'Supervisor', 'Estatus', 'Desempeño', 'Total Colaborador', 'Desempeño Supervisor', 'Competencia Supervisor', 'Total'];

  constructor(
    private evaluacionService: Evaluacion,
    private periodosService: PeriodosEvaluacion,
    private datosService: DatosServiceService,
    private comunicacionService: ComunicacionService
  ) {}

  ngOnInit() {
    this.loadCurrentPeriod();
  }

  onStatusChange() {
    this.applyFilters();
  }

  onDepartmentChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredData = [...this.reportData];

    if (this.selectedStatus) {
      this.filteredData = this.filteredData.filter(item => 
        item.estatus_evaluacion.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    if (this.selectedDepartment) {
      this.filteredData = this.filteredData.filter(item => 
        item.departamento === this.selectedDepartment
      );
    }

    if (this.term) {
      const searchTerm = this.term.toLowerCase();
      this.filteredData = this.filteredData.filter(item =>
        item.colaborador.toLowerCase().includes(searchTerm) ||
        item.identificacion.toLowerCase().includes(searchTerm)
      );
    }

    this.config.totalItems = this.filteredData.length;
    this.comunicacionService.enviarMensaje(this.config);
  }

  paginaCambio(event: number) {
    this.config.currentPage = event;
  }

  actualizarIdTable(event: string) {
    this.config.id = event;
  }

  filtrar() {
    this.applyFilters();
  }

  loadCurrentPeriod() {
    this.loading = true;
    this.error = null;
    
    // Get the most recent period as active
    this.periodo = JSON.parse(localStorage.getItem('periodo') ?? "")
    this.currentPeriodId = this.periodo.id;
    this.loading = false;
    this.loadReportData();
  }

  loadReportData() {
    this.loading = true;
    this.error = null;

    this.evaluacionService.GetEvaluacionReporte01(this.currentPeriodId).subscribe({
      next: (response: ModelResponse) => {
        if (response && response.data) {
          this.reportData = response.data;
          this.filteredData = [...this.reportData];
          
          // Extract unique departments for filter
          this.departments = [...new Set(this.reportData.map(item => item.departamento))];
          
          this.config.totalItems = this.reportData.length;
          this.comunicacionService.enviarMensaje(this.config);
        }
      },
      error: (error: Error) => {
        this.error = error.message;
        this.loading = false;
        this.datosService.showMessage(
          'Error al cargar los datos: ' + error.message,
          'Evaluaciones',
          'error'
        );
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
