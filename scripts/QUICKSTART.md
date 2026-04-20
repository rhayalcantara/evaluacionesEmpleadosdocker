# Quick Start - Crear 28 Evaluaciones Faltantes

Guía rápida para resolver el problema de los 28 empleados sin evaluación en el periodo 7.

## Pasos Rápidos (5 minutos)

### 1. Verificar conexión al API

```bash
cd C:\Proyectos\evaluacionesEmpleadosdocker\scripts
python test_api.py
```

**¿Funciona?** ✅ Continúa al paso 2.
**¿Da error?** ❌ Verifica VPN y servidor backend.

### 2. Ver qué se va a crear (simulación)

```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --dry-run
```

Revisa la lista de empleados sin evaluación. Debe mostrar aproximadamente 28 empleados.

### 3. Crear las evaluaciones

```bash
python crear_evaluaciones_masivas.py --periodo-id 7
```

¡Listo! Las 28 evaluaciones están creadas en estado "Borrador".

## Resultado Esperado

```
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

## Verificar en la Aplicación

1. Abre http://localhost:4200/evaluacionempleado
2. Ve a la sección de evaluaciones
3. Filtra por periodo 7
4. Confirma que los 28 empleados ahora tienen evaluaciones

## Casos Especiales

**Crear solo para un empleado específico:**
```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --empleado-id 318
```

**Usar diferente servidor:**
```bash
python crear_evaluaciones_masivas.py --periodo-id 7 --api-url http://localhost:7070
```

## Ayuda

Para más detalles, ver:
- `README.md` - Documentación completa del script
- `INSTRUCCIONES.md` - Guía paso a paso detallada
