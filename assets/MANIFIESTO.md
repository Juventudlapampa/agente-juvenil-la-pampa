# MANIFIESTO de assets — Agente Juvenil – La Pampa

> Tabla maestra de **todas** las texturas reemplazables por PNG. Reconcilia el
> listado de arte (ARTE.md, READMEs de carpeta) con los **nombres reales** que el
> código genera. Generado revisando `js/art.js`, `js/crafteo.js` y `js/brujula.js`.
>
> **Estado de cada pieza:**
> - `código` = hoy se dibuja por código (procedural). El juego se ve igual sin PNG.
> - `PNG` = ya hay un archivo real en `/assets/...` **y** está listado en `assets/manifest.js`.
>
> **Hoy TODO está en `código`** (el manifiesto arranca vacío). Para reemplazar una
> pieza: poné el PNG con el nombre exacto en la carpeta indicada, sumá el nombre a
> `assets/manifest.js` y recargá. Ver `assets/README.md` y `ARTE.md`.
>
> Nombre de archivo = `<nombre de textura>.png` (sin mayúsculas, sin espacios).

## Resumen

| Grupo | Piezas | Carpeta | Dimensión |
|---|---|---|---|
| Tiles | 37 | `/assets/tiles/` | 32 × 32 px |
| Especiales | 1 | `/assets/tiles/` | 32 × 28 px (¡no 32×32!) |
| Sprites (personaje + NPCs) | 132 | `/assets/sprites/` | 32 × 48 px (1 frame por archivo) |
| **TOTAL** | **170** | | |

---

## Tiles — `/assets/tiles/` · 32 × 32 px

| PNG esperado | Estado | Genera | Nota |
|---|---|---|---|
| `pasto.png` | código | art.js | Suelo base. |
| `tierra.png` | código | art.js | |
| `vereda.png` | código | art.js | |
| `agua.png` | código | art.js | |
| `junco.png` | código | art.js | Borde de aguada (lo genera `aguada()`). |
| `arado.png` | código | art.js | Tierra arada (lo genera `granjaTiles()`). |
| `calden.png` | código | art.js | Árbol. Colisiona. |
| `plaza.png` | código | art.js | |
| `monumento.png` | código | art.js | Colisiona. |
| `cultivo_0.png` | código | art.js | Cultivo: semilla. |
| `cultivo_1.png` | código | art.js | Cultivo: brote. |
| `cultivo_2.png` | código | art.js | Cultivo: crece. |
| `cultivo_3.png` | código | art.js | Cultivo: maduro. |
| `casa_pared.png` | código | art.js | |
| `casa_techo.png` | código | art.js | |
| `casa_ventana.png` | código | art.js | |
| `casa_puerta.png` | código | art.js | |
| `iglesia_pared.png` | código | art.js | |
| `iglesia_techo.png` | código | art.js | |
| `iglesia_ventana.png` | código | art.js | |
| `iglesia_puerta.png` | código | art.js | |
| `muni_pared.png` | código | art.js | Municipalidad. |
| `muni_techo.png` | código | art.js | |
| `muni_ventana.png` | código | art.js | |
| `muni_puerta.png` | código | art.js | |
| `juventud_pared.png` | código | art.js | Casa de la Juventud. |
| `juventud_techo.png` | código | art.js | |
| `juventud_ventana.png` | código | art.js | |
| `juventud_puerta.png` | código | art.js | |
| `almacen_pared.png` | código | art.js | |
| `almacen_techo.png` | código | art.js | |
| `almacen_ventana.png` | código | art.js | |
| `almacen_puerta.png` | código | art.js | |
| `moneda.png` | código | art.js | Icono UI. |
| `exclamacion.png` | código | art.js | Icono "!" sobre el NPC. |
| `check.png` | código | art.js | Icono de misión cumplida. |
| `mesa_crafteo.png` | código | **crafteo.js** | ⚠️ Ver discrepancia (1). 32×32, reemplazable igual. |

## Especiales — `/assets/tiles/` · dimensión propia

