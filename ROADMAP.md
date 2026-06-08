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

### Modo Gestión (GDD) — sistema nuevo, aditivo sobre el RPG

> Definido en `GDD_Agente_Juvenil_La_Pampa.md`. Convierte las misiones planas en
> decisiones con consecuencias: medidores, Agencia, dilemas y dado. Todo en `js/gestion/`,
> detrás de flags, sin tocar el RPG. **Restricciones (GDD §11):** pueblos ficticios,
> contenido sensible a mano (`CONTENIDO_SENSIBLE.md`), sin apuestas/plata real, reskinable.

- [x] **G1 `modoGestion`**: capa de datos (5 medidores, 10 comunidades, 4 niveles + banco
      anonimizado, pueblos ficticios, 5 actividades, problemáticas con flag sensible) + estado.
- [x] **G2 `onboarding`**: armar la Agencia (4 pasos de la Hoja de Ruta) — lógica + UI DOM.
- [x] **G3 `dilemas`**: motor situación/opciones/impactos + 26 dilemas genéricos validados;
      contenido sensible NO autogenerado (motor lo soporta, banco vacío).
- [x] **G4 `tiradas`**: dado 1–20 + modificadores (arco suerte→competencia), resultados graduados.
- Smoke al cierre de G4 (con fixes del review adversarial): **Pueblo 1 105/105, Colonia 106/106,
  El Puesto 96/96**. 30 flags en true.

#### G5–G7 — CERRADAS (sexta noche)
- [x] **G5 `cicloGestion`**: ciclo de 30 días (recon 1–5 → oferta de rol → gestión 6–30, 3
      acciones/día), perfil de gestor al cierre, **mudanza** con experiencia heredada. El
      onboarding y los dilemas viven en el **menú del día** (la tecla G abre el menú; las
      entradas sueltas G/H quedan sólo si `cicloGestion` está off).
- [x] **G6 `comunidades`**: descubrimiento por exploración en pueblo chico (comunidades ocultas
      + latentes), **integración** (actividad-puente) en nivel 4, bonus de tirada por comunidad
      conocida y **cooperación regional** si falta la infra.
- [x] **G7 robustez**: smoke de bordes sobre todo el Modo Gestión (round-trips del estado, mudanza
      con estado por pueblo, 30 días → perfil, referente solo, comunidad revelada, tirada con/sin mods).
- Smoke al cierre de G7 (con fixes del review adversarial): **Pueblo 1 126/126, Colonia 127/127,
  El Puesto 117/117**. 32 flags en true.

#### Capa Narrativa-Temporal (N1–N6) — CERRADA (décima noche)
> Aditiva sobre el Modo Gestión (no toca el motor G1–G7). Documentada en GDD §2.bis.
- [x] **N1 `origenJugador`**: pantalla de 5 orígenes que reparten los medidores + **6º medidor
      `carisma`** (el HUD itera `D.MEDIDORES`).
- [x] **N2 `mesaProvincial`**: arranque narrativo (viaje → Mesa → vuelta) + Mesa visitable.
- [x] **N3 `relojTemporadas`**: reloj de findes (1 temporada = 12 findes; semana=preparación,
      finde=ejecución). **Envuelve** G5 (con el flag off, sigue por días).
- [x] **N4 `modoAnual`**: 4 temporadas (verano/laburo/invierno/segunda mitad) + **Mes de las
      Juventudes** (septiembre = clímax).
- [x] **N5 `misionesPorRegion`**: 6 zonas productivas (cerealero/caldenal/oeste árido/salinas/
      Colorado-Sur/hub) con sabor + misiones plantilla. Contenido por workflow + compliance
      (Atuel apartidario).
- [x] **N6 robustez**: bordes + **save/reload real** verificado. **Smoke Pueblo 1 134/134 PASS** (+5 flags nuevos: origenJugador/mesaProvincial/relojTemporadas/modoAnual/misionesPorRegion).

#### Apertura cinematográfica + Mundo interactivo (O1–O3) — CERRADA (undécima noche)
> Aditiva, detrás de flags; reusa origen/medidores/creador (no duplica sistemas). Ver GDD §2.ter.
- [x] **O1 `aperturaCine`**: arranque guionado salteable — colectivo (parallax procedural) → Mesa
      de Agentes (6 agentes + diálogo) → creador de avatar (nombre/pronombre/variante + **localidad**)
      → **vida previa estilo Mount & Blade** (4 ejes; "cómo llegaste" = orígenes N1, los otros 3 son
      deltas narrativos) → charla de cierre/tutorial → tu localidad. `aplicar()` idempotente; marca
      `mesaVista` para no repetir la Mesa. `escenas/Apertura.js` + `js/vida_previa.js`.
- [x] **O2 `mundoInteractivo`**: entrar a edificios (`escenas/Interior.js` + `js/interiores.js`,
      plantillas oficina/local/casa/iglesia con arte procedural propio), objetos interactivos
      (monumento/carteles/estanterías/radio/mural), NPCs de interior con el diálogo existente.
      Guarda `estado.interior` (recargar adentro = seguís adentro). Colisión del jugador enchufable
      (`this.scene.esColisionMapa`). Entrada por COORDENADA (robusta al solape Muni/aguada).
