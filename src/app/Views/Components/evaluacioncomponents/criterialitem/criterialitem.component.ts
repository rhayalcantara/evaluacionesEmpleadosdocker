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
import { IEvaluacion, IGoalEmpleadoRespuesta } from 'src/app/Models/Evaluacion/IEvaluacion';
import { map, tap } from 'rxjs';
import { IDesempenoRespuesta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';

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
   @Input() evaluacion:IEvaluacion  
  public logro:number[]=[]
  public metas:IMetaDts[]=[]
  constructor(private EmpleadoModel:Empleados,
              private PeriodoModel:Periodos,
              private MetaModel:Metas,
              private EvaluacionControler:Evaluacion,
              private cd: ChangeDetectorRef
              
  ){
    this.empleado = this.EmpleadoModel.inicializamodelo()
    this.periodo = this.PeriodoModel.inicializamodelo()
    this.evaluacion=this.EvaluacionControler.inicializamodelo()
  }
  ngOnInit(): void {
    console.log('CriterialitemComponent',this.evaluacion)
    this.logro=Array.from({length:this.evaluacion.evaluacionDesempenoMetas.length},(v,k)=>k+1)
    /*
    this.MetaModel.GetMetasPorPeriodoYPuesto(this.periodo.id,this.empleado.scargo).subscribe(
      {next:(rep:IMetaDts[])=>{
        console.log('las metas:',rep)
        this.metas=rep;
      }
    }
    );*/
    // buscar 
  }

  onRespuestaChange(respuesta: IGoalEmpleadoRespuesta | IDesempenoRespuesta, index: number) {
    // Actualiza la respuesta en el array
    // verificar de que tipo es la respuesta
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
