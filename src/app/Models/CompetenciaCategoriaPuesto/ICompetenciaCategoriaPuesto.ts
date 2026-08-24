/**
 * Vínculo entre una competencia del catálogo (Objetivo) y una categoría de puesto.
 *
 * Refleja exactamente el modelo del API
 * (EvaluacionEmpleadosApi/Models/CompetenciaCategoriaPuesto.cs), que expone
 * únicamente tres enteros y los serializa en camelCase:
 *
 *   GET /api/CompetenciaCategoriaPuestoes
 *   -> [{ "id": 1, "objetivoId": 1, "categoriaPuestoId": 1 }, ...]
 *
 * Ojo: este endpoint devuelve el arreglo plano, no el envoltorio ModelResponse
 * que usan otros recursos del API.
 */
export interface ICompetenciaCategoriaPuesto {
    /** Llave primaria de la fila de vínculo. */
    id: number
    /** Id de la competencia en el catálogo (tabla Objetivo). */
    objetivoId: number
    /** Id de la categoría de puesto vinculada (tabla CategoriaPuesto). */
    categoriaPuestoId: number
}
