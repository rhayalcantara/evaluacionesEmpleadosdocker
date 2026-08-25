# Auditoría de verificación — CRUD de Competencias (T3.3)

**Proyecto:** Sistema de Evaluación de Empleados (COOPASPIRE)
**Rama:** `feature/crud-competencias`
**Tarea:** T3.3 de `Docs/crud-competencias/01-Fases-y-Tareas.md`
**Criterio de aceptación cubierto:** nº 9 de `Docs/crud-competencias/00-Plan-General.md`
**Guion:** `e2e/crud-competencias.spec.js`
**Guiones auxiliares de diagnóstico:** `e2e/diag-rol.spec.js`, `e2e/diag-guard.spec.js`,
`e2e/diag-filtro-depto.spec.js`
**Capturas:** `e2e/capturas-crud-competencias/`, **una subcarpeta por corrida** (§4.5)
**Corridas auditadas:** **cinco**, todas en modo **ESCRITURA** el 2026-08-25 (§5).
**Corrida de cierre — la evidencia autorizada:** la **quinta (14:36–14:40), 12 de 12**, única
que ejerce los nueve criterios, con la escritura de la ponderación incluida. Capturas en
`e2e/capturas-crud-competencias/escritura-20260825143621/`; salida completa en §11.
**Estado: cerrado.**

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

Y, con el mismo peso: **que la pantalla enseñe los dos defectos del API en lugar de
taparlos** (`Docs/crud-competencias/04-Defectos-API.md`).

> **Resultado en una línea:** la corrida de cierre salió **12 de 12, sin problemas y sin
> residuo en la base** (§5.5, §11). **Los siete criterios del alcance quedan cerrados**,
> incluido el 5 —fijar la ponderación—, que hasta la última corrida solo tenía verificada la
> lectura y el bloqueo, pero **no la escritura**, que es lo que el verbo describe (§9.1). El
> trabajo además **confirmó en vivo el defecto A del API** —catorce filas creadas
> por pantalla que el API siguió sin listar (§7)— y **cerró el criterio 6 contra SQL, cifra a
> cifra** (§8.6). Produjo **cinco veredictos negativos: los cinco fallos del guion de
> verificación, ninguno del sistema** (§2); los cinco están corregidos.

---

## 2. Cómo leer este documento: aplicación vs. SQL

Las dos fuentes de evidencia **no se mezclan** en ningún punto de este informe:

| Marca | Qué significa |
|---|---|
| 🖥️ **APP** | Observado en la aplicación por el guion de Playwright, con captura. Es lo que ve un usuario. Está sujeto a lo que el API decida devolver. |
| 🗄️ **SQL** | Consultado directamente contra `Evaluaciones_Test` por el orquestador, fuera del guion. Es la única fuente que no pasa por el filtro del API. |

Cuando 🖥️ y 🗄️ discrepan, manda 🗄️.

### Fiabilidad de la propia verificación

Esta separación no es formalismo, y conviene decir el dato incómodo antes que ninguna otra
cosa, porque le sirve a quien repita este trabajo:

> **De los cinco veredictos negativos que ha producido este recorrido en cinco corridas, los
> cinco han sido fallos del guion de verificación. Ninguno ha sido un defecto del sistema.**

| Veredicto negativo | Corrida | Causa real |
|---|---|---|
| "El API no procesó el alta múltiple" | 1ª | El guion escribía en un puesto que el API no puede listar: relectura ciega |
| "El clonado no creó nada" | 1ª | La misma relectura ciega |
| "El `RoleGuard` no bloquea" | 1ª | Degradaba el rol sin salir de la ruta: Angular no reejecuta el guard, nunca corrió |
| "El filtro «solo ocupados» devuelve 1 y la franja declara 90" | 2ª (cierre) | Medía con el filtro de texto de un paso anterior aún puesto: 1 era la intersección correcta |
| El filtro por departamento "no responde" (90 min colgado) | 3ª (abortada) | El `<mat-label>` intercepta el puntero y Playwright se niega a pulsar; **un clic real sí abre el desplegable** |

Los cinco tienen la misma forma: **el guion midió otra cosa distinta de la que creía medir,
o no pudo medir, y en ambos casos la culpa recayó en el sistema**. Es el modo de fallo
dominante de una verificación automatizada, muy por encima de encontrar defectos reales.

**La lección práctica: ante un fallo reportado por este recorrido, la primera hipótesis debe
ser el guion**, y solo se escala al sistema cuando 🗄️ SQL —o una interacción manual— lo
confirma. Las cinco causas están corregidas (§6) y cada una dejó su comentario de
advertencia en el punto exacto del código donde se cometió.

### El caso del filtro por departamento: una distinción que hay que interiorizar

El quinto merece apartado propio porque enseña algo que no es evidente y que va a volver a
pasar:

> **Que Playwright no pueda pulsar un elemento no significa que un usuario no pueda.**

Antes de pulsar, Playwright comprueba que el elemento sea "accionable": visible, estable,
habilitado y —la clave aquí— **que sea él quien reciba el evento en el punto del clic**. En
un `mat-form-field appearance="outline"` cuya etiqueta no ha flotado, el `<mat-label>` del
subárbol `mdc-notched-outline` queda sobre el centro del campo. Playwright ve que el evento
lo recibiría la etiqueta, se niega a pulsar y **reintenta**. Sin `actionTimeout` configurado,
reintenta indefinidamente.

Lo que zanjó la clasificación (`e2e/diag-filtro-depto.spec.js`):

| Prueba | Resultado |
|---|---|
| `mat-select` visible, habilitado, sin overlays, caja 198×24 en (60,511) | ✅ el elemento está bien |
| `elementFromPoint` en el centro | `<mat-label>Departamento</mat-label>` — **intercepta** |
| `locator.click()` | ❌ reintenta para siempre |
| `.mat-mdc-select-trigger` | ❌ igual |
| `focus()` + **Enter** | ✅ abre, **45 opciones** |
| **`page.mouse.click`** en el mismo punto | ✅ abre, **45 opciones** |

Las dos últimas filas son el veredicto: **una persona sí puede usar el filtro**. No es
defecto de la pantalla; es un artefacto de la herramienta de verificación. Reportarlo como
defecto habría mandado a alguien a "arreglar" una pantalla que funciona.

El guion abre ahora **todos** sus `mat-select` por teclado, con clic real de ratón como
respaldo (`abrirSelect`), y el porqué está escrito en el código para que nadie lo
"simplifique" de vuelta a `.click()`.

---

## 3. Entorno exacto

| | |
|---|---|
| **Aplicación** | local, `ng serve --configuration prueba` |
| **URL** | `http://localhost:4300/evaluacionempleado-prueba` |
| **API** | `http://192.168.7.222:7071` (entorno de **prueba**) |
| **Base de datos** | `Evaluaciones_Test` |
| **Ruta verificada** | `/configuracion-competencias` (`AuthGuard` + `RoleGuard`, `roles: [RolUsuario.Admin]`) |
| **Menú** | Configuración → "Configuración de Competencias" |
| **Periodo** | **Evaluación de Mitad de año 2026** (periodo 8), el activo, preseleccionado por el shell. El paso 10 usa además el periodo **cerrado** *Final 2024* para la prueba de escritura de la ponderación |
| **Usuario** | administrador (rol 1, `empleadoSecuencial` 525). Credenciales por `EVAL_USERNAME` / `EVAL_PASSWORD`, nunca en el repositorio |
| **Modo** | `EVAL_ESCRITURA=1` en las **cinco** corridas auditadas |
| **Marca de la ejecución** | Una por corrida, `[E2E-<sello>]`; la de la corrida de cierre fue `[E2E-20260825143621]` |
| **Playwright** | 1.60.0, en **headless** con `playwright.headless.config.js` · la corrida de cierre tardó **4,5 min** (la primera, 2,2) · **0 errores de JavaScript en consola** |

**Producción quedó excluida por diseño.** El guion aborta antes de arrancar si `EVAL_BASE`
apunta a `:7070` o a `http://192.168.7.222/evaluacionempleado`.

