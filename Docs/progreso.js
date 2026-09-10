/* Datos del tablero — regenerado por el orquestador en cada evento. */
window.PROGRESO = {
  actualizado: "2026-09-10 13:00",
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
        { id: "T2", archivo: "src/app/Controllers/HistorialEvaluacion.ts", estado: "construyendo", ronda: 1,
          pruebas: "—", tokens: null, commit: null, nota: "Primer lanzamiento colgado 14 min en un bash hijo sin salida; matado y relanzado 12:59 (pid 15180)" },
        { id: "T3", archivo: "historial-evaluaciones.component.ts + .html", estado: "integrado", ronda: 1,
          pruebas: "11/11 + 12 del crítico", tokens: 240655, commit: "pendiente", nota: "Crítico Opus: APROBADO 7/7 sin faltantes (112k tokens, 4 min). Integrado" }
      ] },
    { id: "F3", nombre: "Cierre (orquestador)", nota: "regresión, build prueba, Playwright + capturas",
      tareas: [
        { id: "AUD", archivo: "Docs/auditoria-historial/", estado: "pendiente", ronda: 0,
          pruebas: "—", tokens: null, commit: null, nota: "" }
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
    { hora: "13:08", tarea: "T3", texto: "Crítico Opus: APROBADO (7/7 criterios, 12 pruebas propias, tree limpio) → integrado" }
  ]
};
