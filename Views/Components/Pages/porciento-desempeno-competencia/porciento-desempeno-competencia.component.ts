import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PorcientoDesempenoCompetencia } from 'src/app/Controllers/PorcientoDesempenoCompetencia';
import { IPorcientoDesempenoCompetencia } from 'src/app/Models/PorcientoDesempenoCompetencia/IPorcientoDesempenoCompetencia';
import { FormPorcientoDesempenoCompetenciaComponent } from '../../Forms/form-porciento-desempeno-competencia/form-porciento-desempeno-competencia.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-porciento-desempeno-competencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './porciento-desempeno-competencia.component.html',
  styleUrls: ['./porciento-desempeno-competencia.component.css']
})
export class PorcientoDesempenoCompetenciaComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  items: IPorcientoDesempenoCompetencia[] = [];
  displayedItems: IPorcientoDesempenoCompetencia[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private service: PorcientoDesempenoCompetencia,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.service.TRegistros.subscribe(() => {
      this.loadItems();
      this.showForm = false;
    });
  }

  ngOnInit() {
    this.loadItems();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadItems() {
    this.service.Gets().subscribe({
      next: (response) => {
        this.items = response.data;
        this.totalItems = this.items.length;
        this.updateDisplayedItems();
      },
      error: (error: Error) => {
        console.error('Error loading items:', error);
      }
    });
  }

  updateDisplayedItems() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedItems = this.items.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedItems();
  }

  onAdd() {
    this.service.model = this.service.inicializamodelo();
    this.showForm = true;
    this.abrirformulario(this.service.model);
  }

  onDelete(item: IPorcientoDesempenoCompetencia) {
    if (confirm('¿Está seguro que desea eliminar este registro?')) {
      // Since there's no delete method in the service, we'll just refresh the list
      this.loadItems();
    }
  }

  abrirformulario(item: IPorcientoDesempenoCompetencia) {
    const dialogRef = this.dialogmat.open(FormPorcientoDesempenoCompetenciaComponent, {
      width: '800px',
      data: { model: item }
    });
    dialogRef.afterClosed().subscribe((result: IPorcientoDesempenoCompetencia) => {
      if (result) {
        this.loadItems();
      }
    });
  }

  onEdit(item: IPorcientoDesempenoCompetencia) {
    this.service.model = { ...item };
    this.showForm = true;
    this.abrirformulario(item);
  }
}
