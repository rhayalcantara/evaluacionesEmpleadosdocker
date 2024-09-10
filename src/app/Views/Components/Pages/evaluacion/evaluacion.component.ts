import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesComponent } from '../../tables/tables.component';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';

@Component({
  selector: 'app-evaluacion',
  standalone:true,
  imports:[FormsModule,TablesComponent,CommonModule,MatDialogModule,CriterialitemComponent],
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.css']
})
export class EvaluacionComponent implements OnInit {
  empleado:IEmpleado={
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
    fechapostulacion:""
  }
  periodo:IPeriodo={
    id: 1,
    descripcion: 'Evaluacion de Medio Año 2024',
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-06-30'),
    activa: true
  }
  ngOnInit() {
    // busca el empleado en localstore

    this.empleado =JSON.parse(localStorage.getItem("empleado") ?? "")
    
  }
}
