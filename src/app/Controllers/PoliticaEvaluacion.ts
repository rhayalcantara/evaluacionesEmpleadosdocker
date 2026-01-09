import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { MatDialog } from "@angular/material/dialog";
import { IPoliticaEvaluacion } from "../Models/PoliticaEvaluacion/IPoliticaEvaluacion";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { LoadingComponent } from "../Views/Components/loading/loading.component";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";

@Injectable({
  providedIn: 'root'
})
export class PoliticaEvaluacion implements OnInit {
  rutaapi: string = this.datos.URL + '/api/PoliticaEvaluacions'
  titulomensage: string = 'Políticas de Evaluación'

  public model: IPoliticaEvaluacion | null = this.inicializamodelo()
  titulos = [
    { tipo: 'Tipo' },
    { nombre: 'Nombre' }
  ]
  public estado: string = '`'
  public totalregistros: number = 0
  public actualpage: number = 1
  public pagesize: number = 600
  public filtro: string = ''
  public arraymodel: IPoliticaEvaluacion[] = []

  public operationSuccessful: boolean = false;
  @Output() TRegistros = new EventEmitter<number>();

  constructor(
    private datos: DatosServiceService,
    
  ) { }

  ngOnInit(): void {
    this.filtro = ""
    this.estado = ""
    this.actualpage = 1
    this.pagesize = 10
    this.getdatos()
  }

  public inicializamodelo(): IPoliticaEvaluacion {

    return {
      id: 0,
      nombre: "",
      tipo: "",
      minimoMesesEmpresaDesde: 0,
      minimoMesesEmpresaHasta: 0,
      permitirEntradaEvaluacion: false,
      considerarParaIncremento: false,
      considerarParaPromocion: false,
      evaluarSoloParaIncremento: false,
      evaluarSolo: false
    }
  }

  public getdatos() {
 

    this.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.totalregistros = rep.count
        this.pagesize = rep.count
        this.arraymodel = []
        this.arraymodel = rep.data
        if(rep.data){
            this.arraymodel.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
        
        this.TRegistros.emit(this.totalregistros)
       
      }
    })
  }

  public Gets(): Observable<ModelResponse> {
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
  }

  public Get(id: string): Observable<IPoliticaEvaluacion> {
    return this.datos.getbyid<IPoliticaEvaluacion>(this.rutaapi + `/${id}`)
  }

  public GetCount(): Observable<number> {
    return this.datos.getdatoscount(this.rutaapi + `/count`)
  }
  public insert(obj:IPoliticaEvaluacion):Observable<IPoliticaEvaluacion>{  

    return this.datos.insertardatos<IPoliticaEvaluacion>(this.rutaapi, obj ); 
  }
  public Update(obj:IPoliticaEvaluacion):Observable<IPoliticaEvaluacion>{
    return this.datos.updatedatos<IPoliticaEvaluacion>(this.rutaapi+`/${obj.id}`,obj); 
  }

  public async grabar(): Promise<boolean> {
    // Envuelve el código en una nueva Promise

    return new Promise<boolean>(async (resolve) => {
      if (!this.model) {
        this.datos.showMessage('Error: No hay datos para guardar', this.titulomensage, 'error');
        resolve(false);
        return;
      }

      if (this.model.id == 0) {
        // inserta el registro
        await firstValueFrom(this.insert(this.model)).then(
          (rep: IPoliticaEvaluacion) => {

            this.model = rep;
            this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");
            resolve(true); // Devuelve true si la operación fue exitosa
          },
          (err: Error) => {
            this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
            resolve(false); // Devuelve false si la operación falló
          }
        );
      } else {
        // actualiza el registro

        await firstValueFrom(this.Update(this.model)).then(
          (rep: IPoliticaEvaluacion) => {

            this.model = rep;

            this.TRegistros.emit(this.totalregistros)

            resolve(true); // Devuelve true si la operación fue exitosa
          },
          (err: Error) => {
            this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error');
            resolve(false); // Devuelve false si la operación falló
          }
        );
      }


    });
  }
}
