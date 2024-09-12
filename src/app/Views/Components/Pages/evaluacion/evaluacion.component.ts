import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { FormEvaluationEmployeComponent } from '../../Forms/FormEvaluationEmploye/FormEvaluationEmploye.component';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';

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
  empleado: IEmpleado = {
    secuencial: 0,
    codigousuario: '',
    nombreunido: '',
    identificacion: '',
    sdept: 0,
    departamento: '',
    codigoestado: '',
    scargo: 0,
    cargo: '',
    esjefatura: 0,
    tienejefe: 0,
    nivel: 0,
    fechapostulacion: "",
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  periodo: IPeriodo = {
    id: 1,
    descripcion: 'Evaluacion de Medio Año 2024',
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-06-30'),
    activa: true
  }

  ngOnInit() {
    // busca el empleado en localstore
    const storedEmpleado = localStorage.getItem("empleado");
    if (storedEmpleado) {
      this.empleado = JSON.parse(storedEmpleado);
    }
  }
}
