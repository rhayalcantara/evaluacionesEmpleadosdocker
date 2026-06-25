# Plan de Ejecución — Ajustes solicitados por correo (Evaluación de Medio Año)

> **Estado:** Cambios A, B y "Comentarios" **IMPLEMENTADOS** (build OK). Pendiente: tema Pablo (ver §6).
> **Fecha:** 2026-06-25
> **Componente afectado principal:** `src/app/Views/Components/Forms/form-evaluation-medio-ano/`

---

## 1. Requerimientos del correo (interpretación)

El correo pide ajustes sobre la sección **"Retroalimentación de Desempeño (Start-Stop-Continue)"** del formulario de medio año:

1. **Texto introductorio nuevo** y con más jerarquía visual:
   > "Basado en el progreso de los objetivos, proyectos y competencias evaluadas, registre acciones concretas en cada categoría. Justifíquela con las Competencias que aplican, pueden usar hasta 3."
   > *"Esta parte poner un poco más grande y negrita."*

2. **Reemplazar las descripciones cortas** de cada categoría por las versiones largas del correo (ver textos exactos en §4).

3. **"Agregar — Comentarios, Compromisos y Próximos Pasos"** → ⚠️ ambiguo, ver §5 (Punto a decidir).

4. **Habilitar la evaluación de "Pablo"** para poder verla desde el punto de vista del supervisor → ver §6 (Investigación / dato).

---

## 2. Verificación del estado actual ✅

Lo que **ya está implementado** en `form-evaluation-medio-ano.component.html`:

| Elemento | Estado | Ubicación |
|---|---|---|
| 4 categorías Start-Stop-Continue-More | ✅ Existe | Bloque Colaborador (líneas 148-272) y Supervisor (274-398) |
| Vincular hasta 3 competencias | ✅ Existe y validado | `onCompetenciaSeleccionada()` (component.ts:265) |
| Sección "Compromisos y Próximos Pasos" | ✅ Existe | líneas 401-431 |
| Firma y fecha | ✅ Existe | líneas 433-466 |
| Vista de supervisor (`[supervisor]="true"`) | ✅ Existe | `form-evaluacion-supervisor.component.html:38` |

**Conclusión:** los cambios son mayormente de **texto/estilo** (no estructurales), salvo el punto "Comentarios" (§5) y el tema de "Pablo" (§6).

---

## 3. Cambio A — Texto introductorio (más grande y negrita)

**Archivo:** `form-evaluation-medio-ano.component.html` — línea **146**

**Actual:**
```html
<p class="text-muted">Basado en los objetivos y competencias evaluados, registre acciones concretas en cada categoría.</p>
```

**Propuesto:**
```html
<p class="fw-bold fs-5 text-dark">
  Basado en el progreso de los objetivos, proyectos y competencias evaluadas,
  registre acciones concretas en cada categoría. Justifíquela con las Competencias
  que aplican, pueden usar hasta 3.
</p>
```
- `fw-bold` = negrita; `fs-5` = un poco más grande (Bootstrap). Se puede ajustar a `fs-4` si se quiere más grande.

---

## 4. Cambio B — Descripciones largas de cada categoría

Reemplazar los `<p class="text-muted small mb-1">...</p>` de cada categoría por los textos del correo.
**Aplica a los DOS bloques** (Colaborador y Supervisor) → **8 reemplazos en total** (4 categorías × 2 bloques).

| Categoría | Texto nuevo (del correo) | Líneas (Colab / Super) |
|---|---|---|
| **Continuar Haciendo** | "Actividades o prácticas que funcionan bien y deben mantenerse para apoyar el logro de los objetivos y proyectos de forma satisfactoria; y porque evidencian los comportamientos esperados de acuerdo con las competencias de su puesto." | 156 / 282 |
| **Hacer Más** | "Acciones que necesitan mayor esfuerzo o frecuencia para apoyar el logro de los objetivos y proyectos; además de realizar el trabajo basado en las Competencias de su puesto." | 186 / 312 |
| **Hacer Menos** | "Actividades que consumen tiempo sin el resultado esperado, que aportan poco al logro de los objetivos y no proveen evidencias fuertes de los comportamientos esperados de acuerdo con las Competencias de su puesto." | 216 / 342 |
| **Parar de Hacer** | "Prácticas o hábitos perjudiciales o ineficientes que deben detenerse de inmediato porque impactan negativamente el logro de los objetivos, y no demuestran el comportamiento esperado en la realización de su trabajo, de acuerdo con la Competencias de su puesto." | 246 / 372 |

> **Nota de estilo:** los textos son largos. Se mantienen con `text-muted small` para que no compitan con el título de cada tarjeta. Si quedan muy apretados, evaluar cambiar `small` por tamaño normal.

