/**
 * Batería dura de T1 — historial-utils (el constructor no la ve).
 * Correr: npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/Helpers/historial-utils.spec.ts
 */
import {
  SIN_INICIAR, ESTADOS_EVALUACION, normalizarEstado, etiquetaEstado, claseEstado, coincideEstado,
  esMedioAno, normalizarTexto, mapearResumen, coincideBusqueda, ordenarPorFechaDesc,
  calcularEstadisticas, datosEvolucion, puedeComparar, compararResumenes, filasExcel,
  EvaluacionFuente, EmpleadoFuente, PeriodoFuente
} from './historial-utils';
import { IHistorialEvaluacionResumen } from '../Models/HistorialEvaluacion/IHistorialEvaluacion';

const evBase = (o: Partial<EvaluacionFuente> = {}): EvaluacionFuente => ({
  id: 1, periodId: 7, empleadoSecuencial: 525, totalCalculo: 93.5, fechaRepuestas: '2025-12-15T10:00:00',
  estadoevaluacion: 'Completado', puntuaciondesempenocolaborador: 90, puntuacioncompetenciacolaborador: 97,
  puntuaciondesempenosupervidor: 88, puntuacioncompetenciasupervisor: 95, totalcolaborador: 93.5,
  totalsupervisor: 91.5, entrevistaConSupervisor: true, ...o
});
const emp: EmpleadoFuente = { secuencial: 525, codigousuario: 'RALCANTARA', nombreunido: 'RHAY ALCANTARA',
  identificacion: '001-1234567-8', departamento: 'TECNOLOGIA', cargo: 'DBA' };
const pFinal: PeriodoFuente = { id: 7, descripcion: 'Evaluación Final 2025', tipo: 'final_ano',
  fechaInicio: '2025-12-01', fechaFin: '2025-12-31' };
const pMedio: PeriodoFuente = { id: 8, descripcion: 'Evaluación de Mitad de Año 2026', tipo: 'medio_ano' };

const res = (o: Partial<IHistorialEvaluacionResumen> = {}): IHistorialEvaluacionResumen => ({
  evaluacionId: 1, periodId: 7, periodoNombre: 'Final 2025', periodoTipo: 'final_ano', esMedioAno: false,
  fechaInicio: '', fechaFin: '', empleadoSecuencial: 525, empleadoNombre: 'RHAY ALCANTARA',
  empleadoIdentificacion: '001-1234567-8', codigoUsuario: 'RALCANTARA', departamento: 'TECNOLOGIA', puesto: 'DBA',
  fechaRespuesta: '2025-12-15', estadoEvaluacion: 'Completado', totalCalculo: 90,
  puntuacionDesempenoColaborador: 88, puntuacionCompetenciaColaborador: 92, puntuacionDesempenoSupervisor: 85,
  puntuacionCompetenciaSupervisor: 90, totalColaborador: 90, totalSupervisor: 87.5, entrevistaConSupervisor: true, ...o
});
const medio = (o: Partial<IHistorialEvaluacionResumen> = {}) =>
  res({ evaluacionId: 2, periodId: 8, periodoNombre: 'Medio 2026', periodoTipo: 'medio_ano', esMedioAno: true,
        fechaRespuesta: '2026-07-15', totalCalculo: 40, puntuacionDesempenoColaborador: 40, puntuacionCompetenciaColaborador: 40, ...o });

