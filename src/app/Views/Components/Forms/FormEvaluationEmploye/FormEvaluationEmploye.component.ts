import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardEmpleadoComponent } from '../../ViewEmpleado/card-empleado/card-empleado.component';
import { CriterialitemComponent } from '../../evaluacioncomponents/criterialitem/criterialitem.component';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { IEvaluacion, IEvaluacionDto, IEvalucionResultDto } from 'src/app/Models/Evaluacion/IEvaluacion';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { Empleados } from 'src/app/Controllers/Empleados';
import { Periodos } from 'src/app/Controllers/Periodos';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';


@Component({
  selector: 'app-form-evaluation-employe',
  standalone: true,
  imports: [CommonModule, FormsModule, CriterialitemComponent],
  templateUrl: './FormEvaluationEmploye.component.html',
  styleUrls: ['./FormEvaluationEmploye.component.css']
})
export class FormEvaluationEmployeComponent {
  @Input() empleado: IEmpleado=this.empleadocontroller.inicializamodelo(); // You might want to create a proper interface for this
  @Input() periodo: IPeriodo=this.periodocontroller.inicializamodelo(); // You might want to create a proper interface for this
  @Input() titulo:string="";
  @Input() supervisor:Boolean=false
  @Input() mostargrabar:Boolean=true
  @Output() dataEmitter: EventEmitter<string> = new EventEmitter();
  
  public obervaciones:string=""
  public fecha:Date=new Date()
  public evaluacionempleado:IEvaluacion
  public comentarioAdicional: string = ''; // New property for additional comment
  public desempeno:IEvalucionResultDto[]=[]
  constructor(private EvaluacionController:Evaluacion,
              private datos:DatosServiceService,
              private empleadocontroller:Empleados,
              private periodocontroller:Periodos,
              private ServiceComunicacion:ComunicacionService, 
              private cd: ChangeDetectorRef
  ){
    this.evaluacionempleado = EvaluacionController.inicializamodelo()
  }

  ngOnInit(): void {
    
    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
    .subscribe({
      next: (rep: IEvaluacion) => {
        //console.log('Metas procesadas:', this.metas);
        this.evaluacionempleado = rep;
        //console.log('FormEvaluationEmployeComponent',this.evaluacionempleado)
        this.ServiceComunicacion.enviarMensaje({mensaje:'buscar',id:this.evaluacionempleado.id})
        this.cd.detectChanges(); 
        this.comentarioAdicional = rep.observacion
      },
      error: (err) => console.error('Error al obtener la evaluación:', err)
    });

  }

  onEvaluacionChange(evaluacion:IEvaluacion){
    this.evaluacionempleado = evaluacion
    console.log("la evaluacion del empleado cambio",this.evaluacionempleado,this.supervisor)
  }

  onSubmit() {
    // Handle form submission
    // verifica si hay repuesta no contestadas
    let puede:boolean=true
    this.evaluacionempleado.observacion = this.comentarioAdicional; // New property for additional comment
  
    //poner la fecha de repuesta
    const fechaActual = new Date();
    this.evaluacionempleado.fechaRepuestas = fechaActual.toISOString().replace('T', ' ').slice(0, 10);
    
    // verifica si hay competencias sin responder
    this.evaluacionempleado.goalEmpleadoRespuestas.forEach(element => {
        if(this.supervisor){          
          if(element.repuestasupervisor==0){              
            puede=false;
          }          
        }else{
          if (element.repuesta==0){
            console.log('Falta este competencia',element)
            puede=false;
          }
        }
    });
    
    // verifica si hay desempeños sin responder
    this.evaluacionempleado.evaluacionDesempenoMetas.forEach((item)=>{
      item.evaluacion=undefined
      if(this.supervisor){
        if((item.evaluacioneDesempenoMetaRespuestas?.supervisado_logro ??0)==0){          
          puede=false;
        }
      }else{
        if((item.evaluacioneDesempenoMetaRespuestas?.logro)==0){
          console.log('falta este item',item)
          puede=false
        }
      }      
    })

    console.log('puede',puede)
    if (puede){
      //console.log("se envia a grabar",this.evaluacionempleado)
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