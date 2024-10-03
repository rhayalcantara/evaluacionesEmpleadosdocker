import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

export interface IGrupoCompetencia {
    id: number;
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class GrupoCompetencia {
    rutaapi: string = this.datos.URL + '/api/GrupoCompetencias';
    titulomensaje: string = 'Grupos de Competencia';

    public model: IGrupoCompetencia = this.inicializamodelo();
    titulos = [
        { nombre: 'Grupo de Competencia' }
    ];

    public estado: string = '';
    public totalregistros: number = 0;
    public actualpage: number = 1;
    public pagesize: number = 10;
    public filtro: string = '';
    public arraymodel: IGrupoCompetencia[] = [];
    public arraytotal: IGrupoCompetencia[] = [];
    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService
    ) { }

    ngOnInit(): void {
        this.filtro = "";
        this.estado = "";
        this.actualpage = 1;
        this.pagesize = 10;
        this.getdatos();
    }

    public inicializamodelo(): IGrupoCompetencia {
        return {
            id: 0,
            nombre: ""
        };
    }

    public getdatos() {
        this.Gets().subscribe({
            next: (rep: ModelResponse) => {
                
                console.log('llegaron los datos', rep.count);
                this.totalregistros = rep.count;
                this.pagesize = rep.count;
                this.arraymodel = [];
                this.arraytotal = [];
                this.arraymodel = rep.data;
                this.arraytotal = rep.data;
                if(rep.count>0){
                    this.arraymodel.sort((a, b) => a.nombre.localeCompare(b.nombre));
                }
                console.log('datos', this.arraymodel);
                this.TRegistros.emit(this.totalregistros);
            }
        });
    }

    public Gets(): Observable<ModelResponse> {
        console.log(this.rutaapi);
        return this.datos.getdatos<ModelResponse>(this.rutaapi);
    }

    public Get(id: string): Observable<IGrupoCompetencia> {
        return this.datos.getbyid<IGrupoCompetencia>(this.rutaapi + `/${id}`);
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`);
    }

    public insert(obj: IGrupoCompetencia): Observable<IGrupoCompetencia> {
        console.log('llego a insert en GrupoCompetencia', obj);
        return this.datos.insertardatos<IGrupoCompetencia>(this.rutaapi, obj);
    }

    public Update(obj: IGrupoCompetencia): Observable<IGrupoCompetencia> {
        return this.datos.updatedatos<IGrupoCompetencia>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IGrupoCompetencia) => {
                        console.log(rep);
                        this.model = rep;
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensaje, "success");
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensaje, 'error');
                        resolve(false);
                    }
                );
            } else {
                console.log(this.model);
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IGrupoCompetencia) => {
                        console.log('se actualizó el grupo de competencia:', rep);
                        let m = this.arraymodel.find(x => x.id == this.model.id);
                        if (m != undefined) {
                            m.id = this.model.id;
                            m.nombre = this.model.nombre;
                        }
                        this.TRegistros.emit(this.totalregistros);
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensaje, 'error');
                        resolve(false);
                    }
                );
            }
        });
    }
}