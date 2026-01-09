import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { CursoCapacitacionController } from 'src/app/Controllers/CursoCapacitacion';
import { ICursoCapacitacion } from 'src/app/Models/Capacitacion/Cursos';
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
  
  cursos: ICursoCapacitacion[] = [];
  displayedCursos: ICursoCapacitacion[] = [];
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

  onEdit(curso: ICursoCapacitacion) {
    this.cursoService.model = { ...curso };
    this.showForm = true;
    this.abrirformulario(curso);
  }

  onDelete(curso: ICursoCapacitacion) {
    if (confirm('¿Está seguro que desea eliminar este curso?')) {
      // Implement delete functionality when available in the service
      this.loadCursos();
    }
  }

  abrirformulario(curso: ICursoCapacitacion) {
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
