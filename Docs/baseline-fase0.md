# Baseline Fase 0 — 2026-07-07

Ejecutado en rama `mejoras/fase-0`, commit base `2f47a8b`.

## npm run build (development)

- Resultado: **OK** (exit code 0)
- Warnings de CSS budget (6, no 4 como decía CLAUDE.md):
  - `FormEvaluationEmploye.component.css`: 3.18 kB (excede 2.00 kB budget en 1.18 kB)
  - `form-evaluation-medio-ano.component.css`: 2.32 kB (excede en 327 bytes)
  - `from-objetivo-extrategico.component.css`: 6.53 kB (excede en 4.53 kB)
  - `evaluacion.component.css`: 2.08 kB (excede en 79 bytes)
  - `historial-evaluaciones.component.css`: 4.90 kB (excede en 2.90 kB)
  - `evaluacion-reporte.component.css`: 2.72 kB (excede en 742 bytes)
- Warnings CommonJS: `file-saver`, `jszip`, `xlsx-js-style` (esperados, documentados como aceptables)

## ng build --configuration production

- Resultado: **OK** (exit code 0), mismos warnings que build de desarrollo.
- Nota: no existe script `build:prod` en `package.json` todavía — se añade en T1.3. Por ahora se invocó con `npx ng build --configuration production`.

## ng test --watch=false --browsers=ChromeHeadless

- Resultado: **27 FAILED, 28 SUCCESS, 7 skipped** (62 specs totales), exit code 0 (Karma no falla el proceso).
- Causas de fallo, agrupadas (deuda preexistente, no introducida por este plan):
  1. **Componentes standalone declarados como si fueran de NgModule** en sus specs autogenerados (`KrisComponent`, `EmojiratingComponent`, `EvaluarSubordinadosComponent`, `MetasComponent`, `HomeComponent`, `CardEmpleadoComponent`, `CriterialitemComponent`, `TablesComponent`, `ResultadoEvaluacionComponent`, `ReporteCursosComponent`, `SupervisorGoalsComponent`, `FormEvaluacionSupervisorComponent`, `CardEmpleadoComponent2` (card-empleado2), `EvaluacionComponent` — 14 specs con el mismo patrón de error.
  2. **NullInjectorError: No provider for HttpClient** al testear controllers/componentes sin `HttpClientTestingModule` (`DepartamentosComponent`, `NavmenuComponent`, `PuestosComponent`, `DashboardComponent`).
  3. **NullInjectorError: No provider for MatMdcDialogData / ActivatedRoute** en componentes de diálogo/ruta sin mocks (`VisorpdfComponent`, `FormPuestosComponent`, `FormMetasComponent`, `EvaluarequipoconsejalComponent`).
  4. **`AppComponent`**: `NG0304: 'app-navmenu' is not a known element` (3 specs).
  5. **`UtilsService`**: `TypeError: this.datos.getdatos is not a function` — cascada desde `Evaluacion` → `PorcientoDesempenoCompetencia.Gets()` sin mock de `DatosServiceService` (2 specs).
- **`Evaluacion.spec.ts`** (la única suite real, 655 líneas, documenta el bug de `CompetenciaFinal` que corrige T7.1): no aparece en la lista de fallos → se asume verde en este baseline (el reporter de Karma solo imprime los que fallan por nombre).
- Conclusión: el 100% de los fallos son specs autogenerados sin mocks de dependencias (deuda ya conocida, ver T8.4 "borrar specs muertos"). Ninguno toca lógica de negocio del piloto.

## Scripts Playwright de smoke (test-medio-ano.mjs, test-grabar-medioano.mjs, test-flujo-completo.mjs, test-setup-periodo.mjs)

**NO ejecutados en este baseline.** Hallazgo de riesgo: los 4 scripts tienen hardcodeado `API = 'http://192.168.7.222:7070/api'`. Según `environment.ts` (config por defecto / development) ese puerto **7070 es el mismo que apunta a producción** (dato "Final 2025"), mientras que el ambiente de prueba real (`Evaluaciones_Test`, periodo 8 / medio año) vive en el puerto **7071** (`environment.prueba.ts`). El plan (`plan-mejoras-sistema.md:84`) documenta estos scripts como "contra ambiente de prueba" pero el código no coincide con esa afirmación.

Estos scripts hacen **escrituras reales** (POST de `PorcientoDesempenoCompetencias`, grabar evaluaciones) usando `periodId: 8`. Ejecutarlos contra el puerto equivocado podría escribir datos de prueba sobre el periodo 8 de producción si ese periodo existe ahí también.

**Pendiente de confirmar con el usuario antes de ejecutar cualquiera de estos 4 scripts**: ¿el servidor en el puerto 7070 sirve realmente producción, o en este momento apunta a datos de prueba? Hasta confirmar, ninguna tarea de este plan que dependa de correr estos scripts (T0.2, y las verificaciones de F2 en adelante) se ejecutará contra escritura real — se limitará a `build:prod` + `ng test`.
