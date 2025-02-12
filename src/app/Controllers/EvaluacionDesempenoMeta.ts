import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IEvaluacionDesempenoMeta } from "../Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta";

@Injectable({
    providedIn: 'root'
})
export class EvaluacionDesempenoMeta implements OnInit {
    rutaapi: string = this.datos.URL + '/api/EvaluacionDesempenoMetas'
    titulomensage: string = 'Evaluación Desempeño Meta'
    public model: IEvaluacionDesempenoMeta = this.inicializamodelo()
    public titulos = [
        { tipo: 'Tipo' },
        { descripcion: 'Descripción' },
        { meta: 'Meta' },
        { inverso: 'Inverso' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IEvaluacionDesempenoMeta[] = []

    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService
    ) { }

    ngOnInit(): void {
        this.filtro = ""
        this.estado = ""
        this.actualpage = 1
        this.pagesize = 10
        this.getdatos()
    }

    public inicializamodelo(): IEvaluacionDesempenoMeta {
        return {
            id: 0,
            evaluacionId: 0,
            tipo: '',
            descripcion: '',
            meta: 0,
            peso:0,
            inverso: false,
            perspectiva: ''
        }
    }

    public getdatos() {
        this.Gets()
            .subscribe({
                next: (rep: ModelResponse) => {
                    this.totalregistros = rep.count
                    this.arraymodel = []
                    this.arraymodel = rep.data
                    //console.log('llegaron al controlador los datos',this.arraymodel)
                    this.TRegistros.emit(this.totalregistros)
                }
            })
    }

    public getMetasPorEvaluacion(evaluacionId: number): Observable<IEvaluacionDesempenoMeta[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let metas: IEvaluacionDesempenoMeta[] = rep.data;
                return metas.filter(x => x.evaluacionId == evaluacionId);
            })
        );
    }

    public filtrar() {
        this.Gets().subscribe(
            (m: ModelResponse) => {
                this.totalregistros = m.count
                this.TRegistros.emit(this.totalregistros)
                this.arraymodel = []
                this.arraymodel = m.data
            }
        )
    }

    public Gets(): Observable<ModelResponse> {
        
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IEvaluacionDesempenoMeta> {
        return this.datos.getbyid<IEvaluacionDesempenoMeta>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IEvaluacionDesempenoMeta): Observable<IEvaluacionDesempenoMeta> {
        console.log('insertando', obj)
        return this.datos.insertardatos<IEvaluacionDesempenoMeta>(this.rutaapi, obj);
    }

    public Update(obj: IEvaluacionDesempenoMeta): Observable<IEvaluacionDesempenoMeta> {
        return this.datos.updatedatos<IEvaluacionDesempenoMeta>(this.rutaapi + `/${obj.id}`, obj);
    }

    public Delete(id: number): Observable<any> {
        return this.datos.delbyid(this.rutaapi + `/${id}`);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IEvaluacionDesempenoMeta) => {
                        firstValueFrom(this.Get(rep.id.toString())).then(t => {
                            this.model = t
                        })
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
                console.log('actualiza el registro', this.model)           
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IEvaluacionDesempenoMeta) => {
                        this.model = rep;
                        this.TRegistros.emit(this.totalregistros)
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
}
