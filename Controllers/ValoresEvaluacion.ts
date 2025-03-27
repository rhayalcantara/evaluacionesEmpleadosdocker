import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, Observable } from 'rxjs';
import { IValoresEvaluacion } from "../Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia";

@Injectable({
    providedIn: 'root'
})
export class ValoresEvaluacion implements OnInit {
    rutaapi: string = this.datos.URL + '/api/ValoresEvaluacions'
    titulomensage: string = 'Valores de Evaluación'
    public model: IValoresEvaluacion = this.inicializamodelo()
    public titulos = [
        { titulo: 'Título' },
        { rangoDesde: 'Rango Desde' },
        { rangoHasta: 'Rango Hasta' },
        { valor: 'Valor' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IValoresEvaluacion[] = []

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

    public inicializamodelo(): IValoresEvaluacion {
        return {
            id: 0,
            titulo: '',
            rangoDesde: 0,
            rangoHasta: 0,
            valor: 0
        }
    }

    public getdatos() {
        this.Gets()
            .subscribe({
                next: (rep: ModelResponse) => {
                    this.totalregistros = rep.count
                    this.arraymodel = []
                    this.arraymodel = rep.data
                    this.TRegistros.emit(this.totalregistros)
                }
            })
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
        //console.log(this.rutaapi)
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IValoresEvaluacion> {
        return this.datos.getbyid<IValoresEvaluacion>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IValoresEvaluacion): Observable<IValoresEvaluacion> {
        return this.datos.insertardatos<IValoresEvaluacion>(this.rutaapi, obj);
    }

    public Update(obj: IValoresEvaluacion): Observable<IValoresEvaluacion> {
        return this.datos.updatedatos<IValoresEvaluacion>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IValoresEvaluacion) => {
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
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IValoresEvaluacion) => {
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
