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

### D22 — C2.1: joystick analógico como alternativa al d-pad
**Por qué:** `CONFIG.joystickAnalogico` agrega `js/joystick.js` (`AJ.Joystick`): un
joystick táctil DOM abajo-izquierda que, cuando está on, **reemplaza** al d-pad (el
CSS oculta el d-pad con `body.joystick-on`) para no encimarse. Alimenta el mismo
`AJ.Input.estado` con **snap a 4 direcciones** (el juego es 4-dir), así el jugador no
cambia. **Zona muerta y radio** tuneables y documentados en `CONFIG.JOYSTICK`.
Verificado: smoke 58/58, arrastrar setea la dirección correcta (con snap), soltar
limpia, el jugador se mueve. El *feel* queda para playtest humano (anotado en PLAYTEST).

### D23 — C2.2: menú de pausa/opciones (QoL, sin tocar balance)
**Por qué:** `CONFIG.menu` agrega `js/menu.js` (`AJ.Menu`): overlay de pausa con
Reanudar, mute, Controles/Ayuda, **Reiniciar partida con DOBLE confirmación**
(confirmar → confirmar2 → borrar) y Volver al título. Botón DOM `#btn-menu` (al lado
del mute) + tecla **P**; Esc cierra el menú antes que volver al título.
- **Pausa real:** con el menú abierto, `Pueblo.update` congela jugador, interacción y
  TODOS los ticks (no pasa el tiempo). Verificado en el smoke (el reloj no avanza).
- El reinicio borra el guardado y arranca juego nuevo (verificado: monedas/misiones a
  cero). No toca el balance. Smoke 59/59.

### D24 — C2.3: brújula hacia la misión activa
**Por qué:** `CONFIG.brujula` agrega `js/brujula.js` (`AJ.Brujula`): una flecha
discreta (amarilla, con latido) alrededor del jugador que apunta al NPC objetivo de
la misión activa del pueblo. Si en el pueblo actual ya no hay misión pendiente pero
sí en el OTRO pueblo, apunta a la **salida** (te guía a viajar). Se oculta cuando ya
estás al lado del objetivo. Textura generada por código. Verificado: smoke 60/60,
apunta al NPC correcto y a la salida en el caso cruzado.

### D25 — C2.4: robustez final (bordes sobre lo nuevo)
**Por qué:** el smoke (sin flag) sumó bordes sobre C1/C2: B8 viajar a mitad de misión
con estado de 2 pueblos (round-trip), B9 joystick sin jugador (escenas sin movimiento)
no rompe, B10 reset deja estado limpio, B11 NPCs/misiones por pueblo coherentes. Todos
no destructivos. Resultado honesto: **ningún borde reveló un bug nuevo** (la base es
robusta por los try/catch por sistema y el guardado defensivo). Smoke 64/64 (Pueblo 1),
65/65 (Colonia). De C1 ya se habían arreglado 2 bugs de no-destructividad del smoke.

### D26 — D1: poblar el mundo (más vecinos, reusando texturas)
**Por qué:** `CONFIG.poblarMundo` suma 6 vecinos nuevos (3 por pueblo) con diálogo y
afinidad, **sin tocar el arte** (reusan las 10 texturas de NPC existentes) ni agregar
mecánicas. El contenido (nombres, voces costumbristas) se generó con un **workflow de
3 agentes** (un escritor por pueblo + un crítico-editor) que, entre otras cosas,
**detectó y reescribió una misión que era una rifa con plata** → colecta cívica (regla
no-apuestas). Se agregó `AJ.ROSTER_BASE`/`AJ.ROSTER_D1`/`AJ.roster()` como fuente única
de la lista de vecinos (la usa el Registro D3); `_defsPueblo1/_defsColonia` derivan los
nuevos de `ROSTER_D1` (gated). Un smoke-check verifica que ningún NPC creado quede fuera
del roster (anti-drift). Verificado: Pueblo 1 66/66 (9 NPCs), Colonia 67/67 (8 NPCs).

