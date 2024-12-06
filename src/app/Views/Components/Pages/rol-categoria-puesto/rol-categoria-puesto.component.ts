import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RolCategoriaPuesto } from 'src/app/Controllers/RolCategoriaPuesto';
import { CategoriaPuesto } from 'src/app/Controllers/CategoriaPuesto';
import { IRolCategoriaPuesto } from 'src/app/Models/RolCategoriaPuesto/IRolCategoriaPuesto';
import { ICategoriaPuesto } from 'src/app/Models/Puesto/IPuesto';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { FormRolCategoriaPuestoComponent } from '../../Forms/form-rol-categoria-puesto/form-rol-categoria-puesto.component';

@Component({
  selector: 'app-rol-categoria-puesto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './rol-categoria-puesto.component.html',
  styleUrls: ['./rol-categoria-puesto.component.css']
})
export class RolCategoriaPuestoComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  rolCategorias: IRolCategoriaPuesto[] = [];
  displayedRolCategorias: IRolCategoriaPuesto[] = [];
  categoriasPuesto: { [key: number]: string } = {};
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private rolCategoriaService: RolCategoriaPuesto,
    private categoriaPuestoService: CategoriaPuesto,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.rolCategoriaService.TRegistros.subscribe(() => {
      this.loadRolCategorias();
      this.showForm = false;
    });
  }

  ngOnInit() {
    this.loadCategoriasPuesto();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCategoriasPuesto() {
    this.categoriaPuestoService.Gets().subscribe({
      next: (response) => {
        // Create a map of id to descripcion for easy lookup
        this.categoriasPuesto = response.data.reduce((acc: { [key: number]: string }, cat: ICategoriaPuesto) => {
          acc[cat.id] = cat.descripcion;
          return acc;
        }, {});
        this.loadRolCategorias();
      },
      error: (error) => {
        console.error('Error loading Categorias Puesto:', error);
      }
    });
  }

  loadRolCategorias() {
    this.rolCategoriaService.Gets().subscribe({
      next: (response) => {
        this.rolCategorias = response.data;
        this.totalItems = this.rolCategorias.length;       
        this.updateDisplayedRolCategorias();
      },
      error: (error) => {
        console.error('Error loading Rol Categorias:', error);
      }
    });
  }

  getCategoriaNames(rolCategoria: IRolCategoriaPuesto): string {
    
    return rolCategoria.categorias
      .map(cat =>  this.categoriasPuesto[Number(cat.categoriaPuestoId)])      
      .join(', ');
      
       
  }

  updateDisplayedRolCategorias() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRolCategorias = this.rolCategorias.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedRolCategorias();
  }

  onAdd() {
    this.rolCategoriaService.model = this.rolCategoriaService.inicializamodelo();
    this.showForm = true;
    this.abrirformulario(this.rolCategoriaService.model);
  }

  onDelete(rolCategoria: IRolCategoriaPuesto) {
    if (confirm('¿Está seguro que desea eliminar este Rol Categoría Puesto?')) {
      console.log('Delete Rol Categoria:', rolCategoria);
      this.loadRolCategorias();
    }
  }

  abrirformulario(rolCategoria: IRolCategoriaPuesto) {
    const dialogRef = this.dialogmat.open(FormRolCategoriaPuestoComponent, {
      width: '800px',
      data: { model: rolCategoria }
    });
    dialogRef.afterClosed().subscribe((result: IRolCategoriaPuesto) => {
      if (result) {
        this.loadRolCategorias();
      }
    });
  }

  onEdit(rolCategoria: IRolCategoriaPuesto) {
    this.rolCategoriaService.model = { ...rolCategoria };
    this.showForm = true;
    this.abrirformulario(rolCategoria);
  }
}
