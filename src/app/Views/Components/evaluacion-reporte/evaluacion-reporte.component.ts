import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Evaluacion } from '../../../Controllers/Evaluacion';
import { PeriodosEvaluacion } from '../../../Controllers/PeriodosEvaluacion';
import { IReporte01 } from '../../../Models/Evaluacion/IEvaluacion';
import { ModelResponse } from '../../../Models/Usuario/modelResponse';
import { IPeriodoEvaluacion } from '../../../Models/PeriodoEvaluacion/IPeriodoEvaluacion';
import { DatosServiceService } from '../../../Services/datos-service.service';


@Component({
  selector: 'app-evaluacion-reporte',
  templateUrl: './evaluacion-reporte.component.html',
  styleUrls: ['./evaluacion-reporte.component.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe]
})
export class EvaluacionReporteComponent implements OnInit {
  reportData: IReporte01[] = [];
  currentPeriodId: number = 0;
  loading: boolean = false;
  error: string | null = null;
  periodo: IPeriodoEvaluacion = {} as IPeriodoEvaluacion;

  constructor(
    private evaluacionService: Evaluacion,
    private periodosService: PeriodosEvaluacion,
    private datosService: DatosServiceService
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
    this.loading = false;
    this.loadReportData();

  }

  loadReportData() {
    this.loading = true;
    this.error = null;

    this.evaluacionService.GetEvaluacionReporte01(this.currentPeriodId).subscribe({
      next: (response: ModelResponse) => {
        if (response && response.data) {
          console.log(response.data);
          this.reportData = response.data;
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
