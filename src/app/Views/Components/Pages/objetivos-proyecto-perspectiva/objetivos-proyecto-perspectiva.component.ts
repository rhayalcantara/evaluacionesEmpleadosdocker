import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ObjetivoProyectoPerspectiva } from 'src/app/Controllers/ObjetivoProyectoPerspectiva';
import { IObjetivoProyectoPerspectiva } from 'src/app/Models/ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva';
import { FormObjetivoProyectoPerspectivaComponent } from '../../Forms/form-objetivo-proyecto-perspectiva/form-objetivo-proyecto-perspectiva.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';

@Component({
  selector: 'app-objetivos-proyecto-perspectiva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule,MatDialogModule],
  templateUrl: './objetivos-proyecto-perspectiva.component.html',
  styleUrls: ['./objetivos-proyecto-perspectiva.component.css']
})
export class ObjetivosProyectoPerspectivaComponent implements OnInit, OnDestroy {
  @Input() objetivoestrategicoId: number = 0;
  @Input() Tipo:'Objetivos' | 'Proyecto'= 'Objetivos';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  objetivos: IObjetivoProyectoPerspectiva[] = [];
  displayedObjetivos: IObjetivoProyectoPerspectiva[] = [];
  showForm = false;
  private subscription: Subscription;

  // Pagination settings
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private objetivoService: ObjetivoProyectoPerspectiva,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.objetivoService.TRegistros.subscribe(() => {
      this.loadObjetivos();
      this.showForm = false;
    });
  }

  ngOnInit() {
    this.loadObjetivos();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadObjetivos() {
    this.objetivoService.Gets().subscribe({
      next: (response:ModelResponse) => {
        this.objetivos = response.data;

        
        if (this.objetivoestrategicoId != 0) {
          this.objetivos = this.objetivos.filter(obj => obj.objetivoEstrategicoId === this.objetivoestrategicoId);
        }
        
        //filtra por tipo de objetivo
        //this.objetivos = this.objetivos.filter(obj=> obj.tipo == this.Tipo);
        this.totalItems = this.objetivos.length;
        this.updateDisplayedObjetivos();
      },
      error: (error) => {
        console.error('Error loading Objetivos:', error);
      }
    });
  }

  updateDisplayedObjetivos() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedObjetivos = this.objetivos.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedObjetivos();
  }

  onAdd() {
    this.objetivoService.model = this.objetivoService.inicializamodelo();
    this.objetivoService.model.tipo=this.Tipo;
    this.showForm = true;
    this.objetivoService.model.objetivoEstrategicoId = this.objetivoestrategicoId;
    this.abrirformulario(this.objetivoService.model);
  }

  onDelete(objetivo: IObjetivoProyectoPerspectiva) {
    if (confirm('¿Está seguro que desea eliminar este Objetivo/Proyecto?')) {
      this.loadObjetivos();
    }
  }

  abrirformulario(objetivo: IObjetivoProyectoPerspectiva) {
    const dialogRef = this.dialogmat.open(FormObjetivoProyectoPerspectivaComponent, {
      width: '800px',
      data: { model: objetivo }
    });
    dialogRef.afterClosed().subscribe((result: IObjetivoProyectoPerspectiva) => {
      if (result) {
        this.loadObjetivos();
      }
    });
  }

  onEdit(objetivo: IObjetivoProyectoPerspectiva) {
    this.abrirformulario(objetivo);
  }

  onVerAnos(objetivo: IObjetivoProyectoPerspectiva) {
    // Placeholder for future functionality
  }
}
