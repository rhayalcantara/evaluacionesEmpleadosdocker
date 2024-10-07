import { ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { IEmpleado } from '../../../../Models/Empleado/IEmpleado';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardEmpleadoComponent } from '../card-empleado/card-empleado.component';
import { Empleados } from 'src/app/Controllers/Empleados';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Periodos } from 'src/app/Controllers/Periodos';
import { SupervisorGoalsComponent } from '../../Pages/supervisor-goals/supervisor-goals.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { CardEmpleadoComponent2 } from '../card-empleado2/card-empleado.component';
import { ObjetivosComponent } from '../../Pages/objetivos/objetivos.component';


@Component({
  selector: 'app-empleadoteam',
  standalone:true,
  imports:[FormsModule, CommonModule, 
    CardEmpleadoComponent,CardEmpleadoComponent2],
  templateUrl: './empleadoteam.component.html',
  styleUrls: ['./empleadoteam.component.css']
})
export class EmpleadoTeamComponent implements OnInit {
  
  @Input() empleado: IEmpleado=this.empl.inicializamodelo();
  @Input() periodo: IPeriodo =this.peri.inicializamodelo();

  constructor(public empl: Empleados,
    private dialog: MatDialog,
    private peri:Periodos,
    
    ){}
  ngOnInit(): void {
  
   
  }

  agregametasub() {
    // Implement the agregametasub functionality here
    console.log('Agregar metas para subordinados');
    // You may need to inject necessary services and implement the logic
    const dialogRef = this.dialog.open(SupervisorGoalsComponent, {
      width: '1200px', data: { empl: this.empl,periodo:this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }
  objetivoscall() {
    // Implement the agregametasub functionality here
    console.log('Agregar metas para subordinados');
    // You may need to inject necessary services and implement the logic
    const dialogRef = this.dialog.open(ObjetivosComponent, {
      width: '100%',height:'80%', data: { empl: this.empl,periodo:this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }
}