import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { firstValueFrom } from "rxjs";
import { IRol } from "../Models/Rol/IRol";



@Injectable({
    providedIn: 'root'
  })

export class Roles implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Rols'
  titulomensage:string='Roles'

  
  public model:IRol=this.inicializamodelo()
 titulos=[
    
    {name:'Rol'}

 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=10
 public filtro:string=''
 public arraymodel:IRol[]=[]
 public arraytotal:IRol[]=[]
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
  public inicializamodelo():IRol{
    return {
      id:0,
      name:"",
      nivel:0
   }
  }
  public  getdatos(){
   
    
     //console.log('entro y llama a los datos')

     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        console.log('llegaron los datos datos',rep.count)
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        this.pagesize=rep.count
        this.arraymodel=[]
        this.arraytotal=[]
        this.arraymodel=rep.data   
        this.arraytotal=rep.data
        //ordernar por nombre de puestos
        this.arraymodel.sort((a, b) => a.name.localeCompare(b.name))
        console.log('datos',this.arraymodel)     
        this.TRegistros.emit(this.totalregistros)        

        
     
      }
    }
    ) 
  }
  public Gets():Observable<ModelResponse> {
    console.log(this.rutaapi)
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<IRol>{
    return this.datos.getbyid<IRol>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{
    return this.datos.getdatoscount(this.rutaapi+`/count`)
}

public insert(obj:IRol):Observable<IRol>{  
  console.log('llego a insert en produc',obj)

  return this.datos.insertardatos<IRol>(this.rutaapi, obj ); 
}

public Update(obj:IRol):Observable<IRol>{
  
  return this.datos.updatedatos<IRol>(this.rutaapi+`/${obj.id}`,obj); 
}

public async grabar(): Promise<boolean> {
  // Envuelve el código en una nueva Promise
  console.log('llego producto a grabar',this.model)
  return new Promise<boolean>(async (resolve) => {
    if (this.model.id == 0) {
      // inserta el registro
      await firstValueFrom(this.insert(this.model)).then(
        (rep: IRol) => {
          console.log(rep)
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
      console.log(this.model)
      await firstValueFrom(this.Update(this.model)).then(
        (rep: IRol) => {
          console.log('se actualizo la zona:',rep)
        //  this.model = rep;
          let m = this.arraymodel.find(x=>x.id==this.model.id)
          if (m!=undefined){
            m.id = this.model.id
            m.name = this.model.name
            m.nivel = this.model.nivel
            
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