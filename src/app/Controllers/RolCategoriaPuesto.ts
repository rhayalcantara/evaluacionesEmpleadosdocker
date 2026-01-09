import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IRolCategoriaPuesto } from "../Models/RolCategoriaPuesto/IRolCategoriaPuesto";

@Injectable({
    providedIn: 'root'
})
export class RolCategoriaPuesto implements OnInit {
    rutaapi: string = this.datos.URL + '/api/RolCategoriaPuestoes'
    titulomensage: string = 'Rol Categoria Puesto'
    public model: IRolCategoriaPuesto = this.inicializamodelo()
    public titulos = [
        { descripcion: 'Descripción' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IRolCategoriaPuesto[] = []

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

    public inicializamodelo(): IRolCategoriaPuesto {
        return {
            id: 0,
            descripcion: '',
            categorias: []
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

    public Get(id: string): Observable<IRolCategoriaPuesto> {
        const url = this.rutaapi+ `/${id}`;
        return this.datos.getbyid<IRolCategoriaPuesto>(url)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IRolCategoriaPuesto): Observable<IRolCategoriaPuesto> {
        return this.datos.insertardatos<IRolCategoriaPuesto>(this.rutaapi, obj);
    }

    public Update(obj: IRolCategoriaPuesto): Observable<IRolCategoriaPuesto> {
        const url = this.rutaapi+ `/${obj.id}`;
        return this.datos.updatedatos<IRolCategoriaPuesto>(url, obj);
    }

    public Delete(id: number): Observable<IRolCategoriaPuesto> {
        const url = this.rutaapi + `/${id}`;
        return this.datos.delbyid<IRolCategoriaPuesto>(url);
    }

    public async eliminar(id: number): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            await firstValueFrom(this.Delete(id)).then(
                () => {
                    this.datos.showMessage('Registro Eliminado Correctamente', this.titulomensage, "success");
                    this.getdatos(); // Refresh the list after deletion
                    resolve(true);
                },
                (err: Error) => {
                    this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                    resolve(false);
                }
            );
        });
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IRolCategoriaPuesto) => {
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
                    (rep: IRolCategoriaPuesto) => {
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
