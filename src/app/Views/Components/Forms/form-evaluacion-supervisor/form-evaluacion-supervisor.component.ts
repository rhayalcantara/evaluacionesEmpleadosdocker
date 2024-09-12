import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { FormEvaluationEmployeComponent } from '../FormEvaluationEmploye/FormEvaluationEmploye.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-form-evaluacion-supervisor',
  standalone:true,
  imports:[FormsModule,CommonModule,ReactiveFormsModule,
    CardEmpleadoComponent,FormEvaluationEmployeComponent],
  templateUrl: './form-evaluacion-supervisor.component.html',
  styleUrls: ['./form-evaluacion-supervisor.component.css']
})
export class FormEvaluacionSupervisorComponent implements OnInit{
  public empleado!:IEmpleado;
  public periodo!:IPeriodo;
  public subordinado!:IEmpleado;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
   
  ){}
  ngOnInit(): void {
    this.empleado=this.data.empleado;
    this.periodo=this.data.periodo;
    this.subordinado=this.data.subordinado;
  }
}
