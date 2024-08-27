import { EventEmitter, Injectable, OnInit, Output } from "@angular/core";
import { DatosServiceService } from "../Services/datos-service.service";
import { ExcelService } from "../Services/excel.service";
import { MatDialog } from "@angular/material/dialog";
import { LoadingComponent } from "../Views/Components/loading/loading.component";
import { ModelResponse } from "../Models/Usuario/modelResponse";
import { firstValueFrom, Observable } from 'rxjs';
import { IMeta, IMetaDts } from "../Models/Meta/IMeta";
import { Meta } from "@angular/platform-browser";


@Injectable({
    providedIn: 'root'
  })

  export class Metas implements OnInit{

      rutaapi:string =this.datos.URL+'/api/Goals'
      titulomensage:string='Metas'      
       public model:IMeta = this.inicializamodelo()
       public titulos=[{periodo:'Periodo'},
                       {departamento:"Departamento"},
                       {puesto:"Puesto"},
                       {elTipos:"Tipo Evaluacion"},
                       {name:'Descripcion'},
                       {weight:'Peso'}]

       public estado:string='`'
       public totalregistros:number=0
       public actualpage:number=1
       public pagesize:number=10
       public filtro:string=''
       public arraymodel:IMeta[]=[]
       

       public operationSuccessful: boolean = false;
       @Output() TRegistros = new EventEmitter<number>();

    constructor(
        private datos:DatosServiceService,
        public datosMeta:Meta,
        private excel:ExcelService,
        private toastr: MatDialog,
        
                        
       ){}
    ngOnInit(): void {
        this.filtro=""
        this.estado=""
        this.actualpage=1
        this.pagesize=10
        this.getdatos()
    }

  
    public inicializamodeloDts():IMetaDts{

      return {
        id: 0,
        name: '',
        periodId:0,
        weight:1,
        positionSecuencial:0,
        tiposid:0,
        puesto:"",
        departamento:"",
        periodo:"",
        Tipo:""
      } 
      
    }
    public inicializamodelo():IMeta{

      return {
        id: 0,
        name: '',
        periodId:0,
        weight:1,
        positionSecuencial:0,
        tiposid:0
      } 
      
    }
    public  getdatos(){
  
          const dialogRef = this.toastr.open(LoadingComponent, {
           width: '340px',
           height: '180px', 

         }); 
    
         this.Gets()        
           .subscribe({        
          next:(rep:ModelResponse)=>{
            
            this.totalregistros =  rep.count
            this.arraymodel=[]
            this.arraymodel=rep.data    
            console.log(rep.data)
            this.TRegistros.emit(this.totalregistros)        
            
  
  
          dialogRef.close()
         
          }
        }
        ) 
    }

    public filtrar(){
        this.Gets().subscribe(
                        (m:ModelResponse)=>{
                         
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

  
      public Get(id:string):Observable<IMeta>{
          return this.datos.getbyid<IMeta>(this.rutaapi+`/${id}`)
      }
      public GetCount():Observable<number>{
        
        return this.datos.getdatoscount(this.rutaapi+`/count`)
      }
  
      public insert(obj:IMeta):Observable<IMeta>{  

        return this.datos.insertardatos<IMeta>(this.rutaapi, obj ); 
      }
      public Update(obj:IMeta):Observable<IMeta>{
        return this.datos.updatedatos<IMeta>(this.rutaapi+`/${obj.id}`,obj); 
      }
  
      public Reporte(){}
      
      public exportexcel(){}
              
      public async grabar(): Promise<boolean> {
        // Envuelve el código en una nueva Promise
        
        return new Promise<boolean>(async (resolve) => {
          if (this.model.id == 0) {
            // inserta el registro
            await firstValueFrom(this.insert(this.model)).then(
              (rep: IMeta) => {
   
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
              (rep: IMeta) => {
                
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
