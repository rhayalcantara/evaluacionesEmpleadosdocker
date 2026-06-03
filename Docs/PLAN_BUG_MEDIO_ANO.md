# ♟ PLAN MAESTRO: Corrección Bug Crítico - Evaluación Medio Año
## Estrategia y Táctica (Metodología Ajedrez)

> **Autor:** Equipo de Desarrollo
> **Fecha:** 29 de mayo de 2026
> **Estado:** Pendiente de ejecución
> **Severidad:** CRÍTICO (totalCalculo = 0 en todas las evaluaciones de medio año)

---

## 1. TABLERO: Estado Actual del Sistema

### Piezas en Jogo
| Pieza | Ubicación | Estado |
|-------|-----------|--------|
| `FormEvaluationMedioAnoComponent` | `src/.../form-evaluation-medio-ano.component.ts` | ❌ No llama cálculos antes de grabar |
| `FormEvaluationEmployeComponent` (Final de año) | `src/.../FormEvaluationEmploye.component.ts` | ✅ Funciona, usa criterialitem |
| `CriterialItemComponent` | `src/.../evaluacioncomponents/criterialitem.component.ts` | ✅ Calcula promedios correctamente |
| `EvaluacionController` | `src/.../Controllers/Evaluacion.ts` | ⚠️ Método `grabar()` con cálculos comentados (líneas 428-483) |
| `calculaelpromediodesempeno()` | `src/.../Controllers/Evaluacion.ts:167` | ✅ Lógica correcta pero nadie la invoca desde medio año |
| `calcularresultadologro()` | `src/.../form-evaluation-medio-ano.component.ts:274` | ✅ Existe pero no se llama en onSubmit |
| `Update()` del controller | `src/.../Controllers/Evaluacion.ts:390` | ✅ Envía totalCalculo al backend |

---

## 2. DIAGNÓSTICO DEL BUG: El "Jaque" Identificado

### Causa Raíz
El método `onSubmit()` de `form-evaluation-medio-ano.component.ts` (líneas 352-399) **omite dos llamados críticos** antes de invocar `grabar()`:

```
// Línea 386 - FLO FATAL
this.EvaluacionController.grabar(this.supervisor).then(...)
```

**Faltantes (comparado con evaluación final de año):**
1. Iterar sobre `resultadolibro[]` y llamar `calcularresultadologro(index)` → calcula `%logro` y `resultadoLogro` por meta (línea 274)
2. Llamar `EvaluacionController.calculaelpromediodesempeno(supervisor, resultadolibro)` → calcula `totalCalculo`, `desempenoFinal`, `promedioCompetencias`, etc. (controller línea 167)

### Efecto en Cascada
```
No calcularresultadologro() 
    → resultadolibro.porcientologro = 0 para todas las metas
    → resultadolibro.resultadologro = 0 para todas las metas
        ↓
No llamar calculaelpromediodesempeno()
    → pdclocal no se filtra por período
    → promedioDesempeno no se calcula
    → desempeñoFinal = 0
    → promedioCompetencias no se calcula con los datos correctos
    → totalCalculo = 0
    → puntuacioncompetenciaColaborador = 0
    → puntuacioncompetenciaSupervisor = 0
        ↓
Backend recibe totalCalculo = 0
    → Evaluación guardada con puntuación de 0
    → PDFs incorrectos
    → Reportes erróneos
```

### Evidencia: ¿Por qué Final de Año SÍ funciona?
En la evaluación final de año, el componente `criterialitem` se encarga del cálculo:
- `criterialitem.component.ts:187` → llama `calculaelpromediodesempeno()` en ngOnInit
- `criterialitem.component.ts:388-389` → recalcula al cambiar respuestas
- `criterialitem.component.ts:195-247` → escucha el mensaje "Actualizar variables" y actualiza las variables

**En medio año ESTE COMPONENTE NO SE USA** — usa su propio método `calcularLogro()` local que solo calcula individualmente, no el promedio total.

---

## 3. ESTRATEGIA: Plan de Ataque de 5 Fases

### ♟ FASE 1 — Apertura (Preparación del Terreno)
**Objetivo:** Verificar que `calcularLogro()` existe y funciona, validar que los datos llegan correctos al onSubmit.

| Orden | Pieza | Movimiento | Archivo (Línea) |
|-------|-------|-----------|-----------------|
| 1.1 | Torre | Verificar `onLogroChange()` que sí llama `calcularLogro()` | `form-evaluation-medio-ano.component.ts:287-306` |
| 1.2 | Torre | Confirmar `resultadolibro[]` tiene datos populeados en ngOnInit | `form-evaluation-medio-ano.component.ts:143-173` |
| 1.3 | Caballo | Verificar que `evaluacionDesempenoMetaRespuestas` se mapea correctamente | `form-evaluation-medio-ano.component.ts:293-305` |

