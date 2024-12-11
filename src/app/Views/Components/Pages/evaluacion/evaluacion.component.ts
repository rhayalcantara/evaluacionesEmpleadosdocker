import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { FormEvaluationEmployeComponent } from '../../Forms/FormEvaluationEmploye/FormEvaluationEmploye.component';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Periodos } from 'src/app/Controllers/Periodos';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule, 
    FormEvaluationEmployeComponent,
    CardEmpleadoComponent],
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.css']
})
export class EvaluacionComponent implements OnInit {
onPuntuacion($event: number) {
    //throw new Error('Method not implemented.');
}
cancelar() {
  //throw new Error('Method not implemented.');
}
  empleado: IEmpleado = this.empleadocontroller.inicializamodelo();
  periodo: IPeriodo =  this.periodocontroller.inicializamodelo();
  
  constructor(
    private empleadocontroller:Empleados,
    private periodocontroller:Periodos,
    
  ){}

  ngOnInit() {
    // busca el empleado en localstore
    const storedEmpleado = localStorage.getItem("empleado");
    if (storedEmpleado) {
     
      this.empleado = JSON.parse(storedEmpleado);
      

    }
    // busca el periodo en localstore
    const storedPeriodo = localStorage.getItem("periodo");
    if (storedPeriodo) {
      this.periodo = JSON.parse(storedPeriodo);
    }      
  }
}
