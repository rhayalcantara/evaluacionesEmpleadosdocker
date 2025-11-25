import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IHistorialEvaluacionResumen } from '../../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';
import { LoggerService } from '../../../../../Services/logger.service';

@Component({
  selector: 'app-detalle-evaluacion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule
  ],
  template: `
    <div class="detalle-modal">
      <h2 mat-dialog-title>
        <mat-icon>assignment</mat-icon>
        Detalle de Evaluación #{{ data.evaluacionId }}
      </h2>

      <mat-dialog-content>
        <mat-tab-group>
          <!-- Tab 1: Información General -->
          <mat-tab label="Información General">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Información del Empleado</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <mat-icon>person</mat-icon>
                      <div>
                        <span class="label">Nombre:</span>
                        <span class="value">{{ data.empleadoNombre }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>badge</mat-icon>
                      <div>
                        <span class="label">Identificación:</span>
                        <span class="value">{{ data.empleadoIdentificacion || 'N/A' }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>business</mat-icon>
                      <div>
                        <span class="label">Departamento:</span>
                        <span class="value">{{ data.departamento || 'N/A' }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>work</mat-icon>
                      <div>
                        <span class="label">Puesto:</span>
                        <span class="value">{{ data.puesto || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Información de la Evaluación</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <mat-icon>calendar_today</mat-icon>
                      <div>
                        <span class="label">Período:</span>
                        <span class="value">{{ data.periodoNombre }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>event</mat-icon>
                      <div>
                        <span class="label">Fecha de Respuesta:</span>
                        <span class="value">{{ data.fechaRespuesta | date: 'dd/MM/yyyy' }}</span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>info</mat-icon>
                      <div>
                        <span class="label">Estado:</span>
                        <span [class]="'badge ' + getEstadoClass(data.estadoEvaluacion)">
                          {{ data.estadoEvaluacion }}
                        </span>
                      </div>
                    </div>

                    <div class="info-item">
                      <mat-icon>{{ data.entrevistaConSupervisor ? 'check_circle' : 'cancel' }}</mat-icon>
                      <div>
                        <span class="label">Entrevista con Supervisor:</span>
                        <span class="value">{{ data.entrevistaConSupervisor ? 'Sí' : 'No' }}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Tab 2: Puntuaciones -->
          <mat-tab label="Puntuaciones">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    Puntuación Total
                    <span class="puntuacion-total">{{ data.totalCalculo | number: '1.2-2' }}</span>
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="progress-container">
                    <mat-progress-bar
                      mode="determinate"
                      [value]="data.totalCalculo"
                      [color]="getProgressColor(data.totalCalculo)"
                    ></mat-progress-bar>
                    <span class="progress-label">{{ getCalificacionTexto(data.totalCalculo) }}</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <div class="puntuaciones-grid">
                <!-- Colaborador -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>person</mat-icon>
                      Autoevaluación
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metrica">
                      <span class="label">Desempeño:</span>
                      <span class="valor">{{ data.puntuacionDesempenoColaborador | number: '1.2-2' }}</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="data.puntuacionDesempenoColaborador"
                      color="primary"
                    ></mat-progress-bar>

                    <div class="metrica">
                      <span class="label">Competencias:</span>
                      <span class="valor">{{ data.puntuacionCompetenciaColaborador | number: '1.2-2' }}</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="data.puntuacionCompetenciaColaborador"
                      color="primary"
                    ></mat-progress-bar>

                    <div class="total-section">
                      <span class="label">Total Colaborador:</span>
                      <span class="valor-total">{{ data.totalColaborador | number: '1.2-2' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Supervisor -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>supervisor_account</mat-icon>
                      Evaluación Supervisor
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metrica">
                      <span class="label">Desempeño:</span>
                      <span class="valor">{{ data.puntuacionDesempenoSupervisor | number: '1.2-2' }}</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="data.puntuacionDesempenoSupervisor"
                      color="accent"
                    ></mat-progress-bar>

                    <div class="metrica">
                      <span class="label">Competencias:</span>
                      <span class="valor">{{ data.puntuacionCompetenciaSupervisor | number: '1.2-2' }}</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="data.puntuacionCompetenciaSupervisor"
                      color="accent"
                    ></mat-progress-bar>

                    <div class="total-section">
                      <span class="label">Total Supervisor:</span>
                      <span class="valor-total">{{ data.totalSupervisor | number: '1.2-2' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Análisis -->
          <mat-tab label="Análisis">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Análisis de Desempeño</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="analisis-section">
                    <h4>Calificación General</h4>
                    <p>{{ getAnalisisGeneral() }}</p>
                  </div>

                  <div class="analisis-section">
                    <h4>Comparación Autoevaluación vs. Supervisor</h4>
                    <p>{{ getAnalisisComparacion() }}</p>
                  </div>

                  <div class="analisis-section">
                    <h4>Áreas de Fortaleza</h4>
                    <ul>
                      <li *ngFor="let fortaleza of getFortalezas()">{{ fortaleza }}</li>
                    </ul>
                  </div>

                  <div class="analisis-section" *ngIf="getAreasMejora().length > 0">
                    <h4>Áreas de Mejora</h4>
                    <ul>
                      <li *ngFor="let area of getAreasMejora()">{{ area }}</li>
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
        <button mat-raised-button color="primary" (click)="exportar()">
          <mat-icon>download</mat-icon>
          Exportar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .detalle-modal {
      width: 800px;
      max-width: 95vw;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1976d2;
    }

    mat-dialog-content {
      min-height: 400px;
      max-height: 70vh;
    }

    .tab-content {
      padding: 20px;
    }

    mat-card {
      margin-bottom: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .info-item mat-icon {
      color: #1976d2;
    }

    .info-item > div {
      display: flex;
      flex-direction: column;
    }

    .info-item .label {
      font-size: 0.85em;
      color: #666;
    }

    .info-item .value {
      font-weight: 600;
      color: #333;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .estado-completada {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .estado-pendiente {
      background: #fff3e0;
      color: #e65100;
    }

    .estado-proceso {
      background: #e3f2fd;
      color: #1565c0;
    }

    .estado-rechazada {
      background: #ffebee;
      color: #c62828;
    }

    .puntuacion-total {
      margin-left: 10px;
      font-size: 1.5em;
      color: #1976d2;
    }

    .progress-container {
      margin-top: 15px;
    }

    .progress-label {
      display: block;
      margin-top: 8px;
      text-align: center;
      font-weight: 600;
      color: #666;
    }

    .puntuaciones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metrica {
      display: flex;
      justify-content: space-between;
      margin: 15px 0 5px 0;
    }

    .metrica .label {
      font-weight: 500;
      color: #666;
    }

    .metrica .valor {
      font-weight: 600;
      color: #1976d2;
    }

    .total-section {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
    }

    .total-section .label {
      font-weight: 600;
      font-size: 1.1em;
    }

    .total-section .valor-total {
      font-weight: 700;
      font-size: 1.3em;
      color: #1976d2;
    }

    .analisis-section {
      margin-bottom: 20px;
    }

    .analisis-section h4 {
      color: #1976d2;
      margin-bottom: 10px;
    }

    .analisis-section p {
      line-height: 1.6;
      color: #666;
    }

    .analisis-section ul {
      padding-left: 20px;
    }

    .analisis-section li {
      margin-bottom: 8px;
      line-height: 1.5;
      color: #666;
    }
  `]
})
export class DetalleEvaluacionModalComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DetalleEvaluacionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IHistorialEvaluacionResumen,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {}

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('completada') || estadoLower.includes('aprobada')) {
      return 'estado-completada';
    } else if (estadoLower.includes('pendiente')) {
      return 'estado-pendiente';
    } else if (estadoLower.includes('proceso')) {
      return 'estado-proceso';
    } else if (estadoLower.includes('rechazada')) {
      return 'estado-rechazada';
    }
    return '';
  }

  getProgressColor(valor: number): 'primary' | 'accent' | 'warn' {
    if (valor >= 90) return 'primary';
    if (valor >= 70) return 'accent';
    return 'warn';
  }

  getCalificacionTexto(valor: number): string {
    if (valor >= 90) return 'Excelente';
    if (valor >= 80) return 'Muy Bueno';
    if (valor >= 70) return 'Bueno';
    if (valor >= 60) return 'Regular';
    return 'Necesita Mejorar';
  }

  getAnalisisGeneral(): string {
    const { totalCalculo } = this.data;

    if (totalCalculo >= 90) {
      return 'El empleado ha demostrado un desempeño excepcional, superando las expectativas en la mayoría de las áreas evaluadas. Se recomienda reconocer y mantener este nivel de excelencia.';
    } else if (totalCalculo >= 80) {
      return 'El desempeño ha sido muy satisfactorio, cumpliendo con las expectativas establecidas. Existen oportunidades de crecimiento que pueden explorarse para alcanzar el nivel de excelencia.';
    } else if (totalCalculo >= 70) {
      return 'El desempeño es aceptable y cumple con los requisitos básicos del puesto. Se identifican áreas de mejora que deben trabajarse en el próximo período de evaluación.';
    } else {
      return 'El desempeño está por debajo de las expectativas. Se requiere un plan de acción inmediato para mejorar en las áreas críticas identificadas.';
    }
  }

  getAnalisisComparacion(): string {
    const diferencia = this.data.totalColaborador - this.data.totalSupervisor;

    if (Math.abs(diferencia) < 5) {
      return 'Existe una alta consistencia entre la autoevaluación y la evaluación del supervisor, lo que indica una buena percepción de las propias fortalezas y áreas de mejora.';
    } else if (diferencia > 0) {
      return `La autoevaluación es ${diferencia.toFixed(2)} puntos superior a la evaluación del supervisor. Esto puede indicar una discrepancia en la percepción del desempeño que debe ser discutida en la entrevista de retroalimentación.`;
    } else {
      return `La evaluación del supervisor es ${Math.abs(diferencia).toFixed(2)} puntos superior a la autoevaluación. Esto sugiere que el empleado puede estar subestimando sus capacidades.`;
    }
  }

  getFortalezas(): string[] {
    const fortalezas: string[] = [];

    if (this.data.puntuacionDesempenoColaborador >= 85) {
      fortalezas.push('Excelente desempeño en el cumplimiento de metas y objetivos');
    }

    if (this.data.puntuacionCompetenciaColaborador >= 85) {
      fortalezas.push('Dominio destacado de las competencias requeridas para el puesto');
    }

    if (this.data.entrevistaConSupervisor) {
      fortalezas.push('Participación activa en el proceso de evaluación y retroalimentación');
    }

    if (fortalezas.length === 0) {
      fortalezas.push('Se identifican oportunidades de desarrollo en múltiples áreas');
    }

    return fortalezas;
  }

  getAreasMejora(): string[] {
    const areas: string[] = [];

    if (this.data.puntuacionDesempenoColaborador < 70) {
      areas.push('Mejorar el cumplimiento de metas y objetivos establecidos');
    }

    if (this.data.puntuacionCompetenciaColaborador < 70) {
      areas.push('Desarrollar competencias técnicas y conductuales del puesto');
    }

    if (Math.abs(this.data.totalColaborador - this.data.totalSupervisor) > 10) {
      areas.push('Alinear percepción del desempeño con expectativas del supervisor');
    }

    return areas;
  }

  exportar(): void {
    // Esta funcionalidad se puede implementar más adelante
    this.logger.info('Exportar detalle de evaluación solicitado', {
      evaluacionId: this.data.evaluacionId,
      empleado: this.data.empleadoNombre
    });
  }
}
