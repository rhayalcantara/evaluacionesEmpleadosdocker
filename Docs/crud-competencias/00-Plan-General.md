# Plan General — Rediseño del CRUD de Competencias

**Proyecto:** Sistema de Evaluación de Empleados (COOPASPIRE)
**Rama:** `feature/crud-competencias`
**Fecha de inicio:** 2026-08-24
**Entorno de desarrollo y verificación:** local, `ng serve --configuration prueba` (API `http://192.168.7.222:7071`, BD `Evaluaciones_Test`)
**Este sistema NO se registra en RSIA.**

---

## 1. Problema

La configuración de competencias de un periodo se ha venido haciendo **directamente en base de datos** (ver `Docs/proceso-configuracion-competencias-periodo8.md`) porque la interfaz no da para trabajarla:

| Síntoma | Evidencia en el código |
|---|---|
| La pantalla de metas no está en el menú | `navmenu.component.html:54` — la entrada `/Meta` está comentada |
| Cualquier usuario autenticado puede entrar por URL | `app-routing.module.ts:28` — la ruta `/Meta` solo tiene `AuthGuard`, sin `RoleGuard` |
| No se puede eliminar | `metas.component.ts:127` — `delete()` resuelve la fila y nunca llama al API; `Metas.ts` no tiene método `Delete`, aunque el API sí expone `DELETE /api/Goals/{id}` |
| No se puede elegir el periodo | `form-metas.component.ts:59` toma el periodo activo de `localStorage`; el botón "Seleccionar Periodo" está comentado en el HTML |
| Alta de una en una | Configurar un puesto con 12 competencias son 12 altas manuales |
| No hay forma de clonar | Copiar la configuración de un periodo a otro solo existe como script (`scripts/clonar_goals_gh_p7_a_p8.py`) |
| Vínculo competencia ↔ categoría inaccesible | No existe ningún controlador ni pantalla de `CompetenciaCategoriaPuesto` en el frontend, pese a que el API lo expone completo |
| Sin diagnóstico | No hay pantalla que responda "¿qué puestos quedaron sin competencias en este periodo?" — hoy se responde por SQL |

**Consecuencia real medida:** al 2026-08-21, en producción, tres puestos (ABOGADO JUNIOR, GERENTE DE CAPTACIONES Y SUCURSAL, GERENTE DE SUCURSAL PEQUEÑA) no tienen filas en `Goal` para ningún periodo, y por eso tres empleados no tienen evaluación de Mitad de Año 2026.

## 2. Objetivo

Que un usuario administrador de RRHH pueda dejar un periodo completamente configurado **sin tocar la base de datos**: competencias del catálogo, su vinculación por categoría de puesto, su asignación por puesto con pesos, la ponderación Desempeño/Competencia, y un diagnóstico que le diga qué le falta antes de abrir el periodo.

## 3. Modelo de datos involucrado

```
Objetivo (catálogo de competencias por periodo, agrupadas por GrupoCompetencia)
   └── CompetenciaCategoriaPuesto (qué categoría de puesto ve cada competencia)
Goal (asignación por PUESTO y PERIODO: competencia + descripción + peso)   ← la pantalla /Meta actual
positions (catálogo de puestos; su CategoriaPuestoId decide qué competencias ve el empleado)
PorcientoDesempenoCompetencia (ponderación del periodo: 30% desempeño / 70% competencia)
```

Un empleado ve sus competencias solo si: su `SCARGO` existe en `positions`, ese puesto tiene `CategoriaPuestoId <> 0`, esa categoría está vinculada en `CompetenciaCategoriaPuesto` a competencias del periodo, y el puesto tiene filas en `Goal` para el periodo. Si falla cualquiera de los cuatro eslabones, el empleado se queda sin evaluación y hoy nadie se entera hasta que la persona reclama.

## 4. Alcance

