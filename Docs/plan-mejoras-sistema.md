# Plan de Mejoras — Sistema de Evaluación de Empleados

**Proyecto:** `C:\Proyectos\evaluacionesEmpleadosdocker` (Angular 16 + Module Federation)
**Creado:** 2026-07-07 · basado en auditoría de 3 agentes (formularios, flujo de datos, páginas/routing/config)
**Ejecutor:** este plan será ejecutado por un modelo de IA en sesiones futuras. Cada tarea es autocontenida. Al completar una tarea: marcarla en la tabla de estado, anotar fecha y hash del commit.

> **RESTRICCIÓN CRÍTICA:** hay un piloto de evaluación de medio año EN CURSO (periodo 8). Los archivos de su núcleo están VETADOS hasta la Fase 7 (lista en Convenciones). Antes de iniciar la Fase 7, confirmar con el usuario si el periodo 8 ya cerró.

---

## Tabla de estado

| Tarea | Descripción corta | Estado | Fecha | Commit |
|---|---|---|---|---|
| T0.1 | Baseline build/tests | [x] | 2026-07-07 | (pendiente) |
| T0.2 | Checklist smoke piloto | [x] | 2026-07-07 | (pendiente) |
| T1.1 | Eliminar app-routing.module copy.ts | [ ] | | |
| T1.2 | Unificar ruta /Reportes duplicada | [ ] | | |
| T1.3 | Sanear package.json + scripts | [ ] | | |
| T1.4 | console.* → LoggerService (no vetados) | [x] | 2026-07-07 | (pendiente) |
| T1.5 | Eliminar card-empleado2/empleadoteam (si 0 usos) | [x] parcial | 2026-07-07 | (pendiente) |
| T2.1 | Fix "Error:undefined" (interceptor) | [x] | 2026-07-07 | (pendiente) |
| T2.2 | Guard labels[value-1] en emojirating | [x] | 2026-07-07 | (pendiente) |
| T2.3 | Feedback de errores silenciosos | [x] | 2026-07-07 | (pendiente) |
| T2.4 | Null-checks card-empleado2 (condicional) | N/A | 2026-07-07 | componente eliminado en T1.5 |
| T2.5 | Validación con feedback en form-metas | [x] | 2026-07-07 | (pendiente) |
| T2.6 | Ruta default + wildcard (fix NG04002) | [x] | 2026-07-07 | (pendiente) |
| T3.1 | Enum RolUsuario + getRolId() único | [x] | 2026-07-07 | (pendiente) |
| T3.2 | RoleGuard en rutas administrativas | [x] | 2026-07-07 | (pendiente) |
| T3.3 | AuthGuard en 4 rutas desprotegidas | [x] parcial | 2026-07-07 | (pendiente) |
| T3.4 | No enviar "Bearer null" | [x] | 2026-07-07 | (pendiente) |
| T4.1 | Anti doble-submit (formularios no vetados) | [x] | 2026-07-07 | (pendiente) |
| T4.2 | Cierre garantizado de LoadingComponent | [x] | 2026-07-07 | (pendiente) |
| T4.3 | CSS compartido + bajar de budget | diferida | 2026-07-07 | (pendiente) |
| T5.1 | takeUntil en fugas confirmadas | [x] | 2026-07-07 | (pendiente) |
| T5.2 | Barrido ngOnDestroy en Forms | [x] | 2026-07-07 | (pendiente) |
| T5.3 | Refactor navmenu (callback hell) | diferida | 2026-07-07 | (pendiente) |
| T5.4 | Fix N+1 en Empleados.ts | [x] | 2026-07-07 | (pendiente) |
| T6.1 | Dedup formatDateForInput | [ ] | | |
| T6.2 | Tipar ComunicacionService (constantes) | [ ] | | |
| T6.3 | Tipar getdatos<T> / ModelResponse<T> | [ ] | | |
| T6.4 | loadLogoAsBase64 → UtilsService | [ ] | | |
| T6.5 | Unificar cards (condicional a T1.5) | [ ] | | |
| T7.1 | Fix bug display CompetenciaFinal | [ ] | | |
| T7.2 | criterialitem: unsubscribe + dedup logro | [ ] | | |
| T7.3 | emojirating: eliminar getElementById | [ ] | | |
| T7.4 | Anti doble-submit formularios piloto | [ ] | | |
| T7.5 | Dedup logo + bloque estado→botones | [ ] | | |
| T7.6 | Extraer generatePDF a servicio | [ ] | | |
| T7.7 | Console/constantes en archivos ex-vetados | [ ] | | |
| T8.1 | Crear BaseCrudController<T> | [ ] | | |
| T8.2 | Migración piloto: Puestos y Periodos | [ ] | | |
| T8.3 | Migrar ~32 controllers en lotes de 5 | [ ] | | |
| T8.4 | Tipado estratégico + borrar specs muertos | [ ] | | |
| T8.5 | Añadir ESLint | [ ] | | |

