
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Empleados } from 'src/app/Controllers/Empleados';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { Departamento } from 'src/app/Controllers/Departamento';
import { IDepartamento } from 'src/app/Models/Departamento/IDepartamento';
import { TablesComponent } from '../../tables/tables.component';
import { TableResponse } from 'src/app/Helpers/Interfaces';
import { ComunicacionService } from 'src/app/Services/comunicacion.service';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
  selector: 'app-seleccion-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule, TablesComponent,MatDialogModule],
  templateUrl: './seleccion-empleado.component.html',
  styleUrls: ['./seleccion-empleado.component.css']
})
export class SeleccionEmpleadoComponent implements OnInit {
  empleados: IEmpleado[] = [];
  departamentos: IDepartamento[] = [];
  selectedDepartamento: number | null = null;
  filteredEmpleados: IEmpleado[] = [];
  pagedEmpleados: IEmpleado[] = [];
  sele: boolean = true;
  config: any;
  public campos: string[] = [];
  public tituloslocal: string[] = [];
  public term: string = '';


  constructor(
    public empleadosService: Empleados,
    public departamentoService: Departamento,
    private ServiceComunicacion:ComunicacionService,
    public dialogRef: MatDialogRef<SeleccionEmpleadoComponent>,
    private toastr: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    
    this.config = {
      id: '',
      itemsPerPage: 5,
      currentPage: 1,
      totalItems: this.empleadosService.totalregistros
    };
    this.cargarDepartamentos();
    this.cargarEmpleados();
    const dialogRef = this.toastr.open(LoadingComponent, {
      width: '340px',
      height: '180px', 
    }); 
    this.empleadosService.TRegistros.subscribe({
      next:(rep:number)=>{
       console.log("evento#:",rep)
        this.config.totalItems=rep
        this.ServiceComunicacion.enviarMensaje(this.config)
        dialogRef.close()
      }
     
    })


  }

  cargarDepartamentos() {
    this.departamentoService.getdatos();
    this.departamentos = this.departamentoService.arraymodel;
  }

  cargarEmpleados() {
    this.empleadosService.getdatos();
    this.empleados = this.empleadosService.arraymodel
    this.filtrarEmpleados();

    this.empleadosService.titulos.map((x: string | any) => {
      let nx: string = x[Object.keys(x)[0]];
      this.campos.push(...Object.keys(x));
      this.tituloslocal.push(nx);
    });
  }

  filtrarEmpleados() {
    if (this.selectedDepartamento) {
      this.empleadosService.arraymodel = this.empleadosService.arraymodel.filter(
        empleado => empleado.sdept === this.selectedDepartamento
      );
      this.config.totalItems=this.empleadosService.arraymodel.length
      this.ServiceComunicacion.enviarMensaje(this.config)
    } else {
      this.empleadosService.getdatos();
    }
  }

  filtro() {
    if (this.term !== '') {
      this.empleadosService.arraymodel = this.empleadosService.arraymodel.filter(
        x => x.nombreunido.toUpperCase().includes(this.term.toUpperCase())
      );
      this.config.totalItems=this.empleadosService.arraymodel.length
      this.ServiceComunicacion.enviarMensaje(this.config)
    } else {
      this.empleadosService.getdatos();
      this.filtrarEmpleados();
    }
  }

  onDepartamentoChange() {
    this.filtrarEmpleados();
  }

  seleccionarEmpleado(empleado: IEmpleado) {
    this.dialogRef.close(empleado);
  }

  cancelar() {
    this.dialogRef.close();
  }

  opcion(event: TableResponse) {
    this.dialogRef.close(event.key);
  }

  paginacambio(event: number) {
    this.empleadosService.actualpage = event;
  }

  actualizaelidtable(event: string) {
    this.config.id = event;
  }
}
