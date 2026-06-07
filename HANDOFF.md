# HANDOFF.md — Estado del proyecto entre sesiones

> Documento de traspaso. La próxima sesión de Claude Code (o el humano) lee esto
> + `CLAUDE.md` para saber dónde está parado el repo. Ver también `DECISIONES.md`
> (por qué de cada cosa), `ROADMAP.md` (pendientes) y `PLAYTEST.md` (lo que necesita
> ojo humano).

## Capa Narrativa-Temporal del Modo Gestión (décima noche) — CERRADA

Capa **aditiva** sobre el Modo Gestión (sin reescribir RPG ni motor G1–G7). Arranque:
smoke 128/128, 5 medidores. Cierre: smoke Pueblo 1 **134/134 PASS**, 6 medidores. Todo
detrás de flags nuevos + try/catch + commit por fase. Documentado en GDD §2.bis. Sin
remote (push = humano). Resultado por fase:

- **GDD primero** (commit `16c3587`): nueva sección §2.bis "Capa Narrativa-Temporal".
- **N1 — Origen + 6º medidor (commit `f6de29c`).** `origen.js`: pantalla de 5 orígenes que
  reparten los medidores de inicio (mérito/intendente/comodín/urgencia/barrio). Se agregó el
  **6º medidor `carisma`** (el HUD itera `D.MEDIDORES`, aparece solo). La 1ª vez que abrís
  Modo Gestión aparece el origen. CONFIG.origenJugador.
- **N2 — Mesa Provincial (commit `0e80d09`).** `mesa.js`: arranque narrativo (viaje→Mesa→
  vuelta, 5 beats) + Mesa **visitable** (botón en el menú del día). Texto genérico/reskinable.
  Cadena: G → origen → Mesa intro → menú del día. CONFIG.mesaProvincial.
- **N3 — Reloj de findes (commit `76b9de0`).** `temporadas.js` (lógica) + `ciclo.js`
  (`renderFinde`/`renderFindeCierre`, aditivos). 1 temporada = 12 findes; semana=preparación,
  finde=ejecución (actividad/dilema con dado). **Envuelve** G5 (con el flag off, sigue por
  días). Origen "urgencia" resta 1 finde. CONFIG.relojTemporadas.
- **N4 — 4 temporadas + Mes de las Juventudes (commit `27ea6f8`).** `anio.js`: el año son 4
  temporadas (verano/laburo/invierno/segunda mitad), con clima; **septiembre = clímax** (faro
  en el último finde de la segunda mitad). El cierre ofrece "Seguir el año → X". CONFIG.modoAnual.
- **N5 — Misiones por región (commit `ffc2805`).** `regiones.js`: 9 regiones direccionales →
  **6 zonas productivas** (este cerealero/caldenal/oeste árido/salinas/Colorado-Sur/hub centro).
  Cada zona: sabor + recursos + comunidades + misiones plantilla. **Contenido generado por
  workflow** (6 generar + 6 revisar compliance): sin marcas reales, sin apuestas, Atuel en
  clave EDUCATIVA y APARTIDARIA. CONFIG.misionesPorRegion.
- **N6 — Robustez (commit `0bc1911`).** Check integral + **save/reload REAL** verificado:
  origen, Mesa, finde a mitad, temporada del año y zona persisten; el menú renderiza el estado
  cargado sin crashear.

**Notas de integración (para la próxima sesión):** el smoke ya NO hardcodea 5 medidores
(ahora 6); el check G7 de "dilema no es gratis" es **mode-aware** (día vs finde). Todos los
módulos nuevos encadenan `modalAbierta` (congela movimiento) y se cierran en
`_cerrarModalesGestion`. Pendientes/ideas → ROADMAP.md.

## Pasada de cobertura y coherencia (novena noche) — CERRADA

Baseline: **15% (25/170)**, smoke 128/128. Cierre: **16% (28/170)**, smoke **128/128 PASS**.
`paleta.hex` intacta = DawnBringer 32. Fallback procedural siempre válido. Sin remote
(push = humano). Resultado por fase:

