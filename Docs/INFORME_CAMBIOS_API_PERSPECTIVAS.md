# Informe de Cambios - API Perspectivas

## Resumen
Se ha modificado el endpoint `POST /api/Perspectivas/grabararray` para corregir un error que causaba que las perspectivas cambiaran incorrectamente su `planExtrategicoModelId` durante actualizaciones.

## Cambio en el Endpoint

### Endpoint Afectado
```
POST /api/Perspectivas/grabararray
```

### Cambio en la Firma del Método

**ANTES:**
```csharp
[HttpPost("grabararray")]
public async Task<List<Perspectiva>> GrabarArray(List<Perspectiva> perspectivas)
```

**AHORA:**
```csharp
[HttpPost("grabararray")]
public async Task<List<Perspectiva>> GrabarArray(int planExtrategicoModelId, List<Perspectiva> perspectivas)
```

### Nuevo Parámetro Requerido
- **Nombre**: `planExtrategicoModelId`
- **Tipo**: `int`
- **Descripción**: ID del Plan Estratégico al que pertenecen todas las perspectivas
- **Obligatorio**: Sí

## Cambios Requeridos en el Frontend

### Opción 1: Enviar como Body Object (Recomendado)

**Estructura del Request:**
```javascript
{
  "planExtrategicoModelId": 123,
  "perspectivas": [
    {
      "id": 0,  // 0 para nuevos registros
      "nombre": "Perspectiva Financiera",
      "peso": 25.5,
      "planExtrategicoModelId": 0  // Este valor será sobreescrito por el backend
    },
    {
      "id": 45,  // ID existente para actualización
      "nombre": "Perspectiva de Clientes",
      "peso": 30.0,
      "planExtrategicoModelId": 123
    }
  ]
}
```

**Ejemplo de Implementación:**

```javascript
// JavaScript/Fetch
async function guardarPerspectivas(planId, perspectivas) {
  const response = await fetch('/api/Perspectivas/grabararray', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      planExtrategicoModelId: planId,
      perspectivas: perspectivas
    })
  });

  if (!response.ok) {
    throw new Error('Error al guardar perspectivas');
  }

  return await response.json();
}

// Uso
const resultado = await guardarPerspectivas(123, miArrayDePerspectivas);
```

```javascript
// Axios
async function guardarPerspectivas(planId, perspectivas) {
  const response = await axios.post('/api/Perspectivas/grabararray', {
    planExtrategicoModelId: planId,
    perspectivas: perspectivas
  });

  return response.data;
}
```

```typescript
// TypeScript/Angular
guardarPerspectivas(planId: number, perspectivas: Perspectiva[]): Observable<Perspectiva[]> {
  return this.http.post<Perspectiva[]>('/api/Perspectivas/grabararray', {
    planExtrategicoModelId: planId,
    perspectivas: perspectivas
  });
}
```

### Opción 2: Enviar como Query Parameter

**URL con Query Parameter:**
```
POST /api/Perspectivas/grabararray?planExtrategicoModelId=123
```

**Ejemplo de Implementación:**

```javascript
// JavaScript/Fetch
async function guardarPerspectivas(planId, perspectivas) {
  const response = await fetch(
    `/api/Perspectivas/grabararray?planExtrategicoModelId=${planId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(perspectivas)
    }
  );

  return await response.json();
}
```

```javascript
// Axios
async function guardarPerspectivas(planId, perspectivas) {
  const response = await axios.post('/api/Perspectivas/grabararray',
    perspectivas,
    {
      params: {
        planExtrategicoModelId: planId
      }
    }
  );

  return response.data;
}
```

## Comportamiento del Backend

### Validación y Asignación Automática
El backend ahora:
1. Recibe el `planExtrategicoModelId` como parámetro separado
2. **Sobrescribe automáticamente** el `planExtrategicoModelId` de TODAS las perspectivas en el array
3. Garantiza que todas las perspectivas pertenezcan al mismo plan

### Ejemplo de Procesamiento Interno
```csharp
// El backend ejecuta esto internamente:
foreach (var perspectiva in perspectivas)
{
    perspectiva.PlanExtrategicoModelId = planExtrategicoModelId; // Sobreescribe el valor
}
```

**Importante**: No importa qué valor de `planExtrategicoModelId` vengan en las perspectivas individuales, el backend usará siempre el parámetro recibido.

## Respuesta del Endpoint

**No ha cambiado**. El endpoint sigue devolviendo:
```json
[
  {
    "id": 1,
    "nombre": "Perspectiva Financiera",
    "peso": 25.5,
    "planExtrategicoModelId": 123
  },
  {
    "id": 2,
    "nombre": "Perspectiva de Clientes",
    "peso": 30.0,
    "planExtrategicoModelId": 123
  }
]
```

## Casos de Uso

### Caso 1: Crear nuevas perspectivas
```javascript
const nuevasPerspectivas = [
  { id: 0, nombre: "Financiera", peso: 25, planExtrategicoModelId: 0 },
  { id: 0, nombre: "Clientes", peso: 25, planExtrategicoModelId: 0 }
];

