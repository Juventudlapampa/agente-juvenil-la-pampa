# /assets/ — Arte real (PNG) del juego

El juego dibuja **todo por código** (procedural, cero descargas). Esta carpeta es
para **reemplazar** cualquier textura por un **PNG real** cuando quieras, sin tocar
el código. Lo que pongas acá manda; lo que falte sigue siendo procedural. **Nada se
rompe** si está incompleto.

```
/assets
  ├── README.md          ← este archivo (cómo meter un PNG)
  ├── MANIFIESTO.md      ← lista COMPLETA de las 170 piezas (nombre exacto + estado)
  ├── manifest.js        ← acá listás los PNG que agregaste (lo lee el juego)
  ├── tiles/             ← PNG de tiles  (32 × 32 px)   + su README.md
  └── sprites/           ← PNG de personajes (32 × 48)  + su README.md
```

## Meter un PNG — 3 pasos

1. **Nombre EXACTO + carpeta correcta.** El archivo se llama igual que la textura,
   en minúsculas y sin espacios, con `.png`. La carpeta depende del tipo:
   - **Tiles** → `assets/tiles/<nombre>.png` — **32 × 32 px**
   - **Sprites** (personaje/NPCs) → `assets/sprites/<nombre>.png` — **32 × 48 px**
     (un frame por archivo; ver patrón abajo)

   La lista completa de nombres está en **`MANIFIESTO.md`**. Ejemplos:
   `pasto`, `casa_techo`, `calden`, `jugador_abajo_0`, `npc_cura_der_2`.

2. **Listalo en `manifest.js`.** Agregá el `<nombre>` (sin `.png`) al array correcto:
   ```js
   AJ.ASSET_MANIFEST = {
     tiles:   ['pasto', 'calden'],          // tus PNG de /assets/tiles
     sprites: ['npc_cura_abajo_0'],         // tus PNG de /assets/sprites
   };
   ```
   > **¿Por qué hay que listarlo?** Para mantener la consola limpia: el juego sólo
   > intenta cargar lo que está en el manifiesto (si "probara" todos, llenaría la
   > consola de 404). Es un pasito extra a cambio de **abrir sin errores**.

3. **Recargá.** El juego levanta tu PNG; el resto sigue procedural. Listo.

No hace falta tocar ningún `.js` del juego.

## Dimensiones y patrón de nombres

- **Tiles: 32 × 32 px.** Pixel-art ~16 bits.
- **Sprites: 32 × 48 px**, **un PNG por frame**. Patrón `<base>_<dir>_<frame>`:
  - `<dir>` ∈ `abajo`, `arriba`, `izq`, `der`
  - `<frame>` ∈ `0` (quieto), `1`, `2` (pasos)
  - → 12 archivos por personaje. Ej.: `jugador_abajo_0.png` … `jugador_der_2.png`.
  - Los pies van cerca de la base del lienzo (el sprite se ancla en 0.5, 0.75).
- **Caso especial:** `brujula_flecha` es **32 × 28** (no 32×32). Va en `tiles/`.

## Una sola paleta (clave para que combine)

Para que tus PNG combinen entre sí **y** con lo que quede procedural, **recoloreá
todo a UNA paleta única**. Recomendada: **"Resurrect 64"** (Lospec):
<https://lospec.com/palette-list/resurrect-64> (o cualquier paleta cálida de
~32–64 colores tipo SNES). No es obligatorio, pero mezclar paletas se nota feo.

- Conseguí los assets, abrilos en tu editor (Aseprite, Photopea, GIMP) y aplicá la
  **misma paleta** a todos antes de guardarlos. Mantené el tamaño exacto (32×32 / 32×48).
- Si reemplazás de a poco, priorizá **grupos coherentes** (todos los tiles de
  edificio, o un personaje completo) para que no quede mitad y mitad.

## ⚠️ El Agente (`jugador_*`) se recolorea por código

El sprite del Agente tiene **4 variantes de color** que elige el jugador
(`CONFIG.creadorAgente`). Si ponés un PNG fijo para `jugador_*`, **perdés las 4
variantes** (todos los agentes se ven igual). Si querés conservarlas, dejá
`jugador_*` en procedural y reemplazá sólo `npc_*` y los tiles.

## Chequear cuánto arte real tenés

`js/verificar_assets.js` (dev tool) te dice la **cobertura**: cuántas de las 170
piezas tienen PNG y cuántas siguen procedural. Corrélo desde la consola del juego:
```js
AJ.VerificarAssets.correr()
```
(o prendé `CONFIG.verificarAssets` para que corra solo en modo dev). Reporta
`PASS` / `FALTA` por pieza y el % de cobertura. No rompe nada si faltan.

## No te olvides de los créditos

Cada PNG que pongas: anotá autor/licencia/URL en **`CREDITS.txt`** (raíz). Priorizá
**CC0**; evitá CC-BY-SA y GPL. El arte 100% IA no tiene copyright. Ver ese archivo.

---

> Más detalle: `tiles/README.md` y `sprites/README.md` (por carpeta), `MANIFIESTO.md`
> (lista completa de piezas), y `ARTE.md` en la raíz (el porqué de la capa de arte).
