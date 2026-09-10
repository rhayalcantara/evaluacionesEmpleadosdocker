# Historial de Evaluaciones — Fase 1 (plan de obra)

**Metodología:** `CONFIGURACION-TRABAJO.md` — orquestador (Claude) planifica, escribe specs y
baterías, integra y commitea; **constructores qwen3.8** (agente_core2 sobre Ollama .165)
programan cada entregable en un workspace aislado; **crítico Opus** (`.claude/agents/critico-tareas.md`)
verifica ejecutando y dictamina APROBADO/RECHAZADO; cada aprobación se integra con commit + push.
Progreso visible en `Docs/progreso.html`.

Origen: `Docs/plan-historial-evaluaciones.md` (problemas P1–P4, Fase 1). Rama: `feature/crud-competencias`.

## Adaptación del protocolo a un proyecto Angular

- **Entregable = un archivo TypeScript/HTML** por tarea. El workspace del constructor replica la
  ruta relativa real (`build/T<N>/src/app/...`) para que los imports relativos sean los
  definitivos y `npx tsc --noEmit -p build/T<N>/tsconfig.json` compile contra el `node_modules`
  del proyecto (resolución hacia arriba).
- **Baterías = Jasmine/Karma headless** (`npx ng test --watch=false --browsers=ChromeHeadless
  --include=<spec>`). Viven en `src/**/*.spec.ts` (única ruta que compila el tsconfig.spec);
  el constructor **nunca las ve** porque trabaja en `build/`.
- **Verificación e2e del crítico:** Playwright (`e2e/`) contra `ng serve --configuration prueba`
  (API :7071 / Evaluaciones_Test). Prohibido apuntar a producción.
- **Contratos escritos por el orquestador** (no por constructores): interfaces en
  `src/app/Models/HistorialEvaluacion/IHistorialEvaluacion.ts`.

## Protocolo por tarea

1. Spec exacta en `Docs/specs/T<N>.md` + batería antes de construir.
2. Constructor lanzado con `Popen` detached (`build/T<N>/lanzar.py`), vigilado por `done_qwen2.txt`.
3. Batería del orquestador → crítico Opus (ejecuta batería + pruebas propias) → veredicto.
4. RECHAZADO → spec `T<N>-r<K>.md` con las críticas numeradas (máx. 3 rondas).
5. APROBADO → copiar a `src/`, commit + push, tablero.

## Fases y tareas

### F1 — Lógica pura (T1, sin dependencias)
- **T1 `src/app/Helpers/historial-utils.ts`** — funciones puras, sin Angular: catálogo de estados
  reales con etiqueta, normalización de estado (`NULL` → "Sin iniciar"), clase CSS por estado,
  mapeo evaluación→resumen con nombre de empleado y nombre/tipo de periodo, búsqueda sin
  acentos por nombre/cédula/secuencial/usuario, estadísticas y evolución **solo con evaluaciones
  finales**, regla de comparación (medio año no se compara), filas de Excel sin puntuación para
  medio año.

### F2 — Integración (T2 ∥ T3 tras T1; archivos distintos, contrato fijado por T1 y el modelo)
- **T2 `src/app/Controllers/HistorialEvaluacion.ts`** — carga catálogos (empleados, periodos)
  una sola vez con `shareReplay`, resuelve nombre/identificación/periodo en TODAS las rutas
  (empleado, subordinados, filtros de admin), delega estadísticas/evolución/comparación/Excel a
  `historial-utils`, rechaza comparaciones no válidas.
- **T3 `historial-evaluaciones.component.ts` + `.html`** — filtro de estado con los estados
  reales, búsqueda por secuencial/usuario, fila de medio año marcada y sin puntuaciones,
  checkbox de comparar deshabilitado para medio año, panel de estadísticas con conteo de
  finales/medio año, sin promedios cuando no hay finales.

### F3 — Cierre (orquestador)
- Regresión de baterías sobre lo integrado, `ng build --configuration prueba`, auditoría
  Playwright con capturas en `Docs/auditoria-historial/`, commit final.

## Criterios de verificación de la fase (de `plan-historial-evaluaciones.md`)
- Admin, filtro periodo 8 + estado Completado → filas con nombre e identificación.
- Buscar "ALCANTARA" y "525" encuentra al mismo empleado.
- Promedio general de un empleado con evaluaciones en periodos 7 y 8 = su total del periodo 7.
- Seleccionar una de periodo 8 y una de periodo 7 y Comparar → aviso, no diferencia numérica.

