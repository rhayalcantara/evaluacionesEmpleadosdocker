import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { ITipo } from '../../../../Models/Tipo/ITipo';
import { Tipos } from '../../../../Controllers/Tipos';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { FormTiposComponent } from '../../Forms/form-tipos/form-tipos.component';

@Component({
  selector: 'app-tipos',
  standalone: true,
  imports: [FormsModule,TablesComponent,CommonModule],
  templateUrl: './tipos.component.html',
  styleUrls: ['./tipos.component.css']
})
export class TiposComponent implements OnInit {
  constructor(public tiposController: Tipos,
    private ServiceComunicacion:ComunicacionService,
    private datos:DatosServiceService,
    private toastr: MatDialog
  ) {
    // this.ServiceComunicacion.enviarMensajeObservable.subscribe({next:(mensaje:string)=>{
    //   console.log('Tipos Construtor: '+mensaje)   
    
    // }})
   }

   config:any
   public term: string='';
   
   public campos:string[]=[]
   public tituloslocal:string[]=[]
   ngOnInit() {
    this.tiposController.getdatos()
    this.tiposController.TRegistros.subscribe({
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
     totalItems: this.tiposController.totalregistros
   };
    
     
     this.tiposController.titulos.map((x:string|any)=>{
       let nx:string = x[Object.keys(x)[0]]
       this.campos.push(...Object.keys(x))
       this.tituloslocal.push(nx)
     })
     
  }
  opcion(event:TableResponse){
    console.log(event)
    
    const acct:any ={
      edit:this.edita,
      del:this.delete
   }  
   const handler =  acct[event.option](event.key,this.tiposController,this.toastr)
   handler.then((rep:ITipo)=>{

    this.tiposController.getdatos()
      
   },(err:Error)=>{
     this.datos.showMessage("Error: "+err.message,"Error","error")
   })
  }
  edita(prod:ITipo,p:Tipos,t:MatDialog):Promise<any> {
    
    const rep =  new Promise ((resolve:any,reject:any)=>{
      // p.getdatos()
      
      p.model = prod // p.arraymodel.find(x=>x.id=prod.id) as IPuesto
      console.log('tiposController edit',p.model)
      
        const  dialogRef = t.open(FormTiposComponent,{
          width: '800px',data:{model:p.model}})
          dialogRef.afterClosed().subscribe((result:ITipo)=>{
            //console.log('llego del formulario de tiposController',result)
            if (result){
              resolve(result);
            }else{
              resolve(null)
            }
            
          });  

    })
    
    return rep

  }
  abrirmodalzona(t:MatDialog,p:Tipos){
    p.model=p.inicializamodelo()
    
    const  dialogRef = t.open(FormTiposComponent,{
      width: '800px',data:{model:p.model}})
      dialogRef.afterClosed().subscribe((rep:ITipo)=>{
        //console.log('llego del formulario de tiposController',result)
        this.tiposController.arraymodel.push(rep)
        this.datos.showMessage("Registro Insertado Correctamente",this.tiposController.titulomensage,"sucess")
      }); 
  }
  delete(prod:ITipo,p:Tipos,t:MatDialog):Promise<any>{
    return new Promise((resolve,reject)=>{ resolve(prod)}) 
  }

  paginacambio(event:number){
    this.tiposController.actualpage = event
    console.log(this.tiposController.actualpage)
    //this.tiposController.filtrar()
  }
  actualizaelidtable(event:string){
    console.log('se actualizo el config',event)
    this.config.id = event
  }
  filtro(){
// Check if the search term is not empty
if (this.term.trim() !== '') {
  // If the term is not empty, filter the arraymodel based on the search term
      this.tiposController.arraymodel = this.tiposController.arraymodel.filter(x => {
    // Get the trimmed and uppercase description of the current item
        const descripcion = x.descripcion.trim().toUpperCase();
    // Get the trimmed and uppercase search term
        const term = this.term.trim().toUpperCase();
    // Return true if the description includes the search term
        return descripcion.includes(term);
      });
    } else {
  // If the term is empty, retrieve the data from the tiposController
      this.tiposController.getdatos();
    }
  }
  excel(){}
  pdf(){

  }
  agregar(){
    this.abrirmodalzona(this.toastr,this.tiposController)
  }

  Cancel() {
    
  }
}