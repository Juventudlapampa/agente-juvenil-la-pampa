# HANDOFF.md — Estado del proyecto entre sesiones

> Documento de traspaso. La próxima sesión de Claude Code (o el humano) lee esto
> + `CLAUDE.md` para saber dónde está parado el repo. Ver también `DECISIONES.md`
> (por qué de cada cosa), `ROADMAP.md` (pendientes) y `PLAYTEST.md` (lo que necesita
> ojo humano).

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
