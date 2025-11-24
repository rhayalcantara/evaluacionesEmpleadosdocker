import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { MatDialog } from "@angular/material/dialog";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { LoadingComponent } from "../Views/Components/loading/loading.component";
import { IPeriodoEvaluacion } from "../Models/PeriodoEvaluacion/IPeriodoEvaluacion";
import { firstValueFrom } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class PeriodosEvaluacion implements OnInit {
    rutaapi: string = this.datos.URL + '/api/PeriodEvaluations'
    titulomensage: string = 'Mantenimiento Evaluaciónes'

    public model: IPeriodoEvaluacion = this.inicializamodelo()
    titulos = [
        { Periodo: 'Periodo' },
        { Departamento: 'Departamento' },
        { Puesto: 'Puesto' }
    ]
    public estado: string = '`'
    public totalregistros: number = 0
    public actualpage: number = 1
    public pagesize: number = 10
    public filtro: string = ''
    public arraymodel: IPeriodoEvaluacion[] = []
    public arraytotal: IPeriodoEvaluacion[] = []
    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos: DatosServiceService,
        //private toastr: MatDialog
    ) { }

    ngOnInit(): void {
        this.filtro = ""
        this.estado = ""
        this.actualpage = 1
        this.pagesize = 10
        this.getdatos()
    }

    public inicializamodelo(): IPeriodoEvaluacion {
        let pe: IPeriodoEvaluacion ={
            id: 0,
            periodId: 0,
            positionSecuential: 0,
            goalId: 0,
            periodo: {
                id: 0,
                descripcion: "",
                fechaInicio: new Date(),
                fechaFin: new Date(),
                activa: false,
                estadoid: 0
            }
        }
        return pe;
    }

    public getdatos() {
     /*   const dialogRef = this.toastr.open(LoadingComponent, {
            width: '340px',
            height: '180px',
        });
*/
        this.Gets().subscribe({
            next: (rep: ModelResponse) => {
                this.totalregistros = rep.count
                this.pagesize = rep.count
                this.arraymodel = []
                this.arraytotal = []
                this.arraymodel = rep.data
                this.arraytotal = rep.data
                
                this.TRegistros.emit(this.totalregistros)

               // dialogRef.close()
            }
        })
    }

    public Gets(): Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id: string): Observable<IPeriodoEvaluacion> {
        return this.datos.getbyid<IPeriodoEvaluacion>(this.rutaapi + `/${id}`)
    }

    public GetCount(): Observable<number> {
        return this.datos.getdatoscount(this.rutaapi + `/count`)
    }

    public insert(obj: IPeriodoEvaluacion): Observable<IPeriodoEvaluacion> {
        return this.datos.insertardatos<IPeriodoEvaluacion>(this.rutaapi, obj);
    }

    public Update(obj: IPeriodoEvaluacion): Observable<IPeriodoEvaluacion> {
        return this.datos.updatedatos<IPeriodoEvaluacion>(this.rutaapi + `/${obj.id}`, obj);
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IPeriodoEvaluacion) => {
                        this.model = rep;

                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
                        resolve(true);
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
                        resolve(false);
                    }
                );
            } else {
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IPeriodoEvaluacion) => {
                        /*
                        let m = this.arraymodel.find(x => x.secuencial == this.model.secuencial)
                        if (m != undefined) {
                            m.secuencial = this.model.secuencial
                            m.descripcion = this.model.descripcion
                            m.fechaInicio = this.model.fechaInicio
                            m.fechaFin = this.model.fechaFin
                            m.estado = this.model.estado
                        }
                        */
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
