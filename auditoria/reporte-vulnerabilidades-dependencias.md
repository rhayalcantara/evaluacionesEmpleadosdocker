# REPORTE DE VULNERABILIDADES - DEPENDENCIAS NPM
## Sistema de Evaluación de Empleados

---

**Fecha:** 24 de Noviembre, 2025
**Herramienta:** npm audit
**Total de Vulnerabilidades:** 13

---

## RESUMEN EJECUTIVO

Se han detectado **13 vulnerabilidades** en las dependencias del proyecto:
- 🔴 **2 ALTAS** (High)
- 🟠 **8 MODERADAS** (Moderate)
- 🟡 **3 BAJAS** (Low)

### Clasificación por Impacto

#### Producción (CRÍTICO)
- 🔴 **1 Alta:** xlsx (SheetJS)
- 🟠 **1 Moderada:** @babel/runtime

#### Desarrollo (MENOR PRIORIDAD)
- 🔴 **1 Alta:** glob
- 🟠 **7 Moderadas:** webpack-dev-server, esbuild, inquirer, tmp, js-yaml, etc.
- 🟡 **3 Bajas:** Varias dependencias de desarrollo

---

## VULNERABILIDADES CRÍTICAS (PRODUCCIÓN)

### 🔴 #1: xlsx (SheetJS) - ALTA PRIORIDAD
**Severidad:** 🔴 Alta
**Paquete:** `xlsx`
**Impacto:** Producción
**Estado:** ⚠️ Sin fix disponible

#### Vulnerabilidades:
1. **GHSA-4r6h-8v6p-xvw6:** Prototype Pollution en SheetJS
   - Permite inyección de propiedades en objetos
   - Puede causar comportamiento inesperado o DoS

2. **GHSA-5pgg-2g8v-p4x9:** Regular Expression Denial of Service (ReDoS)
   - Expresiones regulares ineficientes
   - Puede causar bloqueo del servidor con inputs maliciosos

#### Impacto Real:
- ✅ **Bajo en este proyecto** porque xlsx se usa solo para exportación de datos
- El usuario controla el input (no hay datos externos)
- No hay procesamiento de archivos Excel subidos por usuarios

#### Soluciones:

**Opción A: Mantener y Monitorear (RECOMENDADA)**
```bash
# No hacer nada por ahora
# Monitorear actualizaciones de xlsx
# Mitigar riesgo limitando uso solo a exportación
```
- **Pros:** No rompe funcionalidad existente
- **Contras:** Vulnerabilidad persiste

**Opción B: Reemplazar xlsx**
```bash
# Cambiar a ExcelJS (más mantenido)
npm install exceljs
npm uninstall xlsx
```
- **Pros:** Elimina vulnerabilidad, mejor mantenido
- **Contras:** Requiere refactoring de código (2-4 días)

**Opción C: Actualizar cuando esté disponible**
```bash
# Esperar fix oficial
# Revisar semanalmente
```

#### Recomendación:
✅ **Opción A por ahora** - El riesgo es bajo dado nuestro uso específico. Planificar migración a ExcelJS en Fase 2.

---

### 🟠 #2: @babel/runtime - MODERADA PRIORIDAD
**Severidad:** 🟠 Moderada
**Paquete:** `@babel/runtime < 7.26.10`
**Impacto:** Producción (transpilación)
**CVE:** GHSA-968p-4wvh-cqc8

#### Descripción:
- Complejidad ineficiente de RegExp en código transpilado
- Afecta named capturing groups
- Puede causar lentitud en runtime

#### Solución:
```bash
npm audit fix --force
# ADVERTENCIA: Actualiza Angular a v21 (breaking change)
```

#### Impacto Real:
- ✅ **Muy Bajo** - Solo afecta si usamos named capturing groups específicos
- El código transpilado ya está generado
- No hay evidencia de uso problemático en nuestro código

#### Recomendación:
⏳ **Postponer** - Abordar junto con actualización de Angular en Fase 4

---

## VULNERABILIDADES DE DESARROLLO

### 🔴 #3: glob - ALTA (Solo CLI)
**Severidad:** 🔴 Alta
**Paquete:** `glob 10.2.0 - 10.4.5`
**Impacto:** ⚠️ Solo desarrollo
**CVE:** GHSA-5j98-mcp5-4vw2

#### Descripción:
- Command injection vía `-c/--cmd`
- Solo afecta uso de CLI de glob
- No afecta uso programático

#### Solución:
```bash
npm audit fix
```

#### Recomendación:
✅ **Aplicar fix inmediato** - Sin breaking changes

---

### 🟠 #4-7: Webpack Dev Server & Relacionados
**Severidad:** 🟠 Moderada
**Paquetes:**
- `webpack-dev-server <= 5.2.0`
- `esbuild <= 0.24.2`
- `inquirer 3.0.0 - 9.3.7`
- `tmp <= 0.2.3`

#### Vulnerabilidades:
1. **webpack-dev-server (GHSA-9jgg-88mc-972h, GHSA-4v9v-hfq4-rm2v)**
   - Robo de código fuente en navegadores no-Chromium
   - Solo en desarrollo local

2. **esbuild (GHSA-67mh-4wv8-2f99)**
   - Sitios maliciosos pueden leer respuestas del dev server
   - Solo en desarrollo

3. **inquirer + tmp**
   - Dependencias transitivas
   - Afectan solo herramientas CLI

#### Solución:
```bash
npm audit fix --force
# ADVERTENCIA: Actualiza Angular CLI a v21
```