## Trampas pagadas en esta fase
1. **Karma compila TODOS los `*.spec.ts`** aunque se use `--include`. Una batería escrita por
   adelantado contra un contrato que aún no existe rompe la compilación de las demás. Las
   baterías de tareas futuras se guardan como `*.spec.ts.pendiente` y se renombran al iniciar
   su tarea.
2. **El constructor no responde LISTO aunque el archivo esté completo**: T1 dejó el archivo
   terminado y compilando a las 11:59 y siguió consumiendo turnos 35 min más. Si el archivo
   objetivo no cambia en 15 min y `tsc` pasa, correr la batería sin esperar el marcador y
   matar el proceso (`taskkill /PID <pid> /T /F`) antes de lanzar una ronda nueva en el mismo
   workspace.
3. **`tsc` completo del proyecto nunca está limpio** (errores previos en
   `EvaluacionCursoCapacitacion.ts`, `IRela.ts`). El `tsconfig.json` de cada workspace usa
   `include` solo con el archivo entregable (tsc sigue sus imports) y NO redefine `baseUrl`
   (rompe el mapeo `@commons-lib`).
4. **El agente `critico-tareas` copiado a `.claude/agents/` durante la sesión no se carga**:
   el crítico se lanza como `general-purpose` con `model: opus` y sus instrucciones en el prompt.
5. **`ejecutar_bash` del constructor puede colgarse sin salida** (T2: un bash hijo abierto 14 min
   sin peticiones a Ollama). Señal: `api/ps` de Ollama con `expires_at` en el pasado y el
   archivo objetivo sin cambios. Remedio: `taskkill /PID <pid> /T /F` y relanzar en el mismo
   workspace; el monitor emite un latido cada 10 min con mtime del archivo e hijos del proceso.
6. **Los shells en segundo plano de la sesión se matan por memoria baja** (1.2 GB libres de
   16): usar Monitor con `sleep 60`, nunca varios waiters en paralelo.

## Cierre F3 (2026-09-10)
- Regresión de las tres baterías sobre lo integrado: **55/55**. `ng build --configuration prueba`: OK.
- La suite Karma completa del proyecto arrastra fallos previos de specs "should create" de
  componentes ajenos a esta fase (cobertura mínima preexistente); no son regresión.
- Auditoría Playwright (`e2e/historial-evaluaciones.spec.js`) lista; requiere credenciales por
  variables de entorno y `npx ng serve --configuration prueba --port 4300`. Capturas y resumen
  irán a `Docs/auditoria-historial/`.
- Observación del crítico en T2 (no bloqueante): `getHistorialSubordinados` usa la fecha de hoy
  en UTC; entre 20:00 y 23:59 hora RD manda el día siguiente. Corregir en Fase 2 construyendo
  la fecha con getFullYear/getMonth/getDate.

## Métricas de la fase
| Tarea | Rondas | Lanzamientos | Tokens qwen | Motivo de la ronda extra | Batería | Crítico |
|---|:---:|:---:|---:|---|:---:|---|
| T1 utils | 2 | 1 | 34k (r2; r1 no capturado) | 4 campos de texto en `undefined` en vez de `''` | 23/23 | APROBADO, 16 pruebas propias |
| T2 controlador | 2 | 3 | no capturado | error de tipos inducido por la spec (`getdatos<ModelResponse>`) | 21/21 | APROBADO, 13 pruebas propias |
| T3 componente | 1 | 1 | 241k | — | 11/11 | APROBADO, 12 pruebas propias |

Costo facturado: orquestación + 3 corridas de crítico (≈310k tokens de subagentes Opus).

## Auditoría Playwright ejecutada (2026-09-10, usuario administrador, API :7071)
`e2e/historial-evaluaciones.spec.js` → `Docs/auditoria-historial/auditoria.md` + 8 capturas.
Resultado: login y rol admin, filtro de estado con los 6 estados reales, filas con nombre e
identificación, fila de medio año marcada sin puntuación ni checkbox, badges legibles, panel de
estadísticas con conteo finales/medio año. En Evaluaciones_Test solo hay 1 evaluación de medio
año "Completado", por eso el paso de comparación no tuvo dos finales que seleccionar.

Hallazgo corregido por el orquestador durante la auditoría (fuera de las specs): el desplegable
de periodo leía `periodo.nombre` (campo inexistente) y mostraba "Período N"; ahora usa
`periodo.descripcion`. Batería del componente 11/11 tras el cambio.

Trampas del e2e: esperar el menú "Configuración" (el rol llega después del login) y dar
500 ms a los `mat-option` antes de leerlos.
