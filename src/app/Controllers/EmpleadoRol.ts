import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IEmpleadoRol, IEmpleadoRolDTs } from "../Models/Rol/IRol";

@Injectable({
    providedIn: 'root'
})
export class EmpleadoRol implements OnInit {
    rutaapi: string = this.datos.URL + '/api/EmpleadoRols'
    titulomensage: string = 'Roles de Empleado'
    public model: IEmpleadoRol = this.inicializamodelo()
    public titulos = [
        { empleado: 'Empleado' },
        { rol: 'Rol' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IEmpleadoRol[] = []

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

    public inicializamodelo(): IEmpleadoRol {
        return {
            id: 0,
            empleadoSecuencial: 0,
            rolId: 0,
            rol: {
                id: 0,
                name: '',
                nivel: 0
            },
            empleado: {
                secuencial: 0,
                codigousuario: '',
                nombreunido: '',
                identificacion: '',
                sdept: 0,
                departamento: '',
                codigoestado: '',
                scargo: 0,
                cargo: '',
                esjefatura: 0,
                tienejefe: 0,
                nivel: 0,
                fechapostulacion: '',
                jefeinmediatO_SECUENCIAL: 0,
                jefeinmediato: ''
            }
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

    public getEmpleadoRolesPorEmpleado(empleadoId: number): Observable<IEmpleadoRol[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let empleadoRoles: IEmpleadoRol[] = rep.data;
                return empleadoRoles.filter(x => x.empleadoSecuencial === empleadoId);
            })
        );
    }

    public getEmpleadoRolesPorRol(rolId: number): Observable<IEmpleadoRol[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let empleadoRoles: IEmpleadoRol[] = rep.data;
                return empleadoRoles.filter(x => x.rolId === rolId);
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

    public Get(id: string): Observable<IEmpleadoRol> {
        return this.datos.getbyid<IEmpleadoRol>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IEmpleadoRol): Observable<IEmpleadoRol> {
        return this.datos.insertardatos<IEmpleadoRol>(this.rutaapi, obj);
    }

    public Update(obj: IEmpleadoRol): Observable<IEmpleadoRolDTs> {
        let objdts:IEmpleadoRolDTs ={
            id: obj.id,
            empleadoSecuencial: obj.empleadoSecuencial,
            rolId: obj.rolId
        }
        return this.datos.updatedatos<IEmpleadoRolDTs>(this.rutaapi + `/${objdts.id}`, objdts);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IEmpleadoRol) => {
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
                    (rep: IEmpleadoRolDTs) => {
                        //this.model = rep;
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
