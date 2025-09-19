import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { UtilsService } from 'src/app/Helpers/utils.service';
import { Empleados } from 'src/app/Controllers/Empleados';
import { LoadingComponent } from '../loading/loading.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { firstValueFrom } from 'rxjs'; // New import

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
  campos: string[] = ['identificacion', 'colaborador','oficina','fechA_INGRESO'  , 'departamento', 'posision', 'supervisor', 'estatus_evaluacion', 'puntuaciondesempenocolaborador','objetivo30'               ,'puntuacioncompetenciacolaborador','autocompetencia70'               ,'autoevaluacion'                            ,'autoevaluacion20'            ,'puntuacioncompetenciasupervisor','compSuper70'                                 , 'superevaluacion'                           , 'superevaluacion80'                 , 'totalCalculo'];
  titulos: string[] = ['ID'           , 'Colaborador','Oficina','Inicio Contrato', 'Departamento', 'Posición', 'Supervisor', 'Estatus'           , 'Total Puntuación Objetivos'    ,'Resultado Objetivos (30%)','AutoEvaluacion Competencia     ' ,'Autoevaluación Competencia (70%)','Resultado Final AutoEvaluación (30% + 70%)','20% Resultado AutoEvaluación','Competencia Supervisor'         ,'Evaluacion del Supervisor Competencia (70%)' ,'Resultado Evaluacion Supervisor (30% + 70%)','80% Resultado Evaluacion Supervisor', 'Puntuacion General (20% + 80%)'];

  constructor(
    private evaluacionService: Evaluacion,
    private periodosService: PeriodosEvaluacion,
    private datosService: DatosServiceService,
    private comunicacionService: ComunicacionService,
    private excelService: ExcelService,
    private utilsService: UtilsService,
    private empleadoService: Empleados,
    private dialog: MatDialog
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
    const reporte = $event.key as IReporte01;
    const evaluacionId = reporte.evaluacionid;

    switch ($event.option) {
      case 'edit':
        // Existing edit logic (currently commented out)
        this.datosService.showMessage(
          'Favor Informar al Departamento de IT',
          'Evaluaciones',
          'error'
        );
        break;
      case 'del':
        // Existing delete logic (currently commented out)
        this.datosService.showMessage(
          'Favor Informar al Departamento de IT',
          'Evaluaciones',
          'error'
        );
        break;
      case 'print':
        // New print logic
        if (reporte.evaluacionid === undefined || reporte.identificacion === undefined) {
          this.datosService.showMessage('No se puede imprimir: faltan datos de evaluación o empleado.', 'Generar PDF', 'warning');
          return;
        }
        
        // Use firstValueFrom for consistency
        Promise.all([
          firstValueFrom(this.evaluacionService.Get(reporte.evaluacionid.toString())),
          firstValueFrom(this.empleadoService.GetByCedula(reporte.identificacion))
        ]).then(([evaluacion, empleado]) => {
          if (evaluacion && empleado) {
            this.utilsService.generatePDFEvaluacion(evaluacion, empleado, this.periodo);
          } else {
            this.datosService.showMessage('No se encontró información completa para generar el PDF.', 'Generar PDF', 'warning');
          }
        }).catch((err: any) => {
          this.datosService.showMessage('Error al generar el PDF: ' + err.message, 'Generar PDF', 'error');
        });
        break;
      default:
        this.datosService.showMessage(
          'Acción no reconocida',
          'Evaluaciones',
          'warning'
        );
        break;
    }
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
    
    const periodoString = localStorage.getItem('periodo');
    if (periodoString) {
      try {
        this.periodo = JSON.parse(periodoString);
        this.currentPeriodId = this.periodo.id;
      } catch (e) {
        console.error("Error parsing 'periodo' from localStorage", e);
        this.datosService.showMessage('Error al cargar el periodo desde el almacenamiento local.', 'Periodo', 'error');
        this.periodo = { id: 0, descripcion: '', fechaInicio: new Date(), fechaFin: new Date(), activa: false, estadoid: 0 };
        this.currentPeriodId = 0;
      }
    } else {
      this.periodo = { id: 0, descripcion: '', fechaInicio: new Date(), fechaFin: new Date(), activa: false, estadoid: 0 };
      this.currentPeriodId = 0;
    }
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

  async generateAllPdfs() {

    const activeEvaluations = this.filteredData.filter(item => item.estatus_evaluacion.toLowerCase() === 'autoevaluado');
    if (activeEvaluations.length === 0) {
      this.datosService.showMessage('No hay evaluaciones activas para generar PDF.', 'Generar PDFs', 'info');
      return;
    }

    const dialogRef = this.dialog.open(LoadingComponent, {
      disableClose: true,
      data: { title: 'Generando PDFs...' }
    });
    
    try {
      for (const report of activeEvaluations) {
       
        if (report.evaluacionid === undefined || report.identificacion === undefined) {
          console.warn('Skipping report due to missing evaluacionid or secuencial_empleado:', report);
          continue; // Skip this iteration
        }
        const [evaluacion, empleado] = await Promise.all([          
          firstValueFrom(this.evaluacionService.Get(report.evaluacionid.toString())),
          firstValueFrom(this.empleadoService.GetByCedula(report.identificacion))
        ]);
        
        if (evaluacion && empleado) {
          this.utilsService.generatePDFEvaluacion(evaluacion, empleado, this.periodo);
        }
      }
    } catch (error: any) {
      this.datosService.showMessage('Error al generar los PDFs: ' + error.message, 'Generar PDFs', 'error');
    } finally {
      dialogRef.close();
    }
  }
}
