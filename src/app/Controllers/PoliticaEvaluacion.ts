import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { MatDialog } from "@angular/material/dialog";
import { IPoliticaEvaluacion } from "../Models/PoliticaEvaluacion/IPoliticaEvaluacion";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { LoadingComponent } from "../Views/Components/loading/loading.component";

@Injectable({
  providedIn: 'root'
})
export class PoliticaEvaluacion implements OnInit {
  rutaapi: string = this.datos.URL + '/api/PoliticaEvaluacions'
  titulomensage: string = 'Políticas de Evaluación'

  public model: IPoliticaEvaluacion = this.inicializamodelo()
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
      MinimoMesesEmpresaDesde: 0,
      MinimoMesesEmpresaHasta: 0,
      PermitirEntradaEvaluacion: false,
      ConsiderarParaIncremento: false,
      ConsiderarParaPromocion: false,
      EvaluarSoloParaIncremento: false,
      EvaluarSolo: false
    }
  }

  public getdatos() {
 

    this.Gets().subscribe({
      next: (rep: ModelResponse) => {
        console.log('llegaron los datos', rep.count)
        this.totalregistros = rep.count
        this.pagesize = rep.count
        this.arraymodel = []
        this.arraymodel = rep.data
        if(rep.data){
            this.arraymodel.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
        
        console.log('datos', this.arraymodel)
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
}