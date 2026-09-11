# Fase 3 — Bitácora de Eventos de Desempeño (plan de obra)

**Metodología:** `CONFIGURACION-TRABAJO.md` — orquestador (Claude) planifica, escribe contratos,
specs y baterías, integra y commitea; **constructores qwen3.8** (agente_core2 sobre Ollama .165,
lanzador `scripts/lanzar_constructor.py`) programan cada entregable en `build/B<N>/`; **crítico Opus**
(lanzado como `general-purpose` con `model: opus`, instrucciones de `.claude/agents/critico-tareas.md`
en el prompt) verifica ejecutando y dictamina APROBADO/RECHAZADO; cada aprobación se integra con
commit + push. Progreso en `Docs/progreso.html` (se añade la sección "Fase 3").

**Origen:** correo de Lissette Abad del 2026-09-11 ("FW: Evaluación Mitad de año | Implementación")
con `Docs/fase3-lissette/Bitacora_Eventos_Desempeño - BORRADOR.pptx` (transcripción en
`Docs/fase3-lissette/transcripcion_pptx.txt`). Pide: (1) registrar eventos observables por colaborador,
(2) que se reflejen en la evaluación de desempeño, (3) reportes, (4) ver cómo encaja con los planes
de acción (`Docs/diseno-plan-accion-medio-ano.md`, aún no implementado).

**Rama:** `feature/bitacora-eventos` (desde `feature/crud-competencias`). **Backend:** repo
`C:\Users\ralcantara\source\repos\EvaluacionEmpleadosApi` (ASP.NET + EF, `DatosContext`), desplegar
primero en `:7071` / `Evaluaciones_Test` (nunca copiar web.config ni appsettings).

---

## 0. Lo que pide el borrador de RRHH (lámina por lámina)

| Lámina | Elemento | Traducción al sistema |
|---|---|---|
| 1 | Nombre, cargo, fecha de ingreso "[Sistema]" + selector de colaborador + "IR A BITÁCORA" | Página `Bitacora`: el supervisor elige un colaborador de su equipo (mismo origen que `EvaluarSubordinados`: `getsubordinados`); datos del padrón `Empleados` (NOMBREUNIDO, CARGO). Fecha de ingreso no existe en `Empleados`: pedir el campo al core RRHH o mostrar FECHAPOSTULACION |
| 2 | Fecha del hecho (no del registro), descripción situación·acción·resultado, competencias evidenciadas, "hechos, no interpretaciones" | Validaciones: `fechaEvento <= hoy`, descripción mínima 30 caracteres, al menos 1 competencia; `fechaRegistro` la sella el servidor; texto guía dentro del formulario |
| 3 | Tipo (Logro, Incumplimiento, Iniciativa, Conducta), Impacto, descripción, 12 competencias multiselección, botones +/− | Catálogo cerrado de tipos; **Impacto** = Alto/Medio/Bajo (asunción a confirmar); competencias = tabla `Objetivo` agrupada por `GrupoCompetencia` (las 12 del pptx coinciden con Ids 1–12 / 22–34) |

**Cómo "se refleja" en la evaluación (decisión de diseño de esta fase):** la bitácora es **evidencia,
no puntuación**. En el formulario del supervisor (medio año y final), junto a cada competencia se
muestra el conteo de eventos del periodo por tipo (p. ej. "2 logros · 1 incumplimiento") y un
desplegable con las descripciones. No altera `repuestasupervisor` ni el cálculo. Si RRHH quiere
ponderación automática, es una fase posterior con regla explícita.

**Encaje con el plan de acción:** los eventos de tipo *Incumplimiento* y *Conducta* del periodo se
listan como "insumo sugerido" en la matriz del plan de acción cuando esta se implemente; en esta
fase solo se deja el endpoint de consulta por periodo listo (B2) y se documenta.

## 1. Preguntas abiertas para RRHH (no bloquean F0–F1; bloquean detalles de F2)

1. ¿Solo el supervisor inmediato registra, o también RRHH/admin sobre cualquier empleado?
2. ¿El colaborador ve su bitácora? Propuesta: sí, en modo lectura, desde su evaluación.
3. ¿Se pueden editar o eliminar eventos? Propuesta: editar/eliminar solo el autor y solo mientras el
   periodo esté abierto; queda `fechaModificacion` y borrado lógico (`activo = 0`).
