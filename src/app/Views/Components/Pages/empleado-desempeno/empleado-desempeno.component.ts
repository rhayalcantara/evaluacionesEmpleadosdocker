import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IEmpleadoDesempeno } from '../../../../Models/EmpleadoDesempeno/IEmpleadoDesempeno';
import { EmpleadoDesempeno } from '../../../../Controllers/EmpleadoDesempeno';
import { FormEmpleadoDesempenoComponent } from '../../Forms/form-empleado-desempeno/form-empleado-desempeno.component';
import { DatosServiceService } from '../../../../Services/datos-service.service';

@Component({
  selector: 'app-empleado-desempeno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './empleado-desempeno.component.html',
  styleUrls: ['./empleado-desempeno.component.css']
})
export class EmpleadoDesempenoComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  empleadoDesempenos: IEmpleadoDesempeno[] = [];
  displayedEmpleadoDesempenos: IEmpleadoDesempeno[] = [];
  subscription: Subscription;
  showForm = false;
  pageSize = 10;
  currentPage = 0;
  totalItems = 0;
  pageSizeOptions = [5, 10, 25, 100];

  constructor(
    private empleadoDesempenoService: EmpleadoDesempeno,
    private datosService: DatosServiceService,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.empleadoDesempenoService.TRegistros.subscribe(() => {
      console.log('EmpleadoDesempenos updated', this.empleadoDesempenoService.arraymodel);
      this.empleadoDesempenos = this.empleadoDesempenoService.arraymodel;
      this.totalItems = this.empleadoDesempenos.length;
      this.updateDisplayedEmpleadoDesempenos();
    });
  }

  ngOnInit() {
    this.loadEmpleadoDesempenos();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadEmpleadoDesempenos() {
    this.empleadoDesempenoService.Gets().subscribe({
      next: (response) => {
        console.log('los empleado desempenos', response);
        this.empleadoDesempenos = response.data;
        this.totalItems = this.empleadoDesempenos.length;
        this.updateDisplayedEmpleadoDesempenos();
      },
      error: (error: Error) => {
        console.error('Error loading empleado desempenos:', error);
      }
    });
  }

  updateDisplayedEmpleadoDesempenos() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedEmpleadoDesempenos = this.empleadoDesempenos.slice(startIndex, endIndex);
    console.log('Displayed EmpleadoDesempenos:', this.displayedEmpleadoDesempenos); 
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedEmpleadoDesempenos();
  }

  onAdd() {
    this.empleadoDesempenoService.model = this.empleadoDesempenoService.inicializamodelo();
    this.showForm = true;
    this.abrirformulario(this.empleadoDesempenoService.model);
  }

  onEdit(empleadoDesempeno: IEmpleadoDesempeno) {
    this.empleadoDesempenoService.model = { ...empleadoDesempeno };
    this.showForm = true;
    this.abrirformulario(empleadoDesempeno);
  }

  onDelete(empleadoDesempeno: IEmpleadoDesempeno) {
    if (confirm('¿Está seguro que desea eliminar este registro?')) {
      console.log('Delete EmpleadoDesempeno:', empleadoDesempeno);
      const url = `${this.empleadoDesempenoService.rutaapi}/${empleadoDesempeno.id}`;
      this.datosService.delbyid(url).subscribe({
        next: () => {
          this.loadEmpleadoDesempenos();
          this.datosService.showMessage('Registro eliminado correctamente', 'Desempeño del Empleado', 'success');
        },
        error: (error: Error) => {
          console.error('Error deleting empleado desempeno:', error);
          this.datosService.showMessage('Error al eliminar el registro', 'Desempeño del Empleado', 'error');
        }
      });
    }
  }

  abrirformulario(empleadoDesempeno: IEmpleadoDesempeno) {
    const dialogRef = this.dialogmat.open(FormEmpleadoDesempenoComponent, {
      width: '800px',
      data: { model: empleadoDesempeno }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEmpleadoDesempenos();
      }
    });
  }
}
