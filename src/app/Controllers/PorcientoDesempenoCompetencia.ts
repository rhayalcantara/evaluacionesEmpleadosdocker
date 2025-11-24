import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IPorcientoDesempenoCompetencia } from "../Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia";

@Injectable({
    providedIn: 'root'
})
export class PorcientoDesempenoCompetencia implements OnInit {
    rutaapi: string = this.datos.URL + '/api/PorcientoDesempenoCompetencias'
    titulomensage: string = 'Porcentaje Desempeño Competencia'
    public model: IPorcientoDesempenoCompetencia = this.inicializamodelo()
    public titulos = [
        { PeriodId: 'Periodo' },
        { descripcion: 'Descripción' },
        { valor: 'Valor' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IPorcientoDesempenoCompetencia[] = []

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

    public inicializamodelo(): IPorcientoDesempenoCompetencia {
        return {
            id: 0,
            periodId: 0,
            descripcion: '',
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

    public getPorcientoDesempenoCompetenciaPorPeriodo(periodId: number): Observable<IPorcientoDesempenoCompetencia[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let porcentajes: IPorcientoDesempenoCompetencia[] = rep.data;
                return porcentajes.filter(x => x.periodId == periodId);
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

    public Get(id: string): Observable<IPorcientoDesempenoCompetencia> {
        return this.datos.getbyid<IPorcientoDesempenoCompetencia>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IPorcientoDesempenoCompetencia): Observable<IPorcientoDesempenoCompetencia> {
        return this.datos.insertardatos<IPorcientoDesempenoCompetencia>(this.rutaapi, obj);
    }

    public Update(obj: IPorcientoDesempenoCompetencia): Observable<IPorcientoDesempenoCompetencia> {
        return this.datos.updatedatos<IPorcientoDesempenoCompetencia>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IPorcientoDesempenoCompetencia) => {
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
                    (rep: IPorcientoDesempenoCompetencia) => {
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
