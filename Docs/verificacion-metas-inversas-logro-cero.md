# TM-0 — Verificación previa: metas inversas con logro 0

**Fecha:** 2026-07-08 · **Contexto:** pedido de Lissette (RRHH) de permitir logro=0 solo en metas inversas (Par30, Riesgo), calculándolo como 100% de cumplimiento. Plan completo en la tarea "Metas inversas: permitir logro 0 y calcularlo como 100%" (TM-0 a TM-8).

> **GATE:** la implementación (TM-1 a TM-8) toca archivos vetados por `plan-mejoras-sistema.md` (FormEvaluationEmploye, form-evaluation-medio-ano, criterialitem, Evaluacion.ts) y NO se ejecuta hasta que se confirme el cierre del periodo 8.

## 1. Casos reales en producción (backup periodo 7, `backup_evaluaciones_p7_20260420_141939.json`)

437 evaluaciones, 3.184 metas, **ninguna sin objeto respuesta** (RRHH precarga logros vía CSV). Con logro=0: 25 metas — 10 inversas, 15 normales.

### Metas INVERSAS con logro=0 (con el cambio pasarían de 0% a 100%) — CONFIRMAR CON RRHH que son ceros reales:

| Eval | Empleado | Estado | Meta (desc) | meta | peso |
|---|---|---|---|---|---|
| 1363 | RAIDA ELISA BRETON SOTO | Completado | 2% reducción gastos consumo | 2 | 10 |
| 1358 | ANA ESTHER RODRIGUEZ BETANCES | EvaluadoPorSupervisor | 2% reducción gastos consumo | 2 | 5 |
| 1414 | JOSE LUIS DICENT ALCANTARA | Completado | %PAR30 | 3 | 30 |
| 1422 | SEFERINO MORALES MANZUETA | Completado | %PAR30 | 3 | 30 |
| 1423 | LEOWYS ANGEL BRITO DEL ORBE | Completado | %PAR30 | 3 | 30 |
| 1425 | YORDANIS DE JESUS VILORIO | Completado | %PAR30 | 3 | 30 |
| 1428 | JAIRO MERCEDES | Completado | %PAR30 | 3 | 30 |
| 1532 | DARLING MARIA GONZALEZ MEJIA | Completado | %PAR30 | 3.5 | 30 |
| 1564 | YISSEL RODRIGUEZ DE LEON | Pendiente | %PAR30 | 3.5 | 30 |
| 1569 | MAURICIO MENDEZ BELTRE | Completado | %PAR30 | 3.5 | 30 |

Coinciden exactamente con los casos que Lissette describe (PAR30 de oficiales + reducción de gastos). Las 15 no-inversas con logro=0 (capacitaciones, colocación, ventas de seguros, etc.) son metas no ejecutadas — seguirían tratándose como inválidas/0%, correcto según la regla pedida.

**Nota para RRHH (riesgo aceptado):** desde el cliente no se puede distinguir un 0 real de una celda `logro` vacía en el CSV de carga (ambos llegan como 0 a la BD). Las 10 filas de arriba deben confirmarse una a una. A futuro, RRHH debe garantizar celdas `logro` explícitas en la plantilla para metas inversas (ver TM-7).

## 2. Estado del periodo vigente (BD Evaluaciones_Test, consultada 2026-07-08)

Periodo 8 ("Evaluacion de Medio Ano 2026 (PRUEBA)", activo, estadoid 3): solo 10 metas de prueba (9 normales, 1 inversa), **7 de ellas sin objeto respuesta en BD**. Hallazgo relevante: a diferencia de producción p7 (todo precargado), en el flujo de medio año las respuestas pueden no existir hasta que se capturan → **el mecanismo "sin captura" del plan (TM-1/TM-5) es necesario, no teórico**.

## 3. Deuda técnica documentada: convención invertida de `porcientologrado`

`Controllers/Evaluacion.ts:125-144` (`porcientologrado`, usada por `CalculoDesempeno`) aplica la convención de `inverso` **al revés** que las otras 3 fórmulas del sistema (`calculatePercentage` en el mismo archivo, `criterialitem.calcularresultadologro`, `form-evaluation-medio-ano.calcularLogro`): con `inverso=true` divide `logro/meta` (premia lograr más) y con `inverso=false` divide `meta/logro` (premia lograr menos).

- **Verificado (2026-07-08): es código muerto en runtime.** Su único call site (`Evaluacion.ts:447`, dentro de `CalculoDesempeno`) está en el bloque comentado `/* 429-483 */` de `grabar()`. Solo la ejercita `Evaluacion.spec.ts`, cuyos comentarios documentan AMBAS convenciones (líneas ~339-340 vs ~408-410).
- **Decisión:** este trabajo NO corrige la dirección de división (los `totalCalculo` históricos no se recalculan); TM-3 solo agrega el caso `inverso && logro===0 → 100`. Si algún día se descomenta el bloque de `grabar()`, revisar además que `CalculoDesempeno` suma `supervisado_logro` (0 en TODOS los datos reales de p7) — con el caso especial, cada meta inversa aportaría 100×peso también por esa vía.

## 4. Baseline (pre-implementación)

- `npm run test:ci` (2026-07-08, rama `metas/logro-cero-inverso`): **24 FAILED / 31 SUCCESS / 7 skipped** — los 24 fallos son los specs autogenerados preexistentes documentados en `baseline-fase0.md`; `Evaluacion.spec.ts` verde.
- Los scripts Playwright siguen fuera de la rutina de verificación (puerto 7070/7071 sin confirmar, ver `baseline-fase0.md`); la red de seguridad de TM-1..TM-8 es `Evaluacion.spec.ts` + smoke manual.
