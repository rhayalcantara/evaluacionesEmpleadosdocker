import { Component, OnInit } from '@angular/core';
import { PeriodoEvaluacionService } from '../../../../Services/periodo-evaluacion.service';
import { IPeriodoEvaluacion } from 'src/app/Models/PeriodoEvaluacion/IPeriodoEvaluacion';
import { LoggerService } from 'src/app/Services/logger.service';


@Component({
  selector: 'app-periodos-evaluacion',
  templateUrl: './periodos-evaluacion.component.html',
  styleUrls: ['./periodos-evaluacion.component.css']
})
export class PeriodosEvaluacionComponent implements OnInit {
  periodosEvaluacion: IPeriodoEvaluacion[] = [];
  selectedPeriodoEvaluacion: IPeriodoEvaluacion | null = null;

  constructor(
    private periodoEvaluacionService: PeriodoEvaluacionService,
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    this.loadPeriodosEvaluacion();
  }

  loadPeriodosEvaluacion(): void {
    this.periodoEvaluacionService.getPeriodosEvaluacion().subscribe(
      (data) => {
        this.periodosEvaluacion = data;
      },
      (error) => {
        this.logger.error('Error loading periodos evaluacion:', error);
      }
    );
  }

  onSelect(periodoEvaluacion: IPeriodoEvaluacion): void {
    this.selectedPeriodoEvaluacion = periodoEvaluacion;
  }

  onFormSubmit(periodoEvaluacion: IPeriodoEvaluacion): void {
    if (periodoEvaluacion.id) {
      this.periodoEvaluacionService.updatePeriodoEvaluacion(periodoEvaluacion.id, periodoEvaluacion).subscribe(
        () => {
          this.loadPeriodosEvaluacion();
          this.selectedPeriodoEvaluacion = null;
        },
        (error) => {
          this.logger.error('Error updating periodo evaluacion:', error);
        }
      );
    } else {
      this.periodoEvaluacionService.createPeriodoEvaluacion(periodoEvaluacion).subscribe(
        () => {
          this.loadPeriodosEvaluacion();
          this.selectedPeriodoEvaluacion = null;
        },
        (error) => {
          this.logger.error('Error creating periodo evaluacion:', error);
        }
      );
    }
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this periodo evaluacion?')) {
      this.periodoEvaluacionService.deletePeriodoEvaluacion(id).subscribe(
        () => {
          this.loadPeriodosEvaluacion();
          this.selectedPeriodoEvaluacion = null;
        },
        (error) => {
          this.logger.error('Error deleting periodo evaluacion:', error);
        }
      );
    }
  }
}