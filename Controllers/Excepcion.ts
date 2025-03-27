import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IExceptionDts } from '../Models/Excepcion/IExcepcion';
import { DatosServiceService } from '../Services/datos-service.service';
import { ModelResponse } from '../Models/Usuario/modelResponse';

@Injectable({
  providedIn: 'root'
})
export class Excepcion {
    rutaapi:string =this.datos.URL+'/api/Exceptions'
    titulomensage:string='Excepciones'
  
    
    public model:IExceptionDts=this.inicializamodelo()
   titulos=[
      {tipo:'Tipo'},
      {nombreempleado:'Nombre Empleado'},
      {detalles:'Detalle'},
      {fecha:'Fecha'},
      {activa:'Activa'}
   ]
   public estado:string='`'
   public totalregistros:number=0
   public actualpage:number=1
   public pagesize:number=10
   public filtro:string=''
   public arraymodel:IExceptionDts[]=[]
   public arraytotal:IExceptionDts[]=[]
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
    public inicializamodelo():IExceptionDts{
      return {
        id:0,
        tipo:"",
        empleadoSecuencial:0,
        detalles:"",
        fecha:"",
        activa:false,
        empleado: {
          secuencial: 0,
          codigousuario: "",
          nombreunido: "",
          identificacion: "",
          sdept: 0,
          departamento: "",
          codigoestado: "",
          scargo: 0,
          cargo: "",
          esjefatura: 0,
          tienejefe: 0,
          nivel: 0,
          fechapostulacion: "",
          jefeinmediatO_SECUENCIAL: 0,
          jefeinmediato: "",
          oficina: ""
        },
        nombreempleado:""
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
          //ordernar por nombre de empleado
          this.arraymodel.sort((a, b) => a.nombreempleado.localeCompare(b.nombreempleado))
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
  
  public Get(id:string):Observable<IExceptionDts>{
      return this.datos.getbyid<IExceptionDts>(this.rutaapi+`/${id}`)
  }
  public GetCount():Observable<number>{
      return this.datos.getdatoscount(this.rutaapi+`/count`)
  }
  
  public insert(obj:IExceptionDts):Observable<IExceptionDts>{  
    console.log('llego a insert en excepcion',obj)
  
    return this.datos.insertardatos<IExceptionDts>(this.rutaapi, obj ); 
  }
  
  public Update(obj:IExceptionDts):Observable<IExceptionDts>{
    
    return this.datos.updatedatos<IExceptionDts>(this.rutaapi+`/${obj.id}`,obj); 
  }
  
  public async grabar(): Promise<boolean> {
    // Envuelve el código en una nueva Promise
    console.log('llego excepcion a grabar',this.model)
    return new Promise<boolean>(async (resolve) => {
      if (this.model.id == 0) {
        // inserta el registro
        await firstValueFrom(this.insert(this.model)).then(
          (rep: IExceptionDts) => {
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
          (rep: IExceptionDts) => {
            console.log('se actualizo la excepcion:',rep)
          //  this.model = rep;
            let m = this.arraymodel.find(x=>x.id==this.model.id)
            if (m!=undefined){
              m.id = this.model.id
              m.tipo = this.model.tipo
              m.empleadoSecuencial = this.model.empleadoSecuencial
              m.detalles = this.model.detalles
              m.fecha = this.model.fecha
              m.activa = this.model.activa
              m.empleado = this.model.empleado
              m.nombreempleado = this.model.nombreempleado
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