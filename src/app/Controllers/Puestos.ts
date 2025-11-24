import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { IPuesto } from "../Models/Puesto/IPuesto";
import { firstValueFrom } from "rxjs";



@Injectable({
    providedIn: 'root'
  })

export class Puestos implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Positions'
  titulomensage:string='Puestos'

  
  public model:IPuesto=this.inicializamodelo()
 titulos=[
    
    {descripcion:'Nombre'},
    {departamento:'Departamento'}

 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=10
 public filtro:string=''
 public arraymodel:IPuesto[]=[]
 public arraytotal:IPuesto[]=[]
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
  public inicializamodelo():IPuesto{
    return {
      secuencial:0,
      descripcion:'',
      departmentSecuencial:0,
      departamento:"",
      categoriaPuestoId:0
   }
  }
  public  getdatos(){
 
    

     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        this.pagesize=rep.count
        this.arraymodel=[]
        this.arraytotal=[]
        this.arraymodel=rep.data   
        this.arraytotal=rep.data
        //ordernar por nombre de puestos
        this.arraymodel.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
        this.TRegistros.emit(this.totalregistros)        

      
     
      }
    }
    ) 
  }
  public Gets():Observable<ModelResponse> {
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<IPuesto>{
    return this.datos.getbyid<IPuesto>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{
    return this.datos.getdatoscount(this.rutaapi+`/count`)
}

public insert(obj:IPuesto):Observable<IPuesto>{  

  return this.datos.insertardatos<IPuesto>(this.rutaapi, obj ); 
}

public Update(obj:IPuesto):Observable<IPuesto>{
  return this.datos.updatedatos<IPuesto>(this.rutaapi+`/${obj.secuencial}`,obj); 
}

public async grabar(): Promise<boolean> {
  // Envuelve el código en una nueva Promise
  return new Promise<boolean>(async (resolve) => {
    if (this.model.secuencial == 0) {
      // inserta el registro
      await firstValueFrom(this.insert(this.model)).then(
        (rep: IPuesto) => {
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
        (rep: IPuesto) => {
        //  this.model = rep;
          let m = this.arraymodel.find(x=>x.secuencial==this.model.secuencial)
          if (m!=undefined){
            m.secuencial = this.model.secuencial
            m.descripcion = this.model.descripcion
            m.departmentSecuencial=this.model.departmentSecuencial
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