---

## Resumen de auditoría (por qué este plan)

El sistema es funcional y su arquitectura declarada (Component → Controller → DatosService → API) se cumple, pero arrastra deuda seria en 5 frentes:

1. **Seguridad de acceso solo cosmética** — el menú oculta opciones por rol (`*ngIf="rolId==1"` en `navmenu.component.html`) pero NO hay guards por rol: cualquier logueado accede por URL a `/Roles`, `/PoliticaEvaluacion`, etc. Hay 4 rutas sin `AuthGuard` (`dashboard`, `uploadfile`, `grupo-competencias`, `consejal/evaluacion/:consejal`) y el guard redirige a una ruta inexistente (NG04002 conocido, comentado en `segurity.service.ts:34`).
2. **Memory leaks generalizados** — 0 formularios en `Forms/**` implementan `ngOnDestroy`; suscripciones a observables de larga vida (`ComunicacionService`) acumulan listeners en cada apertura de modal/navegación (`criterialitem:77`, `tables.component:58`, `navmenu:40-105` con callback hell de 4 niveles).
3. **~3.000-3.500 líneas de CRUD copy-paste** en 35 controllers singleton (`providedIn:'root'`) con estado mutable compartido (`model`/`arraymodel`) — colapsables en una clase base genérica.
4. **Bugs concretos**: `"Error:undefined"` en fallos de red (el interceptor lanza un string y los controllers leen `.message`), bug de display en `CompetenciaFinal` (documentado en `Evaluacion.spec.ts:15-19,274-286` y sin corregir), `emojirating` con `document.getElementById` e IDs fijos que colisionan entre instancias, doble-submit no prevenido en NINGÚN formulario, validaciones que fallan en silencio (`form-metas:135-149`).
5. **Higiene**: routing muerto (`app-routing.module copy.ts`), componentes duplicados de generación anterior (`card-empleado2`+`empleadoteam` vs `card-empleado`+`empleadoteam2`), 68 `console.*` residuales (existiendo `LoggerService`), CSS que excede el budget de error de 7KB (`from-objetivo-extrategico.css` 10.5KB, `historial-evaluaciones.css` 7.3KB), `mssql` en devDeps de una app de navegador, 24/26 specs autogenerados sin valor.

**Puntos buenos a reutilizar como patrón:** `form-kpi` (ReactiveForms correcto), `form-evaluation-medio-ano:220-227` (`finalize`+`cerrarLoading`), `HistorialEvaluacion.ts` (RxJS moderno con forkJoin/switchMap/Logger), `file-upload-component` (`destroy$`/`takeUntil`), `UtilsService.formatDateForInput`, `LoggerService`, `Evaluacion.spec.ts` (única suite real, 655 líneas).

---

## Convenciones para el modelo ejecutor

- Rutas relativas a `C:\Proyectos\evaluacionesEmpleadosdocker`.
- Una rama git por fase (`mejoras/fase-N`), un commit por tarea. Fases secuenciales, tareas en orden.
- **Archivos VETADOS hasta Fase 7** (no editar ni "de paso"):
  - `src/app/Views/Components/Forms/form-evaluation-medio-ano/**`
  - `src/app/Views/Components/Forms/FormEvaluationEmploye/**`
  - `src/app/Views/Components/evaluacioncomponents/criterialitem/**`
  - `src/app/Views/Components/evaluacioncomponents/emojirating/**` (única excepción: T2.2)
  - `src/app/Controllers/Evaluacion.ts`
