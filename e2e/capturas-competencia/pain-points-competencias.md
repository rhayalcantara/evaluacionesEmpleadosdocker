# Pain Points — Gestión de Competencias por Período

**Ambiente:** http://192.168.7.222/evaluacionempleado-prueba
**DB:** Evaluaciones_Test | **Fecha:** 5/6/2026

---

## Hallazgos confirmados

### 1. [BLOQUEANTE] Dropdown de Período no muestra tipo medio_ano

El backend /api/Periods solo devuelve al form de Competencias:
- Evaluación de Desempeño Final 2024
- Evaluación de Desempeño Final 2025

El período 8 (tipo=medio_ano) NO aparece aunque existe en la DB.
El backend filtra por Tipo = 'final_ano'.
No se pueden asignar competencias a períodos de medio año con el flujo actual.

---

### 2. [UX CRÍTICO] Textarea descripción: 646x62 px

Cada competencia tiene 3-4 párrafos (~700 caracteres). El textarea mide 62px de alto.
El usuario escribe y edita completamente a ciegas.

---

### 3. [UX] Tabla muestra descripción completa sin truncar

Cada fila ocupa 10-15 líneas por mostrar el texto íntegro en la columna Descripción.
Con 12 competencias = scroll interminable, imposible navegar la lista.

---

### 4. [UX] Estado default: InActiva

El dropdown de Estado abre con el primer valor: InActiva.
Riesgo real de crear competencias inactivas sin darse cuenta.

---

### 5. [BUG] Lista no refresca después de guardar

Filas antes: 2 | Filas después de guardar: 2 (debería ser 3).
El controller Objetivo.grabar() no llama getdatos() post-insert.

---

### 6. [PROCESO] Sin Copiar del período anterior

12 competencias x 6 campos = 72+ interacciones manuales por período nuevo.
Sin opción de duplicar o importar del período anterior.

---

### 7. [PROCESO] Sin filtro por período en la lista

La lista mezcla competencias de todos los períodos.
Con cada nuevo período la lista crece y se vuelve inmanejable.

---

## Resumen de impacto

| Issue | Impacto | Esfuerzo |
|-------|---------|----------|
| 1 Backend no devuelve medio_ano | BLOQUEANTE | Bajo - 1 linea backend |
| 2 Textarea 62px | Alto | Bajo - 1 linea CSS |
| 3 Descripcion completa en tabla | Alto | Bajo - CSS truncate |
| 4 Estado default InActiva | Medio | Bajo - cambiar default |
| 5 Lista no refresca tras guardar | Medio | Bajo - agregar getdatos() |
| 6 Sin copiar del período anterior | Alto | Medio - nueva feature |
| 7 Sin filtro por período | Medio | Bajo - agregar select |

---

## Opciones para discutir

### Opción A - Solo fixes rápidos (2-3h)
Issues 1, 2, 3, 4 y 5. Cambios de 1-5 líneas. Sin nuevas features.

### Opción B - Feature Copiar de período anterior (4-6h)
Botón en la lista que duplica todas las competencias cambiando solo el periodoId.
Elimina el 90% del trabajo manual para nuevos períodos.

### Opción C - Ambas (recomendado)
Fixes rápidos primero, feature de copia después.
