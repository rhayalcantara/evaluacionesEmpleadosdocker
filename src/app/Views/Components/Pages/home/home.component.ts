import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Add this import
import { Empleados } from 'src/app/Controllers/Empleados';
import { TableResponse, Usuario } from 'src/app/Helpers/Interfaces';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { SupervisorGoalsComponent } from '../supervisor-goals/supervisor-goals.component';
import { MatDialog } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { EmpleadoTeamComponent } from '../../ViewEmpleado/empleadoteam/empleadoteam.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule,
    EmpleadoTeamComponent], // Add RouterModule here
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  public empleado: IEmpleado = this.empl.inicializamodelo() 

   public periodo:IPeriodo ={
     id: 0,
     descripcion: '',
     fechaInicio: new Date(),
     fechaFin:  new Date(),
     activa: false,
     estadoid: 0
   }


  constructor(public empl: Empleados,
              private dialog: MatDialog)
  {
    // Parsear de forma segura con validación
    const usuarioStr = localStorage.getItem('usuario');
    const empleadoStr = localStorage.getItem('empleado');
    const periodoStr = localStorage.getItem('periodo');
   

    // Solo parsear si el string no es null y no está vacío
    this.usuario = (usuarioStr && usuarioStr.trim() !== '')
      ? JSON.parse(usuarioStr)
      : {} as Usuario;

    this.empleado = (empleadoStr && empleadoStr.trim() !== '')
      ? JSON.parse(empleadoStr)
      : this.empl.inicializamodelo();

    this.periodo = (periodoStr && periodoStr.trim() !== '')
      ? JSON.parse(periodoStr)
      : {
          id: 0,
          descripcion: '',
          fechaInicio: new Date(),
          fechaFin: new Date(),
          activa: false,
          estadoid: 0
        };
  }

  public usuario: Usuario
 
  ngOnInit(): void {
    

  }

  onPageChange(event: any) {}

  opcion(event: TableResponse) {
  }
  agregametasub(){
    const dialogRef = this.dialog.open(SupervisorGoalsComponent, {
      width: '1200px', data: { empl: this.empl,periodo:this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }
}
