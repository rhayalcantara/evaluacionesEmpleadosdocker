# Lista de Tareas: Mejoras al Sistema de Evaluación

Este archivo documenta todas las tareas pendientes para mejorar el sistema de evaluación del desempeño, basadas en el archivo `modificaciones.txt`.

## Fase 1: Cambios Generales y de Terminología

- [ ] **Mejoras en Autoevaluación:**
    - [ ] Limitar el registro de "perspectivas" a una lista predefinida y actualizada.
    - [ ] Impedir que el colaborador modifique su evaluación después de someterla, a menos que el supervisor la devuelva.
    - [ ] Agregar un botón "Modificar" cuando la evaluación es devuelta.
    - [ ] Agregar la columna "Calificación" en la sección de objetivos.

- [ ] **Mejoras en Evaluación del Supervisor:**
    - [ ] Mostrar los reportes directos del supervisor en un formato de lista.
    - [ ] Agregar un botón "Devolver" para que el colaborador pueda hacer cambios.

- [ ] **Mejoras en Versión Imprimible (PDF):**
    - [ ] Agregar la sección "RESULTADOS OBJETIVOS (30%)" debajo de los objetivos calificados.

## Fase 2: Cambios Particulares (Terminología y Calificaciones)

- [ ] **Sustituir en la sección de objetivos:**
    - [ ] "Medio de verificación" por "¿Cómo se Mide?".
    - [ ] "Logro" por "Resultado".
    - [ ] "%" por "% de logro" o "% de puntuación".
    - [ ] "Documentar" por "Nota o comentario".
- [ ] **Corregir las perspectivas** (Asegurar que la nueva lista se use en todo el sistema).
- [ ] **Agregar calificaciones al promedio de objetivos** (Ej: Excelente, Necesita mejorar, etc.).

## Fase 3: Implementación de Botones y Flujo de Estados

- [ ] **Botones para Autoevaluación:**
    - [ ] Añadir botón "Iniciar" (permite grabar).
    - [ ] Añadir botón "Completada" (permite editar antes de someter).
    - [ ] Añadir botón "Someter" (desactiva la edición).
    - [ ] Posicionar los botones al inicio y al final de la página.

- [ ] **Botones para Supervisor:**
    - [ ] Añadir botón "Iniciar" (permite grabar).
    - [ ] Añadir botón "Devolver autoevaluación" (debe permitir adjuntar una nota).
    - [ ] Añadir botón "Aprobar autoevaluación".
    - [ ] Añadir botón "Completada" (permite editar su propia evaluación).
    - [ ] Añadir botón "Someter".
    - [ ] Posicionar los botones al inicio y al final de la página.

- [ ] **Botón de Navegación:**
    - [ ] Para ambos roles, agregar un botón "Home-Atrás".

## Fase 4: Rediseño de Vistas y Flujo Post-Evaluación

- [ ] **Vista de Equipo del Supervisor:**
    - [ ] Eliminar los iconos existentes.
    - [ ] Mostrar colaboradores en formato de lista.
    - [ ] La lista debe incluir: **Estatus** y **Puntuación de la autoevaluación**.

- [ ] **Vista del Empleado Post-Evaluación:**
    - [ ] Al finalizar la evaluación por parte del líder, el empleado debe ver las siguientes opciones para marcar:
        - [ ] "En conocimiento"
        - [ ] "Conforme"
        - [ ] "Inconforme"
        - [ ] "De acuerdo"

## Fase 5: Verificación Final

- [ ] Realizar pruebas funcionales de todo el flujo de evaluación (colaborador y supervisor).
- [ ] Verificar que todos los cambios visuales y de texto se hayan aplicado correctamente.
- [ ] Generar un PDF para confirmar que el reporte incluye la nueva sección y los cálculos correctos.
