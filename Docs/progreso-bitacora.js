/* Datos del tablero de la Fase 3 (bitácora) — regenerado por el orquestador en cada evento. */
window.PROGRESO = {
  actualizado: "2026-09-11 12:00 — B2 integrado · B1 y B3 en ronda 2 · B4 y B5 construyendo",
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
        { id: "B1", archivo: "API: Controllers/BitacoraEventosController.cs", estado: "ronda 2", ronda: 2, pruebas: "pytest 38/38 (r1)", tokens: null, commit: "", nota: "Crítico Opus RECHAZADO (141k tokens, 15 min): 1 faltante real: N+1 del nombre del autor (0.27 s/evento, 4 s con 15 filas). Todo lo demás ok. B1-r2 lanzado 11:50" }
      ] },
    { id: "F2", nombre: "Frontend", nota: "B2 primero; B3 ∥ B4 ∥ B5 (máx. 2 constructores a la vez); B6 integración fina (orquestador)",
      tareas: [
        { id: "B2", archivo: "src/app/Helpers/bitacora-utils.ts", estado: "integrado", ronda: 1, pruebas: "Jasmine 22/22 + 110 aserciones del crítico", tokens: 46627, commit: "37edafd", nota: "Crítico Opus: APROBADO, 19/19 firmas, sin faltantes (108k tokens, 7 min). Observación: textoResumen con contadores incoherentes devuelve vacío" },
        { id: "B3", archivo: "src/app/Controllers/Bitacora.ts", estado: "ronda 2", ronda: 2, pruebas: "Jasmine 11/11 (r1) · +1 spec para r2", tokens: null, commit: "", nota: "Crítico Opus RECHAZADO (118k tokens, 8 min): el POST manda fechaRegistro:null y el API real lo rechaza con 400 (la batería con HttpTestingController no lo veía). B3-r2 lanzado 11:58" },
        { id: "B4", archivo: "Pages/bitacora/bitacora.component.ts|.html|.css", estado: "en curso", ronda: 1, pruebas: "batería .pendiente lista", tokens: null, commit: "", nota: "Lanzado 11:32 en paralelo (2 constructores)" },
        { id: "B5", archivo: "evaluacioncomponents/bitacora-resumen/", estado: "en curso", ronda: 1, pruebas: "batería .pendiente lista", tokens: null, commit: "", nota: "Lanzado 11:32 en paralelo (2 constructores)" },
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
    { hora: "10:50", tarea: "B1", texto: "Spec B1.md escrita; workspace build/B1 (copia del API, dotnet build OK); constructor qwen3.8 lanzado detached (pid 1392)" },
    { hora: "10:55", tarea: "—", texto: "Specs B2–B5 y baterías Jasmine .pendiente de B2, B3, B4 y B5 escritas mientras B1 construye (commits 4f6d008, f9d2b09, 9847627)" },
    { hora: "10:59", tarea: "B1", texto: "Primer borrador del controlador (20 KB): dotnet build con 7 errores (Ok() faltante, nombres de helpers inconsistentes, await en lambda, primer/primero, cast DateTime?). B1-r2.md lista" },
    { hora: "11:07", tarea: "B1", texto: "El constructor corrigió los 7 errores por su cuenta: dotnet build 0 errores; archivo estable desde 11:07" },
    { hora: "11:09", tarea: "B1", texto: "DLL publicada y desplegada a :7071 (solo la DLL; respaldo .bak). Batería pytest: 37/38; el fallo era formato de fecha con offset en el POST vs GET → aserción relajada" },
    { hora: "11:12", tarea: "B1", texto: "38/38. Constructor detenido (pid 1392). Crítico Opus lanzado con la spec, el entregable y la batería" },
    { hora: "11:15", tarea: "B2", texto: "Workspace build/B2 (copia de src sin specs) y constructor qwen3.8 lanzado" },
    { hora: "11:17", tarea: "B2", texto: "Archivo entregado; tsc OK; integrado provisionalmente en src y batería Jasmine 22/22" },
    { hora: "11:22", tarea: "B2", texto: "DONE del constructor (5m41s, 46.6k tokens). Crítico Opus lanzado" },
    { hora: "11:23", tarea: "B3", texto: "Workspace build/B3 y constructor lanzado" },
    { hora: "11:26", tarea: "B3", texto: "Archivo entregado en 3 min; tsc OK; Jasmine 11/11; DONE. Crítico Opus lanzado" },
    { hora: "11:32", tarea: "B4/B5", texto: "Trampa: robocopy desde PowerShell copió src a ~/build por cwd distinto; constructores relanzados con rutas absolutas" },
    { hora: "11:40", tarea: "B2", texto: "Crítico Opus APROBADO (110 aserciones propias, tree limpio). Integrado: commit 37edafd + push" },
    { hora: "11:48", tarea: "B1", texto: "Crítico Opus RECHAZADO: N+1 en el nombre del autor (medido 0.267 s/evento). Observación: las DataAnnotations devuelven ProblemDetails antes que Validar → anotado en PLAN §9.5 para B6" },
    { hora: "11:50", tarea: "B1", texto: "B1-r2.md (una sola corrección) y constructor relanzado sobre el mismo workspace" },
    { hora: "11:57", tarea: "B3", texto: "Crítico Opus RECHAZADO: fechaRegistro:null rompe el POST real (400). Lección: la batería HTTP simulada no valida el contrato del API; el crítico sí lo ejecutó contra :7071" },
    { hora: "11:58", tarea: "B3", texto: "B3-r2.md (omitir claves de solo lectura, fechaISO) + spec nuevo en la batería; constructor relanzado" },
    { hora: "10:35", tarea: "—", texto: "F0 COMPLETA: commits 01f0cac (frontend) y faa177f (API). Pendiente de F2: specs Jasmine .pendiente de B2–B5 se escriben al abrir esa fase" }
  ]
};
