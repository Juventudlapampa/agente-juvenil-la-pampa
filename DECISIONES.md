# DECISIONES.md — Bitácora de decisiones de diseño e ingeniería

Cada decisión tomada sin frenar a preguntar queda anotada acá, con su porqué.

## Arquitectura

### D11 — FASE A: rutinas de NPC con pathfinding BFS + afinidad (bolt-on)
**Por qué:** la FASE A (`CONFIG.rutinas`) suma vida sin tocar lo que ya andaba.
- **Todo nuevo en `js/rutinas.js`** (`AJ.Rutinas` + `AJ.Afinidad`), arrancado por
  `Pueblo._iniciarSistema('rutinas', ...)` con try/catch. Si el flag está en false
  o el sistema falla, los NPCs quedan estáticos como en la FASE 2: cero regresión.
- **Movimiento por waypoints (BFS 4-conexo)** en vez de "ir derecho": el greedy se
  trababa en esquinas cóncavas y en bolsillos (la intendenta atrapada por la
  aguada). El BFS garantiza camino o nada; el mover sólo espera ante blockers
  dinámicos (jugador / otro NPC) y **recalcula evitando a los NPCs parados** para
  no quedar en deadlock contra el lugar de descanso de otro.
- **Saneo en runtime de spots inválidos:** `_asegurarWalkable` reubica a cualquier
  NPC que arranque sobre un tile que colisiona (caso Muni/aguada). Es defensa pura
  de la FASE A; no edita el mapa base. Bug de fondo anotado en ROADMAP.
- **Afinidad** 0..100 por NPC, sube al hablar (una vez por día de juego, capeada;
  anti-farmeo). Como cada misión exige varias charlas, cumplir misiones también la
  sube, sin tocar `misiones.js`. Se persiste en `estado.afinidad` y se ve en el
  panel "Cuaderno · Vecinos" (botón ♥ o tecla C).
- **Misiones reskinables sin código:** las 5 misiones siguen siendo plantillas de
  texto en `AJ.MISIONES` (diálogos como datos). No referencian programas ni marcas
  reales: se les puede dar bajada institucional editando sólo strings.
- Verificado en navegador: smoke **28/28 PASS**; los 6 NPCs llegan a la plaza en la
  franja de tarde y vuelven a su lugar de noche; afinidad sube al hablar y persiste.

### D12 — FASE B: estaciones derivadas del día (sin estado nuevo)
**Por qué:** `CONFIG.estaciones` suma 4 estaciones en `js/estaciones.js`
(`AJ.Estaciones`) como bolt-on.
- **Derivadas de `estado.tiempo.dia`** (que ya persiste y avanza diaNoche): la
  estación = `floor((día-1)/DIAS_POR_ESTACION) % 4`. No agrega estado a guardar;
  al recargar se recalcula sola.
- **Tinte por capa propia** (rectángulo a pantalla completa, depth 7990, POR DEBAJO
  del tinte día/noche 8000): se combinan. Primavera verde, verano amarillo, otoño
  naranja, invierno azul frío. Verificado visualmente otoño vs invierno.
- **Ritmo de cultivos:** la granja lee `scene.estaciones.factorCrecimiento()` con un
  hook aditivo y guardado (factor 1 si el sistema está apagado → FASE 4 idéntica).
  Verificado: verano (×1.4) crece más que invierno (×0.5).
- Smoke **32/32 PASS**.

### D13 — FASE C: crafteo con ingredientes de la huerta y del monte
**Por qué:** `CONFIG.crafteo` suma una mesa de oficios en `js/crafteo.js`
(`AJ.Crafteo`) con 5 recetas, atado a la economía existente.
- **Inventario de ítems** nuevo en `estado.inventario.items` (aditivo en
  guardado; persiste). Dos ingredientes base: `verdura` (la da la cosecha, hook
  guardado en granja.js que NO cambia el +10 monedas de FASE 4) y `lena` (se junta
  de los caldenes del mapa, 1 por árbol por día de juego).
- **Texturas propias** (mesa) generadas en el sistema con `make.graphics`, sin
  tocar art.js. La mesa se ubica en un tile validado walkable cerca de la huerta y
  **colisiona** (vía `esColisionExtra`, ahora también consulta crafteo).
- **Menú** clickeable + atajos 1–5; congela el movimiento como el diálogo; Esc/acción
  cierran (la guardia del Esc cierra el menú antes de volver al título).
- **Recetas reskinables** (datos en `AJ.RECETAS`): mermelada, fardo de leña, guiso
  criollo, canasta, adorno. Determinístico, sin azar ni plata real.
