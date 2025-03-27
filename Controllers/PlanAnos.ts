import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IPlan_Anos } from '../Models/PlanExtrategico/IPlanExtrategico';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class PlanAnos {
    rutaapi:string = this.datos.URL+'/api/Plan_Anos'
    titulomensage:string = 'Plan Años'
    
    public model:IPlan_Anos = this.inicializamodelo()
    titulos = [
      {descripcion:'Año Plan'}
    ]
    
    public estado:string = '`'
    public totalregistros:number = 0
    public actualpage:number = 1
    public pagesize:number = 10
    public filtro:string = ''
    public arraymodel:IPlan_Anos[] = []
    public arraytotal:IPlan_Anos[] = []
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

    public inicializamodelo():IPlan_Anos {
        return {
            id: 0,
            planExtrategicoId: 0,
            ano: ""
        }
    }

    public getdatos() {
        this.Gets().subscribe({
            next:(rep:ModelResponse) => {
                console.log('llegaron los datos datos', rep.count)
                this.totalregistros = rep.count
                this.pagesize = rep.count
                this.arraymodel = []
                this.arraytotal = []
                this.arraymodel = rep.data   
                this.arraytotal = rep.data
                this.arraymodel.sort((a, b) => a.ano.localeCompare(b.ano))
                console.log('datos', this.arraymodel)     
                this.TRegistros.emit(this.totalregistros)        
            }
        }) 
    }

//
public GetsPlan(Planid:number):Observable<IPlan_Anos[]> {
        
    return  this.Gets().pipe(
         map((resp: ModelResponse) => {
             
             let apiraciones:IPlan_Anos[] = resp.data; // Store the fetched aspirations in the local array
             console.log({'los anos del plan':resp,id:Planid,aspiracion:apiraciones})
             this.TRegistros.emit(this.totalregistros);
             return apiraciones.filter(a => a.planExtrategicoId === Planid);
         })
     )
 }

    public Gets():Observable<ModelResponse> {
        console.log(this.rutaapi)
        return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }

    public Get(id:string):Observable<IPlan_Anos> {
        return this.datos.getbyid<IPlan_Anos>(this.rutaapi+`/${id}`)
    }

    public GetCount():Observable<number> {
        return this.datos.getdatoscount(this.rutaapi+`/count`)
    }

    public insert(obj:IPlan_Anos):Observable<IPlan_Anos> {  
        console.log('llego a insert en plan años', obj)
        return this.datos.insertardatos<IPlan_Anos>(this.rutaapi, obj)
    }

    public Update(obj:IPlan_Anos):Observable<IPlan_Anos> {
        return this.datos.updatedatos<IPlan_Anos>(this.rutaapi+`/${obj.id}`, obj)
    }

    public async grabar(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (this.model.id == 0) {
                await firstValueFrom(this.insert(this.model)).then(
                    (rep: IPlan_Anos) => {
                        console.log(rep)
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
                console.log(this.model)
                await firstValueFrom(this.Update(this.model)).then(
                    (rep: IPlan_Anos) => {
                        console.log('se actualizo el plan año:', rep)
                        let m = this.arraymodel.find(x => x.id == this.model.id)
                        if (m != undefined) {
                            m.id = this.model.id
                            m.planExtrategicoId = this.model.planExtrategicoId
                            m.ano = this.model.ano
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