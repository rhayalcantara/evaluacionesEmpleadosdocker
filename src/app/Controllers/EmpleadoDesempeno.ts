import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, map, Observable, tap } from 'rxjs';
import { IEmpleadoDesempeno } from "../Models/EmpleadoDesempeno/IEmpleadoDesempeno";

@Injectable({
    providedIn: 'root'
})
export class EmpleadoDesempeno implements OnInit {
    rutaapi: string = this.datos.URL + '/api/EmpleadoDesempenoes'
    titulomensage: string = 'Desempeño del Empleado'
    public model: IEmpleadoDesempeno = this.inicializamodelo()
    public titulos = [
        { secuencialId: 'Secuencial' },
        { kriId: 'KRI' },
        { kpiId: 'KPI' },
        { objetivoProyectoId: 'Objetivo del Proyecto' }
    ]

    public estado: string = ''
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IEmpleadoDesempeno[] = []

    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService
    ) { }

    ngOnInit(): void {
        this.resetPagination();
        this.getdatos();
    }

    private resetPagination() {
        this.filtro = "";
        this.estado = "";
        this.actualpage = 1;
        this.pagesize = 10;
    }

    public inicializamodelo(): IEmpleadoDesempeno {
        return {
            id: 0,
            secuencialId: 0,
            kriId: 0,
            kpiId: 0,
            objetivoProyectoId: 0,
            periodoId: 0
        }
    }

    public getdatos() {
        return this.Gets().pipe(
            tap((rep: ModelResponse) => {
                this.totalregistros = rep.count;
                this.arraymodel = rep.data;
                this.TRegistros.emit(this.totalregistros);
            })
        ).subscribe();
    }

    public getDesempenoPorKri(kriId: number): Observable<IEmpleadoDesempeno[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let desempenos: IEmpleadoDesempeno[] = rep.data;
                return desempenos.filter(x => x.kriId == kriId);
            })
        );
    }

    public getDesempenoPorKpi(kpiId: number): Observable<IEmpleadoDesempeno[]> {
        return this.Gets().pipe(
            map((rep: ModelResponse) => {
                let desempenos: IEmpleadoDesempeno[] = rep.data;
                return desempenos.filter(x => x.kpiId == kpiId);
            })
        );
    }

    public filtrar() {
        this.resetPagination();
        return this.Gets().pipe(
            tap((rep: ModelResponse) => {
                this.totalregistros = rep.count;
                this.arraymodel = rep.data;
                this.TRegistros.emit(this.totalregistros);
            })
        ).subscribe();
    }

    public Gets(): Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi);
    }

    public Get(id: string): Observable<IEmpleadoDesempeno> {
        return this.datos.getbyid<IEmpleadoDesempeno>(this.rutaapi + `/${id}`);
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`);
    }

    public insert(obj: IEmpleadoDesempeno): Observable<IEmpleadoDesempeno> {
        return this.datos.insertardatos<IEmpleadoDesempeno>(this.rutaapi, obj);
    }

    public Update(obj: IEmpleadoDesempeno): Observable<IEmpleadoDesempeno> {
        return this.datos.updatedatos<IEmpleadoDesempeno>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
       
        //console.table(this.model);
        return new Promise<boolean>(async (resolve) => {
            try {
                if (this.model.id == 0) {
                    // Insert new record
                    const rep = await firstValueFrom(this.insert(this.model));
                    const newRecord = await firstValueFrom(this.Get(rep.id.toString()));
                    this.model = newRecord;
                    this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                    this.getdatos(); // Refresh the list after insert
                    resolve(true);
                } else {
                    // Update existing record
                    const rep = await firstValueFrom(this.Update(this.model));
                    this.model = rep;
                    this.datos.showMessage('Registro Actualizado Correctamente', this.titulomensage, "success");
                    this.getdatos(); // Refresh the list after update
                    resolve(true);
                }
            } catch (err: any) {
                this.datos.showMessage('Error: ' + err.message, this.titulomensage, 'error');
                resolve(false);
            }
        });
    }
}
