# Auditoría de verificación — CRUD de Competencias (T3.3)

**Proyecto:** Sistema de Evaluación de Empleados (COOPASPIRE)
**Rama:** `feature/crud-competencias`
**Tarea:** T3.3 de `Docs/crud-competencias/01-Fases-y-Tareas.md`
**Criterio de aceptación cubierto:** nº 9 de `Docs/crud-competencias/00-Plan-General.md`
**Guion:** `e2e/crud-competencias.spec.js`
**Capturas:** `e2e/capturas-crud-competencias/`

> **Estado de este documento: PENDIENTE DE EJECUCIÓN.**
> El guion está escrito y comprobado sintácticamente, pero todavía no se ha corrido:
> faltaban las credenciales del usuario administrador. Las columnas *Captura* y
> *Resultado* de la tabla de pasos se rellenan cuando se ejecute. El propio guion
> imprime al terminar un bloque en Markdown listo para pegar en la sección
> **"Ejecuciones"** del final de este documento.

---

## 1. Objetivo

Comprobar, sobre la aplicación corriendo y con evidencia gráfica, que la pantalla nueva
**Configuración → Configuración de Competencias** hace lo que el plan prometió:

1. Un administrador entra desde el menú, elige un periodo y ve, por puesto, cuántas
   competencias tiene y si el peso suma 100 *(criterio 1 del plan)*.
2. Puede dar de alta varias competencias de una vez, editarlas y eliminarlas con
   confirmación *(criterio 2)*.
3. Puede clonar viendo antes qué se crea y qué se salta *(criterio 3)*.
4. Puede vincular competencias a categorías de puesto sin SQL *(criterio 4)*.
5. Puede fijar la ponderación Desempeño/Competencia *(criterio 5)*.
6. El diagnóstico lista los mismos huecos que hoy se detectan por SQL *(criterio 6)*.
7. Un usuario no administrador no entra ni por URL directa *(criterio 7)*.

Y, con el mismo peso que lo anterior: **que la pantalla enseñe los dos defectos del API
en lugar de taparlos**. Un recorrido que pasara "en verde" escondiendo el punto ciego de
`/api/Goals` sería peor que no haberlo hecho, porque daría por buena una información que
puede llevar a duplicar competencias en producción. Ver `Docs/crud-competencias/04-Defectos-API.md`.

---

## 2. Entorno exacto

| | |
|---|---|
| **Aplicación** | local, `ng serve --configuration prueba` |
| **URL base** | `http://localhost:<puerto>/evaluacionempleado` — el puerto lo fija el orquestador y se pasa al guion por `EVAL_BASE` (por defecto `http://localhost:4300/evaluacionempleado`) |
| **API** | `http://192.168.7.222:7071` (entorno de **prueba**) |
| **Base de datos** | `Evaluaciones_Test` |
| **Base href** | `/evaluacionempleado/` |
| **Ruta verificada** | `/configuracion-competencias` (`AuthGuard` + `RoleGuard`, `roles: [RolUsuario.Admin]`) |
| **Menú** | Configuración → "Configuración de Competencias" (`navmenu.component.html`, visible solo con `rolId == 1`) |
| **Periodo de trabajo** | el activo, que el shell preselecciona (periodo 8, Medio Año 2026, en el momento de escribir esto) |
| **Usuario** | administrador (rol 1). Sus credenciales **no** están en el repositorio: se pasan por `EVAL_USERNAME` / `EVAL_PASSWORD` |
| **Playwright** | 1.60.0, configuración de `playwright.config.js` (headed, 1400×900, vídeo si falla) |

**Producción queda excluida por diseño.** El guion aborta antes de arrancar si `EVAL_BASE`
apunta a `:7070` o a `http://192.168.7.222/evaluacionempleado`. Esta verificación no toca
producción en ninguna circunstancia.

---

## 3. Método

### 3.1 Dos modos de ejecución

El recorrido tiene un interruptor por variable de entorno, `EVAL_ESCRITURA`:

