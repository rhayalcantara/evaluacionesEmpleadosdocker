# Plan de Implementación: Historial de Evaluaciones

**Fecha Inicio:** 24/11/2025
**Estado:** 🟡 EN PROGRESO (30% completado)
**Prioridad:** 🟡 MEDIA
**Estimación Total:** 1-2 semanas

---

## Resumen Ejecutivo

Implementación de un módulo completo de historial de evaluaciones que permite a empleados, supervisores y administradores visualizar el historial de evaluaciones, comparar resultados, ver tendencias y exportar datos.

---

## Progreso Actual

### ✅ Completado (30%)

#### 1. Modelos e Interfaces TypeScript
**Archivo:** `src/app/Models/HistorialEvaluacion/IHistorialEvaluacion.ts`

**Interfaces creadas:**
- `IHistorialEvaluacionResumen` - Resumen de evaluación para lista
- `IHistorialEvaluacionFiltros` - Filtros de búsqueda
- `IComparacionEvaluaciones` - Comparación entre dos evaluaciones
- `IEstadisticasHistorial` - Estadísticas del historial
- `IEvolucionEvaluacion` - Datos para gráficos

**Características:**
- ✅ Tipos fuertemente tipados
- ✅ Documentación completa
- ✅ Optimizado para visualización
- ✅ Preparado para exportación

#### 2. Controlador HistorialEvaluacion
**Archivo:** `src/app/Controllers/HistorialEvaluacion.ts`

**Métodos implementados:**
1. `getHistorialPorEmpleado(empleadoSecuencial)` - Historial de un empleado
2. `getHistorialSubordinados(supervisorSecuencial)` - Historial de subordinados
3. `getHistorialConFiltros(filtros)` - Búsqueda filtrada
4. `compararEvaluaciones(id1, id2)` - Comparación de evaluaciones
5. `getEstadisticasEmpleado(empleadoSecuencial)` - Estadísticas
6. `getDatosEvolucion(empleadoSecuencial)` - Datos para gráficos
7. `exportarHistorialAExcel(historial)` - Preparación para Excel

**Características:**
- ✅ Injectable service
- ✅ Logging integrado con LoggerService
- ✅ Uso de Observables y RxJS
- ✅ Manejo de errores
- ✅ Métodos privados de mapeo
- ✅ Soporte para filtros múltiples

---

## 📋 Pendiente (70%)

### Tarea 3: Crear Componente Angular ⏳
**Archivo:** `src/app/Views/Components/Pages/historial-evaluaciones/historial-evaluaciones.component.ts`

**Subtareas:**
1. Generar componente con Angular CLI:
   ```bash
   ng generate component Views/Components/Pages/historial-evaluaciones
   ```

2. Implementar lógica del componente:
   - Inyectar servicios necesarios
   - Detectar rol del usuario actual
   - Cargar historial según rol
   - Implementar paginación
   - Manejar estados de carga y error

3. Agregar funcionalidades:
   - Filtrado por período, estado, fecha
   - Búsqueda por nombre/identificación
   - Selección para comparación
   - Vista de detalles
   - Modal de estadísticas

**Código base sugerido:**
```typescript
import { Component, OnInit } from '@angular/core';
import { HistorialEvaluacion } from '../../../../Controllers/HistorialEvaluacion';
import { SegurityService } from '../../../../Services/segurity.service';
import { IHistorialEvaluacionResumen, IHistorialEvaluacionFiltros } from '../../../../Models/HistorialEvaluacion/IHistorialEvaluacion';

@Component({
  selector: 'app-historial-evaluaciones',
  templateUrl: './historial-evaluaciones.component.html',
  styleUrls: ['./historial-evaluaciones.component.css']
})
export class HistorialEvaluacionesComponent implements OnInit {
  historial: IHistorialEvaluacionResumen[] = [];
  filtros: IHistorialEvaluacionFiltros = {};
  loading: boolean = false;
  rolUsuario: string = '';

  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  constructor(
    private historialController: HistorialEvaluacion,
    private segurityService: SegurityService
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    // Implementar según rol
  }

  filtrarHistorial(): void {
    // Aplicar filtros
  }

  exportarExcel(): void {
    // Exportar a Excel
  }

  compararEvaluaciones(id1: number, id2: number): void {
    // Mostrar comparación
  }
}
```

