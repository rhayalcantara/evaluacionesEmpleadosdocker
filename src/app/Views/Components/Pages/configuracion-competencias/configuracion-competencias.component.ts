import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { catchError, forkJoin, of } from 'rxjs';

import { Empleados } from 'src/app/Controllers/Empleados';
import { Metas } from 'src/app/Controllers/Metas';
import { Periodos } from 'src/app/Controllers/Periodos';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { IMetaDts } from 'src/app/Models/Meta/IMeta';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { ModelResponse } from 'src/app/Models/Usuario/modelResponse';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { LoggerService } from 'src/app/Services/logger.service';

import { CatalogoCategoriasComponent } from './tabs/catalogo-categorias/catalogo-categorias.component';
import { CompetenciasPuestoComponent } from './tabs/competencias-puesto/competencias-puesto.component';
import { DiagnosticoComponent } from './tabs/diagnostico/diagnostico.component';
import { PonderacionComponent } from './tabs/ponderacion/ponderacion.component';

/**
 * Pantalla única de "Configuración de Competencias" (solo rol Administrador).
 *
 * Es el contenedor (shell) de las cuatro pestañas del plan de rediseño del CRUD
 * de competencias. Su única responsabilidad es:
 *   1. Elegir el periodo sobre el que se trabaja (por defecto, el activo).
 *   2. Mostrar una franja de resumen con los contadores del periodo.
 *   3. Repartir el periodo elegido a cada pestaña por @Input y escuchar su
 *      @Output `cambios` para volver a calcular los contadores.
 *
 * Toda la lógica de datos vive en los Controllers de src/app/Controllers.
 */
@Component({
  selector: 'app-configuracion-competencias',
  templateUrl: './configuracion-competencias.component.html',
  styleUrls: ['./configuracion-competencias.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,
    CompetenciasPuestoComponent,
    CatalogoCategoriasComponent,
    PonderacionComponent,
    DiagnosticoComponent
  ]
})
export class ConfiguracionCompetenciasComponent implements OnInit {

  /** Periodos disponibles en el selector, del más reciente al más antiguo. */
  public periodos: IPeriodo[] = [];

  /** Id del periodo elegido; null mientras no se haya cargado ninguno. */
  public periodoSeleccionadoId: number | null = null;

  /** Periodo elegido completo, para la franja de resumen. */
  public periodoSeleccionado: IPeriodo | null = null;

  /** true cuando el periodo elegido es el periodo activo del sistema. */
  public periodoActivo: boolean = false;

  /** Contador: puestos distintos con al menos una competencia en el periodo. */
  public puestosConCompetencias: number = 0;

  /** Contador: puestos distintos ocupados por al menos un empleado activo. */
  public puestosConEmpleadosActivos: number = 0;

  public cargandoPeriodos: boolean = false;
  public cargandoResumen: boolean = false;

  private readonly titulo: string = 'Configuración de Competencias';

