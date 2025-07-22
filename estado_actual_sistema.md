# Documentación del Estado Actual del Sistema de Evaluación

Este documento describe el funcionamiento del sistema de evaluación del desempeño antes de implementar las mejoras solicitadas. Sirve como punto de partida y referencia para verificar los cambios realizados.

---

## Flujo de Trabajo del Colaborador (Autoevaluación)

1.  **Acceso a la Autoevaluación:**
    *   El colaborador accede a su autoevaluación a través de la ruta `/Evaluacion`.
    *   La aplicación carga los datos del empleado y el período de evaluación activo desde el `localStorage` del navegador.

2.  **Registro de Objetivos y Metas:**
    *   La interfaz principal para la autoevaluación es el componente `FormEvaluationEmployeComponent`.
    *   Dentro de este formulario, el colaborador puede añadir y describir sus objetivos y metas de desempeño.

3.  **Campo "Perspectiva":**
    *   Al definir una meta, existe un campo llamado "Perspectiva".
    *   Actualmente, este campo es un área de texto libre (`<textarea>`), lo que permite al colaborador introducir cualquier valor sin restricciones.

4.  **Proceso de Guardado y Envío:**
    *   El guardado de la información parece gestionarse íntegramente dentro del `FormEvaluationEmployeComponent`.
    *   No existen botones explícitos como "Guardar Borrador", "Completar" o "Someter". El flujo de guardado y finalización no es claramente visible para el usuario.

5.  **Interacción con el Supervisor:**
    *   No hay una funcionalidad visible que permita al supervisor devolver la autoevaluación al colaborador para que realice correcciones.
    *   Una vez que la evaluación es enviada (aunque el mecanismo exacto no es visible), el colaborador no parece tener forma de editarla.

---

## Flujo de Trabajo del Supervisor

1.  **Acceso a la Evaluación de Equipo:**
    *   El supervisor accede a la vista de su equipo a través de la ruta `/EvaluarSubordinados`.

2.  **Visualización de Subordinados:**
    *   La aplicación muestra una lista de los empleados que reportan directamente al supervisor.
    *   La vista actual presenta a cada subordinado como una "tarjeta" o un ícono, en lugar de una lista tabular.
    *   La información mostrada en la tarjeta incluye el nombre y otros detalles básicos del empleado.

3.  **Inicio de la Evaluación:**
    *   Para evaluar a un miembro del equipo, el supervisor hace clic en la tarjeta del colaborador.
    *   Esta acción (manejada por la propiedad `[llamarevaluacion]="true"`) probablemente abre un nuevo formulario o una vista modal para que el supervisor complete su parte de la evaluación.

4.  **Acciones del Supervisor:**
    *   No hay un botón visible o funcionalidad para "Aprobar" la autoevaluación del colaborador de forma explícita.
    *   No existe un botón para "Devolver" la autoevaluación al colaborador con comentarios para su revisión.

---

## Reportes y Vistas Adicionales

*   **Resultados de la Evaluación:** Existe una ruta `/resultado-evaluacion`, que presumiblemente muestra los resultados finales tanto al colaborador como al supervisor una vez que el proceso ha concluido.
*   **Generación de PDF:** El sistema tiene la capacidad de generar un reporte en formato PDF, pero este actualmente no incluye una sección consolidada de "RESULTADOS OBJETIVOS".