4. ¿Qué significa "Impacto"? Propuesta: Alto / Medio / Bajo.
5. ¿La bitácora es continua (todo el año) y se corta por fechas del periodo al evaluar? Propuesta: sí.
6. Fecha de ingreso: ¿la provee el core RRHH (`/api/Usuarios` de ReportViewApi2) o se omite?

## 2. Modelo de datos (F0, lo escribe el orquestador)

```
BitacoraEvento
  Id int PK identity
  EmpleadoSecuencial int NOT NULL        -- colaborador observado (Empleados.SECUENCIAL)
  RegistradoPorSecuencial int NOT NULL   -- autor (supervisor)
  FechaEvento date NOT NULL              -- fecha del hecho
  FechaRegistro datetime2 NOT NULL       -- sellada por el servidor
  FechaModificacion datetime2 NULL
  Tipo varchar(20) NOT NULL              -- Logro | Incumplimiento | Iniciativa | Conducta
  Impacto varchar(10) NOT NULL           -- Alto | Medio | Bajo
  Descripcion nvarchar(2000) NOT NULL
  Activo bit NOT NULL DEFAULT 1
BitacoraEventoCompetencia
  Id int PK identity
  BitacoraEventoId int FK -> BitacoraEvento (cascade)
  ObjetivoId int FK -> Objetivo           -- competencia evidenciada
  UNIQUE (BitacoraEventoId, ObjetivoId)
Índices: (EmpleadoSecuencial, FechaEvento), (RegistradoPorSecuencial)
```

Migración EF `AddBitacoraEventos` aplicada primero en `Evaluaciones_Test`. Contratos TypeScript en
`src/app/Models/Bitacora/IBitacora.ts` (`IBitacoraEvento`, `IBitacoraEventoCompetencia`,
`IBitacoraResumenCompetencia`, `TipoEvento`, `ImpactoEvento`).

## 3. Contrato del API (F1)

| Método | Ruta | Respuesta | Reglas |
|---|---|---|---|
| GET | `/api/BitacoraEventos?empleadoid=&desde=&hasta=&tipo=&objetivoid=` | `BitacoraEvento[]` con `competencias[]` (id, objetivoId, nombre, grupo) y `registradoPorNombre`, orden `FechaEvento` desc | solo `Activo=1`; `desde/hasta` opcionales |
| GET | `/api/BitacoraEventos/{id}` | evento | 404 si no existe o inactivo |
| POST | `/api/BitacoraEventos` | 201 + evento | valida: empleado existe, `FechaEvento <= hoy`, tipo e impacto en catálogo, descripción 30–2000, ≥1 competencia existente y sin repetir; `FechaRegistro = DateTime.Now`; 400 con mensaje por regla |
| PUT | `/api/BitacoraEventos/{id}` | 204 | mismas validaciones; solo el autor (`RegistradoPorSecuencial` del body debe coincidir) → 403; reemplaza competencias; sella `FechaModificacion` |
| DELETE | `/api/BitacoraEventos/{id}?secuencial=` | 204 | borrado lógico; solo el autor → 403 |
| GET | `/api/BitacoraEventos/resumen?empleadoid=&periodoid=` | `[{objetivoId, nombre, grupo, logros, incumplimientos, iniciativas, conductas, total}]` | rango = fechas del periodo (`periods`); competencias del periodo |
| GET | `/api/BitacoraEventos/equipo?supervisor=&desde=&hasta=` | `[{empleadoSecuencial, nombre, total, porTipo{}}]` | insumo del reporte de equipo |

Sin autenticación adicional (el API no la usa hoy); la autoría se valida por secuencial como en el
resto del sistema. Documentar en `DOCUMENTACION_API_BITACORA.md` del repo del API.

## 4. Fases y tareas

Nomenclatura `B<N>` para no chocar con `T<N>` del historial. Un entregable de archivo por tarea;
paralelas solo si no comparten archivos. El constructor **no ejecuta bash** (spec lo prohíbe).

### F0 — Contratos y base (orquestador, sin constructor)
- Modelo EF `Models/BitacoraEvento.cs` + `BitacoraEventoCompetencia.cs`, `DbSet` en `DatosContext`,
  migración, script SQL equivalente en `scripts/bitacora_crear_tablas.sql` (por si la migración no se
  puede correr en prod), aplicación en `Evaluaciones_Test`.
