/* Datos del tablero — regenerado por el orquestador en cada evento. */
window.PROGRESO = {
  actualizado: "2026-09-10 11:05",
  rama: "feature/crud-competencias",
  fases: [
    { id: "F1", nombre: "Lógica pura", nota: "T1 sin dependencias; contrato en IHistorialEvaluacion.ts (orquestador)",
      tareas: [
        { id: "T1", archivo: "src/app/Helpers/historial-utils.ts", estado: "construyendo", ronda: 1,
          pruebas: "batería 0/—", tokens: null, commit: null,
          nota: "Constructor qwen3.8 lanzado (workspace build/T1)" }
      ] },
    { id: "F2", nombre: "Integración", nota: "T2 y T3 en paralelo tras T1 (archivos distintos)",
      tareas: [
        { id: "T2", archivo: "src/app/Controllers/HistorialEvaluacion.ts", estado: "pendiente", ronda: 0,
          pruebas: "—", tokens: null, commit: null, nota: "Spec y batería escritas; espera T1 aprobado" },
        { id: "T3", archivo: "historial-evaluaciones.component.ts + .html", estado: "pendiente", ronda: 0,
          pruebas: "—", tokens: null, commit: null, nota: "Spec y batería escritas; espera T1 aprobado" }
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
    { hora: "11:05", tarea: "—", texto: "Tablero publicado (Docs/progreso.html)" }
  ]
};
