import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Puestos } from 'src/app/Controllers/Puestos';
import { IPuesto } from 'src/app/Models/Puesto/IPuesto';
import { Departamento } from 'src/app/Controllers/Departamento';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ITipo } from 'src/app/Models/Tipo/ITipo';

@Component({
  selector: 'app-seleccion-puesto',
  standalone: true,
  imports: [CommonModule, FormsModule,TablesComponent],
  templateUrl: './seleccion-puesto.component.html',
  styleUrls: ['./seleccion-puesto.component.css']
})
export class SeleccionPuestoComponent implements OnInit {
  puestos: IPuesto[] = [];
  departamentos: IDepartamento[] = [];
  selectedDepartamento: number | null = null;
  filteredPuestos: IPuesto[] = [];
  pagedPuestos: IPuesto[] = [];
  sele:boolean=true;
  config:any
  public campos:string[]=[]
  public tituloslocal:string[]=[]
  public term: string='';

  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  constructor(
    public puestosService: Puestos,
    public departamentoService: Departamento,
    public dialogRef: MatDialogRef<SeleccionPuestoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.cargarDepartamentos();
    this.cargarPuestos();
    this.config = {
      id:'',
       itemsPerPage: 10,
       currentPage: 1,
       totalItems: this.puestosService.totalregistros
     };
  }

  cargarDepartamentos() {
    this.departamentoService.getdatos()
    this.departamentos = this.departamentoService.arraymodel;
  }

  cargarPuestos() {
    this.puestosService.getdatos()
    this.puestos = this.puestosService.arraymodel;
    this.filtrarPuestos();

    this.puestosService.titulos.map((x:string|any)=>{
      let nx:string = x[Object.keys(x)[0]]
      this.campos.push(...Object.keys(x))
      this.tituloslocal.push(nx)
    })
  }

  filtrarPuestos() {
    if (this.selectedDepartamento!=null) {
      // this.puestosService.arraymodel = this.puestosService.arraymodel.filter(
      //   puesto => puesto.departmentSecuencial === this.selectedDepartamento
      // );
      this.puestosService.arraymodel = this.puestosService.arraymodel.filter(puesto => {
        if (puesto.departmentSecuencial === this.selectedDepartamento) {
          return true;
        }
        return false;
      });
    } else {
      this.puestosService.getdatos()
    }
    //this.totalPages = Math.ceil(this.filteredPuestos.length / this.pageSize);
    //this.currentPage = 1;
    //this.updatePagedPuestos();
  }
  filtro(){
    if (this.term!=''){
        
      this.puestosService.arraymodel = this.puestosService.arraymodel.filter(x=>x.descripcion.includes((this.term.toUpperCase())))
   }else{
     this.puestosService.getdatos()
     this.filtrarPuestos()
   }
  }
  updatePagedPuestos() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedPuestos = this.filteredPuestos.slice(startIndex, startIndex + this.pageSize);
  }

  onDepartamentoChange() {
    this.filtrarPuestos();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedPuestos();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedPuestos();
    }
  }

  seleccionarPuesto(puesto: IPuesto) {
    this.dialogRef.close(puesto);
  }

  cancelar() {
    this.dialogRef.close();
  }
  opcion(event:TableResponse){
    this.dialogRef.close(event.key)
  }
  paginacambio(event:number){
    this.puestosService.actualpage = event
  }
  actualizaelidtable(event:string){
    this.config.id = event
  }
}
