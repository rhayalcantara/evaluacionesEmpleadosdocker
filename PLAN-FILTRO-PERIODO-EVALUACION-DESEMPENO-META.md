# Plan de Implementación: Filtro de Periodo en Evaluación Desempeño Meta

## Resumen
Agregar funcionalidad de filtrado por periodo en el componente `evaluacion-desempeno-meta` para permitir a los usuarios seleccionar un periodo específico (activo o inactivo) y visualizar las evaluaciones de desempeño metas correspondientes a ese periodo.

## Endpoint Backend Disponible
```
GET /api/EvaluacionDesempenoMetas/ByPeriod/{Periodo}
```
- **Parámetro**: `{Periodo}` - ID del periodo
- **Retorna**: Array de evaluaciones desempeño metas del periodo seleccionado

---

## Tareas de Implementación

### 1. Actualizar Controller: `EvaluacionDesempenoMeta.ts`

**Ubicación**: `src/app/Controllers/EvaluacionDesempenoMeta.ts`

**Cambios**:
- Agregar nuevo método para obtener evaluaciones por periodo:
  ```typescript
  public getEvaluacionesByPeriod(periodoId: number): Observable<ModelResponse> {
    return this.datos.getdatos<ModelResponse>(this.rutaapi + `/ByPeriod/${periodoId}`);
  }
  ```

- Agregar método para cargar datos filtrados por periodo:
  ```typescript
  public getDatosPorPeriodo(periodoId: number) {
    this.getEvaluacionesByPeriod(periodoId)
      .subscribe({
        next: (rep: ModelResponse) => {
          this.totalregistros = rep.count;
          this.arraymodel = [];
          this.arraymodel = rep.data;
          this.TRegistros.emit(this.totalregistros);
        },
        error: (err) => {
          console.error('Error al cargar evaluaciones por periodo:', err);
        }
      });
  }
  ```

**Justificación**: Mantener la separación de responsabilidades siguiendo el patrón Controller del proyecto.

---

### 2. Actualizar Componente TypeScript: `evaluacion-desempeno-meta.component.ts`

**Ubicación**: `src/app/Views/Components/Pages/evaluacion-desempeno-meta/evaluacion-desempeno-meta.component.ts`

**Cambios**:

#### 2.1 Importaciones
Agregar:
```typescript
import { Periodos } from 'src/app/Controllers/Periodos';
import { IPeriodo } from 'src/app/Models/Periodos/IPeriodo';
import { MatSelectModule } from '@angular/material/select';
```

Actualizar array de imports del decorador `@Component`:
```typescript
imports: [
  CommonModule,
  MatDialogModule,
  MatTableModule,
  MatPaginatorModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  FormsModule,
  MatSelectModule  // NUEVO
]
```

#### 2.2 Propiedades del Componente
Agregar:
```typescript
periodos: IPeriodo[] = [];
periodoSeleccionado: number | null = null;
```

#### 2.3 Constructor
Inyectar el controller de Periodos:
```typescript
constructor(
  private dialog: MatDialog,
  public metaService: EvaluacionDesempenoMeta,
  private datosService: DatosServiceService,
  public periodosService: Periodos  // NUEVO
) {
  // ... código existente ...
}
```

#### 2.4 ngOnInit
Agregar carga de periodos:
```typescript
ngOnInit(): void {
  this.cargarPeriodos();  // NUEVO
  this.cargarDatos();
}
```

#### 2.5 Nuevos Métodos
```typescript
/**
 * Carga todos los periodos (activos e inactivos)
 */
cargarPeriodos(): void {
  this.periodosService.getdatos();
  this.periodosService.TRegistros.subscribe(() => {
    this.periodos = this.periodosService.arraymodel;
  });
}

/**
 * Maneja el cambio de periodo seleccionado
 * @param periodoId - ID del periodo seleccionado
 */
onPeriodoChange(periodoId: number | null): void {
  this.periodoSeleccionado = periodoId;

  if (periodoId) {
    this.metaService.getDatosPorPeriodo(periodoId);
  } else {
    // Si no hay periodo seleccionado, cargar todos
    this.cargarDatos();
  }
}

/**
 * Limpia el filtro de periodo
 */
limpiarFiltroPeriodo(): void {
  this.periodoSeleccionado = null;
  this.cargarDatos();
}
```

**Justificación**: Mantener el componente limpio y delegar la lógica de negocio al controller.

---

### 3. Actualizar Template HTML: `evaluacion-desempeno-meta.component.html`

