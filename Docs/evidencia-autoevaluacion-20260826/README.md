# Evidencia — autoevaluación de mitad de año, casos reportados el 2026-08-26

RRHH reportó que **ENMANUEL PUELLO LOPEZ** y **MURIENNY PEREZ PEREZ DE CID** no podían hacer su autoevaluación. Este expediente reúne las dos clases de prueba: el video, que muestra lo que ve el empleado, y el rastro de datos, que es lo que resiste una revisión posterior.

---

## 1. Qué se encontró

| Empleado | Usuario | Diagnóstico |
|---|---|---|
| ENMANUEL PUELLO LOPEZ | `EPUELLO` | **No tenía ningún problema.** Su evaluación (id 1977) existía con 6 competencias y 7 objetivos; el API respondía 200. En ocho días de registros del servidor no hay una sola petición fallida suya. Probablemente se confundió con **MANUEL ANTONIO PUELLO ROSARIO**, que sí estaba bloqueado. |
| MURIENNY PEREZ PEREZ DE CID | `MUPEREZ` | **Sí estaba bloqueada.** Su puesto, GERENTE DE SUCURSAL PEQUEÑA (271), no tenía competencias configuradas en el periodo 8, así que el sistema nunca le generó la evaluación y el API respondía 404. |

Al revisar a fondo aparecieron **16 empleados activos sin evaluación**, no dos.

## 2. Qué se corrigió (2026-08-26)

1. Se copiaron las 12 competencias del puesto **54 GERENTE DE SUCURSAL MEDIANA** a los puestos **270** (GERENTE DE CAPTACIONES Y SUCURSAL) y **271** (GERENTE DE SUCURSAL PEQUEÑA) para el periodo 8 — plantilla autorizada por Tecnología/RRHH. Filas `Goal` **12167–12190**. Guion: `scripts/copiar_competencias_sucursal_p8.py`.
2. Se re-ejecutó la generación del periodo (`PUT /api/Periods/8`, `estadoid=3`), que solo crea las que faltan. Respaldo previo en `dbo._bak_Evaluacion_p8_20260826` (448 filas).

## 3. Rastro de datos (la evidencia que no depende del video)

| Comprobación | Antes | Después |
|---|---|---|
| `GET /api/Evaluacions/evaluacion?empleadoid=176&periodoid=8` (Murienny) | **404** | **200** |
| Evaluaciones del periodo 8 | 448 | **461** |
| Evaluaciones creadas | — | **13**, exactamente las previstas |
| Empleados con evaluación duplicada | 0 | **0** |
| Empleados activos sin evaluación | 16 | **3** |

El 404 de Murienny quedó registrado por el propio servidor el 2026-08-26 a las 14:00:46 en `C:\inetpub\logs\LogFiles\W3SVC6\u_ex260826.log`, junto al 200 posterior. Ese registro lo escribe IIS y no lo edita nadie: es la prueba más fuerte del expediente.

## 4. Videos

Grabados contra **producción**, con la cuenta real de cada empleado, el mismo día de la corrección.

| Archivo | Contenido |
|---|---|
| `01-ENMANUEL-PUELLO-LOPEZ.mp4` | Inicio de sesión, menú Evaluaciones → AutoEvaluación, y su evaluación de mitad de año cargando completa |
| `02-MURIENNY-PEREZ-PEREZ-DE-CID.mp4` | Lo mismo para Murienny, ya con sus 12 competencias y sus firmas — donde esta mañana el sistema decía que no existía evaluación |

**Los videos son de solo lectura:** el guion navega y muestra, nunca pulsa Grabar, Aceptar ni Enviar. No se modificó ningún dato al grabarlos. El rótulo inferior indica en todo momento el empleado, su puesto y la fecha y hora reales de la grabación.

Se generan con `e2e/video-auditoria-empleados.spec.js` y son reproducibles.

## 5. Lo que queda pendiente

1. **Las 13 evaluaciones nuevas tienen competencias pero ningún objetivo de desempeño.** La carga del CSV descarta en silencio a quien no tenga evaluación al momento de subirlo, y estas personas no la tenían. **RRHH debe volver a subirles los objetivos**; ahora sí se procesarán.
2. **Tres empleados siguen sin poder evaluarse**, porque su puesto aún no tiene competencias en el periodo 8. Hace falta que RRHH indique de qué puesto copiar cada uno:

| Empleado | Usuario | Puesto | Categoría |
|---|---|---|---|
| MARIANA ELIZABETH ARIAS TORRES | `MARIAS` | ABOGADO JUNIOR (94) | Profesional |
| KATELINNE VALENZUELA VIOLA | `KVALENZUELA` | OFICIAL DE NEGOCIOS FLOTANTE (102) | Soporte, Técnico y Comercial |
| JULY ANGELY MEDINA MENDEZ | `JAMEDINA` | SECRETARIA GENERAL DEL CONSEJO (272) | Gerencial |

Las tres categorías son distintas, así que no sirve una sola plantilla como sirvió para las dos de sucursal.
