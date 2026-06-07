# assets/tiles/ — Tiles (16 × 16 px, se ven ×2 = 32 en pantalla)

Poné acá los PNG de **tiles** del mundo. **Cada archivo: exactamente 16 × 16 px**
(render 16-nativo; el juego lo escala ×2 con nearest-neighbor → 32 px visibles).

## Cómo usar
1. Guardá el PNG con el **nombre EXACTO** de la textura (ver lista). Ej: `pasto.png`.
2. Agregá ese nombre al array `tiles` de `../manifest.js`.
3. Recargá el juego (con `CONFIG.capaArte` en true). Listo.

Lo que NO pongas acá sigue generándose por código (no se rompe nada).

## Nombres de tile (16×16)
Terreno y naturaleza:
```
pasto  tierra  vereda  agua  junco  arado  calden  plaza  monumento
```
Cultivos (4 etapas de la huerta):
```
cultivo_0  cultivo_1  cultivo_2  cultivo_3
```
Edificios (cada uno tiene pared, techo, ventana y puerta):
```
casa_pared       casa_techo       casa_ventana       casa_puerta
iglesia_pared    iglesia_techo    iglesia_ventana    iglesia_puerta
muni_pared       muni_techo       muni_ventana       muni_puerta
juventud_pared   juventud_techo   juventud_ventana   juventud_puerta
almacen_pared    almacen_techo    almacen_ventana    almacen_puerta
```
Iconos y objetos:
```
moneda  exclamacion  check  mesa_crafteo  brujula_flecha
```

## Paleta recomendada
Pixel-art ~16-bit. Buen punto de partida: **Resurrect 64**
<https://lospec.com/palette-list/resurrect-64>

## Referencia visual
El generador procedural en `js/art.js` (funciones `pasto`, `tierra`, `agua`,
`calden`, `edificioTiles`, etc.) muestra cómo se ve cada tile hoy: usalo como
guía de color y forma. Ver `ARTE.md` en la raíz para el detalle completo.
