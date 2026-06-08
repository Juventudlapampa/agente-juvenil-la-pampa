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

---

## Apéndice manual — arte procedural nuevo (O1/O2, undécima noche)

> Esta parte NO la genera `auditar_arte.js` (audita sólo los PNG de `/assets`). Son texturas
> generadas **en código, en la propia escena**, fuera del inventario de 170. Acá queda anotado
> qué se generó procedural y qué conviene DIBUJAR a futuro (decisión visual humana).

### O1 — Apertura cinematográfica (`escenas/Apertura.js`, `_generarArteApertura`)
Generadas inline (no en `art.js`):
- `ap_calden` (96×64) — silueta de caldén para el parallax (tiled = árboles espaciados). 👀 placeholder.
- `ap_poste` (48×48) — poste de alambrado con dos hilos. 👀 placeholder.
- `ap_ruta` (48×40) — banda de ruta de tierra (da sensación de movimiento). 👀 placeholder.
- El **colectivo** (marco/ventanilla/asiento) y el **cielo/campo/sol** se dibujan con `Graphics`
  directo (sin textura). 👀 lo más "pampeano" a dibujar bien: **el colectivo/micro** y un paisaje
  de ruta lateral (caldenes, postes, cielo amplio) con más carácter.
- La **Mesa de Agentes** usa los sprites `npc_*` existentes (procedurales) alrededor de una mesa
  ovalada dibujada con `Graphics`. 👀 podría ser una vista 3/4 ilustrada.

### O2 — Interiores (`js/interiores.js`, `generarArte`)
13 tiles 16×16 generados inline (no en `art.js` → cobertura sigue 170):
- `int_piso_madera`, `int_piso_baldosa`, `int_pared`, `int_puerta` (felpudo de salida),
  `int_mesa`, `int_silla`, `int_mostrador`, `int_estanteria`, `int_cama`, `int_planta`,
  `int_radio`, `int_afiche`, `int_alfombra`.
- Todos **placeholders** procedurales razonables (paleta acorde a DB32). 👀 candidatos a dibujar:
  los muebles (mesa/estantería/mostrador/cama) y los pisos, para que los interiores tengan la
  misma calidez que el exterior. Si se dibujan como PNG, sumarlos a `assets/manifest.js` con esas
  claves y cargarlos en `Interior.preload` (mismo patrón que la capa de arte F2).