### D27 — D2: más misiones plantilla (insertadas sin romper el final)
**Por qué:** `CONFIG.masMisiones` suma 4 misiones (`AJ.MISIONES_D2`, 2 por pueblo),
concatenadas a `AJ.MISIONES` sólo si `masMisiones` **Y** `poblarMundo` (usan los
vecinos de D1). Las del pueblo 1 se **insertan ANTES de `fiesta`** (que sigue siendo el
gran final que dispara la pantalla Final); las de la Colonia van al final de su cadena.
Reusan el sistema de misiones por pueblo (C1.2) → progreso persistido por id. Contenido
del mismo workflow (genérico; la rifa fue reescrita como colecta). Verificado: 11
misiones totales, cadena Pueblo 1 = [bienvenida, plaza, acto, aguada, pu1_quiosco,
pu1_sirena, fiesta], Colonia = 4; completar `pu1_quiosco` da recompensa y avanza a
`pu1_sirena`. Pueblo 1 67/67, Colonia 68/68.

### D28 — D3: Registro del Agente (meta-progresión)
**Por qué:** `CONFIG.registro` agrega `js/registro.js` (`AJ.Registro`): colección estilo
Pokédex que se llena sola — vecinos conocidos (hook en `_hablarCon`), pueblos visitados
(hook al crear la escena), misiones cumplidas y logros (derivados del estado), con un %
global. Sólo lectura/registro, **no toca el balance**. Lo conocido se guarda en
`estado.registro = {vecinos,pueblos}` (persistido); misiones/logros se derivan (no se
duplican). Totales: `AJ.roster()` (vecinos), `AJ.totalPueblos()`, `AJ.MISIONES.length`,
`AJ.logrosTotales()`. Accesible desde el menú (nueva sub-vista "Registro / Opciones").
- **Bug latente que el Registro hizo visible:** el auto-smoke (checks de granja/crafteo)
  agregaba logros y NO los restauraba → en juego nuevo aparecían 2 logros. Se agregó
  `logros` y `registro` al snapshot/restore del smoke. Ahora juego nuevo = 0 logros.
- Verificado: smoke 69/69, panel con barras de avance, persistencia (vecinos/pueblos
  sobreviven recarga + Continuar).

### D29 — D4: tercer pueblo "El Puesto del Monte" (gated, verificado solidez)
**Por qué:** `CONFIG.tercerPueblo` agrega un 3er mapa vía la fábrica `AJ.Mapa.cargar(id)`
(ya soportaba multi-pueblo). Topología lineal: Pueblo ↔ Colonia ↔ Puesto. La Colonia
gana una 2ª salida al este (gated) hacia el Puesto; el Puesto vuelve a la Colonia.
**El Puesto NO es relleno:** outpost de monte con huerta (farmear), mesa de oficios
(craftear), mucho caldén (leña) y aguada — útil y completo, sin NPCs/misiones
(conNPCs=false). `AJ.totalPueblos()` pasa a 3 (el Registro lo cuenta). Sin tocar el
arte. Se mantuvo el bar alto que pedía la consigna: **viaje en cadena en ambos
sentidos, guardado por pueblo y smoke 61/61 en el Puesto, verificados** (un resultado
intermedio "raro" fue artefacto de timing de un eval async, no un bug). Fix menor: el
check de Registro asumía un NPC para registrar; ahora sólo lo exige donde hay vecinos.

### D30 — E1: pantalla de progreso/estadísticas (sólo lectura)
**Por qué:** `CONFIG.progreso` agrega `js/progreso.js` (`AJ.Progreso`): panel que lee del
Registro (D3) + el estado y muestra % global, tiempo jugado (nuevo: `estado.tiempoJugado`,
contado en `Pueblo.update` salvo en pausa), día, monedas, misiones por pueblo y afinidad
(corazones) por cada vecino conocido. Sólo lectura, no toca nada. Accesible desde el menú.
Verificado: smoke 72/72, panel con stats correctas (754s → "12m 34s"), el tiempo avanza.

### D31 — E2: accesibilidad (opciones del jugador, no defaults)
**Por qué:** `CONFIG.accesibilidad` agrega `js/accesibilidad.js` (`AJ.Accesibilidad`):
opciones que ELIGE el jugador y se guardan en localStorage (valen para todas las
partidas). La headline es la **velocidad de texto del diálogo** (lento/normal/rápido/
instantáneo): un typewriter en `dialogo.js` (gated; default instantáneo = comportamiento
original; la acción completa el tramo si se está revelando). Esto **le da la perilla al
jugador** en vez de adivinar "el ritmo correcto". También: tamaño de texto del diálogo
(escala 1.0/1.3, en vivo) y alto contraste (clase `alto-contraste` para botones DOM +
contorno del texto del diálogo). Panel de opciones reutilizable (menú y, en E3, título).
Verificado: smoke 74/74, typewriter revela parcial y la acción completa, opciones aplican
y persisten tras recargar.

