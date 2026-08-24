# Defectos del API encontrados durante el rediseño

Están **fuera del alcance** de este trabajo (que es solo frontend), pero condicionan lo que la pantalla puede prometer. Los dos se verificaron contra el código del backend (`C:\Users\ralcantara\source\repos\EvaluacionEmpleadosApi`), contra el API de prueba `:7071` y contra la base `Evaluaciones_Test`.

---

## A. `GoalsController` oculta las metas de los puestos sin departamento válido

**Severidad: alta.** Es el arreglo de mayor rendimiento de todo este trabajo.

Los **cuatro** GET del controlador (`Getgoal`, `GetGoal(id)`, `GetGoalsbyPeriodo`, `GetGoalPosition`) arman la consulta con la misma línea:

```csharp
from depa in _context.Deparments.Where(x => x.secuencial == posi.DepartmentSecuencial)
```

No es `DefaultIfEmpty()`: si el departamento del puesto no existe en el catálogo, **la fila se cae del resultado**. No hay ningún endpoint que se salve.

**Evidencia (puesto 19, GERENTE GESTION HUMANA):**

| Endpoint | Filas del puesto 19 |
|---|---|
| `GET /api/Goals` | 0 (de 7 612) |
| `GET /api/Goals/periodo?periodoid=8` | 0 (de 103) |
| `GET /api/Goals/periodo?periodoid=7` | 0 (de 803) |
| `GET /api/Goals/puesto/19` | 0 |
| **Base de datos** | **12 en el periodo 7 y 12 en el periodo 8** |

**Magnitud:**

| | En base de datos | Devuelve el API | Ocultas |
|---|---|---|---|
| Periodo 7 | 910 | 803 | 107 |
| Periodo 8 | 115 | 103 | 12 |
| **Total** | **7 921** | **7 612** | **309** |

**Población afectada** (verificada y reconciliada por el subagente crítico; esta es la redacción correcta, cuidado con citar versiones anteriores):

- **115** puestos del catálogo tienen `Departmentsecuencial = 0` (el API y la base coinciden en ese número).
- Cero puestos tienen un departamento distinto de 0 que falte en el catálogo, así que "departamento ausente del catálogo" ≡ "departamento = 0".
- De esos 115, **13** esconden metas de verdad; los otros **102 tienen cero metas realmente**.
- De esos 115, **8** están ocupados por empleados activos (19, 33, 69, 94, 102, 221, 249, 255): **6 esconden metas y 2 están genuinamente vacíos** — los puestos **94 (ABOGADO JUNIOR)** y **102 (OFICIAL DE NEGOCIOS FLOTANTE)**.

**Consecuencia de negocio:** un usuario que se fíe del API vería el puesto 19 como "sin competencias" y le crearía 12, dejándolo con 24. Es el mismo tipo de daño que se acaba de limpiar en producción.

**Arreglo propuesto:** `DefaultIfEmpty()` (o un `LEFT JOIN`) en las cuatro consultas. Eso eliminaría de raíz el estado "sin dato fiable" del semáforo, el bloque de "no verificables" del diagnóstico y la advertencia del clonado.

**Mitigación mientras tanto (ya implementada):** ninguna pestaña presenta un cero del API como verdad. Los puestos que el API no puede confirmar se aíslan, se marcan y se acompañan de la consulta SQL que sí da la respuesta.

---

## B. `GET /api/Positions` no devuelve la categoría del puesto

**Severidad: media.**

El listado proyecta un `new Position { ... }` que **no asigna `CategoriaPuestoId`**, así que devuelve `0` en los **209** puestos, cuando en base de datos solo 102 lo tienen en cero. `GET /api/Positions/{id}` sí devuelve el valor real.

**Consecuencia:** cualquier pantalla que muestre la categoría desde el listado está mostrando 0 siempre. Un diagnóstico ingenuo de "puestos sin categoría válida" habría marcado los 209 como rotos.

**Mitigación (ya implementada):** la pestaña de Diagnóstico resuelve la categoría pidiendo `GET /api/Positions/{id}` solo de los puestos ocupados (90 en prueba, de cuatro en cuatro). Cuesta 90 llamadas por ejecución del diagnóstico; con el defecto arreglado sería una sola.

**Nota:** el `departmentSecuencial` del mismo listado **sí** se proyecta bien (los 115 ceros del API son los 115 de la base), así que el criterio del semáforo y del bloque de no verificables se apoya en un campo sano.

---

## C. Menor, ya conocido: `GET /api/Objetivoes` oculta competencias huérfanas

Hace inner join con periodo, estado y grupo, así que una competencia con alguno de esos ids inválido existe en base de datos y no aparece en la lista. Es lo que pasa con las competencias 71–76 (`PeriodoId = 0`), documentadas en `Docs/proceso-configuracion-competencias-periodo8.md` §4.

Ninguna de las seis está referenciada por un `Goal` ni por un vínculo de categoría, así que hoy no rompe nada. El copiado de catálogo avisa por si en el futuro aparecieran filas así en un periodo destino, donde sí se duplicarían.
