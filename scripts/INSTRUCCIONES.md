# Instrucciones de Uso - Script de Creación Masiva de Evaluaciones

## Contexto del Problema

Has identificado que tienes 28 empleados activos sin evaluación para el periodo 7. Este script automatiza la creación de evaluaciones en estado "Borrador" para estos empleados.

## Pasos para Ejecutar

### 1. Verificar conectividad del API

Primero asegúrate de estar conectado a la VPN corporativa y que el API esté disponible:

```bash
cd scripts
python test_api.py
```

**Salida esperada:**
```
============================================================
PRUEBA DE CONECTIVIDAD API
============================================================
API URL: http://192.168.7.222:7070

[1] Probando endpoint /api/Empleados...
    [OK] Empleados totales: 150, Activos: 120

[2] Probando endpoint /api/Periodos...
    [OK] Periodos encontrados: 10

    Periodos disponibles:
      - ID:   1 | Evaluación 2024 - Primer Semestre
      - ID:   2 | Evaluación 2024 - Segundo Semestre
      - ID:   7 | Evaluación 2025 - Primer Semestre
      ...

[3] Probando endpoint /api/Evaluacions...
    [OK] Evaluaciones totales: 450

============================================================
Prueba completada
============================================================
```

Si ves errores aquí, verifica:
- ✅ Estás conectado a la VPN corporativa
- ✅ El servidor backend está en ejecución
- ✅ La URL del API es correcta

### 2. Ejecutar en modo simulación (RECOMENDADO)

Antes de crear registros reales, **siempre ejecuta en modo dry-run** para ver qué se hará:

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run
```

**Salida esperada:**
```
======================================================================
PROCESO DE CREACIÓN MASIVA DE EVALUACIONES
======================================================================
[WARN] MODO SIMULACION (DRY-RUN) - No se crearan evaluaciones reales
[OK] Periodo encontrado: Evaluación 2025 - Primer Semestre
[OK] Empleados activos encontrados: 120

Procesando 120 empleados para periodo 7...
----------------------------------------------------------------------
[1/120] [OK] JUAN PEREZ (ID: 100) - Ya tiene evaluacion
[2/120] [PENDING] MARIA RODRIGUEZ (ID: 318) - SIN evaluacion
[3/120] [OK] PEDRO GOMEZ (ID: 200) - Ya tiene evaluacion
[4/120] [PENDING] ANA MARTINEZ (ID: 405) - SIN evaluacion
...
[120/120] [OK] CARLOS LOPEZ (ID: 550) - Ya tiene evaluacion

======================================================================
CREACIÓN DE EVALUACIONES FALTANTES: 28 empleados
======================================================================
[1/28] [SIMULATE] SIMULARIA crear evaluacion para MARIA RODRIGUEZ (ID: 318)
[2/28] [SIMULATE] SIMULARIA crear evaluacion para ANA MARTINEZ (ID: 405)
...
[28/28] [SIMULATE] SIMULARIA crear evaluacion para JOSE RAMIREZ (ID: 890)

======================================================================
RESUMEN DE EJECUCIÓN
======================================================================
Total empleados procesados:    120
Con evaluación existente:      92
Sin evaluación:                28

Evaluaciones a crear (simulación): 28
======================================================================
```

**Revisa cuidadosamente** la lista de empleados sin evaluación. Si todo se ve correcto, procede al siguiente paso.

### 3. Crear evaluaciones reales

Una vez confirmado que la lista es correcta, ejecuta sin `--dry-run`:

```bash
python crear_evaluaciones_masivas.py --periodo-id 7
```

**Salida esperada:**
```
======================================================================
PROCESO DE CREACIÓN MASIVA DE EVALUACIONES
======================================================================
[OK] Periodo encontrado: Evaluación 2025 - Primer Semestre
[OK] Empleados activos encontrados: 120

Procesando 120 empleados para periodo 7...
----------------------------------------------------------------------
[1/120] [OK] JUAN PEREZ (ID: 100) - Ya tiene evaluacion
[2/120] [PENDING] MARIA RODRIGUEZ (ID: 318) - SIN evaluacion
...

======================================================================
CREACIÓN DE EVALUACIONES FALTANTES: 28 empleados
======================================================================
[1/28] [CREATING] Creando evaluacion para MARIA RODRIGUEZ (ID: 318)... [OK] Creada (ID: 1250)
[2/28] [CREATING] Creando evaluacion para ANA MARTINEZ (ID: 405)... [OK] Creada (ID: 1251)
...
[28/28] [CREATING] Creando evaluacion para JOSE RAMIREZ (ID: 890)... [OK] Creada (ID: 1277)

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

### 4. Verificar en la aplicación web

Una vez completado, verifica en la aplicación Angular:

1. Abre http://localhost:4200/evaluacionempleado
2. Navega a la sección de evaluaciones
3. Filtra por periodo 7
4. Verifica que los 28 empleados ahora tienen evaluaciones en estado "Borrador"

## Casos de Uso Adicionales

### Crear evaluación para un solo empleado

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318
```

### Usar API en diferente servidor/puerto

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --api-url http://localhost:7070
```

### Aumentar timeout para redes lentas

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --timeout 60
```

## Solución de Problemas

### Error: "El periodo 7 no existe"

**Causa:** El ID del periodo es incorrecto.

**Solución:** Ejecuta `python test_api.py` para ver los periodos disponibles y usa el ID correcto.

### Error: "Error al obtener empleados: Connection refused"

**Causa:** El servidor backend no está en ejecución o no estás en la VPN.

**Solución:**
1. Verifica que estás conectado a la VPN corporativa
2. Verifica que el servidor backend esté corriendo
3. Prueba manualmente: `curl http://192.168.7.222:7070/api/Empleados`

### Algunas creaciones fallan

Si ves errores como:
```
[15/28] [CREATING] Creando evaluacion para LUIS GARCIA (ID: 670)... [ERROR] FALLO
```

**Causa posible:** Problema de validación en el backend, permisos, o datos inconsistentes.

**Solución:**
1. Revisa los logs del servidor backend
2. Verifica que el empleado existe y está activo
3. Intenta crear manualmente la evaluación para ese empleado desde la UI
4. Re-ejecuta el script solo para ese empleado: `--empleado-id 670`

## Notas Importantes

⚠️ **Importante:** Las evaluaciones creadas estarán en estado **"Borrador"**. Los empleados deberán completarlas desde la aplicación web.

✅ **Seguro:** El script NO sobrescribe evaluaciones existentes. Si un empleado ya tiene evaluación para ese periodo, se omite.

🔄 **Repetible:** Puedes ejecutar el script múltiples veces de forma segura. Solo creará las que falten.

📊 **Auditable:** El script muestra un resumen completo de qué se hizo y cuántos registros se crearon.

## Mantenimiento Futuro

Para periodos futuros, simplemente ejecuta:

```bash
# Ejemplo para periodo 8
python crear_evaluaciones_masivas.py --periodo-id 8 --dry-run
python crear_evaluaciones_masivas.py --periodo-id 8
```

## Soporte

Para problemas o mejoras, contactar al equipo de Desarrollo de Sistemas.