---

## 5. ✅ IMPLEMENTADO — "Agregar Comentarios" (Comentarios, Compromisos y Próximos Pasos)

**Decisión tomada:** Opción 1 (campo Comentarios en el recuadro de cierre), **sin tocar la base de datos**.

**Enfoque elegido (frontend-only):** se reutilizan los campos existentes `colaboradorCompromisos` /
`supervisorCompromisos` (nvarchar(max), que **ningún otro componente ni reporte consume**) y se guardan
como **JSON `{ comentarios, compromisos }`** — idéntico al patrón que ya usan las 4 categorías
(`{ texto, competencias }`). Datos viejos en texto plano se interpretan como "compromisos" (comentarios vacío).

**Cambios aplicados:**
- `form-evaluation-medio-ano.component.ts`:
  - Nueva interfaz `ICierreFeedback { comentarios, compromisos }`.
  - Propiedades `colaboradorComentarios` / `supervisorComentarios`.
  - Helpers `parseCierre()` (tolerante a texto plano viejo) y `stringifyCierre()`.
  - `parseQualitativeFields()` y `onSubmit()` actualizados.
- `form-evaluation-medio-ano.component.html`:
  - Sección renombrada a **"Comentarios, Compromisos y Próximos Pasos"**.
  - Textarea **Comentarios** para Colaborador y Supervisor (sobre el de Compromisos).
  - Campos del supervisor: `[disabled]="!supervisor || sololectura"` (antes solo `sololectura`).

**Ventajas:** cero cambios de backend/BD, reversible, consistente con el patrón existente.
**Si en el futuro se quieren columnas dedicadas** (`ColaboradorComentarios` / `SupervisorComentarios`),
se migra con backend + `ALTER TABLE`. Hoy NO es necesario.

> Build verificado: compila OK (solo warnings preexistentes de CSS budget y CommonJS).

---

### Histórico — opciones evaluadas (resuelto en favor de Opción 1)

#### ⚠️ Punto a decidir original — "Agregar / Comentarios, Compromisos y Próximos Pasos"

El correo dice literalmente:
```
Agregar
Comentarios, Compromisos y Próximos Pasos
```

Esto tiene **dos interpretaciones posibles**; necesito confirmar cuál antes de implementar:

**Opción 1 — Renombrar y agregar campo "Comentarios" a la sección existente (recomendada)**
- Renombrar la sección actual "Compromisos y Próximos Pasos" → **"Comentarios, Compromisos y Próximos Pasos"**.
- Agregar un campo de texto **"Comentarios"** (Colaborador y/o Supervisor).
- **Impacto:** requiere **nuevos campos en el modelo y la base de datos** (`colaboradorComentarios`, `supervisorComentarios` en `IEvaluacion` + tabla `Evaluacion` + endpoint del backend). Hoy **solo existen** `colaboradorCompromisos` / `supervisorCompromisos`.

**Opción 2 — "Agregar" es una 5ª categoría del modelo Start-Stop-Continue**
- En el modelo clásico "Start-Stop-Continue", "Start" = "Empezar a hacer / Agregar".
- Sería una **5ª tarjeta** ("Agregar / Empezar a Hacer") con su vínculo de competencias.
- **Impacto:** nuevos campos `colaboradorAgregar` / `supervisorAgregar` en modelo + BD + UI.

> **Recomendación:** Opción 1 (solo agregar "Comentarios" al recuadro de cierre). Es lo que más encaja con la redacción y con que la sección "Compromisos y Próximos Pasos" ya existe. **Confirmar con quien envió el correo.**

En **ambas opciones** hay trabajo de backend (no solo Angular). Si se quiere una solución **sin tocar BD a corto plazo**, alternativa: reutilizar el campo `colaboradorCompromisos`/`supervisorCompromisos` y solo renombrar el rótulo a "Comentarios, Compromisos y Próximos Pasos" (sin campo separado de comentarios).

---

## 6. Tema "Pablo" — habilitar vista de supervisor

**Lo que se pide:** poder abrir la evaluación de medio año de **Pablo** desde el punto de vista del **supervisor**.

**Cómo funciona hoy:**
- El supervisor abre la evaluación de un subordinado mediante `form-evaluacion-supervisor` (`[supervisor]="true"`).
- Para que Pablo aparezca/pueda abrirse, normalmente se requiere:
  1. Que Pablo esté asociado al supervisor correcto (jefe inmediato / excepción de supervisor).
  2. Que exista una evaluación de Pablo para el **periodo de medio año** en un estado que permita la vista de supervisor (p. ej. autoevaluación enviada).

**Hallazgos (BD `Evaluaciones_Test`, consulta de solo lectura vía MCP):**

