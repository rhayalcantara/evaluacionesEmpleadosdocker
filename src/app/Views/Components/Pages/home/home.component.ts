import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Add this import
import { Empleados } from 'src/app/Controllers/Empleados';
import { TableResponse, Usuario } from 'src/app/Helpers/Interfaces';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { SupervisorGoalsComponent } from '../supervisor-goals/supervisor-goals.component';
import { MatDialog, MatDialogModule,MatDialogRef } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { EmpleadoTeamComponent } from '../../ViewEmpleado/empleadoteam/empleadoteam.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, 
    CardEmpleadoComponent, RouterModule,
    EmpleadoTeamComponent], // Add RouterModule here
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  public empleado: IEmpleado = {
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
   public periodo:IPeriodo ={
     id: 0,
     descripcion: '',
     fechaInicio: new Date(),
     fechaFin:  new Date(),
     activa: false,
     estadoid: 0
   }
  public arraydatos: any[] = [
    {
      '#': 1,
      'Descripcion': 'Papel',
      'Cantidad': 1,
      'Unidad': 'Faldo'
    },
    {
      '#': 2,
      'Descripcion': 'Cafe',
      'Cantidad': 1,
      'Unidad': 'Sobre'
    },
    {
      '#': 3,
      'Descripcion': 'Azucar',
      'Cantidad': 1,
      'Unidad': 'Libras'
    },
    {
      '#': 4,
      'Descripcion': 'Agua',
      'Cantidad': 1,
      'Unidad': 'Botellon'
    }
  ]

  constructor(public empl: Empleados,
              private dialog: MatDialog,
              private peri:Periodos) {
    this.usuario = JSON.parse(localStorage.getItem('usuario') ?? "")
    this.peri.GetActivo().subscribe((rep:IPeriodo)=>{
      console.log('el periodo activo',rep)
      this.periodo=rep;
      localStorage.setItem("periodo", JSON.stringify(this.periodo))
    }
      
    );
  }

  public usuario: Usuario
 
  ngOnInit(): void {
    
    this.empl.GetByUsuario(this.usuario.codigo).subscribe((rep: IEmpleado) => {
      this.empl.model = rep
      this.empl.getsubordinados()
      this.empleado = rep
      localStorage.setItem("empleado", JSON.stringify(this.empleado))
      console.log('puetos sub',this.empl.arraypuestossub)
    })
  }

  onPageChange(event: any) {}

  opcion(event: TableResponse) {
    console.log(event)
  }
  agregametasub(){
    const dialogRef = this.dialog.open(SupervisorGoalsComponent, {
      width: '1200px', data: { empl: this.empl,periodo:this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }
}
