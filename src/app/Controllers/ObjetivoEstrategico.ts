import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IObjetivoEstrategico } from '../Models/PlanExtrategico/IPlanExtrategico';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class ObjetivoEstrategico {
    rutaapi:string =this.datos.URL+'/api/ObjetivoEstrategicoes'
    titulomensage:string='Objetivo Estrategico'
  
    public model:IObjetivoEstrategico=this.inicializamodelo()
    titulos=[
      {descripcion:'Objetivo Estrategico'}
    ]
    public estado:string='`'
    public totalregistros:number=0
    public actualpage:number=1
    public pagesize:number=10
    public filtro:string=''
    public arraymodel:IObjetivoEstrategico[]=[]
    public arraytotal:IObjetivoEstrategico[]=[]
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

    public inicializamodelo():IObjetivoEstrategico{
      let rep:IObjetivoEstrategico = {
        id: 0,
        perspectivaId: 0,
        descripcion: '',
        perspectiva:{
          id: 0,
          planExtrategicoModelId: 0,
          nombre: '',
          peso: 0
        }
      };

        return rep
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
          this.arraymodel.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
          this.TRegistros.emit(this.totalregistros)        
        }
      }) 
    }

    public Gets():Observable<ModelResponse> {
      return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }
  
    public Get(id:string):Observable<IObjetivoEstrategico>{
      return this.datos.getbyid<IObjetivoEstrategico>(this.rutaapi+`/${id}`)
    }

    public GetCount():Observable<number>{
      return this.datos.getdatoscount(this.rutaapi+`/count`)
    }
  
    public insert(obj:IObjetivoEstrategico):Observable<IObjetivoEstrategico>{  
      return this.datos.insertardatos<IObjetivoEstrategico>(this.rutaapi, obj); 
    }
  
    public Update(obj:IObjetivoEstrategico):Observable<IObjetivoEstrategico>{
      return this.datos.updatedatos<IObjetivoEstrategico>(this.rutaapi+`/${obj.id}`,obj); 
    }
  
    public async grabar(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        if (this.model.id == 0) {
          await firstValueFrom(this.insert(this.model)).then(
            (rep: IObjetivoEstrategico) => {
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
            (rep: IObjetivoEstrategico) => {
              let m = this.arraymodel.find(x=>x.id==this.model.id)
              if (m!=undefined){
                m.id = this.model.id
                m.perspectivaId = this.model.perspectivaId
                m.descripcion = this.model.descripcion
                m.perspectiva = this.model.perspectiva
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
