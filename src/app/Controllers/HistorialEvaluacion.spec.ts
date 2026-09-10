/**
 * Batería dura de T2 — controlador HistorialEvaluacion (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Controllers/HistorialEvaluacion.spec.ts
 */
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HistorialEvaluacion } from './HistorialEvaluacion';
import { DatosServiceService } from '../Services/datos-service.service';
import { LoggerService } from '../Services/logger.service';
import { Evaluacion } from './Evaluacion';
import { Periodos } from './Periodos';
import { Empleados } from './Empleados';
import { IEvaluacion } from '../Models/Evaluacion/IEvaluacion';

const resp = (data: any) => ({ exito: 1, mensaje: '', count: (data || []).length, data });

const ev = (o: Partial<IEvaluacion>): IEvaluacion => ({
  id: 1, periodId: 7, empleadoSecuencial: 525, totalCalculo: 93, fechaRepuestas: '2025-12-15',
  estadoevaluacion: 'Completado', puntuaciondesempenocolaborador: 90, puntuacioncompetenciacolaborador: 96,
  puntuaciondesempenosupervidor: 88, puntuacioncompetenciasupervisor: 95, totalcolaborador: 93, totalsupervisor: 91,
  entrevistaConSupervisor: true, ...o
} as IEvaluacion);

const EMPLEADOS = [
  { secuencial: 525, codigousuario: 'RALCANTARA', nombreunido: 'RHAY ALCANTARA', identificacion: '001-1', departamento: 'TI', cargo: 'DBA' },
  { secuencial: 55, codigousuario: 'PRODRIGUEZ', nombreunido: 'PABLO RODRIGUEZ', identificacion: '001-2', departamento: 'TI', cargo: 'GERENTE' }
];
const PERIODOS = [
  { id: 7, descripcion: 'Evaluación Final 2025', tipo: 'final_ano' },
  { id: 8, descripcion: 'Mitad de Año 2026', tipo: 'medio_ano' }
];