| Modo | Cómo se activa | Qué hace |
|---|---|---|
| **Solo lectura** *(por defecto)* | `EVAL_ESCRITURA` ausente o distinto de `1` | Recorre, captura y verifica todo lo que no escriba: login, menú, selector de periodo, resumen, listado con semáforo, filtros, detalle, **previsualización** del clonado, catálogo y matriz, validación de la ponderación y diagnóstico completo. Los pasos que escriben quedan registrados como *"omitido por modo lectura"*. |
| **Escritura** | `EVAL_ESCRITURA=1` | Todo lo anterior **más** alta múltiple, edición de peso, borrado con confirmación, ejecución del clonado y marcado/desmarcado en la matriz. Cada operación se deshace al terminar. |

El modo que corrió aparece en el nombre del test, en la cabecera de la salida y en el
bloque de resumen, para que no quede duda de qué se verificó realmente.

```powershell
# 1) levantar la aplicación (terminal aparte)
ng serve --configuration prueba --port 4300

# 2) credenciales del administrador — nunca van en el repositorio
$env:EVAL_USERNAME = "<usuario admin>"
$env:EVAL_PASSWORD = "<clave>"
$env:EVAL_BASE     = "http://localhost:4300/evaluacionempleado"

# 3a) recorrido de SOLO LECTURA
Remove-Item Env:EVAL_ESCRITURA -ErrorAction SilentlyContinue
npx playwright test e2e/crud-competencias.spec.js

# 3b) recorrido con ESCRITURA
$env:EVAL_ESCRITURA = "1"
npx playwright test e2e/crud-competencias.spec.js
```

### 3.2 Reglas del recorrido

- **Comprobaciones reales, no pantallazos.** Cada paso afirma algo verificable (el
  periodo activo viene preseleccionado, el filtro acota el listado, el semáforo cambia de
  color, la fila desapareció) además de dejar su captura.
- **Nada se da por bueno por un HTTP 200.** El API de prueba responde 200 en algunos
  casos sin llegar a procesar (riesgo documentado en `00-Plan-General.md` §7). Después de
  cada escritura el guion **relee del API** y comprueba el resultado sobre lo releído.
- **Un fallo no aborta el recorrido.** Se registra con `issue()` y se sigue: el objetivo
  es un informe completo, no parar en el primer tropiezo.
- **Una captura numerada por paso**, en `e2e/capturas-crud-competencias/`, con el mismo
  patrón que `e2e/crear-competencia.spec.js`.
- **Credenciales solo por `process.env`.** No hay ni un usuario ni una clave en el archivo.

### 3.3 Dónde tiene permitido escribir el guion

En modo escritura, el guion **solo crea competencias en una lista blanca de puestos**:

| Puesto | Nombre | Por qué es seguro |
|---|---|---|
| 94 | ABOGADO JUNIOR | Gris (departamento 0) pero **genuinamente vacío** según `04-Defectos-API.md` §A |
| 102 | OFICIAL DE NEGOCIOS FLOTANTE | Ídem |

Y tiene **prohibido** tocar el **puesto 19 (GERENTE GESTION HUMANA)**: tiene 12 metas en
`Goal` que ninguno de los cuatro GET de `/api/Goals` devuelve. Crearle competencias por
pantalla lo dejaría con 24 — exactamente el daño que documenta el defecto A y que ya hubo
que limpiar en producción. La prohibición está codificada en el guion
(`PUESTOS_PROHIBIDOS`), no confiada al criterio de quien lo ejecute.

Además, antes de escribir, el guion exige que el puesto elegido aparezca **con cero filas**
en el detalle; si tiene alguna, se salta el paso en vez de escribir encima.

### 3.4 Cómo se deshace lo que se escribe

| Operación | Cómo se revierte |
|---|---|
| Alta múltiple | Las descripciones llevan una marca única de la ejecución (`[E2E-<sello>]`). El paso 7 borra **solo** las filas que llevan esa marca y comprueba, releyendo, que desaparecieron. |
| Edición de peso | Se anota el peso original antes de tocarlo y se restaura al terminar, verificando que la cabecera vuelve al valor de partida. |
| Clonado | Solo se ejecuta contra un puesto de la lista blanca que estaba vacío, y con menos de 20 filas a crear. Todo lo que aparezca después lo creó el guion, y se borra fila a fila. |
| Matriz de categorías | Se marca una casilla que estaba desmarcada y se vuelve a desmarcar, comprobando la relectura en los dos sentidos. |
| Ponderación | **No se escribe nunca.** La validación se prueba escribiendo un valor inválido y comprobando que el botón *Guardar* queda deshabilitado; nunca se pulsa. |
| Rol (paso 12) | Se guarda el valor original de `localStorage["rol"]` y se restaura al final. |

