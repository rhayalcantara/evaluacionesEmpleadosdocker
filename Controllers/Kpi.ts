import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IKpi } from "../Models/Kpi/IKpi";

@Injectable({
    providedIn: 'root'
})
export class Kpi implements OnInit {
    rutaapi: string = this.datos.URL + '/api/Kpis'
    titulomensage: string = 'KPI'
    public model: IKpi = this.inicializamodelo()
    public titulos = [
        { kriId: 'KRI ID' },
        { descripcion: 'Descripción' },
        { valor: 'Valor' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IKpi[] = []

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

    public inicializamodelo(): IKpi {
        return {
            id: 0,
            kriId: 0,
            descripcion: '',
            valor: 0,
            inverso: false
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

    public getKpiPorKri(kriId: number): Observable<IKpi[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let kpis: IKpi[] = rep.data;
                return kpis.filter(x => x.kriId == kriId);
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
        console.log(this.rutaapi)
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IKpi> {
        return this.datos.getbyid<IKpi>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IKpi): Observable<IKpi> {
        return this.datos.insertardatos<IKpi>(this.rutaapi, obj);
    }

    public Update(obj: IKpi): Observable<IKpi> {
        return this.datos.updatedatos<IKpi>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IKpi) => {
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
                    (rep: IKpi) => {
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
