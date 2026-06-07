# AUDITORÍA DE ARTE — qué necesita ojo humano

> **Autogenerado por `node auditar_arte.js`.** No edites a mano: re-corré el script.
> Lista lo dudoso; NO arregla nada solo. Fecha de esta corrida: 2026-06-07.

## Cobertura

- **28/170 piezas con PNG (16%).** El resto se dibuja por código (fallback procedural).
- Tiles con PNG: 28/38. Sprites con PNG: 0/132.
- Paleta: 32 colores (DawnBringer 32). Umbral embarrado: ≥20% de píxeles a ΔE>25.

## 1. Fuera de paleta (chequeo de sanidad del pipeline)

✅ Ningún PNG exportado tiene píxeles fuera de la paleta. El recoloreo es exacto.

## 2. Tiles embarrados (el original estaba lejos de la paleta)

El recoloreo aproxima al color más cercano; si el original tenía muchos tonos lejanos a DB32, el resultado puede verse sucio. Revisar EN PANTALLA si convencen:

- `moneda` — 77% de píxeles lejos (30/39). 👀 revisar a mano.
- `calden` — 24% de píxeles lejos (53/218). 👀 revisar a mano.

## 3. Transparencia

**Semi-transparencia (0<alpha<255, riesgo de halo al escalar ×2):**
- ✅ Ninguno: todos los PNG son alpha duro (0 ó 255).

**Suelos con agujeros (tiles de suelo que deberían ser 100% opacos):**
- ✅ Ninguno: todos los suelos son full-bleed.

## 4. Sin PNG (procedural) — candidatos a dibujo a mano

### Tiles (10)
- `junco` — Sin equivalente claro (no hay tile de juncos/totora en los packs).
- `arado` — Hay tierra en el roguelike, pero se deja procedural por COHERENCIA con los cultivos (que son procedurales): el plot vacío y plantado deben matchear.
- `monumento` — Probado statue del roguelike → panel adversarial 0/3 (lee como caja/pileta, sin figura). Candidato a dibujo a mano.
- `cultivo_0` — No hay cultivos en etapas en los packs. Candidato a dibujo a mano (4 etapas).
- `cultivo_1` — Idem cultivo_0 (etapa).
- `cultivo_2` — Idem cultivo_0 (etapa).
- `cultivo_3` — Idem cultivo_0 (etapa).
- `exclamacion` — Símbolo "!" de UI: no hay en los packs. Procedural (o dibujo a mano).
- `check` — Símbolo "✓" de UI: no hay en los packs. Procedural (o dibujo a mano).
- `brujula_flecha` — UI 32×28 (tamaño especial, rota hacia la misión). Procedural; mapear arriesga escala.

### Sprites de personajes (132)

Los 132 sprites (jugador + 10 NPCs × 4 dirs × 3 frames) siguen procedurales: **falta un pack de personajes** en `raw/` (los packs actuales son de entorno/UI). Es el 78% del inventario; bajar un pack de personajes es el mayor salto de cobertura posible.

<details><summary>lista completa de sprites sin PNG</summary>