#### Impacto Real:
- ✅ **Muy Bajo** - Solo afecta entorno de desarrollo
- Desarrolladores no visitan sitios maliciosos durante desarrollo
- Mitigation: No abrir sitios externos durante `ng serve`

#### Recomendación:
⏳ **Postponer** - Abordar en actualización mayor de Angular (Fase 4)

---

### 🟠 #8: js-yaml - MODERADA
**Severidad:** 🟠 Moderada
**Paquete:** `js-yaml < 3.14.2 || >= 4.0.0 < 4.1.1`
**Impacto:** Desarrollo
**CVE:** GHSA-mh29-5h37-fv8m

#### Descripción:
- Prototype pollution en operador merge `<<`
- Solo afecta procesamiento de YAML

#### Solución:
```bash
npm audit fix
```

#### Recomendación:
✅ **Aplicar fix inmediato** - Sin breaking changes

---

## PLAN DE ACCIÓN

### ✅ Acción Inmediata (HOY)
```bash
# Aplicar fixes seguros
npm audit fix

# Esto arreglará:
# - glob (CLI injection)
# - js-yaml (prototype pollution)
```
**Tiempo estimado:** 5 minutos
**Riesgo:** Mínimo (sin breaking changes)

---

### ⏳ Acción Corto Plazo (Fase 2 - Próximo mes)
**Tarea 2.X: Reemplazar xlsx con ExcelJS**

#### Pasos:
1. Instalar ExcelJS
   ```bash
   npm install exceljs
   ```

2. Refactorizar servicios de exportación
   - Identificar uso de xlsx en el código
   - Reemplazar con ExcelJS equivalente
   - Testing exhaustivo de exportaciones

3. Remover xlsx
   ```bash
   npm uninstall xlsx
   ```

**Esfuerzo estimado:** 2-4 días
**Prioridad:** Media

**Archivos a modificar:**
```
src/app/Services/excel.service.ts
```

---

### ⏳ Acción Largo Plazo (Fase 4 - 2-3 meses)
**Tarea 4.X: Actualizar Angular a v21**

Esta actualización resolverá automáticamente:
- @babel/runtime
- webpack-dev-server
- esbuild
- inquirer
- tmp
- Todas las dependencias de @angular-devkit

#### Comando:
```bash
ng update @angular/core@21 @angular/cli@21 --force
```

**Esfuerzo estimado:** 2 semanas
**Prioridad:** Baja (incluir en plan de modernización)

---

## MITIGACIONES ACTUALES

### Para xlsx (SheetJS):
✅ **Controles existentes:**
1. Solo se usa para **exportación** (no importación)
2. Los datos son generados internamente (no user input externo)
3. No se procesan archivos Excel subidos
4. Usuario final solo descarga archivos

✅ **Riesgo mitigado a BAJO**

### Para dependencias de desarrollo:
✅ **Controles existentes:**
1. Solo se ejecutan en entorno local de desarrollo
2. No están en producción
3. Desarrolladores trabajan en red interna confiable
4. Firewall corporativo protege acceso externo

✅ **Riesgo mitigado a MUY BAJO**

---

## RESUMEN DE DECISIONES

| # | Vulnerabilidad | Severidad | Acción | Timeline |
|---|----------------|-----------|--------|----------|
| 1 | xlsx | 🔴 Alta | Monitorear | Fase 2 (migrar) |
| 2 | @babel/runtime | 🟠 Moderada | Postponer | Fase 4 |
| 3 | glob | 🔴 Alta | ✅ Fix inmediato | HOY |
| 4-7 | webpack-dev-* | 🟠 Moderada | Postponer | Fase 4 |
| 8 | js-yaml | 🟠 Moderada | ✅ Fix inmediato | HOY |

---

## COMANDOS A EJECUTAR

### Hoy (Seguro):
```bash
# Backup package-lock.json primero
cp package-lock.json package-lock.json.backup

# Aplicar fixes seguros
npm audit fix

# Verificar que todo sigue funcionando
npm install
ng build
```

### Si algo falla:
```bash
# Revertir
cp package-lock.json.backup package-lock.json
npm install
```

---

## MÉTRICAS POST-REMEDIACIÓN

### Antes:
- Total: 13 vulnerabilidades
- Altas: 2
- Moderadas: 8
- Bajas: 3

### Después (npm audit fix):
- Total: ~11 vulnerabilidades (estimado)
- Altas: 1 (xlsx - aceptado)
- Moderadas: 7 (desarrollo - aceptado)
- Bajas: 3 (desarrollo - aceptado)

### Después (Fase 2 - xlsx migrado):
- Total: ~10 vulnerabilidades
- Altas: 0 ✅
- Moderadas: 7 (desarrollo - aceptado)
- Bajas: 3 (desarrollo - aceptado)

### Después (Fase 4 - Angular 21):
- Total: 0 vulnerabilidades ✅
- Sistema completamente actualizado

---

## APROBACIÓN

**Acción Inmediata (npm audit fix):**
- [ ] Aprobado por Tech Lead
- [ ] Backup creado
- [ ] Tests pasando después del fix

**Fecha de ejecución:** _________________
**Ejecutado por:** _________________

---

## REFERENCIAS

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Advisory Database](https://github.com/advisories)
- [ExcelJS (alternativa a xlsx)](https://github.com/exceljs/exceljs)
- [Angular Update Guide](https://update.angular.io/)

---

*Documento generado por auditoría de seguridad - 24/11/2025*