describe('historial-utils: estados', () => {
  it('catálogo exacto y en orden', () => {
    expect(SIN_INICIAR).toBe('SIN_INICIAR');
    expect(ESTADOS_EVALUACION.map(e => e.valor)).toEqual(
      ['Borrador', 'AutoEvaluado', 'EvaluadoPorSupervisor', 'Enviado', 'Completado', 'SIN_INICIAR']);
    expect(ESTADOS_EVALUACION.map(e => e.etiqueta)).toEqual(
      ['Borrador', 'Autoevaluado', 'Evaluado por supervisor', 'Enviado al colaborador', 'Completado', 'Sin iniciar']);
  });
  it('normalizarEstado trata vacíos como SIN_INICIAR y no toca el resto', () => {
    for (const v of [null, undefined, '', '   ']) { expect(normalizarEstado(v)).toBe('SIN_INICIAR'); }
    expect(normalizarEstado(' Completado ')).toBe('Completado');
    expect(normalizarEstado('completado')).toBe('completado');
    expect(normalizarEstado('xyz')).toBe('xyz');
  });
  it('etiquetaEstado', () => {
    expect(etiquetaEstado('EvaluadoPorSupervisor')).toBe('Evaluado por supervisor');
    expect(etiquetaEstado(null)).toBe('Sin iniciar');
    expect(etiquetaEstado('Raro')).toBe('Raro');
  });
  it('claseEstado', () => {
    expect(claseEstado('Borrador')).toBe('estado-borrador');
    expect(claseEstado('AutoEvaluado')).toBe('estado-autoevaluado');
    expect(claseEstado('EvaluadoPorSupervisor')).toBe('estado-supervisor');
    expect(claseEstado('Enviado')).toBe('estado-enviado');
    expect(claseEstado('Completado')).toBe('estado-completado');
    expect(claseEstado('')).toBe('estado-sin-iniciar');
    expect(claseEstado('Completada')).toBe('estado-default');
  });
  it('coincideEstado', () => {
    expect(coincideEstado('Completado', undefined)).toBeTrue();
    expect(coincideEstado('Completado', '')).toBeTrue();
    expect(coincideEstado(null, 'SIN_INICIAR')).toBeTrue();
    expect(coincideEstado('', 'SIN_INICIAR')).toBeTrue();
    expect(coincideEstado('Completado', 'SIN_INICIAR')).toBeFalse();
    expect(coincideEstado('Completado', 'Completado')).toBeTrue();
    expect(coincideEstado('Completado', 'Completada')).toBeFalse();
  });
});

describe('historial-utils: texto y periodo', () => {
  it('esMedioAno', () => {
    expect(esMedioAno(pMedio)).toBeTrue();
    expect(esMedioAno(pFinal)).toBeFalse();
    expect(esMedioAno(null)).toBeFalse();
    expect(esMedioAno({ id: 1 })).toBeFalse();
  });
  it('normalizarTexto quita acentos y mayúsculas', () => {
    expect(normalizarTexto('Núñez PÉREZ ')).toBe('nunez perez');
    expect(normalizarTexto(null)).toBe('');
    expect(normalizarTexto(undefined)).toBe('');
  });
});