| PNG esperado | Estado | Genera | Dimensión | Nota |
|---|---|---|---|---|
| `brujula_flecha.png` | código | **brujula.js** | **32 × 28** | ⚠️ Ver discrepancia (2). Flecha de la brújula. |

---

## Sprites — `/assets/sprites/` · 32 × 48 px (un frame por archivo)

Patrón por personaje: **`<base>_<dir>_<frame>.png`**, con
`<dir>` ∈ {`abajo`, `arriba`, `izq`, `der`} y `<frame>` ∈ {`0`, `1`, `2`}
→ **12 archivos por personaje**. Ejemplo del Agente:

```
jugador_abajo_0.png   jugador_abajo_1.png   jugador_abajo_2.png
jugador_arriba_0.png  jugador_arriba_1.png  jugador_arriba_2.png
jugador_izq_0.png     jugador_izq_1.png     jugador_izq_2.png
jugador_der_0.png     jugador_der_1.png     jugador_der_2.png
```

| Base | Estado | Genera | Archivos | Nota |
|---|---|---|---|---|
| `jugador` | código | art.js | 12 | El Agente. ⚠️ Ver discrepancia (3): se recolorea por código. |
| `npc_intendenta` | código | art.js | 12 | |
| `npc_cura` | código | art.js | 12 | |
| `npc_almacenero` | código | art.js | 12 | |
| `npc_maestra` | código | art.js | 12 | |
| `npc_abuela` | código | art.js | 12 | |
| `npc_chacarero` | código | art.js | 12 | |
| `npc_puestero` | código | art.js | 12 | Colonia (C1.1). |
| `npc_pulpero` | código | art.js | 12 | Colonia. |
| `npc_maestrarural` | código | art.js | 12 | Colonia. |
| `npc_partera` | código | art.js | 12 | Colonia. |

> Los +6 vecinos de D1 (`AJ.ROSTER_D1`) **reusan** estas 11 bases: no agregan
> sprites nuevos. El Modo Gestión (G1–G7) es 100% DOM: **no agrega texturas**.

---

## Discrepancias detectadas (listado vs. código real)

1. **`mesa_crafteo`** — ARTE.md lo lista entre los tiles, dando a entender que lo
   genera `art.js`. **No lo genera art.js**: lo genera `js/crafteo.js`
   (`_generarTexturas`, 32×32, con `if (textures.exists) return`). Igual es
   reemplazable: la capa de arte (`preparar`, en `preload`) carga el PNG **antes**
   de que crafteo lo genere (en `create`), y el guard hace que el PNG mande.
2. **`brujula_flecha`** — ARTE.md lo lista entre los tiles (implicando 32×32). En
   realidad lo genera `js/brujula.js` con dimensión **32 × 28**, no 32×32. Es una
   flecha de UI. Reemplazable, pero respetá la dimensión 32×28 (o un PNG que se vea
   bien escalado a ese alto). Va en `/assets/tiles/` si lo listás en `manifest.tiles`.
3. **`jugador_*`** — el sprite del Agente se **recolorea por código** (4 variantes
   de color que elige el jugador, `CONFIG.creadorAgente`). Si ponés un PNG fijo para
   `jugador_*`, **perdés las 4 variantes** (todos los agentes se ven igual). Si querés
   mantenerlas, dejá `jugador_*` en procedural y poné PNG sólo para los `npc_*` y tiles.
4. **Abreviaturas** — las listas de `ARTE.md` y de los READMEs usan `*` para
   personajes y abrevian edificios; este manifiesto los **expande completos**. No es
   un error del listado, sólo una expansión (acá está el detalle pieza por pieza).

> Fuera de estas 4 notas, los nombres del listado **coinciden** con los del código.

## Cómo se chequea la cobertura

`js/verificar_assets.js` (en modo dev) recorre este inventario, intenta cargar cada
PNG y reporta en consola `PASS` / `FALTA` por pieza, con el **% de cobertura de arte**.
No rompe nada si faltan: el fallback procedural ya cubre todo.
