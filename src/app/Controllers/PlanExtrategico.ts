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
        return this.datos.insertardatos<IPlanExtrategicoCreate>(this.rutaapi, obj);
    }

    /**
     * @deprecated Método legacy. Se mantiene para compatibilidad.
     * El enfoque recomendado es usar Update() con el objeto completo (según documentación oficial de la API).
     * Este método hace una llamada separada al endpoint /api/plan_anos/grabararray
     */
    public insertanos(obj:IPlan_Anos[]):Observable<IPlan_Anos[]>{
        return this.datos.insertardatos<IPlan_Anos[]>(this.datos.URL + `/api/plan_anos/grabararray`, obj);
    }

    /**
     * @deprecated Método legacy. Se mantiene para compatibilidad.
     * El enfoque recomendado es usar Update() con el objeto completo (según documentación oficial de la API).
     * Este método hace una llamada separada al endpoint /api/Perspectivas/grabararray
     * @param planExtrategicoModelId - ID del plan estratégico al que pertenecen las perspectivas
     * @param obj - Array de perspectivas a guardar
     */
    public insertperperspectiva(planExtrategicoModelId: number, obj: IPerspectiva[]): Observable<IPerspectiva[]> {
        // Enviar como body object (Opción 1 recomendada en el informe de cambios del backend)
        const requestBody = {
            planExtrategicoModelId: planExtrategicoModelId,
            perspectivas: obj
        };
        return this.datos.insertardatos<any>(this.datos.URL + `/api/Perspectivas/grabararray`, requestBody) as Observable<IPerspectiva[]>;
    }

    /**
     * @deprecated Método legacy. Se mantiene para compatibilidad.
     * El enfoque recomendado es usar Update() con el objeto completo (según documentación oficial de la API).
     * Este método hace una llamada separada al endpoint /api/Aspiracions/grabararray
     */
    public insertAspiracion(obj: IAspiracion[]): Observable<IAspiracion[]> {
        return this.datos.insertardatos<IAspiracion[]>(this.datos.URL + `/api/Aspiracions/grabararray`, obj);
    }

    /**
     * Actualiza un plan estratégico completo con todas sus relaciones en una sola llamada.
     * Implementa el patrón "Replace Collection" de la API:
     * - Elimina registros no enviados
     * - Actualiza registros existentes (id > 0)
     * - Crea registros nuevos (id = 0)
     * @param obj - Objeto completo del plan con sus relaciones (años, perspectivas, aspiraciones)
     */
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
            // Validación defensiva: asegurar que model no sea null o undefined
            if (!this.model) {
                this.datos.showMessage('Error: No hay datos para grabar', this.titulomensage, 'error');
                resolve(false);
                return;
            }

            if (this.model.id == 0) {
                // CREAR: Primero crear el plan base, luego actualizar con relaciones usando PUT
                this.modelcreate.descripcion = this.model.descripcion;
                this.modelcreate.cantidad_anos = this.model.cantidad_anos;

                await firstValueFrom(this.insert(this.modelcreate)).then(
                    async (rep: IPlanExtrategicoCreate) => {
                        // Asignar el ID generado al modelo
                        this.model.id = rep.id;

                        // Preparar IDs de relaciones
                        this.model.planAnos = this.model.planAnos || [];
                        this.model.planAnos.forEach(element => {
                            element.planExtrategicoId = this.model.id;
                        });

                        this.model.perspectiva = this.model.perspectiva || [];
                        this.model.perspectiva.forEach(p => {
                            p.planExtrategicoModelId = this.model.id;
                        });

                        this.model.aspiraciones = this.model.aspiraciones || [];
                        this.model.aspiraciones.forEach(a => {
                            a.planExtrategicoId = this.model.id;
                            a.planExtrategicoModelId = this.model.id;
                        });

                        // Ahora usar PUT para agregar las relaciones en una sola llamada
                        await firstValueFrom(this.Update(this.model)).then(
                            () => {
                                this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                                resolve(true);
                            },
                            (err: Error) => {
                                this.datos.showMessage('Error al guardar relaciones: ' + err.message, this.titulomensage, 'error');
                                resolve(false);
                            }
                        );
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            } else {
                // ACTUALIZAR: Usar PUT con el objeto completo (incluye relaciones)
                // Asegurar que los IDs de las relaciones estén correctamente asignados
                this.model.planAnos = this.model.planAnos || [];
                this.model.planAnos.forEach(element => {
                    element.planExtrategicoId = this.model.id;
                });

                this.model.perspectiva = this.model.perspectiva || [];
                this.model.perspectiva.forEach(p => {
                    p.planExtrategicoModelId = this.model.id;
                    // Eliminar referencia circular para evitar problemas de serialización
                    p.planExtrategicoModel = null as any;
                });

                this.model.aspiraciones = this.model.aspiraciones || [];
                this.model.aspiraciones.forEach(a => {
                    a.planExtrategicoId = this.model.id;
                    a.planExtrategicoModelId = this.model.id;
                });

                // Enviar TODO en una sola llamada PUT
                await firstValueFrom(this.Update(this.model)).then(
                    () => {
                        this.datos.showMessage('Registro Actualizado Correctamente', this.titulomensage, "success");
                        this.TRegistros.emit(this.totalregistros);
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            }
        });
    }
}