### D32 — E3: menú principal pulido + créditos
**Por qué:** `CONFIG.creditos` agrega `js/creditos.js` (`AJ.Creditos`): overlay de
créditos GENÉRICO (sin nombres/marcas/programas reales; menciona la regla no-apuestas)
accesible desde el título, el menú de pausa y la pantalla final. El título suma botones
"⚙ Opciones" (abre el panel de accesibilidad) y "📜 Créditos", con acceso claro a
opciones. QoL, no toca el balance. Verificado: smoke 75/75, título con los 4 botones,
créditos abre/cierra desde título/menú/final.

### D33 — E4: robustez final (bordes sobre D/E)
**Por qué:** el smoke (sin flag) sumó 4 bordes: B12 Registro+tiempo a mitad de partida
(round-trip), B13 opciones de accesibilidad sobreviven recarga (localStorage), B14 viaje
al 3er pueblo + recarga, B15 el Final depende de la cadena principal (pueblo 1), NO del
Registro (se puede ganar con el Registro incompleto). Todos no destructivos. Resultado:
**ningún borde nuevo reveló un bug** (base robusta). Smoke Pueblo 1 **79/79**, El Puesto
**70/70**. En total esta noche: snapshot/restore del smoke ampliado (logros, registro,
afinidad, misiones) y 2 bugs de no-destructividad/visibilidad corregidos (logros tras
auto-smoke; check de Registro asumía NPC).

### D34 — Fixes del review adversarial (workflow de 20 agentes)
**Por qué:** un workflow de review (5 reviewers por dimensión + verificadores escépticos)
sobre el diff D/E confirmó **13 bugs reales** (agrupados en 5 issues). Todos corregidos:
1. **Sub-panel zombi (severidad alta):** cerrar el menú con P/ESC dejaba el sub-panel
   (Registro/Progreso/Accesibilidad/Créditos) pegado y **despausaba el juego** → el
   jugador caminaba a ciegas. Fix: `Menu.cerrar()` cierra en cascada los sub-paneles
   (se expuso `AJ.Accesibilidad.cerrarPanel`).
2. **Fuga de flag OFF:** el menú mostraba/abría "Accesibilidad" aunque
   `CONFIG.accesibilidad` estuviera en false (el IIFE siempre existe). Fix: gatear con
   `AJ.Accesibilidad.activo()` (como ya hacía Titulo.js).
3. **Registro inalcanzable al 100%:** `AJ.roster()` contaba vecinos de la Colonia aun con
   `npcsColonia` off, y `AJ.logrosTotales()` contaba logros de granja/crafteo apagados.
   Fix: ambos gateados por sus flags.
4. **Desync `mapaActual`:** un save en el 3er pueblo con `tercerPueblo` off caía al pueblo
   1 pero el estado seguía en 3. Fix: `Pueblo.init` reconcilia `mapaActual` y reubica al
   jugador en el spawn.
5. **Merge de `registro`:** no rellenaba la sub-clave `pueblos` si faltaba. Fix: merge con
   `pueblos || {}`.
Verificado: smoke con +3 checks nuevos (cierre de sub-paneles, 100% alcanzable, gating).
El pueblo **81/81**, Colonia **82/82**, El Puesto **72/72**, sin errores de consola.

### D35 — F1: creador de Agente (identidad + recoloreo del sprite)
**Por qué:** `CONFIG.creadorAgente` agrega `js/agente.js` (`AJ.Agente`): al "Jugar" el
jugador elige nombre (máx 12), pronombre (él/ella/elle) y variante visual (4 recoloreos
del sprite base, **sin arte nuevo**). Se guarda en localStorage. El creador es un overlay
DOM (input de texto + swatches + pronombre), fiable en celular. `art.js personaje()`
recolorea con `AJ.Agente.colores()` (variante 0 = colores originales → sprite idéntico);
al confirmar se borran las texturas `jugador_*` para que el preload las recree con la
variante. El nombre reemplaza el vocativo "Agente" en los diálogos con
`/\bAgente\b(?! Juvenil)/` (no toca el título "Agente Juvenil"). Verificado: creador
funciona, sprite recolorea (variante 2 = verde, variante 0 = celeste original), el
diálogo dice el nombre elegido y "Agente" cuando no hay nombre. Smoke 82/82.

