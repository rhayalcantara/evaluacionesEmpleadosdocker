import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { Metas } from 'src/app/Controllers/Metas';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IMeta, IMetaDts } from 'src/app/Models/Meta/IMeta';
import { FormMetasComponent } from '../../Forms/form-metas/form-metas.component';


@Component({
  standalone:true,
  imports:[FormsModule,TablesComponent,MatDialogModule],
  selector: 'app-metas',
  templateUrl: './metas.component.html',
  styleUrls: ['./metas.component.css']
})
export class MetasComponent implements OnInit {
campos: string[]=[];
tituloslocal: string[]=[];
config: any;
public term: string='';
constructor(public meta:Metas,    
            private ServiceComunicacion:ComunicacionService,
            private datos:DatosServiceService,
            private toastr: MatDialog){}
  ngOnInit(): void {
      this.meta.getdatos()
      this.meta.TRegistros.subscribe({next:(rep:number)=>{
         this.config.totalItems=rep
         this.ServiceComunicacion.enviarMensaje(this.config)
       }
       
      })
      this.config = {
        id:'',
         itemsPerPage: 5,
         currentPage: 1,
         totalItems: this.meta.totalregistros
       };
       this.meta.titulos.map((x:string|any)=>{
        let nx:string = x[Object.keys(x)[0]]
        this.campos.push(...Object.keys(x))
        this.tituloslocal.push(nx)
      })
  }

  
actualizaelidtable($event: string) {
 
}
paginacambio($event: number) {
 
}
opcion(event: TableResponse) {
    
    const acct:any ={
      edit:this.edita,
      del:this.delete
   }   
   
   const handler =  acct[event.option](event.key,this.meta ,this.toastr)
   handler.then((rep:IMeta  )=>{
 
    this.meta.getdatos()
      
   },(err:Error)=>{
     this.datos.showMessage("Error: "+err.message,"Error","error")
   })
}
filtro() {
  if (this.term!=''){        
    this.meta.arraymodel = this.meta.arraymodel.filter(x=>x.name.includes((this.term.toUpperCase())))
 }else{
   this.meta.getdatos()
 }
}

agregar() {
  this.abrirmodalzona(this.toastr,this.meta)
}
excel() {
 
}
pdf() {
 
}
edita(prod:IMeta ,p:Metas ,t:MatDialog):Promise<any> {
    
  const rep =  new Promise ((resolve:any,reject:any)=>{
    // p.getdatos()
    
    p.model = prod // p.arraymodel.find(x=>x.id=prod.id) as IMeta 
    
      const  dialogRef = t.open(FormMetasComponent,{
        width: '800px',data:{model:p.model}})
        dialogRef.afterClosed().subscribe((result:IMeta )=>{
          if (result){
            resolve(result);
          }else{
            resolve(null)
          }
          
        });  

  })
  
  return rep

}
abrirmodalzona(t:MatDialog,p:Metas ){
  p.model=p.inicializamodelo()
  
  const  dialogRef = t.open(FormMetasComponent,{
    width: '800px',data:{model:p.model}})
    dialogRef.afterClosed().subscribe((rep:IMetaDts )=>{
      this.meta.arraymodel.push(rep)
      this.datos.showMessage("Registro Insertado Correctamente",this.meta.titulomensage,"sucess")
    }); 
}
delete(prod:IMeta ,p:Metas ,t:MatDialog):Promise<any>{
  return new Promise((resolve,reject)=>{ resolve(prod)}) 
}

}
