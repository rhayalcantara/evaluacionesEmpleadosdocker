-- PREPARADO, NO EJECUTADO. Devuelve al turno del supervisor (AutoEvaluado) las 16
-- evaluaciones de medio ano (periodo 8) enviadas entre el 7 y el 11 de septiembre de
-- 2026 con las competencias del supervisor sin calificar. Ver
-- Docs/evaluaciones-medio-ano-sin-calificacion-supervisor-20260911.md.
-- Ajustar la lista de Ids segun lo que decida RRHH (8 Enviado / 8 Completado).
SET NOCOUNT ON; SET XACT_ABORT ON;
BEGIN TRAN;
IF OBJECT_ID('_bak_Evaluacion_16evals_20260911') IS NOT NULL
    THROW 50000, 'El respaldo ya existe: el script ya se ejecuto.', 1;
SELECT * INTO _bak_Evaluacion_16evals_20260911 FROM Evaluacion
 WHERE PeriodId = 8 AND estadoevaluacion IN ('Enviado','Completado')
   AND Id IN (1879,1917,2108,2263,2010,2150,2238,2242,2192,1918,2133,2043,2141,2260,1842,2019)
   AND NOT EXISTS (SELECT 1 FROM GoalEmpleadoRespuesta g WHERE g.EvaluacionId = Evaluacion.Id AND g.repuestasupervisor > 0);
SELECT COUNT(*) AS respaldadas FROM _bak_Evaluacion_16evals_20260911;
UPDATE Evaluacion
   SET estadoevaluacion = 'AutoEvaluado', FechaFirmaSupervisor = NULL, aceptaEnDisgusto = 0, comentarioDisgusto = NULL
 WHERE Id IN (SELECT Id FROM _bak_Evaluacion_16evals_20260911);
SELECT @@ROWCOUNT AS actualizadas;
COMMIT;