- **FASE A (maximizar cobertura) — HECHA, commit `3ee7bc8`.** Barrido por 4 cuadrantes del
  sheet roguelike (~1700 piezas, todo ENTORNO) con vistas ampliadas + grilla. Mapeados y
  **verificados adversarialmente** (workflow: panel de 3 lentes, 3/3 c/u): **vereda**
  (ladrillo), **moneda** (oro), **mesa_crafteo** (yunque). **Dropeado** `monumento` (la
  estatua dio panel 0/3 — lee como caja/pileta). Confirmado de nuevo: el roguelike **no
  tiene personajes**. Siguen procedurales: junco, arado (coherencia con cultivos),
  cultivo_0..3, monumento, exclamacion, check, brujula_flecha. 25→28 tiles.
- **FASE B (coherencia visual) — HECHA, commit `b048db5`.** Workflow de 3 lentes sobre los
  28 tiles. **Paleta limpia** (0 px fuera de paleta). Marcas de DISEÑO (no color → NO se
  tocaron, anotadas en PLAYTEST para criterio humano): `agua` (cian brillante/liso vs
  pueblo apagado) y `calden`/`moneda`/`mesa_crafteo` (estilo roguelike más detallado que
  el plano de Tiny Town).
- **FASE C (auditoría automática) — HECHA, commit `b8ddcd7`.** `node auditar_arte.js` →
  `AUDITORIA_ARTE.md`: 0 fuera de paleta, 0 semi-alpha, 0 suelos con agujero; embarrados
  `moneda` (77%) y `calden` (24%) listados (no tocados); 10 tiles + 132 sprites sin PNG con
  su nota. Reusa el codec/paleta de `recolorear.js`.
- **FASE D (andamiaje sensible) — HECHA, commit `9100409`.** El motor ya tenía
  `registrarSensibles()` (valida + fuerza `fuente:'sensible'`), `BANCO_SENSIBLE=[]`, y el
  smoke ya verifica banco vacío + genéricos sin tema sensible. Agregado stub turnkey
  `js/gestion/contenido_sensible.js` (vacío, con plantilla) cableado en index.html. **Cero**
  dilemas sensibles autogenerados.
- **FASE E (robustez + cierre) — HECHA (este commit).** Smoke #29 ampliado: (a) todo el
  manifiesto resolvió a textura, (b) fallback procedural cubre lo no mapeado, (c) sprites
  procedurales presentes. Docs al día: CLAUDE, ARTE, CREDITS, PLAYTEST (lista consolidada
  de criterio visual humano + 16%), este HANDOFF.

**FASE 4 (UI/táctil) sigue pendiente** (misma razón que la octava noche: UI procedural +
assets 4-bit; es criterio visual). **Mayor salto futuro: bajar un pack de personajes.**

## Vestir el juego con arte Kenney (octava noche) — FASES 1–3 + 5, FASE 4 pendiente

Objetivo: vestir el juego con arte CC0 de Kenney por el pipeline Node, maximizando
cobertura sin romper nada. **`paleta.hex` confirmada intacta = DawnBringer 32** (32
líneas, sin comentarios). Estado por fase:

- **FASE 1 (edificios y terreno) — HECHA, commit `522229b`.** Mirando los sheets con
  vistas ampliadas + grilla, se mapearon de Tiny Town: pasto, tierra, calden (arbusto
  1-tile), y los **20 tiles de los 5 edificios** (casa/iglesia/muni/juventud/almacén ×
  pared/techo/ventana/puerta). Madera (techo rojo) para casa/juventud/almacén; piedra
  (techo azul) para iglesia/muni. **Corrigió el mapeo errado de la 7ª noche**: agua (era
  un techo azul), arado (copa de árbol), vereda (poste de cerca) → vuelven a procedural.
  Verificado EN PANTALLA (muestreo de color): cada edificio renderiza techo≠pared con el
  color correcto y **0% de pasto** en las filas → calzan sin huecos.
- **FASE 2 (personajes) — SIN CAMBIOS (documentado).** **Ningún pack en `raw/` trae
  personajes con 4 direcciones + caminata.** Tiny Town tiene 1 pose de frente; el
  roguelike es solo entorno (falta su `roguelikeChar`). Jugador + 10 NPCs (132 sprites =
  **78% del inventario**) siguen procedurales — lo que además preserva las 4 variantes de
  color del creador de agente y las animaciones. Sin commit (no hubo arte que mapear).
