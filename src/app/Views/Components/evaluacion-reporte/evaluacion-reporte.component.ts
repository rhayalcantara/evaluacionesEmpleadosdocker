import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { Evaluacion } from '../../../Controllers/Evaluacion';
import { PeriodosEvaluacion } from '../../../Controllers/PeriodosEvaluacion';
import { IEvaluacion, IEvaluacionDto, IReporte01 } from '../../../Models/Evaluacion/IEvaluacion';
import { ModelResponse } from '../../../Models/Usuario/modelResponse';
import { IPeriodoEvaluacion } from '../../../Models/PeriodoEvaluacion/IPeriodoEvaluacion';
import { DatosServiceService } from '../../../Services/datos-service.service';
import { ComunicacionService } from '../../../Services/comunicacion.service';
import { TablesComponent } from '../../Components/tables/tables.component';
import { ExcelService } from '../../../Services/excel.service';
import { TableResponse } from 'src/app/Helpers/Interfaces';


@Component({
  selector: 'app-evaluacion-reporte',
  templateUrl: './evaluacion-reporte.component.html',
  styleUrls: ['./evaluacion-reporte.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TablesComponent, MatDialogModule],
  providers: [DecimalPipe, ExcelService]
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
  campos: string[] = ['identificacion', 'colaborador','oficina','fechA_INGRESO'  , 'departamento', 'posision', 'supervisor', 'estatus_evaluacion', 'puntuaciondesempenocolaborador','objetivo30'               ,'puntuacioncompetenciacolaborador','autocompetencia70'               ,'autoevaluacion'                            ,'autoevaluacion20'            ,'puntuacioncompetenciasupervisor','compSuper70'                                 , 'superevaluacion'                           , 'superevaluacion80'                 , 'totalCalculo'];
  titulos: string[] = ['ID'           , 'Colaborador','Oficina','Inicio Contrato', 'Departamento', 'Posición', 'Supervisor', 'Estatus'           , 'Total Puntuación Objetivos'    ,'Resultado Objetivos (30%)','AutoEvaluacion Competencia     ' ,'Autoevaluación Competencia (70%)','Resultado Final AutoEvaluación (30% + 70%)','20% Resultado AutoEvaluación','Competencia Supervisor'         ,'Evaluacion del Supervisor Competencia (70%)' ,'Resultado Evaluacion Supervisor (30% + 70%)','80% Resultado Evaluacion Supervisor', 'Puntuacion General (20% + 80%)'];

  constructor(
    private evaluacionService: Evaluacion,
    private periodosService: PeriodosEvaluacion,
    private datosService: DatosServiceService,
    private comunicacionService: ComunicacionService,
    private excelService: ExcelService
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
  opcion($event: TableResponse) {
    /*
    const reporte = $event.key as IReporte01;
    const evaluacionId = reporte.evaluacionid;
    console.log('llego el dato',reporte,evaluacionId)
    this.evaluacionService.Get(evaluacionId.toString()).subscribe({
      next: (evaluacion: IEvaluacion) => {
        if (evaluacion) {
          
          // Initialize goalEmpleadoRespuestas
          evaluacion.goalEmpleadoRespuestas = evaluacion.goalEmpleadoRespuestas.map(goal => ({
            ...goal,
            repuesta: 0,
            repuestasupervisor: 0,
            observacion: ""
          }));

          // Inicializa la puntucion de la evaluacion
          evaluacion.puntuaciondesempenocolaborador = 0;
          evaluacion.puntuacioncompetenciacolaborador = 0;
          evaluacion.totalcolaborador = 0;
          evaluacion.puntuaciondesempenosupervidor = 0;
          evaluacion.puntuacioncompetenciasupervisor = 0;
          evaluacion.totalsupervisor = 0;
          evaluacion.observacion = "";
          evaluacion.estadoevaluacion = 'Pendiente';


          // Update the evaluation
          this.evaluacionService.Update(evaluacion).subscribe({
            next: (updateResponse: IEvaluacionDto) => {
              if (updateResponse) {
                this.datosService.showMessage(
                  'Evaluación inicializada correctamente',
                  'Evaluaciones',
                  'success'
                );
                //localiza IReporte01 y actualiza el estado de la evaluacion
                const reporteIndex = this.reportData.findIndex(item => item.evaluacionid === evaluacionId);
                if (reporteIndex != 0) {
                  this.reportData[reporteIndex].estatus_evaluacion ='Pendiente'
                  this.reportData[reporteIndex].puntuaciondesempenocolaborador=0
                  this.reportData[reporteIndex].totalcolaborador=0
                  this.reportData[reporteIndex].puntuaciondesempenosupervidor=0
                  this.reportData[reporteIndex].puntuacioncompetenciasupervisor=0
                  this.reportData[reporteIndex].totalCalculo=0
                  //this.loadReportData(); // Refresh the data
                }
                // envia mensaje para actualizar la tabla
                this.comunicacionService.enviarMensaje(this.config);
              }
            },
            error: (error: Error) => {
              this.datosService.showMessage(
                'Error al actualizar la evaluación: ' + error.message,
                'Evaluaciones',
                'error'
              );
            }
          });
        }
      },
      error: (error: Error) => {
        this.datosService.showMessage(
          'Error al cargar la evaluación: ' + error.message,
          'Evaluaciones',
          'error'
        );
      }
    });
    */
    this.datosService.showMessage(
      'Favor Informar al Departamento de IT',
      'Evaluaciones',
      'error'
    );
  }
  downloadExcel() {
    // El mapeo manual ha sido eliminado.
    // Llamar a la nueva función pasando los datos filtrados directamente
    this.excelService.exportReporte1AsExcelFile(this.filteredData, 'Reporte_Evaluaciones');
  }
  downloadExce2() {
    
    //obtener los datos de reporte2
    this.evaluacionService.GetEvaluacionReporte02(this.currentPeriodId).subscribe({
      next: (response: ModelResponse) => {
        if (response && response.data) {
          this.excelService.exportAsExcelFile(response.data, 'Reporte_Evaluaciones_2');
        }
      },
      error: (error: Error) => {
        this.datosService.showMessage(
          'Error al cargar los datos: ' + error.message,
          'Evaluaciones',
          'error'
        );
      }
    });
   // this.excelService.exportAsExcelFile(data, 'Reporte_Evaluaciones');
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
