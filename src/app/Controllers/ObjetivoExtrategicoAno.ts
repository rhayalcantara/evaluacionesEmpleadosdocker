import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IObjetivoExtrategicoAno } from '../Models/PlanExtrategico/IPlanExtrategico';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class ObjetivoExtrategicoAno {
    rutaapi:string =this.datos.URL+'/api/ObjetivoExtrategicoAnoes'
    titulomensage:string='Objetivo Extrategico Ano'
  
    public model:IObjetivoExtrategicoAno=this.inicializamodelo()
    titulos=[
      {descripcion:'Objetivo Extrategico Ano'}
    ]
    
    public estado:string='`'
    public totalregistros:number=0
    public actualpage:number=1
    public pagesize:number=10
    public filtro:string=''
    public arraymodel:IObjetivoExtrategicoAno[]=[]
    public arraytotal:IObjetivoExtrategicoAno[]=[]
    public operationSuccessful: boolean = false;
    @Output() TRegistros = new EventEmitter<number>();
   
    constructor(
      private datos:DatosServiceService
    ){}

    ngOnInit(): void {
        this.filtro=""
        this.estado=""
        this.actualpage=1
        this.pagesize=10
        this.getdatos()
    }

    public inicializamodelo():IObjetivoExtrategicoAno{
      return {
        id: 0,
        objetivoExtrategicoId: 0,
        descripcion:'',
        plan_AnosId: 0,
        porcientovalor: "",
        valor: 0,
        inverso: false,
        logro: 0,
        objetivoEstrategico: {
          id: 0,
          perspectivaId: 0,
          descripcion: "",
          perspectiva: {
            id: 0,
            planExtrategicoModelId: 0,
            nombre: '',
            peso: 0
          }
        },
        planano: {
          id: 0,
          planExtrategicoId: 0,
          ano: ""
        }
      }
    }

    public getdatos(){
      this.Gets().subscribe({
        next:(rep:ModelResponse)=>{
          this.totalregistros = rep.count
          this.pagesize=rep.count
          this.arraymodel=[]
          this.arraytotal=[]
          this.arraymodel=rep.data   
          this.arraytotal=rep.data
          this.TRegistros.emit(this.totalregistros)        
        }
      }) 
    }
    public insertarray(objeAnos:IObjetivoExtrategicoAno[]):Observable<IObjetivoExtrategicoAno[]>{
      return this.datos.insertardatos<IObjetivoExtrategicoAno[]>(this.rutaapi+`/bulk`,objeAnos)
    }
    public GetByObjivo(objetivoExtrategicoId: number): Observable<IObjetivoExtrategicoAno[]> {
     return  this.Gets().pipe( 
        // devuelve los objetivosextrategicosanos que tenga el objetivoextrategicoid==objetivoExtrategicoId
         map((rep:ModelResponse) => {
          
          let oea:IObjetivoExtrategicoAno[] = rep.data;
          return oea.filter(item => item.objetivoExtrategicoId === objetivoExtrategicoId);
         })
      )
    }

    public Gets():Observable<ModelResponse> {
      return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }
  
    public Get(id:string):Observable<IObjetivoExtrategicoAno>{
      return this.datos.getbyid<IObjetivoExtrategicoAno>(this.rutaapi+`/${id}`)
    }

    public GetCount():Observable<number>{
      return this.datos.getdatoscount(this.rutaapi+`/count`)
    }
  
    public insert(obj:IObjetivoExtrategicoAno):Observable<IObjetivoExtrategicoAno>{  
      return this.datos.insertardatos<IObjetivoExtrategicoAno>(this.rutaapi, obj); 
    }
  
    public Update(obj:IObjetivoExtrategicoAno):Observable<IObjetivoExtrategicoAno>{
      return this.datos.updatedatos<IObjetivoExtrategicoAno>(this.rutaapi+`/${obj.id}`,obj); 
    }
  
    public async grabar(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        if (this.model.id == 0) {
          await firstValueFrom(this.insert(this.model)).then(
            (rep: IObjetivoExtrategicoAno) => {
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
            (rep: IObjetivoExtrategicoAno) => {
              let m = this.arraymodel.find(x=>x.id==this.model.id)
              if (m!=undefined){
                Object.assign(m, this.model);
              }
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