- **FASE 3 (cultivos/objetos) — PARCIAL, commit `50196ef`.** Del roguelike (entorno) se
  mapearon **agua** (cian, viste la aguada) y **plaza** (piso de piedra). Se extendió
  `recortar.js` para recortar otros sheets via env (`SHEET`/`ESPACIADO`/`MARGEN`/`MAPA`)
  + `assets/mapa_roguelike.json` (16px tile, 1px spacing). Cultivos, moneda, mesa_crafteo,
  exclamación, check: sin equivalente claro → procedurales. (El inventario de items del
  juego no usa PNG, así que las herramientas/llave/cofre de Tiny Town no tienen destino.)
- **FASE 4 (UI y táctil) — PENDIENTE (no se tocó, a propósito).** Packs `pixel-ui` +
  `mobile-controls` están en `raw/` pero: (a) la UI del juego se dibuja **procedural
  (Phaser.Graphics)** y los táctiles son **HTML/CSS** → cablearlos es reescribir código de
  UI con riesgo de romper el input táctil; (b) los PNG de UI son **4-bit** y el recolorador
  (8-bit) los saltea (habría que extender el codec). Como **no mueve el % de cobertura**
  (mide tiles+sprites) y el look de UI es **criterio visual**, se dejó para una sesión
  dedicada con ojo humano. Pasos sugeridos en ARTE.md / PLAYTEST.md.
- **FASE 5 (cobertura + créditos) — HECHA.** Cobertura: **15% (25/170)** —
  `AJ.VerificarAssets.correr()`. Topeada por los personajes (sin pack); con un pack de
  personajes saltaría a ~90%+. **CREDITS.txt** completo: Tiny Town + Roguelike/RPG (CC0,
  kenney.nl), con los 4 packs anotados. Docs actualizadas (ARTE, PLAYTEST, MANIFIESTO, este).

**Smoke Pueblo 1: 128/128 PASS** tras cada fase. Fallback procedural intacto. Sin remote
(push = humano). **Lo más valioso a futuro: bajar un pack de personajes Kenney** (el mayor
salto de cobertura) y la FASE 4 de UI.

## Conversión a 16×16 nativo ×2 (séptima noche) — CERRADA

Decisión tomada: arte CC0 estilo Kenney 16×16 → render de 32×32 a **16-nativo escalado ×2**
(look GBA). **Hecho y verificado** (commit `bd90f3e`):
- **`art.js`** redibujado a 16×16 (tiles) y 16×24 (personaje/NPCs); iconos 16×16. Cada objeto
  del mundo se muestra ×2 con **`setDisplaySize`** (Pueblo `_dibujarMapa`, jugador, NPCs, cultivos,
  mesa de crafteo 16×16). La marca "!" pasó de escala 0.7 a 1.4. `brujula_flecha` queda 32×28 (UI).
- **Decisión clave (D48):** NO se zoomeó la cámara (habría duplicado toda la UI Phaser). Se
  mantuvo grilla/colisión/cámara/UI en **32 px de pantalla** y sólo se achicaron las texturas a 16.
  Robusto a cualquier tamaño de PNG real; un Kenney 16×16 entra directo.
- Verificado: jugador 16×24 nativo / 32×48 en pantalla; camina, choca, cámara sigue; escena
  renderiza bien; Modo Gestión y todo lo demás OK; verificador de assets sin crashear. Docs al día
  (ARTE.md, MANIFIESTO, READMEs de /assets, CLAUDE, DECISIONES D48).
- Smoke: **Pueblo 1 128/128, Colonia 129/129, El Puesto 119/119 PASS**, consola limpia. Sin remote
  (push = humano).

## Pipeline de recoloreo + recorte en NODE (séptima noche, parte 2)