- Smoke **38/38 PASS**; crafteo y persistencia de ítems verificados.

### D14 — FASE D: multi-pueblo mutando AJ.Mapa in-place (cero refactor de refs)
**Por qué:** `CONFIG.viaje` agrega un 2º pueblo y viaje, que es riesgo ALTO porque
`AJ.Mapa` es un singleton referenciado por todos los sistemas (jugador, rutinas,
granja, crafteo, Pueblo).
- **Clave anti-rotura:** en vez de cambiar todas esas referencias, `AJ.Mapa.cargar(id)`
  **reconstruye el mismo objeto** `AJ.Mapa` (muta tex/col/meta/SPAWN). Como cada
  escena lee `AJ.Mapa` al crearse, viajar = guardar, `cargar(destino)`,
  `scene.restart({nuevo:false})`. Ningún sistema cambió. Pueblo 1 quedó idéntico
  (smoke 42/42 antes y después del refactor).
- **Bug atrapado y corregido:** `scene.restart()` sin datos reusa el `{nuevo:true}`
  del start original → init rearmaba un juego nuevo y perdía el viaje. Fix:
  `restart({nuevo:false})` para forzar la carga del estado recién guardado.
- **2º pueblo "Colonia La Esperanza"** sin NPCs (`meta.conNPCs=false`): chacra para
  farmear/craftear/juntar leña. Los sistemas que dependen de NPCs se inician vacíos
  sin romper; el smoke es "consciente del pueblo" (saltea los checks de NPC donde no
  hay vecinos). Misiones siguen en el Pueblo 1; el Cuaderno avisa "Buscá a alguien
  del pueblo" cuando el NPC objetivo está en el otro mapa.
- **Salidas** = tiles de borde; pisar uno dispara el viaje. `estado.mapaActual`
  persiste; un juego nuevo siempre arranca en el Pueblo 1.
- Verificado: viaje ida y vuelta, persistencia, sin errores de consola. Smoke
  Pueblo 1 42/42, Colonia 35/35.

### D15 — Capa de pulido P1 (juice): helpers centrales auto-gateados
**Por qué:** `CONFIG.juice` agrega `js/juice.js` (`AJ.Juice`) con helpers (fadeIn,
irA, reiniciar, shake, aparecer, pulso, celebrar). Cada helper chequea el flag
adentro, así los llamados desde las escenas/sistemas son **no-op** cuando juice
está apagado (cero riesgo). Las transiciones de escena usan `camerafadeoutcomplete`
con un `delayedCall` de **fallback** por si el evento no llega (no quedarse en negro).
Hooks aditivos y guardados: Título/Pueblo/Final (fade in/out), diálogo (entra con
tween), misiones (celebración + Final con fade), estaciones (shake al cambiar),
NPC (pulso al hablarle). Verificado: smoke 43/43, transiciones completan sin quedar
en negro, viaje con fade OK, canvas renderiza.

### D16 — Capa de pulido P2 (sonido): Web Audio procedural, cero descargas
**Por qué:** `CONFIG.sonido` agrega `js/sonido.js` (`AJ.Sonido`): todos los efectos
se sintetizan con osciladores + envolventes + ruido (pasos, diálogo, misión,
cosecha, moneda, craft, viaje, click). Sin archivos.
- **Autoplay:** el AudioContext se crea perezoso y se resume en el primer gesto
  (listeners de keydown/pointerdown/touchstart). Si el navegador igual lo bloquea,
  los sonidos chequean `ctx.state === 'running'` y se saltean en silencio: nunca
  rompen el juego.
- **Mute** persistente (localStorage), botón DOM `#btn-mute` siempre visible.
- Hooks aditivos y guardados en jugador/diálogo/misiones/granja/crafteo/viaje/título.
- Verificado: smoke 44/44, botón visible y togglea+persiste, los sonidos se llaman
  sin lanzar aun con el contexto suspendido. El *gusto* del sonido necesita oído
  humano (ver PLAYTEST.md).

### D17 — Capa de pulido P3 (UX/táctil): clase de body + CSS gateado
**Por qué:** `CONFIG.uiPulida` agrega una clase `ui-pulida` al `<body>` (desde main.js)
y el CSS la lee para mejorar **sin tocar la base**: d-pad táctil más grande (68–78px)
y mejor separado, botón de acción más grande, panel de fondo sutil para verlos sobre
cualquier escena. El diálogo gana una **placa** detrás del nombre y texto un poco más
grande (lógica guardada en `dialogo.js`).
- **Fix de overlap (siempre):** el botón de mute (P2, arriba-derecha) pisaba el HUD del
  Cuaderno; se bajó el Cuaderno a y=62.