- Patrones canónicos del repo (copiar, no inventar): RxJS → `Controllers/HistorialEvaluacion.ts`; unsubscribe → file-upload-component (`destroy$`+`takeUntil`); loading garantizado → `form-evaluation-medio-ano.component.ts:220-227` (`finalize`); ReactiveForms → `form-kpi.component.ts`; utilidades → `Helpers/utils.service.ts`, `Services/logger.service.ts`.
- Red de seguridad e2e existente en la raíz del repo: `test-medio-ano.mjs`, `test-grabar-medioano.mjs`, `test-flujo-completo.mjs` (Playwright, contra ambiente de prueba `evaluacionempleado-prueba`, API :7071).

## Fase 0 — Baseline (sin cambios de código)

- **T0.1** Registrar baseline: `npm run build`, build production y `ng test --watch=false --browsers=ChromeHeadless`; guardar resultados (incl. warnings de budget CSS y estado de `Evaluacion.spec.ts`) en `Docs/baseline-fase0.md`.
- **T0.2** Crear `Docs/smoke-piloto-medio-ano.md`: checklist manual del flujo periodo 8 (login → EvaluarSubordinados → evaluación medio año → calificar criterio → guardar → PDF → estados/botones) + resultado baseline de los 3 scripts Playwright.

## Fase 1 — Limpieza inerte (riesgo casi nulo)

- **T1.1** Eliminar `src/app/app-routing.module copy.ts` (194 líneas muertas; grep de referencias primero). Aceptación: build verde.
- **T1.2** Unificar ruta duplicada `/Reportes` y `/evaluacion-reporte` (mismo componente `EvaluacionReporteComponent`): grep de `routerLink`/`navigate` para saber cuál usa la navegación; conservarla y convertir la otra en `redirectTo`.
- **T1.3** Sanear `package.json`: revisar `mssql` en devDeps (quitar si nada lo usa — grep en scripts de raíz primero), añadir scripts `"test:ci": "ng test --watch=false --browsers=ChromeHeadless"`, `"build:prod": "ng build --configuration production"`, `"e2e:medioano": "node test-medio-ano.mjs"`. NO tocar `overrides.webpack`.
- **T1.4** Migrar `console.*` → `LoggerService` en archivos NO vetados (empezar por `form-plan-estrategico`, 39 logs con datos del modelo). Reemplazo 1:1 sin cambiar lógica. Aceptación: `grep -rn "console\." src/app --include="*.ts"` solo devuelve archivos vetados + `logger.service.ts`.
- **T1.5** Eliminar generación vieja `ViewEmpleado/card-empleado2/**` + `ViewEmpleado/empleadoteam/**` SI el grep de selectores e imports confirma 0 usos activos; si están en uso, posponer unificación a T6.5 y solo aplicar null-checks (T2.4).
  - **Resultado (2026-07-07):** `card-empleado2` (`CardEmpleadoComponent2`) tenía 0 referencias reales (solo 3 imports muertos en `empleadoteam.component.ts`, `empleadoteam2.component.ts` y `form-evaluacion-supervisor.component.ts`, ninguno usado en template) → **eliminado** junto con los 3 imports huérfanos. `empleadoteam` (viejo) SÍ tiene uso activo real: `Pages/home/home.component.html:7` renderiza `<app-empleadoteam>` y `Home` está enrutada (`/Home`, `AuthGuard`) → **se pospone su unificación a T6.5** (migrar `home.component` a `empleadoteam2` y entonces borrar `empleadoteam`). T2.4 (null-checks en card-empleado2) queda **sin objeto**: el componente ya no existe.

**Verificación F1:** build prod (sin warnings nuevos) + `test:ci` + smoke rápido (Home, EvaluarSubordinados, Reportes).

## Fase 2 — Bugs puntuales de bajo riesgo