### D36 — F2: capa de arte (PNG-first / procedural-fallback) vía manifiesto
**Por qué:** `CONFIG.capaArte` deja el juego **artist-ready**: `art.js` ahora expone
`preparar(scene)` (lo llama `Pueblo.preload`). Si `capaArte` está off o el manifiesto
está vacío, genera todo procedural **sincrónico, idéntico a siempre**. Si hay PNGs
listados en `assets/manifest.js`, los carga (`assets/tiles|sprites/<nombre>.png`) y el
generador procedural rellena lo que falte (cada generador saltea claves ya existentes).
- **Manifiesto en vez de probe ciego:** probar a ciegas 40+ PNGs inexistentes ensucia la
  consola con 404 (rompe el invariante "abre sin errores"). El manifiesto mantiene la
  consola limpia a cambio de un paso extra (listar el nombre). Documentado en ARTE.md y
  README.md.
- **Verificado end-to-end:** manifiesto vacío → procedural, **cero 404s**, smoke 83/83;
  con `assets/tiles/pasto.png` (PNG de prueba magenta) + entrada en el manifiesto, el
  tile `pasto` se cargó del PNG (4×4 magenta), overrideando el procedural; al quitar el
  PNG, volvió a procedural. Sin tocar el arte generado (sólo se agregó el gancho de carga).

### D37 — F4: estadísticas de sesión acumuladas (localStorage aparte del save)
**Por qué:** `CONFIG.estadisticas` agrega `js/estadisticas.js` (`AJ.Stats`): contadores
**acumulados entre TODAS las partidas** (tiempo total, pasos, NPCs conocidos distintos,
diálogos leídos, misiones por pueblo), de sólo lectura en el panel de Progreso (E1).
- **localStorage propio (`aj_stats_v1`), separado del save del juego.** Igual que las
  preferencias de accesibilidad/agente: son datos del jugador que valen para todas las
  partidas, no parte de una partida. Así, "Reiniciar partida" borra el save pero NO la
  vida estadística (decisión: las estadísticas son historia personal, no progreso de save).
  Distinto del `estado.tiempoJugado` (E1), que es **por partida**; el panel ahora muestra
  ambos: "Tiempo (partida)" y "Tiempo total (todas tus partidas)".
- **Escritura con throttle:** los contadores se acumulan en memoria y `flush()` escribe a
  localStorage sólo en el autoguardado del Pueblo y en `beforeunload` (no en cada frame).
  Evita castigar el disco con el conteo de tiempo/pasos por frame.
- **Hooks aditivos y guardados** (no-op si el flag está off): `Pueblo.update` (tiempo salvo
  en pausa; un paso por tile nuevo), `dialogo` (+1 por tramo leído, NO al completar el
  typewriter), `_hablarCon` (NPC distinto), `misiones._completar` (misión por pueblo).
- **Panel:** se subió el alto (540) y se capeó la lista de amistad a 6 para que la sección
  nueva entre sin desbordar ni en el peor caso (verificado: 17 vecinos + 3 pueblos no
  solapan el botón Volver).
- Verificado: smoke 84/84 con un check no destructivo (snapshot/restore de `aj_stats_v1`);
  caminar suma pasos, hablar registra NPCs distintos, diálogos cuentan por tramo, y los
  valores **persisten y acumulan tras recargar** (123.5s → sobrevive el reload).

### D38 — F5: robustez final de la Capa F (bordes en el smoke, no destructivos)
**Por qué:** el smoke (sin flag) sumó 4 bordes sobre lo nuevo: (1) **nombre de Agente
vacío/en blanco** no rompe el diálogo (deja "Agente"; ya lo cubría el guard de `nombre()`,
ahora con aserto); (2) **variante visual** persiste tras un "reload" (init re-lee
localStorage) y el sprite vivo coincide con la variante activa (verificado por pixel);
(3) **capa de arte:** `generarTodo` es **idempotente** — el camino real del fallback es
"cargó PNGs → generarTodo rellena lo que falte", así que re-ejecutarlo con texturas
presentes no debe borrar ni romper nada; (4) **estadísticas** acumulan entre 3 sesiones
simuladas (flush + reload + flush).
- **Bug de verificación atrapado (no de producción):** la primera versión del check de arte
  **removía `pasto`** (textura en uso por los tiles en pantalla) para probar el relleno →
  los sprites quedaban con `glTexture` null y el render crasheaba. Se reemplazó por el check
  de idempotencia (no remueve texturas vivas), que prueba la MISMA propiedad sin el hazard.
  Lección: en el smoke, nunca remover una textura que la escena está renderizando.