**Estado:** ✅ Ya hecho por exploración. Los métodos SÍ existen y calculan correctamente a nivel individual. El problema es que al `onSubmit()` no se hacen los cálculos acumulativos.

---

### ♟ FASE 2 — Desarrollo (Modificación del Componente Medio Año)
**Objetivo:** Insertar las llamadas de cálculo antes de `grabar()`.

| Orden | Pieza | Movimiento | Archivo (Línea) | Acción |
|-------|-------|-----------|-----------------|--------|
| 2.1 | Alfil | Agregar cálculo acumulativo antes de `this.EvaluacionController.model = this.evaluacionempleado` | `form-evaluation-medio-ano.component.ts:383` | Insertar bloque de código |
| 2.2 | Alfil | Iterar `resultadolibro[]` y asegurar que cada `calcularLogro(i)` se llama | `form-evaluation-medio-ano.component.ts:274` | Forzar recálculo de todos los logros |
| 2.3 | Rey | Llamar `this.EvaluacionController.calculaelpromediodesempeno(this.supervisor, this.resultadolibro)` | N/A (nueva línea) | Esto calcula totalCalculo, desempenoFinal, etc. |

#### Bloque de Código a Insertar
En `form-evaluation-medio-ano.component.ts` antes de la línea 383:

```typescript
// BEFORE: Línea 383 (this.EvaluacionController.model = ...)
// INSERTAR ESTE BLOQUE:

    // Recalcular logros de todas las metas antes de grabar
    this.resultadolibro.forEach((_, index) => {
        this.calcularLogro(index);
    });

    // Actualizar evaluacionDesempenoMetaRespuestas con los datos de resultadolibro
    this.resultadolibro.forEach((res, index) => {
        if (this.evaluacionempleado.evaluacionDesempenoMetas[index]?.evaluacioneDesempenoMetaRespuestas) {
            this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas.logro = res.logro;
            this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas.medioverificacion = res.medioverificacion;
            this.evaluacionempleado.evaluacionDesempenoMetas[index].evaluacioneDesempenoMetaRespuestas.comentario = res.comentario;
        }
    });

    // Calcular el promedio de desempeño y competencia (totalCalculo, etc.)
    await this.EvaluacionController.calculaelpromediodesempeno(this.supervisor, this.resultadolibro);
```

**Cambio en la firma de onSubmit:**
```typescript
// DE:
public onSubmit() {
// A:
public async onSubmit() {
```

---

### ♟ FASE 3 — Enroque (Fortalecer el Controller)
**Objetivo:** Descomentar y activar la lógica de cálculo dentro de `grabar()`.

| Orden | Pieza | Movimiento | Archivo (Línea) | Acción |
|-------|-------|-----------|-----------------|--------|
| 3.1 | Reina | Descomentar código en `grabar()` (líneas 428-483) | `Controllers/Evaluacion.ts:428-483` | Descomentar lógica de cálculo |
| 3.2 | Reina | Validar que `totalCalculo` = dc.total funciona | `Controllers/Evaluacion.ts:483` | Confirmar asignación |
| 3.3 | Caballo | Verificar que `model.id === 0` → insert, else → update funciona | `Controllers/Evaluacion.ts:487-496` | Verificar flujo |

**Nota táctica:** Las líneas 428-483 contienen código comentado que calcula competencia, desempeño, y total. **Este código ya está escrito y funciona** - solo necesita descomentarse.

#### Alternativa (si el equipo decide NO descomentar):
Mantener la estrategia de la Fase 2 como el único punto de cálculo. La ventaja es que los cálculos ocurren en el frontend, y el controller solo persiste. Esto SÍ funciona porque `calculaelpromediodesempeno()` modifica directamente `this.model` del controller.

---

### ♟ FASE 4 — Centralización (Validación)
**Objetivo:** Verificar que los datos calculados llegan al backend correctamente.

| Orden | Pieza | Movimiento | Validación |
|-------|-------|-----------|------------|
| 4.1 | Torre | Debug: Log de `this.EvaluacionController.model.totalCalculo` antes de grabar | Debe ser > 0 |
| 4.2 | Torre | Debug: Log de `this.EvaluacionController.model.puntuacioncompetenciaColaborador` | Debe coincidir con promedio esperado |
| 4.3 | Alfil | Verificar la respuesta del backend al llamar `Update()` | Debe retornar datos sin error |
| 4.3 | Caballo | Verificar `goalEmpleadoRespuestas` no están vacías | Debe tener observaciones correctamente asignadas |

---

### ♟ FASE 5 — Jaque Mate (Testing Completo)
**Objetivo:** Verificar end-to-end que el bug está resuelto.

