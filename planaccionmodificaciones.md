# Plan de Acción: Mejoras al Sistema de Evaluación del Desempeño

Este documento detalla el plan de acción para implementar las mejoras solicitadas en el archivo `modificaciones.txt`. Las tareas se agrupan en fases para una ejecución ordenada y controlada.

---

## Fase 1: Cambios de Interfaz y Terminología (Backend y Frontend)

El objetivo de esta fase es actualizar todos los textos y etiquetas en la interfaz de usuario según lo solicitado, así como preparar la base para los cambios funcionales.

1.  **Actualizar Terminología de Objetivos:**
    *   Buscar en todos los archivos del proyecto (vistas `.html` y componentes `.ts`) las siguientes cadenas y reemplazarlas:
        *   `Medio de verificación` → `¿Cómo se Mide?`
        *   `Logro` → `Resultado`
        *   `%` → `% de logro` o `% de puntuación` (se elegirá el más adecuado según el contexto).
        *   `Documentar` → `Nota o comentario`
2.  **Corregir y Limitar las Perspectivas:**
    *   Identificar el origen de datos de las "perspectivas" (probablemente en un servicio o controlador, como `Perspectiva.ts`).
    *   Actualizar la lista de perspectivas según la nueva definición.
    *   Asegurar que el campo en el formulario de autoevaluación sea un selector (dropdown) que solo permita elegir de la lista definida, en lugar de un campo de texto libre.
3.  **Agregar Campo "Calificación" a los Objetivos:**
    *   Modificar la interfaz de la sección de objetivos para añadir una columna o campo para "Calificación".
    *   Añadir en el promedio de los objetivos la descripción de la calificación (Ej: Excelente, Necesita Mejorar). Se debe definir la escala y los rangos para cada descripción.

---

## Fase 2: Rediseño del Flujo de Autoevaluación del Colaborador

Esta fase se centra en mejorar la experiencia del colaborador durante su autoevaluación, implementando un flujo de trabajo más claro y controlado.

1.  **Implementar Nuevos Botones de Acción:**
    *   Añadir los botones `Iniciar`, `Completada`, y `Someter` al principio y al final de la página de autoevaluación.
    *   Añadir el botón `Home-Atrás` para facilitar la navegación.
2.  **Definir Lógica de Estados y Acciones:**
    *   **Estado Inicial:** El formulario está deshabilitado.
    *   **Al pulsar `Iniciar`:** Se habilita el formulario para permitir el llenado y guardado parcial.
    *   **Al pulsar `Completada`:** Se guarda el progreso, pero el formulario permanece editable. Este es el estado intermedio antes del envío final.
    *   **Al pulsar `Someter`:** Se envía la evaluación al supervisor y el formulario se deshabilita por completo. El botón `Someter` y `Completada` se ocultan o desactivan.
3.  **Control de Modificaciones:**
    *   Implementar la lógica para que el colaborador no pueda realizar cambios una vez sometida la evaluación.
    *   Añadir un estado "Devuelta por Supervisor". Cuando la evaluación esté en este estado, el formulario se habilitará nuevamente y aparecerá un botón `Modificar` para que el colaborador realice los ajustes solicitados y pueda volver a someterla.

---

## Fase 3: Rediseño del Flujo de Evaluación del Supervisor

Esta fase se enfoca en optimizar la interfaz y las acciones disponibles para el supervisor.

1.  **Mejorar la Vista de Equipo:**
    *   Modificar la vista donde el supervisor selecciona a sus reportes.
    *   Eliminar los iconos actuales.
    *   Presentar los colaboradores en un formato de lista.
    *   Cada elemento de la lista debe mostrar: **Nombre del Colaborador**, **Estatus de la Evaluación** (Ej: No iniciada, En progreso, Pendiente de Aprobación), y la **Puntuación de la Autoevaluación**.
2.  **Implementar Nuevos Botones de Acción para el Supervisor:**
    *   Añadir los botones `Iniciar`, `Devolver autoevaluación`, `Aprobar autoevaluación`, `Completada` y `Someter` al principio y al final de la página de evaluación.
3.  **Definir Lógica de Estados y Acciones del Supervisor:**
    *   **`Iniciar`:** Permite al supervisor comenzar a registrar su feedback y guardar el progreso.
    *   **`Devolver autoevaluación`:** Habilita una ventana emergente (modal) para que el supervisor escriba una nota de justificación. Al enviar, el estado de la evaluación del colaborador cambia a "Devuelta por Supervisor".
    *   **`Aprobar autoevaluación`:** Confirma que la autoevaluación del colaborador es correcta y permite al supervisor continuar con su parte.
    *   **`Completada`:** Guarda el progreso de la evaluación del supervisor, permitiendo ediciones.
    *   **`Someter`:** Finaliza y registra la evaluación completa.

---

## Fase 4: Flujo de Cierre y Conformidad del Colaborador

Esta fase implementa la etapa final del proceso, donde el colaborador revisa los resultados y expresa su conformidad.

1.  **Crear Vista de Resultados para el Colaborador:**
    *   Una vez que el supervisor somete la evaluación final, el colaborador debe recibir una notificación y/o ver un nuevo estado en su panel.
2.  **Implementar Opciones de Conformidad:**
    *   En la vista de resultados, el colaborador debe tener las siguientes opciones (probablemente como botones o un selector):
        *   `En conocimiento`
        *   `Conforme`
        *   `Inconforme`
        *   `De acuerdo`
    *   La selección del colaborador debe quedar registrada en el sistema.

---

## Fase 5: Actualización de Reportes

Esta fase asegura que los cambios se reflejen en los entregables finales.

1.  **Modificar Versión Imprimible (PDF):**
    *   Identificar el servicio o componente responsable de generar el PDF.
    *   Agregar la sección **`RESULTADOS OBJETIVOS (30%)`** justo debajo de la tabla o listado de objetivos calificados, mostrando el cálculo correspondiente.

---

## Fase 6: Verificación y Pruebas

Una vez completadas todas las fases de desarrollo, se realizará una ronda de pruebas exhaustivas para asegurar el correcto funcionamiento de todas las nuevas características.

1.  **Prueba del Flujo Completo:** Simular el proceso de inicio a fin:
    *   Creación y autoevaluación del colaborador.
    *   Devolución por parte del supervisor.
    *   Re-envío del colaborador.
    *   Evaluación y aprobación del supervisor.
    *   Revisión y conformidad del colaborador.
2.  **Verificación de UI/UX:** Comprobar que todos los botones, textos y vistas se muestran correctamente y en los lugares indicados (inicio y final de las páginas).
3.  **Prueba del Reporte PDF:** Generar un reporte y verificar que la nueva sección y los cálculos son correctos.
