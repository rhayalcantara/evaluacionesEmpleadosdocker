# Documentación API - Plan Estratégico

**Fecha de creación:** 2025-12-08
**Versión:** 1.0
**Endpoint Base:** `/api/PlanExtrategicoModeles`

---

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Reglas de Negocio](#reglas-de-negocio)
6. [Códigos de Estado HTTP](#códigos-de-estado-http)

---

## Descripción General

El módulo de Plan Estratégico permite gestionar planes estratégicos con sus relaciones: años, perspectivas y aspiraciones. El sistema garantiza la integridad de datos y evita duplicados.

**Puerto del servidor:** 5197
**URL Base:** `http://localhost:5197/api/PlanExtrategicoModeles`

---

## Modelos de Datos

### PlanExtrategicoModel

Modelo principal que representa un plan estratégico completo.

```json
{
  "id": 1,
  "descripcion": "string",
  "cantidad_anos": 3,
  "planAnos": [],
  "perspectiva": [],
  "aspiraciones": []
}
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | integer | Identificador único del plan | Sí (para actualizar) |
| `descripcion` | string | Descripción del plan estratégico | Sí |
| `cantidad_anos` | integer | Cantidad de años del plan | Sí |
| `planAnos` | array | Lista de años asociados al plan | No |
| `perspectiva` | array | Lista de perspectivas del plan | No |
| `aspiraciones` | array | Lista de aspiraciones del plan | No |

### Plan_Anos

Representa un año específico dentro del plan estratégico.

```json
{
  "id": 1,
  "planExtrategicoId": 1,
  "ano": "2022"
}
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | integer | Identificador único del año (0 para nuevo) | Sí |
| `planExtrategicoId` | integer | FK al plan estratégico | Sí |
| `ano` | string | Año (formato: "YYYY") | Sí |

### Perspectiva

Representa una perspectiva del plan estratégico.

```json
{
  "id": 0,
  "planExtrategicoModelId": 1,
  "nombre": "Perspectiva Financiera",
  "peso": 25.0,
  "planExtrategicoModel": null
}
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | integer | Identificador único (0 para nuevo) | Sí |
| `planExtrategicoModelId` | integer | FK al plan estratégico | Sí |
| `nombre` | string | Nombre de la perspectiva (con N mayúscula) | Sí |
| `peso` | decimal | Peso porcentual de la perspectiva | Sí |
| `planExtrategicoModel` | object | Referencia al plan (siempre null en requests) | No |

**⚠️ IMPORTANTE:** El campo se llama `nombre` con 'n' minúscula en el JSON, pero el modelo C# usa `Nombre` con 'N' mayúscula. ASP.NET Core maneja la conversión automáticamente.

### Aspiracion

Representa una aspiración del plan estratégico.

```json
{
  "id": 0,
  "planExtrategicoId": 1,
  "planExtrategicoModelId": 1,
  "descripcion": "Aumentar rentabilidad",
  "porcientovalor": "20%",
  "valor": 20.0
}
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | integer | Identificador único (0 para nuevo) | Sí |
| `planExtrategicoId` | integer | FK al plan | Sí |
| `planExtrategicoModelId` | integer | FK al modelo del plan | Sí |
| `descripcion` | string | Descripción de la aspiración | No |
| `porcientovalor` | string | Porcentaje en formato texto | No |
| `valor` | decimal | Valor numérico | Sí |

---

## Endpoints Disponibles

### 1. Listar Todos los Planes

**GET** `/api/PlanExtrategicoModeles`

Obtiene todos los planes estratégicos.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "descripcion": "Plan 2022-2024",
      "cantidad_anos": 3
    }
  ],
  "totalRecords": 1
}
```

**Códigos de respuesta:**
- `200 OK` - Lista obtenida exitosamente
- `404 Not Found` - No hay planes en el sistema

---

### 2. Obtener Plan por ID

**GET** `/api/PlanExtrategicoModeles/{id}`

Obtiene un plan estratégico específico con todas sus relaciones (años, perspectivas, aspiraciones).

**Parámetros:**
- `id` (path) - ID del plan estratégico

**Request:**
```http
GET /api/PlanExtrategicoModeles/1
Accept: application/json
```

**Response exitoso (200):**
```json
{
  "id": 1,
  "descripcion": "20222024",
  "cantidad_anos": 3,
  "planAnos": [
    {
      "id": 1,
      "planExtrategicoId": 1,
      "ano": "2022"
    },
    {
      "id": 2,
      "planExtrategicoId": 1,
      "ano": "2023"
    },
    {
      "id": 3,
      "planExtrategicoId": 1,
      "ano": "2024"
    }
  ],
  "perspectiva": [
    {
      "id": 16,
      "planExtrategicoModelId": 1,
      "nombre": "Perspectiva Financiera",
      "peso": 25.0,
      "planExtrategicoModel": null
    }
  ],
  "aspiraciones": []
}
```

**Códigos de respuesta:**
- `200 OK` - Plan encontrado
- `404 Not Found` - Plan no existe

---

### 3. Crear Nuevo Plan

**POST** `/api/PlanExtrategicoModeles`

Crea un nuevo plan estratégico. Las relaciones (años, perspectivas, aspiraciones) deben agregarse posteriormente mediante PUT.

**Request:**
```http
POST /api/PlanExtrategicoModeles
Content-Type: application/json

