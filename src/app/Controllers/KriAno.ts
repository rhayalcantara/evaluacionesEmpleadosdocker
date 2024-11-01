import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IKriAno } from "../Models/PlanExtrategico/IPlanExtrategico";

@Injectable({
    providedIn: 'root'
})
export class KriAno implements OnInit {
    rutaapi: string = this.datos.URL + '/api/KriAno'
    titulomensage: string = 'KRI Año'
    
    public model: IKriAno = this.inicializamodelo()
    public titulos = [
        { kriId: 'KRI ID' },
        { planAno: 'Plan Año' },
        { porcientoValor: 'Porcentaje Valor' },
        { valor: 'Valor' },
        { inverso: 'Inverso' },
        { logro: 'Logro' }
    ]

    public estado: string = ''
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IKriAno[] = []

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

    public inicializamodelo(): IKriAno {
        return {
            id: 0,
            kriId: 0,
            plan_AnosId: 0,
            porcientoValor: '',
            valor: 0,
            inverso: false,
            logro: 0
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

    public insertarray(objeAnos:IKriAno[]):Observable<IKriAno[]>{
        return this.datos.insertardatos<IKriAno[]>(this.rutaapi+`/bulk`,objeAnos)
      }
    public getKriAnosPorPlanAno(planAnoId: number): Observable<IKriAno[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let kriAnos: IKriAno[] = rep.data;
                return kriAnos.filter(x => x.plan_AnosId == planAnoId);
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

    public Get(id: string): Observable<IKriAno> {
        return this.datos.getbyid<IKriAno>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IKriAno): Observable<IKriAno> {
        return this.datos.insertardatos<IKriAno>(this.rutaapi, obj);
    }

    public Update(obj: IKriAno): Observable<IKriAno> {
        return this.datos.updatedatos<IKriAno>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IKriAno) => {
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
                    (rep: IKriAno) => {
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