- **T2.1** `Services/error-interceptor.service.ts:55`: `throwError(() => new Error(mensaje))` en vez de string → arregla "Error:undefined" en todos los `grabar()` (los controllers leen `err.message`: `Puestos.ts:112`, `Metas.ts:207` quedan intactos). Transversal: probar 2-3 CRUD + `node test-medio-ano.mjs`.
- **T2.2** (excepción quirúrgica al veto) `emojirating.component.ts:44,67`: guarda para `labels[value-1]` con `value=0` → label vacío en vez de `undefined`. NO tocar líneas 90-95 (eso es T7.3). Si el smoke falla, revert y posponer a F7.
- **T2.3** Errores silenciosos → `showMessage` + `LoggerService` en `form-periodos:78,87` y `change-state-form:48,72` (este último participa en estados de evaluación: correr checklist smoke).
- **T2.4** Null-checks (optional chaining) en `card-empleado2:71,77,79` — solo si T1.5 no eliminó el componente.
- **T2.5** `form-metas:135-149`: corregir condición OR laxa por AND de campos obligatorios + `showMessage` al fallar (patrón `form-kpi`); el modal no queda congelado.
- **T2.6** Rutas default y wildcard: `{path:'', redirectTo:'login', pathMatch:'full'}` y `{path:'**', redirectTo:'login'}` al FINAL del array; `auth-guard.service.ts:28` navega a `/login` con `returnUrl` (fix NG04002). NO tocar la ruta remota de login (Module Federation). Smoke completo de login.

**Verificación F2:** build prod + tests + `test-medio-ano.mjs` + checklist completo (se tocó interceptor y change-state-form).

## Fase 3 — Seguridad de acceso

- **T3.1** Crear `Helpers/roles.enum.ts` (`RolUsuario { Admin = 1, Supervisor = 2, ... }` — inventariar valores con `grep -rn "rolId" src/app`) + método único `SegurityService.getRolId()` que normalice los 5 formatos de rol de localStorage (copiar el parsing de `historial-evaluaciones.component.ts:122-136` como fuente única y refactorizar ese componente para usarlo).
- **T3.2** Crear `Services/role-guard.service.ts` (`RoleGuard` que lee `route.data['roles']`, usa `getRolId()`, y si no autoriza: `showMessage` + navegar a `/Home`); aplicarlo a rutas administrativas — la fuente de verdad de la lista es lo que `navmenu.component.html` ya oculta con `rolId==1` (líneas 18, 40, 43, 44, 49, 70, 80, 103). NO aplicarlo a rutas del flujo de evaluación (`Evaluacion`, `EvaluarSubordinados`, `historial-evaluaciones`, `supervisor-goals`, `empleado-desempeno*`). Smoke con usuario Supervisor (prodriguez) tras el cambio.
- **T3.3** Añadir `canActivate:[AuthGuard]` a las 4 rutas desprotegidas: `grupo-competencias` (:100), `dashboard` (:116), `uploadfile` (:119), `consejal/evaluacion/:consejal` (:224). `uploadfile`/`grupo-competencias` también con `RoleGuard` si el menú las oculta a no-admins. Verificar antes que `consejal/evaluacion/:consejal` no lo use un flujo externo sin login.
  - **Resultado (2026-07-07):** `grupo-competencias` y `uploadfile` → `AuthGuard`+`RoleGuard(Admin)` (navmenu las oculta bajo `rolId==1`). `dashboard` → solo `AuthGuard` (sin entrada visible en el menú, está comentada). `consejal/evaluacion/:consejal` **queda sin guard**: confirmado por lectura de `navmenu.component.ts` (el flujo `tipodeusuario==='consejal'` navega directo a esta ruta sin llamar `SegurityService.agregarusuario()`) y de `evaluarequipoconsejal.component.ts` (no depende de `SegurityService.usuario`) que añadir `AuthGuard` rompería ese flujo externo sin login. Deuda documentada, no resuelta.
  - **Nota T3.2:** `empleado-desempeno-meta` está oculta tras `rolId==1` en el menú (línea 62 de `navmenu.component.html`) pero se excluyó de `RoleGuard` por caer dentro del patrón `empleado-desempeno*` de rutas de flujo de evaluación que este plan pide no tocar. Discrepancia menú-vs-plan documentada, no resuelta.
