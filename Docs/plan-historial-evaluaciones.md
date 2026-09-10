# Plan — Historial de Evaluaciones (2026-09-10)

Componente: `src/app/Views/Components/Pages/historial-evaluaciones/`
Controlador: `src/app/Controllers/HistorialEvaluacion.ts`

## Problemas encontrados

### P1. No aparecen nombre ni identificación; la búsqueda por texto no encuentra nada
El historial toma la lista de `GET /api/Evaluacions`, que devuelve la evaluación
sin el objeto `empleado` (solo `empleadoSecuencial`). `mapearAResumen` cae en
`'N/A'` para nombre, identificación, departamento y puesto, y la búsqueda de
texto compara contra esos `'N/A'`.

Solo `GET /api/Evaluacions/empleado/{id}/{periodo}` hace el join con `Empleados`.

### P2. Los estados del filtro no son los del sistema
Lista fija en el componente: `Completada, Pendiente, En Proceso, Aprobada, Rechazada`.
Estados reales en la tabla `Evaluacion` (producción, 2026-09-10):
`Borrador, AutoEvaluado, EvaluadoPorSupervisor, Enviado, Completado` y `NULL`
(evaluaciones generadas sin iniciar). Ninguno coincide, así que el filtro por
estado siempre devuelve vacío.

### P3. Medio año se trata como una calificación
Las evaluaciones de tipo `medio_ano` guardan un `totalCalculo` (promedio ~88 en
el periodo 8) y el historial las mezcla con las finales en promedio, tendencia,
mejor evaluación, gráfico de evolución, comparación y Excel. Ese número es
avance parcial, no una nota; lo valioso del medio año es cualitativo (plan de
acción, compromisos, comentarios por meta).

### P4. El periodo se rotula "Período N"
`mapearAResumen` no resuelve el nombre del periodo, así que el usuario no
distingue una evaluación de mitad de año de una final.

## Plan de trabajo

### Fase 1 — Correcciones (periodo 8 activo, hacer ya)

| # | Cambio | Dónde | Esfuerzo |
|---|--------|-------|----------|
| 1.1 | Cargar `Empleados.Gets()` una vez y enlazar por `secuencial` al mapear cada evaluación (nombre, identificación, departamento, puesto). Incluir ex-empleados: si no está en la vista, mostrar el secuencial y no `N/A`. | `HistorialEvaluacion.ts` | 2 h |
| 1.2 | Hacer que la búsqueda de texto también acepte el secuencial y el código de usuario. | componente | 0.5 h |
| 1.3 | Reemplazar la lista fija de estados por los reales, con etiqueta legible: Borrador, Autoevaluado, Evaluado por supervisor, Enviado al colaborador, Completado, Sin iniciar (`NULL`). Mantener el valor crudo para el filtro. | componente + html | 1 h |
| 1.4 | Resolver el nombre real del periodo desde `Periodos.Gets()` en vez de "Período N". | `HistorialEvaluacion.ts` | 0.5 h |
| 1.5 | Leer `periodo.tipo` y para `medio_ano`: marcar la fila, ocultar columnas de puntuación, excluir de promedio, tendencia, mejor evaluación y gráfico, bloquear "Comparar" con una final, y exportar a Excel sin puntuaciones. | controlador + componente + html | 4 h |

Alternativa para 1.1 si el volumen crece: agregar el join con `Empleados` en el
API (`EvaluacionsController.GetEvaluacions`). Por ahora el join en el frontend
evita desplegar el API.

### Fase 2 — Detalle propio de medio año (diseñar con RRHH)

- Al abrir una evaluación `medio_ano` desde el historial, mostrar en vez de las
  pestañas de puntuación: plan de acción (matriz), compromisos y comentarios de
  colaborador y supervisor, metas con su comentario de avance, entrevista.
- Todo está en el JSON de `ColaboradorCompromisos` / `SupervisorCompromisos` y en
  `EvaluacionDesempenoMetaRespuestas.comentario`; no requiere cambios de BD.

### Fase 3 — Comparación medio año vs. final del mismo año

- Comparar por cumplimiento, no por número: cada acción del plan queda
  cumplida / parcial / no cumplida al cierre; metas con alerta a mitad de año
  contrastadas con su logro final.
- Requiere que el formulario final permita marcar el cumplimiento del plan de
  acción (nuevo campo; ver `Docs/diseno-plan-accion-medio-ano.md` §5 opción B).

### Fase 4 — Después del cierre del periodo 8

- Dejar de grabar `totalCalculo` en evaluaciones `medio_ano` (o grabar `NULL`),
  previa revisión de los reportes que dependan del campo.

## Verificación de Fase 1

- Como administrador, filtrar periodo 8 + estado Completado debe dar 146
  filas con nombre e identificación (cifra de producción al 2026-09-10).
- Buscar "ALCANTARA" y "525" debe encontrar al mismo empleado.
- El promedio general de un empleado con evaluaciones en periodos 7 y 8 debe
  coincidir con su total del periodo 7.
- Seleccionar una de periodo 8 y una de periodo 7 y pulsar Comparar debe
  mostrar un aviso, no una diferencia numérica.
