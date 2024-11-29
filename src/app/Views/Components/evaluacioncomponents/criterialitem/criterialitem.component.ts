import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmojiratingComponent } from '../emojirating/emojirating.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { Periodos } from 'src/app/Controllers/Periodos';
import { Metas } from 'src/app/Controllers/Metas';
import { IMeta, IMetaDts } from 'src/app/Models/Meta/IMeta';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { IEvaluacion, IEvalucionResultDto, IGoalEmpleadoRespuesta } from 'src/app/Models/Evaluacion/IEvaluacion';
import { map, tap } from 'rxjs';
import { IDesempenoRespuesta, IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';


@Component({
  selector: 'app-criterialitem',
  standalone:true,
  imports:[FormsModule,CommonModule,EmojiratingComponent],
  templateUrl: './criterialitem.component.html',
  styleUrls: ['./criterialitem.component.css']
})
export class CriterialitemComponent implements OnInit {
   @Input() empleado:IEmpleado 
   @Input() periodo:IPeriodo
   @Input() supervisor:Boolean=false  
   @Output() onEvaluacionChange = new EventEmitter<IEvaluacion>()
   @Input() evaluacion:IEvaluacion =this.EvaluacionControler.inicializamodelo()  
  public desempeno:IEvalucionResultDto[]=[] 
  p:IEvaluacionDesempenoMeta[]=[]
  public logro:number[]=[]
  public metas:IMetaDts[]=[]
  promedioDesempeno: string|number = 0;
  desempenoFinal: string|number = 0;
  porcentajeDesempeno: any;
promedioCompetencias: string|number =0;
porcentajeCompetencias: any;
competenciasFinal: string|number=0;
porcentajeCompetencia: any;
CompetenciaFinal: string|number=0;
  constructor(private EmpleadoModel:Empleados,
              private PeriodoModel:Periodos,
              private MetaModel:Metas,
              private EvaluacionControler:Evaluacion,
              private cd: ChangeDetectorRef,  
              private ServiceComunicacion:ComunicacionService,          
  ){
    this.empleado = this.EmpleadoModel.inicializamodelo()
    this.periodo = this.PeriodoModel.inicializamodelo()

    this.ServiceComunicacion.enviarMensajeObservable.subscribe((data:any)=>{
      if ( data.mensaje === 'buscar'){
        // busca los desempeños
        this.EvaluacionControler.GetsEvaluacionResultado(data.id)
        .subscribe({
          next: (rep ) => {      

            this.desempeno = rep.data;
            console.log('actualizar',this.desempeno)
            this.cd.detectChanges(); 
          }
        })       
        // obtener la evaluacion 
        this.EvaluacionControler.GetEvaluacionePorEmpleadoyPeriodo(this.empleado.secuencial, this.periodo.id)
        .subscribe({
          next: (rep: IEvaluacion) => {
            //console.log('Metas procesadas:', this.metas);
            this.evaluacion = rep;
            // obtiene los logros de las repuestas
            console.log('evaluacion desde criteriaitem',this.evaluacion)
            let n:number=0
            this.evaluacion.evaluacionDesempenoMetas.forEach((item)=>{   
              if(this.supervisor){
                this.logro[n]=item.evaluacioneDesempenoMetaRespuestas?.supervisado_logro??0
              } else{          
                this.logro[n]=item.evaluacioneDesempenoMetaRespuestas?.logro??0
              }
              n=n+1
            })
          },
          error: (err) => console.error('Error al obtener la evaluación:', err)
        });
        
      }
   })

  }
 
  ngOnInit(): void {
    //console.log('CriterialitemComponent',this.evaluacion)
    this.logro=Array.from({length:this.evaluacion.evaluacionDesempenoMetas.length},(v,k)=>k+1)
    //inicialiar el array de logros a cero
    this.logro = this.logro.map((x)=>0)


  }
  
  onLogroChange(event:any,index:number){
    let logro:number = event.target.value
    this.logro[index] = logro
    console.log('logro',logro,index,this.evaluacion.evaluacionDesempenoMetas[index])

      if(this.supervisor){
        this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.supervisado_logro = logro;
      }else{
        this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.logro = logro;
      }
    
    this.onEvaluacionChange.emit(this.evaluacion)

    //console.log("cambio el logro",this.evaluacion.evaluacionDesempenoMetas[index])
  }
  onRespuestaChange(respuesta: IGoalEmpleadoRespuesta | IDesempenoRespuesta, index: number) {
    // Actualiza la respuesta en el array
    // verificar de que tipo es la respuesta
    console.log('respuesta',respuesta,index)
    if (respuesta.hasOwnProperty('goalId')) 
        this.evaluacion.goalEmpleadoRespuestas[index] = respuesta as IGoalEmpleadoRespuesta;
    else{
      this.evaluacion.evaluacionDesempenoMetas[index].evaluacionDesempenoRespuestas = respuesta as IDesempenoRespuesta
    }

    //this.evaluacion.goalEmpleadoRespuestas[index] = respuesta;
        
    this.onEvaluacionChange.emit(this.evaluacion)
    // Aquí puedes agregar cualquier lógica adicional que necesites
    //console.log('Respuesta actualizada:', respuesta);
    
    // Si necesitas hacer algo más con la respuesta, como enviarla al servidor, puedes hacerlo aquí
  }
  onComentarioChange(event:any,index:number){
    let coment:string = event.target.value
    this.evaluacion.goalEmpleadoRespuestas[index].observacion = coment
    this.onEvaluacionChange.emit(this.evaluacion)
    //console.log("cambio el comentario",this.evaluacion.goalEmpleadoRespuestas[index])
  }
}
