import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { DatosServiceService } from '../Services/datos-service.service';
import { IEmpleado } from '../Models/Empleado/IEmpleado';
import { MatDialog } from '@angular/material/dialog';
import { LoadingComponent } from '../Views/Components/loading/loading.component';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Empleados implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Empleadoes'
  titulomensage:string='Empleados'
  public arraytotal:IEmpleado[]=[];
  
  public model:IEmpleado=this.inicializamodelo()
 titulos=[
    {secuencial:'Codigo'},
    {codigousuario:'Usuario'},
    {identificacion:'Cedula'},
    {nombreunido:'Nombres/Apellidos'},
    {departamento:'Departamento'},
    {cargo:'Puesto'},
    {codigoestado:'Estatus'},
    {nivel:'Nivel'}
 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=600
 public filtro:string=''
 public arraymodel:IEmpleado[]=[]

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
  public inicializamodelo():IEmpleado{
  
    return {
      secuencial: 0,
      codigousuario: '',
      nombreunido: '',
      identificacion: '',
      sdept: 0,
      departamento: '',
      codigoestado: '',
      scargo: 0,
      cargo: '',
      esjefatura: 0,
      tienejefe: 0,
      nivel: 0
   }
  }
  public  getdatos(){
      //console.log('entro y llama a cargando')
      const dialogRef = this.toastr.open(LoadingComponent, {
       width: '340px',
       height: '180px', 
     }); 
    
     //console.log('entro y llama a los datos')


     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        console.log('llegaron los datos datos',rep.count)
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        this.pagesize=rep.count
        this.arraymodel=[]
        this.arraytotal=[];
        this.arraymodel=rep.data //.filter((x:IEmpleado) => x.codigoestado === "A");
        this.arraytotal=rep.data
        //filtrar los que estan activos
        // this.arraymodel = this.arraymodel.filter(x => x.codigoestado === "A");
        //ordena los datos por nombre alfabeticamente
        this.arraymodel.sort((a, b) => a.nombreunido.localeCompare(b.nombreunido));

        console.log('datos',this.arraymodel)     
        this.TRegistros.emit(this.totalregistros)      

        dialogRef.close()
     
      }
    }
    ) 
  }
  public Gets():Observable<ModelResponse> {
    console.log(this.rutaapi)
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}

public Get(id:string):Observable<IEmpleado>{
  return this.datos.getbyid<IEmpleado>(this.rutaapi+`/${id}`)
}
public GetCount():Observable<number>{

return this.datos.getdatoscount(this.rutaapi+`/count`)
}

}