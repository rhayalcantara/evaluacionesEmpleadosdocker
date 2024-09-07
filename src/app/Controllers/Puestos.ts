import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { MatDialog } from "@angular/material/dialog";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { LoadingComponent } from "../Views/Components/loading/loading.component";
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
  private datos:DatosServiceService,
  private toastr: MatDialog
                  
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
      departmentsecuencial:0,
      departamento:""
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
        this.arraymodel.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
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

public Get(id:string):Observable<IPuesto>{
    return this.datos.getbyid<IPuesto>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{
    return this.datos.getdatoscount(this.rutaapi+`/count`)
}

public insert(obj:IPuesto):Observable<IPuesto>{  
  console.log('llego a insert en produc',obj)

  return this.datos.insertardatos<IPuesto>(this.rutaapi, obj ); 
}

public Update(obj:IPuesto):Observable<IPuesto>{
  console.log(this.rutaapi+`/${obj.secuencial}`,obj)
  return this.datos.updatedatos<IPuesto>(this.rutaapi+`/${obj.secuencial}`,obj); 
}

public async grabar(): Promise<boolean> {
  // Envuelve el código en una nueva Promise
  //console.log('llego producto a grabar',this.model,this.zs.arraymodel)
  return new Promise<boolean>(async (resolve) => {
    if (this.model.secuencial == 0) {
      // inserta el registro
      await firstValueFrom(this.insert(this.model)).then(
        (rep: IPuesto) => {
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
        (rep: IPuesto) => {
          console.log('se actualizo la zona:',rep)
        //  this.model = rep;
          let m = this.arraymodel.find(x=>x.secuencial==this.model.secuencial)
          if (m!=undefined){
            m.secuencial = this.model.secuencial
            m.descripcion = this.model.descripcion
            m.departmentsecuencial=this.model.departmentsecuencial
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