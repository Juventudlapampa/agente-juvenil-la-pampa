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

### Capa 2 — Pulido (esta sesión)
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
