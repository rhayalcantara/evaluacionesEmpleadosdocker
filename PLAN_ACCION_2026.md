# Plan de Accion - Sistema Evaluacion de Empleados 2026

**Fecha:** 2026-03-05
**Origen:** Levantamiento de situacion actual (SITUACION_ACTUAL.md)
**Duracion estimada total:** 8-10 semanas (5 sprints)
**Optimizado para:** Ejecucion paralela con subagentes

---

## Grafo de Dependencias (por tarea)

```
                        [INICIO]
                           |
          +----------------+----------------+
          |                |                |
        [1.1]            [1.2]           [1.4]
   TokenInterceptor   Fix ruta /C    Review cambios
          |                |                |
          |                |             [1.3]
          |                |           Git push
          |                |                |
          +-------+--------+--------+------+
                  |        |        |
               [2.1]    [2.2]    [2.3]
            Logger    Comentados  Naming
                  |        |        |
                  |        |     [2.4]     [2.5]
                  |        |     TODOs    ErrorHandling
                  |        |        |        |
          +-------+--------+--------+-------+
          |          |           |           |
        [3.1]      [3.2]      [3.3]       [3.5]
     BaseClass    CSS Budget  Standalone  TokenValid
          |          |           |           |
          +----------+-----------+-----------+
          |                      |
        [3.4]                    |
     Rutas huerfanas             |
          |                      |
          +----------+-----------+
                     |
          +----------+-----------+-----------+
          |          |           |           |
        [4.1]      [4.2]      [4.4]       [5.4]
     Tests Svc   Tests Ctrl   Docs       Docker
          |          |                      |
          +----------+                      |
                |                           |
              [4.3]                         |
         Tests Integracion                  |
                |                           |
          +-----+-----+                    |
          |           |                    |
        [5.1]       [5.5]                  |
     Angular 21    HTTPS                   |
          |                                |
     +----+----+                           |
     |         |                           |
   [5.2]     [5.3]                         |
  ModFed    npm audit                      |
     |         |                           |
     +---------+---------------------------+
                        |
                     [FIN]
```

---

## Oleadas de Ejecucion Paralela

### OLEADA 1 - Fixes Criticos (Dia 1-2)
> 3 subagentes en paralelo, sin dependencias entre si

| Subagente | Tarea | Descripcion | Impacto |
|-----------|-------|-------------|---------|
| **A1** | 1.1 | Registrar TokenInterceptorService en app.module.ts | CRITICO |
| **A2** | 1.2 | Corregir ruta /C en navmenu -> /uploadfile | CRITICO |
| **A3** | 1.4 | Revisar cambios pendientes sin commit, preparar staging | MEDIO |

**Post-oleada (secuencial):** 1.3 - Push de commits (depende de 1.4 completada)

#### Detalle de tareas

**1.1 Registrar TokenInterceptorService en app.module.ts**
- Agregar `{ provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }` al array de providers
- Verificar si hay workarounds manuales en controllers y removerlos
- Impacto: CRITICO - Seguridad

**1.2 Corregir ruta /C en navmenu**
- Revertir ruta de "Carga de Archivos KPIs" de `/C` a `/uploadfile` en `navmenu.component.html`
- Impacto: CRITICO - Navegacion rota

**1.3 Push de commits pendientes** (secuencial, post-1.4)
- 2 commits locales sin push (11b93d9, d187151)
- Revisar y hacer `git push origin master`
- Impacto: MEDIO - Sincronizacion

**1.4 Revisar cambios pendientes sin commit**
- Archivos modificados (8): FormEvaluationEmploye, criterialitem, Empleados.ts, navmenu, configs
- Decidir que commitear y que descartar
- Impacto: MEDIO - Orden del repositorio

---

### OLEADA 2 - Calidad de Codigo (Semana 1)
> 3 subagentes en paralelo | Depende de: Oleada 1 completada

| Subagente | Tarea | Descripcion | Impacto |
|-----------|-------|-------------|---------|
| **B1** | 2.1 | Reemplazar 109 console.log con LoggerService (37 archivos) | ALTO |
| **B2** | 2.2 | Eliminar ~55 ocurrencias de codigo comentado | MEDIO |
| **B3** | 2.3 + 2.4 | Estandarizar naming de controllers + Implementar TODOs | BAJO-MEDIO |

**En paralelo independiente:**

| Subagente | Tarea | Descripcion | Impacto |
|-----------|-------|-------------|---------|
| **B4** | 2.5 | Agregar manejo de errores en DatosServiceService | ALTO |

