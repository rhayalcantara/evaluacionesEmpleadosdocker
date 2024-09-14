import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';


@Component({
  selector: 'app-form-evaluation-employe',
  standalone: true,
  imports: [CommonModule, FormsModule, 
    CardEmpleadoComponent, CriterialitemComponent],
  templateUrl: './FormEvaluationEmploye.component.html',
  styleUrls: ['./FormEvaluationEmploye.component.css']
})
export class FormEvaluationEmployeComponent {
  @Input() empleado: IEmpleado={
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
  @Input() periodo: IPeriodo={
    id: 0,
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: new Date(),
    activa: false,
    estadoid:0
  }; // You might want to create a proper interface for this
  @Input() titulo:string="";
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  public fecha:Date=new Date()
  constructor(){}
  ngOnInit(): void {
    

  }
  onSubmit() {
    // Handle form submission
    console.log('Form submitted');
  }
  cancelar(){
    this.dataEmitter.emit("cancelar");
  }

}