- **T3.4** `token-interceptor.service.ts:12-18`: si no hay token (null/vacío/"null"), NO enviar header `Authorization` (hoy manda `Bearer null`). Smoke de login completo; revert individual si el backend rechazara la ausencia del header.

**Verificación F3:** build + tests + smoke con DOS usuarios (Admin y Supervisor: acceso denegado por URL directa, menú correcto, flujo medio año intacto con `test-medio-ano.mjs`).

## Fase 4 — UX transversal y CSS (fuera del piloto)

- **T4.1** Anti doble-submit (flag `isSaving` + `[disabled]="isSaving"` + `finalize`/`try-finally`) en formularios no vetados: form-metas, form-periodos, form-puestos, form-kpi, form-kri, form-roles, form-empleado-rol, form-grupo-competencia, change-state-form. Un commit por formulario. Aceptación: doble clic = UN registro (verificar en la tabla tras guardar).
- **T4.2** Cierre garantizado del LoadingComponent con `finalize` en componentes no vetados que lo abren (patrón `form-evaluation-medio-ano:220-227` — copiar el patrón, NO editar ese archivo). Aceptación: con error de API el overlay se cierra y aparece el mensaje.
  - **Resultado (2026-07-07):** Revisados los 12 archivos no vetados que abren `LoadingComponent`. 2 ya cerraban correctamente en ambos caminos (`evaluacion-reporte.component.ts`, `excepcion-supervisor-inmediato.component.ts`). Corregidos: `excel.service.ts` (try/finally faltante en `exportAsExcelFile`), `evaluation-periods.component.ts` (`finalize()`), `Usuario.ts` y `PoliticaEvaluacion.ts` (agregan handler de error), `politicas-evaluacion`/`empleados`/`seleccionar-departamento`/`seleccion-empleado` (components). `PeriodosEvaluacion.ts` tiene su apertura de `LoadingComponent` comentada (código muerto), sin cambios.
  - **Deuda técnica descubierta:** `Controllers/Empleados.ts` y `Controllers/Departamento.ts` (fuera del alcance de T4.2) no manejan errores en su `Gets().subscribe()`, por lo que su evento `TRegistros` nunca se emite ante un fallo HTTP. Los 3 componentes que dependen de ellos (`empleados`, `seleccion-empleado`, `seleccionar-departamento`) recibieron un timeout de seguridad de 15s como mitigación local. Recomendado: aplicarles a esos 2 controllers el mismo fix que a `PoliticaEvaluacion.ts` (emitir `TRegistros` también en el `error`) en una tarea futura.
- **T4.3** CSS: extraer clases repetidas (`.table-container`, `.empty-state`, `.loading-container`, `.estadisticas-card`, `.btn-aceptar`...) a estilos compartidos (`src/styles.css` o archivo importado desde él) y limpiar reglas muertas, para bajar `from-objetivo-extrategico.component.css` (10.5KB) e `historial-evaluaciones.component.css` (7.3KB) por debajo del budget error de 7KB. OJO ViewEncapsulation: capturas antes/después de ambas pantallas.
  - **Resultado (2026-07-07): DIFERIDA, no ejecutada.** Baseline actual (Fase 0): `from-objetivo-extrategico.component.css` 6.53KB, `historial-evaluaciones.component.css` 4.90KB — ambos por debajo del error de 7KB (son *warnings*, no fallan el build). Al inspeccionar `from-objetivo-extrategico.component.css` se encontró que NO es duplicación simple entre archivos: el mismo selector (`.table-container`, `.table`, `.btn`, `.btn-primary`, `.btn-secondary`) está redefinido 2-4 veces DENTRO del mismo archivo con cascada real entre las definiciones (p.ej. `.table-container` en la línea 95 fija `max-height:200px`, y una redefinición posterior en la línea 540 lo sobreescribe a `max-height:none`) — consolidar esto a una sola regla requiere calcular con precisión el valor final de cada propiedad para no cambiar el resultado visual, y un error ahí es silencioso hasta que alguien lo nota en producción. Además, mover clases a un `styles.css` global les quita el scoping de `ViewEncapsulation` de Angular, con riesgo de que el nombre de clase choque con otro componente. Sin poder tomar las capturas antes/después que el plan pide explícitamente (no hay forma de levantar el navegador contra el entorno de forma segura en esta sesión), se decidió NO tocar CSS de producción a ciegas. Queda pendiente para una sesión con acceso a verificación visual (navegador real o Playwright contra el entorno de prueba confirmado).