> **Nota:** B4 (2.5) NO depende de 2.1-2.4, puede ejecutarse simultaneamente.

#### Detalle de tareas

**2.1 Reemplazar console.log con LoggerService**
- Alcance: 109 console.log/error en 37 archivos
- Prioridad: form-plan-estrategico (39 logs), FormEvaluationEmploye (5), dashboard (4), periodos-evaluacion (4), Controllers
- Patron: `console.log()` -> `this.logger.debug()`, `console.error()` -> `this.logger.error()`

**2.2 Eliminar codigo comentado**
- Alcance: ~55 ocurrencias
- Principales: datos-service (6), segurity (9), excel (18), navmenu (secciones completas)

**2.3 Estandarizar naming de controllers**
- Renombrar ConsejalController.ts -> Consejal.ts, ConsejalClaveController.ts -> ConsejalClave.ts
- Corregir typo `titulomensage` -> `titulomensaje` en todos los controllers
- Estandarizar case: insert() lowercase, Update() PascalCase

**2.4 Implementar TODOs pendientes**
- from-objetivo-extrategico: implementar metodo con PlanExtrategico service
- evaluation-periods: fetch actual periods data + update period in backend
- evaluacion: implementar onPuntuacion()
- Evaluar si todos son necesarios o algunos son obsoletos

**2.5 Agregar manejo de errores en DatosServiceService**
- Agregar `pipe(catchError())` con logging via LoggerService a metodos HTTP
- Remover `JSON.stringify()` innecesario en POST/PUT
- Tipar correctamente `showMessage` (title: string, no any)

---

### OLEADA 3 - Arquitectura y Refactoring (Semanas 2-3)
> 4 subagentes en paralelo | Dependencias mixtas

| Subagente | Tarea | Depende de | Descripcion | Impacto |
|-----------|-------|------------|-------------|---------|
| **C1** | 3.1 | 2.1, 2.3 | Crear base class para controllers CRUD | ALTO |
| **C2** | 3.2 | Ninguna* | Reducir CSS de componentes sobre budget | MEDIO |
| **C3** | 3.3 | Ninguna* | Migrar componentes module-based a standalone | BAJO |
| **C4** | 3.5 | 1.1 | Validacion de token en SegurityService | ALTO |

> *C2 y C3 no dependen de Oleada 2, pueden iniciar en cuanto Oleada 1 termine. Se agrupan aqui por organizacion de sprints.

**Post-oleada (secuencial):** 3.4 - Resolver rutas huerfanas (depende de 1.2, 3.3 y 3.4 se beneficia de 3.3)

#### Detalle de tareas

**3.1 Crear base class para controllers CRUD**
- 25+ controllers con codigo CRUD casi identico (~2000-3000 lineas duplicadas)
- Clase `BaseController<T>` con: rutaapi, titulomensaje, model, arraymodel, paginacion, Gets(), Get(), GetCount(), insert(), Update(), grabar()
- Controllers especificos: Solo definen ruta API, titulo e inicializamodelo()
- Reduccion estimada: 40-50% de codigo

**3.2 Reducir CSS de componentes sobre budget**
- Componentes: from-objetivo-extrategico (10,571 bytes), historial-evaluaciones (7,313), FormEvaluationEmploye (4,420), evaluarequipoconsejal (3,382), evaluacion (3,117)
- Estrategias: Extraer estilos comunes a styles.css global, usar clases Material, eliminar duplicados
- Budget: warning 2KB, error 7KB

**3.3 Migrar componentes module-based a standalone**
- 20 componentes: dashboard, file-upload-page, kpis, kris, periodos-evaluacion, tipos, HomeComponent, etc.
- Beneficio: Consistencia (80% ya standalone), mejor tree-shaking

**3.4 Resolver rutas huerfanas y navegacion** (post-oleada)
- krisanos: agregar ruta o eliminar componente
- 7 rutas comentadas en navmenu: decidir reactivar o eliminar
- Documentar rutas por rol de usuario

**3.5 Validacion de token en SegurityService**
- Verificar expiracion del JWT antes de cada request
- Implementar refresh token o redirect a login si expiro
- Cambiar tipado: `_usuario!: Usuario` -> `_usuario: Usuario | null`
- Agregar catch en router.navigate()

---

### OLEADA 4 - Testing y Estabilidad (Semanas 3-5)
> Dependencias fuertes con Oleada 3

