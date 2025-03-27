import { Component } from '@angular/core';
import { Evaluacion } from 'src/app/Controllers/Evaluacion';
import { IEvaluacion, IEvalucionResultDto } from 'src/app/Models/Evaluacion/IEvaluacion';
import { IResultadoLogro } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { IPorcientoDesempenoCompetencia } from 'src/app/Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia';

@Component({
  selector: 'app-recalculo',
  templateUrl: './recalculo.component.html',
  styleUrls: ['./recalculo.component.css']
})
export class RecalculoComponent {
  public evaluacion:IEvaluacion =this.EvaluacionController.inicializamodelo() 
   public desempeno:IEvalucionResultDto[]=[] 
   public totalPeso: number = 0
   public pdclocal:IPorcientoDesempenoCompetencia[]=[]
   public resultadologro:IResultadoLogro[]=[]
   
  constructor(public EvaluacionController:Evaluacion){}
   
  ngOnInit(): void {
    this.EvaluacionController.GetEvaluacionePorEmpleadoyPeriodo(525,1)
    .subscribe({
      next: (rep: IEvaluacion) => {
        this.evaluacion = rep;
        console.log(rep);
        this.EvaluacionController.GetsEvaluacionResultado(this.evaluacion.id)
                .subscribe({
                  next: (rep ) => {      
        
                    this.desempeno = rep.data;
                    // Calcular el total de los pesos
                    this.totalPeso = this.desempeno.reduce((sum, item) => sum + Number(item.peso), 0);
                    // verificar si tiene desempeño en caso de que no se cambia la proporcion de la pdclocal
                    // poniendo el valor para desepeño en 0 y para competencia en 100
                    
                    if (this.desempeno.length==0){
                      this.pdclocal = this.pdclocal.map((x)=>{
                        if (x.descripcion==='Desempeño'){
                          x.valor = 0
                        }else{
                          x.valor = 100
                        }
                        return x
                      })
                    }
        
                    this.desempeno.forEach((item)=>{   
                        
                        
                      let rl:IResultadoLogro={
                        id:item.id,
                        EvaluacionId: item.evaluacionId,
                        logro: 0,
                        porcientologro:  0,
                        resultadologro: 0,
                        medioverificacion: '',
                        comentario: '',
                        comentariosupervisor:''
                      }
                                                   
                      this.resultadologro.push(rl)
                   
                  })
                  
                  this.EvaluacionController.calculaelpromediodesempeno(true,this.resultadologro)
      },
      error: (error: any) => {
        console.log(error);
      }
                });

      },
        error: (error: any) => {
          console.log(error);
        }
    });

  }
  

}