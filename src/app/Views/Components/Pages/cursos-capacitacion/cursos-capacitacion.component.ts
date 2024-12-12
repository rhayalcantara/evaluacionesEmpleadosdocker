import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';
import { CursoCapacitacion } from 'src/app/Models/Capacitacion/Cursos';
import { FormCursoCapacitacionComponent } from '../../Forms/form-curso-capacitacion/form-curso-capacitacion.component';

@Component({
  selector: 'app-cursos-capacitacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule, MatDialogModule],
  templateUrl: './cursos-capacitacion.component.html',
  styleUrls: ['./cursos-capacitacion.component.css']
})
export class CursosCapacitacionComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  cursos: CursoCapacitacion[] = [];
  displayedCursos: CursoCapacitacion[] = [];
  subscription: Subscription;
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;
  showForm = false;

  constructor(
    private cursoService: CursoCapacitacionController,
    private dialogmat: MatDialog
  ) {
    this.subscription = this.cursoService.TRegistros.subscribe(() => {
      this.loadCursos();
    });
  }

  ngOnInit() {
    this.loadCursos();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCursos() {
    this.cursoService.Gets().subscribe({
      next: (response) => {
        this.cursos = response.data;
        this.totalItems = this.cursos.length;
        this.updateDisplayedCursos();
      },
      error: (error) => {
        console.error('Error loading cursos:', error);
      }
    });
  }

  updateDisplayedCursos() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedCursos = this.cursos.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedCursos();
  }

  onAdd() {
    this.cursoService.model = this.cursoService.inicializamodelo();
    this.showForm = true;
    this.abrirformulario(this.cursoService.model);
  }

  onEdit(curso: CursoCapacitacion) {
    this.cursoService.model = { ...curso };
    this.showForm = true;
    this.abrirformulario(curso);
  }

  onDelete(curso: CursoCapacitacion) {
    if (confirm('¿Está seguro que desea eliminar este curso?')) {
      // Implement delete functionality when available in the service
      console.log('Delete curso:', curso);
      this.loadCursos();
    }
  }

  abrirformulario(curso: CursoCapacitacion) {
    const dialogRef = this.dialogmat.open(FormCursoCapacitacionComponent, {
      width: '800px',
      data: { model: curso }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCursos();
      }
    });
  }
}