Si alguna limpieza no cierra, el guion lo registra con la categoría `Limpieza` y el texto
"LIMPIAR A MANO", con el puesto y la marca, para que quede en el informe y no se pierda.

---

## 4. Tabla de pasos

> Las columnas *Captura* y *Resultado* se rellenan al ejecutar. El guion imprime esta
> misma tabla ya completa, en Markdown, al final de la corrida, y la guarda además en
> `e2e/capturas-crud-competencias/resumen-<modo>-<sello>.md`.

| # | Paso | Qué se comprueba | Escribe | Captura | Resultado |
|---|---|---|---|---|---|
| 1 | Login y navegación por el menú | Entra con el usuario administrador; el menú **Configuración** es visible (rol 1); el ítem "Configuración de Competencias" lleva a `/configuracion-competencias` y la pantalla carga | No | | |
| 2 | Selector de periodo | Ofrece los periodos del sistema y **preselecciona el activo** (la opción trae el sufijo "— activo"); hay exactamente un periodo marcado como activo | No | | |
| 3 | Franja de resumen del shell | Se capturan los cuatro datos: periodo, estado, *puestos con competencias* y *puestos con empleados activos*; si el periodo es el activo, aparece el aviso de evaluaciones en curso | No | | |
| 4 | Pestaña **Competencias por puesto** | Listado con semáforo por fila; los **cuatro filtros** (departamento, texto de puesto, "solo sin competencias", "solo ocupados") existen y acotan de verdad; el detalle de un puesto con competencias coincide con el conteo del listado; **existe el aviso de los puestos con departamento 0** y remite a comprobar por SQL | No | | |
| 5 | **Alta múltiple** | Sobre un puesto gris **genuinamente vacío** de la lista blanca (94 / 102, nunca el 19): se marcan competencias del catálogo, se les pone descripción y peso, se guardan en una operación y **se relee del API** para confirmar que las filas quedaron | **Sí** | | |
| 6 | **Edición de peso → semáforo verde** | Se toma un puesto en ámbar, se sube el peso de una fila hasta que el total dé 100 y se comprueba que el semáforo pasa a **verde**, tanto en la cabecera del detalle como en el listado tras releer. Después se restaura el peso original. *Que en el periodo 8 no haya ningún verde de partida es correcto y el guion no lo trata como fallo* | **Sí** | | |
| 7 | **Borrado con confirmación** | Se borran **solo** las filas creadas en el paso 5 (identificadas por la marca de la ejecución); aparece el diálogo de confirmación y, en el periodo activo, avisa de las evaluaciones en curso; tras releer, las filas ya no están | **Sí** | | |
| 8 | **Clonado** | El diálogo abre con *Ejecutar* deshabilitado; **la previsualización se hace siempre** (no escribe, corre en los dos modos) y muestra las **tres cifras** (se crearían / se saltan / advertencias) y las advertencias, incluida la del punto ciego de los puestos sin departamento. La ejecución, con su limpieza posterior, solo en modo escritura | Previsualización: **no**. Ejecución: **sí** | | |
| 9 | Pestaña **Catálogo y categorías** | Catálogo agrupado por grupo de competencia y matriz competencia × categoría de puesto. En escritura: se marca una casilla, se recarga y se confirma; se desmarca, se recarga y se confirma, dejando el estado original | Marcado: **sí**. Lectura de la matriz: no | | |
| 10 | Pestaña **Ponderación** | Se leen los valores del periodo y su suma; se escribe un valor **inválido** y se comprueba que el botón *Guardar* queda deshabilitado. **Nunca se pulsa Guardar**, así que corre en los dos modos | No | | |
| 11 | Pestaña **Diagnóstico** | Los tres listados con sus conteos; el **bloque de "no verificables"** aparte, con su advertencia y su consulta SQL; el puesto 19 aparece en él; los números se contrastan con `04-Defectos-API.md` (115 puestos ciegos, 8 ocupados; el listado 2 no marca los 209 puestos del defecto B) | No | | |
| 12 | **Guard de seguridad** | Se degrada a 2 (Supervisor) el `rolId` que `RoleGuard` lee de `localStorage["rol"]`, se navega por **URL directa** a `/configuracion-competencias` y se comprueba que la ruta no abre, que sale el aviso "Acceso Denegado" y que redirige a `/Home`. Después se restaura el rol | No (solo `localStorage`) | | |

