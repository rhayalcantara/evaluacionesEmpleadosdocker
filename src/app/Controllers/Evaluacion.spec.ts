/**
 * Spec de verificación de cálculos — Evaluacion Controller
 *
 * Flujo activo de cálculo (calculaelpromediodesempeno):
 *
 *  1. promedioDesempeno  = Σ (porcientologro_i × peso_i) / 100   [cap 110]
 *  2. desempenoFinal     = (pctDesempeno × promedioDesempeno) / 100
 *  3. avgCompColaborador = Σ ValoresEvaluacion[repuesta_i].valor  / N
 *  4. totalcolaborador   = desempenoFinal + (avgCompColaborador × pctCompetencia) / 100
 *  5. (con supervisor)
 *     avgCompSupervisor  = Σ ValoresEvaluacion[repuestaSupervisor_i].valor / N
 *     totalsupervisor    = desempenoFinal + (avgCompSupervisor × pctCompetencia) / 100
 *     totalCalculo       = totalcolaborador × 0.20 + totalsupervisor × 0.80
 *
 * NOTA DE BUG CONOCIDO: CompetenciaFinal y puntuacionFinal (variables de display, líneas 222-224)
 * usan `promedioCompetencias` (que contiene el peso%, NO el promedio real) dos veces:
 *   CompetenciaFinal = (pctCompetencia × pctCompetencia) / 100  ← incorrecto
 *   debería ser       (pctCompetencia × avgCompScore)    / 100
 * Esto NO afecta totalCalculo que se persiste en BD.
 */

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Evaluacion } from './Evaluacion';
import { DatosServiceService } from '../Services/datos-service.service';
import { ValoresEvaluacion } from './ValoresEvaluacion';
import { PorcientoDesempenoCompetencia } from './PorcientoDesempenoCompetencia';
import { ComunicacionService } from '../Services/comunicacion.service';
import { IResultadoLogro } from '../Models/EvaluacionDesempenoMeta/IEvaluacionDesempenoMeta';

// ─── Tabla de ValoresEvaluacion (mock) ───────────────────────────────────────
// Usada para:
//  - 'porciento': buscar por rango el valor estandarizado de desempeño
//  - 'id':        mapear respuesta de competencia (1-5) a su valor numérico
const VALORES_EVALUACION_MOCK = [
  { id: 1, titulo: 'Deficiente',     rangoDesde: 0,   rangoHasta: 60,  valor: 60  },
  { id: 2, titulo: 'Regular',        rangoDesde: 61,  rangoHasta: 70,  valor: 70  },
  { id: 3, titulo: 'Bueno',          rangoDesde: 71,  rangoHasta: 80,  valor: 80  },
  { id: 4, titulo: 'Muy Bueno',      rangoDesde: 81,  rangoHasta: 90,  valor: 90  },
  { id: 5, titulo: 'Excelente',      rangoDesde: 91,  rangoHasta: 110, valor: 100 },
  { id: 6, titulo: 'Sobresaliente',  rangoDesde: 111, rangoHasta: 999, valor: 100 },
];

// ─── Tabla de Porciento Desempeño/Competencia (mock) ─────────────────────────
// Periodo 1: 60% Desempeño, 40% Competencia
const PDC_MOCK = [
  { id: 1, periodId: 1, descripcion: 'Desempeño',   valor: 60 },
  { id: 2, periodId: 1, descripcion: 'Competencia',  valor: 40 },
];

function buildModelResponse(data: any[]): any {
  return { data, count: data.length, success: true, message: '' };
}

