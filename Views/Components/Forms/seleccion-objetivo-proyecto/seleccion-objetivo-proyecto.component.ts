// seleccion-objetivo-proyecto.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ObjetivoProyectoPerspectiva } from 'src/app/Controllers/ObjetivoProyectoPerspectiva';
import { IObjetivoProyectoPerspectiva } from 'src/app/Models/ObjetivoProyectoPerspectiva/IObjetivoProyectoPerspectiva';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-seleccion-objetivo-proyecto',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './seleccion-objetivo-proyecto.component.html',
  styleUrls: ['./seleccion-objetivo-proyecto.component.css']
})
export class SeleccionObjetivoProyectoComponent implements OnInit {
  displayedColumns: string[] = ['tipo', 'descripcion', 'valor'];
  searchControl = new FormControl('');  
  selectedRow: IObjetivoProyectoPerspectiva | null = null;
  dataSource: MatTableDataSource<IObjetivoProyectoPerspectiva> = new MatTableDataSource<IObjetivoProyectoPerspectiva>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    public dialogRef: MatDialogRef<SeleccionObjetivoProyectoComponent>,
    private objetivoService: ObjetivoProyectoPerspectiva
  ) {
    this.objetivoService.TRegistros.subscribe(() => {
      this.dataSource = new MatTableDataSource(this.objetivoService.arraymodel);
      this.dataSource.paginator = this.paginator;
      console.log(this.dataSource);
    });
  }

  ngOnInit(): void {
    this.loadObjetivos();
    this.setupSearch();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private loadObjetivos() {
    this.objetivoService.getdatos();
  }

  private setupSearch() {
    this.searchControl.valueChanges.subscribe(value => {
      this.applyFilter(value || '');
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();
    if (this.dataSource) {
      this.dataSource.filter = filterValue;
    }
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onRowClick(row: IObjetivoProyectoPerspectiva) {
    this.selectedRow = row;
  }

  confirmar() {
    this.dialogRef.close(this.selectedRow);
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
