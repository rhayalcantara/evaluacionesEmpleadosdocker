# Situacion Actual del Proyecto - Sistema de Evaluacion de Empleados

**Fecha:** 2026-03-05
**Proyecto:** Sistema de Evaluacion de Empleados - COOPERATIVA COOPASPIRE
**Rama:** master (unica rama activa)

---

## 1. RESUMEN EJECUTIVO

El sistema esta **operativo y estable** con Angular 16.2.12, pero presenta **deuda tecnica significativa** en actualizacion de dependencias (5 versiones major atras), adopcion inconsistente de LoggerService (solo ~5% de componentes lo usan), y 64 vulnerabilidades de dependencias npm (1 critica). La Fase 1 de seguridad fue completada exitosamente. Hay 8 archivos con cambios pendientes sin commitear.

### Indicadores Clave

| Metrica | Valor | Estado |
|---------|-------|--------|
| Angular version | 16.2.12 (actual: 21.x) | Desactualizado |
| Controllers | 40 | Estable |
| Modelos/Interfaces | 38 | Estable |
| Componentes de vista | 98 | Estable |
| Componentes standalone | 80% | Bueno |
| Vulnerabilidades npm | 64 (1 critica) | Requiere atencion |
| Console.log restantes | 109 en 37 archivos | Pendiente |
| Cobertura de tests | Minima | Deficiente |
| Seguridad Fase 1 | Completada | OK |

---

## 2. ARQUITECTURA

### 2.1 Stack Tecnologico

- **Framework:** Angular 16.2.12
- **TypeScript:** 4.9.5
- **Micro-frontends:** Module Federation (@angular-architects/module-federation 16.0.4)
- **UI:** Angular Material 16.2.14
- **Graficos:** Chart.js 4.5.1
- **PDF:** jspdf 3.0.4, pdfmake 0.2.20, html2canvas
- **Excel:** xlsx-js-style (migrado desde xlsx por vulnerabilidad)
- **Notificaciones:** SweetAlert2 11.26.3
- **Builder:** ngx-build-plus 16.0.0

### 2.2 Patron Arquitectonico: Controller-Model-View

No sigue el patron estandar de Angular con servicios. Usa un patron propio:

- **Controllers** (40): Clases que encapsulan logica de negocio y operaciones CRUD
- **Models** (38): Interfaces TypeScript con prefijo `I` (ej: `IEvaluacion`, `IEmpleado`)
- **Views** (98): Componentes divididos en Pages (40), Forms (38), evaluacioncomponents (2) y utilidades (18)
- **Services** (11): Servicios singleton para funciones transversales

### 2.3 Module Federation

- **Shell app:** evaluacionempleado (este proyecto)
- **Remote:** loginapp en `/loginapp/remoteEntry.js`
- **Shared:** @commons-lib como singleton
- **Base href:** `/evaluacionempleado/`
- **Problema:** URL del remote hardcodeada, sin switching por ambiente

---

## 3. ESTADO DE CONTROLLERS Y MODELOS

### 3.1 Controllers (40 archivos)

**Conformidad con patron CRUD estandar:** 80% (32/40)

| Categoria | Cantidad | Detalle |
|-----------|----------|---------|
| CRUD estandar completo | 32 | Siguen patron Gets/Get/GetCount/insert/Update |
| Sin GetCount() | 4 | EmpleadosFactory, HistorialEvaluacion, Objetivo, Tipos |
| Naming inconsistente | 5 | ConsejalController, ConsejalClaveController (suffix innecesario) |
| Patron especial | 2 | HistorialEvaluacion (composicion), EmpleadosFactory (factory) |
| Con batch insert | 2 | KriAno, ObjetivoExtrategicoAno |

### 3.2 Problemas Detectados en Controllers

1. **Duplicacion de codigo:** 25+ controllers con codigo CRUD casi identico (~2000-3000 lineas duplicables). Potencial de reduccion del 40-50% con base class
2. **Naming inconsistente:** `ConsejalController.ts` y `ConsejalClaveController.ts` tienen comentarios "Cambiar nombre de clase"
3. **EmpleadosFactory.ts:** Patron factory cuestionable - verificar si es necesario
4. **Typo generalizado:** `titulomensage` en lugar de `titulomensaje`
5. **Case inconsistente en metodos:** `insert()` vs `Insert()`, `Update()` vs `updatedar()`

### 3.3 Modelos (38 interfaces)

- **Cobertura:** 92% de modelos tienen controller asociado
- **Sin controller:** ITarea (usa servicio especial), modelResponse (utilidad)
- **Naming inconsistente:** `usuario.ts` sin prefijo `I` (deberia ser `IUsuario`)
- **Modelo en archivo incorrecto:** IValoresEvaluacion importado desde PorcientoDesempenoCompetencia

---

## 4. ESTADO DE SERVICIOS

### 4.1 Inventario de Servicios