Como NO hay Python en esta máquina, el pipeline es **Node.js puro** (cero deps, cero
`npm install`). Herramientas **aparte** (no tocan el runtime). Ver `README_PIPELINE.md`.
- **`recolorear.js`** (`node recolorear.js`) — codec PNG propio (zlib) + recolorea todos los
  PNG de `assets/raw/` a `assets/paleta.hex` por **ΔE Lab** (transparencia/tamaño preservados,
  sin suavizado) → `assets/recolor/`. Reporta fuera-de-paleta y "embarrados".
- **`recortar.js`** (`node recortar.js`) — recorta un spritesheet (grilla configurable arriba
  del script) según `assets/mapa_recorte.json`, recolorea y exporta cada celda con el **nombre
  exacto del MANIFIESTO** a `assets/tiles`/`assets/sprites`, y **regenera `assets/manifest.js`**
  (cablea al juego: la capa de arte F2 los levanta).
- **`assets/paleta.hex`** = **DawnBringer 32** (32 colores; intacta, no la toqué).
- **`assets/raw/`** = packs de Kenney del humano (tiny-town, roguelike-rpg, pixel-ui,
  mobile-controls). `raw/` y `recolor/` **gitignoreados**; el arte final (`tiles`/`sprites`) sí.

**Hecho y verificado (corriendo Node):** `recolorear.js` procesó 948 PNG (saltó 177 UI a <8
bits, sin romper). `recortar.js` sacó el primer lote real de Tiny Town: **pasto, tierra, vereda,
agua, arado, calden** → 6 tiles 16×16 recoloreados a DB32, en `assets/tiles/`, listados en
`manifest.js`. En el juego: la capa de arte los carga (getPixel = DB32: pasto 0x6ABE30, agua
0x306082…), 16-nativo ×2, mundo coherente (terreno Kenney + edificios/jugador procedurales).
**Smoke 128/128 PASS.**

> **Para sumar más arte:** editá `assets/mapa_recorte.json` (fila/col → nombre del MANIFIESTO)
> y `node recortar.js`. Edificios (casa_pared/_techo/…) y personajes quedan a criterio VISUAL
> humano: Tiny Town los descompone distinto. El tool es genérico (cambiá el sheet/grilla arriba
> de `recortar.js`). **Nota:** con manifest no-vacío la carga de PNG es async — al abrir el juego
> normal (RAF real) funciona; el smoke headless necesita esperar las cargas (ya verificado).

## Arte: el repo está LISTO para recibir PNGs (el arte es trabajo HUMANO + Cowork)

El juego dibuja todo por código (procedural). La **Capa de Arte** (F2,
`CONFIG.capaArte`) ya permite reemplazar cualquier textura por un PNG real sin tocar
código. Se dejó el repo **artist-ready** con 4 piezas (commits `c9454cd`, `55e1de1`,
`9cea510`, `8c2e382`):
- **`assets/MANIFIESTO.md`** — las **170** texturas reemplazables (38 tiles + 132
  sprites), nombre exacto + carpeta + dimensión + estado, y 4 discrepancias listado vs
  código (`mesa_crafteo` en crafteo.js, `brujula_flecha` 32×28 en brujula.js, `jugador_*`
  recoloreado, abreviaturas).
- **`js/verificar_assets.js`** — dev tool que mide la **cobertura de arte** (PASS/FALTA
  por pieza + %). `AJ.VerificarAssets.correr()` o `CONFIG.verificarAssets`. OFF por
  defecto (no ensucia la consola).
- **`CREDITS.txt`** — plantilla de créditos/licencias (priorizar CC0; evitar CC-BY-SA/
  GPL; IA sin copyright). Banco vacío.
- **`assets/README.md`** — cómo meter un PNG (nombre exacto, carpeta, dimensión,
  recolorear a una paleta única).

> **NO es tarea de Claude Code** conseguir, elegir, descargar ni recolorear el arte
> (las descargas están bloqueadas, y la curaduría visual/legal es decisión humana). Eso
> lo hace el **humano + Cowork**: buscar packs CC0, elegir estilo, recolorear a la paleta
> única, poner los PNG en `/assets/`, listarlos en `assets/manifest.js` y anotar
> `CREDITS.txt`. El juego los levanta solo; lo que falte sigue procedural. **Cero PNGs
> hoy → todo procedural, 0 regresión.**

## Estado de partida que encontró la Capa de Pulido (noche del 5 jun 2026)

