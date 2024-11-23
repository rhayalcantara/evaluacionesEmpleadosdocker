import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IEvaluacion, IEvaluacionDto, IEvaluacionGoal, IEvalucionResultDto, IGoalEmpleadoRespuesta } from "../Models/Evaluacion/IEvaluacion";

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
        private datos: DatosServiceService
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
            goalEmpleadoRespuestas: obj.goalEmpleadoRespuestas
          }
        return this.datos.updatedatos<IEvaluacionDto>(this.rutaapi + `/${evaluaciondto.id}`, evaluaciondto);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
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

    public CalculateTotalCalculo(): void {
        let total = 0;
        for (let respuesta of this.model.goalEmpleadoRespuestas) {
            total += respuesta.repuesta * respuesta.weight;
        }
        this.model.totalCalculo = total;
    }
}