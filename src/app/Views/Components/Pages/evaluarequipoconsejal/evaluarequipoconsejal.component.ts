import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IConsejal, IConsejalTeam } from 'src/app/Models/Consejal/Iconsejal';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-evaluarequipoconsejal',
  standalone: true,
  imports: [CommonModule, FormsModule,CardEmpleadoComponent],
  templateUrl: './evaluarequipoconsejal.component.html',
  styleUrls: ['./evaluarequipoconsejal.component.css']
  
})

export class EvaluarequipoconsejalComponent implements OnInit {
  @Input() periodo!: IPeriodo 
  @Input() emple!: IEmpleado
  @Input() empl: IEmpleado[] = [] // Para mostrar información de los empleados
  public consejal!:IConsejal
  constructor(private route: ActivatedRoute,) {
    
  }
  ngOnInit(): void {
    // get periodo activo del localstorage
    this.periodo = JSON.parse(localStorage.getItem('periodo')??"")
    // get empleado del localstorage
    
    const consejal = this.route.snapshot.paramMap.get('consejal');
    if (consejal) {
      console.log('cons',consejal)
      this.consejal = JSON.parse(consejal)
      console.log('Consejal recibido:', this.consejal);
       this.consejal.consejal_Team.map((teamMember:IConsejalTeam)=> {
          this.empl.push(teamMember.empleado)
          console.log('Empleados seleccionados:', teamMember.empleado );
       })
      
      console.log('Modelo inicializado:', this.consejal);
    } 
  }
}