Verificado, no asumido:
- Árbol git limpio; último commit `ac4a7e1`. **Sin remote configurado.**
- Smoke-test en vivo: **42/42 PASS** en el Pueblo 1.
- Flags en `true` (todas las fases previas verificadas): `npcsDialogo, misiones,
  diaNoche, granja, rutinas, estaciones, crafteo, viaje`.
- No existía `CLAUDE.md` (se crea en esta capa).

## Estado de partida que encontró C1/C2 (segunda noche)

Verificado: smoke **55/55 PASS** (Pueblo 1), árbol limpio, las 11 fases previas en
`true`. La Colonia estaba sin NPCs ni misiones propias (objetivo de C1).

## Estado de partida que encontró D/E (tercera noche)

Verificado: smoke **Pueblo 1 64/64, Colonia 65/65 PASS**, árbol limpio, **17 flags en
true**, sin errores de consola. Objetivo de D: más mundo/contenido. Objetivo de E:
meta-progresión, accesibilidad y cierre.

### Capa D — Más mundo y más para hacer (tercera noche) — CERRADA
- **D1 `poblarMundo`**: 6 vecinos nuevos (3 por pueblo), reusando texturas. Commit `25efced`.
- **D2 `masMisiones`**: 4 misiones nuevas (requiere poblarMundo). Commit `5a1810f`.
- **D3 `registro`**: Registro del Agente (colección + %). Commit `6d8a076`.
- **D4 `tercerPueblo`**: "El Puesto del Monte" (outpost de monte con huerta/mesa/leña).
  Se hizo porque D1/D2/D3 pasaban el smoke; verificado sólido. (commit a continuación)
- Contenido (NPCs/misiones) generado por un workflow de 3 agentes; el crítico reescribió
  una rifa con plata como colecta cívica (regla no-apuestas).
- Smoke al cierre de D: Pueblo 1 **70/70**, Colonia ~71, El Puesto **61/61**.

## Estado de partida que encontró la Capa F (cuarta noche)

Verificado: smoke **Pueblo 81/81 PASS**, árbol limpio, **24 flags en true**, sin errores
de consola. Objetivo de F: identidad del Agente (creador) + ganchos de arte (artist-ready).

## Estado de partida que encontró G5–G7 (sexta noche)

Verificado, no asumido:
- Árbol git limpio; último commit `379e850` (cierre G1–G4 + review). **Sin remote.**
- Smoke en vivo: **Pueblo 1 105/105, Colonia 106/106, El Puesto 96/96 PASS**, sin errores.
  **30 flags en true.** API de gestión presente: `AJ.Gestion.Datos/Estado/Onboarding/
  Dilemas/Tiradas`, flags `modoGestion/onboarding/dilemas/tiradas` en true.
- Objetivo de la noche: **G5 (ciclo 30 días + mudanza), G6 (descubrimiento/integración de
  comunidades), G7 (robustez)**. Las teclas temporales G/H de G2/G3 pasan a vivir dentro del
  ciclo (menú del día). El RPG y el motor de gestión existentes NO se tocan.

## Estado de partida que encontró el Modo Gestión (quinta noche)

Verificado, no asumido:
- Árbol git limpio; último commit `2ce3f80` (cierre de la Capa F). **Sin remote configurado.**
- Smoke en vivo (reload limpio): **Pueblo 1 88/88, Colonia 89/89, El Puesto 79/79 PASS**,
  sin errores de consola. **26 flags en true.**
- Llega el GDD del **Modo Gestión** (`GDD_Agente_Juvenil_La_Pampa.md` en la raíz): sistema
  NUEVO y aditivo sobre el RPG, detrás de flags nuevos. Objetivo de la noche: construir las
  capas **G1 (datos) → G2 (onboarding) → G3 (dilemas) → G4 (tiradas)**, commit por capa, y
  dejar G5–G7 en ROADMAP. El RPG existente NO se toca.
- Restricciones críticas del GDD §11: pueblos jugables **ficticios** (los reales son sólo
  modelo interno); contenido sensible (salud mental, consumos, violencias, bullying) **no se
  autogenera** → va a `CONTENIDO_SENSIBLE.md` para revisión humana; sin apuestas/azar con
  plata real (el dado es mecánica); genérico y reskinable.

