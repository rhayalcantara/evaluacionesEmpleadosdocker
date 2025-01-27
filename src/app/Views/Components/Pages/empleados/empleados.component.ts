import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablesComponent } from '../../tables/tables.component';
import { FormsModule } from '@angular/forms';
import { IEmpleado } from '../../../../Models/Empleado/IEmpleado';
import { Empleados } from '../../../../Controllers/Empleados';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { Departamento } from 'src/app/Controllers/Departamento';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { LoadingComponent } from '../../loading/loading.component';
import { FormEmpleadoRolComponent } from '../../Forms/form-empleado-rol/form-empleado-rol.component';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule,TablesComponent,CommonModule,MatDialogModule],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.css']
})
export class EmpleadosComponent implements OnInit {
  config:any
  public term: string='';
  public estado:string="";
  departamentos: IDepartamento[] = [];
  public campos:string[]=[]
  public tituloslocal:string[]=[]
  selectedDepartamento: number | null = null;

  constructor(public empleadosController: Empleados,
              private ServiceComunicacion:ComunicacionService,
              private toastr: MatDialog,
              public departamentoService: Departamento,
  ) { }

  ngOnInit() {
    this.cargarDepartamentos();
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 
   
    this.empleadosController.getdatos()
    
    this.empleadosController.TRegistros.subscribe({
     next:(rep:number)=>{
      //console.log("evento#:",rep)
       this.config.totalItems=rep
       this.ServiceComunicacion.enviarMensaje(this.config)
       dialogRef.close()
     }
     
    })

    this.config = {
    id:'',
     itemsPerPage: 10,
     currentPage: 1,
     totalItems: this.empleadosController.totalregistros
   };
    
     
     this.empleadosController.titulos.map((x:string|any)=>{
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
    this.filtrarestado(this.estado);
  }
  onestadoChange(event:any){
    
    this.filtrarPuestos();
    this.filtrarestado(this.estado);

   }
   filtrarestado(estado:string){
    if (estado !=""){
      this.empleadosController.arraymodel = this.empleadosController.arraymodel.filter(est=>est.codigoestado==estado)  
      this.config.totalItems=this.empleadosController.arraymodel.length
      this.ServiceComunicacion.enviarMensaje(this.config)   
    }    
   }
  filtrarPuestos() {
    console.log("cambio a:",this.selectedDepartamento)
    this.empleadosController.arraymodel=this.empleadosController.arraytotal
    if (this.selectedDepartamento) {
      this.empleadosController.arraymodel = this.empleadosController.arraymodel.filter(
        puesto => puesto.sdept === this.selectedDepartamento
      );

    }       
    this.config.totalItems=this.empleadosController.arraymodel.length
    this.ServiceComunicacion.enviarMensaje(this.config)
  }
  opcion(event:TableResponse){
   
    this.abrirmodalzona(event.key as IEmpleado,this.toastr)
  
   }
  
  
  abrirmodalzona(p:IEmpleado,t:MatDialog){
    
    const  dialogRef = t.open(FormEmpleadoRolComponent,{
      width: '900px',data:{model:p}})
      dialogRef.afterClosed().subscribe((rep:IEmpleado)=>{
        // console.log('llego del formulario de empleadosController',result)
        // this.empleadosController.arraymodel.push(rep)
        // this.datos.showMessage("Registro Insertado Correctamente",this.empleadosController.titulomensage,"sucess")
      }); 
  }


  paginacambio(event:number){
    this.empleadosController.actualpage = event
    //this.empleadosController.filtrar()
  }
  actualizaelidtable(event:string){
    console.log('se actualizo el config',event)
    this.config.id = event
  }
  filtro(){
    
    if (this.term!=''){
      
      this.empleadosController.arraymodel = this.empleadosController.arraytotal
      .filter(x=>x.nombreunido.includes((this.term.toUpperCase())))
   }else{
     this.empleadosController.getdatos()
   }
  }
  excel(){}
  pdf(){

  }
  agregar(){
   
  }
  
}