/**
 * Batería dura de B2 — bitacora-utils (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Helpers/bitacora-utils.spec.ts
 */
import {
  fechaISO, hoyISO, normalizarTexto, eventoNuevo, validarEvento, etiquetaTipo, claseTipo, claseImpacto,
  alternarCompetencia, tieneCompetencia, agruparCompetencias, nombresCompetencias, filtrarEventos,
  ordenarEventos, contarPorTipo, textoResumen, fechaCorta, filasExcel, rangoPeriodo
} from './bitacora-utils';
import { IBitacoraEvento, ICompetenciaCatalogo, DESCRIPCION_MIN, DESCRIPCION_MAX } from '../Models/Bitacora/IBitacora';

const AHORA = new Date(2026, 8, 11, 10, 0, 0); // 2026-09-11 local
const DESC = 'Situación: reunión de cierre. Acción: entregó el informe a tiempo. Resultado: aprobado.';

const ev = (o: Partial<IBitacoraEvento> = {}): IBitacoraEvento => ({
  id: 1, empleadoSecuencial: 525, registradoPorSecuencial: 55, fechaEvento: '2026-09-05',
  fechaRegistro: '2026-09-06T09:30:00', fechaModificacion: null, tipo: 'Logro', impacto: 'Alto',
  descripcion: DESC, activo: true, registradoPorNombre: 'PABLO RODRIGUEZ',
  competencias: [{ id: 1, bitacoraEventoId: 1, objetivoId: 59, nombre: 'Enfoque al socio', grupo: 'Orientación al Socio' }],
  ...o
});