| Servicio | Estado | Problemas |
|----------|--------|-----------|
| **DatosServiceService** | Funcional | Sin manejo de errores, JSON.stringify innecesario, codigo comentado |
| **LoggerService** | Implementado | Excelente pero adopcion <5% |
| **SegurityService** | Funcional | Sin validacion de token, tipado riesgoso (`!` assertion) |
| **TokenInterceptorService** | **NO REGISTRADO** | No esta en providers de app.module.ts |
| **ErrorInterceptorService** | Correcto | Registrado y funcionando (401/403 logout, 404 mensaje, 5xx error) |
| **ComunicacionService** | Funcional | Simple, sin problemas |
| **ExcelService** | Funcional | 1 console.error |
| **AuthGuardService** | Funcional | Guard basico |
| **FileUploadService** | Funcional | Codigo comentado de simulacion |
| **PeriodoEvaluacionService** | Placeholder | Sin implementacion real |
| **TareaService** | Parcial | Implementacion basica |

### 4.2 Problemas Criticos en Servicios

1. **TokenInterceptorService NO REGISTRADO en app.module.ts** - El interceptor existe pero no esta en providers. Los tokens Bearer NO se envian automaticamente. Probable workaround manual en controllers.

2. **LoggerService sin adopcion** - 109 console.log/error distribuidos en 37 archivos:
   - Peor caso: `form-plan-estrategico.component.ts` con 39 console.log
   - `FormEvaluationEmploye.component.ts`: 5 console.error
   - `dashboard.component.ts`: 4 console.log
   - `periodos-evaluacion.component.ts`: 4 console.log

3. **DatosServiceService sin catchError** - Los errores HTTP se propagan sin transformacion

---

## 5. ESTADO DE COMPONENTES DE VISTA

### 5.1 Distribucion

| Categoria | Cantidad | Standalone | Module-based |
|-----------|----------|------------|-------------|
| Pages | 40 | 34 | 6 |
| Forms | 38 | 32 | 6 |
| evaluacioncomponents | 2 | 2 | 0 |
| Utilidades/otros | 18 | 10 | 8 |
| **Total** | **98** | **78 (80%)** | **20 (20%)** |

### 5.2 Componentes con CSS que Exceden Budget

| Componente | Tamano CSS | Severidad |
|-----------|-----------|----------|
| from-objetivo-extrategico | 10,571 bytes | CRITICO |
| historial-evaluaciones | 7,313 bytes | CRITICO |
| FormEvaluationEmploye | 4,420 bytes | ALTO |
| evaluarequipoconsejal | 3,382 bytes | ALTO |
| evaluacion | 3,117 bytes | ALTO |

Budget configurado: warning 2KB, error 7KB.

### 5.3 Rutas y Navegacion

- **Total rutas definidas:** 50+ en app-routing.module.ts
- **Rutas activas en menu:** ~30
- **Rutas comentadas en navmenu:** 7 (Meta, Tipo, resultado-evaluacion, Perspectiva, Aspiracion, dashboard, organigrama)
- **Componente sin ruta:** krisanos (existe pero sin ruta en routing)
- **Posible error:** Ruta `/uploadfile` cambiada a `/C` en navmenu (parece accidental)

### 5.4 TODOs y Codigo Pendiente

| Archivo | Pendiente |
|---------|----------|
| from-objetivo-extrategico.component.ts | TODO: Implement method using PlanExtrategico service |
| evaluation-periods.component.ts | TODO: Fetch actual periods data from service |
| evaluation-periods.component.ts | TODO: Update period in backend |
| evaluacion.component.ts | Metodo onPuntuacion() sin implementar |

---

## 6. CONFIGURACION Y BUILD

### 6.1 Scripts npm

| Script | Comando | Proposito |
|--------|---------|----------|
| `start` | `ng serve` | Dev server puerto 4200 |
| `build` | `ng build` | Build produccion |
| `watch` | `ng build --watch --configuration development` | Watch mode |
| `test` | `ng test` | Tests Karma/Jasmine |
| `run:all` | Module Federation dev | Multi-micro-frontend |

### 6.2 Ambientes

Ambos ambientes apuntan a las mismas IPs (VPN corporativa):
- **API:** http://192.168.7.222:7070
- **Fotos:** http://192.168.7.222:8080
- **Dev:** timeout 30s, debug habilitado
- **Prod:** timeout 10s, debug deshabilitado
- **HTTPS:** Pospuesto (VPN provee seguridad de transporte)

### 6.3 Docker

**No existe configuracion Docker** a pesar del nombre del directorio. No hay Dockerfile ni docker-compose.yml.

### 6.4 Scripts Auxiliares

Directorio `scripts/` (no trackeado) contiene herramientas Python para creacion masiva de evaluaciones via API REST.

---

## 7. SEGURIDAD

### 7.1 Auditoria - Fase 1: COMPLETADA (25/11/2025)

| Tarea | Estado |
|-------|--------|
| Eliminacion de logs de tokens | Completado |
| Implementar metodo logout() | Completado |
| Configurar variables de ambiente | Completado |
| Corregir manejo de error 404 | Completado |
| Migracion HTTPS | Pospuesto (VPN) |
| Limpieza de console.logs criticos | Completado (410 a 34, reduccion 91.7%) |
| Correccion vulnerabilidad xlsx | Completado (migrado a xlsx-js-style) |
| Historial de Evaluaciones | Completado |

