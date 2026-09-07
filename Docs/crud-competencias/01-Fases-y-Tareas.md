# Fases y Tareas — Rediseño del CRUD de Competencias

Cada tarea declara **los archivos que le pertenecen**. Dos tareas de la misma fase nunca comparten archivo, por eso pueden correr en paralelo. Ningún subagente toca archivos fuera de su lista.

## Contrato común (obligatorio para todos)

**Ubicación de la pantalla nueva**

```
src/app/Views/Components/Pages/configuracion-competencias/
├── configuracion-competencias.component.ts|html|css      ← shell con pestañas (T1.3)
└── tabs/
    ├── competencias-puesto/   (T2.1)
    ├── catalogo-categorias/   (T2.2)
    ├── ponderacion/           (T2.3)
    └── diagnostico/           (T2.3)
```

**Contrato de cada pestaña** — componente `standalone`, con:

```ts
@Input() periodoId!: number;          // lo entrega el shell
@Input() periodoActivo!: boolean;     // true si ese periodo es el activo (para advertencias)
@Output() cambios = new EventEmitter<void>();   // avisa al shell que hubo altas/bajas
```

**Convenciones del proyecto que hay que respetar**
- Los datos se piden por los **Controllers** de `src/app/Controllers/`, nunca con `HttpClient` directo.
- HTTP siempre vía `DatosServiceService` (`getdatos`, `getbyid`, `insertardatos`, `updatedatos`, `delbyid`).
- Mensajes al usuario con `datosService.showMessage(texto, titulo, 'success'|'info'|'warning'|'error')`.
- Confirmaciones con `ConfirmDialogComponent` (`src/app/Views/Components/shared/confirm-dialog/`).
- Logging con `LoggerService`, nunca `console.log`.
- Componentes `standalone: true` con Angular Material, como `evaluacion-desempeno-meta.component.ts`.
- Nada de credenciales ni URLs fijas: todo sale de `environment`.

**API disponible (no hay que tocar el backend)**

