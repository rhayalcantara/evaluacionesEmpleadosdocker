/**
 * Fila de la matriz "Plan de acción" de la evaluación de mitad de año.
 *
 * Persistencia INTERINA: viaja como JSON dentro del campo ColaboradorCompromisos
 * (junto a { comentarios, compromisos }) hasta que exista la tabla dedicada
 * EvaluacionPlanAccion en el API (ver Docs/diseno-plan-accion-medio-ano.md §5).
 * Los nombres de campo siguen la estructura *Texto del diseño para que la
 * migración a la tabla sea 1:1 (los pares *Id se agregan con los catálogos).
 */
export interface IAccionPlan {
  numero: number;                    // 1..5 — orden de la fila en la matriz
  accion: string;
  objetivoCompetenciaTexto: string;
  responsableTexto: string;
  soporteTexto: string;
  recursos: string;
  fechaCierre: string | null;        // yyyy-MM-dd
}
