## Ejecución del 2026-08-25 14:16 — modo ESCRITURA

- **URL:** `http://localhost:4300/evaluacionempleado-prueba` (local, `ng serve --configuration prueba` → API `:7071`, BD `Evaluaciones_Test`)
- **Marca de la ejecución:** `[E2E-20260825141216]`
- **Resultado:** 12 paso(s) correctos, 0 parcial(es), 0 con problemas, 0 omitido(s) por entero, 0 problema(s), 0 error(es) de JavaScript en consola.

| # | Paso | Captura(s) | Resultado |
|---|---|---|---|
| 1 | Login y navegación por el menú hasta la pantalla nueva | `00-login.png`<br>`01-post-login.png`<br>`02-pantalla-configuracion-competencias.png` | Correcto |
| 2 | Selector de periodo: ofrece los periodos y preselecciona el activo | `03-selector-periodos-desplegado.png` | Correcto |
| 3 | Franja de resumen del shell: contadores del periodo | `04-franja-resumen.png` | Correcto |
| 4 | Pestaña "Competencias por puesto": listado, semáforo, filtros y detalle | `05-tab-competencias-puesto.png`<br>`06-listado-puestos-semaforo-y-aviso.png`<br>`07-filtro-solo-ocupados.png`<br>`08-filtros-aplicados.png`<br>`09-detalle-puesto-con-competencias.png` | Correcto |
| 5 | Alta múltiple sobre un puesto vacío con departamento válido | `10-panel-alta-multiple-abierto.png`<br>`11-alta-multiple-marcadas.png`<br>`12-alta-multiple-resultado.png`<br>`13-alta-multiple-verificada.png` | Correcto |
| 6 | Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde | `14-peso-antes-ambar.png`<br>`15-peso-ajustado-verde.png`<br>`16-listado-con-verde.png`<br>`17-peso-restaurado.png` | Correcto |
| 7 | Borrado con confirmación de las filas creadas por el guion | `18-borrado-antes.png`<br>`19-borrado-confirmacion.png`<br>`20-borrado-verificado.png` | Correcto |
| 8 | Clonado: previsualización (los dos modos) y ejecución (solo escritura) | `21-clonado-dialogo-abierto.png`<br>`22-clonado-previsualizacion.png`<br>`23-clonado-previsualizacion-destino-seguro.png`<br>`24-clonado-ejecutado.png`<br>`25-clonado-verificado.png`<br>`26-clonado-limpieza.png` | Correcto |
| 9 | Pestaña "Catálogo y categorías": catálogo agrupado y matriz de vinculación | `27-tab-catalogo-categorias.png`<br>`28-matriz-vinculacion.png`<br>`29-matriz-casilla-marcada.png`<br>`30-matriz-casilla-restaurada.png` | Correcto |
| 10 | Pestaña "Ponderación": valores del periodo y bloqueo si no suma 100 | `31-tab-ponderacion.png`<br>`32-ponderacion-suma-invalida.png`<br>`33-ponderacion-restaurada.png` | Correcto |
| 11 | Pestaña "Diagnóstico": tres listados, conteos y bloque de no verificables | `34-tab-diagnostico.png`<br>`35-diagnostico-advertencia-defecto-A.png`<br>`36-diagnostico-no-verificables.png`<br>`37-diagnostico-listados.png` | Correcto |
| 12 | Guard de seguridad: la ruta exige rol Administrador | `38-guard-rol-no-admin.png` | Correcto |

### Detalle observado por paso

**1. Login y navegación por el menú hasta la pantalla nueva** — _ok_
- Login correcto y menús de administrador visibles
- Pantalla abierta: "Configuración de Competencias"

**2. Selector de periodo: ofrece los periodos y preselecciona el activo** — _ok_
- Periodo preseleccionado: "Evaluación de Mitad de año 2026 — activo"
- El periodo activo viene preseleccionado (la opción lleva el sufijo "— activo")
- Periodos ofrecidos (3): Evaluación de Mitad de año 2026 — activo \| Evaluación de Desempeño Final 2025 \| Evaluación de Desempeño Final 2024
- El selector ofrece 3 periodos

