/* Datos del tablero — regenerado por el orquestador en cada evento. */
window.PROGRESO = {
  actualizado: "2026-09-10 14:15 — F1 y F2 integradas; F3 pendiente de auditoría con credenciales",
  rama: "feature/crud-competencias",
  fases: [
    { id: "F1", nombre: "Lógica pura", nota: "T1 sin dependencias; contrato en IHistorialEvaluacion.ts (orquestador)",
      tareas: [
        { id: "T1", archivo: "src/app/Helpers/historial-utils.ts", estado: "integrado", ronda: 2,
          pruebas: "23/23 + 16 del crítico", tokens: 34226, commit: "7afd27a",
          nota: "Crítico Opus ronda 2: APROBADO sin faltantes (99k tokens, 5 min). Integrado" }
      ] },
    { id: "F2", nombre: "Integración", nota: "T2 y T3 en paralelo tras T1 (archivos distintos)",
      tareas: [
        { id: "T2", archivo: "src/app/Controllers/HistorialEvaluacion.ts", estado: "integrado", ronda: 2,
          pruebas: "21/21 + 13 del crítico", tokens: null, commit: "77129eb", nota: "Lanzamientos 1 y 2 colgados en ejecutar_bash; 3º sin shell entregó en 6 min. Ronda 2 por un error de tipos inducido por la spec (getdatos<ModelResponse> anida dos veces)" },
        { id: "T3", archivo: "historial-evaluaciones.component.ts + .html", estado: "integrado", ronda: 1,
          pruebas: "11/11 + 12 del crítico", tokens: 240655, commit: "717f485", nota: "Crítico Opus: APROBADO 7/7 sin faltantes (112k tokens, 4 min). Integrado" }
      ] },
    { id: "F3", nombre: "Cierre (orquestador)", nota: "regresión, build prueba, Playwright + capturas",
      tareas: [
        { id: "AUD", archivo: "Docs/auditoria-historial/", estado: "pendiente", ronda: 0,
          pruebas: "regresión 55/55 · build prueba OK", tokens: null, commit: null, nota: "Guion e2e/historial-evaluaciones.spec.js listo; falta correrlo con credenciales contra ng serve --configuration prueba" }
      ] }
  ],
  eventos: [
    { hora: "10:40", tarea: "—", texto: "Plan creado (Docs/PLAN.md); contrato de modelos escrito por el orquestador" },
    { hora: "10:55", tarea: "T1", texto: "Spec T1.md y batería historial-utils.spec.ts (≈60 aserciones) escritas" },
    { hora: "11:02", tarea: "T1", texto: "Constructor qwen3.8 lanzado detached (pid 18708, workspace build/T1)" },
    { hora: "11:05", tarea: "—", texto: "Tablero publicado (Docs/progreso.html)" },
    { hora: "11:20", tarea: "—", texto: "Specs T2/T3 y sus baterías escritas; andamiaje commit a3a7655" },
    { hora: "12:32", tarea: "T1", texto: "Archivo completo desde 11:59 y tsc OK, pero el agente seguía iterando; batería corrida sin esperar: 22/23" },
    { hora: "12:33", tarea: "—", texto: "Trampa: Karma compila todos los *.spec.ts; baterías T2/T3 aparcadas como .pendiente" },
    { hora: "12:40", tarea: "T1", texto: "Constructor detenido (pid 18708); ronda 2 lanzada con la única corrección (T1-r2.md)" },
    { hora: "12:50", tarea: "T1", texto: "Ronda 2 terminó en 50 s; batería 23/23 → enviado al crítico Opus" },
    { hora: "13:00", tarea: "—", texto: "Trampa: tsc completo del proyecto tiene errores previos ajenos; los workspaces compilan solo su entregable (include) y sin baseUrl (rompe @commons-lib)" },
    { hora: "13:05", tarea: "T2", texto: "Constructor qwen3.8 lanzado (workspace build/T2)" },
    { hora: "13:05", tarea: "T3", texto: "Constructor qwen3.8 lanzado (workspace build/T3)" },
    { hora: "13:14", tarea: "T1", texto: "Crítico Opus: APROBADO (9/9 criterios, 16 pruebas propias). Observación: coincideEstado trata filtro de solo espacios como sin filtro; aceptado" },
    { hora: "12:50", tarea: "T3", texto: "Constructor terminó: 241k tokens, 13 turnos; batería 11/11 tras corregir un fixture del orquestador → crítico Opus" },
    { hora: "12:58", tarea: "T2", texto: "Colgado: bash hijo 14 min sin salida, Ollama sin peticiones desde 12:34. Matado y relanzado" },
    { hora: "13:08", tarea: "T3", texto: "Crítico Opus: APROBADO (7/7 criterios, 12 pruebas propias, tree limpio) → integrado" },
    { hora: "13:18", tarea: "T2", texto: "Segundo lanzamiento también colgado en bash; relanzado con prohibición de ejecutar_bash (spec T2.md, restricción operativa)" },
    { hora: "13:40", tarea: "T2", texto: "Archivo entregado a las 13:23; tsc: 1 error TS2740 en getHistorialConFiltros por getdatos<ModelResponse> (error de la spec del orquestador)" },
    { hora: "13:48", tarea: "T2", texto: "Ronda 2 lanzada (T2-r2.md): cambiar a getdatos<IEvaluacion[]>" },
    { hora: "13:55", tarea: "T2", texto: "Ronda 2 aplicada; tsc OK; batería 21/21 → crítico Opus" },
    { hora: "14:03", tarea: "T2", texto: "Crítico Opus: APROBADO (7/7, 13 pruebas propias). Observación: fecha por defecto en UTC; anotada para F3" },
    { hora: "14:05", tarea: "T2", texto: "Integrado, commit 77129eb + push" },
    { hora: "14:12", tarea: "—", texto: "Regresión de las 3 baterías: 55/55; ng build --configuration prueba OK" },
    { hora: "14:15", tarea: "AUD", texto: "Guion Playwright escrito; pendiente de credenciales para ejecutar" }
  ]
};
