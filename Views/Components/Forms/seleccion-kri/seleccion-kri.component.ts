// seleccion-kri.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Kri } from 'src/app/Controllers/Kri';
import { IKri } from 'src/app/Models/Kri/IKri';
// ultimos cambios
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'app-seleccion-kri',
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
  templateUrl: './seleccion-kri.component.html',
  styleUrls: ['./seleccion-kri.component.css']
})
export class SeleccionKriComponent implements OnInit {
  displayedColumns: string[] = [ 'descripcion'];
  searchControl = new FormControl('');  
  selectedRow: IKri | null = null;
  dataSource: MatTableDataSource<IKri>= new MatTableDataSource<IKri>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    public dialogRef: MatDialogRef<SeleccionKriComponent>,
    private kriService: Kri
  ) {
      this.kriService.TRegistros.subscribe(() => {
        
        this.dataSource = new MatTableDataSource(this.kriService.arraymodel);
        this.dataSource.paginator = this.paginator;
        console.log(this.dataSource);
      })
  }

  ngOnInit(): void {
    this.loadKris();
    this.setupSearch();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private loadKris() {
    this.kriService.getdatos();
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

  onRowClick(row: IKri) {
    this.selectedRow = row;
  }

  confirmar() {
    this.dialogRef.close(this.selectedRow);
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}