describe('bitacora-utils · fechas y texto', () => {
  it('fechaISO usa la fecha local y no corre por UTC', () => {
    expect(fechaISO(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(fechaISO('2026-09-05T00:00:00')).toBe('2026-09-05');
    expect(fechaISO('2026-09-05')).toBe('2026-09-05');
    expect(fechaISO('x')).toBe('');
    expect(fechaISO(null)).toBe('');
    expect(fechaISO(undefined)).toBe('');
  });
  it('hoyISO acepta el ahora', () => {
    expect(hoyISO(AHORA)).toBe('2026-09-11');
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('normalizarTexto quita acentos, mayúsculas y espacios', () => {
    expect(normalizarTexto('  Flexibilidad y   adaptación ')).toBe('flexibilidad y adaptacion');
    expect(normalizarTexto('Enfoque al Socio')).toBe(normalizarTexto('enfoque al socio'));
    expect(normalizarTexto(null)).toBe('');
  });
  it('fechaCorta pasa a DD/MM/YYYY', () => {
    expect(fechaCorta('2026-09-05')).toBe('05/09/2026');
    expect(fechaCorta('2026-09-05T10:00:00')).toBe('05/09/2026');
    expect(fechaCorta('')).toBe('');
    expect(fechaCorta(null)).toBe('');
  });
  it('rangoPeriodo devuelve desde/hasta o vacío', () => {
    expect(rangoPeriodo({ fechaInicio: '2026-06-01T00:00:00', fechaFin: new Date(2026, 11, 31) })).toEqual({ desde: '2026-06-01', hasta: '2026-12-31' });
    expect(rangoPeriodo(null)).toEqual({ desde: '', hasta: '' });
    expect(rangoPeriodo({ fechaInicio: 'x', fechaFin: null })).toEqual({ desde: '', hasta: '' });
  });
});

describe('bitacora-utils · eventoNuevo y validarEvento', () => {
  it('eventoNuevo trae valores por defecto', () => {
    const n = eventoNuevo(525, 55, AHORA);
    expect(n.id).toBe(0); expect(n.empleadoSecuencial).toBe(525); expect(n.registradoPorSecuencial).toBe(55);
    expect(n.fechaEvento).toBe('2026-09-11'); expect(n.tipo).toBe('Logro'); expect(n.impacto).toBe('Medio');
    expect(n.competencias).toEqual([]); expect(n.activo).toBeTrue(); expect(n.descripcion).toBe('');
  });
  it('evento válido pasa', () => {
    expect(validarEvento(ev(), AHORA)).toEqual({ valido: true, errores: [] });
  });
  it('evento vacío devuelve exactamente los errores 1,2,4,5,6,8 en orden', () => {
    const vacio = ev({ empleadoSecuencial: 0, fechaEvento: '', tipo: '' as any, impacto: '' as any, descripcion: '', competencias: [] });
    expect(validarEvento(vacio, AHORA).errores).toEqual([
      'Seleccione el colaborador.',
      'La fecha del evento es obligatoria.',
      'Seleccione el tipo de evento.',
      'Seleccione el impacto.',
      `La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.`,
      'Seleccione al menos una competencia.'
    ]);
  });
  it('fecha futura da solo el error 3; hoy es válido', () => {
    expect(validarEvento(ev({ fechaEvento: '2026-09-12' }), AHORA).errores).toEqual(['La fecha del evento no puede ser futura.']);
    expect(validarEvento(ev({ fechaEvento: '2026-09-11' }), AHORA).valido).toBeTrue();
  });
  it('tipo e impacto se comparan exactos', () => {
    expect(validarEvento(ev({ tipo: 'logro' as any }), AHORA).errores).toEqual(['Seleccione el tipo de evento.']);
    expect(validarEvento(ev({ impacto: 'alto' as any }), AHORA).errores).toEqual(['Seleccione el impacto.']);
  });
  it('descripción corta, solo espacios y larga', () => {
    expect(validarEvento(ev({ descripcion: 'corta' }), AHORA).errores.length).toBe(1);
    expect(validarEvento(ev({ descripcion: ' '.repeat(40) }), AHORA).errores).toEqual([`La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.`]);
    expect(validarEvento(ev({ descripcion: 'x'.repeat(DESCRIPCION_MAX + 1) }), AHORA).errores).toEqual([`La descripción no puede superar ${DESCRIPCION_MAX} caracteres.`]);
    expect(validarEvento(ev({ descripcion: 'x'.repeat(DESCRIPCION_MAX) }), AHORA).valido).toBeTrue();
  });
  it('competencias repetidas', () => {
    const c = { id: 0, bitacoraEventoId: 0, objetivoId: 59 };
    expect(validarEvento(ev({ competencias: [c, { ...c }] }), AHORA).errores).toEqual(['Hay competencias repetidas.']);
  });
  it('no muta el evento', () => {
    const e = ev({ descripcion: '  ' + DESC + '  ' }); const copia = JSON.stringify(e);
    validarEvento(e, AHORA); expect(JSON.stringify(e)).toBe(copia);
  });
});

describe('bitacora-utils · etiquetas y competencias', () => {
  it('etiquetas y clases', () => {
    expect(etiquetaTipo('Incumplimiento')).toBe('Incumplimiento');
    expect(etiquetaTipo(null)).toBe('');
    expect(claseTipo('Logro')).toBe('evento-logro');
    expect(claseTipo('Raro')).toBe('evento-otro');
    expect(claseImpacto('Alto')).toBe('impacto-alto');
    expect(claseImpacto('Bajo')).toBe('impacto-bajo');
    expect(claseImpacto('')).toBe('impacto-otro');
  });
  it('alternarCompetencia agrega/quita sin mutar', () => {
    const base: any[] = [];
    const uno = alternarCompetencia(base, 5);
    expect(uno).toEqual([{ id: 0, bitacoraEventoId: 0, objetivoId: 5 }]);
    expect(base).toEqual([]);
    expect(alternarCompetencia(uno, 5)).toEqual([]);
    expect(uno.length).toBe(1);
    expect(tieneCompetencia(uno, 5)).toBeTrue();
    expect(tieneCompetencia(uno, 6)).toBeFalse();
    expect(tieneCompetencia(null, 5)).toBeFalse();
  });
  it('agruparCompetencias conserva el orden', () => {
    const cat: ICompetenciaCatalogo[] = [
      { objetivoId: 59, nombre: 'A', grupoId: 1, grupo: 'G1' }, { objetivoId: 62, nombre: 'B', grupoId: 2, grupo: 'G2' },
      { objetivoId: 60, nombre: 'C', grupoId: 1, grupo: 'G1' }
    ];
    const g = agruparCompetencias(cat);
    expect(g.map(x => x.grupo)).toEqual(['G1', 'G2']);
    expect(g[0].competencias.map(x => x.objetivoId)).toEqual([59, 60]);
    expect(agruparCompetencias([])).toEqual([]);
  });
  it('nombresCompetencias une con · y usa #id si falta nombre', () => {
    const e = ev({ competencias: [{ id: 1, bitacoraEventoId: 1, objetivoId: 59, nombre: 'Enfoque al socio' }, { id: 2, bitacoraEventoId: 1, objetivoId: 60 }] });
    expect(nombresCompetencias(e)).toBe('Enfoque al socio · #60');
    expect(nombresCompetencias(ev({ competencias: [] }))).toBe('');
  });
});

describe('bitacora-utils · listas', () => {
  const lista = [
    ev({ id: 1, fechaEvento: '2026-08-31', tipo: 'Logro' }),
    ev({ id: 2, fechaEvento: '2026-09-01', tipo: 'Conducta' }),
    ev({ id: 3, fechaEvento: '2026-09-30', tipo: 'Logro', competencias: [{ id: 9, bitacoraEventoId: 3, objetivoId: 60 }] }),
    ev({ id: 4, fechaEvento: '2026-09-30', tipo: 'Raro' as any }),
    ev({ id: 5, fechaEvento: '2026-09-15', activo: false })
  ];
  it('filtrarEventos por rango inclusive, tipo y competencia; excluye inactivos', () => {
    expect(filtrarEventos(lista, { desde: '2026-09-01', hasta: '2026-09-30' }).map(x => x.id)).toEqual([2, 3, 4]);
    expect(filtrarEventos(lista, { tipo: 'Logro' }).map(x => x.id)).toEqual([1, 3]);
    expect(filtrarEventos(lista, { objetivoId: 60 }).map(x => x.id)).toEqual([3]);
    expect(filtrarEventos(lista, { desde: '', hasta: null, tipo: undefined }).map(x => x.id)).toEqual([1, 2, 3, 4]);
    expect(lista.length).toBe(5);
  });
  it('ordenarEventos desc por fecha y luego id; devuelve copia', () => {
    const o = ordenarEventos(lista);
    expect(o.map(x => x.id)).toEqual([4, 3, 5, 2, 1]);
    expect(lista[0].id).toBe(1);
  });
  it('contarPorTipo', () => {
    expect(contarPorTipo(lista.slice(0, 4))).toEqual({ logros: 2, incumplimientos: 0, iniciativas: 0, conductas: 1, total: 4 });
    expect(contarPorTipo([])).toEqual({ logros: 0, incumplimientos: 0, iniciativas: 0, conductas: 0, total: 0 });
  });
  it('textoResumen singular/plural y sin eventos', () => {
    expect(textoResumen({ logros: 1, incumplimientos: 2, iniciativas: 0, conductas: 1, total: 4 })).toBe('1 logro · 2 incumplimientos · 1 conducta');
    expect(textoResumen({ logros: 0, incumplimientos: 0, iniciativas: 3, conductas: 0, total: 3 })).toBe('3 iniciativas');
    expect(textoResumen({ logros: 0, incumplimientos: 0, iniciativas: 0, conductas: 0, total: 0 })).toBe('Sin eventos');
  });
  it('filasExcel con las 8 claves exactas en orden', () => {
    const filas = filasExcel([ev()], 'RHAY ALCANTARA');
    expect(Object.keys(filas[0])).toEqual(['Colaborador', 'Fecha del evento', 'Tipo', 'Impacto', 'Competencias', 'Descripción', 'Registrado por', 'Fecha de registro']);
    expect(filas[0]['Fecha del evento']).toBe('05/09/2026');
    expect(filas[0]['Fecha de registro']).toBe('06/09/2026');
    expect(filas[0]['Registrado por']).toBe('PABLO RODRIGUEZ');
    expect(filas[0]['Competencias']).toBe('Enfoque al socio');
    expect(filasExcel([ev({ registradoPorNombre: null, fechaRegistro: null })], 'X')[0]['Registrado por']).toBe('');
  });
});