describe('HistorialEvaluacion (T2)', () => {
  let svc: HistorialEvaluacion;
  let datos: jasmine.SpyObj<DatosServiceService>;
  let evalCtl: jasmine.SpyObj<Evaluacion>;
  let perCtl: jasmine.SpyObj<Periodos>;
  let empCtl: jasmine.SpyObj<Empleados>;

  beforeEach(() => {
    datos = jasmine.createSpyObj<DatosServiceService>('datos', ['getdatos'], { URL: 'http://api' });
    evalCtl = jasmine.createSpyObj<Evaluacion>('eval', ['GetEvaluacionesPorEmpleado', 'Get']);
    perCtl = jasmine.createSpyObj<Periodos>('per', ['Gets']);
    empCtl = jasmine.createSpyObj<Empleados>('emp', ['Gets', 'Getsub', 'Get']);
    perCtl.Gets.and.returnValue(of(resp(PERIODOS)));
    empCtl.Gets.and.returnValue(of(resp(EMPLEADOS)));
    TestBed.configureTestingModule({
      providers: [
        HistorialEvaluacion,
        { provide: DatosServiceService, useValue: datos },
        { provide: LoggerService, useValue: jasmine.createSpyObj('log', ['debug', 'info', 'warn', 'error']) },
        { provide: Evaluacion, useValue: evalCtl },
        { provide: Periodos, useValue: perCtl },
        { provide: Empleados, useValue: empCtl }
      ]
    });
    svc = TestBed.inject(HistorialEvaluacion);
  });

  it('getHistorialPorEmpleado resuelve nombre, cédula, usuario y periodo real; orden desc; no usa Empleados.Get', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([
      ev({ id: 1, periodId: 7, fechaRepuestas: '2025-12-15' }),
      ev({ id: 2, periodId: 8, fechaRepuestas: '2026-07-10', estadoevaluacion: null as any, totalCalculo: 40 })
    ]));
    svc.getHistorialPorEmpleado(525).subscribe(h => {
      expect(h.map(x => x.evaluacionId)).toEqual([2, 1]);
      expect(h[1].empleadoNombre).toBe('RHAY ALCANTARA');
      expect(h[1].empleadoIdentificacion).toBe('001-1');
      expect(h[1].codigoUsuario).toBe('RALCANTARA');
      expect(h[1].departamento).toBe('TI');
      expect(h[1].periodoNombre).toBe('Evaluación Final 2025');
      expect(h[1].esMedioAno).toBeFalse();
      expect(h[0].periodoNombre).toBe('Mitad de Año 2026');
      expect(h[0].esMedioAno).toBeTrue();
      expect(h[0].estadoEvaluacion).toBe('SIN_INICIAR');
      expect(empCtl.Get).not.toHaveBeenCalled();
      expect(JSON.stringify(h)).not.toContain('N/A');
      done();
    });
  });

  it('empleado fuera del catálogo: usa ev.empleado o el fallback "Empleado N"', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([
      ev({ id: 1, empleadoSecuencial: 999 }),
      ev({ id: 2, empleadoSecuencial: 998, empleado: { secuencial: 998, nombreunido: 'EX EMPLEADO' } as any })
    ]));
    svc.getHistorialPorEmpleado(999).subscribe(h => {
      const a = h.find(x => x.evaluacionId === 1)!; const b = h.find(x => x.evaluacionId === 2)!;
      expect(a.empleadoNombre).toBe('Empleado 999');
      expect(b.empleadoNombre).toBe('EX EMPLEADO');
      done();
    });
  });

  it('catálogos se piden una sola vez (shareReplay) y limpiarCacheCatalogos los vuelve a pedir', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([ev({ id: 1 })]));
    svc.getHistorialPorEmpleado(525).subscribe(() => {
      svc.getHistorialPorEmpleado(525).subscribe(() => {
        svc.getCatalogos().subscribe(c => {
          expect(empCtl.Gets).toHaveBeenCalledTimes(1);
          expect(perCtl.Gets).toHaveBeenCalledTimes(1);
          expect(c.empleados.get(525)!.nombreunido).toBe('RHAY ALCANTARA');
          expect(c.periodos.get(8)!.tipo).toBe('medio_ano');
          svc.limpiarCacheCatalogos();
          svc.getCatalogos().subscribe(() => {
            expect(empCtl.Gets).toHaveBeenCalledTimes(2);
            expect(perCtl.Gets).toHaveBeenCalledTimes(2);
            done();
          });
        });
      });
    });
  });

  it('si falla el catálogo de empleados el historial sigue con fallbacks; si falla periodos, "Período N"', (done) => {
    empCtl.Gets.and.returnValue(throwError(() => new Error('500')));
    perCtl.Gets.and.returnValue(throwError(() => new Error('500')));
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([ev({ id: 1 })]));
    svc.getHistorialPorEmpleado(525).subscribe({
      next: h => {
        expect(h.length).toBe(1);
        expect(h[0].empleadoNombre).toBe('Empleado 525');
        expect(h[0].periodoNombre).toBe('Período 7');
        done();
      },
      error: () => { fail('no debe emitir error'); done(); }
    });
  });

  it('data null en catálogos → mapas vacíos sin explotar', (done) => {
    empCtl.Gets.and.returnValue(of(resp(null)));
    perCtl.Gets.and.returnValue(of(resp(null)));
    svc.getCatalogos().subscribe(c => {
      expect(c.empleados.size).toBe(0);
      expect(c.periodos.size).toBe(0);
      done();
    });
  });

  it('getHistorialSubordinados usa el objeto subordinado como empleado y pide catálogos una vez', (done) => {
    empCtl.Getsub.and.returnValue(of(resp([
      { secuencial: 525, nombreunido: 'RHAY ALCANTARA', identificacion: '001-1', codigousuario: 'RALCANTARA' },
      { secuencial: 700, nombreunido: 'SUBORDINADO SIN CATALOGO', identificacion: '001-7', codigousuario: 'SUB700' }
    ])));
    evalCtl.GetEvaluacionesPorEmpleado.and.callFake((sec: number) =>
      of([ev({ id: sec, empleadoSecuencial: sec, periodId: 8, fechaRepuestas: sec === 700 ? '2026-08-01' : '2026-07-01' })]));
    svc.getHistorialSubordinados(55, '2026-09-10').subscribe(h => {
      expect(empCtl.Getsub).toHaveBeenCalledWith('55', '2026-09-10');
      expect(h.map(x => x.evaluacionId)).toEqual([700, 525]);
      expect(h[0].empleadoNombre).toBe('SUBORDINADO SIN CATALOGO');
      expect(h[0].codigoUsuario).toBe('SUB700');
      expect(h[0].periodoNombre).toBe('Mitad de Año 2026');
      expect(h[0].esMedioAno).toBeTrue();
      expect(empCtl.Gets).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('getHistorialSubordinados sin subordinados → [] sin llamar evaluaciones', (done) => {
    empCtl.Getsub.and.returnValue(of(resp([])));
    svc.getHistorialSubordinados(55).subscribe(h => {
      expect(h).toEqual([]);
      expect(evalCtl.GetEvaluacionesPorEmpleado).not.toHaveBeenCalled();
      done();
    });
  });

  it('getHistorialSubordinados usa la fecha de hoy por defecto (yyyy-MM-dd)', (done) => {
    empCtl.Getsub.and.returnValue(of(resp(null)));
    svc.getHistorialSubordinados(55).subscribe(() => {
      const fecha = empCtl.Getsub.calls.mostRecent().args[1];
      expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      done();
    });
  });

  describe('getHistorialConFiltros', () => {
    const TODAS = [
      ev({ id: 1, empleadoSecuencial: 525, periodId: 7, estadoevaluacion: 'Completado', fechaRepuestas: '2025-12-15' }),
      ev({ id: 2, empleadoSecuencial: 55, periodId: 8, estadoevaluacion: null as any, fechaRepuestas: null as any }),
      ev({ id: 3, empleadoSecuencial: 55, periodId: 8, estadoevaluacion: 'Enviado', fechaRepuestas: '2026-07-20' }),
      ev({ id: 4, empleadoSecuencial: 525, periodId: 8, estadoevaluacion: '', fechaRepuestas: '2026-07-01' })
    ];
    beforeEach(() => datos.getdatos.and.returnValue(of(resp(TODAS))));

    it('pide /api/Evaluacions y sin filtros devuelve todo con nombres, orden desc, nulos al final', (done) => {
      svc.getHistorialConFiltros({}).subscribe(h => {
        expect(datos.getdatos).toHaveBeenCalledWith('http://api/api/Evaluacions');
        expect(h.map(x => x.evaluacionId)).toEqual([3, 4, 1, 2]);
        expect(h.find(x => x.evaluacionId === 3)!.empleadoNombre).toBe('PABLO RODRIGUEZ');
        expect(h.find(x => x.evaluacionId === 3)!.empleadoIdentificacion).toBe('001-2');
        done();
      });
    });
    it('estado SIN_INICIAR devuelve las de estado null y vacío', (done) => {
      svc.getHistorialConFiltros({ estadoEvaluacion: 'SIN_INICIAR' }).subscribe(h => {
        expect(h.map(x => x.evaluacionId).sort()).toEqual([2, 4]);
        done();
      });
    });
    it('estado Completado (valor real) filtra; "Completada" (valor viejo) no encuentra nada', (done) => {
      svc.getHistorialConFiltros({ estadoEvaluacion: 'Completado' }).subscribe(h => {
        expect(h.map(x => x.evaluacionId)).toEqual([1]);
        svc.getHistorialConFiltros({ estadoEvaluacion: 'Completada' }).subscribe(h2 => {
          expect(h2).toEqual([]);
          done();
        });
      });
    });
    it('periodo + empleado combinados', (done) => {
      svc.getHistorialConFiltros({ periodoId: 8, empleadoSecuencial: 55 }).subscribe(h => {
        expect(h.map(x => x.evaluacionId).sort()).toEqual([2, 3]);
        done();
      });
    });
    it('fechas: excluye las de fecha nula cuando hay filtro de fecha', (done) => {
      svc.getHistorialConFiltros({ fechaDesde: '2026-07-01', fechaHasta: '2026-07-31' }).subscribe(h => {
        expect(h.map(x => x.evaluacionId).sort()).toEqual([3, 4]);
        done();
      });
    });
    it('estado vacío o undefined no filtra', (done) => {
      svc.getHistorialConFiltros({ estadoEvaluacion: '' }).subscribe(h => {
        expect(h.length).toBe(4);
        done();
      });
    });
  });

  describe('compararEvaluaciones', () => {
    it('dos finales → comparación con nombres resueltos', (done) => {
      evalCtl.Get.and.callFake((id: string) => of(ev({ id: Number(id), periodId: 7, totalCalculo: id === '1' ? 80 : 90 })));
      svc.compararEvaluaciones(1, 2).subscribe(c => {
        expect(evalCtl.Get).toHaveBeenCalledWith('1');
        expect(evalCtl.Get).toHaveBeenCalledWith('2');
        expect(c.diferenciaTotal).toBe(10);
        expect(c.tendencia).toBe('mejora');
        expect(c.evaluacion1.empleadoNombre).toBe('RHAY ALCANTARA');
        expect(c.evaluacion1.periodoNombre).toBe('Evaluación Final 2025');
        done();
      });
    });
    it('una de medio año → error con el motivo exacto', (done) => {
      evalCtl.Get.and.callFake((id: string) => of(ev({ id: Number(id), periodId: id === '2' ? 8 : 7 })));
      svc.compararEvaluaciones(1, 2).subscribe({
        next: () => { fail('no debe emitir'); done(); },
        error: (e: Error) => {
          expect(e.message).toBe('Las evaluaciones de medio año no tienen puntuación comparable; seleccione dos evaluaciones finales');
          done();
        }
      });
    });
    it('misma evaluación → error', (done) => {
      evalCtl.Get.and.returnValue(of(ev({ id: 1 })));
      svc.compararEvaluaciones(1, 1).subscribe({
        next: () => { fail('no debe emitir'); done(); },
        error: (e: Error) => { expect(e.message).toBe('Seleccione dos evaluaciones distintas'); done(); }
      });
    });
  });

  it('estadísticas: medio año no promedia pero cuenta', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([
      ev({ id: 1, periodId: 7, totalCalculo: 93, fechaRepuestas: '2025-12-15' }),
      ev({ id: 2, periodId: 8, totalCalculo: 40, fechaRepuestas: '2026-07-10' })
    ]));
    svc.getEstadisticasEmpleado(525).subscribe(s => {
      expect(s.promedioGeneral).toBe(93);
      expect(s.totalEvaluaciones).toBe(2);
      expect(s.evaluacionesFinales).toBe(1);
      expect(s.evaluacionesMedioAno).toBe(1);
      expect(s.mejorEvaluacion!.evaluacionId).toBe(1);
      expect(s.evaluacionMasReciente.evaluacionId).toBe(2);
      expect(s.empleadoNombre).toBe('RHAY ALCANTARA');
      done();
    });
  });

  it('estadísticas sin evaluaciones → error del observable', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([]));
    svc.getEstadisticasEmpleado(525).subscribe({
      next: () => { fail('no debe emitir'); done(); },
      error: (e: Error) => { expect(e.message).toBe('No hay evaluaciones para este empleado'); done(); }
    });
  });

  it('evolución: solo finales, ascendente', (done) => {
    evalCtl.GetEvaluacionesPorEmpleado.and.returnValue(of([
      ev({ id: 3, periodId: 7, totalCalculo: 95, fechaRepuestas: '2025-12-15' }),
      ev({ id: 2, periodId: 8, totalCalculo: 40, fechaRepuestas: '2026-07-10' }),
      ev({ id: 1, periodId: 1, totalCalculo: 85, fechaRepuestas: '2024-12-15' })
    ]));
    svc.getDatosEvolucion(525).subscribe(d => {
      expect(d.map(x => x.totalCalculo)).toEqual([85, 95]);
      expect(d[1].periodo).toBe('Evaluación Final 2025');
      done();
    });
  });

  it('exportarHistorialAExcel delega en filasExcel (columna Tipo y medio año vacío)', () => {
    const filas = svc.exportarHistorialAExcel([
      { evaluacionId: 1, periodId: 8, periodoNombre: 'M', periodoTipo: 'medio_ano', esMedioAno: true, fechaInicio: '', fechaFin: '',
        empleadoSecuencial: 525, empleadoNombre: 'X', fechaRespuesta: '', estadoEvaluacion: 'Enviado', totalCalculo: 40,
        puntuacionDesempenoColaborador: 1, puntuacionCompetenciaColaborador: 1, puntuacionDesempenoSupervisor: 1,
        puntuacionCompetenciaSupervisor: 1, totalColaborador: 1, totalSupervisor: 1, entrevistaConSupervisor: false }
    ]);
    expect(filas[0]['Tipo']).toBe('Medio año');
    expect(filas[0]['Total']).toBe('');
    expect(filas[0]['Estado']).toBe('Enviado al colaborador');
  });
});