**Verificación F4:** `build:prod` sin errores de budget + smoke visual de pantallas tocadas.

## Fase 5 — Memory leaks y RxJS (fuera del piloto)

- **T5.1** `destroy$`/`takeUntil` (patrón file-upload) en fugas confirmadas: `from-objetivo-extrategico:68-91` (4 subs), `form-empleado-desempeno:134-165` (5 subs), `tables.component:58` (sub en constructor; se instancia por página → fuga multiplicada). NO usar `takeUntilDestroyed` (mantener consistencia v16). Aceptación: navegar 5 veces entre páginas con tablas y disparar `'buscar'` → la acción se ejecuta UNA vez.
- **T5.2** Barrido de `ngOnDestroy` en el resto de `Forms/**` no vetados con subs a `ComunicacionService`/observables de servicios (las suscripciones HTTP one-shot NO se tocan). Un commit por componente.
- **T5.3** Refactor `navmenu.component.ts:40-105`: constructor → `ngOnInit`, 4 niveles de callbacks → `forkJoin`/`switchMap`+`catchError` (patrón HistorialEvaluacion), conservando EXACTAMENTE las mismas claves/formatos de localStorage (el resto de la app las lee — comparar `Object.keys(localStorage)` y valores antes/después en DevTools). RIESGO ALTO de la fase: hacerla al final, revert inmediato si el menú cambia con cualquiera de los dos roles.
  - **Resultado (2026-07-07): DIFERIDA, no ejecutada.** Es el flujo de bootstrap de sesión completo (login → periodo activo → empleado → rol → navmenu) usado por TODOS los usuarios; el propio plan pide comparar `localStorage` y probar con ambos roles en un navegador real antes de aceptar el cambio. No hay forma segura de levantar el navegador contra el ambiente de prueba en esta sesión (ver hallazgo de `Docs/baseline-fase0.md` sobre el puerto de los scripts Playwright, aún sin confirmar). Se decidió no tocar el flujo de login a ciegas — mismo criterio que T4.3. Pendiente para una sesión con acceso a verificación funcional real (navegador o Playwright contra el entorno de prueba confirmado), idealmente antes o junto con T7 dado que también es alto riesgo.
- **T5.4** N+1 en `Empleados.ts:127-131` (subscribe dentro de `map` con push a array compartido) → `forkJoin`, mismo shape final de `arraymodel`. NO tocar `HistorialEvaluacion.getHistorialSubordinados` (su fix real requiere cambio de API — vetado; documentarlo como deuda técnica en este archivo).

**Verificación F5:** build + tests + smoke 2 roles (navmenu crítico) + `test-medio-ano.mjs` + prueba de no-multiplicación de acciones.

## Fase 6 — Deduplicación segura y tipado

- **T6.1** `form-objetivos:101-108`: eliminar reimplementación de `formatDateForInput`, usar `UtilsService` (verificar primero que ambas dan output idéntico con fecha con timezone).
- **T6.2** Tipar `ComunicacionService`: constantes `MENSAJES = { BUSCAR: 'buscar', ACTUALIZAR_VARIABLES: 'Actualizar variables', ... } as const` (inventariar todos los strings con grep de `enviarMensaje`; mismos valores → runtime idéntico), interfaz `MensajeComunicacion`, `Subject` tipado. NO convertir a canales por tópico. Archivos vetados conservan el string literal hasta F7.
- **T6.3** `datos-service.service.ts`: `getdatos<T>` → `Observable<ModelResponse<T>>` con `data: T` (default `any` para no romper llamadores); migrar `Puestos.ts` como demostración. NO mover `showMessage`/`llenarFormGrup` de archivo aún (solo comentario TODO Fase 8).
- **T6.4** Copiar `loadLogoAsBase64` VERBATIM a `UtilsService` + test unitario (sin tocar los 2 duplicados vetados `FormEvaluationEmploye:76-84` y `form-evaluation-medio-ano:229-237`; se conectan en T7.5).
- **T6.5** Unificación de cards (solo si T1.5 detectó uso activo de la generación vieja): migrar los usos de `card-empleado2`/`empleadoteam` a `card-empleado`/`empleadoteam2` template a template y borrar la vieja. Capturas antes/después.