| Entidad | Endpoints |
|---|---|
| `Goal` | `GET /api/Goals`, `GET /api/Goals/{id}`, `GET /api/Goals/periodo`, `GET /api/Goals/puesto/{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| `Objetivo` | `GET/POST/PUT/DELETE /api/Objetivoes` |
| `CompetenciaCategoriaPuesto` | `GET/POST/PUT/DELETE /api/CompetenciaCategoriaPuestoes` |
| `PorcientoDesempenoCompetencia` | `GET/POST/PUT/DELETE /api/PorcientoDesempenoCompetencias` |
| `Positions` | `GET/POST/PUT/DELETE /api/Positions` |
| `CategoriaPuesto` | `GET/POST/PUT/DELETE /api/CategoriaPuestoes` |

> Cuidado con `Goals`: al **leer**, el campo llega como `objetivoId`; el **POST** del frontend usa `objetivoid`. El binding de .NET es case-insensitive al escribir, pero al leer hay que usar el nombre real (documentado en `scripts/clonar_goals_gh_p7_a_p8.py`).

---

## FASE 1 — Cimientos (3 tareas en paralelo)

### T1.1 — Controlador de vínculo competencia ↔ categoría
**Archivos propios:**
- `src/app/Models/CompetenciaCategoriaPuesto/ICompetenciaCategoriaPuesto.ts` (nuevo)
- `src/app/Controllers/CompetenciaCategoriaPuesto.ts` (nuevo)

**Qué hace:** controlador al estilo de `Objetivo.ts` para `/api/CompetenciaCategoriaPuestoes`, con `Gets`, `Get`, `insert`, `Update`, `Delete`, y dos helpers: `getPorCategoria(categoriaId)` y `getMatrizPorPeriodo(periodoId)` que devuelva, por competencia del periodo, las categorías vinculadas.

**Aceptación:** compila; los métodos usan `DatosServiceService`; no hay `console.log`; la interfaz refleja los campos reales del API (`Id`, `ObjetivoId`, `CategoriaPuestoId`).

### T1.2 — Ampliar el controlador de Metas (Goal)
**Archivos propios:**
- `src/app/Controllers/Metas.ts`
- `src/app/Models/Meta/IMeta.ts`

**Qué hace:**
1. `Delete(id: number): Observable<any>` usando `delbyid` (hoy no existe).
2. `insertarLote(metas: IMeta[]): Observable<...>` — alta múltiple secuencial con reporte de cuántas se crearon y cuántas fallaron.
3. Clonado en dos pasos (**así quedó implementado**, no como una sola función con bandera): `previsualizarClonado(origen, destino)` devuelve `{aCrear, duplicadas, advertencias}` y no escribe nada; `ejecutarClonado(aCrear)` inserta. La clave de duplicado es puesto + competencia + descripción normalizada.
4. `pesoTotalPorPuesto(periodoId, puestoSecuencial): Observable<number>`.

**Aceptación:** compila; el clonado nunca duplica; `Delete` llama a `DELETE /api/Goals/{id}`; se respeta `objetivoId` al leer y `objetivoid` al escribir; sin `console.log`.

### T1.3 — Ruta, menú, guard y shell con pestañas
**Archivos propios:**
- `src/app/app-routing.module.ts`
- `src/app/Views/Components/navmenu/navmenu.component.html`
- `src/app/Views/Components/Pages/configuracion-competencias/configuracion-competencias.component.ts|html|css` (nuevos)
- Stubs mínimos de las 4 pestañas en `.../tabs/**` (cada uno solo con el contrato `@Input/@Output` y un `<p>pendiente</p>`)

**Qué hace:**
1. Ruta `configuracion-competencias` con `canActivate: [AuthGuard, RoleGuard], data: { roles: [RolUsuario.Admin] }`.
2. Entrada en el menú **Configuración** con el texto "Configuración de Competencias".
3. Además, poner `RoleGuard` a la ruta existente `/Meta`, que hoy solo tiene `AuthGuard`.
4. Shell: selector de periodo arriba (por defecto el activo, usando `Periodos`), `mat-tab-group` con las 4 pestañas, y una franja de resumen del periodo elegido (nº de puestos con competencias / total de puestos activos).

**Aceptación:** `ng build` compila con los stubs; entrando como no-admin la ruta redirige; el ítem aparece en el menú solo para rol 1; el selector de periodo alimenta a las pestañas por `@Input`.

---

## FASE 2 — Pestañas (3 tareas en paralelo, requieren la Fase 1 terminada)

### T2.1 — Pestaña "Competencias por puesto"
**Archivos propios:** `.../tabs/competencias-puesto/*`

**Qué hace:**
- Lista de puestos activos del periodo con: departamento, nº de competencias, **peso total** y un semáforo (verde = 100, ámbar = no llega, rojo = se pasa o está en cero).
- Filtros por departamento, por puesto y un interruptor "solo puestos sin competencias".
- Al elegir un puesto: tabla de sus competencias (competencia, descripción, peso) con editar y **eliminar con confirmación**.
- **Alta múltiple:** un panel que lista todas las competencias del catálogo del periodo con casillas y un campo de peso por fila, para guardar todas de una vez (usa `insertarLote`).
- **Clonar:** diálogo para copiar desde otro puesto o desde el mismo puesto en otro periodo, con **previsualización** (cuántas se crean, cuántas se saltan) antes de ejecutar.
- Si el periodo es el activo, avisar antes de eliminar que puede haber evaluaciones en curso.

**Aceptación:** se puede crear, editar, borrar y clonar sin recargar la página; el semáforo de peso se recalcula tras cada operación; el borrado pide confirmación; los errores del API se muestran con su mensaje real, no con un texto genérico.

### T2.2 — Pestaña "Catálogo y categorías"
**Archivos propios:** `.../tabs/catalogo-categorias/*`

**Qué hace:**
- Mantenimiento del catálogo `Objetivo` del periodo elegido: alta, edición, borrado, agrupado por `GrupoCompetencia`.
- **Matriz de vinculación**: filas = competencias del periodo, columnas = categorías de puesto, celdas con casilla; marcar/desmarcar crea o borra en `CompetenciaCategoriaPuesto`.
- Botón "Copiar catálogo de otro periodo" con previsualización, equivalente al INSERT documentado en `Docs/proceso-configuracion-competencias-periodo8.md` §3.

**Aceptación:** marcar una casilla crea la fila y desmarcarla la borra, verificado releyendo del API; el copiado no duplica; una competencia usada por algún `Goal` no se puede borrar sin avisar.

### T2.3 — Pestañas "Ponderación" y "Diagnóstico"
**Archivos propios:** `.../tabs/ponderacion/*`, `.../tabs/diagnostico/*`

**Ponderación:** ver y editar `PorcientoDesempenoCompetencia` del periodo (Desempeño y Competencia); si el periodo no tiene filas, ofrecer crearlas copiando las del periodo anterior; validar que sumen 100.

**Diagnóstico:** tres listados sobre el periodo elegido, cada uno con su conteo y exportable a Excel con `ExcelService`:
1. Puestos con empleados activos y **sin competencias** en el periodo.
2. Puestos con `CategoriaPuestoId = 0` o que no existen en `positions` (empleado sin categoría válida).
3. Empleados activos **sin evaluación** en el periodo.

**Aceptación:** los tres listados coinciden con lo que devuelven las consultas SQL de referencia del documento del periodo 8; la ponderación no deja guardar si no suma 100.

---

## FASE 3 — Integración, crítica y evidencia

### T3.1 — Compilación e integración
Ejecutar `npm run build`, corregir errores y avisos nuevos, y revisar que la pantalla vieja `/Meta` siga funcionando.
**Aceptación:** build sin errores; sin errores nuevos de TypeScript respecto a la rama `master`.

### T3.2 — Crítica final
El subagente crítico revisa la fase completa contra los criterios del plan. No programa: devuelve *aprobado* o lista de correcciones. Se itera hasta aprobación.

### T3.3 — Verificación con Playwright y auditoría
Spec `e2e/crud-competencias.spec.js` contra `http://localhost:4200/evaluacionempleado` (levantado con `--configuration prueba`), que recorra: login → menú → periodo → alta múltiple → edición → borrado → clonado → matriz de categorías → ponderación → diagnóstico. Capturas en `e2e/capturas-crud-competencias/`.
**Aceptación:** `Docs/crud-competencias/03-Auditoria-Verificacion.md` con cada paso, su captura y el resultado.

---

## Control de commits

Un commit por tarea aprobada por el crítico, con `push` a `origin/feature/crud-competencias`. Mensaje: `feat(competencias): <tarea> — aprobado por crítico`.


---

## Notas de la Fase 1 para la Fase 2 (del subagente crítico, tras aprobar T1.1, T1.2 y T1.3)

Léelas antes de escribir código; son trampas reales, no teoría.

1. **`getMatrizPorPeriodo(periodoId)` ya filtra por periodo de verdad**; basta con un argumento. El segundo parámetro es un atajo de rendimiento y el controlador **no verifica** que esos ids pertenezcan al periodo: ante la duda, omítelo.
2. **Periodo sin competencias en el catálogo ⇒ `Map` vacío sin advertencia.** T2.2 debe pintar "este periodo no tiene competencias en el catálogo" y ofrecer copiar de otro periodo, no una matriz en blanco sin explicación.
3. **T2.1 debe mostrar `preview.advertencias` en el diálogo de clonado siempre**, aunque `aCrear` esté vacío, y no dejar ejecutar sin que el usuario las haya visto.
4. **El clonado de periodo completo (sin puesto declarado) no avisa de nada:** copia de menos en silencio. O exiges puesto declarado, o muestras un aviso fijo de "solo se clona lo que el API lista".
5. **El peligro más serio, para T2.3.** Si el Diagnóstico calcula "puestos sin competencias" a partir de `GET /api/Goals`, hereda el punto ciego del join con departamentos y reportará el puesto 19 como "sin competencias" **teniendo 12 en base de datos**; el usuario las crearía a mano y terminaría con 24. Hay que comprobar contra el API de prueba **cuál endpoint no arrastra el join** (`GET /api/Goals/periodo` es candidato, pero se comprueba, no se supone) y contrastar el resultado con las consultas SQL de `Docs/proceso-configuracion-competencias-periodo8.md` antes de dar la pestaña por buena.
6. **`insertarLote` es un `defer`:** cada suscripción reejecuta el lote completo. Una sola suscripción, nada de `async` pipe.
7. **Para el semáforo de un listado usa `resumenPorPuesto(periodoId)`**; `pesoTotalPorPuesto` es para un puesto puntual (descarga la tabla entera cada vez).
8. **Compara el peso con tolerancia, no con `=== 100`:** la suma de `weight` viene en crudo, sin redondeo.
9. **`cambios` dispara en el shell `getmetasperiodo` + `GET /api/Empleadoes` completo.** Emítelo una vez al terminar el lote, nunca por fila.
10. **Las pestañas viven en `<ng-template matTabContent>` y se destruyen al cambiar de tab.** El estado que deba sobrevivir va en un servicio.
11. **`tsc` y `npm run build` no validan archivos que nadie importa** (`tsconfig.app.json` parte de `src/main.ts`). Antes de afirmar "compila", comprueba con `--listFiles` que tu archivo esté en el grafo.
12. **`/Meta` ahora exige rol Admin.** Avisar a QA para que no lo reporte como falla.
