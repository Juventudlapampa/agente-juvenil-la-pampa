# README_PIPELINE.md — Recoloreo automático de arte CC0

Pipeline para pasar packs CC0 (Kenney, OpenGameArt…) a la **paleta única** del juego,
sin recolorear a mano. Dos scripts Python (Pillow): **`recolorear.py`** (recolorea
PNGs sueltos) y **`recortar.py`** (recorta un spritesheet en tiles ya nombrados).

> El juego ya levanta solo cualquier PNG que pongas en `/assets` (ver `ARTE.md`).
> Estos scripts son una herramienta **aparte**: no tocan el juego.

## Requisito (una sola vez)

Instalá Python 3 y Pillow. El comando exacto para Pillow:

```
python -m pip install pillow
```

(En Windows, si `python` abre la Microsoft Store, instalá Python real desde
python.org y reabrí la terminal. Probá `python --version`.)

## Los 5 pasos

1. **Bajá los packs** CC0 que te gusten (Kenney 1-bit / Tiny Town / Tiny Dungeon
   son 16×16 y CC0). Anotá autor/licencia en `CREDITS.txt`.

2. **Soltá los PNG en `assets/raw/`** (la primera corrida crea esa carpeta si no
   existe). Pueden ser PNGs sueltos y/o spritesheets. No los toques: `raw/` es el
   original intacto.

3. **Poné tu paleta en `assets/paleta.hex`** (un color hex por línea). Recomendada:
   "Resurrect 64" → https://lospec.com/palette-list/resurrect-64 (bajá el `.hex` de
   Lospec y pegá los colores). El archivo trae un placeholder de ejemplo para borrar.

4. **Recolorear PNGs sueltos:**
   ```
   python recolorear.py
   ```
   Recolorea todo `assets/raw/` a la paleta y lo guarda en `assets/recolor/`.
   Te dice cuántos procesó, cuántos colores quedaron fuera de paleta, y qué archivos
   quedaron "embarrados" (revisá esos a mano). Después movés los que sirvan a
   `assets/tiles/` o `assets/sprites/` con el **nombre exacto** del `MANIFIESTO.md`.

5. **Recortar un spritesheet** (opcional, si el pack viene en una grilla):
   - Editá la CONFIG arriba de `recortar.py` (qué sheet, `TILE_W`/`TILE_H`,
     `MARGEN`, `ESPACIADO`).
   - Declará en `assets/mapa_recorte.json` qué celda (fila/col) es cada pieza, con
     el nombre del `MANIFIESTO` (ej. `"pasto"`, `"jugador_abajo_0"`).
   - Corré:
     ```
     python recortar.py
     ```
   - Exporta cada celda **recortada + recoloreada** directo a `assets/tiles/` o
     `assets/sprites/` con el nombre correcto.

## Después de generar el arte

- Listá los nombres nuevos en `assets/manifest.js` (arrays `tiles` / `sprites`).
- Recargá el juego: levanta tus PNG (16×16 / 16×24, escalados ×2). Lo que falte
  sigue procedural.
- Chequeá la cobertura: en la consola del juego, `AJ.VerificarAssets.correr()`.

## Detalles técnicos

- **Recoloreo:** cada pixel se mapea al color de la paleta más cercano por
  **distancia perceptual Lab (ΔE76)** — mejor que RGB plano para que no se vea
  "lavado". Preserva transparencia y **tamaño exacto** (sin resample, sin suavizado).
- **Tamaños:** el arte es **16×16** (tiles) y **16×24** (personajes); se muestra ×2
  en el juego. Mantené ese tamaño nativo (ver `assets/MANIFIESTO.md`).
- **`recortar.py` reusa el recoloreo de `recolorear.py`** (mismo algoritmo).
- **Reporte de "embarrados":** si muchos pixeles de un archivo quedan lejos de la
  paleta, es señal de que ese pack es de otro estilo o tu paleta no cubre esos
  tonos. Revisalo a mano o elegí otro pack/paleta.
