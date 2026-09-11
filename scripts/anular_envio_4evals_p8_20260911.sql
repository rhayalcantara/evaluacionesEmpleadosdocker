-- Anulacion del envio de 4 evaluaciones de medio ano (periodo 8) solicitada por
-- Graciela Garcia (RRHH) el 2026-09-11 ("RE: Evaluacion"): los supervisores
-- pulsaron "Enviar al Colaborador" sin grabar. Vuelven al turno del supervisor
-- (AutoEvaluado); se conserva la autoevaluacion y firma del colaborador y
-- cualquier respuesta de supervisor ya grabada.
--   1878  GELMANIA GARCIA VINA   (93)  sup. Salomon Tejada (85)  sin respuestas sup.
--   1938  ALBERTO BRITO VALDEZ   (879) sup. Salomon Tejada (85)  sin respuestas sup.
--   2223  ROSSANNA BAEZ FELIX    (674) sup. Salomon Tejada (85)  sin respuestas sup.
--   1972  ELSIRA CAROLINA ABREU  (458) sup. Richard Luciano (59) con respuestas sup. (6/6)
SET NOCOUNT ON; SET XACT_ABORT ON;
BEGIN TRAN;
IF OBJECT_ID('_bak_Evaluacion_4evals_20260911') IS NOT NULL
    THROW 50000, 'El respaldo ya existe: el script ya se ejecuto.', 1;
SELECT * INTO _bak_Evaluacion_4evals_20260911 FROM Evaluacion
 WHERE Id IN (1878,1938,1972,2223) AND PeriodId = 8 AND estadoevaluacion = 'Enviado';
IF (SELECT COUNT(*) FROM _bak_Evaluacion_4evals_20260911) <> 4
    THROW 50001, 'No se encontraron las 4 evaluaciones en estado Enviado.', 1;
UPDATE Evaluacion
   SET estadoevaluacion = 'AutoEvaluado', FechaFirmaSupervisor = NULL, aceptaEnDisgusto = 0, comentarioDisgusto = NULL
 WHERE Id IN (SELECT Id FROM _bak_Evaluacion_4evals_20260911);
SELECT @@ROWCOUNT AS actualizadas;
COMMIT;
SELECT Id, EmpleadoSecuencial, estadoevaluacion, FechaFirmaColaborador, FechaFirmaSupervisor FROM Evaluacion WHERE Id IN (1878,1938,1972,2223);
