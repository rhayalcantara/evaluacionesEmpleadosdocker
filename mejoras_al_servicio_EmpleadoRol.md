# Mejoras al Servicio EmpleadosRoles

## Problema
Se necesita insertar valores explícitos en la columna de identidad (IDENTITY) de la tabla `EmpleadosRoles` cuando `IDENTITY_INSERT` está en `OFF`. Esto impide realizar operaciones de carga o sincronización que requieran asignar IDs específicos.

## Solución Propuesta
Implementar paginación, búsqueda y control de tamaño de página en el servicio frontend para mejorar la experiencia del usuario al manejar grandes volúmenes de datos, evitando cargas masivas y optimizando rendimiento. Además, se prepara el sistema para soportar operaciones que requieran manipulación de identidades (como `IDENTITY_INSERT ON/OFF`) mediante una arquitectura más robusta.

---

## 1. Solución Técnica: Paginación y Búsqueda en el Frontend

### 1.1 Modificación del Servicio (`empleados-roles.service.ts`)

#### Agregar parámetros de paginación a las llamadas HTTP:

```ts
import { HttpParams } from '@angular/common/http';

// ...

Gets(page: number = 1, size: number = this.pageSize, search: string = ''): Observable<IEmpleadoRol[]> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('search', search);

  return this.http.get<IEmpleadoRol[]>(`${this.rutaapi}`, { params });
}
```

#### Método para cargar página con manejo de errores:

```ts
loadPage(page: number = this.currentPage, size: number = this.pageSize, search: string = this.searchTerm): Promise<void> {
  return new Promise((resolve, reject) => {
    this.Gets(page, size, search).subscribe({
      next: (data: IEmpleadoRol[]) => {
        this.arraymodel = data;
        this.currentPage = page;
        this.pageSize = size;
        this.searchTerm = search;
        // Asumiendo que la API devuelve totalRecords
        this.totalPages = Math.ceil(this.totalRecords / size);
        resolve();
      },
      error: (err) => {
        this.datos.showMessage('Error al cargar registros', 'error');
        reject(err);
      }
    });
  });
}
```

#### Métodos de navegación:

```ts
nextPage(): Promise<void> {
  if (this.currentPage < this.totalPages) {
    return this.loadPage(this.currentPage + 1);
  }
  return Promise.resolve();
}

previousPage(): Promise<void> {
  if (this.currentPage > 1) {
    return this.loadPage(this.currentPage - 1);
  }
  return Promise.resolve();
}

changePageSize(size: number): Promise<void> {
  this.pageSize = size;
  return this.loadPage(1, size); // Reiniciar a página 1 al cambiar tamaño
}
```

#### Actualizar `ngOnInit()`:

```ts
ngOnInit(): void {
  this.loadPage();
}
```

### 1.2 Requisitos de la API Backend

La API debe soportar los siguientes parámetros en `GET /api/EmpleadosRoles`:

- `page`: Número de página (default: 1)
- `size`: Cantidad de registros por página (default: 10)
- `search`: Término de búsqueda (en nombre, cargo, etc.)

**Respuesta esperada:**
```json
{
  "data": [...],
  "totalRecords": 45,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

> ⚠️ Si la API no soporta esto, se debe implementar una capa de adaptación o usar paginación en cliente solo para <1000 registros.

---

## 2. Integración con `IDENTITY_INSERT`

Aunque la paginación no resuelve directamente el problema de `IDENTITY_INSERT`, facilita su manejo al:

- Permitir operaciones por lotes (insertar/paginar por bloques)
- Evitar cargas masivas que bloqueen la base de datos
- Habilitar un flujo donde se puedan insertar registros con IDs explícitos en una página específica sin afectar la interfaz

### Recomendación para manejar `IDENTITY_INSERT`

En el backend (SQL Server), cuando sea necesario insertar IDs explícitos:

```sql
SET IDENTITY_INSERT EmpleadosRoles ON;

INSERT INTO EmpleadosRoles (Id, EmpleadoId, RolId, FechaAsignacion)
VALUES (1001, 50, 3, '2026-03-06');

SET IDENTITY_INSERT EmpleadosRoles OFF;
```

> ✅ **Importante**: Solo permitir `IDENTITY_INSERT ON` en operaciones administrativas controladas y cerrar inmediatamente después.

---

## 3. Cambios en la Vista (Componente HTML)

### Control de paginación:

```html
<div class="pagination-controls">
  <button (click)="previousPage()" [disabled]="currentPage <= 1">Anterior</button>
  <span>Página {{ currentPage }} de {{ totalPages }}</span>
  <button (click)="nextPage()" [disabled]="currentPage >= totalPages">Siguiente</button>

  <select (change)="changePageSize($event.target.value)">
    <option value="5">5 por página</option>
    <option value="10" selected>10 por página</option>
    <option value="25">25 por página</option>
    <option value="50">50 por página</option>
  </select>

  <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar..." (keyup.enter)="loadPage(1, pageSize, searchTerm)" />
  <button (click)="loadPage(1, pageSize, searchTerm)">Buscar</button>
</div>
```

### Nota sobre `[(ngModel)]`

Asegúrate de importar `FormsModule` en tu módulo:

```ts
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [FormsModule],
})
export class YourModule {}
```

---

## 4. Mejoras Adicionales Recomendadas

| Área | Recomendación |
|------|---------------|
| **Seguridad** | Validar y sanitizar `search` en backend para evitar inyecciones SQL |
| **Rendimiento** | Implementar caché de resultados en el servicio (localStorage o RxJS cache) |
| **UI/UX** | Mostrar indicador de carga mientras se carga la página |
| **Pruebas** | Escribir pruebas unitarias para `loadPage()`, `nextPage()` y `changePageSize()` |
| **Logs** | Registrar operaciones de `IDENTITY_INSERT` en log del servidor para auditoría |

---

## 5. Conclusión

La implementación de paginación y búsqueda mejora significativamente la experiencia del usuario y prepara el sistema para operaciones avanzadas como:

- Insertar registros con IDs explícitos (`IDENTITY_INSERT ON`)
- Sincronización por lotes
- Manejo eficiente de grandes volúmenes de datos

> ✅ **Acción recomendada**: Implementar primero la paginación en frontend y luego, si es necesario, desarrollar un endpoint administrativo para activar/desactivar `IDENTITY_INSERT` con permisos restringidos.

---

**Fecha de última actualización:** 6 de marzo de 2026
**Autor:** Asistente de Codificación (Pi)