| Orden | Escenario | Resultado Esperado |
|-------|-----------|-------------------|
| 5.1 | Colaborador crea nueva evaluación de medio año | totalCalculo > 0 tras grabar |
| 5.2 | Supervisor completa evaluación | totalsupervisor calculado correctamente |
| 5.3 | Evaluación con competencias pero SIN metas de desempeño | totalCalculo = solo competencias (pdclocal ajusta: desempeño=0, competencia=100) |
| 5.4 | Evaluar → Grabar → Recargar la página | Datos persisten correctamente |
| 5.5 | Evaluar → Grabar → Re-editar → Grabar | Update actualiza totalCalculo correctamente |
| 5.6 | Validar que los campos feedback (continuar/más/menos/parar) se guardan | JSON strings en BD |
| 5.7 | Verificar que courses seleccionados se guardan | evaluacionCursoCapacitacions tiene datos |

---

## 4. ANÁLISIS VARIANTES

### Variante A: Solo Frontend (Recomendada ⭐)
- **Modificación única:** Fase 2 en `form-evaluation-medio-ano.component.ts`
- **Riesgo:** Bajo — código nuevo, no modifica lo existente
- **Ventaja:** Aísla el fix al componente problemático

### Variante B: Solo Backend
- **Acción:** Descomentar lógica en `grabar()` (Fase 3)
- **Riesgo:** Medio — afecta TODOS los flujos que llaman a `grabar()`
- **Ventaja:** Solución centralizada

### Variante C: Híbrida
- **Acción:** Fase 2 + Fase 3
- **Riesgo:** Alto — doble cálculo puede generar inconsistencias
- **Desventaja:** Los cálculos se ejecutan 2 veces (componente + controller)

### Recomendación: **Variante A + Fase 4 + Fase 5**
Un solo punto de modificación, mínimo riesgo, máximo impacto.

---

## 5. ORDEN DE EJECUCIÓN (Checklist)

```
[ ] Fase 1.1 — Verificar calcularLogro() funciona individualmente
[ ] Fase 1.2 — Verificar resultadolibro[] se populea en ngOnInit
[ ] Fase 1.3 — Verificar evaluacionDesempenoMetaRespuestas mapeo correcto
[ ] Fase 2.1 — Modificar onSubmit() → agregar async + bloque de cálculo
[ ] Fase 2.2 — Iterar resultadolibro y forzar recálculo de logros
[ ] Fase 2.3 — Llamar calculaelpromediodesempeno() antes de grabar
[ ] Fase 4.1 — Debug: totalCalculo antes de grabar
[ ] Fase 4.2 — Debug: puntuacioncompetenciaColaborador
[ ] Fase 4.3 — Debug: respuesta backend al Update()
[ ] Fase 5.1 — Test: nueva evaluación (colaborador)
[ ] Fase 5.2 — Test: evaluación supervisor
[ ] Fase 5.3 — Test: solo competencias sin metas
[ ] Fase 5.4 — Test: persistencia tras recarga
[ ] Fase 5.5 — Test: update correcto
[ ] Fase 5.6 — Test: feedbacks se guardan
[ ] Fase 5.7 — Test: cursos se guardan
```

---

## 6. ROL DEL EQUIPO (Distribución de Piezas)

| Rol | Responsabilidad |
|-----|-----------------|
| **Blancas (Desarrollador)** | Ejecutar Fase 2 (modificación del componente) |
| **Negras (Testing)** | Ejecutar Fase 4 + Fase 5 |
| **Árbitro (Code Review)** | Validar que el código no introduce regressions en el flujo final de año |

---

## 7. CRONOGRAMA ESTIMADO

| Fase | Duración Estimada | Dependencia |
|------|------------------|-------------|
| Fase 1 (Verificación) | 10 min | Ninguna |
| Fase 2 (Modificación) | 30 min | Fase 1 completa |
| Fase 4 (Validación) | 20 min | Fase 2 completa |
| Fase 5 (Testing E2E) | 40 min | Fase 4 completa |
| **Total** | **~100 min** | |

---

## 8. NOTAS DEL ENTRENADOR

> **Lección táctica:** Este bug es clásico de "falta de paridad" entre dos componentes que comparten el mismo controller pero no los mismos flujos de cálculo. La evaluación final de año usa `criterialitem` que hace los cálculos; medio año NO lo usa. Solución: igualar los flujos sin duplicar código.

> **Principio ajedrecístico aplicado:** "No muevas la misma pieza dos veces sin necesidad." — Modificamos SOLO el componente defectuoso, no el controller compartido.

> **Regla de oro para el futuro:** Cualquier nuevo tipo de evaluación debe verificar que TODOS los pasos del flujo de cálculo (calcularresultadologro → calculaelpromediodesempeno → grabar) estén presentes en su método onSubmit().

---

*Plan generado como documento vivo. Actualizar estado de cada fase al ejecutar.*
