# Bitácora — Rediseño del CRUD de Competencias

Registro de lo que hizo cada subagente, qué dijo el crítico y qué se commiteó.

| Fecha | Tarea | Agente | Resultado | Crítico | Commit |
|---|---|---|---|---|---|
| 2026-08-24 | Planificación | Orquestador | Plan general, fases y tablero creados | — | pendiente |
| 2026-08-24 | T1.1 Controlador vínculo | Subagente impl. | Controlador + modelo creados; detecta que el endpoint no usa `ModelResponse` | REQUIERE CORRECCIONES (matriz sin filtro real por periodo; tipo de `Update` miente) | pendiente |
| 2026-08-24 | T1.2 Ampliar Metas | Subagente impl. | Delete, lote, clonado en 2 pasos, resumen de peso | REQUIERE CORRECCIONES (documentar y advertir el punto ciego del GET /api/Goals) | pendiente |
| 2026-08-24 | T1.3 Ruta, menú, shell | Subagente impl. | Shell + 4 stubs + RoleGuard en `/Meta` | **APROBADO** | `f457ccc` (push a origin) |
| 2026-08-24 | Compilación | Orquestador | `npm run build` exit 0, sin avisos nuevos | — | — |
| 2026-08-24 | T1.1 correcciones | Subagente impl. | Matriz resuelve el catálogo del periodo por sí misma; `Update` tipado honesto | **APROBADO** (2ª pasada) | `6719c0d` |
| 2026-08-24 | T1.2 correcciones | Subagente impl. | `advertencias` en la previsualización + limitación documentada | **APROBADO** (2ª pasada) | `9ccc3b9` |
| 2026-08-24 | Hallazgo del crítico | Crítico | `tsc -p tsconfig.app.json` no cubre archivos que nadie importa; el respaldo de "compila" de T1.1 no era válido (el archivo sí compila, comprobado aparte) | — | — |
| 2026-08-24 | T2.2 Catálogo y categorías | Subagente impl. | Matriz con relectura y reversión; copiado con previsualización | **APROBADO** | `99f8515` |
| 2026-08-24 | T2.3 Ponderación y diagnóstico | Subagente impl. | Ponderación validada a 100; tres listados contrastados con SQL | **APROBADO** | `d784c3c` |
| 2026-08-24 | T2.1 Competencias por puesto | Subagente impl. | Listado con semáforo, alta múltiple, borrado, clonado | REQUIERE CORRECCIONES (gris demasiado ancho: 115 filas donde importan 8) | pendiente |
| 2026-08-24 | Reconciliación 115 vs 13 | Crítico | Mismo criterio, distinto universo; ambas medidas correctas. Corrige el reporte de T2.3: los 8 ocupados no son subconjunto de los 13 (94 y 102 están genuinamente vacíos) | — | `04-Defectos-API.md` |
| 2026-08-24 | Ajuste de rendimiento | Orquestador → T1.2 | `previsualizarClonado` pasa a leer por periodo (17 s → ~3 s) y la detección de invisibles se muda a Positions × Departments | en curso | pendiente |
| 2026-08-24 | Ajuste del clonado | T1.2 | 18,35 s → 2,9 s (1,0 s mismo periodo); detección de invisibles independiente del periodo | **APROBADO** | `0f8a785` |
| 2026-08-24 | T2.1 correcciones | T2.1 | Gris acotado a puestos ocupados (115 → 8); tooltip que ya no propone una comprobación que no comprueba | **APROBADO** (arbitraje: la objeción del subagente era correcta, el encargo del orquestador era contradictorio) | `6b34c54` |
| 2026-08-24 | Bloqueante detectado | Crítico | Cambio no solicitado en `app-routing.module.ts` que ponía RoleGuard a `/EvaluarSubordinados`: habría dejado sin evaluar a 2 gerentes sin fila en `EmpleadosRoles` y a sus 10 subordinados | — | revertido, no commiteado |
| 2026-08-25 | T3.3 Playwright y auditoría | Subagente verif. | Guion de 12 pasos y documento de evidencia; 5 corridas hasta cerrar los 9 criterios | **APROBADO** tras 3 rondas de crítica | (commit final) |
| 2026-08-25 | Hallazgo de método | Orquestador + crítico | Los 5 veredictos negativos del recorrido fueron del guion, ninguno del sistema | — | documentado en §2 de la auditoría |
| 2026-08-25 | Confirmación en vivo del defecto A | Corrida 1 | 14 filas creadas por la propia pantalla que el API siguió sin listar (ids 11372-11385) | — | `04-Defectos-API.md` §A |
| 2026-08-25 | Estado de la BD de prueba | Orquestador | 7.921 metas, 115 en el periodo 8, ponderaciones 30/70: idéntico a antes de empezar | — | verificado por SQL |