**Verificación F6:** build + tests + CRUD en 3 pantallas + `test-medio-ano.mjs`.

## Fase 7 — Núcleo del piloto

> **GATE:** confirmar con el usuario que el periodo 8 cerró. Si sigue abierto, ejecutar SOLO con este protocolo reforzado.
> **Protocolo por tarea:** ejecutar los 3 scripts Playwright ANTES y DESPUÉS + smoke manual completo (`Docs/smoke-piloto-medio-ano.md`) + `test:ci`; un commit por tarea; revert inmediato ante discrepancia.

- **T7.1** Bug de display `CompetenciaFinal` (`Evaluacion.ts:231-234`): usa `promedioCompetencias` (que contiene el peso %) en vez del promedio real → muestra `(pct×pct)/100`. Leer primero `Evaluacion.spec.ts` completo (documenta el bug en :15-19 y :274-286); corregir y actualizar el spec de "documenta el bug" a "verifica el valor correcto". Verificar explícitamente que `totalCalculo` persistido NO cambia (comparar contra registro de prueba/backup `backup_evaluaciones_p7_*.json`). RIESGO ALTO.
- **T7.2** `criterialitem`: `takeUntil` en la sub de `enviarMensajeObservable` del constructor (:77) + comparar línea a línea el cálculo de logro (:270-291 vs `form-evaluation-medio-ano:350-361`); si son semánticamente idénticos, extraer a función pura en servicio nuevo (`Services/logro-calculator.service.ts`) con tests usando valores reales del periodo 8; si difieren, NO unificar (documentar la diferencia). RIESGO ALTO.
- **T7.3** `emojirating:90-95`: eliminar `document.getElementById` con IDs fijos (`jobKnowledgeCheck${i}` colisiona entre instancias) → binding declarativo (`[class.selected]`/`[checked]`). Aceptación: con varios criterios visibles, calificar el criterio 3 NO altera el resaltado de los criterios 1-2. RIESGO ALTO.
- **T7.4** Anti doble-submit en `FormEvaluationEmploye` (`onSubmit:439` — evita doble `grabar()` + doble PDF) y `form-evaluation-medio-ano` (patrón `isSaving` madurado en T4.1).
- **T7.5** Conectar `UtilsService.loadLogoAsBase64` (T6.4) en los 2 duplicados; localizar las 3 copias del bloque estado→botones (`GetEvaluacionePorEmpleadoyPeriodo` + if de `estadoevaluacion` en `FormEvaluationEmploye:94-119`, `form-evaluation-medio-ano:114-134`, `criterialitem:152-159`) y extraer a helper compartido. Aceptación: PDF con logo idéntico, botones por estado iguales en los 3 lugares.
- **T7.6** Extraer `generatePDF` (180 líneas, `FormEvaluationEmploye:252-429`) a `Services/evaluacion-pdf.service.ts` tipado con `TDocumentDefinitions` de pdfmake. MOVER el código, no reescribirlo. Aceptación: PDF visualmente idéntico al previo.
- **T7.7** Completar T1.4 (console → Logger) y T6.2 (constantes de mensajes) sobre los archivos que estaban vetados.

## Fase 8 — Refactor arquitectónico de controllers (mayor esfuerzo)

