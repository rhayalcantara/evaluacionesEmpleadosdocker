import { Component, OnInit } from '@angular/core';
import { PeriodoEvaluacionService } from '../../../../Services/periodo-evaluacion.service';
import { DatosServiceService } from '../../../../Services/datos-service.service';
import { IPeriodo, IPeriodo_Dts } from 'src/app/Models/Periodos/IPeriodo';
import { Periodos } from 'src/app/Controllers/Periodos';


interface Estadisticas {
  autoevaluados: number;
  evaluadosPorSupervisor: number;
  totalEmpleados: number;
}

interface Resultados {
  promediosPorDepartamento: { [key: string]: number };
  promediosPorPuesto: { [key: string]: number };
  puntajesPorEmpleado: { [key: string]: number };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  periodoActual: IPeriodo_Dts | null = null;
  estadoPeriodo: string = '';
  metricas: {
    porcentajePuestosConMetas: number;
    empleadosAutoevaluados: number;
    empleadosEvaluadosPorSupervisor: number;
    totalEmpleados: number;
    promediosPorDepartamento: { [key: string]: number };
    promediosPorPuesto: { [key: string]: number };
    puntajesPorEmpleado: { [key: string]: number };
  } = {
    porcentajePuestosConMetas: 0,
    empleadosAutoevaluados: 0,
    empleadosEvaluadosPorSupervisor: 0,
    totalEmpleados: 0,
    promediosPorDepartamento: {},
    promediosPorPuesto: {},
    puntajesPorEmpleado: {}
  };

  constructor(
    private periodoService: Periodos,
    private datosService: DatosServiceService
  ) {}

  ngOnInit() {
    //this.obtenerPeriodoActual();
    //obtener el periodo actual del localstorage
   this.obtenerPeriodoActual();
    
  }

   obtenerPeriodoActual() {
    this.periodoActual = JSON.parse(localStorage.getItem('periodo') || 'null');
    this.periodoService.GetActivo().subscribe(
      {
        next:(rep:IPeriodo_Dts) => 

        { this.periodoActual = rep
          this.estadoPeriodo = this.periodoActual.estado.descripcion
        }
      }
  );

   }

   cargarMetricasPorEstado() {
    switch (this.estadoPeriodo) {
      case 'Configuracion':
        this.cargarMetricasConfiguracion();
        break;
      case 'Evaluando':
        this.cargarMetricasEvaluacion();
        break;
      case 'Calculando':
      case 'Cerrada':
        this.cargarMetricasResultados();
        break;
      default:
        console.error('Estado de período no reconocido');
    }
   }

   cargarMetricasConfiguracion() {
  //   this.datosService.obtenerPorcentajePuestosConMetas().subscribe(
  //     (porcentaje: number) => {
  //       this.metricas.porcentajePuestosConMetas = porcentaje;
  //     },
  //     (error: any) => console.error('Error al obtener porcentaje de puestos con metas', error)
  //   );
   }

   cargarMetricasEvaluacion() {
  //   this.datosService.obtenerEstadisticasEvaluacion().subscribe(
  //     (estadisticas: Estadisticas) => {
  //       this.metricas.empleadosAutoevaluados = estadisticas.autoevaluados;
  //       this.metricas.empleadosEvaluadosPorSupervisor = estadisticas.evaluadosPorSupervisor;
  //       this.metricas.totalEmpleados = estadisticas.totalEmpleados;
  //     },
  //     (error: any) => console.error('Error al obtener estadísticas de evaluación', error)
  //   );
   }

   cargarMetricasResultados() {
  //   this.datosService.obtenerResultadosEvaluacion().subscribe(
  //     (resultados: Resultados) => {
  //       this.metricas.promediosPorDepartamento = resultados.promediosPorDepartamento;
  //       this.metricas.promediosPorPuesto = resultados.promediosPorPuesto;
  //       this.metricas.puntajesPorEmpleado = resultados.puntajesPorEmpleado;
  //     },
  //     (error: any) => console.error('Error al obtener resultados de evaluación', error)
  //   );
   }
}
