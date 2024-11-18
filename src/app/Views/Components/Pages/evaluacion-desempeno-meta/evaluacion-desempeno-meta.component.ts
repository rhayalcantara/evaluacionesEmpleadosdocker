import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { IEvaluacionDesempenoMeta } from 'src/app/Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';
import { EvaluacionDesempenoMeta } from 'src/app/Controllers/EvaluacionDesempenoMeta';
import { FormEvaluacionDesempenoMetaComponent } from '../../Forms/form-evaluacion-desempeno-meta/form-evaluacion-desempeno-meta.component';

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
  displayedColumns: string[] = ['Empleado','Tipo', 'descripcion', 'meta', 'inverso', 'acciones'];
  dataSource: IEvaluacionDesempenoMeta[] = [];
  searchTerm: string = '';

  constructor(
    private dialog: MatDialog,
    public metaService: EvaluacionDesempenoMeta
  ) { 
    this.metaService.TRegistros.subscribe(() => {
      console.table(this.metaService.arraymodel);
      this.dataSource = this.metaService.arraymodel;
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.metaService.getdatos();
    this.dataSource = this.metaService.arraymodel;
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
    if (this.searchTerm.trim()) {
      this.metaService.filtro = this.searchTerm;
      this.metaService.filtrar();
    } else {
      this.cargarDatos();
    }
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarDatos();
  }
}
