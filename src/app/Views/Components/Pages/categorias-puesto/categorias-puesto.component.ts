import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';
import { FormCategoriaPuestoComponent } from '../../Forms/form-categoria-puesto/form-categoria-puesto.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-categorias-puesto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './categorias-puesto.component.html',
  styleUrls: ['./categorias-puesto.component.css']
})
export class CategoriasPuestoComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  categoriasPuesto: ICategoriaPuesto[] = [];
  displayedCategorias: ICategoriaPuesto[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private categoriaPuestoService: CategoriaPuesto,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.categoriaPuestoService.TRegistros.subscribe(() => {
      this.loadCategorias();
      this.showForm = false;
    });
  }

  ngOnInit() {
    this.loadCategorias();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCategorias() {
    this.categoriaPuestoService.Gets().subscribe({
      next: (response) => {
        this.categoriasPuesto = response.data;
        this.totalItems = this.categoriasPuesto.length;
        this.updateDisplayedCategorias();
      },
      error: (error) => {
        console.error('Error loading Categorías de Puesto:', error);
      }
    });
  }

  updateDisplayedCategorias() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedCategorias = this.categoriasPuesto.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedCategorias();
  }

  onAdd() {
    this.categoriaPuestoService.model = this.categoriaPuestoService.inicializamodelo();
    this.showForm = true;
    this.abrirFormulario(this.categoriaPuestoService.model);
  }

  onDelete(categoria: ICategoriaPuesto) {
    if (confirm('¿Está seguro que desea eliminar esta categoría de puesto?')) {
      // Since there's no delete method in the service, we might need to implement it
      this.loadCategorias();
    }
  }

  abrirFormulario(categoria: ICategoriaPuesto) {
    const dialogRef = this.dialogmat.open(FormCategoriaPuestoComponent, {
      width: '800px',
      data: { model: categoria }
    });
    dialogRef.afterClosed().subscribe((result: ICategoriaPuesto) => {
      if (result) {
        this.loadCategorias();
      }
    });
  }

  onEdit(categoria: ICategoriaPuesto) {
    this.categoriaPuestoService.model = { ...categoria };
    this.showForm = true;
    this.abrirFormulario(categoria);
  }
}
