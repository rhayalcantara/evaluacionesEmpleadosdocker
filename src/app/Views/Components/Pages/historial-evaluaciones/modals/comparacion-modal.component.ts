import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { IComparacionEvaluaciones } from '../../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';

@Component({
  selector: 'app-comparacion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="comparacion-modal">
      <h2 mat-dialog-title>
        <mat-icon>compare_arrows</mat-icon>
        Comparación de Evaluaciones
      </h2>

      <mat-dialog-content>
        <div class="comparacion-grid">
          <!-- Evaluación 1 -->
          <mat-card class="evaluacion-card">
            <mat-card-header>
              <mat-card-title>Evaluación #{{ data.evaluacion1.evaluacionId }}</mat-card-title>
              <mat-card-subtitle>
                {{ data.evaluacion1.periodoNombre }} - {{ data.evaluacion1.fechaRespuesta | date: 'dd/MM/yyyy' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric">
                <span class="label">Empleado:</span>
                <span class="value">{{ data.evaluacion1.empleadoNombre }}</span>
              </div>
              <div class="metric">
                <span class="label">Total:</span>
                <span class="value total">{{ data.evaluacion1.totalCalculo | number: '1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Desempeño:</span>
                <span class="value">{{ data.evaluacion1.puntuacionDesempenoColaborador | number: '1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Competencias:</span>
                <span class="value">{{ data.evaluacion1.puntuacionCompetenciaColaborador | number: '1.2-2' }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Diferencias -->
          <div class="diferencias">
            <mat-icon [class]="getTendenciaIconClass()">{{ getTendenciaIcon() }}</mat-icon>

            <div class="diferencia-item">
              <span class="label">Diferencia Total:</span>
              <span [class]="getDiferenciaClass(data.diferenciaTotal)">
                {{ data.diferenciaTotal > 0 ? '+' : '' }}{{ data.diferenciaTotal | number: '1.2-2' }}
              </span>
            </div>

            <div class="diferencia-item">
              <span class="label">Diferencia Desempeño:</span>
              <span [class]="getDiferenciaClass(data.diferenciaDesempeno)">
                {{ data.diferenciaDesempeno > 0 ? '+' : '' }}{{ data.diferenciaDesempeno | number: '1.2-2' }}
              </span>
            </div>

            <div class="diferencia-item">
              <span class="label">Diferencia Competencias:</span>
              <span [class]="getDiferenciaClass(data.diferenciaCompetencia)">
                {{ data.diferenciaCompetencia > 0 ? '+' : '' }}{{ data.diferenciaCompetencia | number: '1.2-2' }}
              </span>
            </div>

            <div class="tendencia-badge" [class]="'tendencia-' + data.tendencia">
              {{ getTendenciaTexto() }}
            </div>
          </div>

          <!-- Evaluación 2 -->
          <mat-card class="evaluacion-card">
            <mat-card-header>
              <mat-card-title>Evaluación #{{ data.evaluacion2.evaluacionId }}</mat-card-title>
              <mat-card-subtitle>
                {{ data.evaluacion2.periodoNombre }} - {{ data.evaluacion2.fechaRespuesta | date: 'dd/MM/yyyy' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric">
                <span class="label">Empleado:</span>
                <span class="value">{{ data.evaluacion2.empleadoNombre }}</span>
              </div>
              <div class="metric">
                <span class="label">Total:</span>
                <span class="value total">{{ data.evaluacion2.totalCalculo | number: '1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Desempeño:</span>
                <span class="value">{{ data.evaluacion2.puntuacionDesempenoColaborador | number: '1.2-2' }}</span>
              </div>
              <div class="metric">
                <span class="label">Competencias:</span>
                <span class="value">{{ data.evaluacion2.puntuacionCompetenciaColaborador | number: '1.2-2' }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="analisis">
          <h3>Análisis</h3>
          <p>{{ getAnalisisTexto() }}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .comparacion-modal {
      max-width: 900px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1976d2;
    }

    .comparacion-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .evaluacion-card {
      min-width: 250px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .metric .label {
      font-weight: 500;
      color: #666;
    }

    .metric .value {
      font-weight: 600;
    }

    .metric .value.total {
      font-size: 1.2em;
      color: #1976d2;
    }

    .diferencias {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 15px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .diferencias > mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .diferencias > mat-icon.mejora {
      color: #4caf50;
    }

    .diferencias > mat-icon.decline {
      color: #f44336;
    }

    .diferencias > mat-icon.igual {
      color: #ff9800;
    }

    .diferencia-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      text-align: center;
    }

    .diferencia-item .label {
      font-size: 0.9em;
      color: #666;
    }

    .diferencia-item .positivo {
      color: #4caf50;
      font-weight: 600;
      font-size: 1.1em;
    }

    .diferencia-item .negativo {
      color: #f44336;
      font-weight: 600;
      font-size: 1.1em;
    }

    .diferencia-item .neutral {
      color: #ff9800;
      font-weight: 600;
      font-size: 1.1em;
    }

    .tendencia-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9em;
    }

    .tendencia-mejora {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .tendencia-decline {
      background: #ffebee;
      color: #c62828;
    }

    .tendencia-igual {
      background: #fff3e0;
      color: #e65100;
    }

    .analisis {
      margin-top: 20px;
      padding: 15px;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .analisis h3 {
      margin-top: 0;
      color: #1976d2;
    }

    .analisis p {
      margin: 0;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .comparacion-grid {
        grid-template-columns: 1fr;
      }

      .diferencias {
        order: -1;
      }
    }
  `]
})
export class ComparacionModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ComparacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IComparacionEvaluaciones
  ) {}

  getTendenciaIcon(): string {
    switch (this.data.tendencia) {
      case 'mejora': return 'trending_up';
      case 'decline': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTendenciaIconClass(): string {
    return this.data.tendencia;
  }

  getTendenciaTexto(): string {
    switch (this.data.tendencia) {
      case 'mejora': return 'Mejora Continua';
      case 'decline': return 'Decline en Desempeño';
      default: return 'Desempeño Estable';
    }
  }

  getDiferenciaClass(valor: number): string {
    if (valor > 0) return 'positivo';
    if (valor < 0) return 'negativo';
    return 'neutral';
  }

  getAnalisisTexto(): string {
    const { evaluacion1, evaluacion2, diferenciaTotal, tendencia } = this.data;

    if (tendencia === 'mejora') {
      return `El empleado ${evaluacion2.empleadoNombre} ha mostrado una mejora significativa de ${diferenciaTotal.toFixed(2)} puntos entre las evaluaciones.
              Esto indica un crecimiento positivo en su desempeño y competencias. Se recomienda continuar con las estrategias actuales y reconocer este progreso.`;
    } else if (tendencia === 'decline') {
      return `Se observa una disminución de ${Math.abs(diferenciaTotal).toFixed(2)} puntos en la evaluación más reciente.
              Es importante identificar las causas de este decline y establecer un plan de acción para recuperar el nivel de desempeño anterior.
              Se sugiere una reunión de seguimiento con el supervisor.`;
    } else {
      return `El desempeño se ha mantenido estable entre ambas evaluaciones.
              Si bien la consistencia es positiva, se podría explorar oportunidades de desarrollo para alcanzar el siguiente nivel de desempeño.`;
    }
  }
}