describe('historial-utils: mapearResumen', () => {
  it('usa empleado y periodo reales', () => {
    const r = mapearResumen(evBase(), emp, pFinal);
    expect(r.evaluacionId).toBe(1);
    expect(r.periodId).toBe(7);
    expect(r.empleadoNombre).toBe('RHAY ALCANTARA');
    expect(r.empleadoIdentificacion).toBe('001-1234567-8');
    expect(r.codigoUsuario).toBe('RALCANTARA');
    expect(r.departamento).toBe('TECNOLOGIA');
    expect(r.puesto).toBe('DBA');
    expect(r.periodoNombre).toBe('Evaluación Final 2025');
    expect(r.periodoTipo).toBe('final_ano');
    expect(r.esMedioAno).toBeFalse();
    expect(r.fechaInicio).toBe(new Date('2025-12-01').toISOString());
    expect(r.estadoEvaluacion).toBe('Completado');
    expect(r.totalCalculo).toBe(93.5);
    expect(r.puntuacionDesempenoSupervisor).toBe(88);
    expect(r.puntuacionCompetenciaSupervisor).toBe(95);
    expect(r.totalSupervisor).toBe(91.5);
    expect(r.entrevistaConSupervisor).toBeTrue();
    expect(r.supervisorNombre).toBeUndefined();
  });
  it('sin empleado ni periodo: fallbacks sin N/A', () => {
    const r = mapearResumen(evBase({ estadoevaluacion: null, totalCalculo: null, fechaRepuestas: null,
      puntuaciondesempenocolaborador: undefined, entrevistaConSupervisor: null }));
    expect(r.empleadoNombre).toBe('Empleado 525');
    expect(r.empleadoIdentificacion).toBe('');
    expect(r.codigoUsuario).toBe('');
    expect(r.departamento).toBe('');
    expect(r.puesto).toBe('');
    expect(r.periodoNombre).toBe('Período 7');
    expect(r.periodoTipo).toBe('final_ano');
    expect(r.fechaInicio).toBe('');
    expect(r.fechaFin).toBe('');
    expect(r.fechaRespuesta).toBe('');
    expect(r.estadoEvaluacion).toBe('SIN_INICIAR');
    expect(r.totalCalculo).toBe(0);
    expect(r.puntuacionDesempenoColaborador).toBe(0);
    expect(r.entrevistaConSupervisor).toBeFalse();
    expect(JSON.stringify(r)).not.toContain('N/A');
  });
  it('el parámetro empleado manda sobre ev.empleado; ev.empleado se usa si no hay parámetro', () => {
    const otro: EmpleadoFuente = { secuencial: 525, nombreunido: 'OTRO NOMBRE' };
    expect(mapearResumen(evBase({ empleado: otro }), emp).empleadoNombre).toBe('RHAY ALCANTARA');
    expect(mapearResumen(evBase({ empleado: otro })).empleadoNombre).toBe('OTRO NOMBRE');
    expect(mapearResumen(evBase({ empleado: otro }), null).empleadoNombre).toBe('OTRO NOMBRE');
  });
  it('nombre en blanco y descripción en blanco caen al fallback; medio año marcado; fecha inválida → ""', () => {
    const r = mapearResumen(evBase({ periodId: 8 }), { secuencial: 525, nombreunido: '   ' },
      { id: 8, descripcion: '  ', tipo: 'medio_ano', fechaInicio: 'no-es-fecha' });
    expect(r.empleadoNombre).toBe('Empleado 525');
    expect(r.periodoNombre).toBe('Período 8');
    expect(r.esMedioAno).toBeTrue();
    expect(r.periodoTipo).toBe('medio_ano');
    expect(r.fechaInicio).toBe('');
  });
  it('recorta espacios y convierte numéricos en texto', () => {
    const r = mapearResumen(evBase({ totalCalculo: '88.25' as any }), { secuencial: 1, identificacion: ' 001 ', codigousuario: ' u ' });
    expect(r.totalCalculo).toBe(88.25);
    expect(r.empleadoIdentificacion).toBe('001');
    expect(r.codigoUsuario).toBe('u');
  });
});

describe('historial-utils: búsqueda y orden', () => {
  const item = res();
  it('coincideBusqueda por todos los campos, sin acentos', () => {
    expect(coincideBusqueda(item, '')).toBeTrue();
    expect(coincideBusqueda(item, '   ')).toBeTrue();
    expect(coincideBusqueda(item, null)).toBeTrue();
    expect(coincideBusqueda(item, 'alcantara')).toBeTrue();
    expect(coincideBusqueda(item, 'ALCÁNTARA')).toBeTrue();
    expect(coincideBusqueda(item, '525')).toBeTrue();
    expect(coincideBusqueda(item, 'ralcantara')).toBeTrue();
    expect(coincideBusqueda(item, '1234567')).toBeTrue();
    expect(coincideBusqueda(item, 'tecnolog')).toBeTrue();
    expect(coincideBusqueda(item, 'final 2025')).toBeTrue();
    expect(coincideBusqueda(item, 'zzz')).toBeFalse();
    expect(coincideBusqueda(res({ empleadoIdentificacion: undefined, codigoUsuario: undefined, departamento: undefined }), 'x')).toBeFalse();
  });
  it('ordenarPorFechaDesc no muta y manda inválidas al final', () => {
    const a = res({ evaluacionId: 1, fechaRespuesta: '2025-01-01' });
    const b = res({ evaluacionId: 2, fechaRespuesta: '2026-01-01' });
    const c = res({ evaluacionId: 3, fechaRespuesta: '' });
    const d = res({ evaluacionId: 4, fechaRespuesta: 'basura' });
    const entrada = [c, a, d, b];
    const salida = ordenarPorFechaDesc(entrada);
    expect(salida.map(x => x.evaluacionId).slice(0, 2)).toEqual([2, 1]);
    expect(salida.slice(2).map(x => x.evaluacionId).sort()).toEqual([3, 4]);
    expect(entrada.map(x => x.evaluacionId)).toEqual([3, 1, 4, 2]);
    expect(salida).not.toBe(entrada);
  });
});

