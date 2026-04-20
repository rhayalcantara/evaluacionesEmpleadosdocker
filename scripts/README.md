# Scripts de Mantenimiento - Sistema de Evaluaciones

Este directorio contiene scripts de mantenimiento para el sistema de evaluación de empleados.

## crear_evaluaciones_masivas.py

Script para crear evaluaciones masivas en estado "Borrador" para todos los empleados activos que no tengan evaluación en un periodo específico.

### Instalación

```bash
# Instalar dependencias
pip install -r requirements.txt
```

### Uso

#### 1. Crear evaluaciones para todos los empleados sin evaluación en el periodo 7

```bash
python crear_evaluaciones_masivas.py --periodo-id 7
```

#### 2. Modo simulación (Dry-run) - Ver qué se haría sin ejecutar cambios

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run
```

**Recomendado:** Siempre ejecutar primero en modo `--dry-run` para revisar qué empleados serían afectados.

#### 3. Crear evaluación solo para un empleado específico

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318
```

#### 4. Usar API personalizada

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --api-url http://localhost:7070
```

### Opciones disponibles

| Opción | Descripción | Requerido | Default |
|--------|-------------|-----------|---------|
| `--periodo-id` | ID del periodo para crear evaluaciones | ✅ Sí | - |
| `--empleado-id` | Secuencial de empleado específico | ❌ No | Todos |
| `--dry-run` | Modo simulación (no crea registros) | ❌ No | False |
| `--api-url` | URL base del API | ❌ No | http://192.168.7.222:7070 |
| `--timeout` | Timeout para peticiones HTTP (segundos) | ❌ No | 30 |

### Ejemplos de salida

#### Modo normal

```
======================================================================
PROCESO DE CREACIÓN MASIVA DE EVALUACIONES
======================================================================
✓ Periodo encontrado: Evaluación 2025 - Primer Semestre
✓ Empleados activos encontrados: 120

Procesando 120 empleados para periodo 7...
----------------------------------------------------------------------
[1/120] ✓ JUAN PEREZ (ID: 100) - Ya tiene evaluación
[2/120] ⚠ MARIA RODRIGUEZ (ID: 318) - SIN evaluación
[3/120] ✓ PEDRO GOMEZ (ID: 200) - Ya tiene evaluación
...

======================================================================
CREACIÓN DE EVALUACIONES FALTANTES: 28 empleados
======================================================================
[1/28] ⚙ Creando evaluación para MARIA RODRIGUEZ (ID: 318)... ✓ Creada (ID: 450)
[2/28] ⚙ Creando evaluación para ANA MARTINEZ (ID: 405)... ✓ Creada (ID: 451)
...

======================================================================
RESUMEN DE EJECUCIÓN
======================================================================
Total empleados procesados:    120
Con evaluación existente:      92
Sin evaluación:                28

Evaluaciones creadas exitosamente: 28
Evaluaciones fallidas:             0
======================================================================
```

#### Modo Dry-run

```
======================================================================
PROCESO DE CREACIÓN MASIVA DE EVALUACIONES
======================================================================
⚠ MODO SIMULACIÓN (DRY-RUN) - No se crearán evaluaciones reales
✓ Periodo encontrado: Evaluación 2025 - Primer Semestre
✓ Empleados activos encontrados: 120

...

======================================================================
RESUMEN DE EJECUCIÓN
======================================================================
Total empleados procesados:    120
Con evaluación existente:      92
Sin evaluación:                28

Evaluaciones a crear (simulación): 28
======================================================================
```

### Características

- ✅ Reintentos automáticos en caso de fallas transitorias
- ✅ Timeout configurable para peticiones HTTP
- ✅ Modo dry-run para simulación segura
- ✅ Procesamiento individual o masivo
- ✅ Logs detallados del proceso
- ✅ Validación de periodo existente
- ✅ Verificación de evaluaciones existentes antes de crear
- ✅ Manejo robusto de errores

### Estructura de evaluación creada

Las evaluaciones se crean con la siguiente estructura:

```json
{
  "id": 0,
  "periodId": <periodo_id>,
  "empleadoSecuencial": <secuencial_empleado>,
  "totalCalculo": 0,
  "fechaRepuestas": "",
  "observacion": "Evaluación creada automáticamente",
  "evaluacionGoals": [],
  "evaluacionDesempenoMetas": [],
  "goalEmpleadoRespuestas": [],
  "puntuaciondesempenocolaborador": 0,
  "puntuacioncompetenciacolaborador": 0,
  "totalcolaborador": 0,
  "puntuaciondesempenosupervidor": 0,
  "puntuacioncompetenciasupervisor": 0,
  "totalsupervisor": 0,
  "estadoevaluacion": "Borrador",
  "entrevistaConSupervisor": false,
  "aceptaEnDisgusto": false,
  "comentarioDisgusto": "",
  "porcentajeDesempeno": 0,
  "porcentajeCompetencia": 0
}
```

### Notas importantes

1. **Solo empleados activos**: El script procesa únicamente empleados con `codigoestado == "A"`
2. **Estado borrador**: Las evaluaciones se crean en estado "Borrador", permitiendo que el empleado las complete
3. **Evita duplicados**: Verifica la existencia de evaluaciones antes de crear
4. **Red corporativa**: El script debe ejecutarse desde la VPN corporativa o red interna

### Solución de problemas

#### Error de conexión

```
✗ Error al obtener empleados: HTTPConnectionPool...
```

**Solución**: Verificar que estás conectado a la VPN/red corporativa y que el API esté disponible.

#### Periodo no encontrado

```
✗ El periodo 7 no existe
```

**Solución**: Verificar el ID del periodo en el sistema.

#### Timeout

```
✗ Error al crear evaluación: Read timed out
```

**Solución**: Aumentar el timeout con `--timeout 60`

### Mantenimiento

Para actualizar el script o agregar funcionalidades, modificar `crear_evaluaciones_masivas.py`.

Para reportar problemas, contactar al equipo de Desarrollo de Sistemas.