### 7.2 Vulnerabilidades de Dependencias npm

**Total: 64 vulnerabilidades**

| Severidad | Cantidad |
|-----------|----------|
| Critica | 1 |
| Alta | 26 |
| Moderada | 14 |
| Baja | 23 |

**Vulnerabilidades criticas/altas principales:**

1. **tar (CRITICA):** 3 CVEs - hardlink poisoning, arbitrary file overwrite, path traversal
2. **webpack (ALTA):** 2 CVEs de SSRF - allowedUris bypass
3. **tmp (ALTA):** Arbitrary temp file/directory write via symlink

**Resolucion:** Requiere actualizacion a Angular 21 para resolver la mayoria (Fase 4 del plan).

### 7.3 Problemas de Seguridad Activos

1. **TokenInterceptor no registrado** - Tokens no se envian automaticamente
2. **109 console.log en produccion** - Pueden filtrar informacion sensible
3. **Sin validacion de token activo** en SegurityService
4. **HTTP en ambos ambientes** - HTTPS pospuesto

---

## 8. ESTADO DE GIT

### 8.1 Rama y Commits

- **Rama unica:** master
- **Estado:** 2 commits adelante del remoto (sin push)
- **Ultimo commit:** `11b93d9` - Merge branch 'master'

### 8.2 Cambios Pendientes (8 archivos modificados, 3 no trackeados)

**Archivos modificados:**

| Archivo | Cambio |
|---------|--------|
| `.claude/settings.local.json` | Permisos adicionales para Claude |
| `GEMINI.md` | Actualizacion menor de documentacion |
| `Empleados.ts` | Reformateo de codigo (sin cambios funcionales) |
| `FormEvaluationEmploye.component.css` | Estilos para textarea de justificacion con contador |
| `FormEvaluationEmploye.component.html` | Input cambiado a textarea para justificacion de cursos |
| `FormEvaluationEmploye.component.ts` | Manejo de 404, validacion de justificaciones (max 500 chars) |
| `criterialitem.component.ts` | Ampliacion de estados readonly, fix calculo promedio supervisor |
| `navmenu.component.html` | Cambio ruta /uploadfile a /C (posible error) |

**Archivos no trackeados:**

| Archivo | Descripcion |
|---------|-------------|
| `.gemini/GEMINI.md` | Configuracion para Gemini AI |
| `.mcp.json` | Configuracion MCP |
| `scripts/` | Scripts Python para evaluaciones masivas |

---

## 9. FASES PENDIENTES DEL PLAN

| Fase | Descripcion | Estado |
|------|-------------|--------|
| Fase 1 | Remediacion critica de seguridad | COMPLETADA |
| Fase 2 | Mejoras de arquitectura (CSS, exportacion historial, tests) | PENDIENTE |
| Fase 3 | Optimizacion | PENDIENTE |
| Fase 4 | Modernizacion (Angular 21, resolver vulnerabilidades npm) | PENDIENTE |

---

## 10. PROBLEMAS PRIORITARIOS

### Criticos (Accion Inmediata)

1. **Registrar TokenInterceptorService** en app.module.ts - Los tokens Bearer no se envian automaticamente
2. **Verificar ruta /C en navmenu** - Posible cambio accidental de /uploadfile a /C
3. **Push de 2 commits pendientes** al remoto

### Altos (Sprint Siguiente)

4. **Reemplazar 109 console.log** con LoggerService en 37 archivos
5. **Resolver vulnerabilidades npm criticas** (tar, tmp)
6. **Implementar TODOs** en evaluation-periods y from-objetivo-extrategico
7. **Agregar manejo de errores** (catchError) en DatosServiceService

### Medios (Backlog)

8. **Refactoring CRUD base class** para controllers (reduccion 40-50% codigo)
9. **Reducir CSS** en 5 componentes que exceden budget
10. **Estandarizar naming** de controllers (remover suffix "Controller", corregir typo titulomensage)
11. **Implementar tests unitarios** (cobertura actualmente minima)
12. **Consolidar webpack config** (webpack.prod.config.js es redundante)

### Largo Plazo

13. **Migracion Angular 16 a 21** (resolveria vulnerabilidades npm y modernizaria el stack)
14. **Migracion a HTTPS** (cuando sea viable fuera de VPN)
15. **Implementar Docker** (el nombre del proyecto lo sugiere pero no existe configuracion)

---

## 11. FORTALEZAS DEL PROYECTO

- Patron CRUD bien establecido con 80% de conformidad
- 80% de componentes ya migrados a standalone
- Fase 1 de seguridad completada exitosamente
- LoggerService bien implementado (falta adopcion)
- ErrorInterceptor correcto con manejo granular por codigo HTTP
- Separacion clara entre Pages, Forms y componentes de utilidad
- Flujo de evaluaciones completo con autoevaluacion y supervisor
- Historial de evaluaciones con graficos y comparacion implementado
- Exportacion a PDF y Excel funcional
- Integracion con plan estrategico y perspectivas BSC

---

*Documento generado automaticamente el 2026-03-05 mediante analisis de subagentes.*
