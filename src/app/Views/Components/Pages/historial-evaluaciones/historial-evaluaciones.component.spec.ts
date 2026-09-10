/**
 * Batería dura de T3 — componente historial-evaluaciones (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Views/Components/Pages/historial-evaluaciones/historial-evaluaciones.component.spec.ts
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { HistorialEvaluacionesComponent } from './historial-evaluaciones.component';
import { HistorialEvaluacion } from '../../../../Controllers/HistorialEvaluacion';
import { SegurityService } from '../../../../Services/segurity.service';
import { DatosServiceService } from '../../../../Services/datos-service.service';
import { LoggerService } from '../../../../Services/logger.service';
import { Periodos } from '../../../../Controllers/Periodos';
import { ExcelService } from '../../../../Services/excel.service';
import { ESTADOS_EVALUACION } from '../../../../Helpers/historial-utils';
import { IHistorialEvaluacionResumen } from '../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';

const fila = (o: Partial<IHistorialEvaluacionResumen>): IHistorialEvaluacionResumen => ({
  evaluacionId: 1, periodId: 7, periodoNombre: 'Evaluación Final 2025', periodoTipo: 'final_ano', esMedioAno: false,
  fechaInicio: '', fechaFin: '', empleadoSecuencial: 525, empleadoNombre: 'RHAY ALCANTARA',
  empleadoIdentificacion: '001-1234567-8', codigoUsuario: 'RALCANTARA', departamento: 'TI', puesto: 'DBA',
  fechaRespuesta: '2025-12-15', estadoEvaluacion: 'Completado', totalCalculo: 93.5,
  puntuacionDesempenoColaborador: 90, puntuacionCompetenciaColaborador: 97, puntuacionDesempenoSupervisor: 88,
  puntuacionCompetenciaSupervisor: 95, totalColaborador: 93.5, totalSupervisor: 91.5, entrevistaConSupervisor: true, ...o
});
const FINAL = fila({ evaluacionId: 1 });
const MEDIO = fila({ evaluacionId: 2, periodId: 8, periodoNombre: 'Mitad de Año 2026', periodoTipo: 'medio_ano', esMedioAno: true,
  fechaRespuesta: '2026-07-10', estadoEvaluacion: 'EvaluadoPorSupervisor', totalCalculo: 40 });
const OTRO = fila({ evaluacionId: 3, empleadoSecuencial: 55, empleadoNombre: 'PABLO RODRÍGUEZ', codigoUsuario: 'PRODRIGUEZ',
  empleadoIdentificacion: '001-9', estadoEvaluacion: 'SIN_INICIAR', fechaRespuesta: '2025-12-10' });
const OTRO_FINAL = fila({ evaluacionId: 4, empleadoSecuencial: 55, empleadoNombre: 'PABLO RODRÍGUEZ', fechaRespuesta: '2024-12-10', totalCalculo: 80 });

describe('HistorialEvaluacionesComponent (T3)', () => {
  let fixture: ComponentFixture<HistorialEvaluacionesComponent>;
  let comp: HistorialEvaluacionesComponent;
  let ctl: jasmine.SpyObj<HistorialEvaluacion>;
  let datos: jasmine.SpyObj<DatosServiceService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    ctl = jasmine.createSpyObj<HistorialEvaluacion>('ctl', ['getHistorialPorEmpleado', 'getHistorialSubordinados',
      'getHistorialConFiltros', 'compararEvaluaciones', 'getEstadisticasEmpleado', 'getDatosEvolucion', 'exportarHistorialAExcel']);
    ctl.getHistorialSubordinados.and.returnValue(of([MEDIO, FINAL, OTRO, OTRO_FINAL]));
    datos = jasmine.createSpyObj<DatosServiceService>('datos', ['showMessage']);
    dialog = jasmine.createSpyObj<MatDialog>('dialog', ['open']);
    const seg = jasmine.createSpyObj<SegurityService>('seg', ['getRolId']);
    seg.getRolId.and.returnValue(2); // Supervisor
    localStorage.setItem('empleado', JSON.stringify({ secuencial: 55 }));
    const per = jasmine.createSpyObj<Periodos>('per', ['Gets']);
    per.Gets.and.returnValue(of({ exito: 1, mensaje: '', count: 2, data: [
      { id: 7, descripcion: 'Evaluación Final 2025', tipo: 'final_ano' }, { id: 8, descripcion: 'Mitad de Año 2026', tipo: 'medio_ano' }] }));
    const log = jasmine.createSpyObj<LoggerService>('log', ['debug', 'info', 'warn', 'error']);
    const excel = jasmine.createSpyObj<ExcelService>('excel', ['exportAsExcelFile']);
    const provs = [
      { provide: HistorialEvaluacion, useValue: ctl }, { provide: SegurityService, useValue: seg },
      { provide: DatosServiceService, useValue: datos }, { provide: LoggerService, useValue: log },
      { provide: Periodos, useValue: per }, { provide: ExcelService, useValue: excel }, { provide: MatDialog, useValue: dialog }
    ];
    await TestBed.configureTestingModule({ imports: [HistorialEvaluacionesComponent, NoopAnimationsModule], providers: provs })
      .overrideComponent(HistorialEvaluacionesComponent, { set: { providers: provs } })
      .compileComponents();
    fixture = TestBed.createComponent(HistorialEvaluacionesComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => localStorage.removeItem('empleado'));

  const filas = () => Array.from(fixture.nativeElement.querySelectorAll('table.historial-table tbody tr')) as HTMLElement[];
  const filaDe = (id: number) => filas().find(tr => tr.querySelector('input[type="checkbox"]') && comp.displayedHistorial[filas().indexOf(tr)].evaluacionId === id)!;

  it('carga como supervisor y muestra 4 filas con nombre e identificación', () => {
    expect(ctl.getHistorialSubordinados).toHaveBeenCalledWith(55);
    expect(comp.rolUsuario).toBe('supervisor');
    expect(filas().length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('RHAY ALCANTARA');
    expect(fixture.nativeElement.textContent).toContain('001-1234567-8');
    expect(fixture.nativeElement.textContent).not.toContain('N/A');
  });

  it('el filtro de estado ofrece exactamente los estados reales con etiqueta', () => {
    expect(comp.estadosDisponibles).toBe(ESTADOS_EVALUACION);
    expect(comp.estadosDisponibles.map(e => e.valor)).toEqual(['Borrador', 'AutoEvaluado', 'EvaluadoPorSupervisor', 'Enviado', 'Completado', 'SIN_INICIAR']);
    const html: string = fixture.nativeElement.querySelector('mat-select') ? fixture.nativeElement.innerHTML : '';
    expect(html).not.toContain('Completada');
    expect(html).not.toContain('Aprobada');
  });

  it('el badge de estado muestra la etiqueta, no el valor crudo, y la clase nueva', () => {
    const texto: string = fixture.nativeElement.textContent;
    expect(texto).toContain('Evaluado por supervisor');
    expect(texto).toContain('Sin iniciar');
    expect(texto).not.toContain('EvaluadoPorSupervisor');
    expect(texto).not.toContain('SIN_INICIAR');
    expect(comp.getEstadoClass('Completado')).toBe('estado-completado');
    expect(comp.getEstadoClass(null as any)).toBe('estado-sin-iniciar');
    expect(comp.etiquetaEstado('Enviado')).toBe('Enviado al colaborador');
  });

  it('fila de medio año: clase, badge, sin números y checkbox deshabilitado', () => {
    const tr = filaDe(2);
    expect(tr.classList.contains('fila-medio-ano')).toBeTrue();
    expect(tr.getAttribute('data-tipo')).toBe('medio_ano');
    expect(tr.textContent).toContain('Medio año');
    expect((tr.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBeTrue();
    expect(tr.querySelectorAll('.sin-puntuacion').length).toBe(3);
    expect(tr.textContent).not.toContain('40.00');
    const trFinal = filaDe(1);
    expect(trFinal.classList.contains('fila-medio-ano')).toBeFalse();
    expect((trFinal.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBeFalse();
    expect(trFinal.textContent).toContain('93.50');
    expect(trFinal.querySelectorAll('.sin-puntuacion').length).toBe(0);
  });

  it('búsqueda por secuencial, usuario y nombre sin acentos', () => {
    comp.textoBusqueda = '525'; comp.onBuscar();
    expect(comp.historialFiltrado.map(x => x.evaluacionId).sort()).toEqual([1, 2]);
    comp.textoBusqueda = 'prodriguez'; comp.onBuscar();
    expect(comp.historialFiltrado.map(x => x.evaluacionId).sort()).toEqual([3, 4]);
    comp.textoBusqueda = 'rodriguez'; comp.onBuscar();
    expect(comp.historialFiltrado.length).toBe(2);
    comp.textoBusqueda = ''; comp.onBuscar();
    expect(comp.historialFiltrado.length).toBe(4);
  });

  it('filtro local por estado real y SIN_INICIAR; periodo undefined no filtra', () => {
    comp.filtros = { estadoEvaluacion: 'SIN_INICIAR' }; comp.aplicarFiltros();
    expect(comp.historialFiltrado.map(x => x.evaluacionId)).toEqual([3]);
    comp.filtros = { estadoEvaluacion: 'Completado' }; comp.aplicarFiltros();
    expect(comp.historialFiltrado.map(x => x.evaluacionId).sort()).toEqual([1, 4]);
    comp.filtros = { estadoEvaluacion: 'Completada' }; comp.aplicarFiltros();
    expect(comp.historialFiltrado.length).toBe(0);
    comp.filtros = { periodoId: undefined, estadoEvaluacion: undefined }; comp.aplicarFiltros();
    expect(comp.historialFiltrado.length).toBe(4);
    comp.filtros = { periodoId: 8 }; comp.aplicarFiltros();
    expect(comp.historialFiltrado.map(x => x.evaluacionId)).toEqual([2]);
  });

  it('toggleSeleccion rechaza medio año con aviso y permite finales', () => {
    comp.toggleSeleccion(2);
    expect(comp.evaluacionesSeleccionadas).toEqual([]);
    expect(datos.showMessage).toHaveBeenCalledWith('Las evaluaciones de medio año no se comparan', 'Información', 'info');
    comp.toggleSeleccion(1); comp.toggleSeleccion(4);
    expect(comp.evaluacionesSeleccionadas).toEqual([1, 4]);
    comp.toggleSeleccion(1);
    expect(comp.evaluacionesSeleccionadas).toEqual([4]);
  });

  it('compararEvaluaciones con medio año avisa y no llama al controlador; con finales sí', () => {
    comp.evaluacionesSeleccionadas = [1, 2];
    comp.compararEvaluaciones();
    expect(ctl.compararEvaluaciones).not.toHaveBeenCalled();
    expect(datos.showMessage).toHaveBeenCalledWith(
      'Las evaluaciones de medio año no tienen puntuación comparable; seleccione dos evaluaciones finales', 'Información', 'info');
    ctl.compararEvaluaciones.and.returnValue(of({ evaluacion1: FINAL, evaluacion2: OTRO_FINAL, diferenciaTotal: -13.5,
      diferenciaDesempeno: 0, diferenciaCompetencia: 0, tendencia: 'decline' }));
    comp.evaluacionesSeleccionadas = [1, 4];
    comp.compararEvaluaciones();
    expect(ctl.compararEvaluaciones).toHaveBeenCalledWith(1, 4);
    expect(dialog.open).toHaveBeenCalled();
    expect(comp.evaluacionesSeleccionadas).toEqual([]);
  });

  it('el error del controlador al comparar se muestra con su mensaje', () => {
    ctl.compararEvaluaciones.and.returnValue(throwError(() => new Error('Seleccione dos evaluaciones distintas')));
    comp.evaluacionesSeleccionadas = [1, 4];
    comp.compararEvaluaciones();
    expect(datos.showMessage).toHaveBeenCalledWith('Seleccione dos evaluaciones distintas', 'Error', 'error');
    expect(comp.loading).toBeFalse();
  });

  it('panel de estadísticas: conteo finales/medio año y mensaje sin finales', () => {
    ctl.getEstadisticasEmpleado.and.returnValue(of({ empleadoSecuencial: 525, empleadoNombre: 'RHAY ALCANTARA', totalEvaluaciones: 2,
      evaluacionesFinales: 1, evaluacionesMedioAno: 1, promedioGeneral: 93.5, mejorEvaluacion: FINAL, evaluacionMasReciente: MEDIO,
      tendenciaGeneral: 'estable', promedioDesempeno: 90, promedioCompetencias: 97 }));
    comp.mostrarEstadisticasEmpleado(525);
    fixture.detectChanges();
    let texto: string = fixture.nativeElement.textContent;
    expect(comp.hayFinalesEnEstadisticas).toBeTrue();
    expect(texto).toContain('Finales: 1');
    expect(texto).toContain('Medio año: 1');
    expect(texto).toContain('93.50');
    expect(texto).not.toContain('Sin evaluaciones finales puntuables');

    ctl.getEstadisticasEmpleado.and.returnValue(of({ empleadoSecuencial: 525, empleadoNombre: 'RHAY ALCANTARA', totalEvaluaciones: 1,
      evaluacionesFinales: 0, evaluacionesMedioAno: 1, promedioGeneral: 0, mejorEvaluacion: null, evaluacionMasReciente: MEDIO,
      tendenciaGeneral: 'estable', promedioDesempeno: 0, promedioCompetencias: 0 }));
    comp.mostrarEstadisticasEmpleado(525);
    fixture.detectChanges();
    texto = fixture.nativeElement.textContent;
    expect(comp.hayFinalesEnEstadisticas).toBeFalse();
    expect(texto).toContain('Sin evaluaciones finales puntuables');
    expect(texto).not.toContain('Promedio General');
  });

  it('el botón de estadísticas se muestra para supervisor (rol en minúsculas)', () => {
    expect(fixture.nativeElement.querySelectorAll('button[color="warn"]').length).toBe(4);
  });
});
