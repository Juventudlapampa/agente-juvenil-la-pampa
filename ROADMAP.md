# ROADMAP.md — Pendientes y futuras noches

Estado de fases y trabajo bolt-on diseñado para sumarse sin reescribir.

## Estado de fases

- [x] **FASE 1 — Espina:** título, mapa del pueblo, jugador, colisiones,
      cámara, guardado. _(jugable y commiteada)_
- [x] **FASE 2 — Diálogo + Misiones** (`CONFIG.npcsDialogo`, `CONFIG.misiones`)
      _(NPCs, diálogo RPG, 5 misiones cívicas, HUD cuaderno, Final. Commiteada.)_
- [x] **FASE 3 — Tiempo vivo / día-noche** (`CONFIG.diaNoche`)
      _(reloj + tinte horario interpolado. Commiteada.)_
- [x] **FASE 4 — Granja** (`CONFIG.granja`)
      _(plantar/crecer/cosechar + monedas, persistente. Commiteada.)_
- [x] **FASE FINAL** — pantalla de cierre al completar las 5 misiones.
      _(gatillo desde misiones.js verificado: llega al Final con resumen.)_

### Segunda tanda de fases (bolt-on, detrás de flags nuevos)

- [x] **FASE A — Rutinas + afinidad** (`CONFIG.rutinas`)
      _(NPCs caminan a la plaza/trabajo/hogar por hora con pathfinding BFS;
      afinidad por vecino visible en el panel "Cuaderno · Vecinos". Smoke 28/28.
      Commiteada.)_
- [x] **FASE B — Estaciones** (`CONFIG.estaciones`)
      _(4 estaciones derivadas del día: tinte de paleta + factor de crecimiento
      de cultivos. Smoke 32/32. Commiteada.)_
- [x] **FASE C — Crafteo simple** (`CONFIG.crafteo`)
      _(mesa de oficios + 5 recetas que combinan verdura (cosecha) y leña
      (caldenes); ítems persistentes. Smoke 38/38. Commiteada.)_
- [x] **FASE D — Varios pueblos / viaje** (`CONFIG.viaje`) — riesgo ALTO, hecha.
      _(2º pueblo "Colonia La Esperanza" + viaje ida y vuelta por tiles de salida;
      el guardado recuerda el pueblo. Pueblo 1 smoke 42/42, Colonia 35/35.
      Commiteada.)_

### Capa 2 — Pulido (P1–P5)

- [x] **P1 — Juice** (`CONFIG.juice`): tweens, fades de escena, shake, feedback.
- [x] **P2 — Sonido procedural** (`CONFIG.sonido`): Web Audio, mute, sin descargas.
- [x] **P3 — UX y táctil** (`CONFIG.uiPulida`): diálogo con placa, d-pad afinado.
- [x] **P4 — Robustez** (sin flag): 7 casos de borde en el smoke.
- [x] **P5 — Balance** (sin flag): `CONFIG.BALANCE` centralizado + `PLAYTEST.md`.
- Smoke al cierre de la Capa 2: 55/55 (Pueblo 1), 47/47 (Colonia).

### Capa C1 — Vida en la Colonia

- [x] **C1.1 `npcsColonia`**: 5 vecinos propios de la Colonia con diálogo/afinidad.
- [x] **C1.2 `misionesColonia`**: 2 misiones propias; progreso por pueblo separado.

### Capa C2 — Controles, opciones y cierre

- [x] **C2.1 `joystickAnalogico`**: joystick táctil (alternativa al d-pad).
- [x] **C2.2 `menu`**: pausa/opciones + reset con doble confirmación.
- [x] **C2.3 `brujula`**: guía hacia la misión activa / la salida.
- [x] **C2.4** (sin flag): casos de borde sobre lo nuevo.
- Smoke al cierre de C2: **Pueblo 1 64/64, Colonia 65/65**.

> Regla: un sistema sólo pasa a `true` en `config.js` cuando su smoke-test da PASS.
> Lo que quede dudoso se deja en `false` y se anota acá.

### Capa D — Más mundo y más para hacer