- `jugador_abajo_0`
- `jugador_abajo_1`
- `jugador_abajo_2`
- `jugador_arriba_0`
- `jugador_arriba_1`
- `jugador_arriba_2`
- `jugador_izq_0`
- `jugador_izq_1`
- `jugador_izq_2`
- `jugador_der_0`
- `jugador_der_1`
- `jugador_der_2`
- `npc_intendenta_abajo_0`
- `npc_intendenta_abajo_1`
- `npc_intendenta_abajo_2`
- `npc_intendenta_arriba_0`
- `npc_intendenta_arriba_1`
- `npc_intendenta_arriba_2`
- `npc_intendenta_izq_0`
- `npc_intendenta_izq_1`
- `npc_intendenta_izq_2`
- `npc_intendenta_der_0`
- `npc_intendenta_der_1`
- `npc_intendenta_der_2`
- `npc_cura_abajo_0`
- `npc_cura_abajo_1`
- `npc_cura_abajo_2`
- `npc_cura_arriba_0`
- `npc_cura_arriba_1`
- `npc_cura_arriba_2`
- `npc_cura_izq_0`
- `npc_cura_izq_1`
- `npc_cura_izq_2`
- `npc_cura_der_0`
- `npc_cura_der_1`
- `npc_cura_der_2`
- `npc_almacenero_abajo_0`
- `npc_almacenero_abajo_1`
- `npc_almacenero_abajo_2`
- `npc_almacenero_arriba_0`
- `npc_almacenero_arriba_1`
- `npc_almacenero_arriba_2`
- `npc_almacenero_izq_0`
- `npc_almacenero_izq_1`
- `npc_almacenero_izq_2`
- `npc_almacenero_der_0`
- `npc_almacenero_der_1`
- `npc_almacenero_der_2`
- `npc_maestra_abajo_0`
- `npc_maestra_abajo_1`
- `npc_maestra_abajo_2`
- `npc_maestra_arriba_0`
- `npc_maestra_arriba_1`
- `npc_maestra_arriba_2`
- `npc_maestra_izq_0`
- `npc_maestra_izq_1`
- `npc_maestra_izq_2`
- `npc_maestra_der_0`
- `npc_maestra_der_1`
- `npc_maestra_der_2`
- `npc_abuela_abajo_0`
- `npc_abuela_abajo_1`
- `npc_abuela_abajo_2`
- `npc_abuela_arriba_0`
- `npc_abuela_arriba_1`
- `npc_abuela_arriba_2`
- `npc_abuela_izq_0`
- `npc_abuela_izq_1`
- `npc_abuela_izq_2`
- `npc_abuela_der_0`
- `npc_abuela_der_1`
- `npc_abuela_der_2`
- `npc_chacarero_abajo_0`
- `npc_chacarero_abajo_1`
- `npc_chacarero_abajo_2`
- `npc_chacarero_arriba_0`
- `npc_chacarero_arriba_1`
- `npc_chacarero_arriba_2`
- `npc_chacarero_izq_0`
- `npc_chacarero_izq_1`
- `npc_chacarero_izq_2`
- `npc_chacarero_der_0`
- `npc_chacarero_der_1`
- `npc_chacarero_der_2`
- `npc_puestero_abajo_0`
- `npc_puestero_abajo_1`
- `npc_puestero_abajo_2`
- `npc_puestero_arriba_0`
- `npc_puestero_arriba_1`
- `npc_puestero_arriba_2`
- `npc_puestero_izq_0`
- `npc_puestero_izq_1`
- `npc_puestero_izq_2`
- `npc_puestero_der_0`
- `npc_puestero_der_1`
- `npc_puestero_der_2`
- `npc_pulpero_abajo_0`
- `npc_pulpero_abajo_1`
- `npc_pulpero_abajo_2`
- `npc_pulpero_arriba_0`
- `npc_pulpero_arriba_1`
- `npc_pulpero_arriba_2`
- `npc_pulpero_izq_0`
- `npc_pulpero_izq_1`
- `npc_pulpero_izq_2`
- `npc_pulpero_der_0`
- `npc_pulpero_der_1`
- `npc_pulpero_der_2`
- `npc_maestrarural_abajo_0`
- `npc_maestrarural_abajo_1`
- `npc_maestrarural_abajo_2`
- `npc_maestrarural_arriba_0`
- `npc_maestrarural_arriba_1`
- `npc_maestrarural_arriba_2`
- `npc_maestrarural_izq_0`
- `npc_maestrarural_izq_1`
- `npc_maestrarural_izq_2`
- `npc_maestrarural_der_0`
- `npc_maestrarural_der_1`
- `npc_maestrarural_der_2`
- `npc_partera_abajo_0`
- `npc_partera_abajo_1`
- `npc_partera_abajo_2`
- `npc_partera_arriba_0`
- `npc_partera_arriba_1`
- `npc_partera_arriba_2`
- `npc_partera_izq_0`
- `npc_partera_izq_1`
- `npc_partera_izq_2`
- `npc_partera_der_0`
- `npc_partera_der_1`
- `npc_partera_der_2`

</details>
