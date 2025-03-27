import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesComponent } from '../../tables/tables.component';
import { FormsModule } from '@angular/forms';
import { Departamento } from 'src/app/Controllers/Departamento';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [FormsModule,TablesComponent,CommonModule,MatDialogModule],
  templateUrl: './departamentos.component.html',
  styleUrls: ['./departamentos.component.css']
})
export class DepartamentosComponent implements OnInit {
  constructor(
    public departamento:Departamento,
    private ServiceComunicacion:ComunicacionService,
    private datos:DatosServiceService,
    private toastr: MatDialog
    ) { 
      // this.departamento.getdatos()
      this.ServiceComunicacion.enviarMensajeObservable.subscribe({next:(mensaje:string)=>{
        console.log('departamentos Construtor: '+mensaje)   
      
      }})
    }
 
  config:any
  public term: string='';
  
  public campos:string[]=[]
  public tituloslocal:string[]=[]


  ngOnInit(): void {
    this.departamento.getdatos()
    this.departamento.TRegistros.subscribe({
     next:(rep:number)=>{
      console.log("evento#:",rep)
       this.config.totalItems=rep
       this.ServiceComunicacion.enviarMensaje(this.config)
     }
     
    })

    this.config = {
    id:'',
     itemsPerPage: 10,
     currentPage: 1,
     totalItems: this.departamento.totalregistros
   };
    
     
     this.departamento.titulos.map((x:string|any)=>{
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
   
   const handler =  acct[event.option](event.key,this.departamento,this.toastr)
   handler.then((rep:IDepartamento)=>{

    if(rep!=null){
      let m:IDepartamento = this.departamento.arraymodel.find(x=>x.secuencial==rep.secuencial) as IDepartamento
      let m2:IDepartamento =this.departamento.arraymodel[this.departamento.arraymodel.indexOf(m)]
      m2 = rep
      
      this.datos.showMessage("Registro Actualizado Correctamente",this.departamento.titulomensage,"sucess")
      //this.departamento.filtrar()

    }

      
   },(err:Error)=>{
     this.datos.showMessage("Error: "+err.message,"Error","error")
   })
   }
   
   edita(prod:IDepartamento,p:Departamento,t:MatDialog):Promise<any> {
    
    const rep =  new Promise ((resolve:any,reject:any)=>{
      // p.getdatos()
      
      p.model = prod // p.arraymodel.find(x=>x.id=prod.id) as IDepartamento
      console.log('departamento edit',p.model)
      /*
        const  dialogRef = t.open(FormdepartamentoComponent,{
          width: '900px',data:{model:p.model}})
          dialogRef.afterClosed().subscribe((result:IDepartamento)=>{
            //console.log('llego del formulario de departamento',result)
            if (result){
              resolve(result);
            }else{
              resolve(null)
            }
            
          });  */

    })
    
    return rep

  }
  abrirmodalzona(t:MatDialog,p:Departamento){
    p.model=p.inicializamodelo()
    /*
    const  dialogRef = t.open(FormdepartamentoComponent,{
      width: '900px',data:{model:p.model}})
      dialogRef.afterClosed().subscribe((rep:IDepartamento)=>{
        //console.log('llego del formulario de departamento',result)
        this.departamento.arraymodel.push(rep)
        this.datos.showMessage("Registro Insertado Correctamente",this.departamento.titulomensage,"sucess")
      }); */
  }
  delete(prod:IDepartamento,p:Departamento,t:MatDialog):Promise<any>{
   return new Promise((resolve,reject)=>{ resolve(prod)}) 
  }

  paginacambio(event:number){
    this.departamento.actualpage = event
    //this.departamento.filtrar()
  }
  actualizaelidtable(event:string){
    console.log('se actualizo el config',event)
    this.config.id = event
  }
  filtro(){
    if (this.term!=''){
        
      this.departamento.arraymodel = this.departamento.arraymodel.filter(x=>x.nombre.includes((this.term.toUpperCase())))
   }else{
     this.departamento.getdatos()
   }
  }
  excel(){}
  pdf(){

  }
  agregar(){
    this.abrirmodalzona(this.toastr,this.departamento)
  }
}
