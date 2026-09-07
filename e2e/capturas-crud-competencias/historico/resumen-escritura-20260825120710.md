## Ejecución del 2026-08-25 12:09 — modo ESCRITURA

- **URL:** `http://localhost:4300/evaluacionempleado-prueba` (local, `ng serve --configuration prueba` → API `:7071`, BD `Evaluaciones_Test`)
- **Marca de la ejecución:** `[E2E-20260825120710]`
- **Resultado:** 8 paso(s) correctos, 0 parcial(es), 3 con problemas, 1 omitido(s) por entero, 3 problema(s), 0 error(es) de JavaScript en consola.

| # | Paso | Captura(s) | Resultado |
|---|---|---|---|
| 1 | Login y navegación por el menú hasta la pantalla nueva | `00-login.png`<br>`01-post-login.png`<br>`02-pantalla-configuracion-competencias.png` | Correcto |
| 2 | Selector de periodo: ofrece los periodos y preselecciona el activo | `03-selector-periodos-desplegado.png` | Correcto |
| 3 | Franja de resumen del shell: contadores del periodo | `04-franja-resumen.png` | Correcto |
| 4 | Pestaña "Competencias por puesto": listado, semáforo, filtros y detalle | `05-tab-competencias-puesto.png`<br>`06-listado-puestos-semaforo-y-aviso.png`<br>`07-filtros-aplicados.png`<br>`08-detalle-puesto-con-competencias.png` | Correcto |
| 5 | Alta múltiple sobre un puesto gris genuinamente vacío | `09-panel-alta-multiple-abierto.png`<br>`10-alta-multiple-marcadas.png`<br>`11-alta-multiple-resultado.png`<br>`12-alta-multiple-verificada.png` | Con problemas — [Backend] Se pidieron 2 altas y al releer solo hay 0 con la marca [E2E-20260825120710]. El API responde 200 sin procesar en algunos casos: comprobar por SQL. |
| 6 | Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde | `13-peso-antes-ambar.png`<br>`14-peso-ajustado-verde.png`<br>`15-listado-con-verde.png`<br>`16-peso-restaurado.png` | Correcto |
| 7 | Borrado con confirmación de las filas creadas por el guion | — | Omitido — el paso 5 no llegó a crear ninguna fila, así que no hay nada propio que borrar |
| 8 | Clonado: previsualización (los dos modos) y ejecución (solo escritura) | `17-clonado-dialogo-abierto.png`<br>`18-clonado-previsualizacion.png`<br>`19-clonado-previsualizacion-destino-seguro.png`<br>`20-clonado-ejecutado.png` | Con problemas — [Backend] El clonado dijo haber creado filas pero al releer el puesto sigue vacío. Comprobar por SQL. |
| 9 | Pestaña "Catálogo y categorías": catálogo agrupado y matriz de vinculación | `21-tab-catalogo-categorias.png`<br>`22-matriz-vinculacion.png`<br>`23-matriz-casilla-marcada.png`<br>`24-matriz-casilla-restaurada.png` | Correcto |
| 10 | Pestaña "Ponderación": valores del periodo y bloqueo si no suma 100 | `25-tab-ponderacion.png`<br>`26-ponderacion-suma-invalida.png`<br>`27-ponderacion-restaurada.png` | Correcto |
| 11 | Pestaña "Diagnóstico": tres listados, conteos y bloque de no verificables | `28-tab-diagnostico.png`<br>`29-diagnostico-advertencia-defecto-A.png`<br>`30-diagnostico-no-verificables.png`<br>`31-diagnostico-listados.png` | Correcto |
| 12 | Guard de seguridad: la ruta exige rol Administrador | `32-guard-rol-no-admin.png` | Con problemas — [Seguridad] Con rol 2 la pantalla "Configuración de Competencias" se abrió igualmente: el RoleGuard no bloqueó la URL directa |

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
- "Solo puestos sin competencias": 209 en total → 100 en la primera página
- El interruptor "solo puestos sin competencias" filtra correctamente
- Filtro por texto "ADMINISTRADO": 2 fila(s)
- El filtro por nombre de puesto acota el listado
- Detalle de "ADMINISTRADOR BASE DE DATOS (DBA)" (#6): 11 competencia(s), cabecera "11 competencia(s) · peso 99 · No llega a 100"
- El detalle coincide con el conteo del listado
- Candidato ámbar para el paso 6: ADMINISTRADOR BASE DE DATOS (DBA) (#6, peso 99)
- Candidato para el alta múltiple: ABOGADO JUNIOR (#94)

**5. Alta múltiple sobre un puesto gris genuinamente vacío** — _con problemas_
- Lista blanca de escritura: puestos 94, 102 (los dos grises que 04-Defectos-API.md §A confirma genuinamente vacíos). Prohibido: 19 (puesto 19: 12 metas ocultas por el defecto A).
- Estado inicial de #94: 0 competencia(s) según el API
- Competencias del catálogo del periodo disponibles: 12
- Respuesta del alta múltiple: "Competencias por puesto Alta múltiple: se crearon 2 competencia(s). Cool"
- Tras releer: 0 fila(s) en el puesto, 0 con la marca de esta ejecución
- ⚠️ [Backend] Se pidieron 2 altas y al releer solo hay 0 con la marca [E2E-20260825120710]. El API responde 200 sin procesar en algunos casos: comprobar por SQL.

**6. Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde** — _ok_
- En el periodo 8 los 10 puestos configurados suman 96 o 99: NINGÚN semáforo verde es lo correcto, no un fallo. El verde se prueba ajustando un peso a propósito y luego se restaura.
- Estado inicial: peso 99, semáforo "11 competencia(s) · peso 99 · No llega a 100" (clase cp-falta); falta 1
- Guardado: peso 9 → 10. Respuesta: "Competencias por puesto Competencia actualizada. Cool"
- Tras el ajuste: peso 100, semáforo "11 competencia(s) · peso 100 · Suma 100" (clase cp-ok)
- El semáforo pasó de ámbar a VERDE al sumar exactamente 100
- En el listado tras releer: peso 100, estado ok ("Suma 100")
- Peso restaurado al valor original (99): la base queda como estaba

**7. Borrado con confirmación de las filas creadas por el guion** — _omitido_
- Omitido: el paso 5 no llegó a crear ninguna fila, así que no hay nada propio que borrar

**8. Clonado: previsualización (los dos modos) y ejecución (solo escritura)** — _con problemas_
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
- Puesto de destino fijado: ABOGADO JUNIOR (94)
- Filas que se crearían sobre #94: 12
- Resultado del clonado: "Competencias por puesto Clonado: se crearon 12 competencia(s). Cool"
- Tras releer, el puesto #94 tiene 0 fila(s)
- ⚠️ [Backend] El clonado dijo haber creado filas pero al releer el puesto sigue vacío. Comprobar por SQL.

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

**12. Guard de seguridad: la ruta exige rol Administrador** — _con problemas_
- El usuario del recorrido es Administrador, así que la comprobación definitiva —entrar con un usuario real de rol 2 (Supervisor) o 3 (Empleado)— queda documentada en 03-Auditoria-Verificacion.md. Aquí se hace la comprobación equivalente en cliente: se degrada el rol guardado en localStorage (que es de donde lo lee RoleGuard vía SegurityService.getRolId) y se navega por URL directa.
- Valor original de localStorage["rol"]: {"id":482,"empleadoSecuencial":525,"rolId":1,"rol":{"id":0,"name":null,"nivel":0,"empleados":[]},"empleado":{"secuencial
- Rol degradado a 2 (Supervisor) en el navegador
- URL tras intentar entrar con rol 2: http://localhost:4300/evaluacionempleado-prueba/configuracion-competencias
- Mensaje en pantalla: ""
- Rol original restaurado en localStorage
- ⚠️ [Seguridad] Con rol 2 la pantalla "Configuración de Competencias" se abrió igualmente: el RoleGuard no bloqueó la URL directa

### Problemas encontrados

| # | Paso | Categoría | Descripción |
|---|---|---|---|
| 1 | 5 | Backend | Se pidieron 2 altas y al releer solo hay 0 con la marca [E2E-20260825120710]. El API responde 200 sin procesar en algunos casos: comprobar por SQL. |
| 2 | 8 | Backend | El clonado dijo haber creado filas pero al releer el puesto sigue vacío. Comprobar por SQL. |
| 3 | 12 | Seguridad | Con rol 2 la pantalla "Configuración de Competencias" se abrió igualmente: el RoleGuard no bloqueó la URL directa |