- `IBitacora.ts` y constantes de catálogo (`TIPOS_EVENTO`, `IMPACTOS`).
- Baterías de F1 y F2 escritas por adelantado (`tests/bitacora/test_api_bitacora.py` con pytest contra
  `:7071`; specs Jasmine como `.spec.ts.pendiente`).
- Rama, andamiaje del tablero, commit.

### F1 — Backend (constructor C#, secuencial: un solo archivo)
- **B1 `Controllers/BitacoraEventosController.cs`** — todo el contrato del §3. Workspace
  `build/B1/` con copia del proyecto del API; compila con `dotnet build` (el orquestador lo corre, no el
  constructor). Batería: pytest HTTP contra `:7071` tras desplegar la DLL a prueba (28 casos: bordes de
  fecha, tipo inválido, descripción corta, competencia repetida, PUT de otro autor → 403, borrado lógico
  invisible en GET, resumen por periodo con eventos fuera de rango excluidos).
- Crítico Opus: ejecuta la batería + inyección en filtros, concurrencia de dos POST, `resumen` con
  periodo sin fechas.
- Aprobado → commit en el repo del API + despliegue a `:7071` (solo DLL).

### F2 — Frontend (tras F1; B2 primero, luego B3 ∥ B4 ∥ B5)
- **B2 `src/app/Helpers/bitacora-utils.ts`** — funciones puras: validación del formulario (mismas
  reglas del API, mensajes en español), agrupación de competencias por grupo, filtro/orden de eventos,
  conteo por tipo, filas de Excel, etiqueta y clase CSS por tipo/impacto, rango de fechas de un periodo.
  Batería Jasmine ~25 casos.
- **B3 `src/app/Controllers/Bitacora.ts`** — llamadas al API con `DatosServiceService`, catálogo de
  competencias del periodo activo cacheado (`shareReplay`), resumen por empleado/periodo, delega en
  `bitacora-utils`. Batería con `HttpClientTestingModule` ~15 casos.
- **B4 `src/app/Views/Components/Pages/bitacora/bitacora.component.ts|.html|.css`** — página
  `Bitacora` (láminas 1 y 3): selector de colaborador del equipo con foto (`fotoPadronUrl`), cabecera
  con nombre/cargo, lista de eventos con filtros (rango, tipo, competencia), formulario de registro y
  edición en diálogo (fecha, tipo con chips, impacto, descripción con contador, competencias en
  checkboxes agrupadas), eliminar con confirmación SweetAlert2, exportar Excel. Ruta `Bitacora` con
  `AuthGuard` y rol supervisor/admin; enlace en el menú junto a "Evaluar subordinados".
  Batería Jasmine ~20 casos + e2e del crítico contra `ng serve --configuration prueba` con `prodriguez`.
- **B5 `src/app/Views/Components/evaluacioncomponents/bitacora-resumen/bitacora-resumen.component.ts|.html`**
  — componente standalone de solo lectura `<app-bitacora-resumen [empleado] [periodo] [objetivoId]>`
  que muestra "N logros · N incumplimientos …" y despliega los eventos. Batería ~10 casos.
- **B6 (orquestador, integración fina)** — insertar `<app-bitacora-resumen>` en la fila de cada
  competencia de `form-evaluation-medio-ano.component.html` y de `FormEvaluationEmploye` (solo vista
  supervisor y colaborador en `Enviado`/`Completado`); pestaña "Bitácora" en el detalle del historial
  (`historial-evaluaciones`), reutilizando B5.

### F3 — Reporte y cierre (orquestador + un constructor)
- **B7 `src/app/Views/Components/Pages/reporte-bitacora/reporte-bitacora.component.ts|.html`** —
  reporte para RRHH/admin: por equipo y por competencia, rango de fechas, conteos por tipo, exportar
  Excel; usa `/equipo` y `/resumen`. Batería ~12 casos.
- Regresión completa de baterías, `ng build --configuration prueba`, auditoría Playwright con capturas
  en `Docs/auditoria-bitacora/`, actualización de `CLAUDE.md` (sección Bitácora), `README`, tablero.