| Dato | Valor |
|---|---|
| Empleado / código | Pablo = **55** (supervisor); usuario = **525** |
| Periodo de medio año activo | **Id 8** — "Evaluacion de Medio Ano 2026 (PRUEBA)", `tipo = medio_ano`, `activa = true` |
| Evaluación del usuario (525) en periodo 8 | **Id 1808** · `secuencialsupervisor = 55` (Pablo) · estado **`AutoEvaluado`** |
| Otra del equipo de Pablo en periodo 8 | Id 1809 · empleado 539 · supervisor 55 · estado `Borrador` |
| Evaluación propia de Pablo (55) en periodo 8 | **No existe** |

**Análisis:**
- La evaluación 1808 (la del usuario 525) **ya está lista para verse desde el supervisor**: tiene a Pablo (55)
  como `secuencialsupervisor` y estado `AutoEvaluado`. Con la lógica de `evaluar-subordinados`
  (`puedeEvaluar = !(Pendiente|Completado|Enviado)`), `AutoEvaluado` → **el botón "Evaluar" queda habilitado**.
- La lista del equipo del supervisor se arma desde el **padrón** (endpoint
  `/equipo/?JEFEINMEDIATO_SECUENCIAL=55&fechaconsulta=...`), **no** desde la tabla `Evaluacion`. Por eso, para
  que el usuario 525 aparezca bajo Pablo, el **padrón** debe registrar a 525 con jefe inmediato = 55 a la fecha
  fin del periodo 8 (el padrón es una fuente externa, NO está en `Evaluaciones_Test`, no se puede verificar desde aquí).

**Para "ver la versión del supervisor":** iniciar sesión en la app **como Pablo (55)** → menú **Evaluar Subordinados**
→ abrir la tarjeta del empleado 525 → se renderiza `form-evaluacion-supervisor` con `[supervisor]="true"`.

**✅ RESUELTO — verificado contra el API (`http://192.168.7.222:7070`):**

Pablo tiene varios usuarios; el correcto es **`prodriguez`**. Verificación:

| Verificación | Resultado |
|---|---|
| `/empuser/prodriguez` → empleado | **secuencial 55** = PABLO EDUARDO RODRIGUEZ VASQUEZ, `codigoestado=A`, `esjefatura=1` ✓ |
| Rol del secuencial 55 (`EmpleadosRoles`) | **Supervisor** (RolId 2) ✓ |
| `/equipo/?JEFEINMEDIATO_SECUENCIAL=55&fechaconsulta=2026-06-30` | 5 subordinados, incluye **525 (RALCANTARA)** y **539** ✓ |
| Evaluación del 525 en periodo 8 | Id 1808, supervisor 55, estado `AutoEvaluado` → abrible en modo supervisor ✓ |

**Conclusión:** **no hace falta ningún cambio de datos ni de código.** El problema era usar el usuario
equivocado de Pablo. Iniciando sesión como **`prodriguez`** → menú **Evaluar Subordinados** → aparece el
empleado **525 (Rhay)** → se abre la evaluación de medio año con la vista de supervisor (`[supervisor]="true"`).

---

## 7. Orden de ejecución propuesto

1. **Cambios A y B** (texto intro + descripciones largas) — solo HTML, bajo riesgo. **Listo para hacer ya.**
2. **Decisión §5** (Comentarios/Agregar) — esperar confirmación; si implica BD, coordinar con backend.
3. **Tema §6 (Pablo)** — investigación de dato en entorno prueba; requiere identificar a Pablo.

---

## 8. Riesgos y pruebas

- **Riesgo bajo** en cambios A y B: solo texto/clases CSS. Verificar que las tarjetas no rompan el layout responsivo (col-md-6).
- Si se agrega "Comentarios" con BD: probar guardado/lectura (`parseQualitativeFields`, `onSubmit`) y migración del backend.
- **Pruebas:** existen specs E2E de medio año (`e2e/prueba-medio-ano-2026.spec.js`, `e2e/auto-medio-ano-2026.spec.js`). Ejecutar tras los cambios para validar que el flujo sigue funcionando.
- Recordar: trabajamos sobre **evaluacionempleado-prueba**, no producción.

---

## 9. Preguntas abiertas para la reunión

1. "Agregar" → ¿campo **Comentarios** dentro de Compromisos (Opción 1) o **5ª categoría** Start-Stop-Continue (Opción 2)?
2. Si es Comentarios: ¿lo llena solo el colaborador, solo el supervisor, o ambos?
3. ¿Se aprueba tocar backend + BD para el campo nuevo, o usamos solución sin BD (solo renombrar rótulo)?
4. ¿Quién es "Pablo" exactamente (nombre completo / cédula) y bajo qué supervisor debe verse?