**Ubicación**: `src/app/Views/Components/Pages/evaluacion-desempeno-meta/evaluacion-desempeno-meta.component.html`

**Cambios**:

Reemplazar el contenedor de búsqueda (líneas 10-21) con:
```html
<div class="search-container">
  <!-- Filtro de Periodo -->
  <mat-form-field appearance="outline" class="filter-field">
    <mat-label>Filtrar por Periodo</mat-label>
    <mat-select [(ngModel)]="periodoSeleccionado" (selectionChange)="onPeriodoChange($event.value)">
      <mat-option [value]="null">Todos los periodos</mat-option>
      <mat-option *ngFor="let periodo of periodos" [value]="periodo.id">
        {{ periodo.descripcion }}
        <span class="periodo-status" [class.activo]="periodo.activa">
          ({{ periodo.activa ? 'Activo' : 'Inactivo' }})
        </span>
      </mat-option>
    </mat-select>
    <button mat-icon-button matSuffix *ngIf="periodoSeleccionado" (click)="limpiarFiltroPeriodo()">
      <mat-icon>close</mat-icon>
    </button>
  </mat-form-field>

  <!-- Búsqueda de Texto -->
  <mat-form-field appearance="outline" class="search-field">
    <mat-label>Buscar</mat-label>
    <input matInput [(ngModel)]="searchTerm" (keyup.enter)="buscar()" placeholder="Buscar metas...">
    <button mat-icon-button matSuffix *ngIf="searchTerm" (click)="limpiarBusqueda()">
      <mat-icon>close</mat-icon>
    </button>
    <button mat-icon-button matSuffix (click)="buscar()">
      <mat-icon>search</mat-icon>
    </button>
  </mat-form-field>
</div>
```

**Justificación**:
- El select muestra todos los periodos (activos e inactivos)
- Opción "Todos los periodos" para mostrar datos sin filtrar
- Indicador visual del estado del periodo (Activo/Inactivo)
- Botón para limpiar el filtro de periodo

---

### 4. Actualizar Estilos CSS: `evaluacion-desempeno-meta.component.css`

**Ubicación**: `src/app/Views/Components/Pages/evaluacion-desempeno-meta/evaluacion-desempeno-meta.component.css`

**Cambios**:

Agregar al archivo CSS existente:
```css
/* Contenedor de filtros y búsqueda */
.search-container {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

/* Campo de filtro de periodo */
.filter-field {
  min-width: 300px;
  flex: 1;
}

/* Campo de búsqueda */
.search-field {
  min-width: 300px;
  flex: 1;
}

/* Estado del periodo en el dropdown */
.periodo-status {
  font-size: 0.85em;
  color: #666;
  margin-left: 8px;
}

.periodo-status.activo {
  color: #4caf50;
  font-weight: 500;
}

/* Responsive - En pantallas pequeñas, los campos ocupan todo el ancho */
@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
  }

  .filter-field,
  .search-field {
    width: 100%;
    min-width: 100%;
  }
}
```

**Justificación**:
- Layout flexible que acomoda ambos filtros horizontalmente
- Responsive para pantallas pequeñas
- Indicador visual para periodos activos

---

### 5. Testing Manual

**Escenarios de Prueba**:

1. **Carga Inicial**
   - Verificar que se carguen todos los periodos en el dropdown
   - Verificar que se muestren todas las evaluaciones por defecto
   - Verificar que los periodos activos e inactivos se distingan visualmente

2. **Filtrado por Periodo**
   - Seleccionar un periodo activo → Verificar que solo se muestren evaluaciones de ese periodo
   - Seleccionar un periodo inactivo → Verificar que solo se muestren evaluaciones de ese periodo
   - Seleccionar "Todos los periodos" → Verificar que se muestren todas las evaluaciones

3. **Combinación de Filtros**
   - Aplicar filtro de periodo + búsqueda de texto → Verificar que ambos filtros funcionen en conjunto
   - Limpiar filtro de periodo → Verificar que la búsqueda de texto se mantenga

4. **Limpieza de Filtros**
   - Usar botón "X" en el select de periodo → Verificar que se limpie el filtro
   - Usar botón "X" en búsqueda → Verificar que se limpie la búsqueda

5. **Casos Edge**
   - Periodo sin evaluaciones → Verificar que se muestre tabla vacía
   - Backend no disponible → Verificar manejo de errores
   - Respuesta lenta del backend → Verificar comportamiento del UI

---

## Dependencias