**Incluido**
1. Pantalla única **"Configuración de Competencias"** con pestañas, para rol Administrador.
2. Tab **Competencias por puesto** (`Goal`): listado filtrable por periodo / departamento / puesto, alta múltiple, edición, **borrado real**, validación de peso total = 100, y **clonar** desde otro periodo o puesto.
3. Tab **Catálogo y categorías** (`Objetivo` + `CompetenciaCategoriaPuesto`): mantenimiento del catálogo por periodo y matriz de vinculación competencia ↔ categoría de puesto.
4. Tab **Ponderación** (`PorcientoDesempenoCompetencia`): ver y fijar el % Desempeño/Competencia del periodo.
5. Tab **Diagnóstico**: puestos activos sin competencias en el periodo, puestos con `CategoriaPuestoId = 0`, y empleados activos sin evaluación en el periodo.
6. Ruta protegida con `RoleGuard` (rol Admin) y entrada visible en el menú.

**Fuera de alcance**
- Cambios en el API (todos los endpoints necesarios ya existen: `Goals`, `Objetivoes`, `CompetenciaCategoriaPuestoes`, `PorcientoDesempenoCompetencias`, `Positions`, `CategoriaPuestoes`, todos con GET/POST/PUT/DELETE).
- Despliegue a `evaluacionempleado-prueba` o a producción (QA está usando el sitio de prueba; el redespliegue se coordina aparte).
- Migrar o limpiar los datos ya existentes en producción.
- Registro en RSIA.

## 5. Criterios de aceptación del plan completo

1. Un administrador entra desde el menú, elige un periodo y ve, para cada puesto, cuántas competencias tiene y si el peso suma 100.
2. Puede agregar las 12 competencias de un puesto en una sola operación, editarlas y **eliminarlas** con confirmación.
3. Puede clonar la configuración de un puesto o de un periodo completo hacia otro, viendo antes qué se va a crear y qué se va a saltar por duplicado.
4. Puede vincular competencias a categorías de puesto sin SQL.
5. Puede fijar la ponderación Desempeño/Competencia del periodo.
6. El diagnóstico lista exactamente los mismos huecos que hoy se detectan por SQL (puestos sin `Goal`, puestos sin categoría, empleados sin evaluación).
7. Un usuario no administrador no puede entrar ni por URL directa.
8. `ng build` compila sin errores nuevos.
9. La verificación con Playwright recorre el flujo completo y deja capturas en `e2e/capturas-crud-competencias/`, documentadas en `Docs/crud-competencias/03-Auditoria-Verificacion.md`.

## 6. Método de trabajo

Según `formatotrabajo.md`:

- **Orquestador:** Claude Code. Reparte tareas, mantiene el tablero y decide los commits.
- **Subagentes de implementación:** trabajan en paralelo solo cuando no comparten archivos. Cada tarea declara sus archivos.
- **Subagente crítico:** no programa. Revisa el resultado de cada tarea contra sus criterios de aceptación y devuelve *aprobado* o la lista de correcciones. Solo cuando aprueba se hace `commit` y `push`.
- **Verificación final:** Playwright contra `localhost:4200` con la configuración `prueba`, con capturas para auditoría.
- **Tablero visual:** `Docs/crud-competencias/tablero/index.html` (HTML + CSS + JS), actualizado a medida que avanzan las fases.

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Tocar la pantalla `/Meta` actual rompe el flujo que hoy usa `evaluation-periods` | La pantalla nueva se construye aparte; `/Meta` se deja intacta hasta que la nueva esté aprobada |
| Clonar puede duplicar filas | El clonado previsualiza y descarta lo que ya existe por (puesto, competencia, descripción), igual que el script de referencia |
| Borrar competencias de un periodo activo afecta evaluaciones en curso | El borrado avisa cuándo el periodo está activo y cuántas evaluaciones dependen de esa fila |
| El API de prueba responde 200 aunque no procese (defecto conocido en cargas) | La verificación no se apoya solo en el código HTTP: relee los datos después de cada operación |

## 8. Documentos relacionados

- `Docs/crud-competencias/01-Fases-y-Tareas.md` — desglose ejecutable
- `Docs/crud-competencias/02-Bitacora.md` — bitácora de subagentes, críticas y commits
- `Docs/crud-competencias/03-Auditoria-Verificacion.md` — evidencia final con capturas
- `Docs/proceso-configuracion-competencias-periodo8.md` — cómo se hace hoy por SQL (fuente de los requisitos de diagnóstico)
