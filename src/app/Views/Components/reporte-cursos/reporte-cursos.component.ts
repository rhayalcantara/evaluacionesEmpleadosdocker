import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';
import { PeriodosEvaluacion } from 'src/app/Controllers/PeriodosEvaluacion';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IReporteCursos } from 'src/app/Models/Capacitacion/Cursos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcelService } from 'src/app/Services/excel.service';
import { MatDialogModule } from '@angular/material/dialog';
import { TablesComponent } from '../../Components/tables/tables.component';

@Component({
  selector: 'app-reporte-cursos',
  templateUrl: './reporte-cursos.component.html',
  styleUrls: ['./reporte-cursos.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,TablesComponent],
  providers: [ ExcelService]
})
export class ReporteCursosComponent implements OnInit {
  nombredelperiodo: string = '2021';
  reportData: IReporteCursos[] = [];
  filteredData: IReporteCursos[] = [];
  currentPeriodId: number = 0;
  loading: boolean = true;
  error: string | null = null;
  periodo: IPeriodo = {} as IPeriodo;
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
  campos: string[] = ['empleadoSecuencial', 'nombreUnido', 'departamento', 'cargo', 'curso', 'razon'];
  titulos: string[] = ['Codigo', 'Colaborador', 'Departamento', 'Posición', 'Curso', 'Razon'];

  constructor(
      private evaluacionService: CursoCapacitacionController,
      private periodosService: PeriodosEvaluacion,
      private datosService: DatosServiceService,
      private comunicacionService: ComunicacionService,
      private excelService: ExcelService
    ) {}
    ngOnInit() {
      this.loadCurrentPeriod();
    }
  
    loadCurrentPeriod() {
      this.loading = true;
      this.error = null;
      
      // Get the most recent period as active
      this.periodo = JSON.parse(localStorage.getItem('periodo') ?? "")
      this.currentPeriodId = this.periodo.id;
      this.nombredelperiodo = this.periodo.descripcion;
      this.loading = false;
      this.loadReportData();
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
            item.curso.toLowerCase() === this.selectedStatus.toLowerCase()
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
            item.nombreUnido.toLowerCase().includes(searchTerm) ||
            item.curso.toLowerCase().includes(searchTerm)
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
      opcion($event: TableResponse) {

      }
      
      downloadExcel() {
        const data = this.filteredData.map(item => ({
          'Codigo': item.empleadoSecuencial,
          'Colaborador': item.nombreUnido,
          'Departamento': item.departamento,
          'Posición': item.cargo,
          'Cursos': item.curso,
          'Razon': item.razon,
        }));
    
        this.excelService.exportAsExcelFile(data, 'Reporte_Evaluaciones');
      }
      
      
    
      loadReportData() {
        this.loading = true;
        this.error = null;
    
        this.evaluacionService.GetReportePeriodo(this.currentPeriodId).subscribe({
          next: (response: ModelResponse) => {
            if (response && response.data) {
              console.log('Reporte de cursos', response.data);
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
