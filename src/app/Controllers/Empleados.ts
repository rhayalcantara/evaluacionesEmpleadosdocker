import { EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { DatosServiceService } from '../Services/datos-service.service';
import { IEmpleado } from '../Models/Empleado/IEmpleado';
import { ModelResponse } from '../Models/Usuario/modelResponse';
import { Observable } from 'rxjs';
import { IPuesto } from '../Models/Puesto/IPuesto';
import { UtilsService } from '../Helpers/utils.service';
import { IPeriodo } from '../Models/Periodos/IPeriodo';

@Injectable({
  providedIn: 'root'
})
export class Empleados implements OnInit{
  rutaapi:string =this.datos.URL+'/api/Empleadoes'
  titulomensage:string='Empleados'
  public arraytotal:IEmpleado[]=[];
  public arraypuestossub:IPuesto[]=[]
  public arrayempleadosactivos:IEmpleado[]=[]
  
  public model:IEmpleado=this.inicializamodelo()
 titulos=[
    {secuencial:'Codigo'},
    {fechapostulacion:'Ingreso'},
    {codigousuario:'Usuario'},
    {identificacion:'Cedula'},
    {nombreunido:'Nombres/Apellidos'},
    {departamento:'Departamento'},
    {cargo:'Puesto'},
    {codigoestado:'Estatus'},
    {nivel:'Nivel'},
    {jefeinmediato:'Jefe Inmediato'},
    {oficina:'Oficina'}
 ]
 public estado:string='`'
 public totalregistros:number=0
 public actualpage:number=1
 public pagesize:number=5
 public filtro:string=''
 public arraymodel:IEmpleado[]=[]
 public arraymodelsubordinados:IEmpleado[]=[]

 public operationSuccessful: boolean = false;
 @Output() TRegistros = new EventEmitter<number>();
 
 constructor(
  private datos:DatosServiceService,
  //private toastr: MatDialog
                  
 ){}
    ngOnInit(): void {

      this.filtro=""
      this.estado=""
      this.actualpage=1
      this.pagesize=5
      //this.getdatos()
      
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
      nivel: 0,
      fechapostulacion:"",
      jefeinmediatO_SECUENCIAL:0,
      jefeinmediato:'',
      oficina:''

   }
  }
  public  getdatos(){
      //// console.log('entro y llama a cargando')

     //// console.log('entro y llama a los datos')

     this.arraymodel=[]
     this.arraymodelsubordinados=[]
     this.Gets().subscribe({next:(rep:ModelResponse)=>{
        //// console.log('llegaron los datos datos',rep.count)
        //se obtiene los datos y se ponen en los array
        this.totalregistros =  rep.count
        //this.pagesize=rep.count
        this.arraymodel=[]
        this.arraytotal=[];
        this.arraymodel=rep.data //.filter((x:IEmpleado) => x.codigoestado === "A");
        this.arraytotal=rep.data
        this.arrayempleadosactivos=[];
        //filtrar los que estan activos
        this.arrayempleadosactivos=this.arraymodel
        .filter(x=>x.codigoestado=="A")
        // this.arraymodel = this.arraymodel.filter(x => x.codigoestado === "A");
        //ordena los datos por nombre alfabeticamente
        if (this.arraymodel){
          this.arraymodel.sort((a, b) => a.nombreunido.localeCompare(b.nombreunido));
        }
        

        //// console.log('datos',this.arraymodel)     
        this.TRegistros.emit(this.totalregistros)      

        //dialogRef.close()
     
      }
    }
    ) 
  }
  public  getsubordinados(periodo:IPeriodo){
    this.arraymodelsubordinados=[]
    if (this.model.secuencial==0){
      return
    }
    this.arraypuestossub=[];
    let fecha:Date =new Date(periodo.fechaFin)

   this.Getsub(this.model.secuencial.toString(),UtilsService.formatDateForInput(fecha.toDateString())).subscribe({next:(rep:ModelResponse)=>{
      //// console.log('llegaron los datos ',rep.count)
      //se obtiene los datos y se ponen en los array
      this.arraymodelsubordinados=rep.data 
      //// console.log('Subordinates data received:', rep.data);
      //llena los puestos
      this.arraymodelsubordinados.map((x:IEmpleado)=>{
         this.datos.getbyid<IPuesto>(this.datos.URL+`/api/Positions/${x.scargo}`).subscribe((puesto:IPuesto)=>{
            this.arraypuestossub.push(puesto);
           // // console.log('emmpleados subpueto',this.arraypuestossub)
         })
      })
      
    }
  }
  ) 
}
  public Gets():Observable<ModelResponse> {
    // console.log(this.rutaapi)
    return this.datos.getdatos<ModelResponse>(this.rutaapi)
}
public Getsub(empleado_secuencial:string,fechaconsulta:string):Observable<ModelResponse> {
 //// console.log(this.rutaapi+`/equipo/?JEFEINMEDIATO_SECUENCIAL=${empleado_secuencial}&fechaconsulta=${fechaconsulta}`)

  return this.datos.getdatos<ModelResponse>(this.rutaapi+`/equipo/?JEFEINMEDIATO_SECUENCIAL=${empleado_secuencial}&fechaconsulta=${fechaconsulta}`)
}
public Get(id:string):Observable<IEmpleado>{
  return this.datos.getbyid<IEmpleado>(this.rutaapi+`/${id}`)
}
public GetByCedula(Cedula:string){
  return this.datos.getbyid<IEmpleado>(this.rutaapi+`/empcedu/${Cedula}`)
}
public GetByUsuario(Usuario:string){
  return this.datos.getbyid<IEmpleado>(this.rutaapi+`/empuser/${Usuario}`)
}

public GetCount():Observable<number>{

return this.datos.getdatoscount(this.rutaapi+`/count`)
}

}