## Capas construidas

### Capa 0 — Base (FASES 1–4 + Final)
Título, pueblo 40×30, jugador con colisiones, cámara, guardado robusto; diálogo +
5 misiones cívicas; día/noche con reloj y tinte; granja (plantar/crecer/cosechar +
economía); pantalla final. Todo commiteado y verificado.

### Capa 1 — Bolt-ons (FASES A–D)
- **A `rutinas`**: NPCs caminan por hora (pathfinding BFS) + afinidad (panel ♥/tecla C).
- **B `estaciones`**: 4 estaciones derivadas del día (paleta + ritmo de cultivos).
- **C `crafteo`**: mesa de oficios, 5 recetas con verdura (cosecha) y leña (caldenes).
- **D `viaje`**: 2º pueblo "Colonia La Esperanza" (sin NPCs) + viaje ida/vuelta;
  el guardado recuerda el pueblo.

### Capa C1 — Vida en la Colonia (segunda noche) — CERRADA
- **C1.1 `npcsColonia`**: 5 vecinos rurales con diálogo, rutinas y afinidad (Don
  Ramón, El Gallego, La Seño Marta, El Colorado, Doña Anunciación). Commit `b27ec64`.
- **C1.2 `misionesColonia`**: 2 misiones cívicas propias (`col_escuela`, `col_aguada`)
  en el Cuaderno; progreso por pueblo separado y persistente. (commit a continuación)
- Smoke al cierre de C1: **Pueblo 1 56/56, Colonia 57/57**. Sin errores de consola.
- De paso se arreglaron 2 bugs de no-destructividad del auto-smoke (NPCs amontonados,
  afinidad del 1er NPC "gastada").

### Capa C2 — Controles, opciones y cierre (segunda noche) — CERRADA
- **C2.1 `joystickAnalogico`**: joystick táctil analógico (reemplaza el d-pad cuando
  está on). Zona muerta/radio en `CONFIG.JOYSTICK`. Commit `9d6817b`.
- **C2.2 `menu`**: menú de pausa (reanudar, mute, controles, reset con doble
  confirmación, volver al título). Pausa real (congela el tiempo). Commit `348c7ff`.
- **C2.3 `brujula`**: flecha discreta hacia la misión activa; a la salida si el
  objetivo está en el otro pueblo. Commit `2ae605e`.
- **C2.4** (sin flag): 4 casos de borde nuevos en el smoke (viaje a mitad de misión,
  joystick sin jugador, reset limpio, coherencia por pueblo). Commit `ca64ad6`.
- Smoke al cierre de C2: **Pueblo 1 64/64, Colonia 65/65**. Sin errores de consola.

### Capa E — Meta, cierre y accesibilidad (tercera noche) — CERRADA
- **E1 `progreso`**: panel de stats (tiempo jugado, afinidad por vecino, misiones por
  pueblo). Commit `8ba8ae5`.
- **E2 `accesibilidad`**: velocidad de texto del diálogo (typewriter, elegible) + tamaño
  de texto + alto contraste; preferencias en localStorage. Commit `ef1d5cd`.
- **E3 `creditos`**: título pulido (Opciones/Créditos) + pantalla de créditos. Commit `6c37bc5`.
- **E4** (sin flag): 4 bordes nuevos (Registro round-trip, accesibilidad persiste, 3er
  pueblo persiste, Final independiente del Registro). Commit `613a1c0`.
- Smoke al cierre de E: Pueblo 1 **79/79**, El Puesto **70/70**. Sin errores de consola.
- **Git sigue sin remote: el push lo hace el humano** (crear repo en GitHub + push).

### Capa F — Identidad del Agente y ganchos de arte (cuarta noche) — CERRADA
- **F1 `creadorAgente`**: al "Jugar" se crea el Agente — nombre (máx 12), pronombre
  (él/ella/elle) y **variante visual** (4 recoloreos del sprite base, sin arte nuevo).
  Se guarda en localStorage; el nombre reemplaza el vocativo "Agente" en los diálogos
  (sin tocar "Agente Juvenil"). Overlay DOM (fiable en celular). Commit `7aaa983`.