describe('historial-utils: estadísticas y evolución', () => {
  it('vacío lanza', () => {
    expect(() => calcularEstadisticas([])).toThrowError('No hay evaluaciones para este empleado');
  });
  it('ignora medio año en promedios y mejor, pero lo cuenta y puede ser la más reciente', () => {
    const f1 = res({ evaluacionId: 1, fechaRespuesta: '2024-12-15', totalCalculo: 80, puntuacionDesempenoColaborador: 70, puntuacionCompetenciaColaborador: 90 });
    const f2 = res({ evaluacionId: 3, fechaRespuesta: '2025-12-15', totalCalculo: 90, puntuacionDesempenoColaborador: 90, puntuacionCompetenciaColaborador: 90 });
    const m = medio({ evaluacionId: 2, fechaRespuesta: '2026-07-15' });
    const s = calcularEstadisticas([m, f1, f2]);
    expect(s.totalEvaluaciones).toBe(3);
    expect(s.evaluacionesFinales).toBe(2);
    expect(s.evaluacionesMedioAno).toBe(1);
    expect(s.promedioGeneral).toBe(85);
    expect(s.promedioDesempeno).toBe(80);
    expect(s.promedioCompetencias).toBe(90);
    expect(s.mejorEvaluacion!.evaluacionId).toBe(3);
    expect(s.evaluacionMasReciente.evaluacionId).toBe(2);
    expect(s.tendenciaGeneral).toBe('mejora');
    expect(s.empleadoSecuencial).toBe(525);
  });
  it('solo medio año: promedios 0, mejor null, estable', () => {
    const s = calcularEstadisticas([medio()]);
    expect(s.promedioGeneral).toBe(0);
    expect(s.promedioDesempeno).toBe(0);
    expect(s.promedioCompetencias).toBe(0);
    expect(s.mejorEvaluacion).toBeNull();
    expect(s.tendenciaGeneral).toBe('estable');
    expect(s.evaluacionesFinales).toBe(0);
    expect(s.evaluacionesMedioAno).toBe(1);
  });
  it('tendencia usa umbral ±5 sobre las dos finales más recientes, sin importar el orden de entrada', () => {
    const viejo = res({ evaluacionId: 1, fechaRespuesta: '2023-12-01', totalCalculo: 50 });
    const pen = res({ evaluacionId: 2, fechaRespuesta: '2024-12-01', totalCalculo: 90 });
    const ult = res({ evaluacionId: 3, fechaRespuesta: '2025-12-01', totalCalculo: 84 });
    expect(calcularEstadisticas([viejo, pen, ult]).tendenciaGeneral).toBe('decline');
    expect(calcularEstadisticas([ult, viejo, pen]).tendenciaGeneral).toBe('decline');
    expect(calcularEstadisticas([pen, res({ evaluacionId: 3, fechaRespuesta: '2025-12-01', totalCalculo: 95 })]).tendenciaGeneral).toBe('estable');
    expect(calcularEstadisticas([pen, res({ evaluacionId: 3, fechaRespuesta: '2025-12-01', totalCalculo: 95.01 })]).tendenciaGeneral).toBe('mejora');
    expect(calcularEstadisticas([pen]).tendenciaGeneral).toBe('estable');
  });
  it('empate en mejor: primera del orden recibido', () => {
    const a = res({ evaluacionId: 10, totalCalculo: 90 });
    const b = res({ evaluacionId: 11, totalCalculo: 90 });
    expect(calcularEstadisticas([a, b]).mejorEvaluacion!.evaluacionId).toBe(10);
  });
  it('datosEvolucion: solo finales, ascendente, sin mutar', () => {
    const f2 = res({ evaluacionId: 3, fechaRespuesta: '2025-12-15', periodoNombre: 'F25', totalCalculo: 90 });
    const f1 = res({ evaluacionId: 1, fechaRespuesta: '2024-12-15', periodoNombre: 'F24', totalCalculo: 80 });
    const entrada = [f2, medio(), f1];
    const d = datosEvolucion(entrada);
    expect(d.map(x => x.periodo)).toEqual(['F24', 'F25']);
    expect(d[0]).toEqual({ periodo: 'F24', fecha: '2024-12-15', totalCalculo: 80, desempeno: 88, competencias: 92 });
    expect(entrada[0].evaluacionId).toBe(3);
    expect(datosEvolucion([medio()])).toEqual([]);
    expect(datosEvolucion([])).toEqual([]);
  });
});

