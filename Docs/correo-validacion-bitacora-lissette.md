Para: Lissette Cristina Abad de los Santos
CC: Graciela Arlette Garcia Feliz; Ana Lucía Espino
Asunto: RE: Evaluación Mitad de año | Implementación — Bitácora de Eventos lista para validación en prueba

Buenos días Lissette,

Ya está construida la Bitácora de Eventos de Desempeño según el borrador que enviaste, y quedó publicada en el
ambiente de PRUEBA para que la validen antes de pasarla a producción:

  http://192.168.7.222/evaluacionempleado-prueba/  →  menú Evaluaciones → "Bitácora de Eventos"

Qué hace hoy:
1. El supervisor elige un colaborador de su equipo y registra eventos con: fecha del hecho (no la del
   registro), tipo (Logro, Incumplimiento, Iniciativa, Conducta), impacto (Alto/Medio/Bajo), descripción del hecho
   observable (mínimo 30 caracteres) y las competencias que evidencia (las 12 del periodo, agrupadas).
2. Puede editar o eliminar solo los eventos que él mismo registró; hay filtros por rango, tipo y competencia, y
   exportación a Excel.
3. En la evaluación (medio año y final), debajo de la calificación de cada competencia, el supervisor ve
   "2 logros · 1 incumplimiento" y puede desplegar las descripciones. Es evidencia para calificar mejor:
   NO cambia la puntuación de forma automática.
4. Reporte para RRHH y supervisores (menú Reportes → "Reporte Bitácora de Eventos"): por equipo, con conteos
   por tipo y último evento, y detalle por colaborador con resumen por competencia; ambos exportables a Excel.

Decisiones que tomé y que necesito que confirmen (o me digan cómo lo quieren):
- Impacto = Alto / Medio / Bajo.
- Registra el supervisor inmediato (también RRHH/admin desde el reporte no; solo consulta).
- Editar/eliminar: solo el autor del evento. El borrado es lógico (queda rastro).
- La bitácora es continua todo el año; la evaluación muestra solo los eventos dentro de las fechas del periodo.
- "Fecha de ingreso" de la lámina 1: el sistema no tiene ese dato del padrón; se muestra cargo y departamento.
- Encaje con el plan de acción: los eventos de Incumplimiento y Conducta quedan disponibles como insumo; la matriz
  del plan de acción sigue pendiente de definición (correo del 16 de julio).

Para validar, sugiero que Graciela pruebe con un supervisor real en prueba y me pasen observaciones. Con su visto
bueno lo llevo a producción (API y frontend) en una ventana coordinada.

Saludos,
Rhay
