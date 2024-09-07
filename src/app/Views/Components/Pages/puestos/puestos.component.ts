import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { Puestos } from 'src/app/Controllers/Puestos';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { FormPuestosComponent } from '../../Forms/form-puestos/form-puestos.component';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { Departamento } from 'src/app/Controllers/Departamento';

@Component({
  selector: 'app-puestos',
  standalone: true,
  imports: [FormsModule,TablesComponent,CommonModule,MatDialogModule],
  templateUrl: './puestos.component.html',
  styleUrls: ['./puestos.component.css']
})
export class PuestosComponent implements OnInit {
  constructor(
    public Puestos:Puestos,
    private ServiceComunicacion:ComunicacionService,
    private datos:DatosServiceService,
    private toastr: MatDialog,
    public departamentoService: Departamento
    ) { 
      // this.Puestos.getdatos()
      this.ServiceComunicacion.enviarMensajeObservable.subscribe({next:(mensaje:string)=>{
        console.log('Puestoss Construtor: '+mensaje)   
      
      }})
    }
 
  config:any
  public term: string='';
  departamentos: IDepartamento[] = [];
  selectedDepartamento: number | null = null;
  public campos:string[]=[]
  public tituloslocal:string[]=[]


  ngOnInit(): void {
    this.Puestos.getdatos()
    this.cargarDepartamentos();
    this.Puestos.TRegistros.subscribe({
     next:(rep:number)=>{
      console.log("evento#:",rep)
       this.config.totalItems=rep
       this.ServiceComunicacion.enviarMensaje(this.config)
     }
     
    })

    this.config = {
    id:'',
     itemsPerPage: 5,
     currentPage: 1,
     totalItems: this.Puestos.totalregistros
   };
    
     
     this.Puestos.titulos.map((x:string|any)=>{
       let nx:string = x[Object.keys(x)[0]]
       this.campos.push(...Object.keys(x))
       this.tituloslocal.push(nx)
     })
     
   }
   cargarDepartamentos() {
    this.departamentoService.getdatos()
    this.departamentos = this.departamentoService.arraymodel;
  }
  onDepartamentoChange(){
    this.filtrarPuestos();
    
  }
  filtrarPuestos() {
    console.log("cambio a:",this.selectedDepartamento)
    this.Puestos.arraymodel=this.Puestos.arraytotal
    if (this.selectedDepartamento) {
      this.Puestos.arraymodel = this.Puestos.arraymodel.filter(
        puesto => puesto.departmentsecuencial === this.selectedDepartamento
      );

    }       
    this.config.totalItems=this.Puestos.arraymodel.length
    this.ServiceComunicacion.enviarMensaje(this.config)
  }
  opcion(event:TableResponse){
    console.log(event)
    
    const acct:any ={
      edit:this.edita,
      del:this.delete
   }   
   
   const handler =  acct[event.option](event.key,this.Puestos,this.toastr)
   handler.then((rep:IPuesto)=>{
    /*
    if(rep!=null){
      let m:IPuesto = this.Puestos.arraymodel.find(x=>x.secuencial==rep.secuencial) as IPuesto
      let m2:IPuesto =this.Puestos.arraymodel[this.Puestos.arraymodel.indexOf(m)]
      m2 = rep
      
      
      this.datos.showMessage("Registro Actualizado Correctamente",this.Puestos.titulomensage,"sucess")
      //this.Puestos.filtrar()

    }
*/
    this.Puestos.getdatos()
      
   },(err:Error)=>{
     this.datos.showMessage("Error: "+err.message,"Error","error")
   })
   }
   
   edita(prod:IPuesto,p:Puestos,t:MatDialog):Promise<any> {
    
    const rep =  new Promise ((resolve:any,reject:any)=>{
      // p.getdatos()
      
      p.model = prod // p.arraymodel.find(x=>x.id=prod.id) as IPuesto
      console.log('Puestos edit',p.model)
      
        const  dialogRef = t.open(FormPuestosComponent,{
          width: '800px',data:{model:p.model}})
          dialogRef.afterClosed().subscribe((result:IPuesto)=>{
            //console.log('llego del formulario de Puestos',result)
            if (result){
              resolve(result);
            }else{
              resolve(null)
            }
            
          });  

    })
    
    return rep

  }
  abrirmodalzona(t:MatDialog,p:Puestos){
    p.model=p.inicializamodelo()
    
    const  dialogRef = t.open(FormPuestosComponent,{
      width: '800px',data:{model:p.model}})
      dialogRef.afterClosed().subscribe((rep:IPuesto)=>{
        //console.log('llego del formulario de Puestos',result)
        this.Puestos.arraymodel.push(rep)
        this.datos.showMessage("Registro Insertado Correctamente",this.Puestos.titulomensage,"sucess")
      }); 
  }
  delete(prod:IPuesto,p:Puestos,t:MatDialog):Promise<any>{
    return new Promise((resolve,reject)=>{ resolve(prod)}) 
  }

  paginacambio(event:number){
    this.Puestos.actualpage = event
    console.log(this.Puestos.actualpage)
    //this.Puestos.filtrar()
  }
  actualizaelidtable(event:string){
    console.log('se actualizo el config',event)
    this.config.id = event
  }
  filtro(){
    if (this.term!=''){
        
      this.Puestos.arraymodel = this.Puestos.arraymodel.filter(x=>x.descripcion.includes((this.term.toUpperCase())))
   }else{
     this.Puestos.getdatos()
   }
  }
  excel(){}
  pdf(){

  }
  agregar(){
    this.abrirmodalzona(this.toastr,this.Puestos)
  }
}