describe('historial-utils: comparación', () => {
  const a = res({ evaluacionId: 1, totalCalculo: 80, puntuacionDesempenoColaborador: 70, puntuacionCompetenciaColaborador: 90 });
  const b = res({ evaluacionId: 3, totalCalculo: 90, puntuacionDesempenoColaborador: 90, puntuacionCompetenciaColaborador: 85 });
  it('puedeComparar', () => {
    expect(puedeComparar(a, b)).toEqual(jasmine.objectContaining({ ok: true }));
    expect(puedeComparar(a, b).motivo).toBeUndefined();
    expect(puedeComparar(a, a)).toEqual({ ok: false, motivo: 'Seleccione dos evaluaciones distintas' });
    const r = puedeComparar(a, medio());
    expect(r.ok).toBeFalse();
    expect(r.motivo).toBe('Las evaluaciones de medio año no tienen puntuación comparable; seleccione dos evaluaciones finales');
    expect(puedeComparar(medio(), a).ok).toBeFalse();
    expect(puedeComparar(medio({ evaluacionId: 7 }), medio({ evaluacionId: 8 })).ok).toBeFalse();
  });
  it('compararResumenes calcula b - a y lanza cuando no procede', () => {
    const c = compararResumenes(a, b);
    expect(c.evaluacion1).toBe(a);
    expect(c.evaluacion2).toBe(b);
    expect(c.diferenciaTotal).toBe(10);
    expect(c.diferenciaDesempeno).toBe(20);
    expect(c.diferenciaCompetencia).toBe(-5);
    expect(c.tendencia).toBe('mejora');
    expect(compararResumenes(b, a).tendencia).toBe('decline');
    expect(compararResumenes(a, res({ evaluacionId: 9, totalCalculo: 80 })).tendencia).toBe('igual');
    expect(() => compararResumenes(a, medio())).toThrowError(/medio año/);
    expect(() => compararResumenes(a, a)).toThrowError('Seleccione dos evaluaciones distintas');
  });
});

describe('historial-utils: Excel', () => {
  it('columnas exactas y medio año sin números', () => {
    const filas = filasExcel([res({ totalCalculo: 90.456, empleadoIdentificacion: undefined }), medio({ estadoEvaluacion: 'SIN_INICIAR' })]);
    expect(filas.length).toBe(2);
    expect(Object.keys(filas[0])).toEqual([
      'ID Evaluación', 'Período', 'Tipo', 'Empleado', 'Identificación', 'Usuario', 'Departamento', 'Puesto', 'Fecha', 'Estado',
      'Total', 'Desempeño Colaborador', 'Competencias Colaborador', 'Total Colaborador',
      'Desempeño Supervisor', 'Competencias Supervisor', 'Total Supervisor', 'Entrevista con Supervisor']);
    expect(filas[0]['ID Evaluación']).toBe(1);
    expect(filas[0]['Tipo']).toBe('Final');
    expect(filas[0]['Total']).toBe('90.46');
    expect(filas[0]['Identificación']).toBe('');
    expect(filas[0]['Usuario']).toBe('RALCANTARA');
    expect(filas[0]['Estado']).toBe('Completado');
    expect(filas[0]['Entrevista con Supervisor']).toBe('Sí');
    expect(filas[1]['Tipo']).toBe('Medio año');
    expect(filas[1]['Estado']).toBe('Sin iniciar');
    for (const k of ['Total', 'Desempeño Colaborador', 'Competencias Colaborador', 'Total Colaborador',
                     'Desempeño Supervisor', 'Competencias Supervisor', 'Total Supervisor']) {
      expect(filas[1][k]).toBe('');
    }
  });
});
