import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEvaluacion } from 'src/app/Models/Evaluacion/IEvaluacion';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';


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
  @Input() supervisor:Boolean=false
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  public obervaciones:string=""
  public fecha:Date=new Date()
  public evaluacionempleado:IEvaluacion
  public comentarioAdicional: string = ''; // New property for additional comment
  constructor(private EvaluacionController:Evaluacion,
              private datos:DatosServiceService
  ){
    this.evaluacionempleado = EvaluacionController.inicializamodelo()
  }

  ngOnInit(): void {
    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
    .subscribe({
      next: (rep: IEvaluacion) => {
        //console.log('Metas procesadas:', this.metas);
        this.evaluacionempleado = rep;
        //this.cd.detectChanges(); 
        this.comentarioAdicional = this.comentarioAdicional
      },
      error: (err) => console.error('Error al obtener la evaluación:', err)
    });
  }

  onEvaluacionChange(evaluacion:IEvaluacion){
    this.evaluacionempleado = evaluacion
    console.log("la evaluacion del empleado cambio",this.evaluacionempleado)
  }
  onSubmit() {
    // Handle form submission
    // verifica si hay repuesta no contestadas
    let puede:boolean=true
    this.evaluacionempleado.observacion = this.comentarioAdicional; // New property for additional comment
    this.evaluacionempleado.goalEmpleadoRespuestas.forEach(element => {
        if(this.supervisor && element.repuestasupervisor==0){
          puede=false;
        }else{
          if (element.repuesta==0){
            puede=false;
          }
        }
    });
    if (puede){
      console.log("se envia a grabar",this.evaluacionempleado)
      this.EvaluacionController.model = this.evaluacionempleado
      this.EvaluacionController.grabar().then((rep)=>{
        if(rep){
          this.datos.showMessage("Grabado",this.titulo,"sucess")
        }
      })
    }else{
      console.log('se retirne el Form submitted',this.evaluacionempleado);
      this.datos.showMessage("Favor Verificar tiene respuestas sin contestar",this.titulo,"error")
    }

  }
  cancelar(){
    this.dataEmitter.emit("cancelar");
  }

}