- **F2 `capaArte`**: el juego queda **artist-ready**. `art.js` expone `preparar(scene)`:
  si hay PNG listados en `assets/manifest.js` los carga (`assets/tiles|sprites/<n>.png`),
  y el procedural rellena lo que falte. Manifiesto vacío → todo procedural, idéntico,
  **cero 404s**. Commit `afb71b7`.
- **F3** (sin flag, sólo docs): fichas de arte de referencia (`assets/tiles/README.md`,
  `assets/sprites/README.md`) con convención de nombres, dimensiones y paleta. Commit `1c45888`.
- **F4 `estadisticas`**: estadísticas de sesión **acumuladas entre partidas** (localStorage
  `aj_stats_v1`, aparte del save): tiempo total, pasos, NPCs conocidos, diálogos leídos,
  misiones por pueblo. Sección de sólo lectura en el panel de Progreso (E1). Commit `87ad467`.
- **F5** (sin flag): robustez final — 4 casos de borde nuevos en el smoke (nombre de Agente
  vacío, variante persiste tras recargar, `generarTodo` idempotente = fallback de arte
  seguro, estadísticas acumulan entre sesiones). **Ningún borde reveló un bug.** Commit `7ea4b67`.
- Smoke al cierre de F: **Pueblo 1 88/88, Colonia 89/89, El Puesto 79/79 PASS**, sin errores
  de consola. **26 flags en true.**
- **Git sigue sin remote: el push lo hace el humano** (ver sección "Push" abajo).

### Modo Gestión (GDD) — G1–G4 (quinta noche) — CAPAS CERRADAS
Sistema NUEVO y aditivo sobre el RPG (no lo toca), definido en `GDD_Agente_Juvenil_La_Pampa.md`.
Todo cuelga de `AJ.Gestion` (scripts clásicos `js/gestion/*`), detrás de flags con try/catch.
- **G1 `modoGestion`** (`gestion/datos.js`): 5 medidores, 10 comunidades, 4 niveles + banco
  anonimizado del modelo real (sin nombres reales), pueblos jugables **FICTICIOS**, 5 líneas
  de actividad, problemáticas con flag `sensible`; `AJ.Gestion.Estado` (estado por pueblo en
  `estado.gestion`, clamp de medidores). Commit `303001f`.
- **G2 `onboarding`** (`gestion/onboarding.js`): los 4 pasos de la Hoja de Ruta (convocatoria/
  diagnóstico/objetivos+bautizo/organización), lógica pura + asistente DOM (tecla **G**); ≥3
  miembros = Agencia, <3 = Referente solo. Commit `7de00a5`.
- **G3 `dilemas`** (`gestion/dilemas.js` + `dilemas_banco.js`): motor situación/opciones/
  impactos multi-medidor + UI (tecla **H**); 26 dilemas genéricos (6 a mano + **20 generados
  por un workflow** de 7 escritores + crítico, re-validados por código). El contenido
  **sensible NO se autogenera** (`CONTENIDO_SENSIBLE.md`; banco sensible vacío). Commit `0ff11e3`.
- **G4 `tiradas`** (`gestion/tiradas.js`): dado 1–20 + modificadores por medidor (arco
  suerte→competencia), resultados graduados; modula los impactos de las opciones con
  `requiereTirada`. El dado es mecánica, **nunca plata real**. Commit `2d093b1`.
- Smoke al cierre de G4 (con los fixes del review adversarial): **Pueblo 1 105/105, Colonia
  106/106, El Puesto 96/96 PASS**, sin errores de consola. **30 flags en true.**
- **Review adversarial (workflow)** al cierre: 12 hallazgos, 7 confirmados, **todos corregidos**
  (el más serio: ESC dejaba un overlay DOM de gestión huérfano sobre el Título → arreglado).
  Detalle en `DECISIONES.md` (D43).