---

## 4. Método

### 4.1 Dos modos de ejecución

| Modo | Cómo se activa | Qué hace |
|---|---|---|
| **Solo lectura** *(por defecto)* | `EVAL_ESCRITURA` ausente o distinto de `1` | Recorre, captura y verifica todo lo que no escriba, **incluida la previsualización del clonado**. Los pasos que escriben quedan como *"omitido por modo lectura"*. |
| **Escritura** | `EVAL_ESCRITURA=1` | Todo lo anterior **más** alta múltiple, edición de peso, borrado, ejecución del clonado, marcado de la matriz y **escritura de la ponderación sobre un periodo cerrado**. Cada operación se deshace al terminar. |

**Invocación exacta con la que se corrió la corrida de cierre** — headless, con su config propia y
las tres variables de entorno. No es `npx playwright test …` a secas: sin el config headless
se abre ventana, y sin `EVAL_BASE` el guion apunta al puerto por defecto:

```powershell
# 1) La aplicación, en otra terminal
ng serve --configuration prueba --port 4300

# 2) Credenciales y destino — nunca en el repositorio
$env:EVAL_USERNAME  = "<usuario admin>"
$env:EVAL_PASSWORD  = "<clave>"
$env:EVAL_BASE      = "http://localhost:4300/evaluacionempleado-prueba"

# 3) Modo escritura (quitar la variable para el recorrido de solo lectura)
$env:EVAL_ESCRITURA = "1"

# 4) El recorrido, sin ventana de navegador
npx playwright test e2e/crud-competencias.spec.js --config=playwright.headless.config.js
```

Los diagnósticos auxiliares se lanzan igual, cambiando el archivo del final por
`e2e/diag-rol.spec.js`, `e2e/diag-guard.spec.js` o `e2e/diag-filtro-depto.spec.js`.

### 4.2 Reglas del recorrido

- **Comprobaciones reales, no pantallazos.** Cada paso afirma algo verificable además de
  dejar su captura.
- **Nada se da por bueno por un HTTP 200:** después de cada escritura el guion relee del
  API y comprueba sobre lo releído.
- **Un fallo no aborta el recorrido:** se registra con `issue()` y se sigue.
- **El recorrido no puede colgarse.** Tres barreras: 15 s por acción, 10 min por paso (20 el
  Diagnóstico), 40 min por test. Al vencer se registra el problema, se recupera el navegador
  y se pasa al paso siguiente. Cada paso informa de su duración.
- **Los `mat-select` se abren por teclado o con clic real de ratón**, nunca con
  `locator.click()`: la etiqueta flotante intercepta el puntero y Playwright no pulsa (§2).
- **Credenciales solo por `process.env`.**

### 4.3 Dónde tiene permitido escribir el guion — y por qué cambió

> Este apartado es la corrección más importante que salió de la corrida. Está escrito con
> detalle a propósito, para que nadie lo revierta por parecer una restricción arbitraria.

**Criterio ANTERIOR (defectuoso).** Lista blanca fija de dos puestos **grises**: el 94
(ABOGADO JUNIOR) y el 102 (OFICIAL DE NEGOCIOS FLOTANTE), elegidos porque
`04-Defectos-API.md` §A los documenta como los únicos grises *genuinamente vacíos*. La
intención era buena —escribir donde no se pueda duplicar nada— pero el razonamiento tenía
un agujero fatal: **son grises porque tienen departamento 0**, es decir, son exactamente
los puestos cuyas metas los cuatro GET de `/api/Goals` no devuelven. Escribir ahí y
"verificar" releyendo del API es releer ciego: la pantalla dirá 0 se haya creado algo o no.

**Consecuencia real, medida** (ver §7): el guion escribió correctamente 14 filas, leyó 0,
las reportó como "el API no procesó" y, al no ver nada que borrar, dejó las 14 en la base.

**Criterio ACTUAL.** No hay lista fija. El puesto de escritura se elige en tiempo de
ejecución exigiendo cuatro condiciones:

1. **departamento válido** (`departmentSecuencial <> 0`) — para que la relectura signifique
   algo. Los grises quedan excluidos por definición.
2. **cero competencias en el periodo según el API** — y con departamento válido ese cero
   **sí** es de fiar, así que no hay nada que duplicar.
3. **sin empleados activos**, para que las filas transitorias no entren en la evaluación de
   nadie. El conjunto de puestos ocupados se obtiene del propio filtro "solo puestos
   ocupados" de la pantalla, y se contrasta con el contador del shell.
4. **fuera de `PUESTOS_PROHIBIDOS`**, que sigue conteniendo el **puesto 19**
   (GERENTE GESTION HUMANA): tiene 12 metas que el API no devuelve, y crearle competencias
   por pantalla lo dejaría con 24.

En el periodo 8 hay 191 puestos en rojo "sin competencias", la mayoría con departamento
válido: candidatos de sobra. La regla en una frase, que es como está escrita en el código:
**escribir donde el API no lee convierte la verificación en teatro.**

### 4.4 Cómo se deshace lo que se escribe

| Operación | Cómo se revierte |
|---|---|
| Alta múltiple | Las descripciones llevan la marca `[E2E-<sello>]`; el paso 7 borra **solo** esas filas y lo confirma releyendo. |
| Edición de peso | Se anota el peso original y se restaura, verificando que la cabecera vuelve al valor de partida. |
| Clonado | Solo se ejecuta contra un puesto verificable que estaba vacío y con menos de 20 filas a crear; todo lo que aparezca después se borra. |
| Matriz de categorías | Se marca una casilla que estaba desmarcada y se vuelve a desmarcar, comprobando la relectura en los dos sentidos. |
| Ponderación | **No se escribe nunca**: solo se comprueba que *Guardar* se deshabilita. |
| Rol (paso 12) | Se guarda el valor original de `localStorage["rol"]` y se restaura. |

**Nuevo en los pasos 7 y 8:** si el API dijo haber creado filas y la relectura no las ve,
el guion **ya no concluye "no hay nada que borrar"**. Registra un problema de categoría
`Limpieza` con la consulta SQL exacta para localizarlas por su marca, porque *no verlas no
es que no existan*. Es la lección directa de esta corrida.

### 4.5 Atribución de las capturas: una subcarpeta por corrida

Cada corrida escribe **en su propia subcarpeta**, nombrada por modo y sello, junto con su
resumen. La captura es lo que respalda cada veredicto de este documento, así que tiene que
poder atribuirse a una corrida concreta sin ambigüedad.

```
e2e/capturas-crud-competencias/                  15 MB en total
├── escritura-20260825143621/     ← CORRIDA DE CIERRE: 42 capturas + su resumen.
│                                   Es la evidencia autorizada (§5.5, §11)
├── diagnosticos/                 ← evidencia de los diag-*.spec.js
│   ├── diag-rol.png              ·  por qué no salía el menú de administrador
│   ├── diag-depto-fallo-clic.png ·  el filtro que Playwright no podía pulsar
│   └── guard-verificado.png      ·  el RoleGuard bloqueando con rol 2
└── historico/                    ← corridas anteriores
    ├── resumen-escritura-20260825120710.md          (1ª corrida, §5.1)
    ├── resumen-escritura-20260825121944.md          (2ª corrida, §5.2)
    ├── resumen-escritura-20260825141216.md          (4ª corrida, §5.4 — solo el resumen)
    ├── primera-corrida-20260825120710-parcial/      24 capturas
    └── cierre-20260825121944-parcial/                3 capturas
```

**Por qué las dos carpetas del histórico dicen "parcial", y por qué importa.** Hasta la cuarta
corrida, todas escribían en la misma carpeta y con la misma numeración. Los
nombres colisionaban (`07-filtros-aplicados.png` de una corrida junto a
`07-filtro-solo-ocupados.png` de otra; `08-` y `09-` repetidos) y cada corrida
**sobrescribía** las capturas homónimas de la anterior. El resultado eran 71 PNG de tres
corridas mezclados en los que **ninguna imagen era atribuible con certeza**.