- Despliegue a `evaluacionempleado-prueba` coordinado con QA; validación con Lissette y Graciela
  contra las láminas; luego producción (API primero, frontend después, pool dedicado).

## 5. Orden y paralelismo

```
F0 (orq.) ──► B1 (API) ──► B2 ──┬─► B3 ─┐
                                ├─► B4 ─┼─► B6 (orq.) ──► B7 ──► cierre F3
                                └─► B5 ─┘
```
B3, B4 y B5 pueden correr en paralelo (archivos distintos; B4 y B5 importan el contrato de B2 y la
interfaz de B3 fijada en la spec). Con 16 GB de RAM: **máximo dos constructores a la vez** y un solo
Monitor.

## 6. Criterios de aceptación de la fase (lo que verá RRHH)

1. `prodriguez` entra a Bitácora, elige a RALCANTARA (525), registra un *Logro* del 2026-09-05 con dos
   competencias; aparece primero en la lista con la fecha del hecho, no la de hoy.
2. Intentar guardar con fecha futura, sin competencia o con 10 caracteres de descripción muestra el
   mensaje exacto y no llama al API.
3. Otro supervisor no puede editar ni eliminar ese evento (403 y mensaje).
4. En la evaluación de medio año de RALCANTARA, la fila "Enfoque a resultados" muestra "1 logro" y al
   desplegar se lee la descripción; la puntuación no cambia.
5. El reporte de equipo de `prodriguez` para septiembre muestra 1 evento; exportado a Excel coincide.
6. Un evento eliminado desaparece de la lista, del resumen y del reporte, y sigue en la tabla con
   `Activo = 0`.

## 7. Trampas heredadas a respetar (de `Docs/PLAN.md` y la memoria)

- Baterías futuras como `.spec.ts.pendiente` (Karma compila todo).
- Workspaces con tsconfig `include` solo del entregable y sin `baseUrl`.
- Constructor sin `ejecutar_bash`; si el archivo no cambia en 15 min y compila, correr la batería y
  matar el proceso antes de relanzar.
- Crítico como `general-purpose` + `model: opus`.
- Un Monitor con `sleep 60`; nunca varios shells de fondo.
- e2e y baterías HTTP siempre contra `:7071`; prohibido producción.
- Para el API: copiar solo la DLL a prueba; la migración se aplica con script SQL revisado, no con
  `dotnet ef database update` contra producción.

## 8. Estimación

| Fase | Tareas | Constructor | Crítico (estimado) | Calendario |
|---|---|---|---|---|
| F0 | modelo, migración, contratos, baterías | — | — | 1 día |
| F1 | B1 | 1 (C#) | 1–2 rondas | 1–2 días |
| F2 | B2–B6 | 4 | 5–7 rondas | 4–5 días |
| F3 | B7 + cierre + QA | 1 | 1–2 rondas | 2 días + validación RRHH |

Total de obra: ~8–10 días hábiles de orquestación, más la validación de RRHH y la ventana de despliegue.

## 9. Hallazgos de F0 que condicionan las specs (2026-09-11)

1. **El catálogo de competencias se duplica por periodo**: `Objetivo` tiene una copia de las 12
   competencias por `PeriodoId` (prod: 1–12 en el 7 y 22–34 en el 8; Test: 1–12 y 59–70). La bitácora
   es continua entre periodos, así que un evento guarda el `ObjetivoId` de la copia vigente al
   registrarlo y el endpoint `resumen` empareja por **nombre normalizado** (sin acentos, minúsculas,
   espacios colapsados) contra las competencias del periodo consultado. B2 expone esa normalización.
2. **`Empleados` es una vista con filas duplicadas** (el secuencial 55 aparece 5 veces en Test):
   toda consulta por secuencial en B1 usa `FirstOrDefault`/`Any`, nunca `Single`, y los nombres de
   equipo se agrupan por secuencial.
3. **`dotnet ef` no arranca en la estación** (falta runtime .NET 7): la migración se escribió a mano
   y el `ModelSnapshot` no se regeneró; en producción se aplica `scripts/bitacora_crear_tablas.sql`
   y se inserta la fila en `__EFMigrationsHistory` como se hizo en Test.
4. **`GET /api/Periods/{id}`** existe y devuelve `fechaInicio`/`fechaFin`; el periodo 8 de Test va
   del 2026-06-01 al 2026-12-31.
