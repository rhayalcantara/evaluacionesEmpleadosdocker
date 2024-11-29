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
import { GrupoCompetenciasComponent } from '../../Pages/grupo-competencias/grupo-competencias.component';

@Component({
  selector: 'app-empleadoteam',
  standalone: true,
  imports: [FormsModule, CommonModule, 
    CardEmpleadoComponent],
  templateUrl: './empleadoteam.component.html',
  styleUrls: ['./empleadoteam.component.css']
})
export class EmpleadoTeamComponent implements OnInit {
  
  @Input() empleado: IEmpleado = this.empl.inicializamodelo();
  @Input() periodo: IPeriodo = this.peri.inicializamodelo();
  @Input() mostrarevaluacion:boolean= false;
  
  searchTerm: string = '';
  filteredSubordinados: IEmpleado[] = [];

  constructor(
    public empl: Empleados,
    private dialog: MatDialog,
    private peri: Periodos,
    //detectar cambios
    private changeDetectorRef:ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filteredSubordinados = this.empl.arraymodelsubordinados; 
    this.empl.model = this.empleado
    //this.empl.getsubordinados(this.periodo);
    //console.log(this.empl.arraymodelsubordinados);
       
    this.changeDetectorRef.detectChanges();
  }

  searchSubordinados(): void {
    if (!this.searchTerm.trim()) {
      this.empl.getsubordinados(this.periodo)
      //this.empl.arraymodelsubordinados;
    } else {
      this.empl.arraymodelsubordinados = this.empl.arraymodelsubordinados.filter(subordinado =>
        subordinado.nombreunido.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.departamento.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        subordinado.cargo.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  agregametasub() {
    console.log('Agregar metas para subordinados');
    const dialogRef = this.dialog.open(SupervisorGoalsComponent, {
      width: '1200px', data: { empl: this.empl, periodo: this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }

  objetivoscall() {
    console.log('Agregar metas para subordinados');
    const dialogRef = this.dialog.open(ObjetivosComponent, {
      width: '100%', height: '80%', data: { empl: this.empl, periodo: this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
  }
  competenciascall() {
    console.log('Agregar competencias para subordinados');
    const dialogRef = this.dialog.open(GrupoCompetenciasComponent, {
      width: '600px', data: { empl: this.empl, periodo: this.periodo }
    });
    dialogRef.afterClosed().subscribe((rep) => {
      
    });
}
}