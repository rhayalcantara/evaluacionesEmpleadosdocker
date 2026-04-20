# Descripción del proyecto

El código que ves corresponde a una **aplicación web de gestión de evaluaciones y desempeño de empleados** construida con **Angular** (versión 15+).

## Principales características

| Área | Qué hace |
|------|----------|
| **Gestión de objetivos y KPIs** | Componentes para crear, ver y actualizar objetivos estratégicos, metas, indicadores clave de rendimiento (KPIs) y la relación entre ellos. |
| **Evaluaciones de desempeño** | Sección completa que permite registrar evaluaciones periódicas: competencias, resultados, comparaciones, evolución y valoraciones. Incluye modales para detalle y comparación. |
| **Roles y categorías** | Administración de roles corporativos, categorías de puestos y la asignación de empleados a cada puesto. |
| **Plan estratégico y perspectiva** | Herramientas para definir planes estratégicos y ver los objetivos desde distintas perspectivas (por proyecto, por periodo, etc.). |
| **Supervisor‑goals** | Sección dedicada a las metas que establecen los supervisores sobre sus equipos. |
| **Tablas y reportes** | Componentes reutilizables (`tables.component`) para mostrar listas de datos; también hay un reporte de cursos y visor PDF. |
| **Componentes compartidos** | Diálogos de confirmación, módulos comunes, estilos globales. |
| **Vista de empleado** | Tarjetas visuales (card‑empleado, card‑empleado2) y vistas de equipo para mostrar la información del empleado. |

## Estructura de carpetas
```
src/
 ├─ app/
 │   └─ Views/Components/
 │       ├─ Pages/          # Cada página principal
 │       ├─ shared/         # Componentes comunes (dialogos, módulos)
 │       ├─ tables/         # Tabla genérica
 │       ├─ tareas/        # CRUD de tareas
 │       └─ ViewEmpleado/  # Vistas específicas del empleado
```

## Tecnologías
* **Angular** – framework front‑end MVC.
* **SCSS/CSS** – estilos.
* **TypeScript** – tipado y lógica.
* **Material Design** (probablemente) – UI, aunque no está explícito en los archivos mostrados.

En resumen, el proyecto es una plataforma interna para la gestión integral de recursos humanos: desde la planificación estratégica hasta la evaluación diaria del desempeño. Si necesitas profundizar en alguna carpeta o función concreta, dime y te ayudo a revisarla.