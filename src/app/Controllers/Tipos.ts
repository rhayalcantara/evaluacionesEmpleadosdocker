import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { DatosServiceService } from '../Services/datos-service.service';
import { ITipo } from '../Models/Tipo/ITipo';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { firstValueFrom, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class Tipos implements OnInit{
 
  rutaapi:string =this.datosServiceService.URL+'/api/Tipos'
  titulomensage:string='Tipo Evaluacion'

  
  public model:ITipo=this.inicializamodelo()
 titulos=[
    {descripcion:'Tipo'}
 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=10
 public filtro:string=''
 public arraymodel:ITipo[]=[]

 public operationSuccessful: boolean = false;
 @Output() TRegistros = new EventEmitter<number>();
  constructor(
      private datosServiceService: DatosServiceService) { 
    
  }

  inicializamodelo(): ITipo {
   let tipo:ITipo={
     id: 0,
     descripcion: ''
   }
   return tipo
  }
  ngOnInit(): void {
    this.filtro=""
    this.estado=""
    this.actualpage=1
    this.pagesize=600
    this.getdatos()
}
  getdatos() {
   
    this.Gets()        
      .subscribe({        
     next:(rep:ModelResponse)=>{
       
       this.totalregistros =  rep.count
       this.arraymodel=[]
       this.arraymodel=rep.data    
       console.log(rep.data)
       this.TRegistros.emit(this.totalregistros)        
       
    
     }
   }
   ) 
  }

  public Gets():Observable<ModelResponse> {    
    return this.datosServiceService
          .getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<ITipo>{
  return this.datosServiceService
        .getbyid<ITipo>(this.rutaapi+`/${id}`)
}

public insert(obj:ITipo):Observable<ITipo>{  
  console.log('llego a insert en produc',obj)

  return this.datosServiceService.insertardatos<ITipo>(this.rutaapi, obj ); 
}

public Update(obj:ITipo):Observable<ITipo>{
  console.log(this.rutaapi+`/${obj.id}`,obj)
  return this.datosServiceService.updatedatos<ITipo>(this.rutaapi+`/${obj.id}`,obj); 
}

public async grabar(): Promise<boolean> {
  // Envuelve el código en una nueva Promise
  //console.log('llego producto a grabar',this.model,this.zs.arraymodel)
  return new Promise<boolean>(async (resolve) => {
    if (this.model.id == 0) {
      // inserta el registro
      await firstValueFrom(this.insert(this.model)).then(
        (rep: ITipo) => {
          console.log(rep)
          this.model = rep;

          this.datosServiceService.showMessage('Registro Insertado Correctamente', this.titulomensage, "success");                
          resolve(true); // Devuelve true si la operación fue exitosa
        },
        (err: Error) => {
          this.datosServiceService.showMessage('Error:' + err.message, this.titulomensage, 'error');
          resolve(false); // Devuelve false si la operación falló
        }
      );
    } else {
      // actualiza el registro
      console.log(this.model)
      await firstValueFrom(this.Update(this.model)).then(
        (rep: ITipo) => {
          console.log('se actualizo la zona:',rep)
     
          this.TRegistros.emit(this.totalregistros)

          resolve(true); // Devuelve true si la operación fue exitosa
        },
        (err: Error) => {
          this.datosServiceService.showMessage('Error:' + err.message, this.titulomensage, 'error');
          resolve(false); // Devuelve false si la operación falló
        }
      );
    }
   

  });
}
}