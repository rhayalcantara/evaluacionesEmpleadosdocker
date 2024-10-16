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
import { EmpleadoTeamComponent } from '../empleadoteam/empleadoteam.component';
import { EmpleadosFactory } from 'src/app/Controllers/EmpleadosFactory';

@Component({
  selector: 'app-empleadoteam2',
  standalone:true,
  imports:[FormsModule, CommonModule, 
    EmpleadoTeamComponent,
    CardEmpleadoComponent,
    CardEmpleadoComponent2],
  templateUrl: './empleadoteam2.component.html',
  styleUrls: ['./empleadoteam2.component.css']
})
export class EmpleadoTeamComponent2 implements OnInit {
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
  };
  searchTerm: string = '';
  public periodo:IPeriodo=this.peri.inicializamodelo();
  public team:IEmpleado[]=[];
  public empleados!:Empleados
  constructor(public emplx: EmpleadosFactory ,
    private dialog: MatDialog,
    private peri:Periodos,
    public dialogRef: MatDialogRef<EmpleadoTeamComponent2>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data:any){}
  ngOnInit(): void {

      this.empleado=this.data.empleado
      this.periodo=this.data.periodo
      console.log('data EmpleadoTeamComponent2',this.data)
      this.empleados = this.emplx.crear() 
      this.empleados.model = this.empleado
      this.empleados.getsubordinados(this.data.periodo)
      this.team = this.empleados.arraymodelsubordinados
      this.cdr.detectChanges()
    
  }
  searchSubordinados(): void {
    if (!this.searchTerm.trim()) {
      this.empleados.getsubordinados(this.periodo)
      //this.empl.arraymodelsubordinados;
    } else {
      this.empleados.arraymodelsubordinados = this.empleados.arraymodelsubordinados.filter(subordinado =>
        subordinado.nombreunido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.departamento.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.cargo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
  agregametasub() {
    // Implement the agregametasub functionality here
    console.log('Agregar metas para subordinados');
    // You may need to inject necessary services and implement the logic
    
  }
}