{
  "id": 0,
  "descripcion": "Plan Estratégico 2025-2028",
  "cantidad_anos": 4
}
```

**Response exitoso (201):**
```json
{
  "id": 2,
  "descripcion": "Plan Estratégico 2025-2028",
  "cantidad_anos": 4,
  "planAnos": [],
  "perspectiva": [],
  "aspiraciones": []
}
```

**Códigos de respuesta:**
- `201 Created` - Plan creado exitosamente
- `400 Bad Request` - Datos inválidos

---

### 4. Actualizar Plan Completo

**PUT** `/api/PlanExtrategicoModeles/{id}`

Actualiza un plan estratégico existente con todas sus relaciones. Este endpoint maneja automáticamente:
- Creación de nuevos elementos (con `id: 0`)
- Actualización de elementos existentes (con `id > 0`)
- Eliminación de elementos no enviados

**Parámetros:**
- `id` (path) - ID del plan a actualizar

**Request:**
```http
PUT /api/PlanExtrategicoModeles/1
Content-Type: application/json

{
  "id": 1,
  "descripcion": "Plan Actualizado 2022-2024",
  "cantidad_anos": 3,
  "planAnos": [
    {
      "id": 1,
      "planExtrategicoId": 1,
      "ano": "2022"
    },
    {
      "id": 2,
      "planExtrategicoId": 1,
      "ano": "2023"
    },
    {
      "id": 0,
      "planExtrategicoId": 1,
      "ano": "2025"
    }
  ],
  "perspectiva": [
    {
      "id": 16,
      "planExtrategicoModelId": 1,
      "nombre": "Perspectiva Financiera Actualizada",
      "peso": 30.0
    },
    {
      "id": 0,
      "nombre": "Nueva Perspectiva",
      "planExtrategicoModelId": 1,
      "peso": 25.0
    }
  ],
  "aspiraciones": [
    {
      "id": 0,
      "planExtrategicoId": 1,
      "planExtrategicoModelId": 1,
      "descripcion": "Mejorar eficiencia operativa",
      "porcientovalor": "15%",
      "valor": 15.0
    }
  ]
}
```

**Response exitoso (204):**
- No devuelve contenido (No Content)

**Códigos de respuesta:**
- `204 No Content` - Actualización exitosa
- `400 Bad Request` - Error en los datos enviados
- `404 Not Found` - Plan no existe

---

### 5. Eliminar Plan

**DELETE** `/api/PlanExtrategicoModeles/{id}`

Elimina un plan estratégico y todas sus relaciones.

**Parámetros:**
- `id` (path) - ID del plan a eliminar

**Request:**
```http
DELETE /api/PlanExtrategicoModeles/1
```

**Response exitoso (204):**
- No devuelve contenido

**Códigos de respuesta:**
- `204 No Content` - Eliminación exitosa
- `404 Not Found` - Plan no existe

---

## Ejemplos de Uso

### Ejemplo 1: Crear un plan nuevo y agregar relaciones

**Paso 1:** Crear el plan
```javascript
const response = await fetch('http://localhost:5197/api/PlanExtrategicoModeles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 0,
    descripcion: "Plan 2025-2027",
    cantidad_anos: 3
  })
});
const planCreado = await response.json();
```

**Paso 2:** Actualizar con años y perspectivas
```javascript
await fetch(`http://localhost:5197/api/PlanExtrategicoModeles/${planCreado.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: planCreado.id,
    descripcion: "Plan 2025-2027",
    cantidad_anos: 3,
    planAnos: [
      { id: 0, planExtrategicoId: planCreado.id, ano: "2025" },
      { id: 0, planExtrategicoId: planCreado.id, ano: "2026" },
      { id: 0, planExtrategicoId: planCreado.id, ano: "2027" }
    ],
    perspectiva: [
      {
        id: 0,
        nombre: "Financiera",
        planExtrategicoModelId: planCreado.id,
        peso: 25.0
      },
      {
        id: 0,
        nombre: "Clientes",
        planExtrategicoModelId: planCreado.id,
        peso: 25.0
      }
    ],
    aspiraciones: []
  })
});
```

### Ejemplo 2: Actualizar perspectivas existentes

```javascript
// Primero obtener el plan actual
const response = await fetch('http://localhost:5197/api/PlanExtrategicoModeles/1');
const plan = await response.json();

// Modificar una perspectiva existente y agregar una nueva
plan.perspectiva[0].peso = 30.0; // Actualizar existente
plan.perspectiva.push({
  id: 0,
  nombre: "Procesos Internos",
  planExtrategicoModelId: plan.id,
  peso: 20.0
}); // Agregar nueva

// Enviar actualización
await fetch(`http://localhost:5197/api/PlanExtrategicoModeles/${plan.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(plan)
});
```

### Ejemplo 3: Eliminar una perspectiva

Para eliminar una perspectiva, simplemente no la incluyas en el array al hacer PUT:

```javascript
const response = await fetch('http://localhost:5197/api/PlanExtrategicoModeles/1');
const plan = await response.json();