- [x] **D1 `poblarMundo`**: +6 vecinos (3 por pueblo), reusando texturas.
- [x] **D2 `masMisiones`**: +4 misiones (requiere poblarMundo).
- [x] **D3 `registro`**: Registro del Agente (colección + %).
- [x] **D4 `tercerPueblo`**: "El Puesto del Monte" (outpost de monte).

### Capa E — Meta, cierre y accesibilidad

- [x] **E1 `progreso`**: pantalla de progreso/estadísticas.
- [x] **E2 `accesibilidad`**: vel. de texto / tamaño / contraste (elegibles).
- [x] **E3 `creditos`**: título pulido + créditos.
- [x] **E4** (sin flag): bordes sobre D/E.
- Smoke al cierre: **Pueblo 1 79/79, El Puesto 70/70**. 24 flags en true.

### Capa F — Identidad del Agente y ganchos de arte

- [x] **F1 `creadorAgente`**: crear Agente (nombre/pronombre/variante visual) al empezar;
      el nombre aparece en los diálogos; sprite recoloreado (4 variantes, sin arte nuevo).
- [x] **F2 `capaArte`**: juego artist-ready (PNG-first vía `assets/manifest.js`, fallback
      procedural). Ver `ARTE.md`.
- [x] **F3** (sin flag, docs): fichas de arte de referencia en `assets/tiles|sprites/`.
- [x] **F4 `estadisticas`**: estadísticas de sesión acumuladas entre partidas (panel de
      Progreso, sólo lectura).
- [x] **F5** (sin flag): robustez final — 4 bordes sobre la Capa F en el smoke.
- Smoke al cierre de F: **Pueblo 1 88/88, Colonia 89/89, El Puesto 79/79**. 26 flags en true.

## Futuras noches (bolt-on previsto, todo detrás de flags)

- **Más misiones/recetas/economía entre pueblos** (precios distintos por pueblo;
  intercambio entre el pueblo y la Colonia).
- **Bajada institucional de las misiones** (editar sólo los strings de `AJ.MISIONES`/
  `AJ.MISIONES_COLONIA` — decisión del humano, no automatizable).
- **Tercer pueblo / más mapa** (la fábrica `AJ.Mapa.cargar(id)` ya lo soporta).
- **Arreglo de fondo del mapa**: ver "Bug latente" abajo.

## Bug latente conocido (no rompe nada, queda anotado)

- **Spot de la Municipalidad sobre la aguada:** el punto frente a la Muni
  (`npcSpots.muni = 7,17`) cae sobre agua (la aguada `(3,17,5,4)` y su borde de
  juncos se solapan con la base de la Muni). La intendenta quedaba parada sobre el
  agua desde FASE 1 (no se notaba porque era estática). La FASE A lo sanea en
  runtime (`AJ.Rutinas._asegurarWalkable` reubica a cualquier NPC sobre un tile
  que colisiona). Arreglo de fondo pendiente: en `mapa.js`, mover la puerta/spot
  de la Muni a un lado caminable o correr la aguada un par de tiles.

## Futuras noches (bolt-on previsto)

### Estaciones
Extender `AJ.DiaNoche` con un contador de días y un enum de estación que module la
paleta de tinte y el crecimiento de cultivos. Engancha en el tick de tiempo; no
requiere tocar el mapa.

### NPCs con rutinas diarias y amistad
`AJ.NPC` ya tiene posición y dirección. Sumar una propiedad `rutina` (lista de
{hora, tile}) y un `update` que mueva al NPC según `estado.tiempo`. La amistad es un
número por NPC en `estado.amistades` que sube al hablar/regalar. No rompe el diálogo
actual.

### Varios pueblos conectados con viaje
El mapa hoy es un singleton (`AJ.Mapa`). Para multi-pueblo: convertir `AJ.Mapa` en
una fábrica `cargarMapa(id)` y agregar tiles de "salida" que disparen un cambio de
escena con el id destino. El guardado ya soporta agregar `mapaActual` al estado.

### Crafteo
Sumar `estado.inventario.items` (ya hay `inventario`) y un `AJ.Recetas` que combine
items en otros. UI nueva tipo grilla; no toca el resto.

### Mejoras de arte
Reemplazar texturas generadas por PNG reales (ver cabecera de `art.js`). Las claves
de textura son estables, así que es swap directo.
