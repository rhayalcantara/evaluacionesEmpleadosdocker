import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IPlanExtrategico, IPlan_Anos, IAspiracion, IPlanExtrategicoCreate } from "../Models/PlanExtrategico/IPlanExtrategico";
import { IPerspectiva } from "../Models/Perspectiva/IPerspectiva";

@Injectable({
    providedIn: 'root'
})
export class PlanExtrategico implements OnInit {
    rutaapi: string = this.datos.URL + '/api/PlanExtrategicoModeles'
    titulomensage: string = 'Plan Estratégico'
    public model: IPlanExtrategico = this.inicializamodelo()
    public modelcreate:IPlanExtrategicoCreate ={
        id: 0,
        descripcion: "",
        cantidad_anos: 0
    }
    public titulos = [
        { descripcion: 'Descripción' },
        { cantidad_anos: 'Cantidad de Años' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IPlanExtrategico[] = []

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

    public inicializamodelo(): IPlanExtrategico {
        return {
            id: 0,
            descripcion: '',
            cantidad_anos: 0,
            planAnos: [],
            perspectiva: [],
            aspiraciones:[]
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
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IPlanExtrategico> {
        return this.datos.getbyid<IPlanExtrategico>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IPlanExtrategicoCreate): Observable<IPlanExtrategicoCreate> {
        console.log(obj)
        return this.datos.insertardatos<IPlanExtrategicoCreate>(this.rutaapi, obj);
    }
    public insertanos(obj:IPlan_Anos[]):Observable<IPlan_Anos[]>{
        return this.datos.insertardatos<IPlan_Anos[]>(this.datos.URL + `/api/plan_anos/grabararray`, obj);
    }
    public insertperperspectiva(obj: IPerspectiva[]): Observable<IPerspectiva[]> {
        return this.datos.insertardatos<IPerspectiva[]>(this.datos.URL + `/api/perspertiva/grabararray`, obj);
    }
    public insertAspiracion(obj: IAspiracion[]): Observable<IAspiracion[]> {
        return this.datos.insertardatos<IAspiracion[]>(this.datos.URL + `/api/Aspiracion/grabararray`, obj);
    }
    public Update(obj: IPlanExtrategico): Observable<IPlanExtrategico> {
        return this.datos.updatedatos<IPlanExtrategico>(this.rutaapi + `/${obj.id}`, obj);
    }

    public getPlanByPerspectiva(perspectivaId: number): Observable<IPlanExtrategico[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let planes: IPlanExtrategico[] = rep.data;
                return planes.filter(x => x.perspectiva.some(p => p.id === perspectivaId));
            })
        );
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                this.modelcreate.descripcion= this.model.descripcion;
                this.modelcreate.cantidad_anos = this.model.cantidad_anos;
                await firstValueFrom(this.insert(this.modelcreate)).then(
                    (rep: IPlanExtrategicoCreate) => 
                    {
                        firstValueFrom(this.Get(rep.id.toString())).then(t => 
                        {
                            this.model.id = t.id
                            this.model.planAnos.forEach(element => {
                                element.PlanExtrategicoId= this.model.id;
                                this.insertanos(this.model.planAnos) 
                            });
                            this.model.perspectiva.forEach(p => {
                                p.planextrategicoid = this.model.id
                                this.insertperperspectiva(this.model.perspectiva)
                            })
                            this.model.aspiraciones.forEach(p => {
                                p.planextrategicoid = this.model.id
                                this.insertperperspectiva(this.model.perspectiva)
                            })
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                        resolve(true);
                        },(err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                        })
                    }
                );
            } else {
                // actualiza el registro            
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IPlanExtrategico) => {
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
