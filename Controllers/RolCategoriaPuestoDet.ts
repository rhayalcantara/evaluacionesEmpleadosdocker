import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IRolCategoriaPuestoDet } from "../Models/RolCategoriaPuesto/IRolCategoriaPuesto";

@Injectable({
    providedIn: 'root'
})
export class RolCategoriaPuestoDet implements OnInit {
    rutaapi: string = this.datos.URL + '/api/RolCategoriaPuestoDets'
    titulomensage: string = 'Rol Categoria Puesto Detalle'
    public model: IRolCategoriaPuestoDet = this.inicializamodelo()
    public titulos = [
        { categoriapuestoId: 'Categoría' },
        { rolCategoriaId: 'Rol Categoría' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IRolCategoriaPuestoDet[] = []

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

    public inicializamodelo(): IRolCategoriaPuestoDet {
        return {
            id: 0,
            categoriaPuestoId: 0,
            rolCategoriaPuestoId: 0
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

    public getRolCategoriaPuestoDetPorRolCategoria(rolCategoriaId: number): Observable<IRolCategoriaPuestoDet[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let detalles: IRolCategoriaPuestoDet[] = rep.data;
                return detalles.filter(x => x.rolCategoriaPuestoId == rolCategoriaId);
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
        //console.log(this.rutaapi)
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IRolCategoriaPuestoDet> {
        return this.datos.getbyid<IRolCategoriaPuestoDet>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IRolCategoriaPuestoDet): Observable<IRolCategoriaPuestoDet> {
        return this.datos.insertardatos<IRolCategoriaPuestoDet>(this.rutaapi, obj);
    }

    public Update(obj: IRolCategoriaPuestoDet): Observable<IRolCategoriaPuestoDet> {
        return this.datos.updatedatos<IRolCategoriaPuestoDet>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IRolCategoriaPuestoDet) => {
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
                    (rep: IRolCategoriaPuestoDet) => {
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