await guardarPerspectivas(123, nuevasPerspectivas);
// Ambas se crearán con planExtrategicoModelId = 123
```

### Caso 2: Actualizar perspectivas existentes
```javascript
const perspectivasExistentes = [
  { id: 45, nombre: "Financiera Actualizada", peso: 30, planExtrategicoModelId: 123 },
  { id: 46, nombre: "Clientes Actualizada", peso: 20, planExtrategicoModelId: 123 }
];

await guardarPerspectivas(123, perspectivasExistentes);
// Ambas se actualizarán manteniendo planExtrategicoModelId = 123
```

### Caso 3: Mix de nuevas y existentes
```javascript
const perspectivasMixtas = [
  { id: 45, nombre: "Existente", peso: 30, planExtrategicoModelId: 123 },
  { id: 0, nombre: "Nueva", peso: 20, planExtrategicoModelId: 0 }
];

await guardarPerspectivas(123, perspectivasMixtas);
// La existente se actualiza, la nueva se crea, ambas con planExtrategicoModelId = 123
```

### Caso 4: Eliminar perspectivas (por ausencia en el array)
```javascript
// Si antes existían las perspectivas con IDs: 45, 46, 47
// Y solo envías:
const perspectivasReducidas = [
  { id: 45, nombre: "Financiera", peso: 50, planExtrategicoModelId: 123 }
];

await guardarPerspectivas(123, perspectivasReducidas);
// Se mantiene la 45
// Se eliminan automáticamente las 46 y 47
```

## Obtención del planExtrategicoModelId

El `planExtrategicoModelId` debe obtenerse del contexto actual de la aplicación. Ejemplos:

```javascript
// Desde la ruta/URL
const planId = route.params.planId;

// Desde el estado global (Redux/Vuex/NgRx)
const planId = store.state.planActual.id;

// Desde props del componente
const planId = props.planExtrategicoId;

// Desde el objeto plan cargado
const planId = planActual.id;
```

## Checklist de Implementación

- [ ] Identificar dónde se llama al endpoint `POST /api/Perspectivas/grabararray`
- [ ] Obtener el `planExtrategicoModelId` del contexto actual
- [ ] Modificar la llamada para incluir el nuevo parámetro
- [ ] Actualizar la estructura del body o agregar query parameter
- [ ] Probar casos: crear nuevas, actualizar existentes, eliminar, y mix
- [ ] Verificar que las perspectivas mantengan el `planExtrategicoModelId` correcto
- [ ] Actualizar tipos TypeScript si aplica

## Ejemplo de Tipos TypeScript (Opcional)

```typescript
// Modelo
interface Perspectiva {
  id: number;
  nombre: string;
  peso: number;
  planExtrategicoModelId: number;
}

// Request DTO (Opción 1 - Body Object)
interface GrabarPerspectivasRequest {
  planExtrategicoModelId: number;
  perspectivas: Perspectiva[];
}

// Servicio
class PerspectivasService {
  async grabarArray(planId: number, perspectivas: Perspectiva[]): Promise<Perspectiva[]> {
    const response = await fetch('/api/Perspectivas/grabararray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planExtrategicoModelId: planId,
        perspectivas: perspectivas
      })
    });

    return await response.json();
  }
}
```

## Beneficios del Cambio

1. **Seguridad**: El backend tiene control total sobre el plan al que pertenecen las perspectivas
2. **Simplicidad**: Código más limpio y fácil de mantener
3. **Prevención de errores**: Elimina la posibilidad de inconsistencias en los datos
4. **Claridad**: Queda explícito en cada llamada a qué plan pertenecen las perspectivas

## Contacto y Soporte

Si tienes dudas sobre la implementación, contacta al equipo de backend.

---
**Fecha de cambio**: 2025-12-05
**Versión API**: Actualización de endpoint
**Prioridad**: Media (requiere actualización en frontend)