### Modo Gestión (GDD) — G5–G7 (sexta noche) — CAPAS CERRADAS
- **G5 `cicloGestion`** (`gestion/ciclo.js`): ciclo del GDD §2 — RECON días 1–5 (explorar/hablar/
  armar Agencia) → oferta de rol → GESTIÓN días 6–30 con 3 acciones/día (dilema o actividad,
  resueltas con el dado) → perfil de gestor al día 30 → MUDANZA (recon de nuevo, hereda
  experiencia; cada pueblo guarda su estado por separado). Todo en el **menú del día** (tecla G).
  AJ.Gestion.Ciclo + Actividades + CicloUI. Commit `5ec6594`.
- **G6 `comunidades`** (`gestion/comunidades.js`): descubrimiento gradual en pueblo chico
  (comunidades ocultas que se revelan + latentes que el jugador siembra); integración en la
  capital (nivel 4): actividad-puente. Bonus de tirada por comunidad afín conocida; cooperación
  regional si falta la infra. Commit `18af073`.
- **G7** (sin flag): robustez — 6 bordes de extremo a extremo en el smoke (round-trip del estado
  a mitad del día 12; mudanza con estado por pueblo persistido; 30 días → perfil; referente solo;
  comunidad revelada persiste; tirada con/sin modificadores). **Ningún borde reveló un bug.** Commit `4c735fd`.
- **Review adversarial (workflow)** de G5–G7 al cierre: 7 hallazgos, 4 confirmados, **todos
  corregidos** (el más serio: cancelar "Armar la Agencia" quemaba un día de recon). Detalle en
  `DECISIONES.md` (D47).
- Smoke al cierre de G7 (con los fixes): **Pueblo 1 126/126, Colonia 127/127, El Puesto 117/117
  PASS**, sin errores de consola. **32 flags en true.**
- **GP — pulido de gestión (sin flags nuevos):** GP1 (`dilemas_banco2.js`) sumó 12 dilemas
  genéricos (banco **38**, commit `e9351ca`); GP2 (commit `988a20c`) hizo el modo encontrable
  (botón **🗂 Modo Gestión** + ayuda "¿cómo se juega?"), sin tocar balance.
- **Artist-ready (4 piezas):** `assets/MANIFIESTO.md`, `js/verificar_assets.js`,
  `CREDITS.txt`, `assets/README.md` (ver sección "Arte" arriba). Smoke al cierre:
  **Pueblo 1 128/128, Colonia 129/129, El Puesto 119/119 PASS**, consola limpia.
- **Modo Gestión G1–G7 completo.** El **balance fino** (medidores, ritmo de 30 días, feel del dado)
  necesita **playtest humano** (ver `PLAYTEST.md` §15–16). El banco de **dilemas sensibles**
  (`CONTENIDO_SENSIBLE.md`) y los **dilemas con voz propia / bajada institucional** los escribe y
  aprueba **una persona** — NO es tarea de la corrida nocturna.
- **Git sigue sin remote: el push lo hace el humano** (ver sección "Push" abajo).
- **Pendiente (próxima noche): G5–G7** en `ROADMAP.md` (ciclo de 30 días + mudanza;
  descubrimiento/integración de comunidades; robustez de bordes). Las teclas **G/H** son
  entradas **temporales** hasta que G5 reparta el onboarding y los dilemas en el ciclo de días.
- **Git sigue sin remote: el push lo hace el humano** (ver sección "Push" abajo).

### Capa 2 — Pulido (primera noche)
> Se completa abajo a medida que avanza. Flags nuevos arrancan en `false` y pasan a
> `true` sólo al verificar con el smoke-test.

| Fase | Flag | Estado |
|------|------|--------|
| P1 Juice | `juice` | **hecho** (true) — smoke 43/43 |
| P2 Sonido procedural | `sonido` | **hecho** (true) — smoke 44/44 |
| P3 UX y táctil | `uiPulida` | **hecho** (true) — smoke 47/47 |
| P4 Robustez y bordes | (sin flag) | **hecho** — 7 casos de borde, smoke 54/54 |
| P5 Balance con defaults | (sin flag) | **hecho** — `CONFIG.BALANCE`, smoke 55/55 |

## Push
No hay remote git configurado. **El `git push` lo hace el humano** (crear repo en
GitHub y `git remote add origin ... && git push -u origin main`). Pasos en
`README.md` → "Publicar en GitHub Pages".
