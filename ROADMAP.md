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
- [ ] **FASE B — Estaciones** (`CONFIG.estaciones`)
- [ ] **FASE C — Crafteo simple** (`CONFIG.crafteo`)
- [ ] **FASE D — Varios pueblos / viaje** (`CONFIG.viaje`) — riesgo ALTO; sólo si
      A+B+C pasan el smoke completo.

> Regla: un sistema sólo pasa a `true` en `config.js` cuando su smoke-test da PASS.
> Lo que quede dudoso se deja en `false` y se anota acá.

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
