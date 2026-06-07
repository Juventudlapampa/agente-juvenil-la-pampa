# assets/sprites/ — Personajes (16 × 24 px, se ven ×2 = 32 × 48 en pantalla)

Poné acá los PNG de **personajes** (Agente y vecinos). **Cada archivo: 16 × 24 px,
un solo frame por archivo** (render 16-nativo; el juego lo escala ×2).

## Anatomía de un personaje
- **4 direcciones:** `abajo`, `arriba`, `izq`, `der`.
- **3 frames por dirección:** `0` (quieto), `1` y `2` (pasos de caminata).
- **Nombre = `<base>_<dir>_<frame>`** → 12 archivos por personaje.
- Los **pies** van cerca de la base del lienzo (el sprite se ancla en origen 0.5, 0.75;
  la cabeza arriba, una sombra suave a los pies).

Ejemplo del Agente (12 archivos):
```
jugador_abajo_0.png  jugador_abajo_1.png  jugador_abajo_2.png
jugador_arriba_0.png jugador_arriba_1.png jugador_arriba_2.png
jugador_izq_0.png    jugador_izq_1.png    jugador_izq_2.png
jugador_der_0.png    jugador_der_1.png    jugador_der_2.png
```

## Cómo usar
1. Guardá cada frame con su nombre exacto (ej. `jugador_abajo_0.png`).
2. Agregá esos nombres al array `sprites` de `../manifest.js`.
3. Recargá (con `CONFIG.capaArte` en true).

## Bases de personaje disponibles
```
jugador            (el Agente)
npc_intendenta   npc_cura   npc_almacenero   npc_maestra   npc_abuela   npc_chacarero
npc_puestero     npc_pulpero   npc_maestrarural   npc_partera
```

## ⚠️ Ojo con el Agente (creador de agente)
El sprite del Agente se **recolorea por código** (4 variantes de color que elige el
jugador, `CONFIG.creadorAgente`). Si ponés un PNG fijo para `jugador_*`, **perdés las
4 variantes** (todos los agentes se verán igual). Si querés mantener las variantes,
dejá `jugador_*` en procedural y poné PNG sólo para los `npc_*`.

## Paleta recomendada
**Resurrect 64**: <https://lospec.com/palette-list/resurrect-64>

Ver `ARTE.md` en la raíz para el detalle completo. La función `dibujarAgente` en
`js/art.js` muestra las proporciones del personaje actual como referencia.