### Controladores
- ✅ `Periodos.ts` - Ya existe
- ✅ `EvaluacionDesempenoMeta.ts` - Requiere actualización

### Modelos
- ✅ `IPeriodo.ts` - Ya existe
- ✅ `IEvaluacionDesempenoMeta.ts` - Ya existe

### Servicios
- ✅ `DatosServiceService` - Ya existe
- ✅ `datos-service.service.ts` - Ya existe

### Módulos Angular Material
- ✅ `MatSelectModule` - Requiere importación

---

## Consideraciones Técnicas

### 1. Manejo de Estado
- El filtro de periodo es independiente del filtro de búsqueda de texto
- Ambos filtros pueden aplicarse simultáneamente
- El estado del filtro de periodo se mantiene en la propiedad `periodoSeleccionado`

### 2. Rendimiento
- La carga de periodos es una única llamada al inicializar el componente
- Cada cambio de periodo hace una nueva llamada al backend
- No se implementa caché en esta fase inicial (puede agregarse después si es necesario)

### 3. UX/UI
- Dropdown con indicador visual de estado (Activo/Inactivo)
- Opción para ver todas las evaluaciones sin filtrar
- Botón para limpiar el filtro rápidamente
- Layout responsive

### 4. Manejo de Errores
- El controller `EvaluacionDesempenoMeta` debe manejar errores en `getDatosPorPeriodo`
- Mostrar mensaje al usuario si falla la carga

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Endpoint backend no retorna el formato esperado | Alto | Validar estructura de respuesta, agregar manejo de errores |
| Periodo sin evaluaciones confunde al usuario | Medio | Mostrar mensaje "No hay evaluaciones para este periodo" |
| Muchos periodos en el dropdown | Bajo | Considerar paginación o búsqueda en el select (futuro) |
| Cambio frecuente de periodo causa muchas llamadas | Bajo | Implementar debounce si se vuelve problema |

---

## Orden de Implementación Sugerido

1. **Actualizar Controller** (`EvaluacionDesempenoMeta.ts`)
   - Agregar método `getEvaluacionesByPeriod()`
   - Agregar método `getDatosPorPeriodo()`

2. **Actualizar Componente TypeScript** (`evaluacion-desempeno-meta.component.ts`)
   - Agregar importaciones
   - Agregar propiedades
   - Inyectar servicio de periodos
   - Agregar métodos de filtrado

3. **Actualizar Template HTML** (`evaluacion-desempeno-meta.component.html`)
   - Agregar select de periodos
   - Mantener búsqueda de texto

4. **Actualizar CSS** (`evaluacion-desempeno-meta.component.css`)
   - Agregar estilos para layout de filtros

5. **Testing Manual**
   - Probar todos los escenarios listados

---

## Estimación de Tiempo

- **Desarrollo**: 1-2 horas
- **Testing**: 30 minutos
- **Ajustes y refinamiento**: 30 minutos
- **Total**: 2-3 horas

---

## Notas Adicionales

### Mejoras Futuras (No incluidas en este plan)
- Caché de evaluaciones por periodo para mejorar rendimiento
- Búsqueda de periodos en el dropdown (si la lista crece mucho)
- Indicador de carga mientras se obtienen datos del backend
- Persistencia del filtro seleccionado en localStorage
- Exportación de evaluaciones filtradas a Excel/PDF

### Compatibilidad
- Angular 16.2.12 ✅
- TypeScript 4.9.4 ✅
- Angular Material (ya en uso) ✅
- Patrón Controller-Model-View del proyecto ✅

---

## Checklist de Implementación

- [ ] Actualizar `EvaluacionDesempenoMeta.ts` con nuevos métodos
- [ ] Actualizar imports en `evaluacion-desempeno-meta.component.ts`
- [ ] Agregar propiedades al componente TypeScript
- [ ] Inyectar `Periodos` service en constructor
- [ ] Agregar método `cargarPeriodos()`
- [ ] Agregar método `onPeriodoChange()`
- [ ] Agregar método `limpiarFiltroPeriodo()`
- [ ] Actualizar template HTML con select de periodos
- [ ] Actualizar CSS con nuevos estilos
- [ ] Testing: Carga inicial
- [ ] Testing: Filtrado por periodo
- [ ] Testing: Combinación de filtros
- [ ] Testing: Limpieza de filtros
- [ ] Testing: Casos edge
- [ ] Verificar build sin errores
- [ ] Documentar cambios en commit

---

**Fecha de Creación**: 2025-11-28
**Versión**: 1.0
**Estado**: Pendiente de Revisión
