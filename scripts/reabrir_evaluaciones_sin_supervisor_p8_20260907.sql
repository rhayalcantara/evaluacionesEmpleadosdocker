-- Reapertura de evaluaciones del periodo 8 (Medio Año 2026) que llegaron al
-- colaborador SIN calificación del supervisor (defecto "Enviar al Colaborador",
-- ver Docs / memoria del 2026-09-07). Las respuestas del supervisor nunca se
-- persistieron, así que la única vía es que vuelva a evaluar.
--
-- Efecto: estado -> 'AutoEvaluado' (turno del supervisor), se borra la firma del
-- supervisor. Se conserva la firma y las respuestas del colaborador.
-- Respaldo previo en _bak_Evaluacion_reapertura_20260907.
SET XACT_ABORT ON;
BEGIN TRAN;

IF OBJECT_ID('_bak_Evaluacion_reapertura_20260907') IS NOT NULL
    THROW 50000, 'El respaldo _bak_Evaluacion_reapertura_20260907 ya existe: el script ya se ejecuto.', 1;

SELECT ev.*
  INTO _bak_Evaluacion_reapertura_20260907
  FROM Evaluacion ev
 WHERE ev.periodId = 8
   AND ev.estadoevaluacion IN ('Enviado','Completado')
   AND NOT EXISTS (SELECT 1 FROM GoalEmpleadoRespuesta g
                   WHERE g.EvaluacionId = ev.Id AND g.repuestasupervisor > 0);

UPDATE ev
   SET ev.estadoevaluacion = 'AutoEvaluado',
       ev.FechaFirmaSupervisor = NULL,
       ev.aceptaEnDisgusto = 0,
       ev.comentarioDisgusto = NULL
  FROM Evaluacion ev
 WHERE ev.Id IN (SELECT Id FROM _bak_Evaluacion_reapertura_20260907);

SELECT @@ROWCOUNT AS reabiertas;
COMMIT;
