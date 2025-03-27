import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { ExcelService } from "../Services/excel.service";
import { DatosServiceService } from "../Services/datos-service.service";
import { MatDialog } from "@angular/material/dialog";
import { IUsuario } from "../Models/Usuario/Iusuario";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { Observable } from "rxjs/internal/Observable";
import { LoadingComponent } from "../Views/Components/loading/loading.component";

@Injectable({
    providedIn: 'root'
  })

export class Usuario implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Usuarios'
  titulomensage:string='Usuarios'

  
  public model:IUsuario=this.inicializamodelo()
 titulos=[
    {usuario:'Codigo'},
    {nombres:'Nombre'},
    {email:'Email'},
 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=600
 public filtro:string=''
 public arraymodel:IUsuario[]=[]

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
      this.pagesize=600
      this.getdatos()
  }
  public inicializamodelo():IUsuario{
    return {
      usuario:'',
      nombres:'',
      email:''
   }
  }
  public  getdatos(){
    
      const dialogRef = this.toastr.open(LoadingComponent, {
       width: '340px',
       height: '180px', 
     }); 
    
    

     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        console.log('datos',rep)
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        this.pagesize=rep.count
        this.arraymodel=[]
        this.arraymodel=rep.data    
        console.log('datos',this.arraymodel)     
        this.TRegistros.emit(this.totalregistros)        
        


      dialogRef.close()
     
      }
    }
    ) 
  }
  public Gets():Observable<ModelResponse> {
    
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<IUsuario>{
return this.datos.getbyid<IUsuario>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{

return this.datos.getdatoscount(this.rutaapi+`/count`)
}

}