/**
 * Batería dura de B5 — bitacora-resumen (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Views/Components/evaluacioncomponents/bitacora-resumen/bitacora-resumen.component.spec.ts
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { BitacoraResumenComponent } from './bitacora-resumen.component';
import { Bitacora } from 'src/app/Controllers/Bitacora';
import { IBitacoraResumenCompetencia } from 'src/app/Models/Bitacora/IBitacora';

const fila = (o: Partial<IBitacoraResumenCompetencia> = {}): IBitacoraResumenCompetencia => ({
  objetivoId: 60, nombre: 'Enfoque a resultados', grupo: 'Orientación', logros: 2, incumplimientos: 1, iniciativas: 0, conductas: 0, total: 3,
  eventos: [
    { id: 1, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-05', tipo: 'Logro', impacto: 'Alto', descripcion: 'Uno', activo: true, competencias: [], registradoPorNombre: 'PABLO' },
    { id: 2, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-06', tipo: 'Logro', impacto: 'Medio', descripcion: 'Dos', activo: true, competencias: [] },
    { id: 3, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-07', tipo: 'Incumplimiento', impacto: 'Bajo', descripcion: 'Tres', activo: true, competencias: [] }
  ], ...o
});

describe('BitacoraResumenComponent', () => {
  let bitacora: jasmine.SpyObj<Bitacora>;

  const crear = (inputs: Partial<BitacoraResumenComponent>): ComponentFixture<BitacoraResumenComponent> => {
    const f = TestBed.createComponent(BitacoraResumenComponent);
    Object.assign(f.componentInstance, inputs);
    const cambios: any = {};
    for (const k of Object.keys(inputs)) cambios[k] = new SimpleChange(undefined, (inputs as any)[k], true);
    f.componentInstance.ngOnChanges(cambios);
    f.detectChanges();
    return f;
  };

  beforeEach(() => {
    bitacora = jasmine.createSpyObj<Bitacora>('Bitacora', ['resumen', 'mensajeError']);
    bitacora.mensajeError.and.callFake((e: any) => e?.error?.mensaje ?? e?.message ?? 'Error desconocido');
    TestBed.configureTestingModule({ imports: [BitacoraResumenComponent], providers: [{ provide: Bitacora, useValue: bitacora }] });
    BitacoraResumenComponent.limpiarCache();
  });

  it('dos instancias con los mismos inputs hacen una sola petición; limpiarCache fuerza otra', () => {
    bitacora.resumen.and.returnValue(of([fila()]));
    crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 59 });
    expect(bitacora.resumen).toHaveBeenCalledTimes(1);
    BitacoraResumenComponent.limpiarCache();
    crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    expect(bitacora.resumen).toHaveBeenCalledTimes(2);
  });

  it('empareja por objetivoId y muestra el texto', () => {
    bitacora.resumen.and.returnValue(of([fila()]));
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    expect(f.componentInstance.texto).toBe('2 logros · 1 incumplimiento');
    expect(f.componentInstance.hayEventos).toBeTrue();
    expect((f.nativeElement as HTMLElement).textContent).toContain('2 logros · 1 incumplimiento');
    expect((f.nativeElement as HTMLElement).querySelector('button')?.textContent?.trim()).toBe('Ver');
  });

  it('empareja por nombre normalizado cuando no hay objetivoId', () => {
    bitacora.resumen.and.returnValue(of([fila()]));
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, nombreCompetencia: '  Enfoque a RESULTADOS ' });
    expect(f.componentInstance.fila?.objetivoId).toBe(60);
  });

  it('sin coincidencia o total 0 → Sin eventos y sin botón', () => {
    bitacora.resumen.and.returnValue(of([fila({ objetivoId: 99, nombre: 'Otra' }), fila({ objetivoId: 61, nombre: 'Flex', total: 0, logros: 0, incumplimientos: 0, eventos: [] })]));
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    expect(f.componentInstance.texto).toBe('Sin eventos');
    expect(f.componentInstance.hayEventos).toBeFalse();
    expect((f.nativeElement as HTMLElement).querySelector('button')).toBeNull();
    const g = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 61 });
    expect(g.componentInstance.texto).toBe('Sin eventos');
  });

  it('alternar muestra la lista; modo lista la muestra sin pulsar', () => {
    bitacora.resumen.and.returnValue(of([fila()]));
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('li').length).toBe(0);
    f.componentInstance.alternar(); f.detectChanges();
    expect(el.querySelectorAll('li').length).toBe(3);
    expect(el.textContent).toContain('05/09/2026');
    expect(el.querySelector('button')?.textContent?.trim()).toBe('Ocultar');
    const g = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60, modo: 'lista' });
    expect((g.nativeElement as HTMLElement).querySelectorAll('li').length).toBe(3);
  });

  it('error del API → mensaje y la caché olvida la clave', () => {
    bitacora.resumen.and.returnValue(throwError(() => ({ error: { mensaje: 'Caído' } })));
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    expect(f.componentInstance.error).toBe('Caído');
    expect((f.nativeElement as HTMLElement).textContent).toContain('Bitácora no disponible');
    bitacora.resumen.and.returnValue(of([fila()]));
    f.componentInstance.ngOnChanges({ periodoId: new SimpleChange(8, 8, false) });
    expect(bitacora.resumen).toHaveBeenCalledTimes(2);
  });

  it('inputs en 0 → sin llamada', () => {
    bitacora.resumen.and.returnValue(of([fila()]));
    const f = crear({ empleadoSecuencial: 0, periodoId: 8, objetivoId: 60 });
    expect(bitacora.resumen).not.toHaveBeenCalled();
    expect(f.componentInstance.fila).toBeNull();
    expect(f.componentInstance.error).toBe('');
  });

  it('muestra "Cargando" mientras espera', () => {
    const s = new Subject<IBitacoraResumenCompetencia[]>();
    bitacora.resumen.and.returnValue(s.asObservable());
    const f = crear({ empleadoSecuencial: 525, periodoId: 8, objetivoId: 60 });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Cargando');
    s.next([fila()]); s.complete(); f.detectChanges();
    expect(f.componentInstance.cargando).toBeFalse();
  });
});