---

### Tarea 4: Crear Template HTML ⏳
**Archivo:** `src/app/Views/Components/Pages/historial-evaluaciones/historial-evaluaciones.component.html`

**Secciones requeridas:**

1. **Header con filtros:**
   ```html
   <div class="filtros-container">
     <select [(ngModel)]="filtros.periodoId">
       <option value="">Todos los períodos</option>
       <!-- Cargar períodos dinámicamente -->
     </select>

     <select [(ngModel)]="filtros.estadoEvaluacion">
       <option value="">Todos los estados</option>
       <option value="Completada">Completada</option>
       <option value="Pendiente">Pendiente</option>
     </select>

     <input type="date" [(ngModel)]="filtros.fechaDesde" placeholder="Desde">
     <input type="date" [(ngModel)]="filtros.fechaHasta" placeholder="Hasta">

     <button (click)="filtrarHistorial()">Filtrar</button>
     <button (click)="exportarExcel()">Exportar a Excel</button>
   </div>
   ```

2. **Tabla de resultados:**
   ```html
   <table class="historial-table">
     <thead>
       <tr>
         <th>Período</th>
         <th>Empleado</th>
         <th>Fecha</th>
         <th>Estado</th>
         <th>Total</th>
         <th>Desempeño</th>
         <th>Competencias</th>
         <th>Acciones</th>
       </tr>
     </thead>
     <tbody>
       <tr *ngFor="let item of historial | paginate: { currentPage: currentPage, itemsPerPage: pageSize }">
         <td>{{ item.periodoNombre }}</td>
         <td>{{ item.empleadoNombre }}</td>
         <td>{{ item.fechaRespuesta | date }}</td>
         <td>
           <span [class]="'badge ' + getEstadoClass(item.estadoEvaluacion)">
             {{ item.estadoEvaluacion }}
           </span>
         </td>
         <td>{{ item.totalCalculo | number:'1.2-2' }}</td>
         <td>{{ item.puntuacionDesempenoColaborador | number:'1.2-2' }}</td>
         <td>{{ item.puntuacionCompetenciaColaborador | number:'1.2-2' }}</td>
         <td>
           <button (click)="verDetalle(item.evaluacionId)">Ver</button>
           <button (click)="seleccionarParaComparar(item.evaluacionId)">Comparar</button>
         </td>
       </tr>
     </tbody>
   </table>
   ```

3. **Paginación:**
   ```html
   <pagination-controls (pageChange)="currentPage = $event"></pagination-controls>
   ```

4. **Panel de estadísticas (opcional):**
   ```html
   <div class="estadisticas-panel" *ngIf="mostrarEstadisticas">
     <h3>Estadísticas</h3>
     <!-- Gráficos y métricas -->
   </div>
   ```

---

### Tarea 5: Crear Estilos CSS ⏳
**Archivo:** `src/app/Views/Components/Pages/historial-evaluaciones/historial-evaluaciones.component.css`

**Estilos requeridos:**
```css
.filtros-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.historial-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.historial-table th {
  background: #2c3e50;
  color: white;
  padding: 12px;
  text-align: left;
}

.historial-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.historial-table tr:hover {
  background: #f9f9f9;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.badge.completada {
  background: #27ae60;
  color: white;
}

.badge.pendiente {
  background: #f39c12;
  color: white;
}

.badge.en-proceso {
  background: #3498db;
  color: white;
}

.estadisticas-panel {
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .filtros-container {
    flex-direction: column;
  }

  .historial-table {
    font-size: 12px;
  }
}
```

---

### Tarea 6: Agregar Rutas y Navegación ⏳