- **Bug atrapado por el smoke:** reasigné `alto` declarado con `const` en el diálogo →
  el constructor lanzaba y `this.dialogo` quedaba undefined. Fix: `let alto`. Además se
  endureció el check "Diálogo disponible" (devolvía `undefined`, falso PASS; ahora `!!`).
- Verificado: smoke 47/47, placa OK, d-pad 68px sin desbordar en 375px, input táctil
  responde. El *confort real* en celular necesita mano humana (ver PLAYTEST.md).

### D18 — Capa de pulido P4 (robustez): casos de borde en el smoke
**Por qué:** el smoke (sin flag, siempre) sumó 7 casos de borde: guardar a mitad de
misión y recargar (round-trip), save corrupto → null, estado por pueblo sobrevive el
round-trip (sin llamar `cargar` para no corromper la escena), interactuar parcela
vacía / fuera de parcela, inventario y monedas enormes (HUD + menú no rompen), hablar
dos veces al mismo NPC, cargar sin guardado → null. Todos los tests mutadores son
**no destructivos** (snapshot/restore, ahora también de `misiones`). Resultado honesto:
**ningún borde reveló un bug** — la base ya era robusta por los try/catch por sistema y
el guardado defensivo (migración por campos + fallback a memoria). Smoke 54/54 (Pueblo),
47/47 (Colonia).

### D19 — Capa de pulido P5 (balance): un solo lugar + caveat de playtest
**Por qué:** los números que afectan el ritmo se juntaron en `AJ.CONFIG.BALANCE`
(monedas/verduras de cosecha, ritmo de crecimiento, afinidad por charla, factor de
precio de crafteo) con comentarios. Los sistemas leen con `AJ.bal(clave, fallback)`,
así borrar un valor no rompe nada (verificado: cambiar `cosechaMonedas` a 50 y
`afinidadPorCharla` a 8 y reiniciar → la granja y la afinidad lo toman). Las recetas
y recompensas de misión siguen como **datos** (AJ.RECETAS / AJ.MISIONES), editables
sin tocar lógica. Se dejó EXPLÍCITO en `PLAYTEST.md` y en los comentarios que estos
son defaults razonables y que el balance fino **necesita playtest humano**. Smoke 55/55.

### D20 — C1.1: NPCs propios de la Colonia (reusando rutinas/afinidad)
**Por qué:** `CONFIG.npcsColonia` da vida al 2º pueblo con 5 vecinos rurales (Don
Ramón el Puestero, El Gallego, La Seño Marta, El Colorado, Doña Anunciación), al
mismo nivel que el principal, **sin sistemas nuevos**: usan los de FASE A/2.
- `npc.js`: `crearTodos` ahora despacha por pueblo (`_defsPueblo1` idéntico /
  `_defsColonia` nuevo). `mapa.js` Pueblo 2 setea `meta.conNPCs = !!CONFIG.npcsColonia`,
  así con el flag off la Colonia sigue vacía (FASE D intacta).
- `art.js`: 4 texturas nuevas (additivas). `rutinas.js`: punto de encuentro propio
  de la Colonia (Pueblo 1 sin cambios).
- **2 bugs de no-destructividad del smoke encontrados y corregidos** (sólo se notaban
  con NPCs en ambos pueblos): el check "El NPC camina" sobreescribía `_target` global
  y movía a TODOS los NPCs restaurando sólo el primero → ahora restaura a todos; y el
  check de afinidad "gastaba" la charla del día del primer NPC (no restauraba
  `ultimaCharlaDia`) → ahora lo restaura. Esto también dejó a los NPCs del Pueblo 1 en
  su lugar tras el auto-smoke.
- Verificado: Pueblo 1 y Colonia **55/55** cada uno; diálogo y afinidad andan en la
  Colonia; sin errores de consola.