- [x] **O3 robustez**: +13 checks de smoke (cada combinación de vida previa, idempotencia, saltear,
      interiores construibles/round-trip). **Smoke Pueblo 1 147/147, Colonia 148/148, El Puesto 138/138 PASS** (+2 flags: aperturaCine/mundoInteractivo).

#### Cámara cercana (O-cam) — CERRADA (duodécima noche)
- [x] **O-cam `camaraCercana`**: cámara cercana estilo Pokémon/Stardew vía **resolución lógica
      reducida** (`CONFIG.VISTA = 448×336` ≈ 14×10.5 tiles visibles), NO `camera.setZoom` (ver D52).
      Sigue al jugador con clamp a bordes (sin vacío); interiores chicos centrados; pixel art
      nítido (pixelArt + roundPixels); mobile OK (FIT + táctiles DOM). El mundo interactivo
      (O2) se RE-verificó con la cámara nueva. +6 checks de smoke. **Pueblo 1 153/153, Colonia
      154/154, El Puesto 144/144 PASS.** El nivel de zoom exacto es criterio humano (PLAYTEST).

##### O — ideas diferidas (opcional)
- **Misiones desde interiores:** hoy los NPCs de interior dan sabor/info; se podrían atar al sistema
  de misiones/afinidad (cuidando los checks de coherencia de cadena del smoke).
- **Más interiores con identidad:** una plantilla por edificio clave en vez de reusar "casa".
- **Arte real** del colectivo/ruta/interiores (hoy procedural; ver `AUDITORIA_ARTE.md`).
- **Saltear el colectivo con animación de bajada** (hoy salta directo a la Mesa).

#### Pendiente — trabajo HUMANO (no automatizable)
- [ ] **Contenido sensible** (salud mental, consumos, violencias, bullying): redacción + revisión
      humana en `CONTENIDO_SENSIBLE.md` (banco vacío; el motor lo soporta vía `registrarSensibles`).
- [ ] **Dilemas con voz propia / bajada institucional**: dar identidad local a los dilemas y a las
      actividades (editar datos, sin tocar lógica). Decisión humana.
- [ ] **Balance fino y playtest** (medidores, ritmo de 30 días, feel del dado): ver `PLAYTEST.md`.
- [ ] **Arte real** del Modo Gestión si se quiere (íconos de comunidades/medidores): ver `ARTE.md`.

## Futuras noches (bolt-on previsto, todo detrás de flags)

- **Más misiones/recetas/economía entre pueblos** (precios distintos por pueblo;
  intercambio entre el pueblo y la Colonia).
- **Bajada institucional de las misiones** (editar sólo los strings de `AJ.MISIONES`/
  `AJ.MISIONES_COLONIA` — decisión del humano, no automatizable).
- **Tercer pueblo / más mapa** (la fábrica `AJ.Mapa.cargar(id)` ya lo soporta).
- **Arreglo de fondo del mapa**: ver "Bug latente" abajo.

### Capa narrativa-temporal — ideas diferidas (todo opcional)
- **Peso mecánico del clímax de septiembre:** hoy el Mes de las Juventudes es narrativo (sin
  multiplicador, para no tocar el balance). Se podría amplificar los impactos de su finde-faro
  detrás de un flag, una vez validado el balance jugando.
- **Temporadas de largo variable:** hoy las 4 temporadas tienen 12 findes; el receso de invierno
  podría ser más corto (`anio.js`/`temporadas.js` ya soportan `totalFindes` por temporada).
- **Pueblos para todas las zonas:** salinas y Colorado-Sur tienen zona definida pero ningún pueblo
  jugable todavía (`datos.js` → `PUEBLOS`). Agregar pueblos ficticios para esas zonas.
- **Preparación → bono de tirada:** las gestiones de la semana podrían dar un bonus al dado del
  finde (en vez de impacto directo de medidor), atando mejor preparación↔ejecución.
- **Más misiones por zona / voz propia:** hoy 2–3 plantillas por zona (`regiones.js` → `ZONAS`).
  Sumar más y darles bajada local (humano). El contenido SENSIBLE sigue a mano.

## Bug latente conocido (no rompe nada, queda anotado)

- **Spot de la Municipalidad sobre la aguada:** el punto frente a la Muni
  (`npcSpots.muni = 7,17`) cae sobre agua (la aguada `(3,17,5,4)` y su borde de
  juncos se solapan con la base de la Muni). La intendenta quedaba parada sobre el
  agua desde FASE 1 (no se notaba porque era estática). La FASE A lo sanea en
  runtime (`AJ.Rutinas._asegurarWalkable` reubica a cualquier NPC sobre un tile
  que colisiona). Arreglo de fondo pendiente: en `mapa.js`, mover la puerta/spot
  de la Muni a un lado caminable o correr la aguada un par de tiles.
  - **Nota O2 (interiores):** el junco de la aguada también pisa el TILE de la puerta
    de la Muni (cosmético: se ve junco en vez de puerta). Entrar igual FUNCIONA porque
    la detección es por coordenada, no por textura. El arreglo de fondo (mover la aguada)
    saneará de paso este detalle visual.

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
