import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IEvaluacion, IEvaluacionDto, IEvaluacionGoal, IEvalucionResultDto, IGoalEmpleadoRespuesta, IReporte01 } from "../Models/Evaluacion/IEvaluacion";
import { ValoresEvaluacion } from "./ValoresEvaluacion";
import { IValoresEvaluacion } from "../Models/ValoresEvaluacion/IValoresEvaluacion";
import { IResultadoLogro } from "../Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta";
import { PorcientoDesempenoCompetencia } from "./PorcientoDesempenoCompetencia";
import { IPorcientoDesempenoCompetencia } from "../Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia";
import { ComunicacionService } from "../Services/comunicacion.service";


@Injectable({
    providedIn: 'root'
})
export class Evaluacion implements OnInit {

    rutaapi: string = this.datos.URL + '/api/Evaluacions';
    titulomensage: string = 'Evaluaciones';
    public model: IEvaluacion = this.inicializamodelo();
    public resultadologro:IResultadoLogro[]=[]
    public titulos = [
        { periodo: 'Periodo' },
        { empleado: "Empleado" },
        { totalCalculo: "Total Cálculo" },
        { fechaRepuestas: "Fecha Respuestas" },
        { observacion: "Observación" }
    ];
    public promedioDesempeno: string|number = 0;
    public desempenoFinal: string|number = 0;
    public porcentajeDesempeno: any;
    public promedioCompetencias: string|number =0;
    public competenciasFinal: string|number=0;
    public porcentajeCompetencia: any;
    public CompetenciaFinal: string|number=0;
    public estado: string = '';
    public totalregistros: number = 0;
    public actualpage: number = 1;
    public pagesize: number = 10;
    public filtro: string = '';
    public arraymodel: IEvaluacion[] = [];
    public pdclocal:IPorcientoDesempenoCompetencia[]=[]
    public puntuacionFinal:number=0

    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService,
        private valorevalucioncontroller: ValoresEvaluacion,
        private porcientoDesempenoCompetencia:PorcientoDesempenoCompetencia, 
        private PorCientoDC:PorcientoDesempenoCompetencia,
        private ServicioComunicacion:ComunicacionService
    ) { 
        this.PorCientoDC.Gets().subscribe({
            next:(rep)=>{
              //console.log('porcientodesempenocompetencia',rep)
              this.pdclocal = rep.data
      
            }
          })
    } 

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
            empleadoSecuencial: 0,
            totalCalculo: 0,
            fechaRepuestas: '',
            observacion: '',
            evaluacionGoals: [],
            evaluacionDesempenoMetas: [],
            goalEmpleadoRespuestas: [],
            puntuaciondesempenocolaborador:0,
            puntuacioncompetenciacolaborador:0 ,
            totalcolaborador:0,
            puntuaciondesempenosupervidor:0,
            puntuacioncompetenciasupervisor:0,
            totalsupervisor:0,
            estadoevaluacion:'Pendiente'   ,
            entrevistaConSupervisor: false,
            aceptaEnDisgusto: false,
            comentarioDisgusto: ''
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

    public async CalculoCompetencias(supervisor:Boolean): Promise<number> {
        this.model.totalCalculo = 0;
        let competencias:number=0;
        //console.log('competencias calculo',this.model.goalEmpleadoRespuestas)
        for (let item of this.model.goalEmpleadoRespuestas) {
            
                // hay que buscar en la tabla de ValoresEvaluacion  
                if (supervisor){
                    if (item.repuestasupervisor!=0){
                        competencias+=await this.GetvalorEvaluacion(item.repuestasupervisor,"id");                                     
                    }
                }
                if(item.repuesta!=0){
                    competencias+=await this.GetvalorEvaluacion(item.repuesta,"id");
                }
            
        }
        
        return competencias;
    }

    async calculaelpromediodesempeno(supervisor:Boolean,resultadologro:IResultadoLogro[]){
       //console.log('se llamo a calculaelpromediodesempeno')
        this.promedioCompetencias=0
        let num:number=0
        resultadologro.forEach((e)=>{
          
          num = num + e.porcientologro
        })

        this.pdclocal=this.pdclocal.filter(x=>x.periodId==this.model.periodId)
           // verificar si tiene desempeño en caso de que no se cambia la proporcion de la pdclocal
            // poniendo el valor para desepeño en 0 y para competencia en 100
            if (this.model.evaluacionDesempenoMetas.length==0){
                this.pdclocal = this.pdclocal.map((x)=>{
                  if (x.descripcion==='Desempeño'){
                    x.valor = 0
                  }else{
                    x.valor = 100
                  }
                  return x
                })
              }

        // desempeño
        this.promedioDesempeno=num/resultadologro.length
        let px1:IPorcientoDesempenoCompetencia|undefined=this.pdclocal.find(x=>x.descripcion==='Desempeño')
        this.porcentajeDesempeno = px1?.valor??0        
        this.desempenoFinal=(this.porcentajeDesempeno * this.promedioDesempeno)/100
        

    
        //Competencia
        if(supervisor){
          this.promedioCompetencias = (await this.CalculoCompetencias(supervisor)/(this.model.goalEmpleadoRespuestas.length*2))
        }else{
          this.promedioCompetencias = (await this.CalculoCompetencias(supervisor)/this.model.goalEmpleadoRespuestas.length)
          this.model.totalcolaborador = this.desempenoFinal +((this.porcentajeCompetencia * this.promedioCompetencias)/100)
        }
        //console.log('promedioCompetencias',this.promedioCompetencias)
        
        let px2:IPorcientoDesempenoCompetencia|undefined=this.pdclocal.find(x=>x.descripcion==='Competencia')
        this.porcentajeCompetencia = px2?.valor 
        this.CompetenciaFinal = (this.porcentajeCompetencia * this.promedioCompetencias)/100
        this.puntuacionFinal = this.CompetenciaFinal + this.desempenoFinal

        // actualizacion de desempeño del modelo
        this.model.puntuaciondesempenocolaborador = this.desempenoFinal
        this.model.puntuacioncompetenciasupervisor = this.CompetenciaFinal
        this.model.totalCalculo =  this.puntuacionFinal
        this.ServicioComunicacion.enviarMensaje({mensaje:'Actualizar variables'})
    
      }

    public GetEvaluacionReporte01(periodId:number): Observable<ModelResponse>{
        return this.datos.getdatos<ModelResponse>(this.rutaapi+`/reporte1?periodo=${periodId}`); 
    }
    public GetEvaluacionReporte02(periodId:number): Observable<ModelResponse>{
        return this.datos.getdatos<ModelResponse>(this.rutaapi+`/reporte2?periodo=${periodId}`); 
    }

    public async GetvalorEvaluacion(id: number, retornar: string): Promise<number> {
        let valor: number = 0;
    
        switch (retornar) {
            case 'id':
                if (id !== 0) {
                     await firstValueFrom(
                        this.valorevalucioncontroller.Get(id.toString()).pipe(
                            map((rep) => rep)
                        )
                    ).then((s)=>valor=s.valor);
                }
                break;
    
            case 'porciento':
                valor = await firstValueFrom(
                    this.valorevalucioncontroller.Gets().pipe(
                        map((rep: ModelResponse) => {
                            
                            let ve: IValoresEvaluacion[] = rep.data;
                            let ve1: IValoresEvaluacion | undefined = ve.find((val) => 
                                this.estaEnRango({ 
                                    RangoDesde: val.rangoDesde, 
                                    RangoHasta: val.rangoHasta 
                                }, id)
                            );
                            //console.table(ve1)
                            return ve1?.valor || 0;
                        })
                    )
                );
                break;
        }
    
        //console.log(retornar, id, valor);
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
                    //console.log(rep.data);
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
            secuencialempleado: obj.empleadoSecuencial,
            totalCalculo: obj.totalCalculo,
            fechaRepuestas: obj.fechaRepuestas,
            observacion: obj.observacion,
            goalEmpleadoRespuestas: obj.goalEmpleadoRespuestas,
            evaluacionDesempenoMetas: obj.evaluacionDesempenoMetas,
            evaluacionCursoCapacitacions:obj.evaluacionCursoCapacitacions,
            puntuaciondesempenocolaborador:obj.puntuaciondesempenocolaborador,
            puntuacioncompetenciacolaborador:obj.puntuacioncompetenciacolaborador ,
            totalcolaborador:obj.totalcolaborador,
            puntuaciondesempenosupervidor:obj.puntuaciondesempenosupervidor,
            puntuacioncompetenciasupervisor:obj.puntuacioncompetenciasupervisor,
            totalsupervisor:obj.totalsupervisor,
            estadoevaluacion:obj.estadoevaluacion,
            entrevistaConSupervisor:obj.entrevistaConSupervisor,
            aceptaEnDisgusto:obj.aceptaEnDisgusto,
            comentarioDisgusto:obj.comentarioDisgusto
        }
        console.log('evaluacionCursoCapacitacion',evaluaciondto,obj)
        return this.datos.updatedatos<IEvaluacionDto>(this.rutaapi + `/${evaluaciondto.id}`, evaluaciondto);
    }

    public async grabar(Supervisor:Boolean): Promise<boolean> {
        console.log('grabar',this.model)
        return new Promise<boolean>(async (resolve) => {
            try {
                if (this.model.evaluacionDesempenoMetas.length==0){
                    this.pdclocal = this.pdclocal.map((x)=>{
                      if (x.descripcion==='Desempeño'){
                        x.valor = 0
                      }else{
                        x.valor = 100
                      }
                      return x
                    })
                }
                // Calcular competencia
                let competencia:number = await this.CalculoCompetencias(Supervisor);
                
                // Calcular desempeño
                let desempeno:number = 0;
                if (this.model.evaluacionDesempenoMetas.length > 0) {
                    desempeno = await this.CalculoDesempeno();
                }
                
                // Obtener los porcentajes de desempeño y competencia
                const porcientosResponse = await firstValueFrom(
                    this.porcientoDesempenoCompetencia.Gets().pipe(
                        map((rep: ModelResponse) => {
                            const pdc: IPorcientoDesempenoCompetencia[] = rep.data;
                            return pdc.filter(item => item.periodId === this.model.periodId);
                        })
                    )
                );

                // Inicializar objeto para almacenar los valores
                let dc = {
                    competencia: 0,
                    desempeno: 0,
                    valorcompetencia: 0,
                    valordesempeno: 0,
                    total: 0
                };

                // Asignar valores según la descripción
                porcientosResponse.forEach(item => {
                    if (item.descripcion === 'Desempeño') {
                        dc.desempeno = item.valor;
                    } else if (item.descripcion === 'Competencia') {
                        dc.competencia = item.valor;
                    }
                });

                // Calcular valores finales
                dc.valorcompetencia = (dc.competencia * competencia) / 100;
                dc.valordesempeno = (dc.desempeno * desempeno) / 100;
                dc.total = dc.valorcompetencia + dc.valordesempeno;
                
                this.model.totalCalculo = dc.total;

                // Insertar o actualizar según corresponda
                if (this.model.id === 0) {
                    const response = await firstValueFrom(this.insert(this.model));
                    this.model = response;
                    this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                    resolve(true);
                } else {
                    await firstValueFrom(this.Update(this.model));
                    this.TRegistros.emit(this.totalregistros);
                    resolve(true);
                }
            } catch (error) {
                this.datos.showMessage('Error:' + (error as Error).message, this.titulomensage, 'error');
                resolve(false);
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
    public Getevaluacioncursos(id:string): Observable<ModelResponse>{
        return this.datos.getdatos<ModelResponse>(this.rutaapi + `/curso/${id}`)        
    }
    public GetEvaluacionesPorEmpleado(secuencialempleado: number): Observable<IEvaluacion[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let evaluaciones: IEvaluacion[] = rep.data;
                return evaluaciones.filter(x => x.empleadoSecuencial == secuencialempleado);
            })
        );
    }
    public GetEvaluacionePorEmpleadoyPeriodo(secuencialempleado: number,periodId:number): Observable<IEvaluacion> {
        return this.datos.getbyid<IEvaluacion>(`${this.rutaapi}/evaluacion?empleadoid=${secuencialempleado}&periodoid=${periodId}`)
               
    }
    public GetEvaluacionEstadoDts(periodId: number, EmpleadoSecuencial: number): Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi + `/EstadoEvaluacionSub?empleadoids=${EmpleadoSecuencial}&periodoid=${periodId}`);
    }
        
    public AddEvaluacionGoal(evaluacionGoal: IEvaluacionGoal): void {
        this.model.evaluacionGoals.push(evaluacionGoal);
    }

    public AddGoalEmpleadoRespuesta(goalEmpleadoRespuesta: IGoalEmpleadoRespuesta): void {
        this.model.goalEmpleadoRespuestas.push(goalEmpleadoRespuesta);
    }
}