Lo que se conserva de las dos primeras corridas es solo lo que sobrevivió sin ser
sobrescrito —de ahí "parcial"—, y se guarda porque incluye evidencia que no se puede
reproducir: las capturas del paso 5 de la primera corrida son la prueba visual del defecto A
(la pantalla mostrando 0 competencias justo después de que el API dijera haber creado 2).
Las imágenes que sí fueron sobrescritas se eliminaron en vez de dejarlas fingiendo pertenecer
a una corrida que no era la suya. **Por eso §5.1 y §5.2 no citan nombres de captura**: su
evidencia son sus resúmenes y, en el caso de §5.1, la reconciliación por SQL de §7.

**De la cuarta corrida se conserva solo el resumen.** Sus 39 capturas eran casi idénticas a
las 42 de la corrida de cierre, que la supera en cobertura, así que mantener las dos series
habría duplicado 8,5 MB de imágenes equivalentes sin añadir evidencia. Las capturas de la
primera corrida sí se conservan, porque documentan algo que no se repite: el defecto A
ocurriendo en vivo.

---

## 5. Resultados

Hubo **cinco corridas**, todas en modo escritura el 2026-08-25. Este cuadro las sitúa; cada
una tiene su apartado abajo.

| # | Corrida | Resultado | Qué aportó |
|---|---|---|---|
| 1ª | 12:07 (§5.1) | 8 de 12 | Destapó el **defecto A en vivo**: 14 filas creadas por pantalla que el API siguió sin listar (§7). Tres de sus cuatro "fallos" eran del guion |
| 2ª | 12:19 (§5.2) | 11 de 12 | Cerró el borrado y el clonado. Su único "fallo" también era del guion |
| 3ª | — (§5.3) | **abortada** | Se colgó 90 min en el filtro por departamento. **Cero informe**: el peor resultado posible |
| 4ª | 14:12 (§5.4) | 12 de 12 | Confirmó las cinco correcciones. Pero el guion **aún no probaba la escritura de la ponderación**: cubría ocho de los nueve criterios |
| **5ª** | **14:36 (§5.5)** | **12 de 12** | **Corrida de cierre autorizada.** La única que ejerce **los nueve criterios**, con la ponderación escribiendo de extremo a extremo |

> **La evidencia autorizada de esta auditoría es la de la 5ª corrida**, en
> `e2e/capturas-crud-competencias/escritura-20260825143621/`, reproducida en §11. Las
> anteriores se conservan como histórico porque documentan hallazgos que no se repiten —el
> defecto A y los cinco falsos negativos del guion—, no porque respalden el veredicto final.

### 5.1 Primera corrida (12:07) — 8 de 12 · la que destapó el defecto A

Es la corrida documentada paso a paso, porque es la que produjo la evidencia del defecto A.
Veredictos **corregidos** respecto de la salida cruda del guion: los pasos 5, 8 y 12 se
reportaron como fallos y ninguno lo era. La columna *Veredicto* dice qué pasó de verdad; la
columna *Reportó el guion* conserva lo que dijo, para trazabilidad.

**Resumen crudo del guion:** 8 correctos, 3 con problemas, 1 omitido. **Auditado:** 10
correctos, 2 con la escritura confirmada por SQL pero la verificación en pantalla inválida,
1 sin ejecutar. Cero defectos del sistema.