| Subagente | Tarea | Depende de | Descripcion | Impacto |
|-----------|-------|------------|-------------|---------|
| **D1** | 4.1 | 2.5, 3.5 | Tests unitarios para servicios criticos | ALTO |
| **D2** | 4.2 | 3.1 | Tests unitarios para controllers principales | ALTO |
| **D3** | 4.4 | Ninguna | Actualizar documentacion de auditoria | BAJO |

> **D3 puede iniciar en cualquier momento** - no tiene dependencias tecnicas.

**Post-oleada (secuencial):** 4.3 - Tests de integracion (depende de 4.1 y 4.2)

**Inicio anticipado posible:**

| Subagente | Tarea | Depende de | Descripcion | Impacto |
|-----------|-------|------------|-------------|---------|
| **D4** | 5.4 | Ninguna | Implementar Docker | MEDIO |

> **5.4 Docker NO depende de ninguna otra tarea.** Puede iniciarse desde Oleada 2 en adelante.

#### Detalle de tareas

**4.1 Tests unitarios para servicios criticos**
- Prioridad: DatosServiceService, SegurityService, LoggerService, ErrorInterceptorService, AuthGuardService
- Herramientas: Karma/Jasmine (ya configurados)

**4.2 Tests unitarios para controllers principales**
- Controllers: Evaluacion.ts (11 metodos), HistorialEvaluacion.ts, EmpleadoDesempeno.ts, Metas.ts

**4.3 Tests de integracion para flujos criticos** (post-oleada)
- Flujos: Evaluacion completa, Login/logout con ModFed, Reportes PDF/Excel, Historial evaluaciones
- Herramientas: Considerar Cypress o Playwright

**4.4 Actualizar documentacion de auditoria**
- README dice "PENDIENTE" y "Score 4.0/10" pero Fase 1 esta completada
- Actualizar reporte-testing-fase1.md, plan-accion-tecnico.md
- Documentar hallazgos del levantamiento 2026-03-05

**5.4 Implementar Docker** (inicio anticipado)
- Dockerfile multi-stage (node build + nginx serve)
- docker-compose.yml (app + loginapp)
- Configuracion nginx para /evaluacionempleado/ y proxy API

---

### OLEADA 5 - Modernizacion (Semanas 6-10)
> 2 tracks paralelos

**Track A - Migracion Angular (secuencial estricto):**

| Orden | Tarea | Depende de | Descripcion | Impacto |
|-------|-------|------------|-------------|---------|
| 1 | 5.1 | 4.3 (ideal), 4.1 (minimo) | Migracion Angular 16 -> 21 | CRITICO |
| 2 | 5.2 | 5.1 | Actualizar Module Federation | ALTO |
| 3 | 5.3 | 5.1 | Resolver vulnerabilidades npm restantes | ALTO |

> 5.2 y 5.3 pueden ejecutarse en paralelo entre si, ambas dependen de 5.1.

**Track B - Infraestructura (independiente):**

| Subagente | Tarea | Depende de | Descripcion | Impacto |
|-----------|-------|------------|-------------|---------|
| **E2** | 5.5 | Aprobacion infra | Evaluar migracion HTTPS | ALTO |

#### Detalle de tareas

**5.1 Migracion Angular 16 a 21**
- Ruta: 16 -> 17 -> 18 -> 19 -> 20 -> 21 (incremental)
- Incluye: Angular CLI, TypeScript 4.9 -> 5.9, Material 16 -> 21, zone.js, RxJS
- Resuelve: Mayoria de las 64 vulnerabilidades npm

**5.2 Actualizar Module Federation**
- @angular-architects/module-federation 16.0.4 -> 21.x
- Actualizar webpack config, shared modules, ngx-build-plus
- Dependencia: Coordinar con equipo de loginapp

**5.3 Resolver vulnerabilidades npm restantes**
- Post-migracion: ejecutar `npm audit` y resolver residuales
- Verificar si webpack 5.94.0 override sigue siendo necesario

**5.5 Evaluar migracion HTTPS**
- Obtener certificados SSL
- Actualizar environment.prod.ts con URLs HTTPS
- Configurar SSL termination en nginx/reverse proxy
- Dependencia: Aprobacion de infraestructura

---

## Mapa de Subagentes Optimo