### 4.1 Sobre el paso 12: cómo se probaría con un usuario real de rol 2 o 3

El usuario del recorrido es administrador, así que el guion hace la comprobación
**equivalente en cliente**: `RoleGuard` decide con `SegurityService.getRolId()`, que lee
`localStorage["rol"]`; degradando ahí el `rolId` a 2 se ejercita el guard de verdad, sin
necesidad de una segunda cuenta. Es una prueba válida del guard, pero **no** sustituye a
la prueba de extremo a extremo. Para cerrarla del todo, con una cuenta real:

1. Conseguir de RRHH un usuario de **rol 2 (Supervisor)** — `prodriguez` sirve para las
   vistas de supervisor en prueba — y otro de **rol 3 (Empleado)**.
2. Entrar con ese usuario y comprobar que en la barra de navegación **no aparece el menú
   Configuración** (está bajo `*ngIf="empleadoRolController.model.rolId==1"`).
3. Escribir a mano la URL `…/evaluacionempleado/configuracion-competencias` y comprobar
   que **no** se abre la pantalla: sale el SweetAlert *"No tiene permisos para acceder a
   esta página / Acceso Denegado"* y la aplicación redirige a `/Home`.
4. Repetir con `/Meta`, que en esta rama **también** pasó a exigir rol Admin (T1.3, punto
   3). QA debe saberlo para no reportarlo como regresión — ver la nota 12 de la Fase 1 en
   `01-Fases-y-Tareas.md`.
5. Dejar la captura de los pasos 2 y 3 en `e2e/capturas-crud-competencias/` con el nombre
   `guard-rol2-<usuario>.png` y anotar aquí el usuario, la fecha y el resultado.

---

## 5. Límites de esta verificación

Esto es lo que **este recorrido no puede demostrar**, se ejecute como se ejecute. Está
escrito antes de correrlo porque no depende del resultado: depende del API.

### 5.1 El defecto A no se puede verificar desde la interfaz

`GoalsController` arma sus **cuatro** GET con un join no opcional contra `Deparments`, así
que las metas de un puesto cuyo departamento no exista en el catálogo **se caen del
resultado** (`04-Defectos-API.md` §A). Consecuencias para esta auditoría:

- La pantalla lee del mismo API que oculta esas filas. **Ningún clic puede distinguir
  "este puesto no tiene competencias" de "este puesto tiene competencias que el API no
  me enseña".** Abrir el detalle no lo descarta: sale igual de vacío.
- Por eso el recorrido **no verifica que el puesto 19 tenga 12 competencias**; lo que
  verifica es que **la pantalla admite que no lo sabe**: que el aviso está, que el bloque
  de "no verificables" existe y va aparte del listado 1, que cita el caso del puesto 19 y
  que ofrece la consulta SQL. Si algún día la pantalla dejara de avisar y presentara ese
  cero como un hecho, el guion lo marca como fallo de requisito, no como aprobado.
- **La comprobación definitiva es por SQL**, contra `Evaluaciones_Test`:

  ```sql
  -- Metas reales de un puesto, por periodo (sin el join que las oculta)
  SELECT PeriodId, COUNT(*) AS metas
  FROM   Goal
  WHERE  PositionSecuencial = 19
  GROUP  BY PeriodId;

  -- Magnitud del punto ciego: filas en la base contra filas que el API devuelve
  SELECT g.PeriodId, COUNT(*) AS en_base
  FROM   Goal g
         JOIN positions p ON p.secuencial = g.PositionSecuencial
  WHERE  p.Departmentsecuencial = 0
  GROUP  BY g.PeriodId;

  -- Puestos ciegos ocupados por empleados activos
  SELECT DISTINCT p.secuencial, p.descripcion
  FROM   positions p
         JOIN Empleados e ON e.scargo = p.secuencial AND e.codigoestado = 'A'
  WHERE  p.Departmentsecuencial = 0;
  ```

  Cifras de referencia ya reconciliadas en `04-Defectos-API.md` §A: **309 filas ocultas**
  en total (107 del periodo 7 y 12 del 8), **115** puestos con departamento 0, de los que
  **13** esconden metas y **8** están ocupados por empleados activos.

