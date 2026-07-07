# Checklist smoke manual — Piloto Evaluación Medio Año (Periodo 8)

Ejecutar este checklist **antes y después** de cada tarea de las Fases 2-8 que toque el flujo de evaluación (ver tabla de verificación en `plan-mejoras-sistema.md`). Ambiente: `evaluacionempleado-prueba`, API `:7071` (`ng serve --configuration prueba`).

## Pre-requisitos
- [ ] `ng serve --configuration prueba` corriendo (confirmar en consola que apunta a `192.168.7.222:7071`)
- [ ] `loginapp` remoto accesible en `/loginapp/remoteEntry.js`
- [ ] Usuario de prueba disponible: `prodriguez` (supervisor, secuencial 55) y `ralcantara` (525, subordinado de prodriguez)

## Flujo funcional

1. **Login**
   - [ ] Login con `ralcantara` (empleado) → redirige a Home sin error de consola
   - [ ] Login con `prodriguez` (supervisor) → ve menú de supervisor (opciones adicionales vs empleado)
2. **EvaluarSubordinados** (como `prodriguez`)
   - [ ] Lista de subordinados carga (incluye a 525=ralcantara)
   - [ ] Seleccionar subordinado → abre evaluación de medio año del periodo 8
3. **Evaluación de medio año — calificar**
   - [ ] Los criterios de competencia se muestran con `emojirating` funcional (seleccionar cada emoji resalta solo esa fila)
   - [ ] Calificar un criterio no altera el resaltado de otros criterios ya calificados
   - [ ] Los objetivos/metas de desempeño se listan con su tipo y peso
4. **Guardar**
   - [ ] Guardar evaluación → mensaje de éxito (SweetAlert2), sin "Error:undefined"
   - [ ] Doble clic en Guardar no crea un registro duplicado (verificar en tabla/BD tras el intento)
   - [ ] El overlay de loading se cierra siempre, incluso si el guardado falla (probar con red desconectada si es posible)
5. **PDF**
   - [ ] Generar PDF de la evaluación → se descarga, logo visible, datos coinciden con lo calificado
   - [ ] `CompetenciaFinal` mostrado en pantalla coincide con el cálculo esperado (post-T7.1: promedio real, no `(pct×pct)/100`)
6. **Estados y botones**
   - [ ] Estado "Borrador" muestra botones correctos (Guardar/Enviar, no Completar)
   - [ ] Estado "Enviado"/"Completada"/"Rechazada" muestran los botones correspondientes según rol (empleado vs supervisor)
7. **Acceso por rol**
   - [ ] Como empleado, acceder por URL directa a una ruta administrativa (`/Roles`, `/PoliticaEvaluacion`) → denegado tras T3.2/T3.3 (antes de eso, se espera que SÍ se pueda acceder — ese es el bug base)
   - [ ] Menú (`navmenu`) muestra las mismas opciones que antes de cualquier refactor (comparar capturas)

## Resultado baseline de los 3 scripts Playwright

**BLOQUEADO — no ejecutado.** Los scripts `test-medio-ano.mjs`, `test-grabar-medioano.mjs` y `test-flujo-completo.mjs` (y `test-setup-periodo.mjs`) tienen la URL de API hardcodeada a `192.168.7.222:7070`, que según `environment.ts` corresponde al ambiente por defecto (posible producción, "Final 2025"), no al `:7071` de `Evaluaciones_Test` que dice usar el piloto. Ver detalle y hallazgo completo en `Docs/baseline-fase0.md`.

**Acción requerida antes de usar estos scripts como red de seguridad real:** confirmar con el usuario contra qué base de datos escribe realmente el puerto 7070 en este momento. Hasta entonces, la verificación de cada fase se apoya solo en este checklist manual + `build:prod` + `ng test`, y estos 4 scripts quedan fuera de la rutina automática de `test:ci`/`e2e:medioano`.
