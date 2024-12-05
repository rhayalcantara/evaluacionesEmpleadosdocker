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
import { IDesempenoRespuesta, IEvaluacionDesempenoMeta, IEvaluacionDesempenoMetaRespuesta, IResultadoLogro } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { PorcientoDesempenoCompetencia } from 'src/app/Controllers/PorcientoDesempenoCompetencia';
import { IPorcientoDesempenoCompetencia } from 'src/app/Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia';


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
   @Output() onPuntacionChange = new EventEmitter<number>()
   @Input() evaluacion:IEvaluacion =this.EvaluacionControler.inicializamodelo()  

    public desempeno:IEvalucionResultDto[]=[] 
    p:IEvaluacionDesempenoMeta[]=[]
    public logro:number[]=[]
    public resultadologro:IResultadoLogro[]=[]
    public metas:IMetaDts[]=[]
    public pdclocal:IPorcientoDesempenoCompetencia[]=[]
    promedioDesempeno: string|number = 0;
    desempenoFinal: string|number = 0;
    porcentajeDesempeno: any;
    promedioCompetencias: string|number =0;
    competenciasFinal: string|number=0;
    porcentajeCompetencia: any;
    CompetenciaFinal: string|number=0;
  constructor(private EmpleadoModel:Empleados,
              private PeriodoModel:Periodos,
              private MetaModel:Metas,
              private EvaluacionControler:Evaluacion,
              private cd: ChangeDetectorRef,  
              private ServiceComunicacion:ComunicacionService, 
              private PorCientoDC:PorcientoDesempenoCompetencia         
  )
  {
    this.empleado = this.EmpleadoModel.inicializamodelo()
    this.periodo = this.PeriodoModel.inicializamodelo()
    this.PorCientoDC.Gets().subscribe({
      next:(rep)=>{
        console.log('porcientodesempenocompetencia',rep)
        let pdc:IPorcientoDesempenoCompetencia[]=rep.data
        this.pdclocal = pdc.filter(x=>x.periodId==this.periodo.id)

      }
    })
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
            this.EvaluacionControler.model = this.evaluacion



            // obtiene los logros de las repuestas
           
            let n:number=0
            this.evaluacion.evaluacionDesempenoMetas.forEach((item)=>{   
                this.logro[n]=item.evaluacioneDesempenoMetaRespuestas?.logro??0
                n=n+1
                let rl:IResultadoLogro={
                  EvaluacionId: item.Id,
                  logro: item.evaluacioneDesempenoMetaRespuestas?.logro ?? 0,
                  porcientologro: (item.evaluacioneDesempenoMetaRespuestas?.logro ?? 0 / item.meta) * 100,
                  resultadologro: 0,
                  medioverificacion: item.evaluacioneDesempenoMetaRespuestas?.medioverificacion??'',
                  comentario: item.evaluacioneDesempenoMetaRespuestas?.comentario??''
                }
                rl=this.calcularresultadologro(rl,item)                
                this.resultadologro.push(rl)
             
            })
            
            this.EvaluacionControler.calculaelpromediodesempeno(this.supervisor,this.resultadologro)

            
          },
          error: (err) => console.error('Error al obtener la evaluación:', err)
         
        } );
        
      }
      if (data.mensaje ==='Actualizar variables'){
        this.pdclocal = this.EvaluacionControler.pdclocal
        this.promedioDesempeno = this.EvaluacionControler.promedioDesempeno;
        this.desempenoFinal= this.EvaluacionControler.desempenoFinal;
        this.porcentajeDesempeno= this.EvaluacionControler.porcentajeDesempeno;
        this.promedioCompetencias=this.EvaluacionControler.promedioCompetencias;
        this.competenciasFinal=this.EvaluacionControler.competenciasFinal;
        this.porcentajeCompetencia=this.EvaluacionControler.porcentajeCompetencia;
        this.CompetenciaFinal=this.EvaluacionControler.CompetenciaFinal;   
        console.log('CompetenciaFinal',this.EvaluacionControler.CompetenciaFinal)
        let num = Number(this.EvaluacionControler.desempenoFinal) + Number(this.EvaluacionControler.CompetenciaFinal)
        this.onPuntacionChange.emit(num)
      }
   })

  }

  calcularresultadologro(rl:IResultadoLogro,item:IEvaluacionDesempenoMeta):IResultadoLogro{
    //calculo porcientologro
    if(item.inverso){
      
      if((item.evaluacioneDesempenoMetaRespuestas?.logro??0)!=0){
        let lo =item.evaluacioneDesempenoMetaRespuestas?.logro??0
        rl.porcientologro = (item.peso/lo)*100
      }else{
       rl.porcientologro = 0
      }
      
    }else{
      

      rl.porcientologro = ((item.evaluacioneDesempenoMetaRespuestas?.logro??0)/item.peso)*100
      
    }
    //calculo resultado
    rl.resultadologro = (rl.porcientologro*item.meta)/100
    
    return rl
  }

  onMedioverificacionChange(event:any,index:number){
    let mediov:string = event.target.value
    if (!this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas) {
      
    } else {
      this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.medioverificacion = mediov;
    }
    this.onEvaluacionChange.emit(this.evaluacion)
  }
  
  onComentarDesempenoioChange(event:any,index:number){
    let mediov:string = event.target.value
    if (!this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas) {
      
    } else {
      this.evaluacion.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas!.comentario = mediov;
    }
    this.onEvaluacionChange.emit(this.evaluacion)
  }

  async calculaelpromediodesempeno(){
    this.promedioCompetencias=0
    let num:number=0
    this.resultadologro.forEach((e)=>{
      
      num = num + e.porcientologro
    })

    // desempeño
    this.promedioDesempeno=num/this.resultadologro.length
    let px1:IPorcientoDesempenoCompetencia|undefined=this.pdclocal.find(x=>x.descripcion==='Desempeño')
    this.porcentajeDesempeno = px1?.valor??0
    this.desempenoFinal=(this.porcentajeDesempeno * this.promedioDesempeno)/100

    //Competencia
    //busca las respuesta y da un promedio
    if(this.supervisor){
      this.promedioCompetencias = (await this.EvaluacionControler.CalculoCompetencias()/(this.EvaluacionControler.model.goalEmpleadoRespuestas.length*2))
    }else{
      this.promedioCompetencias = (await this.EvaluacionControler.CalculoCompetencias()/this.EvaluacionControler.model.goalEmpleadoRespuestas.length)
    }
    
    //this.promedioCompetencias = this.porcentajeCompetencia/this.EvaluacionControler.model.evaluacionGoals.length
    let px2:IPorcientoDesempenoCompetencia|undefined=this.pdclocal.find(x=>x.descripcion==='Competencia')
    this.porcentajeCompetencia = px2?.valor 
    this.CompetenciaFinal = (this.porcentajeCompetencia * this.promedioCompetencias)/100
    console.log('competencias',this.porcentajeCompetencia)

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
    this.EvaluacionControler.calculaelpromediodesempeno(this.supervisor,this.resultadologro)
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