- Resultado honesto: **ninguno de los 4 bordes reveló un bug de producción** — el código de
  F1/F2/F4 ya se comportaba bien. Smoke al cierre: **Pueblo 1 88/88, Colonia 89/89, El
  Puesto 79/79**, sin errores de consola.

### D39 — G1: Modo Gestión, capa de datos (modelo real como banco interno)
**Por qué:** `CONFIG.modoGestion` abre el Modo Gestión del GDD como sistema **aditivo** sobre
el RPG (no lo toca), todo bajo `AJ.Gestion` en `js/gestion/datos.js`.
- **Datos como fuente única:** 5 medidores (Agencia 0–20; los otros 0–100), 10 comunidades con
  rareza/tags, 4 niveles, 5 líneas de actividad, problemáticas con flag `sensible`, regiones.
- **Restricción §11 resuelta:** la tabla real de 80 pueblos (Apéndice A) es **modelo interno**.
  No se nombran localidades reales en el juego: se guarda sólo la **distribución anonimizada**
  por nivel (`MODELO_NIVEL`, sólo cantidades) y los pueblos jugables son **inventados**
  (`PUEBLOS`, p. ej. "Paraje El Chañaral"). Así el banco es fiel sin filtrar nombres reales.
- **Estado:** `AJ.Gestion.Estado` arma `estado.gestion` por pueblo (medidores con clamp,
  `asegurar/actual/aplicarImpacto`). `guardado.js` suma el campo `gestion` (migración
  defensiva: saves viejos no rompen). El arranque (`AJ.Gestion.init` desde
  `Pueblo._iniciarSistema`) sólo asegura el estado; **sin UI** (eso llega en G2+).
- Verificado: smoke 92/92, el medidor persiste tras guardar/recargar, consola limpia.

### D40 — G2: onboarding (lógica pura + UI, separadas para testear)
**Por qué:** `CONFIG.onboarding` hace jugables los 4 pasos de la Hoja de Ruta (GDD §3) en
`js/gestion/onboarding.js`, partido en **lógica pura** (`AJ.Gestion.Onboarding`, testeable sin
DOM) y **UI** (`AJ.Gestion.OnboardingUI`, asistente DOM estilo creador F1).
- **Mecánicas fieles al GDD:** convocatoria con efectividad de canales **por nivel** (boca a
  boca gana en pueblo chico; redes en grande) + el mate; diagnóstico (charla/encuesta) que sube
  Conocimiento y **descubre** las comunidades del pueblo + las problemáticas NO sensibles;
  objetivos (bautizo + 2–3 metas); organización (reclutar capeado por candidatos). **≥3 = Agencia;
  <3 = Referente solo** (penalidad que se cobra en G4).
- **Freeze de movimiento:** `AJ.Gestion.modalAbierta()` (consultado por `Pueblo.update`) congela
  al jugador mientras el asistente está abierto. Entrada **temporal** por tecla **G** hasta G5.
- Verificado: smoke 95/95; wizard end-to-end (bautiza, recluta, fase→gestión); congela el movimiento.

### D41 — G3: motor de dilemas + contenido por workflow, con lo sensible a mano
**Por qué:** `CONFIG.dilemas` agrega el motor (GDD §7) en `js/gestion/dilemas.js`: dilema =
dato `{situacion, opciones:[{impactos, reaccion, requiereTirada?}]}`; `resolver()` aplica
impactos con clamp y marca resuelto; UI DOM (tecla **H**).
- **Contenido genérico por workflow, validado dos veces:** 6 dilemas a mano + **20 generados por
  un workflow** (7 escritores por tema NO sensible + 1 crítico-editor que aplicó las
  restricciones), y luego **re-validados por código** (medidores válidos, ids únicos, trade-off
  real, scan anti nombres-reales / temas-sensibles / plata). Quedó separado el banco
  (`dilemas_banco.js`) del motor → reskinable.
