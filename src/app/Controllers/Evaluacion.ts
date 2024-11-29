import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IEvaluacion, IEvaluacionDto, IEvaluacionGoal, IEvalucionResultDto, IGoalEmpleadoRespuesta } from "../Models/Evaluacion/IEvaluacion";
import { ValoresEvaluacion } from "./ValoresEvaluacion";
import { IValoresEvaluacion } from "../Models/ValoresEvaluacion/IValoresEvaluacion";
import { IEvaluacionDesempenoMeta } from "../Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta";
import { PorcientoDesempenoCompetencia } from "./PorcientoDesempenoCompetencia";
import { IPorcientoDesempenoCompetencia } from "../Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia";

@Injectable({
    providedIn: 'root'
})
export class Evaluacion implements OnInit {

    rutaapi: string = this.datos.URL + '/api/Evaluacions';
    titulomensage: string = 'Evaluaciones';
    public model: IEvaluacion = this.inicializamodelo();
    public titulos = [
        { periodo: 'Periodo' },
        { empleado: "Empleado" },
        { totalCalculo: "Total Cálculo" },
        { fechaRepuestas: "Fecha Respuestas" },
        { observacion: "Observación" }
    ];

    public estado: string = '';
    public totalregistros: number = 0;
    public actualpage: number = 1;
    public pagesize: number = 10;
    public filtro: string = '';
    public arraymodel: IEvaluacion[] = [];

    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService,
        private valorevalucioncontroller: ValoresEvaluacion,
        private porcientoDesempenoCompetencia:PorcientoDesempenoCompetencia
    ) { }

    ngOnInit(): void {
        this.filtro = "";
        this.estado = "";
        this.actualpage = 1;
        this.pagesize = 10;
        this.getdatos();
    }

    public inicializamodelo(): IEvaluacion {
        return {
            id: 0,
            periodId: 0,
            secuencialempleado: 0,
            totalCalculo: 0,
            fechaRepuestas: '',
            observacion: '',
            evaluacionGoals: [],
            evaluacionDesempenoMetas: [],
            goalEmpleadoRespuestas: []
        };
    }

    public async CalculoDesempeno(): Promise<number> {
        
        let desempeno:number=0;
        for (let item of this.model.evaluacionDesempenoMetas) {            

            desempeno+= await this.porcientologrado((item.evaluacioneDesempenoMetaRespuestas?.supervisado_logro??0),item.inverso,item.meta,item.peso)
            desempeno+=await this.porcientologrado((item.evaluacioneDesempenoMetaRespuestas?.logro??0),item.inverso,item.meta,item.peso) ;

        }
        
        return await this.GetvalorEvaluacion((desempeno/this.model.evaluacionDesempenoMetas.length),'porciento');
    }

    public async porcientologrado(logosupervisor:number,
                                  inverso:boolean,meta:number,
                                  peso:number
                                ):Promise<number>{
        let n:number=0
        let valorretorno:number=0
        
        if(inverso){
            n=(logosupervisor*1.00/meta*1.00)*100
        }else{
            if (logosupervisor>0){
                n=((meta*1.00)/(logosupervisor*1.00))*100
            }else{
                n=0
            }                   
        }
        let correcionpeso:number = (peso*n)/100.00
        valorretorno=await this.GetvalorEvaluacion(correcionpeso,'porciento');
        return valorretorno
    }

    public async CalculoCompetencias(): Promise<number> {
        this.model.totalCalculo = 0;
        let competencias:number=0;
        console.log('competencias',this.model.goalEmpleadoRespuestas)
        for (let item of this.model.goalEmpleadoRespuestas) {
            
                // hay que buscar en la tabla de ValoresEvaluacion  
                if (item.repuestasupervisor!=0){
                    competencias+=await this.GetvalorEvaluacion(item.repuestasupervisor,"id");                                     
                }
                if(item.repuesta!=0){
                competencias+=await this.GetvalorEvaluacion(item.repuesta,"id");
                }
            
        }
        
        return competencias;
    }


    public async GetvalorEvaluacion(id: number, retornar: string): Promise<number> {
        let valor: number = 0;
    
        switch (retornar) {
            case 'id':
                if (id !== 0) {
                    valor = await firstValueFrom(
                        this.valorevalucioncontroller.Get(id.toString()).pipe(
                            map((rep: IValoresEvaluacion) => rep.valor)
                        )
                    );
                }
                break;
    
            case 'porciento':
                valor = await firstValueFrom(
                    this.valorevalucioncontroller.Gets().pipe(
                        map((rep: ModelResponse) => {
                            
                            let ve: IValoresEvaluacion[] = rep.data;
                            let ve1: IValoresEvaluacion | undefined = ve.find((val) => 
                                this.estaEnRango({ 
                                    RangoDesde: val.RangoDesde, 
                                    RangoHasta: val.RangoHasta 
                                }, id)
                            );
                            console.table(ve1)
                            return ve1?.valor || 0;
                        })
                    )
                );
                break;
        }
    
        console.log(retornar, id, valor);
        return valor;
    }

    public estaEnRango(rango: { RangoDesde: number; RangoHasta: number }, valor: number): boolean {
        return rango.RangoDesde <= valor && valor <= rango.RangoHasta;
    }

    public getdatos() {
        this.Gets()
            .subscribe({
                next: (rep: ModelResponse) => {
                    this.totalregistros = rep.count;
                    this.arraymodel = [];
                    this.arraymodel = rep.data;
                    console.log(rep.data);
                    this.TRegistros.emit(this.totalregistros);
                }
            });
    }

    public filtrar() {
        this.Gets().subscribe(
            (m: ModelResponse) => {
                this.totalregistros = m.count;
                this.TRegistros.emit(this.totalregistros);
                this.arraymodel = [];
                this.arraymodel = m.data;
            }
        );
    }
    public GetsEvaluacionResultado(id:number): Observable<ModelResponse>{
        return this.datos.getdatos<ModelResponse>(this.rutaapi+ `/results?evaluationId=${id}`)
    }
    public Gets(): Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi);
    }

    public Get(id: string): Observable<IEvaluacion> {
        return this.datos.getbyid<IEvaluacion>(this.rutaapi + `/${id}`);
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`);
    }

    public insert(obj: IEvaluacion): Observable<IEvaluacion> {
        return this.datos.insertardatos<IEvaluacion>(this.rutaapi, obj);
    }

    public Update(obj: IEvaluacion): Observable<IEvaluacionDto> {
        let evaluaciondto:IEvaluacionDto={
            id: obj.id,
            periodId: obj.periodId,
            secuencialempleado: obj.secuencialempleado,
            totalCalculo: obj.totalCalculo,
            fechaRepuestas: obj.fechaRepuestas,
            observacion: obj.observacion,
            goalEmpleadoRespuestas: obj.goalEmpleadoRespuestas,
            evaluacionDesempenoMetas: obj.evaluacionDesempenoMetas
        }
        return this.datos.updatedatos<IEvaluacionDto>(this.rutaapi + `/${evaluaciondto.id}`, evaluaciondto);
    }

    public async grabar(): Promise<boolean> {
        //console.log('evalucion a grabar',this.model)
        return new Promise<boolean>(async (resolve) => {
            // calcular competencia
            
            let competencia:number = await this.CalculoCompetencias()
            //console.log(competencia)
            // calcular desempeño
            let desempeno:number=0
            if (this.model.evaluacionDesempenoMetas.length>0){
                desempeno= await this.CalculoDesempeno()  
            }
                          
            // buscar distribucion valordesempenocompetencia
            //periodId
            let dc={
                competencia:0,
                desempeno:0,
                valorcompetencia:0,
                valordesempeno:0,
                total:0
            }
            this.porcientoDesempenoCompetencia.Gets().pipe(
                map((rep:ModelResponse)=>{
                    let pdc:IPorcientoDesempenoCompetencia[]=rep.data
                    pdc.forEach((item)=>{
                        if(item.PeriodId == this.model.periodId){
                            if(item.descripcion==='Desempeño'){
                                dc.desempeno=item.valor
                            }else{
                                dc.competencia=item.valor
                            }
                        }
                    })
                })                    
            )
            dc.valorcompetencia=(dc.competencia*competencia)/100
            dc.valordesempeno=(dc.desempeno*desempeno)/100
            dc.total=dc.valorcompetencia+dc.valordesempeno
            console.table(dc)
            this.model.totalCalculo=dc.total            
            if (this.model.id == 0) {
                
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IEvaluacion) => {
                        this.model = rep;
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            } else {
                // actualiza el registro
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IEvaluacionDto) => {
                        //this.model = rep;
                        this.TRegistros.emit(this.totalregistros);
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            }
        });
    }

    // Additional methods specific to Evaluacion
    public GetEvaluacionesPorPeriodo(periodId: number): Observable<IEvaluacion[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let evaluaciones: IEvaluacion[] = rep.data;
                return evaluaciones.filter(x => x.periodId == periodId);
            })
        );
    }

    public GetEvaluacionesPorEmpleado(secuencialempleado: number): Observable<IEvaluacion[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let evaluaciones: IEvaluacion[] = rep.data;
                return evaluaciones.filter(x => x.secuencialempleado == secuencialempleado);
            })
        );
    }
    public GetEvaluacionePorEmpleadoyPeriodo(secuencialempleado: number,periodId:number): Observable<IEvaluacion> {
        return this.datos.getbyid<IEvaluacion>(`${this.rutaapi}/evaluacion?empleadoid=${secuencialempleado}&periodoid=${periodId}`)
               
    }

    public AddEvaluacionGoal(evaluacionGoal: IEvaluacionGoal): void {
        this.model.evaluacionGoals.push(evaluacionGoal);
    }

    public AddGoalEmpleadoRespuesta(goalEmpleadoRespuesta: IGoalEmpleadoRespuesta): void {
        this.model.goalEmpleadoRespuestas.push(goalEmpleadoRespuesta);
    }

  
}