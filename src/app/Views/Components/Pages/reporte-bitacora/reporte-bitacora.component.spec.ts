/**
 * Batería dura de B7 — reporte-bitacora (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Views/Components/Pages/reporte-bitacora/reporte-bitacora.component.spec.ts
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReporteBitacoraComponent } from './reporte-bitacora.component';
import { Bitacora } from 'src/app/Controllers/Bitacora';
import { Empleados } from 'src/app/Controllers/Empleados';
import { DatosServiceService } from 'src/app/Services/datos-service.service';
import { ExcelService } from 'src/app/Services/excel.service';
import { IBitacoraResumenEmpleado, IBitacoraEvento } from 'src/app/Models/Bitacora/IBitacora';
import { IEmpleado } from 'src/app/Models/Empleado/IEmpleado';
import { filasExcel } from 'src/app/Helpers/bitacora-utils';

const emp = (o: Partial<IEmpleado> = {}): IEmpleado => ({
  secuencial: 55, codigousuario: 'PRODRIGUEZ', nombreunido: 'PABLO RODRIGUEZ', identificacion: '001', sdept: 1, departamento: 'NEG', codigoestado: 'A',
  scargo: 1, cargo: 'GERENTE', esjefatura: 1, tienejefe: 1, nivel: 1, fechapostulacion: '', jefeinmediatO_SECUENCIAL: 1, jefeinmediato: '', oficina: 'SD', ...o
});
const fila = (o: Partial<IBitacoraResumenEmpleado> = {}): IBitacoraResumenEmpleado => ({
  empleadoSecuencial: 525, nombre: 'RHAY ALCANTARA', cargo: 'DBA', total: 3, logros: 2, incumplimientos: 1, iniciativas: 0, conductas: 0, ultimoEvento: '2026-09-10', ...o
});
const ev = (o: Partial<IBitacoraEvento> = {}): IBitacoraEvento => ({
  id: 1, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-05', fechaRegistro: '2026-09-06T09:00:00', tipo: 'Logro', impacto: 'Alto',
  descripcion: 'Situación: reunión de cierre. Acción: entregó el informe a tiempo. Resultado: aprobado.', activo: true, registradoPorNombre: 'PABLO',
  competencias: [{ id: 1, bitacoraEventoId: 1, objetivoId: 59, nombre: 'Enfoque al socio' }], ...o
});

describe('ReporteBitacoraComponent', () => {
  let bitacora: jasmine.SpyObj<Bitacora>; let empl: any; let excel: jasmine.SpyObj<ExcelService>; let datos: jasmine.SpyObj<DatosServiceService>;
  let fixture: ComponentFixture<ReporteBitacoraComponent>; let comp: ReporteBitacoraComponent;

  beforeEach(() => {
    bitacora = jasmine.createSpyObj<Bitacora>('Bitacora', ['equipo', 'resumen', 'listar', 'periodoActivo', 'filasExcel', 'mensajeError']);
    bitacora.equipo.and.returnValue(of([fila(), fila({ empleadoSecuencial: 526, nombre: 'ANA PEREZ', total: 0, logros: 0, incumplimientos: 0, ultimoEvento: null })]));
    bitacora.resumen.and.returnValue(of([{ objetivoId: 59, nombre: 'Enfoque al socio', grupo: 'G1', logros: 2, incumplimientos: 1, iniciativas: 0, conductas: 0, total: 3, eventos: [ev()] }]));
    bitacora.listar.and.returnValue(of([ev()]));
    bitacora.periodoActivo.and.returnValue(of({ id: 8, descripcion: 'Medio', fechaInicio: '2026-06-01T00:00:00', fechaFin: '2026-12-31T00:00:00', tipo: 'medio_ano' }));
    bitacora.filasExcel.and.callFake((l: IBitacoraEvento[], n: string) => filasExcel(l, n));
    bitacora.mensajeError.and.callFake((e: any) => e?.error?.mensaje ?? e?.message ?? 'Error desconocido');
    empl = {
      Gets: jasmine.createSpy('Gets').and.returnValue(of({ exito: 200, mensaje: '', count: 3, data: [
        emp({ secuencial: 90, nombreunido: 'ZOILA JEFA', esjefatura: 1 }), emp(), emp({ secuencial: 525, nombreunido: 'RHAY', esjefatura: 0 })] })),
      GetByUsuario: jasmine.createSpy('GetByUsuario').and.returnValue(of(emp()))
    };
    excel = jasmine.createSpyObj<ExcelService>('ExcelService', ['exportAsExcelFile']);
    datos = jasmine.createSpyObj<DatosServiceService>('DatosServiceService', ['showMessage']);
    TestBed.configureTestingModule({ imports: [ReporteBitacoraComponent], providers: [
      { provide: Bitacora, useValue: bitacora }, { provide: Empleados, useValue: empl }, { provide: ExcelService, useValue: excel }, { provide: DatosServiceService, useValue: datos }] });
    localStorage.setItem('usuario', JSON.stringify({ codigo: 'PRODRIGUEZ' }));
    localStorage.setItem('periodo', JSON.stringify({ id: 8, fechaInicio: '2026-06-01T00:00:00', fechaFin: '2026-12-31T00:00:00' }));
  });
  afterEach(() => { localStorage.removeItem('usuario'); localStorage.removeItem('periodo'); localStorage.removeItem('rol'); });
  const iniciar = () => { fixture = TestBed.createComponent(ReporteBitacoraComponent); comp = fixture.componentInstance; fixture.detectChanges(); };

  it('admin: solo jefaturas ordenadas y no consulta sola', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 1 }));
    iniciar();
    expect(comp.esAdmin).toBeTrue();
    expect(comp.supervisores.map(s => s.secuencial)).toEqual([55, 90]);
    expect(bitacora.equipo).not.toHaveBeenCalled();
  });

  it('supervisor: solo él y consulta al iniciar con el rango del periodo', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    iniciar();
    expect(comp.esAdmin).toBeFalse();
    expect(comp.supervisores.map(s => s.secuencial)).toEqual([55]);
    expect(comp.supervisorSel).toBe(55);
    expect(bitacora.equipo).toHaveBeenCalledWith(55, '2026-06-01', '2026-12-31');
    expect(comp.filas.length).toBe(2);
  });

  it('sin rol ni periodo: se trata como supervisor y usa periodoActivo', () => {
    localStorage.removeItem('periodo');
    iniciar();
    expect(comp.esAdmin).toBeFalse();
    expect(bitacora.periodoActivo).toHaveBeenCalled();
    expect(comp.periodoId).toBe(8);
    expect(comp.rango).toEqual({ desde: '2026-06-01', hasta: '2026-12-31' });
  });

  it('consultar con inputs vacíos manda null', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 1 }));
    iniciar();
    comp.supervisorSel = 90; comp.rango = { desde: '', hasta: '' };
    comp.consultar();
    expect(bitacora.equipo).toHaveBeenCalledWith(90, null, null);
  });

  it('totales suma filas y cuenta conEventos', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    iniciar();
    expect(comp.totales).toEqual({ logros: 2, incumplimientos: 1, iniciativas: 0, conductas: 0, total: 3, colaboradores: 2, conEventos: 1 });
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr.sin-eventos').length).toBe(1);
  });

  it('verDetalle llena detalle y cerrarDetalle lo anula', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    iniciar();
    comp.verDetalle(comp.filas[0]); fixture.detectChanges();
    expect(bitacora.resumen).toHaveBeenCalledWith(525, 8);
    expect(bitacora.listar).toHaveBeenCalledWith(jasmine.objectContaining({ empleadoSecuencial: 525, desde: '2026-06-01', hasta: '2026-12-31' }));
    expect(comp.detalle?.empleado.empleadoSecuencial).toBe(525);
    expect(comp.detalle?.competencias.length).toBe(1);
    expect(comp.detalle?.eventos.length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('.detalle')).not.toBeNull();
    comp.cerrarDetalle(); fixture.detectChanges();
    expect(comp.detalle).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.detalle')).toBeNull();
  });

  it('exportarEquipo produce las 8 claves y el nombre esperado', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    iniciar();
    comp.exportarEquipo();
    const [filas, nombre] = excel.exportAsExcelFile.calls.mostRecent().args;
    expect(Object.keys(filas[0])).toEqual(['Colaborador', 'Cargo', 'Logros', 'Incumplimientos', 'Iniciativas', 'Conductas', 'Total', 'Último evento']);
    expect(filas[0]['Último evento']).toBe('10/09/2026');
    expect(filas[1]['Último evento']).toBe('');
    expect(nombre).toBe('bitacora_equipo_55');
  });

  it('exportarDetalle usa filasExcel con el nombre del colaborador', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    iniciar(); comp.verDetalle(comp.filas[0]);
    comp.exportarDetalle();
    const [filas, nombre] = excel.exportAsExcelFile.calls.mostRecent().args;
    expect(filas[0]['Colaborador']).toBe('RHAY ALCANTARA');
    expect(nombre).toBe('bitacora_525');
  });

  it('error de equipo deja error y cargando=false', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    bitacora.equipo.and.returnValue(throwError(() => ({ error: { mensaje: 'Caído' } })));
    iniciar();
    expect(comp.error).toBe('Caído'); expect(comp.cargando).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Caído');
  });

  it('elegir supervisor en el select mantiene supervisorSel como number (ronda 4)', async () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 1 }));
    iniciar(); await fixture.whenStable(); fixture.detectChanges();
    const sel = (fixture.nativeElement as HTMLElement).querySelector('select') as HTMLSelectElement;
    const idx = Array.from(sel.options).findIndex(o => /ZOILA/.test(o.textContent || ''));
    sel.selectedIndex = idx; sel.dispatchEvent(new Event('change')); fixture.detectChanges(); await fixture.whenStable();
    expect(typeof comp.supervisorSel).toBe('number');
    expect(comp.supervisorSel).toBe(90);
    comp.consultar();
    expect(bitacora.equipo.calls.mostRecent().args[0]).toBe(90);
  });

  it('sin filas tras consultar muestra el mensaje', () => {
    localStorage.setItem('rol', JSON.stringify({ rolId: 2 }));
    bitacora.equipo.and.returnValue(of([]));
    iniciar();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin colaboradores o sin eventos en el rango.');
  });
});