**1. Agregar ruta en routing module:**
```typescript
// app-routing.module.ts
{
  path: 'historial-evaluaciones',
  component: HistorialEvaluacionesComponent,
  canActivate: [AuthGuard] // Si existe guard de autenticación
}
```

**2. Agregar opción en menú de navegación:**
```html
<!-- navmenu.component.html -->
<li *ngIf="tienePermisoHistorial()">
  <a routerLink="/historial-evaluaciones" routerLinkActive="active">
    <i class="fas fa-history"></i>
    Historial de Evaluaciones
  </a>
</li>
```

**3. Lógica de permisos:**
```typescript
// navmenu.component.ts
tienePermisoHistorial(): boolean {
  const rol = localStorage.getItem('rol');
  return ['Admin', 'Supervisor', 'Empleado'].includes(rol || '');
}
```

---

### Tarea 7: Integración con ExcelService ⏳

**Objetivo:** Exportar historial a archivo Excel

**Pasos:**
1. Verificar si existe servicio de Excel en el proyecto
2. Si no existe, crear usando librería `xlsx`:
   ```bash
   npm install xlsx @types/xlsx
   ```

3. Implementar método de exportación:
```typescript
exportarExcel(): void {
  const datosExcel = this.historialController.exportarHistorialAExcel(this.historial);

  // Usar ExcelService o directamente xlsx
  const worksheet = XLSX.utils.json_to_sheet(datosExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');

  const nombreArchivo = `Historial_Evaluaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nombreArchivo);

  this.datos.showMessage('Historial exportado exitosamente', 'Exportación', 'success');
}
```

---

### Tarea 8: Testing y Validación ⏳

**Tests Manuales Requeridos:**
1. **Como Admin:**
   - [ ] Ver historial de todos los empleados
   - [ ] Filtrar por período, estado, fecha
   - [ ] Comparar dos evaluaciones
   - [ ] Exportar a Excel
   - [ ] Ver estadísticas

2. **Como Supervisor:**
   - [ ] Ver historial de subordinados
   - [ ] No ver historial de otros equipos
   - [ ] Todas las funciones de filtrado y exportación

3. **Como Empleado:**
   - [ ] Ver solo su propio historial
   - [ ] No acceder a historial de otros
   - [ ] Exportar su historial
   - [ ] Ver su evolución

**Tests de Performance:**
- [ ] Cargar historial con 100+ evaluaciones
- [ ] Filtrado rápido (<500ms)
- [ ] Exportación de grandes volúmenes
- [ ] Paginación fluida

**Tests de UI/UX:**
- [ ] Responsive en móvil y tablet
- [ ] Loading states
- [ ] Mensajes de error claros
- [ ] Estados vacíos (sin historial)

---

## Funcionalidades Avanzadas (Opcional - Fase 2)

### 1. Gráficos de Evolución
**Librería sugerida:** Chart.js o ngx-charts
```typescript
mostrarGraficoEvolucion(empleadoSecuencial: number): void {
  this.historialController.getDatosEvolucion(empleadoSecuencial)
    .subscribe(datos => {
      // Renderizar gráfico de líneas
      this.chartData = {
        labels: datos.map(d => d.periodo),
        datasets: [
          {
            label: 'Total',
            data: datos.map(d => d.totalCalculo)
          },
          {
            label: 'Desempeño',
            data: datos.map(d => d.desempeno)
          },
          {
            label: 'Competencias',
            data: datos.map(d => d.competencias)
          }
        ]
      };
    });
}
```

### 2. Comparación Visual
Modal o panel lateral que muestre:
- Diferencia porcentual entre evaluaciones
- Gráfico de radar para competencias
- Indicadores de mejora/decline
- Comentarios y observaciones

### 3. Dashboard de Estadísticas
- Promedio general del equipo
- Empleados top performers
- Tendencias por departamento
- Alertas de declines significativos

### 4. Filtros Avanzados
- Por rango de puntuación
- Por departamento
- Por supervisor
- Búsqueda full-text
- Guardado de filtros favoritos

---

## Dependencias

### Servicios Requeridos:
- ✅ `DatosServiceService` - Ya existe
- ✅ `LoggerService` - Ya existe
- ✅ `Evaluacion` controller - Ya existe
- ✅ `Periodos` controller - Ya existe
- ✅ `Empleados` controller - Ya existe
- ⚠️ `ExcelService` - Verificar si existe o crear

### Librerías Externas:
- ✅ RxJS - Ya incluida en Angular
- ✅ SweetAlert2 - Ya incluida
- ⚠️ xlsx - Instalar si no existe
- ⚠️ ngx-pagination - Instalar si no existe
- ⚠️ Chart.js (opcional) - Para gráficos

---

## Estructura de Archivos Final

```
src/app/
├── Models/
│   └── HistorialEvaluacion/
│       └── IHistorialEvaluacion.ts ✅
├── Controllers/
│   └── HistorialEvaluacion.ts ✅
└── Views/
    └── Components/
        └── Pages/
            └── historial-evaluaciones/
                ├── historial-evaluaciones.component.ts ⏳
                ├── historial-evaluaciones.component.html ⏳
                ├── historial-evaluaciones.component.css ⏳
                └── historial-evaluaciones.component.spec.ts ⏳
