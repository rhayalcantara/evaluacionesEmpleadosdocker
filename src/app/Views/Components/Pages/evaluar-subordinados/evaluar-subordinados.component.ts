import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmojiratingComponent } from '../../evaluacioncomponents/emojirating/emojirating.component';
import { CardEmpleadoComponent } from "../../ViewEmpleado/card-empleado/card-empleado.component";
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Usuario } from 'src/app/Helpers/Interfaces';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';

@Component({
  selector: 'app-evaluar-subordinados',
  templateUrl: './evaluar-subordinados.component.html',
  styleUrls: ['./evaluar-subordinados.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, EmojiratingComponent, 
    CardEmpleadoComponent,CriterialitemComponent]
})
export class EvaluarSubordinadosComponent implements OnInit {
onDepartamentoChange() {
throw new Error('Method not implemented.');
}
  periodo:IPeriodo={
    id: 1,
    descripcion: 'Evaluacion de Medio Año 2024',
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-06-30'),
    activa: true,
    estadoid: 0
  }
  public empleado:IEmpleado={
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
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  public subordinado:IEmpleado={
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
    fechapostulacion: '',
    jefeinmediatO_SECUENCIAL: 0,
    jefeinmediato: ''
  }
  constructor(public empl:Empleados) {
    this.usuario= JSON.parse(localStorage.getItem('usuario') ?? "")
   }
  public usuario:Usuario
 
  ngOnInit(): void {
    
   this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep:IEmpleado)=>{
      this.empl.model=rep
      this.empl.getsubordinados(this.periodo)
      this.empleado=rep
          
   })
  }
}
