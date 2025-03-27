// seleccion-kpi.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Kpi } from 'src/app/Controllers/Kpi';
import { IKpi } from 'src/app/Models/Kpi/IKpi';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-seleccion-kpi',
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
  templateUrl: './seleccion-kpi.component.html',
  styleUrls: ['./seleccion-kpi.component.css']
})
export class SeleccionKpiComponent implements OnInit {
  displayedColumns: string[] = ['descripcion', 'valor', 'inverso'];
  searchControl = new FormControl('');  
  selectedRow: IKpi | null = null;
  dataSource: MatTableDataSource<IKpi> = new MatTableDataSource<IKpi>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    public dialogRef: MatDialogRef<SeleccionKpiComponent>,
    private kpiService: Kpi
  ) {
    this.kpiService.TRegistros.subscribe(() => {
      this.dataSource = new MatTableDataSource(this.kpiService.arraymodel);
      this.dataSource.paginator = this.paginator;
      console.log(this.dataSource);
    });
  }

  ngOnInit(): void {
    this.loadKpis();
    this.setupSearch();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private loadKpis() {
    this.kpiService.getdatos();
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

  onRowClick(row: IKpi) {
    this.selectedRow = row;
  }

  confirmar() {
    this.dialogRef.close(this.selectedRow);
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