```

---

## Checklist de Implementación

### Backend (Si es necesario)
- [ ] Endpoint `/api/Evaluacions` ya existe y funciona
- [ ] Endpoint devuelve datos completos (empleado, período)
- [ ] Soporte para paginación
- [ ] Soporte para filtros

### Frontend
- [x] Interfaces TypeScript creadas
- [x] Controlador HistorialEvaluacion creado
- [ ] Componente Angular generado
- [ ] Template HTML implementado
- [ ] Estilos CSS aplicados
- [ ] Rutas configuradas
- [ ] Menú de navegación actualizado
- [ ] Integración con ExcelService
- [ ] Guards de autenticación por rol
- [ ] Testing manual completo

### Documentación
- [x] Plan de implementación creado
- [ ] Comentarios en código
- [ ] README actualizado (si aplica)
- [ ] Manual de usuario (opcional)

---

## Estimación de Tiempo por Tarea

| Tarea | Tiempo Estimado | Estado |
|-------|-----------------|--------|
| 1. Interfaces TypeScript | 2 horas | ✅ Completado |
| 2. Controlador | 4 horas | ✅ Completado |
| 3. Componente Angular | 3 horas | ⏳ Pendiente |
| 4. Template HTML | 3 horas | ⏳ Pendiente |
| 5. Estilos CSS | 2 horas | ⏳ Pendiente |
| 6. Rutas y navegación | 1 hora | ⏳ Pendiente |
| 7. Integración Excel | 2 horas | ⏳ Pendiente |
| 8. Testing | 4 horas | ⏳ Pendiente |
| **TOTAL** | **21 horas (~3 días)** | **30%** |

---

## Próximos Pasos Inmediatos

1. **Generar componente Angular:**
   ```bash
   cd src/app/Views/Components/Pages
   ng generate component historial-evaluaciones
   ```

2. **Implementar lógica básica del componente**
3. **Crear template HTML mínimo viable**
4. **Probar carga de historial**
5. **Iterar agregando funcionalidades**

---

## Notas Técnicas

### Consideraciones de Performance:
- Usar paginación para listas grandes
- Lazy loading de detalles
- Cache de períodos y empleados
- Debounce en filtros de búsqueda

### Consideraciones de Seguridad:
- Validar rol en backend
- No exponer datos de otros empleados
- Sanitizar inputs de filtros
- Usar LoggerService (sin datos sensibles)

### Consideraciones de UX:
- Loading spinners en todas las operaciones
- Mensajes claros de error
- Estados vacíos informativos
- Tooltips explicativos
- Confirmaciones antes de acciones importantes

---

**Última actualización:** 24/11/2025
**Responsable:** Equipo de Desarrollo
**Revisión:** Pendiente