**3. Franja de resumen del shell: contadores del periodo** — _ok_
- PERIODO = Evaluación de Mitad de año 2026
- ESTADO = Activo
- PUESTOS CON COMPETENCIAS = 10
- PUESTOS CON EMPLEADOS ACTIVOS = 90
- Contadores leídos: 10 puestos con competencias / 90 puestos ocupados

**4. Pestaña "Competencias por puesto": listado, semáforo, filtros y detalle** — _ok_
- Filtros presentes: 1 select(Departamento), 1 input(Puesto), 2 interruptor(es)
- Filas leídas en el listado, recorriendo todas las páginas: 209
- Conteo que declara la pantalla: "209 puesto(s) mostrados de 209 en el catálogo (90 ocupados por empleados activos)."
- Semáforo: vacio=191, desconocido=8, falta=10
- No hay ningún semáforo verde. En el periodo 8 es lo esperado: los 10 puestos configurados suman 96 o 99. Se prueba el verde a propósito en el paso 6.
- El listado pinta el semáforo por fila
- Aviso del punto ciego del API presente
- Texto del aviso: "visibility_off 8 ocupado(s) de los 115 puestos sin departamento aparecen con 0 competencias, y en ellos ese cero no está confirmado: el API no lista las metas de los puestos con departamento en 0. Se marcan como “Sin competencias (sin confirmar)”: hay que conf…"
- "Solo puestos sin competencias" (aislado): 199 de 209; esperados 199
- El interruptor "solo puestos sin competencias" devuelve exactamente los 199 esperados
- "Solo puestos ocupados" (aislado): 90 puesto(s); la franja de resumen declara 90
- El filtro "solo ocupados" (90) cuadra con el contador del shell
- Filtro por texto "ADMINISTRADO" (aislado): 2 fila(s); esperadas 2
- El filtro por nombre de puesto acota a los 2 puestos esperados
- El filtro por departamento ofrece 45 opciones
- Filtro por departamento "CREDITO, LEGAL Y COBROS" (aislado): 2 fila(s); esperadas 2
- El filtro por departamento devuelve exactamente los 2 puestos de "CREDITO, LEGAL Y COBROS"
- Combinación texto "ADMINISTRADO" + "solo ocupados": 1 fila(s); intersección esperada 1
- Los filtros se acumulan: la combinación devuelve exactamente la intersección
- Detalle de "ADMINISTRADOR BASE DE DATOS (DBA)" (#6): 11 competencia(s), cabecera "11 competencia(s) · peso 99 · No llega a 100"
- El detalle coincide con el conteo del listado
- Puestos vacíos con departamento válido (relectura fiable): 84; de ellos, sin empleados activos: 12
- Candidato ámbar para el paso 6: ADMINISTRADOR BASE DE DATOS (DBA) (#6, peso 99)
- Candidato para el alta múltiple: ABOGADA DE COBROS LEGAL (#92, departamento "CREDITO, LEGAL Y COBROS", sin empleados activos)

**5. Alta múltiple sobre un puesto vacío con departamento válido** — _ok_
- Criterio de elección del puesto: departamento válido (para que la relectura del API sea fiable), cero competencias en el periodo y sin empleados activos. Los puestos grises (departamento 0) quedan EXCLUIDOS a propósito: son los que el defecto A esconde, y releerlos no verifica nada. Prohibido: 19 (puesto 19: 12 metas ocultas por el defecto A).
- Estado inicial de #92: 0 competencia(s) según el API
- Competencias del catálogo del periodo disponibles: 12
- Respuesta del alta múltiple: "Competencias por puesto Alta múltiple: se crearon 2 competencia(s). Cool"
- Tras releer: 2 fila(s) en el puesto, 2 con la marca de esta ejecución
- Las 2 competencias quedaron guardadas y se confirman releyendo del API

**6. Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde** — _ok_
- En el periodo 8 los 10 puestos configurados suman 96 o 99: NINGÚN semáforo verde es lo correcto, no un fallo. El verde se prueba ajustando un peso a propósito y luego se restaura.
- Estado inicial: peso 99, semáforo "11 competencia(s) · peso 99 · No llega a 100" (clase cp-falta); falta 1
- Guardado: peso 9 → 10. Respuesta: "Competencias por puesto Competencia actualizada. Cool"
- Tras el ajuste: peso 100, semáforo "11 competencia(s) · peso 100 · Suma 100" (clase cp-ok)
- El semáforo pasó de ámbar a VERDE al sumar exactamente 100
- En el listado tras releer: peso 100, estado ok ("Suma 100")
- Peso restaurado al valor original (99): la base queda como estaba

**7. Borrado con confirmación de las filas creadas por el guion** — _ok_
- Filas propias a borrar en #92: 2
- El borrado pide confirmación con ConfirmDialogComponent
- Texto de la confirmación: "Eliminar competencia del puesto Se eliminará la competencia "Desarrollo Personal y auto aprendizaje" (peso 50) del puesto ABOGADA DE COBROS LEGAL. Esta acción no se puede deshacer. ATENCIÓN: este es el PERIODO ACTIVO. Puede haber evaluaciones en curso que incl"
- Borradas 2; tras releer quedan 0 filas con la marca [E2E-20260825141216]
- Las filas creadas por el guion desaparecieron y la relectura lo confirma

**8. Clonado: previsualización (los dos modos) y ejecución (solo escritura)** — _ok_
- Selectores del diálogo de clonado: 3 (periodo origen, puesto origen, puesto destino)
- "Ejecutar clonado" nace deshabilitado: no se puede escribir sin previsualizar
- Cifra: 12 se crearían
- Cifra: 791 se saltan (ya existen)
- Cifra: 1 advertencias
- La previsualización muestra las tres cifras (se crearían / se saltan / advertencias)
- Advertencia: "Está clonando entre periodos distintos. Las filas conservan el objetivoid del periodo de origen: las competencias del destino seguirán apuntando al catálogo del periodo 7."
- Advertencia: "El periodo de destino es el activo: las filas que cree pueden entrar en evaluaciones que ya estén en curso."
- Advertencia: "Advertencias de la previsualización Hay 115 puesto(s) que el API no puede listar (3, 4, 5, 7, 8, y 110 mas) porque su departamento no existe en el catalogo. Sus metas quedan fuera de esta comparacion: no se clonarian aun"
- El diálogo advierte del punto ciego de los puestos con departamento 0
- Hay que marcar "He leído las advertencias" antes de poder ejecutar
- Puesto de destino fijado: ABOGADA DE COBROS LEGAL (92)
- Filas que se crearían sobre #92: 12
- Resultado del clonado: "Competencias por puesto Clonado: se crearon 12 competencia(s). Cool"
- Tras releer, el puesto #92 tiene 12 fila(s)
- El clonado creó 12 fila(s), confirmadas releyendo del API
- Limpieza terminada: el puesto de destino vuelve a estar vacío, como estaba antes

**9. Pestaña "Catálogo y categorías": catálogo agrupado y matriz de vinculación** — _ok_
- Catálogo agrupado: 4 grupo(s), 12 competencia(s)
- El catálogo se muestra agrupado por grupo de competencia
- Cabecera del catálogo: "Catálogo de Evaluación de Mitad de año 2026 12 competencia(s) · 41 vínculo(s) con categorías de puesto"
- Matriz: 12 fila(s) × 7 categoría(s) [GERENCIAL, SUPERVISOR Y MANDOS MEDIOS, PROFESIONAL SENIOR, PROFESIONAL PLENO, PROFESIONAL, SOPORTE,TECNICO Y COMERCIAL, PRUEBA]
- La matriz de vinculación se pinta con competencias en filas y categorías en columnas
- Casilla elegida: "Orientación al Socio y a Resultados Enfoque a resultados" × "PROFESIONAL SENIOR" (fila 0, columna 2)
- Marcar la casilla creó el vínculo y la relectura lo confirma
- Desmarcar la casilla borró el vínculo y la relectura lo confirma; estado original restaurado

**10. Pestaña "Ponderación": valores del periodo y bloqueo si no suma 100** — _ok_
- Valores del periodo: Desempeño 30 % / Competencia 70 % — check_circle Suma: 100 — correcto
- Los dos porcentajes del periodo suman 100
- Botón Guardar con los valores actuales: habilitado
- Con Desempeño=55: "error Suma: 125 — debe ser exactamente 100 para poder guardar"; Guardar deshabilitado
- Con una suma distinta de 100 el botón Guardar queda deshabilitado (no se llegó a guardar nada)
- Restaurado en pantalla: "check_circle Suma: 100 — correcto" (nunca se pulsó Guardar: la base no se tocó)

**11. Pestaña "Diagnóstico": tres listados, conteos y bloque de no verificables** — _ok_
- Contexto: 455 empleados activos 90 puestos ocupados 103 competencias listadas en el periodo
- Los tres listados del diagnóstico están presentes
- Listado 1: "1. Puestos con empleados activos y sin competencias 72" → conteo 72
- Listado 2: "2. Puestos sin categoría válida 0" → conteo 0
- Listado 3: "3. Empleados activos sin evaluación en el periodo 444" → conteo 444
- Advertencia del listado 1: "warning Este listado tiene un límite conocido. Los cuatro GET de /api/Goals cruzan el puesto con la tabla de departamentos, así que un puesto cuyo departamento no exista en el catálogo aparece como si no tuviera competencias aunque las tenga en base de datos (caso comprobado: el puesto 19, GERENTE GESTIÓN HUMANA, con 12 competencias reales y 0 según el API). En este periodo hay 8 puesto(s) en esa "
- La advertencia cita el caso comprobado del puesto 19 con sus 12 competencias reales
- Puestos ocupados en pantalla: 90; puestos invisibles para /api/Goals: 115
- Los 115 puestos ciegos de 04-Defectos-API.md §A coinciden con lo que muestra la pantalla
- Bloque "no verificables": 8 puesto(s)
- El bloque de "no verificables" existe, va aparte del listado 1 y trae su advertencia
- El bloque incluye la consulta SQL que sí da la respuesta definitiva
- Puestos listados como no verificables: 94, 255, 33, 69, 19, 102, 249, 221
- El puesto 19 aparece en "no verificables": el defecto A se muestra, no se esconde
- Listado 2 (puestos sin categoría válida): 0
- El listado 2 no se cree el cero del listado del API (0 puestos, no los 209 del defecto B)
- Listado 1: 72 fila(s) pintadas en la tabla
- Listado 2: sin tabla (mensaje de "ninguno")
- Listado 3: 444 fila(s) pintadas en la tabla

**12. Guard de seguridad: la ruta exige rol Administrador** — _ok_
- El usuario del recorrido es Administrador, así que la comprobación definitiva —entrar con un usuario real de rol 2 (Supervisor) o 3 (Empleado)— queda documentada en 03-Auditoria-Verificacion.md. Aquí se hace la comprobación equivalente en cliente: se degrada el rol guardado en localStorage (que es de donde lo lee RoleGuard vía SegurityService.getRolId) y se entra por el menú.
- Valor original de localStorage["rol"]: {"id":482,"empleadoSecuencial":525,"rolId":1,"rol":{"id":0,"name":null,"nivel":0,"empleados":[]},"empleado":{"secuencial
- URL tras volver al inicio: http://localhost:4300/evaluacionempleado-prueba/Home
- Rol degradado a 2 (Supervisor) estando ya fuera de la pantalla
- URL tras intentar entrar con rol 2: http://localhost:4300/evaluacionempleado-prueba/Home
- Mensaje en pantalla: "Acceso Denegado No tiene permisos para acceder a esta página. ok"
- Con rol 2 la ruta no se abre al entrar por el menú desde Home
- Se muestra el aviso "Acceso Denegado / No tiene permisos para acceder a esta página"
- Rol original restaurado en localStorage
