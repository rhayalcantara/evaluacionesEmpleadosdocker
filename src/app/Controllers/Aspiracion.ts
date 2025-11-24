import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IAspiracion } from '../Models/PlanExtrategico/IPlanExtrategico';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class Aspiracion {
    rutaapi:string = this.datos.URL+'/api/Aspiracions'
    titulomensage:string = 'Aspiraciones'
  
    public model:IAspiracion = this.inicializamodelo()
    titulos = [
      {descripcion:'Aspiración'},
      {descripcion:'Porciento Valor'},
      {descripcion:'Valor'}
    ]

    public estado:string = '`'
    public totalregistros:number = 0
    public actualpage:number = 1
    public pagesize:number = 10
    public filtro:string = ''
    public arraymodel:IAspiracion[] = []
    public arraytotal:IAspiracion[] = []
    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();
   
    constructor(
        private datos:DatosServiceService
    ){}

    ngOnInit(): void {
        this.filtro = ""
        this.estado = ""
        this.actualpage = 1
        this.pagesize = 10
        this.getdatos()
    }

    public inicializamodelo():IAspiracion {
        return {
            id: 0,
            planExtrategicoModelId: 0,
            descripcion: "",
            porcientovalor: "",
            valor: 0
        }
    }

    public getdatos() {
        this.Gets().subscribe({
            next:(rep:ModelResponse) => {
                this.totalregistros = rep.count
                this.pagesize = rep.count
                this.arraymodel = []
                this.arraytotal = []
                this.arraymodel = rep.data   
                this.arraytotal = rep.data
                this.arraymodel.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
                this.TRegistros.emit(this.totalregistros)        
            }
        }) 
    }
    public GetsPlan(Planid:number):Observable<IAspiracion[]> {
        
       return  this.Gets().pipe(
            map((resp: ModelResponse) => {
                let apiraciones:IAspiracion[] = resp.data; // Store the fetched aspirations in the local array
                return apiraciones.filter(a => a.planExtrategicoModelId === Planid);
            })
        )
    }

    public Gets():Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }
  
  
    public Get(id:string):Observable<IAspiracion> {
        return this.datos.getbyid<IAspiracion>(this.rutaapi+`/${id}`)
    }

    public GetCount():Observable<number> {
        return this.datos.getdatoscount(this.rutaapi+`/count`)
    }
  
    public insert(obj:IAspiracion):Observable<IAspiracion> {  
        return this.datos.insertardatos<IAspiracion>(this.rutaapi, obj)
    }
  
    public Update(obj:IAspiracion):Observable<IAspiracion> {
        return this.datos.updatedatos<IAspiracion>(this.rutaapi+`/${obj.id}`, obj)
    }
  
    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IAspiracion) => {
                        this.model = rep
                        this.datos.showMessage('Registro Insertado Correctamente', this.titulomensage, "success")                
                        resolve(true)
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error')
                        resolve(false)
                    }
                )
            } else {
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IAspiracion) => {
                        let m = this.arraymodel.find(x => x.id == this.model.id)
                        if (m != undefined) {
                            m.id = this.model.id
                            m.planExtrategicoModelId = this.model.planExtrategicoModelId
                            m.descripcion = this.model.descripcion
                            m.porcientovalor = this.model.porcientovalor
                            m.valor = this.model.valor
                        }
                        this.TRegistros.emit(this.totalregistros)
                        resolve(true)
                    },
                    (err: Error) => {
                        this.datos.showMessage('Error:' + err.message, this.titulomensage, 'error')
                        resolve(false)
                    }
                )
            }
        })
    }
}