```
Tiempo -->  Dia1-2    Sem1        Sem2        Sem3        Sem4-5      Sem6-10
            ------    ----        ----        ----        ------      -------
Agente A:   [1.1] --> [2.1 Logger reemplazo en 37 archivos]  --> [3.1 BaseClass] --> [4.2 Tests Ctrl]
Agente B:   [1.2] --> [2.2 Codigo comentado] --> [3.2 CSS] -------> [4.1 Tests Svc] --> [5.1 Angular]
Agente C:   [1.4]->[1.3] --> [2.3+2.4 Naming+TODOs] --> [3.3 Standalone] --> [3.4 Rutas]
Agente D:   --------> [2.5 ErrorHandling] --> [3.5 TokenValid] --> [4.3 Tests Integ]
Agente E:   --------> [5.4 Docker] -----------------------------------------> [5.2+5.3 ModFed+npm]
Agente F:   --------> [4.4 Docs] --> [5.5 HTTPS] (cuando infra apruebe)
```

### Asignacion por agente

| Agente | Tareas asignadas | Hilo conductor |
|--------|-----------------|----------------|
| **A** | 1.1 -> 2.1 -> 3.1 -> 4.2 | Interceptors, Logger, Controllers |
| **B** | 1.2 -> 2.2 -> 3.2 -> 4.1 -> 5.1 | Limpieza, CSS, Tests, Migracion |
| **C** | 1.4 -> 1.3 -> 2.3+2.4 -> 3.3 -> 3.4 | Git, Naming, Standalone, Rutas |
| **D** | 2.5 -> 3.5 -> 4.3 | Errores, Seguridad, Tests integracion |
| **E** | 5.4 -> 5.2+5.3 | Infraestructura Docker, ModFed |
| **F** | 4.4 -> 5.5 | Documentacion, HTTPS |

---

## Tareas sin dependencias (pueden iniciar en cualquier momento)

Estas tareas no requieren que otras esten completadas previamente:

1. **3.2** - Reducir CSS de componentes (solo necesita Oleada 1)
2. **3.3** - Migrar a standalone (solo necesita Oleada 1)
3. **4.4** - Actualizar documentacion de auditoria
4. **5.4** - Implementar Docker
5. **5.5** - Evaluar migracion HTTPS (requiere aprobacion infra, no tecnica)

---

## Resumen de Esfuerzo

| Oleada | Duracion | Tareas | Subagentes | Prioridad |
|--------|----------|--------|------------|-----------|
| Oleada 1 - Fixes Criticos | 1-2 dias | 4 | 3 paralelos + 1 secuencial | Inmediata |
| Oleada 2 - Calidad de Codigo | 1 semana | 5 | 4 paralelos | Alta |
| Oleada 3 - Arquitectura | 2 semanas | 5 | 4 paralelos + 1 secuencial | Media-Alta |
| Oleada 4 - Testing | 2 semanas | 4 + 1 anticipada | 3 paralelos + 1 secuencial | Media |
| Oleada 5 - Modernizacion | 3-4 semanas | 4 | 2 tracks paralelos | Media-Baja |
| **Total** | **8-10 semanas** | **23 tareas** | **Max 6 agentes simultaneos** | - |

---

## Puntos de Sincronizacion (Checkpoints)

Momentos donde los subagentes deben esperar a que otros completen:

| Checkpoint | Condicion | Bloquea a |
|------------|-----------|-----------|
| **CP1** | 1.4 completada | 1.3 (push) |
| **CP2** | Oleada 1 completada | 2.1, 2.2, 2.3 |
| **CP3** | 2.1 + 2.3 completadas | 3.1 (BaseClass) |
| **CP4** | 1.1 completada | 3.5 (TokenValid) |
| **CP5** | 2.5 + 3.5 completadas | 4.1 (Tests servicios) |
| **CP6** | 3.1 completada | 4.2 (Tests controllers) |
| **CP7** | 4.1 + 4.2 completadas | 4.3 (Tests integracion) |
| **CP8** | 4.3 completada (o 4.1 minimo) | 5.1 (Angular migration) |
| **CP9** | 5.1 completada | 5.2, 5.3 |

---

## Criterios de Exito

- [ ] 0 vulnerabilidades criticas de codigo
- [ ] 0 console.log en produccion
- [ ] TokenInterceptor registrado y funcionando
- [ ] LoggerService adoptado en 100% de componentes
- [ ] Cobertura de tests > 40% en servicios criticos
- [ ] Angular actualizado a version 21
- [ ] 0 vulnerabilidades npm criticas o altas
- [ ] Docker configurado para deploy

---

*Plan generado el 2026-03-05. Optimizado para ejecucion con subagentes el 2026-03-05.*
*Guardado en MuninnDB (root_id: 01KJZK9078F3AEYTAA9KEACHW1) para seguimiento.*