// ─── Setup ────────────────────────────────────────────────────────────────────
describe('Evaluacion — verificación de cálculos', () => {
  let controller: Evaluacion;
  let valoresEvaluacionSpy: jasmine.SpyObj<ValoresEvaluacion>;
  let porcientoSpy: jasmine.SpyObj<PorcientoDesempenoCompetencia>;
  let comunicacionSpy: jasmine.SpyObj<ComunicacionService>;

  beforeEach(() => {
    valoresEvaluacionSpy = jasmine.createSpyObj('ValoresEvaluacion', ['Gets', 'Get']);
    porcientoSpy = jasmine.createSpyObj('PorcientoDesempenoCompetencia', ['Gets']);
    comunicacionSpy = jasmine.createSpyObj('ComunicacionService', ['enviarMensaje']);

    // Gets() retorna todos los rangos
    valoresEvaluacionSpy.Gets.and.returnValue(
      of(buildModelResponse(VALORES_EVALUACION_MOCK))
    );

    // Get(id) retorna el registro por ID
    valoresEvaluacionSpy.Get.and.callFake((id: string) => {
      const found = VALORES_EVALUACION_MOCK.find(v => v.id === +id);
      return of(found ?? { id: 0, titulo: '', rangoDesde: 0, rangoHasta: 0, valor: 0 });
    });

    // PDC siempre retorna periodo 1
    porcientoSpy.Gets.and.returnValue(
      of(buildModelResponse(PDC_MOCK))
    );

    const datosSpy = jasmine.createSpyObj('DatosServiceService', ['getdatos', 'getbyid']);
    datosSpy.URL = 'http://test';

    TestBed.configureTestingModule({
      providers: [
        Evaluacion,
        { provide: DatosServiceService,       useValue: datosSpy },
        { provide: ValoresEvaluacion,          useValue: valoresEvaluacionSpy },
        { provide: PorcientoDesempenoCompetencia, useValue: porcientoSpy },
        { provide: ComunicacionService,        useValue: comunicacionSpy },
      ],
    });

    controller = TestBed.inject(Evaluacion);
  });

  // ─── estaEnRango ────────────────────────────────────────────────────────────
  describe('estaEnRango', () => {
    it('debe retornar true cuando el valor está dentro del rango (inclusive)', () => {
      expect(controller.estaEnRango({ RangoDesde: 71, RangoHasta: 80 }, 75)).toBeTrue();
      expect(controller.estaEnRango({ RangoDesde: 71, RangoHasta: 80 }, 71)).toBeTrue();
      expect(controller.estaEnRango({ RangoDesde: 71, RangoHasta: 80 }, 80)).toBeTrue();
    });

    it('debe retornar false cuando el valor está fuera del rango', () => {
      expect(controller.estaEnRango({ RangoDesde: 71, RangoHasta: 80 }, 70)).toBeFalse();
      expect(controller.estaEnRango({ RangoDesde: 71, RangoHasta: 80 }, 81)).toBeFalse();
    });
  });

  // ─── GetvalorEvaluacion ─────────────────────────────────────────────────────
  describe('GetvalorEvaluacion', () => {
    it('porciento: 75 debe mapear al valor 80 (rango 71-80)', async () => {
      const valor = await controller.GetvalorEvaluacion(75, 'porciento');
      expect(valor).toBe(80);
    });

    it('porciento: 60 debe mapear al valor 60 (rango 0-60)', async () => {
      const valor = await controller.GetvalorEvaluacion(60, 'porciento');
      expect(valor).toBe(60);
    });

    it('porciento: 100 debe mapear al valor 100 (rango 91-110)', async () => {
      const valor = await controller.GetvalorEvaluacion(100, 'porciento');
      expect(valor).toBe(100);
    });

    it('id: ID=3 debe retornar valor 80 (Bueno)', async () => {
      const valor = await controller.GetvalorEvaluacion(3, 'id');
      expect(valor).toBe(80);
    });

    it('id: ID=5 debe retornar valor 100 (Excelente)', async () => {
      const valor = await controller.GetvalorEvaluacion(5, 'id');
      expect(valor).toBe(100);
    });

    it('id=0 debe retornar 0 (sin consulta)', async () => {
      const valor = await controller.GetvalorEvaluacion(0, 'id');
      expect(valor).toBe(0);
      expect(valoresEvaluacionSpy.Get).not.toHaveBeenCalled();
    });
  });

  // ─── CalculoCompetencias ─────────────────────────────────────────────────────
  describe('CalculoCompetencias', () => {
    /**
     * Escenario: 3 respuestas de colaborador [3, 4, 5]
     *   valores: 80 + 90 + 100 = 270  (NO divide aquí, la división es externa)
     */
    beforeEach(() => {
      controller.model.goalEmpleadoRespuestas = [
        { id: 1, evaluacionId: 1, goalId: 1, repuesta: 3, repuestasupervisor: 4, weight: 0, observacion: '', observacionsupervisor: '' },
        { id: 2, evaluacionId: 1, goalId: 2, repuesta: 4, repuestasupervisor: 5, weight: 0, observacion: '', observacionsupervisor: '' },
        { id: 3, evaluacionId: 1, goalId: 3, repuesta: 5, repuestasupervisor: 5, weight: 0, observacion: '', observacionsupervisor: '' },
      ];
    });

    it('colaborador: suma de valores para respuestas [3,4,5] = 270', async () => {
      const suma = await controller.CalculoCompetencias(false);
      // repuesta 3→80, 4→90, 5→100
      expect(suma).toBe(270);
    });

    it('supervisor: suma de valores para respuestas supervisor [4,5,5] = 290', async () => {
      const suma = await controller.CalculoCompetencias(true);
      // repuesta 4→90, 5→100, 5→100
      expect(suma).toBe(290);
    });

    it('no suma respuestas en 0 (sin respuesta)', async () => {
      controller.model.goalEmpleadoRespuestas[0].repuesta = 0;
      const suma = await controller.CalculoCompetencias(false);
      // solo cuenta repuesta 4→90 y 5→100
      expect(suma).toBe(190);
    });
  });

  // ─── calculaelpromediodesempeno ─────────────────────────────────────────────
  describe('calculaelpromediodesempeno — escenario completo', () => {
    /**
     * Datos de entrada:
     *   resultadologro:
     *     - meta 1: porcientologro=80, peso=60
     *     - meta 2: porcientologro=100, peso=40
     *
     *   goalEmpleadoRespuestas (3 competencias):
     *     - colaborador:  [3, 4, 5]  → valores [80, 90, 100]
     *     - supervisor:   [4, 5, 5]  → valores [90, 100, 100]
     *
     *   PDC periodo 1: Desempeño=60%, Competencia=40%
     *
     * Cálculos esperados:
     *   promedioDesempeno  = (80×60)/100 + (100×40)/100 = 48 + 40 = 88
     *   desempenoFinal     = (60 × 88) / 100 = 52.8
     *
     *   avgCompColaborador = 270 / 3 = 90
     *   totalcolaborador   = 52.8 + (90 × 40)/100 = 52.8 + 36 = 88.8
     *
     *   avgCompSupervisor  = 290 / 3 ≈ 96.67
     *   totalsupervisor    = 52.8 + (96.67 × 40)/100 ≈ 52.8 + 38.67 ≈ 91.47
     *
     *   totalCalculo (con supervisor) = 88.8×0.2 + 91.47×0.8 = 17.76 + 73.17 ≈ 90.93
     */

    const resultadologro: IResultadoLogro[] = [
      { id: 1, EvaluacionId: 1, logro: 80,  porcientologro: 80,  peso: 60,
        medioverificacion: '', comentario: '', comentariosupervisor: '', resultadologro: 0 },
      { id: 2, EvaluacionId: 1, logro: 100, porcientologro: 100, peso: 40,
        medioverificacion: '', comentario: '', comentariosupervisor: '', resultadologro: 0 },
    ];

    beforeEach(() => {
      controller.model.periodId = 1;
      controller.model.evaluacionDesempenoMetas = [
        { id: 1, evaluacionId: 1, tipo: 'KPI', descripcion: 'Meta 1',
          meta: 100, peso: 60, inverso: true, perspectiva: 'Financiera' },
        { id: 2, evaluacionId: 1, tipo: 'KRI', descripcion: 'Meta 2',
          meta: 100, peso: 40, inverso: true, perspectiva: 'Cliente' },
      ];
      controller.model.goalEmpleadoRespuestas = [
        { id: 1, evaluacionId: 1, goalId: 1, repuesta: 3, repuestasupervisor: 4, weight: 0, observacion: '', observacionsupervisor: '' },
        { id: 2, evaluacionId: 1, goalId: 2, repuesta: 4, repuestasupervisor: 5, weight: 0, observacion: '', observacionsupervisor: '' },
        { id: 3, evaluacionId: 1, goalId: 3, repuesta: 5, repuestasupervisor: 5, weight: 0, observacion: '', observacionsupervisor: '' },
      ];
      // Cargar pdclocal con copia profunda: el método muta los objetos internos
      controller.pdclocal = PDC_MOCK.map(x => ({ ...x }));
    });

    it('sin supervisor: promedioDesempeno = 88', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);
      expect(controller.promedioDesempeno).toBe(88);
    });

    it('sin supervisor: desempenoFinal = 52.8', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);
      expect(controller.desempenoFinal).toBeCloseTo(52.8, 4);
    });

    it('sin supervisor: puntuacioncompetenciacolaborador = 90 (270/3)', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);
      expect(controller.model.puntuacioncompetenciacolaborador).toBeCloseTo(90, 4);
    });

    it('sin supervisor: totalcolaborador = 88.8', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);
      expect(controller.model.totalcolaborador).toBeCloseTo(88.8, 4);
    });

    it('sin supervisor: totalCalculo = totalcolaborador', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);
      expect(controller.model.totalCalculo).toBeCloseTo(controller.model.totalcolaborador, 4);
    });

    it('con supervisor: totalCalculo = 20% colaborador + 80% supervisor', async () => {
      await controller.calculaelpromediodesempeno(true, resultadologro);

      // avgCompSupervisor = 290/3 ≈ 96.6667
      const avgSup = 290 / 3;
      const totSup = 52.8 + (avgSup * 40) / 100;  // ≈ 91.467
      const totCol = 88.8;
      const expectedTotal = totCol * 0.2 + totSup * 0.8;

      expect(controller.model.totalCalculo).toBeCloseTo(expectedTotal, 2);
    });

    it('con supervisor: totalsupervisor > totalcolaborador (supervisor califica mejor)', async () => {
      await controller.calculaelpromediodesempeno(true, resultadologro);
      expect(controller.model.totalsupervisor).toBeGreaterThan(controller.model.totalcolaborador);
    });

    // ── Documenta el bug en puntuacionFinal (display only) ───────────────────
    it('[BUG CONOCIDO] puntuacionFinal != totalcolaborador por error en CompetenciaFinal', async () => {
      await controller.calculaelpromediodesempeno(false, resultadologro);

      // Bug: promedioCompetencias contiene el peso% (40), no el avgCompScore (90)
      // CompetenciaFinal = (40 * 40) / 100 = 16  (debería ser (40 * 90) / 100 = 36)
      const competenciaFinalIncorrecto = (40 * 40) / 100; // = 16
      expect(controller.CompetenciaFinal).toBeCloseTo(competenciaFinalIncorrecto, 4);

      // puntuacionFinal = 16 + 52.8 = 68.8  (debería ser 88.8, igual a totalcolaborador)
      expect(controller.puntuacionFinal).toBeCloseTo(52.8 + competenciaFinalIncorrecto, 4);
      expect(controller.puntuacionFinal).not.toBeCloseTo(controller.model.totalcolaborador, 1);
    });
  });

  // ─── cap de desempeño a 110 ──────────────────────────────────────────────────
  describe('cap promedioDesempeno a 110', () => {
    it('si el desempeño ponderado supera 110, se trunca a 110', async () => {
      controller.model.periodId = 1;
      controller.model.evaluacionDesempenoMetas = [];
      controller.model.goalEmpleadoRespuestas = [];
      controller.pdclocal = PDC_MOCK.map(x => ({ ...x }));

      // resultadologro con porcientos altos que suman >110
      const logrosAltos: IResultadoLogro[] = [
        { id: 1, EvaluacionId: 1, logro: 130, porcientologro: 130, peso: 100,
          medioverificacion: '', comentario: '', comentariosupervisor: '', resultadologro: 0 },
      ];
      await controller.calculaelpromediodesempeno(false, logrosAltos);
      expect(controller.promedioDesempeno).toBe(110);
    });
  });

  // ─── empleado sin metas de desempeño ─────────────────────────────────────────
  describe('empleado sin metas de desempeño (solo competencias)', () => {
    /**
     * Cuando evaluacionDesempenoMetas.length === 0, el PDC se ajusta a:
     *   Desempeño = 0%  →  desempenoFinal = 0
     *   Competencia = 100%
     * totalCalculo solo refleja competencias.
     */
    it('desempenoFinal debe ser 0 y competencia usa 100%', async () => {
      controller.model.periodId = 1;
      controller.model.evaluacionDesempenoMetas = [];
      controller.model.goalEmpleadoRespuestas = [
        { id: 1, evaluacionId: 1, goalId: 1, repuesta: 4, repuestasupervisor: 4, weight: 0, observacion: '', observacionsupervisor: '' },
        { id: 2, evaluacionId: 1, goalId: 2, repuesta: 4, repuestasupervisor: 4, weight: 0, observacion: '', observacionsupervisor: '' },
      ];
      controller.pdclocal = PDC_MOCK.map(x => ({ ...x }));

      await controller.calculaelpromediodesempeno(false, []);

      expect(controller.desempenoFinal).toBe(0);
      // avgCompColaborador = (90+90)/2 = 90, pctCompetencia=100 → totalcolaborador = 0 + (90*100)/100 = 90
      expect(controller.model.totalcolaborador).toBeCloseTo(90, 4);
    });
  });

  // ─── porcientologrado ────────────────────────────────────────────────────────
  describe('porcientologrado', () => {
    /**
     * inverso=true  → n = (logro/meta)*100   (métrica donde más=mejor, ej. ventas)
     * inverso=false → n = (meta/logro)*100   (métrica donde menos=mejor, ej. gastos)
     *
     * Luego: corrección_peso = (peso × n) / 100
     * Y se mapea corrección_peso a valor estandarizado vía GetvalorEvaluacion('porciento')
     */

    it('inverso=true, logro=80, meta=100, peso=100 → n=80 → val estandarizado=80', async () => {
      // n = (80/100)*100 = 80, corrección_peso = (100*80)/100 = 80 → rango 71-80 → valor=80
      const val = await controller.porcientologrado(80, true, 100, 100);
      expect(val).toBe(80);
    });

    it('inverso=true, logro=95, meta=100, peso=100 → n=95 → val estandarizado=100', async () => {
      // n=95, corrección=95 → rango 91-110 → valor=100
      const val = await controller.porcientologrado(95, true, 100, 100);
      expect(val).toBe(100);
    });

    it('inverso=false, logro=80, meta=100, peso=100 → n=125 → cap 110 → val=100', async () => {
      // n = (100/80)*100 = 125  → corrección=125 → pero rango máx es 91-110 → valor=100
      const val = await controller.porcientologrado(80, false, 100, 100);
      expect(val).toBe(100);
    });

    it('inverso=false, logro=0 → n=0 → valor=60 (mínimo Deficiente)', async () => {
      // logro=0 → n=0 → corrección=0 → rango 0-60 → valor=60
      const val = await controller.porcientologrado(0, false, 100, 100);
      expect(val).toBe(60);
    });

    it('peso=50 reduce el impacto: logro=100, meta=100, inverso=true, peso=50 → n=100 → corrección=50 → val=60', async () => {
      // n=100, corrección_peso=(50*100)/100=50 → rango 0-60 → valor=60
      const val = await controller.porcientologrado(100, true, 100, 50);
      expect(val).toBe(60);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDITORÍA DE DATOS REALES
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Cómo usar este bloque:
 *
 * 1. Toma una fila de la tabla `evaluacion` de la BD con todos sus sub-registros.
 * 2. Rellena SNAPSHOT_EVALUACION con los valores exactos de esa fila.
 * 3. Ejecuta: npx ng test --include="**\/Evaluacion.spec.ts" --watch=false --browsers=ChromeHeadless
 * 4. Los tests te dicen si los valores recalculados coinciden con los almacenados.
 *
 * Consulta SQL para obtener los datos necesarios:
 *
 *   SELECT e.id, e.totalCalculo, e.totalcolaborador, e.totalsupervisor,
 *          e.puntuacioncompetenciacolaborador, e.puntuacioncompetenciasupervisor,
 *          e.periodId
 *   FROM Evaluacions e WHERE e.id = <ID>;
 *
 *   SELECT id, meta, peso, inverso, logro, supervisado_logro
 *   FROM EvaluacionDesempenoMetas edm
 *   JOIN EvaluacionDesempenoMetaRespuestas r ON r.evaluacionDesempenoMetaId = edm.id
 *   WHERE edm.evaluacionId = <ID>;
 *
 *   SELECT goalId, repuesta, repuestasupervisor
 *   FROM GoalEmpleadoRespuestas WHERE evaluacionId = <ID>;
 *
 *   SELECT descripcion, valor FROM PorcientoDesempenoCompetencias WHERE periodId = <PERIOD>;
 *
 *   SELECT id, rangoDesde, rangoHasta, valor FROM ValoresEvaluacions ORDER BY rangoDesde;
 *
 * NOTA sobre calcularresultadologro (fórmula activa en criterialitem.component.ts):
 *   inverso=TRUE  → porcientologro = (meta / logro) * 100   (menos logro = mejor, ej: gastos)
 *   inverso=FALSE → porcientologro = (logro / meta) * 100   (más logro = mejor, ej: ventas)
 */

// ─── PASO 1: Rellena con datos reales de la BD ───────────────────────────────

/** Columnas de la tabla ValoresEvaluacions (copia exactamente de la BD) */
const VALORES_REALES: { id: number; rangoDesde: number; rangoHasta: number; valor: number }[] = [
  // Reemplaza estas filas con las de tu BD
  { id: 1, rangoDesde: 0,   rangoHasta: 60,  valor: 60  },
  { id: 2, rangoDesde: 61,  rangoHasta: 70,  valor: 70  },
  { id: 3, rangoDesde: 71,  rangoHasta: 80,  valor: 80  },
  { id: 4, rangoDesde: 81,  rangoHasta: 90,  valor: 90  },
  { id: 5, rangoDesde: 91,  rangoHasta: 110, valor: 100 },
  { id: 6, rangoDesde: 111, rangoHasta: 999, valor: 100 },
];

/** Snapshot de una evaluación real (rellena con los valores de tu BD) */
const SNAPSHOT_EVALUACION = {
  // ── Datos de la tabla Evaluacions ────────────────────────────────────────────
  evaluacionId: 0,              // ← pon el ID real
  periodId: 1,                  // ← pon el periodId real
  esSupervisor: true,           // ← true si el supervisor ya evaluó

  // ── Valores ALMACENADOS en la BD (los que queremos verificar) ───────────────
  stored: {
    totalCalculo:                      0,   // ← copia de la BD
    totalcolaborador:                  0,   // ← copia de la BD
    totalsupervisor:                   0,   // ← copia de la BD
    puntuacioncompetenciacolaborador:  0,   // ← copia de la BD
    puntuacioncompetenciasupervisor:   0,   // ← copia de la BD
  },

  // ── PorcientoDesempenoCompetencias del periodo ───────────────────────────────
  pdc: [
    { descripcion: 'Desempeño',  valor: 60 },   // ← pon el valor real del periodo
    { descripcion: 'Competencia', valor: 40 },   // ← pon el valor real del periodo
  ],

  // ── Metas de desempeño con sus respuestas ────────────────────────────────────
  // Para cada meta: { meta, peso, inverso, logro (del colaborador) }
  metas: [
    // Ejemplo:  { meta: 100, peso: 60, inverso: false, logro: 85 },
    //           { meta: 50,  peso: 40, inverso: true,  logro: 45 },
    // Reemplaza con tus filas reales:
  ] as { meta: number; peso: number; inverso: boolean; logro: number; id?: number }[],

  // ── Respuestas de competencias ────────────────────────────────────────────────
  // repuesta = calificación colaborador (1-5), repuestasupervisor = calificación supervisor (1-5)
  competencias: [
    // Ejemplo:  { repuesta: 3, repuestasupervisor: 4 },
    //           { repuesta: 5, repuestasupervisor: 5 },
    // Reemplaza con tus filas reales:
  ] as { repuesta: number; repuestasupervisor: number }[],
};

// ─── Función auxiliar: replica calcularresultadologro del componente ──────────
function calcularPorcientologro(logro: number, meta: number, inverso: boolean): number {
  if (inverso) {
    return logro !== 0 ? (meta / logro) * 100 : 0;
  } else {
    return meta !== 0 ? (logro / meta) * 100 : 0;
  }
}

// ─── Función auxiliar: busca valor en tabla ValoresEvaluacion por rango ───────
function buscarValorPorRango(porcentaje: number, tabla: typeof VALORES_REALES): number {
  const found = tabla.find(v => v.rangoDesde <= porcentaje && porcentaje <= v.rangoHasta);
  return found?.valor ?? 0;
}

// ─── Función auxiliar: busca valor en tabla ValoresEvaluacion por ID ──────────
function buscarValorPorId(id: number, tabla: typeof VALORES_REALES): number {
  return tabla.find(v => v.id === id)?.valor ?? 0;
}

describe('Evaluacion — auditoría comparativa con datos reales de BD', () => {

  // Saltar si el snapshot no ha sido rellenado
  const skipSuite = SNAPSHOT_EVALUACION.evaluacionId === 0
    || SNAPSHOT_EVALUACION.metas.length === 0
    || SNAPSHOT_EVALUACION.competencias.length === 0;

  // ─── Cálculos esperados (se calculan igual que el código de producción) ──────
  let resultadologro: { porcientologro: number; peso: number }[] = [];
  let promedioDesempeno: number;
  let pctDesempeno: number;
  let pctCompetencia: number;
  let desempenoFinal: number;
  let sumaCompColaborador: number;
  let avgCompColaborador: number;
  let totalcolaborador: number;
  let sumaCompSupervisor: number;
  let avgCompSupervisor: number;
  let totalsupervisor: number;
  let totalCalculo: number;

  beforeAll(() => {
    if (skipSuite) return;

    const { metas, competencias, pdc, esSupervisor } = SNAPSHOT_EVALUACION;

    // 1. porcientologro por meta (igual que calcularresultadologro en criterialitem)
    resultadologro = metas.map(m => ({
      porcientologro: calcularPorcientologro(m.logro, m.meta, m.inverso),
      peso: m.peso,
    }));

    // 2. promedioDesempeno ponderado
    let num = 0;
    resultadologro.forEach(r => { num += (r.porcientologro * r.peso) / 100; });
    promedioDesempeno = Math.min(num, 110);

    // 3. PDC
    pctDesempeno   = pdc.find(p => p.descripcion === 'Desempeño')?.valor  ?? 0;
    pctCompetencia = pdc.find(p => p.descripcion === 'Competencia')?.valor ?? 0;

    // Si no hay metas → Desempeño=0, Competencia=100
    if (metas.length === 0) { pctDesempeno = 0; pctCompetencia = 100; }

    // 4. desempenoFinal
    desempenoFinal = (pctDesempeno * promedioDesempeno) / 100;

    // 5. Competencias colaborador
    sumaCompColaborador = competencias.reduce((acc, c) => {
      return acc + (c.repuesta !== 0 ? buscarValorPorId(c.repuesta, VALORES_REALES) : 0);
    }, 0);
    avgCompColaborador = sumaCompColaborador / competencias.length;
    totalcolaborador   = desempenoFinal + (avgCompColaborador * pctCompetencia) / 100;

    // 6. Competencias supervisor (solo si esSupervisor)
    sumaCompSupervisor = competencias.reduce((acc, c) => {
      return acc + (c.repuestasupervisor !== 0 ? buscarValorPorId(c.repuestasupervisor, VALORES_REALES) : 0);
    }, 0);
    avgCompSupervisor = sumaCompSupervisor / competencias.length;
    totalsupervisor   = desempenoFinal + (avgCompSupervisor * pctCompetencia) / 100;

    // 7. totalCalculo final
    totalCalculo = esSupervisor
      ? totalcolaborador * 0.2 + totalsupervisor * 0.8
      : totalcolaborador;
  });

  it('SNAPSHOT rellenado con datos reales (si falla, rellena SNAPSHOT_EVALUACION)', () => {
    if (skipSuite) pending('Rellena SNAPSHOT_EVALUACION con datos reales de la BD para ejecutar esta auditoría');
    expect(SNAPSHOT_EVALUACION.evaluacionId).toBeGreaterThan(0);
    expect(SNAPSHOT_EVALUACION.metas.length).toBeGreaterThan(0);
    expect(SNAPSHOT_EVALUACION.competencias.length).toBeGreaterThan(0);
  });

  it('totalcolaborador recalculado ≈ stored', () => {
    if (skipSuite) return pending('Snapshot vacío');
    const tolerance = 0.1;
    const diff = Math.abs(totalcolaborador - SNAPSHOT_EVALUACION.stored.totalcolaborador);
    if (diff > tolerance) {
      fail(
        `totalcolaborador DIVERGE:\n` +
        `  Almacenado:    ${SNAPSHOT_EVALUACION.stored.totalcolaborador.toFixed(4)}\n` +
        `  Recalculado:   ${totalcolaborador.toFixed(4)}\n` +
        `  Diferencia:    ${diff.toFixed(4)}\n\n` +
        `  desempenoFinal   = (${pctDesempeno}% × ${promedioDesempeno.toFixed(2)}) / 100 = ${desempenoFinal.toFixed(4)}\n` +
        `  avgCompColab     = ${sumaCompColaborador} / ${SNAPSHOT_EVALUACION.competencias.length} = ${avgCompColaborador.toFixed(4)}\n` +
        `  parte competencia= (${avgCompColaborador.toFixed(2)} × ${pctCompetencia}) / 100 = ${((avgCompColaborador * pctCompetencia) / 100).toFixed(4)}`
      );
    }
    expect(diff).toBeLessThan(tolerance);
  });

  it('totalsupervisor recalculado ≈ stored', () => {
    if (skipSuite) return pending('Snapshot vacío');
    if (!SNAPSHOT_EVALUACION.esSupervisor) return pending('No aplica: no es supervisor');
    const diff = Math.abs(totalsupervisor - SNAPSHOT_EVALUACION.stored.totalsupervisor);
    if (diff > 0.1) {
      fail(
        `totalsupervisor DIVERGE:\n` +
        `  Almacenado:    ${SNAPSHOT_EVALUACION.stored.totalsupervisor.toFixed(4)}\n` +
        `  Recalculado:   ${totalsupervisor.toFixed(4)}\n` +
        `  avgCompSup     = ${sumaCompSupervisor} / ${SNAPSHOT_EVALUACION.competencias.length} = ${avgCompSupervisor.toFixed(4)}`
      );
    }
    expect(diff).toBeLessThan(0.1);
  });

  it('totalCalculo recalculado ≈ stored', () => {
    if (skipSuite) return pending('Snapshot vacío');
    const diff = Math.abs(totalCalculo - SNAPSHOT_EVALUACION.stored.totalCalculo);
    if (diff > 0.1) {
      fail(
        `totalCalculo DIVERGE:\n` +
        `  Almacenado:    ${SNAPSHOT_EVALUACION.stored.totalCalculo.toFixed(4)}\n` +
        `  Recalculado:   ${totalCalculo.toFixed(4)}\n` +
        `  Fórmula: totalColaborador(${totalcolaborador.toFixed(2)})×0.2 + totalsupervisor(${totalsupervisor.toFixed(2)})×0.8`
      );
    }
    expect(diff).toBeLessThan(0.1);
  });

  it('puntuacioncompetenciacolaborador recalculada ≈ stored', () => {
    if (skipSuite) return pending('Snapshot vacío');
    const diff = Math.abs(avgCompColaborador - SNAPSHOT_EVALUACION.stored.puntuacioncompetenciacolaborador);
    if (diff > 0.1) {
      fail(
        `puntuacioncompetenciacolaborador DIVERGE:\n` +
        `  Almacenado:  ${SNAPSHOT_EVALUACION.stored.puntuacioncompetenciacolaborador.toFixed(4)}\n` +
        `  Recalculado: ${avgCompColaborador.toFixed(4)}\n` +
        `  Respuestas colaborador: ${SNAPSHOT_EVALUACION.competencias.map(c => c.repuesta).join(', ')}\n` +
        `  Valores mapeados:       ${SNAPSHOT_EVALUACION.competencias.map(c => buscarValorPorId(c.repuesta, VALORES_REALES)).join(', ')}`
      );
    }
    expect(diff).toBeLessThan(0.1);
  });

  it('puntuacioncompetenciasupervisor recalculada ≈ stored', () => {
    if (skipSuite) return pending('Snapshot vacío');
    if (!SNAPSHOT_EVALUACION.esSupervisor) return pending('No aplica: no es supervisor');
    const diff = Math.abs(avgCompSupervisor - SNAPSHOT_EVALUACION.stored.puntuacioncompetenciasupervisor);
    if (diff > 0.1) {
      fail(
        `puntuacioncompetenciasupervisor DIVERGE:\n` +
        `  Almacenado:  ${SNAPSHOT_EVALUACION.stored.puntuacioncompetenciasupervisor.toFixed(4)}\n` +
        `  Recalculado: ${avgCompSupervisor.toFixed(4)}\n` +
        `  Respuestas supervisor: ${SNAPSHOT_EVALUACION.competencias.map(c => c.repuestasupervisor).join(', ')}\n` +
        `  Valores mapeados:      ${SNAPSHOT_EVALUACION.competencias.map(c => buscarValorPorId(c.repuestasupervisor, VALORES_REALES)).join(', ')}`
      );
    }
    expect(diff).toBeLessThan(0.1);
  });

  it('DESGLOSE detallado por meta (informativo)', () => {
    if (skipSuite) return pending('Snapshot vacío');
    const lineas = SNAPSHOT_EVALUACION.metas.map((m, i) => {
      const pct = calcularPorcientologro(m.logro, m.meta, m.inverso);
      const ponderado = (pct * m.peso) / 100;
      return `  Meta ${i + 1}: logro=${m.logro}, meta=${m.meta}, inverso=${m.inverso} → ${pct.toFixed(2)}% × ${m.peso}% = ${ponderado.toFixed(4)}`;
    });
    console.log('\n── Desglose de metas ──────────────────────────────────');
    lineas.forEach(l => console.log(l));
    console.log(`  promedioDesempeno = ${promedioDesempeno.toFixed(4)}`);
    console.log(`  desempenoFinal    = ${desempenoFinal.toFixed(4)}`);
    console.log(`  avgCompColaborador= ${avgCompColaborador.toFixed(4)}`);
    console.log(`  totalcolaborador  = ${totalcolaborador.toFixed(4)}`);
    if (SNAPSHOT_EVALUACION.esSupervisor) {
      console.log(`  avgCompSupervisor = ${avgCompSupervisor.toFixed(4)}`);
      console.log(`  totalsupervisor   = ${totalsupervisor.toFixed(4)}`);
    }
    console.log(`  totalCalculo      = ${totalCalculo.toFixed(4)}`);
    console.log('────────────────────────────────────────────────────────');
    expect(true).toBeTrue(); // solo informativo
  });
});
