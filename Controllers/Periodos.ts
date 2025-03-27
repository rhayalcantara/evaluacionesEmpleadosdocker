import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ExcelService } from "../Services/excel.service";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, Observable } from 'rxjs';
import { Meta } from "@angular/platform-browser";
import { IPeriodo, IPeriodo_Dts } from "../Models/Periodos/IPeriodo";






@Injectable({
    providedIn: 'root'
  })

  export class Periodos implements OnInit{
      
      rutaapi:string = this.datos.URL+'/api/Periods'
      titulomensage:string='Periodos'
      
       public model:IPeriodo = this.inicializamodelo()
       public titulos=[{descripcion:'Descripcion'},{fechaInicio:'Fechainicio'},{fechaFin:'Fechafin'},{activa:'Activa'}]
       public estado:string='`'
       public totalregistros:number=0
       public actualpage:number=1
       public pagesize:number=10
       public filtro:string=''
       public arraymodel:IPeriodo[]=[]
       
       public operationSuccessful: boolean = false;
       @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos:DatosServiceService,
        public datosMeta:Meta
        
                        
       ){}
    ngOnInit(): void {
        this.filtro=""
        this.estado=""
        this.actualpage=1
        this.pagesize=10
        this.getdatos()
    }

  
    public inicializamodelo():IPeriodo{
      return {
        id:0,
        descripcion:'',
        fechaInicio:new Date(),
        fechaFin:new Date(),
        activa:true, 
        estadoid:0
      } 
      
    }
    public InicializaModeloDTS():IPeriodo_Dts{
      let p:IPeriodo_Dts={
        estado: {
          id: 0,
          descripcion: ""
        },
        goals: [],
        id: 0,
        descripcion: "",
        fechaInicio: new Date(),
        fechaFin: new Date(),
        activa: false,
        estadoid: 0
      }
      return p;
    } 
    public  getdatos(){
  

    
         this.Gets()        
           .subscribe({        
          next:(rep:ModelResponse)=>{
            console.log('zonas',rep)
            this.totalregistros =  rep.count
            this.arraymodel=[]
            this.arraymodel=rep.data    
                
            this.TRegistros.emit(this.totalregistros)        
            
  
  
 
         
          }
        }
        ) 
    }

    public filtrar(){
        this.Gets().subscribe(
                        (m:ModelResponse)=>{
                          console.log(m)
                          this.totalregistros =  m.count
                          this.TRegistros.emit(this.totalregistros)        
                          
                          this.arraymodel=[]
                          this.arraymodel=m.data
                        }
                      )
          
    }
    
    

      public Gets():Observable<ModelResponse> {
        return this.datos.getdatos<ModelResponse>( this.rutaapi)
      }
  
      public Get(id:string):Observable<IPeriodo>{
          return this.datos.getbyid<IPeriodo>(this.rutaapi+`/${id}`)
      }
      public GetActivo():Observable<IPeriodo_Dts>{
        return this.datos.getbyid<IPeriodo_Dts>(this.rutaapi+`/activo`)
    }

      public GetCount():Observable<number>{
        
        return this.datos.getdatoscount(this.rutaapi+`/count`)
      }
  
      public insert(obj:IPeriodo):Observable<IPeriodo>{  
        console.log("el objeto",obj)
        return this.datos.insertardatos<IPeriodo>(this.rutaapi, obj ); 
      }
      public Update(obj:IPeriodo):Observable<IPeriodo>{
        console.log('llego a grabar',obj)
        return this.datos.updatedatos<IPeriodo>(this.rutaapi+`/${obj.id}`,obj); 
      }
  
      public Reporte(){}
      
      public exportexcel(){}
              
      public async grabar(): Promise<boolean> {
        // Envuelve el código en una nueva Promise
        //console.log('llego producto a grabar',this.model,this.zs.arraymodel)
        return new Promise<boolean>(async (resolve) => {
          if (this.model.id == 0) {
            // inserta el registro
            await firstValueFrom(this.insert(this.model)).then(
              (rep: IPeriodo) => {
   
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
              (rep: IPeriodo) => {
                
                this.model = rep;
            
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
