import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';
import { FormEvaluacionDesempenoMetaComponent } from '../../Forms/form-evaluacion-desempeno-meta/form-evaluacion-desempeno-meta.component';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-evaluacion-desempeno-meta',
  templateUrl: './evaluacion-desempeno-meta.component.html',
  styleUrls: ['./evaluacion-desempeno-meta.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ]
})
export class EvaluacionDesempenoMetaComponent implements OnInit {
  displayedColumns: string[] = ['Empleado','Tipo', 'descripcion', 'meta','peso', 'inverso', 'acciones'];
 // dataSource: IEvaluacionDesempenoMeta[] = [];
  dataSources = new MatTableDataSource<IEvaluacionDesempenoMeta>();
  searchTerm: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private dialog: MatDialog,
    public metaService: EvaluacionDesempenoMeta
  ) { 
    this.metaService.TRegistros.subscribe(() => {
      console.table(this.metaService.arraymodel[0].evaluacion)
  //   this.dataSource = this.metaService.arraymodel;
      this.dataSources.data = this.metaService.arraymodel;
      this.dataSources.paginator = this.paginator;
      this.dataSources.sort = this.sort;
    });
    this.dataSources.filterPredicate = (data: IEvaluacionDesempenoMeta, filter: string) => {
      const dataStr = `${data.evaluacion!.empleado!.nombreunido} ${data.tipo} ${data.descripcion} ${data.meta} ${data.peso}`;
      return dataStr.toLowerCase().includes(filter);
    };
  }

  ngOnInit(): void {
    this.cargarDatos();

  }

  cargarDatos(): void {
    console.log('se llamao a getdatos')
    this.metaService.getdatos();
    //this.dataSource = this.metaService.arraymodel;
  }

  abrirFormulario(meta?: IEvaluacionDesempenoMeta): void {
    const dialogRef = this.dialog.open(FormEvaluacionDesempenoMetaComponent, {
      width: '600px',
      data: {
        model: meta || this.metaService.inicializamodelo()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  editar(meta: IEvaluacionDesempenoMeta): void {
    this.abrirFormulario(meta);
  }

  buscar(): void {

    this.dataSources.filter = this.searchTerm.trim().toLowerCase();
   
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarDatos();
  }
}