### D21 — C1.2: misiones de la Colonia con progreso por pueblo
**Por qué:** `CONFIG.misionesColonia` agrega 2 misiones cívicas propias de la Colonia
(`AJ.MISIONES_COLONIA`, `pueblo: 2`), que se concatenan a `AJ.MISIONES` SÓLO si el
flag está on (si off, todo queda como FASE 2). La lógica de misiones se hizo
**consciente del pueblo**: `_misionActual`/`_completadas`/HUD filtran por
`(m.pueblo||1) === AJ.Mapa.actual`, así el Cuaderno muestra la cadena del pueblo donde
estás. El estado vive en `estado.misiones[id]` (global, persistido), por eso el
progreso de cada pueblo se **recuerda por separado**. El Final (felicitación) sólo lo
dispara la cadena principal (pueblo 1); la Colonia es contenido aparte.
- Verificado end-to-end: avanzar `bienvenida` en Pueblo 1 y completar `col_escuela`
  en la Colonia → ambos estados conviven; al "Continuar" tras recargar, la Colonia
  retoma en `col_aguada` y el Pueblo 1 sigue en `bienvenida` (objetivo_ok). El "!" y
  el HUD apuntan a los NPCs correctos de cada pueblo. Pueblo 1 56/56, Colonia 57/57.

### D1 — Sin módulos ES (`import`/`export`); namespace global `AJ`
**Por qué:** el requisito "abre con doble clic y funciona" (protocolo `file://`)
choca con los módulos ES: Chrome/Firefox bloquean `import` por CORS en `file://`.
Para garantizar que el juego abra con doble clic **y** ande en GitHub Pages, todos
los archivos son `<script>` clásicos que cuelgan de un único objeto global `AJ`.
El código sigue siendo modular (un archivo por sistema), sólo cambia el mecanismo
de carga. Es la opción más robusta dado el criterio "mejor chico y funcionando".

### D2 — Mapa construido por código en vez de matriz tipeada a mano
**Por qué:** una matriz de 40x30 tipeada a mano es muy propensa a errores de
alineación. `mapa.js` genera las matrices `tex[][]` y `col[][]` con funciones de
estampado (calles, plaza, edificios, aguada). El resultado **es** una matriz
(accesible en `AJ.Mapa.tex`/`AJ.Mapa.col`), pero se arma de forma verificable.

### D3 — Colisiones por chequeo de tile, sin Arcade Physics
**Por qué:** para un top-down con grilla, chequear las 4 esquinas de la caja de
pies contra `AJ.Mapa.col` es más predecible y liviano que configurar cuerpos de
física. Permite "deslizar" contra paredes moviendo eje por eje.

### D4 — Arte 100% generado por código (`art.js`)
**Por qué:** requisito de cero descargas. Cada textura se crea con
`Phaser.Graphics.generateTexture()`. Las claves de textura están documentadas para
reemplazarlas por PNG reales sin tocar el resto del juego (ver cabecera de art.js).

### D5 — Flags de sistema + try/catch por sistema (anti-rotura)
**Por qué:** `CONFIG` tiene un flag por sistema. Cada uno se inicializa sólo si su
flag está en `true`, dentro de un try/catch que lo apaga si falla. Un sistema roto
nunca tira abajo el juego. Los flags arrancan en `false` y se ponen en `true`
recién cuando el smoke-test del sistema da PASS.

### D6 — Phaser 3.80.1 desde jsDelivr
**Por qué:** versión estable y CDN confiable. Si no hay internet la primera vez,
`main.js` muestra un mensaje claro en lugar de pantalla en blanco.

## Criterio de éxito — resultado final

Verificado en navegador (server local + lectura del canvas). Todo cumplido:

| Criterio | Resultado |
|----------|-----------|
| Abre sin errores en consola | ✅ Sin errores en carga limpia |
| Se ve el pueblo pampeano | ✅ Plaza, monumento, iglesia, Muni, Casa de la Juventud, almacén, casas, aguada, caldenes, huerta |
| El jugador camina, choca y la cámara lo sigue | ✅ Movimiento 4 dir, colisiones (monumento/agua/NPCs), cámara con follow |
| Se habla con NPCs y se completan misiones | ✅ 6 NPCs, diálogo RPG, 5 misiones cívicas en cadena |
| Guarda y recupera al recargar | ✅ Posición, misiones, granja, hora y monedas persisten (Continuar) |
| Anda en celular | ✅ Escala FIT + controles táctiles (d-pad + acción) que disparan input |
| Smoke-test todo PASS | ✅ **23/23 PASS** |
| Llega a la pantalla final | ✅ Al completar las 5 misiones → felicitación con resumen |

> **Nota de entorno de verificación:** el preview headless mantiene la pestaña
> "hidden", lo que pausa `requestAnimationFrame` y cuelga el screenshot del
> harness. Se verificó manejando el loop a mano (`game.step`) y leyendo
> `canvas.toDataURL` (imágenes de ~60–100 KB, no vacías). En un navegador real
> (doble clic / GitHub Pages / celular) el loop corre normal a 60 fps.