// Filtrar perspectiva a eliminar (ejemplo: eliminar id 16)
plan.perspectiva = plan.perspectiva.filter(p => p.id !== 16);

// Enviar actualización
await fetch(`http://localhost:5197/api/PlanExtrategicoModeles/${plan.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(plan)
});
```

---

## Reglas de Negocio

### 1. Gestión de IDs

- **`id = 0`** → El sistema creará un nuevo registro
- **`id > 0`** → El sistema actualizará el registro existente
- **Registro no enviado** → El sistema eliminará el registro de la base de datos

### 2. Validación de Años (planAnos)

- No se permiten años duplicados para el mismo plan
- Si envías un año con `id: 0` pero ya existe con el mismo valor, se ignora
- Ejemplo: Si el plan tiene el año "2022" con id=1, y envías otro "2022" con id=0, no se duplicará

### 3. Foreign Keys Automáticas

Al crear nuevos registros (`id: 0`), el sistema asigna automáticamente:
- `planAnos`: Se asigna `PlanExtrategicoId` del plan padre
- `perspectiva`: Se asigna `PlanExtrategicoModelId` del plan padre
- `aspiraciones`: Se asignan ambos `PlanExtrategicoId` y `PlanExtrategicoModelId`

**No es necesario enviar estos campos para registros nuevos**, pero si los envías, serán sobrescritos por el sistema.

### 4. Actualización de Relaciones

El endpoint PUT implementa el patrón **"Replace Collection"**:
1. Elimina registros no enviados
2. Actualiza registros existentes enviados
3. Crea registros nuevos (id: 0)

**Importante:** Si no envías un array (ej: omites `perspectiva`), ese array se tratará como vacío y se eliminarán todos los registros relacionados.

### 5. Propiedades de Solo Lectura

- `PlanExtrategicoModel` en Perspectiva → Siempre debe ser `null` en requests
- Este campo es para navegación de EF Core, no para envío de datos

---

## Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 OK | Éxito | GET devuelve datos |
| 201 Created | Creado | POST crea nuevo plan |
| 204 No Content | Éxito sin contenido | PUT/DELETE exitosos |
| 400 Bad Request | Solicitud inválida | Datos incorrectos, validación falla |
| 404 Not Found | No encontrado | Plan no existe o DbSet es null |
| 500 Internal Server Error | Error del servidor | Error no controlado |

---

## Manejo de Errores

### Error 400 - Bad Request

Cuando ocurre un error de validación o actualización:

```json
"Error al actualizar el plan estratégico: {mensaje de error}\nStackTrace: {stack}\nInnerException: {detalles}"
```

**Causas comunes:**
- ID en URL diferente al ID en body
- Datos con formato incorrecto
- Violación de constraints de base de datos

### Error 404 - Not Found

```json
"No se encontró el plan estratégico con ID {id}"
```

**Causas:**
- Plan no existe
- Plan fue eliminado por otro usuario

---

## Consideraciones para el Frontend

### 1. Manejo de Perspectivas con Nombre

El campo se llama `nombre` (minúscula) en JSON, aunque en C# es `Nombre` (mayúscula). ASP.NET Core maneja esto automáticamente.

**Correcto:**
```json
{
  "nombre": "Perspectiva Financiera",
  "peso": 25.0
}
```

**Incorrecto:**
```json
{
  "Nombre": "Perspectiva Financiera",  // ❌ No funcionará
  "peso": 25.0
}
```

### 2. Flujo de Actualización Recomendado

```javascript
// 1. Obtener plan actual
const plan = await getPlan(id);

// 2. Modificar en memoria
plan.descripcion = "Nuevo nombre";
plan.perspectiva.push(nuevaPerspectiva);

// 3. Enviar todo el objeto actualizado
await updatePlan(id, plan);

// 4. Refrescar desde servidor
const planActualizado = await getPlan(id);
```

### 3. Validación del Lado del Cliente

Antes de enviar un PUT, validar:
- ✅ `id` en URL coincide con `id` en body
- ✅ Todos los objetos tienen `id` (0 para nuevos, >0 para existentes)
- ✅ Los FKs están correctos
- ✅ Arrays no son `undefined` (usar `[]` si están vacíos)

### 4. Optimistic Locking

El sistema no implementa optimistic locking actualmente. Si dos usuarios actualizan simultáneamente:
- Gana el último que envía el PUT
- El primero puede perder cambios

**Recomendación:** Implementar en frontend:
- Polling para detectar cambios
- Mostrar advertencia si datos cambiaron
- Opción de "refrescar" antes de guardar

### 5. Manejo de Concurrencia

Si ocurre un `DbUpdateConcurrencyException`:
```json
"Error de concurrencia: {mensaje}"
```

**Solución:** Refrescar datos y reintentar la operación.

---

## Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-08 | 1.0 | Versión inicial - Implementación completa de CRUD con relaciones |

---

## Notas Técnicas

### Tecnologías Utilizadas
- **Framework:** ASP.NET Core 7.0
- **ORM:** Entity Framework Core
- **Base de Datos:** SQL Server
- **Puerto:** 5197

### Características Implementadas
- ✅ Eager loading con `.Include()` para relaciones
- ✅ Prevención de duplicados
- ✅ Actualización manual de propiedades para evitar tracking issues
- ✅ Manejo detallado de errores con stack traces
- ✅ Soporte completo para operaciones CRUD en relaciones

### Limitaciones Conocidas
- No hay paginación en GET all
- No hay filtrado en GET all
- No hay versionado de documentos
- No hay auditoría de cambios

---

## Contacto y Soporte

Para preguntas o problemas con esta API, contactar al equipo de desarrollo.

**Documento generado para auditoría - 2025-12-08**