- **Lo sensible NO se autogenera (regla dura, §7/§11):** salud mental, consumos, violencias y
  bullying van a `CONTENIDO_SENSIBLE.md` (estructura + plantilla + reglas de cuidado), los carga
  un humano vía `registrarSensibles()`; el banco sensible **arranca vacío**. El smoke verifica
  que siga vacío y que ningún dilema genérico tenga problemática sensible.
- Verificado: smoke El pueblo 98/98, Colonia 99/99, El Puesto 89/89; resolver end-to-end.

### D42 — G4: dado con arco suerte→competencia (emergente de un modelo lineal)
**Por qué:** `CONFIG.tiradas` agrega el dado (GDD §8) en `js/gestion/tiradas.js`. **El dado es
mecánica, NUNCA plata real** (§11).
- **El arco es emergente, no scripteado:** `modMedidor` mapea cada medidor a un modificador que
  va de **negativo** (valor bajo) a **positivo** (valor alto). Con medidores bajos los mods
  restan y dependés del dado (suerte); con medidores altos suman y un dado mediocre alcanza
  (competencia). El conocimiento es el modificador por defecto; `bonus` modela estudio/creatividad.
- **Resultados graduados** (crítico/éxito/parcial/fracaso) por margen, con nat20=crítico y
  nat1=fracaso (tensión hasta con todo alto). `escalarImpactos` modula la opción según el
  resultado (crítico agranda lo bueno; fracaso anula lo bueno y agranda el costo). **Referente
  solo paga −3.** `Dilemas.resolver` usa la tirada si la opción `requiereTirada`.
- **Determinismo para tests:** `tirar()` acepta `dadoForzado`; el smoke verifica umbrales, arco,
  escalado y penalidad sin azar.
- **El balance del dado es lo más sensible al feel** → defaults razonables, ajuste a PLAYTEST.md.

### D43 — Review adversarial del Modo Gestión (workflow) + fixes al cierre
**Por qué:** al cerrar G4 se corrió un **workflow de review** (4 revisores por dimensión —
restricciones GDD, anti-rotura, lógica, contenido— + verificadores escépticos por hallazgo).
12 hallazgos, **7 confirmados**. Corregidos (verificado, no asumido):
1. **(ALTA) ESC dejaba el overlay DOM de gestión huérfano** al salir al Título (los modales son
   DOM, la transición de escena no los borra): el Título quedaba inutilizable. Fix: el handler
   ESC, si `AJ.Gestion.modalAbierta()`, cierra los modales y **no** sale; `shutdown()` también los
   cierra (red de seguridad ante viaje con un modal abierto). Helper `_cerrarModalesGestion()`.
2. **(baja) Gating incoherente:** las teclas G/H abrían modales aun con `modoGestion` off (y el
   dilema quedaba "mudo" porque `resolver` no tenía estado). Fix: exigir `modoGestion` en ambos gates.
3. **(baja) Hueco de cobertura:** el smoke no verificaba el freeze ni el cierre limpio de los
   modales. Fix: check de integración (modalAbierta on/off, **congela el movimiento — no el reloj**,
   `_cerrarModalesGestion` no deja overlay). *(El verificador corrigió la premisa: un modal de
   gestión congela el movimiento como el menú de crafteo, pero el reloj sólo lo frena la pausa.)*
4. **(baja) y 5. (baja) Redondeo asimétrico en `escalarImpactos`:** un costo chico (−1/−2) no se
   amplificaba en fracaso y podía desaparecer en crítico. Fix: redondeo **simétrico** (alejándose
   de cero) para la magnitud; `factorPos 0` (fracaso) sigue anulando los positivos. Smoke nuevo lo fija.
6. **(media) Opción de negociación "gratis" en 2 dilemas de poder** (intendente/concejal 'c' sólo
   sumaban): se les dio un **costo real** (agencia −1 / convicción −2) para alinear con el resto del
   banco (toda opción paga algo, salvo las cooperativas win-win y las que van a tirada).