### 5.2 El defecto B tampoco se puede verificar desde la interfaz

`GET /api/Positions` no proyecta `CategoriaPuestoId`, así que devuelve `0` en los **209**
puestos aunque en base de datos solo 102 lo tengan en cero (`04-Defectos-API.md` §B). La
pestaña de Diagnóstico lo rodea pidiendo la categoría puesto por puesto con
`GET /api/Positions/{id}`, pero desde el navegador **no se puede saber si el resultado es
correcto**: solo se puede comprobar que la pantalla no se cree el cero del listado (que no
marque los 209 puestos como rotos), que es lo que hace el paso 11. La comprobación
definitiva es, otra vez, por SQL:

```sql
-- Puestos ocupados cuya categoría es 0 o cuyo SCARGO no existe en positions
SELECT DISTINCT e.scargo, p.descripcion, p.CategoriaPuestoId
FROM   Empleados e
       LEFT JOIN positions p ON p.secuencial = e.scargo
WHERE  e.codigoestado = 'A'
  AND  (p.secuencial IS NULL OR ISNULL(p.CategoriaPuestoId, 0) = 0);
```

### 5.3 Otros límites

- **El defecto C** (`GET /api/Objetivoes` oculta competencias con `PeriodoId`, estado o
  grupo inválidos — las competencias 71–76) tiene la misma naturaleza: el catálogo que
  muestra la pestaña es el que el API deja ver. Que una competencia huérfana no aparezca
  en pantalla **no** prueba que no exista.
- **El recorrido no valida los datos de negocio**, solo el comportamiento de la pantalla.
  Que el diagnóstico liste N puestos sin competencias no significa que N sea el número
  correcto: significa que la pantalla llegó a N con la información que el API le dio. La
  reconciliación con las consultas SQL de
  `Docs/proceso-configuracion-competencias-periodo8.md` es un paso aparte.
- **En modo solo lectura no se demuestra que las escrituras funcionen.** Alta múltiple,
  edición, borrado, ejecución del clonado y marcado de la matriz quedan sin verificar, y
  así se registran. La ejecución en modo escritura es imprescindible para dar por
  cubiertos los criterios 2, 3 y 4 del plan.
- **La ponderación nunca se guarda.** Se demuestra que el botón *Guardar* se bloquea
  cuando la suma no da 100, que es la mitad del criterio 5; que un guardado válido llegue
  a la base no se prueba en este recorrido, para no alterar el cálculo de las
  evaluaciones en curso del periodo activo.
- **Un solo periodo.** El recorrido trabaja sobre el periodo activo que preselecciona el
  shell. El comportamiento con periodos cerrados o sin catálogo se cubre solo si el
  periodo elegido cae en ese caso.
- **Entorno de prueba, no producción.** Lo verificado aquí vale para
  `Evaluaciones_Test` a través del API `:7071`. Producción tiene otros datos y, en el
  momento de escribir esto, QA está usando el sitio de prueba desplegado: este recorrido
  corre contra `ng serve` en local, no contra `evaluacionempleado-prueba`.

---

## 6. Ejecuciones

> Pegar aquí el bloque que imprime el guion al terminar (también queda guardado en
> `e2e/capturas-crud-competencias/resumen-<modo>-<sello>.md`). Se espera al menos una
> ejecución en cada modo.

### 6.1 Modo solo lectura

_Pendiente._

### 6.2 Modo escritura

_Pendiente._

### 6.3 Guard con usuario real de rol 2 / 3

_Pendiente_ — ver el procedimiento en §4.1.

---

## 7. Documentos relacionados

- `Docs/crud-competencias/00-Plan-General.md` — criterios de aceptación
- `Docs/crud-competencias/01-Fases-y-Tareas.md` — §T3.3 y notas de la Fase 1
- `Docs/crud-competencias/04-Defectos-API.md` — los defectos que la pantalla rodea
- `Docs/proceso-configuracion-competencias-periodo8.md` — consultas SQL de referencia
- `e2e/crear-competencia.spec.js` — guion de referencia del que se toma el patrón
