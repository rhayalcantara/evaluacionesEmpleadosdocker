import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { IDepartamento } from "../Models/Departamento/IDepartamento";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";



@Injectable({
    providedIn: 'root'
  })

export class Departamento implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Departments'
  titulomensage:string='Departamentos'

  
  public model:IDepartamento=this.inicializamodelo()
 titulos=[
    
    {nombre:'Nombre'}
 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=600
 public filtro:string=''
 public arraymodel:IDepartamento[]=[]

 public operationSuccessful: boolean = false;
 @Output() TRegistros = new EventEmitter<number>();
 
 constructor(
  private datos:DatosServiceService,
                  
 ){}
    ngOnInit(): void {
      this.filtro=""
      this.estado=""
      this.actualpage=1
      this.pagesize=600
      this.getdatos()
  }
  public inicializamodelo():IDepartamento{
    return {
      secuencial:0,
      nombre:''
   }
  }
  public  getdatos(){

    


     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        this.pagesize=rep.count
        this.arraymodel=[]
        this.arraymodel=rep.data    
        //ordena los datos por nombre alfabeticamente
        this.arraymodel.sort((a, b) => a.nombre.localeCompare(b.nombre));

        this.TRegistros.emit(this.totalregistros)      

        //dialogRef.close()
     
      }
    }
    ) 
  }
  public Gets():Observable<ModelResponse> {
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<IDepartamento>{
return this.datos.getbyid<IDepartamento>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{

return this.datos.getdatoscount(this.rutaapi+`/count`)
}

}
