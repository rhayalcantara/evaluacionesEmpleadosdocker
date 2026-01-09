import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { IEvolucionEvaluacion } from '../../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';

// Registrar los componentes de Chart.js
Chart.register(...registerables);

export interface IEvolucionModalData {
  empleadoNombre: string;
  empleadoSecuencial: number;
  datos: IEvolucionEvaluacion[];
}

@Component({
  selector: 'app-evolucion-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="evolucion-modal">
      <h2 mat-dialog-title>
        <mat-icon>show_chart</mat-icon>
        Evolución de Desempeño - {{ data.empleadoNombre }}
      </h2>

      <mat-dialog-content>
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
        </div>

        <mat-card class="estadisticas-card">
          <mat-card-header>
            <mat-card-title>Estadísticas de Evolución</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <mat-icon>trending_up</mat-icon>
                <div>
                  <span class="label">Tendencia General:</span>
                  <span [class]="'value ' + getTendenciaClass()">{{ getTendenciaTexto() }}</span>
                </div>
              </div>

              <div class="stat-item">
                <mat-icon>assessment</mat-icon>
                <div>
                  <span class="label">Promedio Total:</span>
                  <span class="value">{{ getPromedioTotal() | number: '1.2-2' }}</span>
                </div>
              </div>

              <div class="stat-item">
                <mat-icon>star</mat-icon>
                <div>
                  <span class="label">Mejor Período:</span>
                  <span class="value">{{ getMejorPeriodo() }}</span>
                </div>
              </div>

              <div class="stat-item">
                <mat-icon>timeline</mat-icon>
                <div>
                  <span class="label">Variación:</span>
                  <span class="value">{{ getVariacion() | number: '1.2-2' }}%</span>
                </div>
              </div>
            </div>

            <div class="analisis-section">
              <h4>Análisis de Evolución</h4>
              <p>{{ getAnalisisEvolucion() }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cerrar</button>
        <button mat-raised-button color="primary" (click)="exportarGrafico()">
          <mat-icon>download</mat-icon>
          Exportar Gráfico
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .evolucion-modal {
      width: 900px;
      max-width: 95vw;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1976d2;
    }

    mat-dialog-content {
      min-height: 500px;
    }

    .chart-container {
      position: relative;
      height: 400px;
      margin-bottom: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    canvas {
      max-height: 100%;
    }

    .estadisticas-card {
      margin-top: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item mat-icon {
      color: #1976d2;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-item > div {
      display: flex;
      flex-direction: column;
    }

    .stat-item .label {
      font-size: 0.85em;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-item .value {
      font-weight: 600;
      font-size: 1.1em;
      color: #333;
    }

    .stat-item .value.mejora {
      color: #4caf50;
    }

    .stat-item .value.decline {
      color: #f44336;
    }

    .stat-item .value.estable {
      color: #ff9800;
    }

    .analisis-section {
      padding: 15px;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .analisis-section h4 {
      margin-top: 0;
      color: #1976d2;
    }

    .analisis-section p {
      margin: 0;
      line-height: 1.6;
      color: #666;
    }
  `]
})
export class EvolucionModalComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor(
    public dialogRef: MatDialogRef<EvolucionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IEvolucionModalData
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.data.datos.map(d => d.periodo);
    const dataTotal = this.data.datos.map(d => d.totalCalculo);
    const dataDesempeno = this.data.datos.map(d => d.desempeno);
    const dataCompetencias = this.data.datos.map(d => d.competencias);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total',
            data: dataTotal,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            label: 'Desempeño',
            data: dataDesempeno,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Competencias',
            data: dataCompetencias,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Evolución de Evaluaciones por Período',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.parsed.y;
                label += value !== null ? value.toFixed(2) : '0.00';
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              },
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  getTendenciaTexto(): string {
    const tendencia = this.calcularTendencia();
    switch (tendencia) {
      case 'mejora': return 'En Mejora';
      case 'decline': return 'En Decline';
      default: return 'Estable';
    }
  }

  getTendenciaClass(): string {
    return this.calcularTendencia();
  }

  private calcularTendencia(): 'mejora' | 'decline' | 'estable' {
    if (this.data.datos.length < 2) return 'estable';

    const primero = this.data.datos[0].totalCalculo;
    const ultimo = this.data.datos[this.data.datos.length - 1].totalCalculo;
    const diferencia = ultimo - primero;

    if (diferencia > 5) return 'mejora';
    if (diferencia < -5) return 'decline';
    return 'estable';
  }

  getPromedioTotal(): number {
    if (this.data.datos.length === 0) return 0;
    const suma = this.data.datos.reduce((acc, d) => acc + d.totalCalculo, 0);
    return suma / this.data.datos.length;
  }

  getMejorPeriodo(): string {
    if (this.data.datos.length === 0) return 'N/A';
    const mejor = this.data.datos.reduce((max, d) =>
      d.totalCalculo > max.totalCalculo ? d : max
    );
    return `${mejor.periodo} (${mejor.totalCalculo.toFixed(2)})`;
  }

  getVariacion(): number {
    if (this.data.datos.length < 2) return 0;

    const primero = this.data.datos[0].totalCalculo;
    const ultimo = this.data.datos[this.data.datos.length - 1].totalCalculo;

    if (primero === 0) return 0;
    return ((ultimo - primero) / primero) * 100;
  }

  getAnalisisEvolucion(): string {
    const tendencia = this.calcularTendencia();
    const variacion = this.getVariacion();
    const numEvaluaciones = this.data.datos.length;

    if (tendencia === 'mejora') {
      return `El empleado ha mostrado una evolución positiva a lo largo de ${numEvaluaciones} evaluaciones,
              con una mejora del ${Math.abs(variacion).toFixed(1)}%. Esta tendencia indica un crecimiento
              consistente en sus competencias y desempeño. Se recomienda mantener las estrategias de
              desarrollo actuales y continuar brindando oportunidades de crecimiento.`;
    } else if (tendencia === 'decline') {
      return `Se observa una tendencia a la baja en las últimas evaluaciones, con una variación negativa
              del ${Math.abs(variacion).toFixed(1)}%. Es importante identificar los factores que están
              contribuyendo a este decline y establecer un plan de acción correctivo. Se sugiere una
              reunión de seguimiento para discutir obstáculos y necesidades de apoyo.`;
    } else {
      return `El desempeño se ha mantenido estable a través de ${numEvaluaciones} evaluaciones,
              con una variación mínima del ${Math.abs(variacion).toFixed(1)}%. Si bien la consistencia
              es positiva, se podrían explorar nuevas oportunidades de desarrollo para impulsar el
              crecimiento profesional y alcanzar niveles superiores de desempeño.`;
    }
  }

  exportarGrafico(): void {
    if (!this.chart) return;

    const link = document.createElement('a');
    link.href = this.chart.toBase64Image();
    link.download = `evolucion_${this.data.empleadoNombre.replace(/\s+/g, '_')}.png`;
    link.click();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