  constructor(
    private periodosController: Periodos,
    private metasController: Metas,
    private empleadosController: Empleados,
    private datosService: DatosServiceService,
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  /**
   * Carga la lista de periodos y preselecciona el activo.
   * Si ninguno está marcado como activo se toma el de id más alto.
   */
  private cargarPeriodos(): void {
    this.cargandoPeriodos = true;
    this.periodosController.Gets().subscribe({
      next: (rep: ModelResponse) => {
        this.cargandoPeriodos = false;
        const datos: IPeriodo[] = Array.isArray(rep?.data) ? rep.data : [];
        this.periodos = [...datos].sort((a, b) => b.id - a.id);

        if (this.periodos.length === 0) {
          this.logger.warn('Configuración de Competencias: el API no devolvió periodos');
          this.datosService.showMessage(
            'No hay periodos registrados. Cree un periodo antes de configurar competencias.',
            this.titulo,
            'warning'
          );
          return;
        }

        const activo = this.periodos.find(p => p.activa === true);
        this.periodoSeleccionadoId = activo ? activo.id : this.periodos[0].id;
        this.alCambiarPeriodo();
      },
      error: (err) => {
        this.cargandoPeriodos = false;
        this.logger.error('Configuración de Competencias: error cargando periodos', err);
        this.datosService.showMessage(
          'No se pudieron cargar los periodos: ' + (err?.message ?? 'error desconocido'),
          this.titulo,
          'error'
        );
      }
    });
  }

  /** Reacciona al cambio de periodo en el selector: actualiza el resumen. */
  public alCambiarPeriodo(): void {
    this.periodoSeleccionado = this.periodos.find(p => p.id === this.periodoSeleccionadoId) ?? null;
    this.periodoActivo = this.periodoSeleccionado?.activa === true;
    this.cargarResumen();
  }

  /**
   * Lo llaman las pestañas por su @Output `cambios` cuando crean, editan o
   * borran filas, para que los contadores no queden desfasados.
   */
  public alCambiarDatos(): void {
    this.cargarResumen();
  }

  /**
   * Recalcula los dos contadores de la franja de resumen.
   * Cada contador está aislado en su propio método para que se puedan afinar
   * (o sustituir por un endpoint dedicado) sin tocar el resto de la pantalla.
   * Si una de las dos consultas falla, la otra sigue mostrándose: el contador
   * caído queda en 0 y el error se registra en el LoggerService.
   */
  private cargarResumen(): void {
    if (!this.periodoSeleccionadoId) {
      this.puestosConCompetencias = 0;
      this.puestosConEmpleadosActivos = 0;
      return;
    }

    this.cargandoResumen = true;
    const periodoId = this.periodoSeleccionadoId;

    forkJoin({
      metas: this.metasController.getmetasperiodo(periodoId).pipe(
        catchError((err) => {
          this.logger.error('Configuración de Competencias: error leyendo las metas del periodo', err);
          return of([] as IMetaDts[]);
        })
      ),
      empleados: this.empleadosController.Gets().pipe(
        catchError((err) => {
          this.logger.error('Configuración de Competencias: error leyendo los empleados', err);
          return of({ exito: 0, mensaje: '', count: 0, data: [] } as ModelResponse);
        })
      )
    }).subscribe({
      next: (resultado) => {
        this.cargandoResumen = false;
        this.puestosConCompetencias = this.contarPuestosConCompetencias(resultado.metas);
        const empleados: IEmpleado[] = Array.isArray(resultado.empleados?.data) ? resultado.empleados.data : [];
        this.puestosConEmpleadosActivos = this.contarPuestosConEmpleadosActivos(empleados);
      },
      error: (err) => {
        this.cargandoResumen = false;
        this.logger.error('Configuración de Competencias: error calculando el resumen del periodo', err);
      }
    });
  }

  /**
   * Contador 1: puestos con competencias configuradas en el periodo.
   * Fuente: GET /api/Goals/periodo (controlador `Metas.getmetasperiodo`).
   * Se cuentan los `positionSecuencial` distintos, descartando el 0 (filas sin
   * puesto asignado, que no representan un puesto real).
   */
  private contarPuestosConCompetencias(metas: IMetaDts[]): number {
    const puestos = new Set<number>();
    (metas ?? [])
      .filter(m => !!m && m.positionSecuencial > 0)
      .forEach(m => puestos.add(m.positionSecuencial));
    return puestos.size;
  }

  /**
   * Contador 2: puestos con empleados activos.
   * Fuente: GET /api/Empleadoes (controlador `Empleados.Gets`).
   * Se cuentan los `scargo` distintos de los empleados con codigoestado = 'A'.
   *
   * NOTA PARA LA FASE 2 (T2.3 Diagnóstico): este conteo NO comprueba que el
   * `scargo` exista en el catálogo `positions` ni que su `categoriaPuestoId`
   * sea distinto de 0. Esos dos huecos son precisamente lo que debe listar la
   * pestaña de Diagnóstico; aquí solo se muestra el total de referencia contra
   * el que comparar el contador 1.
   */
  private contarPuestosConEmpleadosActivos(empleados: IEmpleado[]): number {
    const puestos = new Set<number>();
    (empleados ?? [])
      .filter(e => !!e && e.codigoestado === 'A' && e.scargo > 0)
      .forEach(e => puestos.add(e.scargo));
    return puestos.size;
  }
}
