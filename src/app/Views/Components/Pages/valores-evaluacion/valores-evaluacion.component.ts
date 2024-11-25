import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ValoresEvaluacion } from 'src/app/Controllers/ValoresEvaluacion';
import { IValoresEvaluacion } from 'src/app/Models/ValoresEvaluacion/IValoresEvaluacion';
import { FormValoresEvaluacionComponent } from '../../Forms/form-valores-evaluacion/form-valores-evaluacion.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-valores-evaluacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './valores-evaluacion.component.html',
  styleUrls: ['./valores-evaluacion.component.css']
})
export class ValoresEvaluacionComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  items: IValoresEvaluacion[] = [];
  displayedItems: IValoresEvaluacion[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private service: ValoresEvaluacion,
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

  onDelete(item: IValoresEvaluacion) {
    if (confirm('¿Está seguro que desea eliminar este registro?')) {
      this.loadItems();
    }
  }

  abrirformulario(item: IValoresEvaluacion) {
    const dialogRef = this.dialogmat.open(FormValoresEvaluacionComponent, {
      width: '800px',
      data: { model: item }
    });
    dialogRef.afterClosed().subscribe((result: IValoresEvaluacion) => {
      if (result) {
        this.loadItems();
      }
    });
  }

  onEdit(item: IValoresEvaluacion) {
    this.service.model = { ...item };
    this.showForm = true;
    this.abrirformulario(item);
  }
}
