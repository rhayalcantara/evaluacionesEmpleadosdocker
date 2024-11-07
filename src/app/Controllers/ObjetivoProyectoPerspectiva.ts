import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable } from 'rxjs';
import { IObjetivoProyectoPerspectiva } from "../Models/ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva";

@Injectable({
    providedIn: 'root'
})
export class ObjetivoProyectoPerspectiva implements OnInit {
    rutaapi: string = this.datos.URL + '/api/ObjetivoProyectoPerspectivas'
    titulomensage: string = 'Objetivo Proyecto Perspectiva'
    public model: IObjetivoProyectoPerspectiva = this.inicializamodelo()
    public titulos = [
        { tipo: 'Tipo' },
        { descripcion: 'Descripción' },
        { valor: 'Valor' }
    ]

    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IObjetivoProyectoPerspectiva[] = []

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

    public inicializamodelo(): IObjetivoProyectoPerspectiva {
        return {
            id: 0,
            tipo: 'Objetivos',
            perspervaId: 0,
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

    public getObjetivosPorPerspectiva(perspervaId: number): Observable<IObjetivoProyectoPerspectiva[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let objetivos: IObjetivoProyectoPerspectiva[] = rep.data;
                return objetivos.filter(x => x.perspervaId == perspervaId);
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

    public Get(id: string): Observable<IObjetivoProyectoPerspectiva> {
        return this.datos.getbyid<IObjetivoProyectoPerspectiva>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IObjetivoProyectoPerspectiva): Observable<IObjetivoProyectoPerspectiva> {
        return this.datos.insertardatos<IObjetivoProyectoPerspectiva>(this.rutaapi, obj);
    }

    public Update(obj: IObjetivoProyectoPerspectiva): Observable<IObjetivoProyectoPerspectiva> {
        return this.datos.updatedatos<IObjetivoProyectoPerspectiva>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                // inserta el registro
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IObjetivoProyectoPerspectiva) => {
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
                    (rep: IObjetivoProyectoPerspectiva) => {
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
