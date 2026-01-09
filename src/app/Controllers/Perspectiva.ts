import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { IPerspectiva } from '../Models/Perspectiva/IPerspectiva';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class Perspectiva {
    rutaapi:string =this.datos.URL+'/api/Perspectivas'
    titulomensage:string='Perspectivas'
  
    public model:IPerspectiva=this.inicializamodelo()
    titulos=[
      {nombre:'Nombre'},
      {peso:'Peso'}
    ]
    
    public estado:string='`'
    public totalregistros:number=0
    public actualpage:number=1
    public pagesize:number=10
    public filtro:string=''
    public arraymodel:IPerspectiva[]=[]
    public arraytotal:IPerspectiva[]=[]
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

    public inicializamodelo():IPerspectiva{
      return {
        id: 0,
        nombre: "",
        planExtrategicoModelId:0,
        peso: 0
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
          //ordernar por nombre
          /*if(this.arraymodel.length>0){
            this.arraymodel.sort((a, b) => a.name.localeCompare(b.name))
          }*/
          
          this.TRegistros.emit(this.totalregistros)        
        }
      }) 
    }

    public GetsPlan(Planid:number):Observable<IPerspectiva[]> {
        
      return  this.Gets().pipe(
           map((resp: ModelResponse) => {
               let apiraciones:IPerspectiva[] = resp.data; // Store the fetched aspirations in the local array
               return apiraciones.filter(a => a.planExtrategicoModelId === Planid);
           })
       )
   }


    public Gets():Observable<ModelResponse> {
      return this.datos.getdatos<ModelResponse>(this.rutaapi)
    }
  
    public Get(id:string):Observable<IPerspectiva>{
      return this.datos.getbyid<IPerspectiva>(this.rutaapi+`/${id}`)
    }

    public GetCount():Observable<number>{
      return this.datos.getdatoscount(this.rutaapi+`/count`)
    }
  
    public insert(obj:IPerspectiva):Observable<IPerspectiva>{  
      return this.datos.insertardatos<IPerspectiva>(this.rutaapi, obj); 
    }
  
    public Update(obj:IPerspectiva):Observable<IPerspectiva>{
      return this.datos.updatedatos<IPerspectiva>(this.rutaapi+`/${obj.id}`,obj); 
    }
  
    public async grabar(): Promise<boolean> {
      return new Promise<boolean>(async (resolve) => {
        if (this.model.id == 0) {
          // inserta el registro
          await firstValueFrom(this.insert(this.model)).then(
            (rep: IPerspectiva) => {
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
          // actualiza el registro
          await firstValueFrom(this.Update(this.model)).then(
            (rep: IPerspectiva) => {
              let m = this.arraymodel.find(x=>x.id==this.model.id)
              if (m!=undefined){
                m.id = this.model.id
                m.nombre = this.model.nombre
                m.peso = this.model.peso
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
