/* Datos del tablero de la Fase 3 (bitácora) — regenerado por el orquestador en cada evento. */
window.PROGRESO = {
  actualizado: "2026-09-11 10:35 — F0 COMPLETA; F1 lista para arrancar",
  rama: "feature/bitacora-eventos (frontend y API)",
  fases: [
    { id: "F0", nombre: "Contratos y base (orquestador)", nota: "modelo EF, migración, tablas en Evaluaciones_Test, contratos TS, baterías adelantadas",
      tareas: [
        { id: "MOD", archivo: "API: Models/BitacoraEvento.cs, BitacoraEventoCompetencia.cs, DatosContext", estado: "integrado", ronda: 1,
          pruebas: "dotnet build 0 errores", tokens: null, commit: "faa177f", nota: "Índices por empleado+fecha y autor; unicidad evento+competencia; borrado lógico" },
        { id: "MIG", archivo: "API: Migrations/20260911120000_AddBitacoraEventos.cs + scripts/bitacora_crear_tablas.sql", estado: "integrado", ronda: 1,
          pruebas: "tablas creadas en Evaluaciones_Test; fila en __EFMigrationsHistory", tokens: null, commit: "faa177f", nota: "dotnet ef no arranca sin runtime .NET 7: migración escrita a mano, snapshot sin regenerar" },
        { id: "CON", archivo: "src/app/Models/Bitacora/IBitacora.ts", estado: "integrado", ronda: 1,
          pruebas: "—", tokens: null, commit: "01f0cac", nota: "Tipos, catálogos, filtros, resumen por competencia y por empleado" },
        { id: "BAT", archivo: "tests/bitacora/test_api_bitacora.py", estado: "integrado", ronda: 1,
          pruebas: "38 casos recolectados (se ejecutan tras desplegar B1 en :7071)", tokens: null, commit: "01f0cac", nota: "El constructor nunca la ve. Ids de competencias del periodo 8 en Test: 59..70" }
      ] },
    { id: "F1", nombre: "Backend", nota: "B1 controlador del API (constructor C#); despliegue de la DLL a :7071",
      tareas: [
        { id: "B1", archivo: "API: Controllers/BitacoraEventosController.cs", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "Contrato §3 de PLAN-BITACORA.md" }
      ] },
    { id: "F2", nombre: "Frontend", nota: "B2 primero; B3 ∥ B4 ∥ B5 (máx. 2 constructores a la vez); B6 integración fina (orquestador)",
      tareas: [
        { id: "B2", archivo: "src/app/Helpers/bitacora-utils.ts", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" },
        { id: "B3", archivo: "src/app/Controllers/Bitacora.ts", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" },
        { id: "B4", archivo: "Pages/bitacora/bitacora.component.ts|.html|.css", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" },
        { id: "B5", archivo: "evaluacioncomponents/bitacora-resumen/", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" },
        { id: "B6", archivo: "form medio año, FormEvaluationEmploye, historial (integración)", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "orquestador" }
      ] },
    { id: "F3", nombre: "Reporte y cierre", nota: "B7 reporte RRHH; regresión, Playwright, despliegue a prueba, validación con Lissette",
      tareas: [
        { id: "B7", archivo: "Pages/reporte-bitacora/", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" },
        { id: "AUD", archivo: "Docs/auditoria-bitacora/", estado: "pendiente", ronda: 0, pruebas: "—", tokens: null, commit: "", nota: "" }
      ] }
  ],
  eventos: [
    { hora: "09:38", tarea: "—", texto: "Correo de Lissette Abad con el borrador pptx de la bitácora (Docs/fase3-lissette/)" },
    { hora: "10:05", tarea: "—", texto: "Plan de obra escrito: Docs/PLAN-BITACORA.md (commit 4bed7e3)" },
    { hora: "10:12", tarea: "—", texto: "Ramas feature/bitacora-eventos creadas en el frontend y en el API" },
    { hora: "10:15", tarea: "MOD", texto: "Modelos EF y DbSets escritos; dotnet build 0 errores" },
    { hora: "10:17", tarea: "MIG", texto: "dotnet ef falla (falta runtime .NET 7); migración escrita a mano + script SQL idempotente" },
    { hora: "10:18", tarea: "MIG", texto: "Tablas BitacoraEvento y BitacoraEventoCompetencia creadas en Evaluaciones_Test; historial EF actualizado" },
    { hora: "10:19", tarea: "CON", texto: "Contratos TypeScript IBitacora.ts escritos" },
    { hora: "10:20", tarea: "—", texto: "Tablero de la fase 3 publicado (Docs/progreso-bitacora.html)" },
    { hora: "10:30", tarea: "BAT", texto: "Batería pytest del API escrita: 38 casos (POST/GET/PUT/DELETE/resumen/equipo). Hallazgo: el catálogo Objetivo se duplica por periodo y Empleados es una vista con duplicados (PLAN §9)" },
    { hora: "10:35", tarea: "—", texto: "F0 COMPLETA: commits 01f0cac (frontend) y faa177f (API). Pendiente de F2: specs Jasmine .pendiente de B2–B5 se escriben al abrir esa fase" }
  ]
};