7. **(media) El validador no exige trade-off por opción:** **no se cambió** a propósito — las
   opciones cooperativas win-win (coordinar con el club, prestar la sala) son diseño legítimo
   (GDD: la tensión es del estado global, no de cada opción). El invariante real ("cada dilema
   tiene al menos una opción con costo") **ya lo verifica el smoke**; un lint por-opción daría
   falsos positivos sobre esas cooperativas.
- Smoke al cierre (con fixes + 2 checks nuevos): **El pueblo 105/105, Colonia 106/106, El Puesto
  96/96 PASS**, sin errores de consola.

### D44 — G5: ciclo de 30 días + mudanza (el ciclo manda sobre las fases)
**Por qué:** `CONFIG.cicloGestion` (`js/gestion/ciclo.js`) integra G1–G4 en el loop del GDD §2.
- **El ciclo es la autoridad de `fase`/`dia`.** El onboarding (G2) seteaba `fase='gestion'` al
  terminar; en el ciclo eso es prematuro (la fase la decide la oferta de rol del día 5). En vez de
  tocar G2, el callback del wizard **desde el ciclo** reescribe `fase='recon'` y cuenta la acción.
  Así G2 sigue válido standalone y el ciclo no se contamina (cero cambios en onboarding.js para esto).
- **Las teclas G/H dejan de ser sueltas.** Con `cicloGestion` on, **G abre el menú del día** (hub
  que reparte onboarding/dilemas/actividades y consume las 3 acciones); sin el ciclo, G/H siguen
  como en G2/G3. El menú del día es un overlay DOM (consistente con onboarding/dilemas) y queda
  cubierto por `modalAbierta`/`_cerrarModalesGestion`/ESC (no deja overlays huérfanos, lección de D43).
- **Actividades** (las 5 líneas, §9) se resuelven con el dado (G4); sin la infra del pueblo cuestan
  más (gancho `bonusComunidad` para G6). **Perfil** al día 30 por reglas sobre los medidores. **Mudanza:**
  `estado.gestion.pueblos[id]` ya guardaba por pueblo (G1), así que mudarse = crear/reusar el estado
  del destino + heredar experiencia (piso de Confianza, +Conocimiento por mudanza); el origen queda intacto.
- Verificado: smoke +7 (transiciones, 3 acciones/día, perfil, referente solo, mudanza, actividad, UI);
  menú del día end-to-end. El pueblo 112/112.

### D45 — G6: descubrimiento e integración de comunidades (bonus por conocer)
**Por qué:** `CONFIG.comunidades` (`js/gestion/comunidades.js`) hace jugable el GDD §5, aditivo.
- **Descubrimiento gamificado** reusando la idea del Registro (D3): en pueblo chico las comunidades
  arrancan ocultas y `revelarUna` destraba **la más común primero** (las raras = "hallazgo"). El
  diagnóstico del onboarding pasa a revelar **sólo 2** con el flag on (antes, todas), dejando el resto
  para explorar. **Latentes:** las 2 más raras que el pueblo no tiene; el jugador las **siembra**
  (cuesta capital político). En **nivel 4** se invierte a **integración**: `prepararPueblo` revela las
  10 y aparece la **actividad-puente** (`resolverPuente`) que junta comunidades conocidas, vale más.
- **El conocimiento como ventaja concreta** (GDD §8): `bonusActividad` da +2 de dado por cada
  comunidad afín que **existe y conocés** (cap +6), enganchado al stub `Actividades.bonusComunidad`
  de G5 (override limpio desde comunidades.js, sin reescribir ciclo.js). **Cooperación regional:** si
  falta la infra, podés pedir la del pueblo vecino → tirás en dificultad normal a cambio de −Confianza.
- Verificado: smoke +5 (descubrimiento gradual, bonus, latentes, integración+puente, diagnóstico
  parcial); chips de comunidades en el menú del día. El pueblo 117/117.

### D46 — G7: robustez del Modo Gestión (persistencia de extremo a extremo)
**Por qué:** el smoke (sin flag) sumó 6 bordes sobre TODO el Modo Gestión, con foco en **persistencia**
(los checks por capa usaban estados de prueba; G7 verifica el round-trip por el save real, con una
clave de guardado aparte para no tocar la partida): estado a mitad del día 12, mudanza con estado por
pueblo, 30 días → perfil, referente solo, comunidad revelada, tirada con/sin modificadores. Resultado
honesto: **ningún borde reveló un bug** — el estado de gestión vive en `estado.gestion` y `guardado.js`
ya lo migra/persiste (G1). El pueblo 123/123, Colonia 124/124, El Puesto 114/114.

### D47 — Review adversarial de G5–G7 (workflow) + fixes al cierre
**Por qué:** al cerrar G5–G7 se corrió otro workflow de review (4 dimensiones — anti-rotura, lógica del
ciclo, lógica de comunidades, UI del menú del día — + verificadores escépticos). 7 hallazgos, **4
confirmados**, todos corregidos (verificado con checks de regresión):
1. **(ALTA) Cancelar "Armar la Agencia" quemaba un día de recon:** el callback del wizard contaba el
   día aunque el jugador cancelara en el paso 1 (`onDone(null)`). Fix: contar el día sólo si `res`.
2. **(media) `mudarse()` re-aplicaba el bonus de experiencia en cada reentrada** (rebotar A↔B
   ratcheteaba Conocimiento y re-pisaba el piso de Confianza). Fix: aplicar el bonus —e incrementar
   `experiencia.mudanzas`— SÓLO al pisar un pueblo por primera vez. Reentrar conserva su estado.
3. **(media) Un dilema podía resolverse "gratis"** (cerrar con ESC entre elegir opción y "Seguir"
   aplicaba el efecto pero no consumía la acción). Fix: el menú del día **consume la acción al abrir**
   el dilema (como las actividades), así resolver-y-salir ya pagó el turno.
4. **(baja, defensivo) `prepararPueblo` (integración) no marcaba conocidas las latentes activadas**
   (hoy no se pueden sembrar en nivel 4; cubre saves migrados). Fix: usar `presentes()` en vez de
   `delPueblo()`.
- Smoke al cierre (con fixes + 3 checks de regresión): **El pueblo 126/126, Colonia 127/127, El
  Puesto 117/117 PASS**, sin errores de consola.

### D48 — Render 16-nativo ×2 vía `setDisplaySize`, NO zoom de cámara
**Por qué:** se decidió arte CC0 estilo Kenney **16×16**, así que el render pasó de 32×32 a **16
nativo escalado ×2** (look GBA). Había dos formas:
- **(A) Zoom de cámara ×2 + grilla interna a 16.** El camino "natural", pero en Phaser el zoom de
  cámara escala **TODO** lo que renderiza esa cámara, **incluida la UI con `scrollFactor(0)`**: HUD,
  diálogo, Cuaderno, Registro, Progreso, brújula, menús, paneles de accesibilidad/créditos/afinidad…
  Todo se duplicaría y la UI quedaría rota/desalineada. Arreglarlo exige una **cámara de UI aparte**
  con listas de "ignore" por objeto en ~15 sistemas → cirugía enorme y riesgosa.
- **(B, elegida) Texturas 16-nativas + `setDisplaySize` por objeto del mundo; grilla/colisión/
  cámara/UI quedan en 32 px de pantalla.** `art.js` dibuja a 16×16 / 16×24; cada objeto del mundo
  (tiles en `_dibujarMapa`, jugador, NPCs, cultivos, mesa) se muestra con `setDisplaySize` a su
  tamaño de pantalla (32/48). Con `pixelArt:true` (NEAREST) + `roundPixels`, escalar ×2 es crujiente.
- **Ventajas de (B):** colisiones, cámara, movimiento, velocidad y **toda la UI Phaser** quedan
  intactas (cero cambios) → respeta la REGLA DE ORO. `setDisplaySize(32,32)` es **robusto a cualquier
  tamaño de PNG real** (un 16×16, un 32×32, etc., caen igual a 32 px). Un PNG CC0 16×16 (Kenney) entra
  directo. La "grilla interna a 16" del pedido se reinterpreta: lo que importa para el drop-in de PNGs
  es que **el arte sea 16-nativo**, y eso se cumple; la grilla lógica sigue siendo 40×30 tiles.
- **Detalles:** `brujula_flecha` (icono UI de código) se dejó en 32×28 (no es un tile/sprite Kenney).
  El check F5 del smoke leía `getPixel(16,28)` del sprite (fuera de rango en 16×24) → movido a (8,13)
  = camisa. `art.js` exporta `TW/TH/PW/PH` (16/16/16/24).
- Verificado: textura jugador 16×24 nativa / 32×48 en pantalla, pasto 16/32; el jugador camina, choca,
  la cámara sigue; frame con escena variada (19 colores, no garabato); el Modo Gestión y todo lo demás
  siguen andando; el verificador de assets no crashea. **El pueblo 128/128, Colonia 129/129, El Puesto
  119/119 PASS**, consola limpia.

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