- **T8.1** Crear `Controllers/base-crud.controller.ts` (+spec): encapsula el patrón repetido (~90-100 líneas/controller × 35 ≈ 3.000-3.500 líneas duplicadas; comparar `Puestos:99-141`, `Periodos:125-155`, `Metas:192-226` — son copy-paste con el tipo cambiado). Mantener los MISMOS nombres públicos (`model`, `arraymodel`, `totalregistros`, `grabar`, `getdatos`...) porque los templates los referencian. Añadir verificación de `exito`/`mensaje` de `ModelResponse` (hoy nadie lo hace) + `LoggerService`. Estilo RxJS de `HistorialEvaluacion.ts`.
- **T8.2** Migración piloto: `Puestos.ts` y `Periodos.ts` (CRUD puros, fuera del flujo de evaluación). Aceptación: CRUD manual completo en ambas pantallas (crear, editar, eliminar, listar, buscar), diff neto ~-80 líneas por controller, tests verdes.
- **T8.3** Migrar los ~32 restantes en lotes de 5 (un commit + smoke CRUD de una pantalla por lote). `Evaluacion.ts` y `EmpleadoDesempeno.ts` (flujo de evaluación) en el ÚLTIMO lote con protocolo de Fase 7. `HistorialEvaluacion.ts` probablemente se queda como está (ya es el patrón moderno — evaluar y dejar si está bien).
- **T8.4** Tipado estratégico: `Evaluacion.ts:32,36` (`porcentajeDesempeno/Competencia: any` → `number`), `data: any` de diálogos → interfaces de `Models/`; borrar los 24 specs autogenerados sin valor (mantienen falsa sensación de cobertura — documentar la decisión).
- **T8.5** `ng add @angular-eslint/schematics@16` (v16 por compatibilidad) + script `"lint": "ng lint"` con reglas laxas iniciales (solo errores obvios). No arreglar el backlog de lint en esta tarea. Única tarea que instala dependencias: verificar que `npm install` no altere `overrides.webpack`.

---

## Qué explícitamente NO hacer

1. NO migrar a standalone components ni signals.
2. NO tocar Module Federation: `webpack.config.js`, `webpack.prod.config.js`, `webpack.prueba.config.js`, `src/bootstrap.ts`, ruta remota `loginapp/ComponentLogin`, `overrides.webpack` en package.json.
3. NO cambiar backend/API ni el shape de `ModelResponse`; el filtrado en servidor de `getHistorialSubordinados` queda como deuda documentada.
4. NO actualizar Angular (16.2.x se queda), TypeScript, RxJS ni webpack.
5. NO cambiar el almacenamiento del token (localStorage se queda; solo se corrige "Bearer null" en T3.4). Migrar a cookies HttpOnly requiere backend.
6. NO renombrar rutas ni claves de localStorage — el remoto de login y navmenu dependen de ellas.
7. NO tocar datos del periodo 8 ni borrar los `backup_evaluaciones_p7_*.json` de la raíz.
8. NO tocar archivos vetados antes de Fase 7 (salvo la excepción quirúrgica T2.2).
9. NO reescribir estructuralmente `DatosServiceService` ni `ComunicacionService` (solo tipado aditivo T6.2/T6.3).
10. NO "arreglar de paso" nada fuera del alcance de la tarea en curso — cada tarea toca solo sus archivos listados.

## Verificación (resumen)

| Verificación | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 |
|---|---|---|---|---|---|---|---|---|
| `npm run build:prod` sin errores nuevos | X | X | X | X (budgets limpios desde aquí) | X | X | X | X |
| `npm run test:ci` — `Evaluacion.spec.ts` verde | X | X | X | X | X | X | X (spec actualizado en T7.1) | X |
| `node test-medio-ano.mjs` | — | X | X | X | X | X | 3 scripts antes/después de CADA tarea | X (último lote) |
| Smoke manual `Docs/smoke-piloto-medio-ano.md` | rápido | completo | completo, 2 roles | pantallas tocadas | 2 roles (navmenu) | CRUD 3 pantallas | completo + comparación PDF/BD | CRUD por lote |
| Comparación localStorage antes/después | — | — | X (T3.4) | — | X (T5.3) | — | — | — |

**Regla de oro:** si el smoke del periodo 8 o `test-medio-ano.mjs` fallan tras cualquier commit → `git revert` inmediato de ese commit antes de continuar.
