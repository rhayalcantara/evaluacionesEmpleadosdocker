import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatPaginatorModule, MatDialogModule],
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
  filterText: string = '';

  constructor(
    private empleadoDesempenoService: EmpleadoDesempeno,
    private datosService: DatosServiceService,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.empleadoDesempenoService.TRegistros.subscribe(() => {
      this.empleadoDesempenos = this.empleadoDesempenoService.arraymodel.sort((a, b) => a.secuencialId - b.secuencialId);
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
    let filteredData = this.empleadoDesempenos;
    
    if (this.filterText) {
      const searchTerm = this.filterText.toLowerCase();
      filteredData = this.empleadoDesempenos.filter(item => 
        (item.empleado?.nombreunido?.toLowerCase().includes(searchTerm) ||
        item.kri?.descripcion?.toLowerCase().includes(searchTerm) ||
        item.kpi?.descripcion?.toLowerCase().includes(searchTerm) ||
        item.objetivoProyecto?.descripcion?.toLowerCase().includes(searchTerm)) ?? false
      );
    }

    this.totalItems = filteredData.length;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedEmpleadoDesempenos = filteredData.slice(startIndex, endIndex);
  }

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filterText = input.value;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updateDisplayedEmpleadoDesempenos();
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