## Resultados del smoke-test

> Se completa al cerrar cada fase. Ver consola del navegador (F12).

- **FASE 1 (verificada en navegador):** Smoke-test **9/9 PASS**.
  - Phaser carga, escena Pueblo activa, mapa 40x30 con colisiones, texturas
    generadas, jugador en spawn válido, cámara siguiéndolo, guardado lee/escribe.
  - Movimiento 4 direcciones OK; colisiones verificadas: caminando al monumento
    (19,15) el jugador se frena en (19,16); caminando a la aguada se frena en la
    orilla sin entrar al agua.
  - Render visual confirmado (canvas no vacío): se ve el pueblo pampeano con
    edificios, plaza, monumento, aguada, calles, veredas, caldenes y HUD.
  - **Nota de entorno:** el preview headless deja la pestaña "hidden", así que
    `requestAnimationFrame` se pausa y el screenshot del harness se cuelga. Se
    verificó manejando el loop a mano (`game.step`) y leyendo `canvas.toDataURL`.
    En un navegador real (doble clic / GitHub Pages) el loop corre normal.

- **FASE 2 (verificada en navegador):** Smoke-test **17/17 PASS**.
  - 6 NPCs creados en sus puntos, con colisión (no se atraviesan) y globo "!".
  - Cuadro de diálogo RPG por tramos; congela el movimiento mientras está abierto.
  - 5 misiones cívicas en cadena (ofrecer → objetivo → volver). Se simuló la
    partida completa: terminan las 5, da 90 monedas (10+15+15+20+30) y 5 logros,
    y dispara la pantalla Final correctamente.
  - HUD "Cuaderno" arriba a la derecha con misión activa y progreso (x/5).

- **FASE 3 (verificada en navegador):** Smoke-test **20/20 PASS**.
  - Reloj de juego (Día N · HH:MM · período) y tinte a pantalla completa que
    interpola color/alpha entre claves horarias (noche azul, amanecer/atardecer
    naranja, día sin tinte). Verificado visualmente a las 22:00 (escena azulada,
    UI legible por encima del tinte).
  - Un día de juego = 240 s reales (configurable en CONFIG.SEGUNDOS_POR_DIA).

- **FASE 4 (verificada en navegador):** Smoke-test **23/23 PASS**.
  - Huerta comunitaria: plantar (gratis) → crecer en 4 etapas con el tiempo →
    cosechar (+10 monedas). Cultivos renderizados en todas las etapas (semilla,
    brote, planta, trigo dorado). Texto flotante de feedback.
  - **Persistencia integral verificada:** se guardó posición, misión activa,
    cultivo, hora y monedas; tras recargar y "Continuar" se recuperó todo idéntico.
  - **PROHIBIDO respetado:** nada de azar/apuestas. La economía es plantar y
    cosechar, 100% determinística.

### D10 — Crecimiento por acumulador de segundos por cultivo
**Por qué:** cada cultivo guarda `{etapa, seg}` y `seg` acumula segundos reales en
`update(dt)`. Es robusto frente a recargas (se persiste) y no depende de relojes
absolutos ni de que el día/noche esté activo. Plantar es gratis (huerta
comunitaria, tono costumbrista); cosechar paga. Sin azar.

### D9 — Tinte como una sola capa de color (no shaders)
**Por qué:** un rectángulo a pantalla completa con color+alpha fijado a la cámara
(depth 8000, debajo de la UI) es lo más liviano y compatible. Se interpola entre
claves horarias. Evita pipelines/shaders que podrían no andar en GPUs viejas o
en el WebGL del celular. `minutosAbsolutos()` expone el tiempo para la granja.

### D8 — Misiones en cadena lineal y completables sólo hablando
**Por qué:** el requisito pide misiones que "se inician y completan hablando con el
NPC correcto". Se modeló cada misión como cadena de 3 toques (NPC que la da → NPC
objetivo → volver al que la dio), con una sola misión activa por vez para que la
pista en pantalla sea siempre clara. El "!" sobre el NPC correcto guía sin texto.
Es robusto (máquina de estados simple en `estado.misiones[id]`) y bolt-on para
sumar misiones paralelas o por ítems más adelante.

### D7 — Bug encontrado y corregido por el smoke-test
El helper `check()` del smoke-test marcaba como FAIL cualquier retorno "truthy"
no booleano (p. ej. el sprite del jugador). Se corrigió para tratar truthy como
PASS y string como motivo de falla. El autotest cumplió su función: atrapó el
problema antes de cerrar la fase.
