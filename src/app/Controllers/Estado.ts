import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IEstado } from '../Models/Estado/IEstado';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class Estado {
    rutaapi:string =this.datos.URL+'/api/Estadoes'
    titulomensage:string='Estados'
  
    
    public model:IEstado=this.inicializamodelo()
   titulos=[
      
      {descripcion:'Estado'}
  
   ]
   public estado:string='`'
   public totalregistros:number=0
   public actualpage:number=1
   public pagesize:number=10
   public filtro:string=''
   public arraymodel:IEstado[]=[]
   public arraytotal:IEstado[]=[]
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
    public inicializamodelo():IEstado{
      return {
        id:0,
        descripcion:""        
     }
    }
    public  getdatos(){
     
      
       //// console.log('entro y llama a los datos')
  
       this.Gets().subscribe({next:(rep:ModelResponse)=>{
          // console.log('llegaron los datos datos',rep.count)
          //se obtiene los datos y se ponen en los array
          this.totalregistros =  rep.count
          this.pagesize=rep.count
          this.arraymodel=[]
          this.arraytotal=[]
          this.arraymodel=rep.data   
          this.arraytotal=rep.data
          //ordernar por nombre de puestos
          this.arraymodel.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
          // console.log('datos',this.arraymodel)     
          this.TRegistros.emit(this.totalregistros)        
  
          
       
        }
      }
      ) 
    }
    public Gets():Observable<ModelResponse> {
      // console.log(this.rutaapi)
      return this.datos.getdatos<ModelResponse>(this.rutaapi)
  }
  
  public Get(id:string):Observable<IEstado>{
      return this.datos.getbyid<IEstado>(this.rutaapi+`/${id}`)
  }
  public GetCount():Observable<number>{
      return this.datos.getdatoscount(this.rutaapi+`/count`)
  }
  
  public insert(obj:IEstado):Observable<IEstado>{  
    // console.log('llego a insert en produc',obj)
  
    return this.datos.insertardatos<IEstado>(this.rutaapi, obj ); 
  }
  
  public Update(obj:IEstado):Observable<IEstado>{
    
    return this.datos.updatedatos<IEstado>(this.rutaapi+`/${obj.id}`,obj); 
  }
  
  public async grabar(): Promise<boolean> {
    // Envuelve el código en una nueva Promise
    // console.log('llego producto a grabar',this.model)
    return new Promise<boolean>(async (resolve) => {
      if (this.model.id == 0) {
        // inserta el registro
        await firstValueFrom(this.insert(this.model)).then(
          (rep: IEstado) => {
            // console.log(rep)
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
        // console.log(this.model)
        await firstValueFrom(this.Update(this.model)).then(
          (rep: IEstado) => {
            // console.log('se actualizo la zona:',rep)
          //  this.model = rep;
            let m = this.arraymodel.find(x=>x.id==this.model.id)
            if (m!=undefined){
              m.id = this.model.id
              m.descripcion = this.model.descripcion
              
              
            }
  
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