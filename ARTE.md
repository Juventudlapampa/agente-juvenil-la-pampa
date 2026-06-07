# ARTE.md — Cómo poner arte real en el juego

El juego genera **todo el arte por código** (cero descargas). Pero está
**listo para artistas**: podés reemplazar cualquier textura por un PNG real sin
tocar el código del juego. Esto es la **Capa de Arte** (`CONFIG.capaArte`).

> **Render 16×16 nativo, escala ×2 (look GBA).** El arte es **16 × 16 px** (tiles) y
> **16 × 24 px** (personajes), y se muestra **escalado ×2** (nearest-neighbor,
> `pixelArt:true`) → 32 × 32 / 32 × 48 en pantalla. Por eso los PNG van a **16×16 /
> 16×24** (entran packs CC0 estilo Kenney directo). El juego los escala ×2 solo.

## La idea (carga en dos pasos)

Para cada textura, el juego hace:

1. **¿Hay un PNG real?** Si la textura está listada en `assets/manifest.js`, carga
   `assets/tiles/<nombre>.png` o `assets/sprites/<nombre>.png`.
2. **Si no**, usa el **generador procedural** de `js/art.js` (el arte actual).

Así, lo que tengas en PNG manda; lo que falte sigue siendo procedural. Nada se rompe.

> **¿Por qué un manifiesto y no "probar y caer"?** Probar a ciegas 40+ PNGs
> inexistentes llenaría la consola de errores 404. El manifiesto mantiene la regla
> de oro del proyecto: **abre sin errores en consola**. Es un pasito extra (listar
> el nombre) a cambio de una consola limpia.

## Cómo agregar un PNG (3 pasos)

1. Guardá el PNG con el **nombre EXACTO** de la textura (ver lista abajo):
   - **Tiles** → `assets/tiles/<nombre>.png` — **16 × 16 px** (se muestra ×2 = 32 en pantalla)
   - **Sprites** → `assets/sprites/<nombre>.png` — **16 × 24 px** (un frame por archivo; ×2 = 32 × 48)
2. Agregá ese `<nombre>` al array correcto en `assets/manifest.js`
   (`tiles` o `sprites`).
3. Recargá. El juego levanta tu PNG; el resto sigue procedural.

No hace falta tocar ningún `.js` del juego.

## Dimensiones y convención

> Todo es **16-nativo** y se ve **×2** en pantalla (nearest-neighbor). Internamente las
> texturas son chiquitas (16); cada objeto del mundo se escala ×2 con `setDisplaySize`,
> así que un tile sigue ocupando 32 px visibles. La grilla/colisión/cámara siguen en 32
> px de pantalla (no cambian): sólo cambia la resolución del arte.

- **Tiles: 16 × 16 px.** Pixel-art ~16 bits. Sin transparencia salvo que el tile la necesite.
- **Personaje / NPCs: 16 × 24 px**, un PNG **por frame**.
  - 4 direcciones: `abajo`, `arriba`, `izq`, `der`.
  - 3 frames por dirección: `0` (quieto), `1` y `2` (pasos de caminata).
  - Nombre = `jugador_<dir>_<frame>` (p. ej. `jugador_abajo_0`).
  - Los pies del personaje van cerca de la base del lienzo (origen 0.5, 0.75).
- **Excepción:** `brujula_flecha` es un icono de UI de código (**32 × 28**), no se convirtió.

## Paleta recomendada

Para que el arte nuevo combine con lo procedural, recomendamos una paleta pixel-art
cálida. Buen punto de partida: **"Resurrect 64"** (Lospec):
<https://lospec.com/palette-list/resurrect-64>
(o cualquier paleta de ~32–64 colores tipo SNES/16-bit). No es obligatorio.

## Lista de nombres de textura

### Tiles (32×32) — carpeta `assets/tiles/`
```
pasto  tierra  vereda  agua  junco  arado  calden  plaza  monumento
cultivo_0  cultivo_1  cultivo_2  cultivo_3
casa_pared  casa_techo  casa_ventana  casa_puerta
iglesia_pared  iglesia_techo  iglesia_ventana  iglesia_puerta
muni_pared  muni_techo  muni_ventana  muni_puerta
juventud_pared  juventud_techo  juventud_ventana  juventud_puerta
almacen_pared  almacen_techo  almacen_ventana  almacen_puerta
moneda  exclamacion  check  mesa_crafteo  brujula_flecha
```

### Sprites (32×48) — carpeta `assets/sprites/`
Patrón `<base>_<dir>_<frame>`, con `<dir>` ∈ {abajo, arriba, izq, der} y `<frame>` ∈ {0,1,2}:
```
jugador_*            (el Agente; ojo: el creador de agente lo recolorea por código,
                      si ponés PNG fijo perdés las 4 variantes de color)
npc_intendenta_*  npc_cura_*  npc_almacenero_*  npc_maestra_*  npc_abuela_*  npc_chacarero_*
npc_puestero_*  npc_pulpero_*  npc_maestrarural_*  npc_partera_*
```
Ejemplo de un set mínimo del jugador (12 archivos):
`jugador_abajo_0.png … jugador_abajo_2.png`, `jugador_arriba_0.png … `, etc.

## Probarlo

Con `CONFIG.capaArte` en `true` y `assets/manifest.js` **vacío**, el juego se ve
igual que siempre (todo procedural, cero PNG, cero 404). Agregá un PNG + su nombre al
manifiesto y vas a verlo en pantalla al recargar. El smoke-test confirma que el
fallback procedural sigue cubriendo todo lo no provisto.

> **Nota de robustez (F5):** el generador procedural (`generarTodo`) es **idempotente**
> — cada generador saltea las claves que ya existen. Por eso el orden real "cargo los
> PNG del manifiesto → relleno lo que falta con procedural" es seguro: rellenar nunca
> pisa ni rompe un PNG ya cargado. El smoke lo verifica en cada arranque.
