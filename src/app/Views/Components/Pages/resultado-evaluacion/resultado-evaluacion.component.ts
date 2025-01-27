import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { EmojiratingComponent } from '../../evaluacioncomponents/emojirating/emojirating.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IGoalEmpleadoRespuesta } from 'src/app/Models/Evaluacion/IEvaluacion';

interface IDesempenoResultado {
  perspectiva: string;
  objetivo: string;
  tipo: string;
  peso: number;
  meta: number;
  autoEvaluacion: number;
  evaluacionSupervisor: number;
  resultado: number;
}

interface ICompetenciaResultado {
  nombre: string;
  descripcion: string;
  promedio: number;
  autoEvaluacion: number;
  evaluacionSupervisor: number;
  resultado: number;
}

@Component({
  selector: 'app-resultado-evaluacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    CardEmpleadoComponent
  ],
  templateUrl: './resultado-evaluacion.component.html',
  styleUrls: ['./resultado-evaluacion.component.css']
})
export class ResultadoEvaluacionComponent implements OnInit {
  empleado: IEmpleado;
  periodo: IPeriodo;
  desempeno: IDesempenoResultado[] = [];
  competencias: ICompetenciaResultado[] = [];
  
  promedioDesempeno: number = 0;
  promedioCompetencias: number = 0;
  porcentajeDesempeno: number = 30; // Porcentaje asignado al desempeño
  porcentajeCompetencias: number = 70; // Porcentaje asignado a las competencias
  desempenoFinal: number = 0;
  competenciasFinal: number = 0;
  puntuacionFinal: number = 0;

  // Crear un objeto goalempleadorepuesta para el EmojiratingComponent
  goalempleadorepuesta: IGoalEmpleadoRespuesta = {
    id: 0,
    evaluacionId: 0,
    goalId: 0,
    repuesta: 0,
    repuestasupervisor: 0,
    weight: 0,
    observacion: ''
  };

  constructor(
    private empleadoModel: Empleados,
    private periodoModel: Periodos
  ) {
    this.empleado = this.empleadoModel.inicializamodelo();
    this.periodo = this.periodoModel.inicializamodelo();
  }

  ngOnInit(): void {
    // Aquí cargarías los datos reales de la evaluación
    this.cargarDatosEvaluacion();
    this.calcularResultados();
  }

  private cargarDatosEvaluacion(): void {
    // Simulación de datos - Aquí conectarías con tu servicio real
    this.desempeno = [
      {
        perspectiva: 'Aprendizaje y Crecimiento',
        objetivo: 'RESULTADO DE ENCUESTA DE CLIMA Y CULTURA INDICE DE PARTICIPACION',
        tipo: 'KPI',
        peso: 5,
        meta: 95,
        autoEvaluacion: 90,
        evaluacionSupervisor: 92,
        resultado: 96.84
      }
    ];

    this.competencias = [
      {
        nombre: 'Trabajo en equipo',
        descripcion: 'Capacidad de colaborar y cooperar con otros',
        promedio: 4,
        autoEvaluacion: 4,
        evaluacionSupervisor: 4,
        resultado: 80
      }
    ];
  }

  private calcularResultados(): void {
    // Calcula el promedio de desempeño
    this.promedioDesempeno = this.desempeno.reduce((acc, item) => acc + item.resultado, 0) / this.desempeno.length;
    
    // Calcula el promedio de competencias
    this.promedioCompetencias = this.competencias.reduce((acc, item) => acc + item.resultado, 0) / this.competencias.length;
    
    // Calcula los resultados finales con sus respectivos porcentajes
    this.desempenoFinal = (this.promedioDesempeno * this.porcentajeDesempeno) / 100;
    this.competenciasFinal = (this.promedioCompetencias * this.porcentajeCompetencias) / 100;
    
    // Calcula la puntuación final
    this.puntuacionFinal = this.desempenoFinal + this.competenciasFinal;
  }

  // Método para manejar el evento de selección de emoji
  onEmojiSelect(event: any): void {
    console.log('Emoji seleccionado:', event);
  }
}