| # | Paso | Reportó el guion | **Veredicto auditado** |
|---|---|---|---|
| 1 | Login y navegación por el menú | Correcto | 🖥️ **Correcto.** Login OK, menús de administrador visibles, pantalla "Configuración de Competencias" abierta desde el menú. |
| 2 | Selector de periodo | Correcto | 🖥️ **Correcto.** Ofrece los 3 periodos y preselecciona el activo: *"Evaluación de Mitad de año 2026 — activo"*. Exactamente uno marcado como activo. |
| 3 | Franja de resumen del shell | Correcto | 🖥️ **Correcto.** Periodo, Estado = Activo, **10** puestos con competencias, **90** puestos con empleados activos. Aviso de periodo activo presente. |
| 4 | Pestaña **Competencias por puesto** | Correcto | 🖥️ **Correcto.** 209 puestos leídos recorriendo el paginador; conteo declarado por la pantalla idéntico. Semáforo: **191 vacíos, 10 en ámbar, 8 grises, ningún verde** — lo esperado en el periodo 8. Los cuatro filtros presentes y efectivos. Aviso del punto ciego presente y remite a SQL. Detalle de *ADMINISTRADOR BASE DE DATOS (DBA)* (#6): 11 competencias, peso 99, coincide con el listado. |
| 5 | **Alta múltiple** | ⚠️ *"Se pidieron 2 altas y al releer hay 0… el API responde 200 sin procesar"* | 🗄️ **La escritura funcionó. El veredicto del guion era falso.** Se crearon las filas `Goal` **11372** y **11373** (puesto 94, periodo 8, con la marca `[E2E-20260825120710]`). El guion escribió sobre un puesto **gris**, cuyas metas el API no lista, así que releyó ciego. Fallo del guion, no del sistema. **Corregido** (§4.3). |
| 6 | **Edición de peso → semáforo verde** | Correcto | 🖥️ **Correcto, y es la prueba del criterio 1.** Puesto #6 en ámbar con peso 99; se subió una fila de 9 a 10; el total pasó a **100** y el semáforo **de ámbar a verde**, confirmado también en el listado tras releer. Peso restaurado a 99: la base quedó como estaba. |
| 7 | **Borrado con confirmación** | Omitido: *"el paso 5 no creó ninguna fila"* | ❌ **No se ejecutó, y ese es el daño real del fallo del paso 5.** Como no veía filas, se saltó la limpieza y dejó 14 filas en la base. El borrado en sí **queda sin verificar en esta corrida**. Ver §8. |
| 8 | **Clonado** | ⚠️ *"El clonado dijo haber creado filas pero al releer el puesto sigue vacío"* | 🖥️ **Previsualización: correcta.** *Ejecutar* nace deshabilitado; las tres cifras salen (**12** se crearían / **791** se saltan / **1** advertencia); se muestran las tres advertencias, incluida la del punto ciego (*"Hay 115 puesto(s) que el API no puede listar… sus metas quedan fuera de esta comparación"*) y exige marcar "He leído las advertencias". 🗄️ **Ejecución: también funcionó.** Creó las filas `Goal` **11374 a 11385** (12 filas). Mismo fallo de relectura ciega que el paso 5. **Corregido.** |
| 9 | Pestaña **Catálogo y categorías** | Correcto | 🖥️ **Correcto — criterio 4 cumplido.** Catálogo de 12 competencias en 4 grupos, 41 vínculos; matriz de 12 × 7 categorías. Se marcó *"Orientación al Socio y a Resultados"* × *PROFESIONAL SENIOR*: **el vínculo se creó y la relectura lo confirmó**; al desmarcarlo, **se borró y la relectura lo confirmó**. Estado original restaurado. |
| 10 | Pestaña **Ponderación** | Correcto | 🖥️ **Correcto.** Periodo en **30 % Desempeño / 70 % Competencia**, suma 100. Con Desempeño = 55 la pantalla marca *"Suma: 125 — debe ser exactamente 100 para poder guardar"* y **deshabilita Guardar**. Nunca se pulsó Guardar: la base no se tocó. |
| 11 | Pestaña **Diagnóstico** | Correcto | 🖥️ **Correcto — criterio 6 cumplido.** Contexto: 455 empleados activos, 90 puestos ocupados, 103 competencias listadas. Listado 1: **72**; listado 2: **0**; listado 3: **444**. Bloque de no verificables aparte con **8** puestos (**94, 255, 33, 69, 19, 102, 249, 221**), su advertencia y su consulta SQL. **El puesto 19 aparece**: el defecto A se muestra, no se esconde. Los **115** puestos ciegos coinciden con `04-Defectos-API.md` §A. El listado 2 en 0 confirma que la pantalla no se cree el cero del defecto B (habría marcado 209). |
| 12 | **Guard de seguridad** | ⚠️ *"Con rol 2 la pantalla se abrió igualmente: el RoleGuard no bloqueó"* | 🖥️ **Falso positivo. El guard sí bloquea.** El guion degradaba el rol estando **ya** en `/configuracion-competencias` y volvía a navegar a esa misma ruta; Angular no reejecuta los guards al navegar a la ruta en la que ya estás, así que no hubo navegación y el guard nunca corrió. Verificado aparte con `e2e/diag-guard.spec.js`: saliendo primero a Home y entrando después por el menú, con rol 2 **la pantalla no se abre**, se queda en Home y sale *"Acceso Denegado — No tiene permisos para acceder a esta página"*. **Corregido.** |

### 5.2 Segunda corrida (12:19) — 11 de 12 · con las tres primeras correcciones

Ejecutada tras aplicar las correcciones 1 a 3 de §6. **11 pasos correctos de 12, ninguno
omitido, 1 con problemas.**

Lo que esta corrida añadió respecto de la primera:

- 🖥️ **La selección dinámica del puesto de escritura funcionó**: eligió *ABOGADA DE COBROS
  LEGAL* (**#92**, departamento CREDITO, LEGAL Y COBROS) — un puesto con departamento válido
  y vacío, es decir, uno donde **la relectura del API sí verifica algo**. Era exactamente el
  objetivo de la corrección.
- 🖥️ **El paso 7 (borrado con confirmación) se ejecutó y quedó verificado.** Es la mitad del
  criterio 2 que la primera corrida no llegó a probar, y la carencia que motivó todo el
  rediseño (`metas.component.ts:127`, donde `delete()` nunca llamaba al API).
- 🖥️ **La ejecución del clonado quedó verificada contra la aplicación**, no solo por SQL.
- 🖥️ **El guard quedó verificado dentro del recorrido**, sin necesitar el guion auxiliar.

**El único problema reportado fue, otra vez, del guion.** Secuencia del log del paso 4:

```
"Solo puestos sin competencias": 209 en total → 100 en la primera página
Filtro por texto "ADMINISTRADO": 2 fila(s)
"Solo puestos ocupados": 1 puesto(s)
⚠️ [Filtro] El filtro "solo ocupados" devuelve 1 puestos y la franja declara 90
```

El interruptor se activaba **sin limpiar el filtro de texto que el helper `abrirPuesto`
había dejado puesto** al abrir el detalle de *ADMINISTRADOR BASE DE DATOS (DBA)*. Ese `1`
es la intersección correcta de los dos filtros activos; compararlo contra los 90 de la
franja de resumen no tiene sentido. **El paso 4 pasa a correcto: los cuatro filtros
funcionan.**

Verificado leyendo el código, no por suposición:

| Filtro | ¿Estaba aislado? | Por qué |
|---|---|---|
| "Solo puestos sin competencias" | ✅ sí | Es el primer filtro que se toca en todo el paso; los demás están vírgenes |
| Filtro por texto | ✅ sí | Va precedido de un clic en "Limpiar" |
| "Solo puestos ocupados" | ❌ **no** | `abrirPuesto` hace `filtro.fill(...)` y nunca lo borra; cerrar el detalle tampoco |
| Filtro por departamento | — | **No se probaba en absoluto** (encontrado al revisar) |

**Consecuencia secundaria, no detectada en su momento:** ese mismo descuido dejó
`ctx.ocupados` —el conjunto de puestos ocupados que el paso 5 usa para no escribir donde
hay gente evaluándose— **con un solo elemento**. La condición "sin empleados activos" quedó
inerte, y el puesto #92 salió elegido por orden de lista, no por cumplir la regla. El riesgo
era acotado (el guion exige detalle vacío antes de escribir y borra lo que crea), pero
durante unos segundos pudo haber filas transitorias en un puesto ocupado del periodo activo.
La corrección lo elimina, y ahora el guion **registra explícitamente en el log si el puesto
elegido está ocupado**, y lo marca como problema de método si no encontró ninguno vacante.

### 5.3 Tercera corrida — abortada por cuelgue, sin informe

**No produjo informe.** Se quedó parada **90 minutos** en la sub-prueba d.4, la del filtro
por departamento, y hubo que matarla.

La causa está en §2: el `<mat-label>` intercepta el puntero, Playwright se niega a pulsar y
reintenta sin límite, porque el guion corría con `test.setTimeout(0)` y sin `actionTimeout`
configurado. No es defecto de la pantalla —un clic real de ratón abre el desplegable y
muestra sus 45 opciones—, pero sí es el peor resultado posible del recorrido:

> **Un recorrido de auditoría que se cuelga es peor que uno que falla.** El que falla deja
> evidencia de todo lo que sí funcionaba; el que se cuelga no deja nada, y además consume
> el tiempo de quien lo lanzó sin decirlo.

De ahí la corrección 6 de §6: tres barreras de tiempo, y que al vencer se **registre el
problema y se siga con el paso siguiente** en vez de morir.

### 5.4 Cuarta corrida (2026-08-25 14:12–14:16) — 12 de 12, pero sin la prueba de la ponderación

Alcanzó **12 de 12, 0 parciales, 0 problemas, 0 omitidos, 0 errores de JavaScript**, en
3,9 min, con la marca `[E2E-20260825141216]`. Confirmó que las cinco correcciones del guion
funcionaban: ninguno de los cinco falsos negativos volvió a aparecer, los cuatro filtros ya
aislados dieron números exactos y el filtro por departamento se abrió con sus 45 opciones sin
colgarse. 🗄️ La base quedó idéntica (7.921 filas en `Goal`, 115 en el periodo 8, cero con
marca E2E).

**Pero no es la corrida de cierre**, y conviene ser preciso sobre por qué: en ese momento el
guion **todavía no probaba la escritura de la ponderación**, así que sus 12 de 12 cubrían
ocho de los nueve criterios. El 5 seguía abierto (§9.1). Es la última corrida en la que este
documento se adelantó a su propia evidencia.

Sus capturas se han eliminado —eran casi idénticas a las de la corrida de cierre, que las
supera en cobertura— y **se conserva su resumen** en
`e2e/capturas-crud-competencias/historico/resumen-escritura-20260825141216.md`.

### 5.5 Corrida de cierre (2026-08-25 14:36–14:40) — 12 de 12 **con la ponderación ejercida**

**Es la corrida autorizada de esta auditoría.** Se lanzó tras añadir al guion la prueba de
escritura de la ponderación y el endurecido de §6.1.

| | |
|---|---|
| **Pasos correctos** | **12 de 12** |
| Parciales · Con problemas · Omitidos | 0 · 0 · 0 |
| Problemas registrados | 0 |
| Errores de JavaScript en consola | 0 |
| Duración | 4,5 min |
| Marca | `[E2E-20260825143621]` |
| Capturas | **42**, en `e2e/capturas-crud-competencias/escritura-20260825143621/` |

**Por qué esta y no la anterior:** es **la única de las cinco que ejerce los nueve criterios
de aceptación**. Las tres capturas nuevas del paso 10
(`34-ponderacion-periodo-cerrado.png`, `35-ponderacion-guardada-verificada.png`,
`36-ponderacion-restaurada-verificada.png`) son justamente la evidencia que faltaba: la ruta
de **escritura** de la ponderación, que es lo que el verbo "fijar" del criterio 5 describe.

Lo que hizo el paso 10, sobre el periodo **cerrado** *Evaluación de Desempeño Final 2024*:

| | 🖥️ Observado |
|---|---|
| Valores originales | 30 / 70 |
| Se guardó | **40 / 60** — *"La ponderación del periodo quedó guardada: 40% Desempeño / 60% Competencia (verificado releyendo del API)"* |
| Relectura del API | **40 / 60**, coincide con lo pedido |
| Se restauró | **30 / 70**, y la relectura volvió a confirmarlo |
| Shell devuelto | *"Evaluación de Mitad de año 2026 — activo"*, para que el paso 11 diagnosticara sobre el periodo correcto |

🗄️ **Comprobado además por SQL:** los **tres periodos quedaron en 30 / 70** y la base quedó
idéntica. La prueba no dejó residuo y no tocó el reparto de ningún periodo, ni siquiera el
cerrado sobre el que se hizo.

El resto de las cifras son idénticas a las de la corrida anterior —mismos 199/90/2/2/1 en los
filtros, mismo puesto #92 elegido, mismos 72/0/444 y 8 no verificables en el diagnóstico—, lo
que además da una señal útil: **el recorrido es reproducible**, no depende del azar de una
ejecución. La salida completa está en §11.

---

## 6. Correcciones aplicadas al guion

Las seis están en `e2e/crud-competencias.spec.js`: las tres primeras salen de la corrida
inicial, la cuarta de la de cierre, y las dos últimas del cuelgue de la tercera. Cada una
dejó un comentario de advertencia en el punto exacto del código donde se cometió el error,
para que no se revierta por parecer una restricción arbitraria.

| # | Fallo del guion | Corrección |
|---|---|---|
| 1 | Lista blanca de escritura formada por puestos **grises**, cuyas metas el API no lista: la relectura de verificación era ciega por construcción. | Eliminada la lista fija. El puesto se elige en ejecución exigiendo departamento válido, cero competencias, sin empleados activos y fuera de prohibidos (§4.3). El motivo queda escrito en el código, con los ids de las filas huérfanas, para que no se revierta. |
| 2 | El paso 7 concluía *"no hay nada que borrar"* cuando no veía filas, y por eso dejó 14 en la base. | Si el API dijo haber creado y la relectura no lo confirma, se registra un problema de categoría `Limpieza` con la consulta SQL para localizarlas por su marca, y el paso se marca omitido **con la advertencia**, nunca como "nada pendiente". Misma red en la limpieza del clonado. |
| 3 | El paso 12 degradaba el rol estando ya en la ruta protegida: sin navegación real el guard no corre, y lo reportaba como agujero de seguridad. | Ahora sale primero a **Home** (enlace "Inicio" del navbar, con `goto` de respaldo), y solo entonces degrada el rol y entra por el menú. Si no consigue salir de la pantalla, aborta el paso como no concluyente en vez de dar un veredicto. Corregido también el texto del `issue`, que hablaba de "URL directa". |
| 4 | El paso 4 encadenaba filtros sin limpiar: medía intersecciones y las comparaba contra totales. Además dejaba `ctx.ocupados` corrupto, desactivando en silencio una garantía del paso 5. | Los filtros se prueban **aislados**, con un helper `limpiarFiltros()` antes y después de cada uno, y se comparan contra **números exactos calculados del listado sin filtros**, no contra "menos que antes". Se añade la prueba del **filtro por departamento**, que no se ejercitaba. Se añade una prueba **explícita de combinación** con la expectativa correcta (intersección). Tras el detalle se limpia siempre, porque `abrirPuesto` deja el filtro de texto puesto. |
| 5 | `locator.click()` sobre un `mat-select` cuya etiqueta intercepta el puntero: Playwright no pulsa nunca. Colgó la tercera corrida. | Helper **`abrirSelect`**, que abre por **teclado** (`focus` + `Enter`), con **clic real de ratón** en el centro de la caja como respaldo y `click({force:true})` como último recurso. Se aplica a **los cinco `mat-select` del recorrido** —periodo del shell, tamaño de página del paginador, filtro por departamento y puesto de destino del clonado—, no solo al que falló. Helper gemelo **`elegirOpcion`** para pulsar la opción del panel. Solo si ninguna vía abre el panel se registra un problema, y ahí sí apuntaría a la pantalla. |
| 6 | El guion podía colgarse indefinidamente: `test.setTimeout(0)` y sin `actionTimeout`. Noventa minutos parado y **cero informe**. | **Tres barreras de tiempo**: `page.setDefaultTimeout(15 s)` por acción, `page.setDefaultNavigationTimeout(60 s)`, un **presupuesto de 10 min por paso** (20 min para el Diagnóstico, que hace ~90 llamadas secuenciales) y un tope de 40 min para el test. Al vencer un presupuesto **se registra el problema con categoría `Tiempo`, se recupera el navegador —cerrando SweetAlerts, overlays y diálogos— y se continúa con el paso siguiente**. Además, cada paso informa de su duración y el resumen destaca los que pasan de 2 minutos, para ver venir el próximo cuelgue antes de que lo sea. |

Mejoras de precisión que vinieron con la cuarta corrección:

- Todas las mediciones de filtros usan ahora `leerTodasLasFilas` (recorre el paginador), no
  la primera página. La afirmación *"209 en total → 100 en la primera página"* comparaba un
  total contra un tamaño de página; ahora se exige el número exacto (199 puestos con cero
  competencias, por ejemplo).
- El filtro por departamento se valida en dos sentidos: que devuelva el número esperado y
  que **no deje pasar** ningún puesto de otro departamento.
- `ctx.ocupados` se inicializa como conjunto vacío y se documenta para qué sirve, de modo que
  un fallo temprano del paso 4 no pueda volver a desactivar la garantía del paso 5 sin que
  se note.

### 6.1 Endurecido adicional, tras la cuarta corrida

Cambios que no vienen de un fallo observado sino de revisar dónde podría aparecer el
siguiente. Se aplicaron tras la cuarta corrida, así que **la de cierre es la primera que los
ejercita** — y salió limpia con ellos:

| Riesgo | Qué se hizo |
|---|---|
| Tres `waitForTimeout` fijos **antes de una aserción** (tras pulsar el menú, tras abrir una pestaña, y en el paso del guard). En un día lento del API se leía el DOM antes de que llegara el dato. | Se espera **al hecho**, no al reloj: `navMenu` espera a que cambie la URL *o* a que aparezca el aviso del guard, y admite un selector que pruebe que llegó; `irAPestana` espera a que aparezca la raíz de la pestaña (`.cp`, `.cat`, `.pnd`, `.dgn`) y avisa si no pinta en 30 s. |
| `esperarQuieto` tenía una carrera: esperaba 400 ms y, si aún no había barra de progreso, daba la pantalla por quieta. Si la petición tardaba 500 ms en arrancar, la espera era un **no-op**. | Dos fases: primero espera a que la barra **aparezca** (hasta 1,5 s), y solo después a que desaparezca. |
| Los botones de la tabla de detalle iban **por posición** (`nth(0)` editar, `nth(1)` eliminar) y el riesgo era destructivo: bastaba reordenar o añadir un botón para que el guion borrara creyendo que editaba. | Se localizan por su `matTooltip`, que el HTML ya trae como atributo estático (`BTN_EDITAR`, `BTN_ELIMINAR`, `BTN_GUARDAR_FILA`). Sin tocar `src/`. |
| El presupuesto por paso es un `Promise.race`, que **rechaza pero no cancela**: la acción huérfana sigue viva. | Queda documentado en el código. La barrera que de verdad protege es el timeout por acción de 15 s, que agota solo el trabajo huérfano en segundos; el presupuesto por paso es la red para bucles de muchas acciones cortas. Cancelar de verdad exigiría un `AbortSignal` en cada helper y no compensa. |
| Las capturas de todas las corridas caían en la misma carpeta y se sobrescribían. | Una **subcarpeta por corrida** (§4.5). |

---

## 7. Confirmación en vivo del defecto A del API

Esta corrida dejó de ser solo una verificación de la pantalla y se convirtió en la
**demostración empírica del defecto A**. Es el argumento más fuerte para el ticket del
backend, porque no es un razonamiento sobre el código: es una secuencia observada.

**Qué pasó, en orden:**

1. 🖥️ La pantalla mostró el puesto **94 (ABOGADO JUNIOR)** con **0 competencias** en el
   periodo 8, marcado en gris como *"Sin competencias (sin confirmar)"*.
2. 🖥️ El alta múltiple creó 2 competencias. El API respondió: *"Alta múltiple: se crearon
   2 competencia(s)"*.
3. 🖥️ El guion releyó el detalle del puesto: **0 filas**.
4. 🖥️ El clonado desde el periodo 7 creó 12 más. El API respondió: *"Clonado: se crearon
   12 competencia(s)"*.
5. 🖥️ El guion volvió a releer: **0 filas**.
6. 🗄️ En base de datos había **14 filas nuevas y perfectamente reales**:

   | Origen | Filas `Goal` | Puesto | Periodo |
   |---|---|---|---|
   | Alta múltiple | **11372, 11373** | 94 | 8 |
   | Clonado | **11374 – 11385** | 94 | 8 |

   Las dos del alta múltiple llevaban la marca `[E2E-20260825120710]` en su descripción.

**Conclusión:** se crearon catorce filas *a través de la propia interfaz* y el API siguió
afirmando que el puesto estaba vacío, en los cuatro GET. No es una hipótesis sobre el
`from … where` de `GoalsController`: es el defecto A ocurriendo de punta a punta, con las
filas identificadas por id.

**Corolario incómodo y necesario:** con el defecto A en pie, **la interfaz no puede
distinguir un puesto gris vacío de uno lleno**, ni siquiera después de haberlo llenado ella
misma. Cualquier usuario que configure uno de los 115 puestos con departamento 0 lo hará a
ciegas y puede duplicar sin enterarse. Las advertencias de la pantalla mitigan el riesgo,
pero **el arreglo del backend (`DefaultIfEmpty()` en las cuatro consultas) es lo único que
lo elimina**.

**Limpieza:** las 14 filas fueron borradas por el orquestador, con respaldo previo en
`dbo._bak_Goal_e2e_20260825`. La base de prueba quedó como estaba antes de la corrida.

---

## 8. Límites de esta verificación

### 8.1 Lo que no queda verificado

- ~~**Guardar la ponderación** no se prueba.~~ **Resuelto en la corrida de cierre** (§5.5,
  §9.1): durante cuatro corridas solo se verificó la lectura y el bloqueo, lo que dejaba el
  criterio 5 abierto sin admitirlo. La quinta ejerce la escritura de extremo a extremo sobre
  un periodo cerrado. Ya no queda ningún criterio abierto.
- **Nunca se escribe la ponderación del periodo activo.** La prueba se hace sobre un periodo
  cerrado; si ese periodo no tuviera las dos filas, el guion omite la parte y lo dice, en
  lugar de caer al periodo activo.
- **Un solo periodo en el resto del recorrido.** Los pasos 1 a 9 y 11 se verificaron sobre el
  periodo 8 (activo). El comportamiento con un periodo sin catálogo no se recorrió: la
  pantalla lo contempla (explica el caso y ofrece copiar de otro periodo) pero no llegó a
  darse.
- **El guard, con un usuario real de rol 2 o 3.** Ver §8.4.

### 8.2 El defecto A no se puede verificar desde la interfaz

`GoalsController` arma sus **cuatro** GET con un join no opcional contra `Deparments`, así
que las metas de un puesto cuyo departamento no exista en el catálogo se caen del resultado.
Consecuencias, ahora confirmadas empíricamente (§7):

- La pantalla lee del mismo API que oculta esas filas. **Ningún clic puede distinguir "este
  puesto no tiene competencias" de "este puesto tiene competencias que el API no me
  enseña".** Abrir el detalle no lo descarta: sale igual de vacío.
- Por eso el recorrido **no verifica que el puesto 19 tenga 12 competencias**; verifica que
  **la pantalla admite que no lo sabe**: que el aviso está, que el bloque de "no
  verificables" existe y va aparte, que cita el caso del puesto 19 y que ofrece la consulta
  SQL. Los cuatro extremos se comprobaron 🖥️ en el paso 11.
- **La comprobación definitiva es 🗄️ por SQL**:

  ```sql
  -- Metas reales de un puesto, por periodo (sin el join que las oculta)
  SELECT PeriodId, COUNT(*) AS metas
  FROM   Goal
  WHERE  PositionSecuencial = 19
  GROUP  BY PeriodId;

  -- Filas que el API no devuelve, por periodo
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

  Cifras de referencia de `04-Defectos-API.md` §A, **coincidentes** con lo que mostró la
  pantalla: **115** puestos ciegos y **8** de ellos ocupados (los mismos 8 que listó el
  diagnóstico).

### 8.3 El defecto B tampoco se puede verificar desde la interfaz

`GET /api/Positions` no proyecta `CategoriaPuestoId` y devuelve `0` en los 209 puestos. La
pestaña de Diagnóstico lo rodea pidiendo la categoría puesto por puesto con
`GET /api/Positions/{id}`. Desde el navegador solo se puede comprobar que **la pantalla no
se cree ese cero**, y se comprobó: el listado 2 dio **0** puestos sin categoría válida, no
209. Que ese 0 sea el número correcto es 🗄️ SQL:

```sql
SELECT DISTINCT e.scargo, p.descripcion, p.CategoriaPuestoId
FROM   Empleados e
       LEFT JOIN positions p ON p.secuencial = e.scargo
WHERE  e.codigoestado = 'A'
  AND  (p.secuencial IS NULL OR ISNULL(p.CategoriaPuestoId, 0) = 0);
```

### 8.4 El guard, con usuarios reales

El guard **quedó verificado** con `e2e/diag-guard.spec.js` degradando el `rolId` en
`localStorage`, que es de donde lo lee `RoleGuard` vía `SegurityService.getRolId()`
(captura `diagnosticos/guard-verificado.png`). Es una prueba válida del guard, pero **no** sustituye a
la de extremo a extremo con una cuenta real. Para cerrarla:

1. Conseguir un usuario de **rol 2 (Supervisor)** — `prodriguez` sirve en prueba — y otro
   de **rol 3 (Empleado)**.
2. Comprobar que **no aparece el menú Configuración** (está bajo `*ngIf="…rolId==1"`).
3. Escribir a mano `…/configuracion-competencias` y comprobar que no se abre: sale
   *"Acceso Denegado"* y redirige a `/Home`.
4. Repetir con **`/Meta`**, que en esta rama también pasó a exigir rol Admin (T1.3, punto 3).
   **QA debe saberlo para no reportarlo como regresión** — nota 12 de la Fase 1.
5. Dejar la captura como `guard-rol2-<usuario>.png` y anotar aquí usuario, fecha y resultado.

### 8.5 Alcance general

- **El recorrido valida el comportamiento de la pantalla, no los datos de negocio.** Que el
  diagnóstico liste 72 puestos sin competencias significa, por sí solo, que la pantalla llegó
  a 72 con lo que el API le dio. **Esa reserva ya no aplica al criterio 6: la reconciliación
  con SQL se hizo y cuadra exacta (§8.6).**
- **El defecto C** (`GET /api/Objetivoes` oculta competencias huérfanas) tiene la misma
  naturaleza: que una competencia no aparezca no prueba que no exista.
- **Entorno de prueba, no producción.** Lo verificado vale para `Evaluaciones_Test` a través
  del API `:7071`, con `ng serve` en local — no contra `evaluacionempleado-prueba`, que QA
  está usando.

### 8.6 Reconciliación del Diagnóstico con SQL: el criterio 6 cierra exacto

El criterio 6 pide que el diagnóstico *"liste exactamente los mismos huecos que hoy se
detectan por SQL"*. Se comprobó 🗄️ contra `Evaluaciones_Test`, cifra a cifra, y **coincide en
todo**. No se aproxima: coincide.

| Listado | 🖥️ En pantalla | 🗄️ En SQL | |
|---|---|---|---|
| 1 · Puestos ocupados sin competencias | **72** | **72** | ✅ |
| 2 · Puestos sin categoría válida | **0** | **0** | ✅ |
| 3 · Empleados activos sin evaluación | **444** | **444** | ✅ |
| Contexto · puestos ocupados | **90** | **90** | ✅ |
| Bloque · no verificables | **8** | **8** | ✅ |

**Y la aritmética del defecto A cierra sola**, que es la parte que da confianza de verdad en
que el número no cuadra por casualidad:

> La verdad en base de datos de "puestos ocupados sin metas en el periodo 8" es **79**.
> La pantalla muestra **72 + 8 = 80**.
> La diferencia es exactamente **1**: el **puesto 19**, que **sí tiene metas** pero es ciego
> para el API, y que la pantalla no cuenta como "sin competencias" sino que **aísla en el
> bloque de no verificables**.

Es decir: los 8 no verificables son 7 puestos que realmente no tienen metas más el 19, que sí
las tiene. La pantalla no puede distinguirlos —el defecto A se lo impide— y por eso no los
suma al listado 1 ni los da por buenos: los separa y manda comprobarlos por SQL. **Ese
tratamiento es el correcto, y la aritmética lo demuestra.**

Con esto, el criterio 6 no queda "verificado en cuanto al comportamiento de la pantalla":
queda **verificado en cuanto al resultado**.

---

## 9. Estado de los criterios de aceptación del plan

| Criterio | Estado | Evidencia |
|---|---|---|
| 1. Ver por puesto cuántas competencias y si el peso suma 100 | ✅ | 🖥️ Pasos 3, 4 y 6: 209 puestos con semáforo, y el paso a verde al llegar a 100 |
| 2. Alta múltiple, edición y **eliminación** con confirmación | ✅ | 🖥️ Corrida de cierre, pasos 5-7 sobre el puesto #92: 2 altas pedidas y **2 confirmadas releyendo**; edición de peso verificada; **borrado con confirmación y 0 filas con la marca tras releer** |
| 3. Clonar con previsualización de qué se crea y qué se salta | ✅ | 🖥️ Paso 8: 12 / 791 / 1 advertencia, con avisos y confirmación obligatoria; ejecución 🗄️ confirmada en la 1ª corrida (filas 11374-11385) y 🖥️ en la de cierre |
| 4. Vincular competencias a categorías sin SQL | ✅ | 🖥️ Paso 9: marcar y desmarcar, confirmado releyendo en los dos sentidos |
| 5. Fijar la ponderación Desempeño/Competencia | ✅ | 🖥️ Corrida de cierre, paso 10: lectura (30/70), bloqueo de *Guardar* con suma 125 y **la ruta de escritura ejercida** sobre el periodo cerrado de 2024 — guardado 40/60 y confirmado releyendo, restaurado 30/70 y confirmado de nuevo. 🗄️ SQL: los tres periodos en 30/70 (§9.1) |
| 6. Diagnóstico equivalente a las consultas SQL | ✅ **Cerrado por SQL** | 🖥️ Paso 11 + 🗄️ **reconciliación exacta**: 72 = 72, 0 = 0, 444 = 444, 90 = 90, 8 = 8, y la aritmética del defecto A cierra sola (§8.6) |
| 7. Un no administrador no entra ni por URL | ✅ | 🖥️ Corrida de cierre, paso 12: con rol 2 se queda en `/Home` y sale *"Acceso Denegado"*; corroborado aparte por `diag-guard.spec.js` (`diagnosticos/guard-verificado.png`). Queda por confirmar con una cuenta real de rol 2/3 (§8.4) |
| 8. `ng build` sin errores nuevos | — | Fuera del alcance de T3.3 (es T3.1) |
| 9. Playwright recorre el flujo y deja capturas documentadas | ✅ | Este documento y las capturas de `e2e/capturas-crud-competencias/` |

**Los siete criterios del alcance de T3.3 están cerrados**, y el 9 —esta auditoría con sus
capturas— también. El único que queda fuera es el 8 (`ng build`), que pertenece a T3.1.

### 9.1 Por qué el criterio 5 no estaba cumplido, y cómo se cierra

Este documento sostuvo durante dos versiones que el criterio 5 quedaba "parcial por decisión
deliberada": que guardar la ponderación alteraría el cálculo de las evaluaciones en curso y
no valía la pena el riesgo. **El argumento no se sostiene, y conviene dejar escrito por qué**,
porque es un buen ejemplo de una reserva que suena prudente y en realidad solo tapa un hueco.

El criterio dice *"fijar la ponderación"*. **Fijar es escribir.** Lo verificado era que la
pantalla **lee** los porcentajes y que **bloquea** *Guardar* cuando no suman 100; la ruta de
escritura —lo único que el verbo describe— no se ejercía nunca.

Y la coherencia interna del propio recorrido lo delataba: **el paso 6 ya escribe en el
periodo activo**, editando el peso de una meta real del puesto #6 de 9 a 10 y restaurándolo
después; **el paso 9 crea y borra un vínculo real** de la matriz. Si "escribir, verificar
releyendo, restaurar" vale para una meta del periodo activo, no hay razón para que no valga
para dos porcentajes.

**Cómo se cerró, sin tocar ninguna evaluación en curso:** `PorcientoDesempenoCompetencia` es
**por periodo**, y la pantalla trabaja por periodo. La prueba se hizo sobre un **periodo
cerrado** —*Evaluación de Desempeño Final 2024*—, así:

1. cambiar el selector del shell a ese periodo cerrado;
2. leer y anotar los valores originales;
3. escribir un reparto válido distinto (40/60), guardar;
4. **verificar releyendo del API** con "Descartar y releer";
5. restaurar los valores originales, guardar y **verificar también la restauración**;
6. devolver el shell al periodo activo, para que el paso 11 diagnostique sobre él.

Si ese periodo no hubiera tenido las dos filas, el guion **no** habría caído al periodo activo
como alternativa: registra la parte como omitida y lo dice. No hizo falta: las tenía.

**Resultado (corrida de cierre, §5.5):** originales 30/70 → guardado **40/60**, confirmado
releyendo del API → restaurado **30/70**, confirmado de nuevo → shell devuelto al periodo
activo. 🗄️ Comprobado además por SQL: **los tres periodos quedaron en 30/70**. El criterio 5
está cumplido y la base quedó como estaba.

---

## 10. Recomendaciones

1. **Abrir el ticket del backend para el defecto A** con la evidencia de §7 (los ids
   11372-11385 y la secuencia observada). `DefaultIfEmpty()` en las cuatro consultas de
   `GoalsController` elimina de raíz el estado "sin dato fiable" del semáforo, el bloque de
   "no verificables" del diagnóstico y la advertencia del clonado.
2. ~~Ejecutar la corrida de validación.~~ **Hecha** (§5.5): 12 de 12, con la ponderación
   escribiendo. Es la corrida de cierre y la evidencia autorizada de esta auditoría.
3. **Defecto B**: mientras no se proyecte `CategoriaPuestoId` en el listado, el diagnóstico
   seguirá costando ~90 llamadas por ejecución.
4. **Avisar a QA** de que `/Meta` ahora exige rol Admin.
5. ~~Añadir `data-testid` a los botones de acción de la tabla de detalle.~~ **Resuelto sin
   tocar `src/`**: el HTML ya trae `matTooltip="Editar" / "Eliminar" / "Guardar" / "Cancelar"`
   como atributos estáticos (`competencias-puesto.component.html:205-212`), que permanecen en
   el DOM. El guion los usa (`BTN_EDITAR`, `BTN_ELIMINAR`, `BTN_GUARDAR_FILA`) en vez de
   `nth(0)` / `nth(1)`. Era un riesgo destructivo —bastaba reordenar un botón para que el
   guion borrara creyendo que editaba— y no hacía falta esperar a nadie para quitarlo.

---

## 11. Salida de la corrida de cierre

Ejecución del **2026-08-25 14:40 — modo ESCRITURA**, sobre
`http://localhost:4300/evaluacionempleado-prueba` (local, `ng serve --configuration prueba` →
API `:7071`, BD `Evaluaciones_Test`). Marca `[E2E-20260825143621]`.

**12 pasos correctos, 0 parciales, 0 con problemas, 0 omitidos, 0 problemas, 0 errores de
JavaScript en consola**, en 4,5 min.

Salida íntegra del guion, con el detalle observado en cada paso:
`e2e/capturas-crud-competencias/escritura-20260825143621/resumen-escritura-20260825143621.md`.
Las 42 capturas están en esa misma carpeta.

| # | Paso | Captura(s) | Resultado |
|---|---|---|---|
| 1 | Login y navegación por el menú hasta la pantalla nueva | `00-login.png`, `01-post-login.png`, `02-pantalla-configuracion-competencias.png` | Correcto |
| 2 | Selector de periodo: ofrece los periodos y preselecciona el activo | `03-selector-periodos-desplegado.png` | Correcto |
| 3 | Franja de resumen del shell: contadores del periodo | `04-franja-resumen.png` | Correcto |
| 4 | Pestaña "Competencias por puesto": listado, semáforo, filtros y detalle | `05-tab-competencias-puesto.png`, `06-listado-puestos-semaforo-y-aviso.png`, `07-filtro-solo-ocupados.png`, `08-filtros-aplicados.png`, `09-detalle-puesto-con-competencias.png` | Correcto |
| 5 | Alta múltiple sobre un puesto vacío con departamento válido | `10-panel-alta-multiple-abierto.png`, `11-alta-multiple-marcadas.png`, `12-alta-multiple-resultado.png`, `13-alta-multiple-verificada.png` | Correcto |
| 6 | Edición de peso: llevar un puesto ámbar a 100 y ver el semáforo en verde | `14-peso-antes-ambar.png`, `15-peso-ajustado-verde.png`, `16-listado-con-verde.png`, `17-peso-restaurado.png` | Correcto |
| 7 | Borrado con confirmación de las filas creadas por el guion | `18-borrado-antes.png`, `19-borrado-confirmacion.png`, `20-borrado-verificado.png` | Correcto |
| 8 | Clonado: previsualización y ejecución | `21-clonado-dialogo-abierto.png`, `22-clonado-previsualizacion.png`, `23-clonado-previsualizacion-destino-seguro.png`, `24-clonado-ejecutado.png`, `25-clonado-verificado.png`, `26-clonado-limpieza.png` | Correcto |
| 9 | Pestaña "Catálogo y categorías": catálogo agrupado y matriz | `27-tab-catalogo-categorias.png`, `28-matriz-vinculacion.png`, `29-matriz-casilla-marcada.png`, `30-matriz-casilla-restaurada.png` | Correcto |
| 10 | Pestaña "Ponderación": valores, bloqueo si no suma 100 **y escritura sobre un periodo cerrado** | `31-tab-ponderacion.png`, `32-ponderacion-suma-invalida.png`, `33-ponderacion-restaurada.png`, **`34-ponderacion-periodo-cerrado.png`**, **`35-ponderacion-guardada-verificada.png`**, **`36-ponderacion-restaurada-verificada.png`** | Correcto |
| 11 | Pestaña "Diagnóstico": tres listados, conteos y no verificables | `37-tab-diagnostico.png`, `38-diagnostico-advertencia-defecto-A.png`, `39-diagnostico-no-verificables.png`, `40-diagnostico-listados.png` | Correcto |
| 12 | Guard de seguridad: la ruta exige rol Administrador | `41-guard-rol-no-admin.png` | Correcto |

### Cifras observadas, por paso

| Paso | Lo que midió |
|---|---|
| 2 | 3 periodos; preseleccionado *"Evaluación de Mitad de año 2026 — activo"* |
| 3 | 10 puestos con competencias · 90 con empleados activos |
| 4 | 209 puestos; semáforo 191 vacíos / 10 ámbar / 8 grises / 0 verdes. Filtros aislados: sin competencias **199 de 199 esperados**, ocupados **90 = 90 del shell**, texto "ADMINISTRADO" **2 de 2**, departamento "CREDITO, LEGAL Y COBROS" **2 de 2** (45 opciones ofrecidas), combinación **1 = intersección esperada** |
| 5 | Puesto elegido **ABOGADA DE COBROS LEGAL (#92)**, departamento válido, sin empleados activos. 2 altas pedidas → **2 confirmadas releyendo** |
| 6 | #6 en ámbar, peso 99 → una fila de 9 a 10 → **peso 100, semáforo verde**, confirmado en el listado; restaurado a 99 |
| 7 | 2 filas propias → confirmación con aviso de PERIODO ACTIVO → **0 filas con la marca tras releer** |
| 8 | Previsualización **12 / 791 / 1 advertencia**; ejecución **12 filas creadas y confirmadas**; limpieza completa |
| 9 | Catálogo 12 competencias en 4 grupos, 41 vínculos; matriz 12 × 7. Casilla marcada y desmarcada, **confirmada releyendo en los dos sentidos** |
| **10** | Periodo activo: 30 / 70; con Desempeño = 55 → *"Suma: 125"* y **Guardar deshabilitado**. **Periodo cerrado (Final 2024): originales 30/70 → guardado 40/60 → relectura del API confirma 40/60 → restaurado 30/70 → relectura vuelve a confirmarlo.** Shell devuelto al periodo activo |
| 11 | 455 empleados activos, 90 puestos ocupados, 103 competencias. L1 = **72**, L2 = **0**, L3 = **444**. No verificables = **8** (94, 255, 33, 69, 19, 102, 249, 221), **con el puesto 19 dentro**. 115 puestos ciegos, coincidentes con `04-Defectos-API.md` §A |
| 12 | Con rol 2: se queda en `/Home` y sale *"Acceso Denegado — No tiene permisos para acceder a esta página"*. Rol original restaurado |

### La prueba del criterio 5, en detalle

El mensaje que devolvió la pantalla al guardar no fue un simple "guardado", sino que ya
incorporaba su propia relectura:

> *"La ponderación del periodo quedó guardada: 40% Desempeño / 60% Competencia **(verificado
> releyendo del API)**"*

Y el guion no se fió de ese mensaje: volvió a leer por su cuenta con "Descartar y releer",
que dispara un `GET` nuevo, y comparó. Las dos lecturas coincidieron, en el cambio y en la
restauración. Es el mismo patrón de los pasos 5 a 8 —escribir, releer, comparar, restaurar—
aplicado al último criterio que faltaba.

### Estado de la base tras la corrida (🗄️ SQL)

| Comprobación | Resultado |
|---|---|
| Filas en `Goal` | **7.921** — idéntico al estado previo |
| Filas en `Goal` del periodo 8 | **115** — idéntico |
| Filas con marca `[E2E-…]` | **0** |
| `PorcientoDesempenoCompetencia` | **Los tres periodos en 30 / 70** — el reparto de ninguno quedó alterado, tampoco el del periodo cerrado sobre el que se hizo la prueba |

El recorrido no dejó residuo: todo lo que creó, lo borró; todo lo que cambió, lo restauró.

---

## 12. Documentos relacionados

- `Docs/crud-competencias/00-Plan-General.md` — criterios de aceptación
- `Docs/crud-competencias/01-Fases-y-Tareas.md` — §T3.3 y notas de la Fase 1
- `Docs/crud-competencias/04-Defectos-API.md` — los defectos que la pantalla rodea
- `Docs/proceso-configuracion-competencias-periodo8.md` — consultas SQL de referencia
- `e2e/crud-competencias.spec.js` — guion del recorrido
- `playwright.headless.config.js` — config con la que se corren el recorrido y los diagnósticos
- `e2e/diag-rol.spec.js` — por qué el menú "Configuración" no aparecía tras iniciar sesión, con
  el rol que devuelve el API y lo que queda en `localStorage`. Es el diagnóstico que permitió
  que el recorrido llegara siquiera a la pantalla. Solo lee.
- `e2e/diag-guard.spec.js` — comprobación aislada del `RoleGuard`
- `e2e/diag-filtro-depto.spec.js` — diagnóstico del cuelgue en el filtro por departamento
- `e2e/capturas-crud-competencias/escritura-20260825143621/` — **evidencia autorizada**: las 42
  capturas y la salida de la corrida de cierre (§5.5, §11)
- `e2e/capturas-crud-competencias/historico/` — resúmenes y capturas parciales de las corridas
  anteriores (§4.5)
