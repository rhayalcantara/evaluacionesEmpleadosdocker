import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
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
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { MatSelectModule } from '@angular/material/select';

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
    FormsModule,
    MatSelectModule
  ]
})
export class EvaluacionDesempenoMetaComponent implements OnInit {
  displayedColumns: string[] = ['Empleado','Perspectiva','Tipo', 'descripcion', 'meta','peso', 'inverso', 'acciones', 'eliminar'];
 // dataSource: IEvaluacionDesempenoMeta[] = [];
  dataSources = new MatTableDataSource<IEvaluacionDesempenoMeta>();
  searchTerm: string = '';
  periodos: IPeriodo[] = [];
  periodoSeleccionado: number | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private dialog: MatDialog,
    public metaService: EvaluacionDesempenoMeta,
    private datosService: DatosServiceService,
    public periodosService: Periodos
  ) { 
    this.metaService.TRegistros.subscribe(() => {
     // console.table(this.metaService.arraymodel[0].evaluacion)
  //   this.dataSource = this.metaService.arraymodel;
      this.dataSources.data = this.metaService.arraymodel;
      this.dataSources.paginator = this.paginator;
      this.dataSources.sort = this.sort;
    });
    this.dataSources.filterPredicate = (data: IEvaluacionDesempenoMeta, filter: string) => {
      const dataStr = `${data.evaluacion!.empleado!.nombreunido} ${data.perspectiva} ${data.tipo} ${data.descripcion} ${data.meta} ${data.peso}`;
      return dataStr.toLowerCase().includes(filter);
    };
  }

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarDatos();
  }

  cargarDatos(): void {
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

  eliminar(meta: IEvaluacionDesempenoMeta): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro que desea eliminar este registro?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.metaService.Delete(meta.id).subscribe({
          next: () => {
            this.datosService.showMessage('Registro eliminado correctamente', 'Evaluación Desempeño Meta', 'success');
            this.cargarDatos();
          },
          error: (error) => {
            this.datosService.showMessage('Error al eliminar el registro: ' + error.message, 'Evaluación Desempeño Meta', 'error');
          }
        });
      }
    });
  }

  /**
   * Carga todos los periodos (activos e inactivos)
   */
  cargarPeriodos(): void {
    this.periodosService.getdatos();
    this.periodosService.TRegistros.subscribe(() => {
      this.periodos = this.periodosService.arraymodel;
    });
  }

  /**
   * Maneja el cambio de periodo seleccionado
   * @param periodoId - ID del periodo seleccionado
   */
  onPeriodoChange(periodoId: number | null): void {
    this.periodoSeleccionado = periodoId;

    if (periodoId) {
      this.metaService.getDatosPorPeriodo(periodoId);
    } else {
      // Si no hay periodo seleccionado, cargar todos
      this.cargarDatos();
    }
  }

  /**
   * Limpia el filtro de periodo
   */
  limpiarFiltroPeriodo(): void {
    this.periodoSeleccionado = null;
    this.cargarDatos();
  }
}
