import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { HistorialEvaluacion } from '../../../../Controllers/HistorialEvaluacion';
import { SegurityService } from '../../../../Services/segurity.service';
import { DatosServiceService } from '../../../../Services/datos-service.service';
import { LoggerService } from '../../../../Services/logger.service';
import { Periodos } from '../../../../Controllers/Periodos';
import { ExcelService } from '../../../../Services/excel.service';

import {
  IHistorialEvaluacionResumen,
  IHistorialEvaluacionFiltros,
  IEstadisticasHistorial
} from '../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';

@Component({
  selector: 'app-historial-evaluaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule
  ],
  providers: [
    HistorialEvaluacion,
    ExcelService,
    LoggerService,
    DatosServiceService,
    SegurityService,
    Periodos
  ],
  templateUrl: './historial-evaluaciones.component.html',
  styleUrls: ['./historial-evaluaciones.component.css']
})
export class HistorialEvaluacionesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Datos
  historial: IHistorialEvaluacionResumen[] = [];
  historialFiltrado: IHistorialEvaluacionResumen[] = [];
  displayedHistorial: IHistorialEvaluacionResumen[] = [];
  periodosDisponibles: any[] = [];
  estadisticas: IEstadisticasHistorial | null = null;

  // Estado
  loading: boolean = false;
  mostrarEstadisticas: boolean = false;
  rolUsuario: string = '';
  empleadoSecuencialActual: number = 0;

  // Filtros
  filtros: IHistorialEvaluacionFiltros = {};
  textoBusqueda: string = '';

  // Paginación
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  pageIndex = 0;
  totalItems = 0;

  // Selección para comparación
  evaluacionesSeleccionadas: number[] = [];

  // Opciones de estado
  estadosDisponibles: string[] = [
    'Completada',
    'Pendiente',
    'En Proceso',
    'Aprobada',
    'Rechazada'
  ];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private historialController: HistorialEvaluacion,
    private segurityService: SegurityService,
    private datosService: DatosServiceService,
    private logger: LoggerService,
    private periodosController: Periodos,
    private excelService: ExcelService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.logger.info('Inicializando componente Historial de Evaluaciones');
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Inicializa el componente según el rol del usuario
   */
  private inicializarComponente(): void {
    // Obtener rol y empleado actual
    const rolJson = localStorage.getItem('rol') || '';

    // El rol puede venir como JSON o como string simple
    try {
      const rolObj = JSON.parse(rolJson);
      this.rolUsuario = rolObj.name || rolObj.rol || 'Usuario';
    } catch {
      // Si no es JSON, usar como está
      this.rolUsuario = rolJson || 'Usuario';
    }

    const empleadoJson = localStorage.getItem('empleado');
    if (empleadoJson) {
      try {
        const empleado = JSON.parse(empleadoJson);
        this.empleadoSecuencialActual = empleado.secuencial || 0;
      } catch (error) {
        this.logger.error('Error al parsear empleado de localStorage', error as Error);
      }
    }

    // Cargar períodos
    this.cargarPeriodos();

    // Cargar historial según rol
    this.cargarHistorial();
  }

  /**
   * Carga los períodos disponibles para filtrar
   */
  private cargarPeriodos(): void {
    const sub = this.periodosController.Gets().subscribe({
      next: (response) => {
        this.periodosDisponibles = response.data;
        this.logger.debug('Períodos cargados', { cantidad: this.periodosDisponibles.length });
      },
      error: (error) => {
        this.logger.error('Error al cargar períodos', error);
        this.datosService.showMessage('Error al cargar períodos', 'Error', 'error');
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Carga el historial según el rol del usuario
   */
  cargarHistorial(): void {
    this.loading = true;
    this.logger.info('Cargando historial', { rol: this.rolUsuario });

    let observable;

    switch (this.rolUsuario.toLowerCase()) {
      case 'admin':
      case 'administrador':
        // Admin puede ver todos, aplicar filtros si existen
        if (Object.keys(this.filtros).length > 0) {
          observable = this.historialController.getHistorialConFiltros(this.filtros);
        } else {
          // Cargar historial de todos (puede ser pesado, considerar paginación en backend)
          this.datosService.showMessage(
            'Como administrador, use los filtros para buscar evaluaciones específicas',
            'Información',
            'info'
          );
          this.loading = false;
          return;
        }
        break;

      case 'supervisor':
        // Supervisor ve historial de sus subordinados
        observable = this.historialController.getHistorialSubordinados(
          this.empleadoSecuencialActual
        );
        break;

      case 'empleado':
      default:
        // Empleado ve solo su historial
        observable = this.historialController.getHistorialPorEmpleado(
          this.empleadoSecuencialActual
        );
        break;
    }

    const sub = observable.subscribe({
      next: (historial) => {
        this.historial = historial;
        this.aplicarFiltrosLocales();
        this.loading = false;
        this.logger.info('Historial cargado', { cantidad: historial.length });

        if (historial.length === 0) {
          this.datosService.showMessage(
            'No se encontraron evaluaciones en el historial',
            'Sin Resultados',
            'info'
          );
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar historial', error);
        this.datosService.showMessage(
          'Error al cargar el historial de evaluaciones',
          'Error',
          'error'
        );
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Aplica filtros locales al historial cargado
   */
  private aplicarFiltrosLocales(): void {
    let resultado = [...this.historial];

    // Filtro por texto de búsqueda
    if (this.textoBusqueda.trim()) {
      const busqueda = this.textoBusqueda.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.empleadoNombre.toLowerCase().includes(busqueda) ||
          item.empleadoIdentificacion?.toLowerCase().includes(busqueda) ||
          item.periodoNombre.toLowerCase().includes(busqueda) ||
          item.departamento?.toLowerCase().includes(busqueda)
      );
    }

    this.historialFiltrado = resultado;
    this.totalItems = resultado.length;
    this.pageIndex = 0; // Resetear a primera página
    this.actualizarPaginacion();
  }

  /**
   * Actualiza los items mostrados según la paginación
   */
  private actualizarPaginacion(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedHistorial = this.historialFiltrado.slice(startIndex, endIndex);
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.actualizarPaginacion();
  }

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltros(): void {
    this.logger.debug('Aplicando filtros', this.filtros);

    if (this.rolUsuario.toLowerCase() === 'admin' || this.rolUsuario.toLowerCase() === 'administrador') {
      // Para admin, recargar con filtros desde el servidor
      this.cargarHistorial();
    } else {
      // Para otros roles, filtrar localmente
      this.aplicarFiltrosLocales();
    }
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtros = {};
    this.textoBusqueda = '';
    this.cargarHistorial();
  }

  /**
   * Maneja la búsqueda por texto
   */
  onBuscar(): void {
    this.aplicarFiltrosLocales();
  }

  /**
   * Obtiene la clase CSS según el estado de la evaluación
   */
  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('completada') || estadoLower.includes('aprobada')) {
      return 'estado-completada';
    } else if (estadoLower.includes('pendiente')) {
      return 'estado-pendiente';
    } else if (estadoLower.includes('proceso')) {
      return 'estado-proceso';
    } else if (estadoLower.includes('rechazada')) {
      return 'estado-rechazada';
    }
    return 'estado-default';
  }

  /**
   * Obtiene el color del badge según la puntuación
   */
  getPuntuacionClass(puntuacion: number): string {
    if (puntuacion >= 90) return 'puntuacion-excelente';
    if (puntuacion >= 80) return 'puntuacion-buena';
    if (puntuacion >= 70) return 'puntuacion-regular';
    return 'puntuacion-baja';
  }

  /**
   * Selecciona/deselecciona una evaluación para comparar
   */
  toggleSeleccion(evaluacionId: number): void {
    const index = this.evaluacionesSeleccionadas.indexOf(evaluacionId);

    if (index > -1) {
      this.evaluacionesSeleccionadas.splice(index, 1);
    } else {
      if (this.evaluacionesSeleccionadas.length >= 2) {
        this.datosService.showMessage(
          'Solo puede seleccionar 2 evaluaciones para comparar',
          'Información',
          'info'
        );
        return;
      }
      this.evaluacionesSeleccionadas.push(evaluacionId);
    }

    this.logger.debug('Evaluaciones seleccionadas', this.evaluacionesSeleccionadas);
  }

  /**
   * Verifica si una evaluación está seleccionada
   */
  estaSeleccionada(evaluacionId: number): boolean {
    return this.evaluacionesSeleccionadas.includes(evaluacionId);
  }

  /**
   * Compara las evaluaciones seleccionadas
   */
  compararEvaluaciones(): void {
    if (this.evaluacionesSeleccionadas.length !== 2) {
      this.datosService.showMessage(
        'Debe seleccionar exactamente 2 evaluaciones para comparar',
        'Información',
        'info'
      );
      return;
    }

    this.loading = true;
    const [id1, id2] = this.evaluacionesSeleccionadas;

    const sub = this.historialController.compararEvaluaciones(id1, id2).subscribe({
      next: (comparacion) => {
        this.loading = false;
        this.logger.info('Comparación generada', comparacion);

        // Mostrar resultados de comparación (podría ser un modal)
        const mensaje = `
          Diferencia Total: ${comparacion.diferenciaTotal.toFixed(2)}
          Diferencia Desempeño: ${comparacion.diferenciaDesempeno.toFixed(2)}
          Diferencia Competencias: ${comparacion.diferenciaCompetencia.toFixed(2)}
          Tendencia: ${comparacion.tendencia}
        `;

        this.datosService.showMessage(mensaje, 'Comparación de Evaluaciones', 'info');
      },
      error: (error) => {
        this.loading = false;
        this.logger.error('Error al comparar evaluaciones', error);
        this.datosService.showMessage('Error al comparar evaluaciones', 'Error', 'error');
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Muestra las estadísticas del empleado
   */
  mostrarEstadisticasEmpleado(empleadoSecuencial: number): void {
    this.loading = true;

    const sub = this.historialController.getEstadisticasEmpleado(empleadoSecuencial).subscribe({
      next: (stats) => {
        this.estadisticas = stats;
        this.mostrarEstadisticas = true;
        this.loading = false;
        this.logger.info('Estadísticas cargadas', stats);
      },
      error: (error) => {
        this.loading = false;
        this.logger.error('Error al cargar estadísticas', error);
        this.datosService.showMessage('Error al cargar estadísticas', 'Error', 'error');
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Exporta el historial a Excel
   */
  exportarExcel(): void {
    if (this.historialFiltrado.length === 0) {
      this.datosService.showMessage(
        'No hay datos para exportar',
        'Información',
        'info'
      );
      return;
    }

    try {
      this.logger.info('Exportando historial a Excel', { cantidad: this.historialFiltrado.length });

      const datosExcel = this.historialController.exportarHistorialAExcel(this.historialFiltrado);

      // Usar el servicio de Excel existente
      this.excelService.exportAsExcelFile(
        datosExcel,
        `Historial_Evaluaciones_${new Date().toISOString().split('T')[0]}`
      );

      this.datosService.showMessage(
        'Historial exportado exitosamente',
        'Exportación',
        'success'
      );
    } catch (error) {
      this.logger.error('Error al exportar a Excel', error as Error);
      this.datosService.showMessage('Error al exportar el historial', 'Error', 'error');
    }
  }

  /**
   * Navega a los detalles de una evaluación
   */
  verDetalle(evaluacionId: number): void {
    this.logger.debug('Ver detalle de evaluación', { evaluacionId });
    // Funcionalidad pendiente: navegación a detalle completo de evaluación
  }

  /**
   * Actualiza el historial (refresh)
   */
  refrescar(): void {
    this.evaluacionesSeleccionadas = [];
    this.mostrarEstadisticas = false;
    this.cargarHistorial();
  }
}
