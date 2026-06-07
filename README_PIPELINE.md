# README_PIPELINE.md — Recoloreo + recorte de arte CC0 (Node.js)

Pipeline para pasar packs CC0 (Kenney…) a la **paleta única** del juego, sin
recolorear a mano. **Todo en Node.js** (el mismo que corre el juego): **cero
dependencias, cero `npm install`**. Dos scripts:

- **`recolorear.js`** — recolorea PNGs sueltos a la paleta.
- **`recortar.js`** — recorta un spritesheet en tiles ya nombrados y los cablea al juego.

> Requisito: **Node.js** (ya lo tenés). Nada más que instalar.
> Los scripts son una herramienta **aparte**: no tocan el runtime del juego.

## Los 5 pasos

1. **Bajá los packs** CC0 (Kenney 16×16: Tiny Town, Roguelike RPG, etc.). Anotá
   autor/licencia en `CREDITS.txt`.

2. **Soltá los PNG en `assets/raw/`** (ya están los de Kenney). `raw/` es el original
   intacto; no se versiona (gitignore).

3. **La paleta ya está en `assets/paleta.hex`** (DawnBringer 32, 32 colores, un hex por
   línea). Si querés otra, pegala ahí (un hex por línea, sin comentarios).

4. **Recolorear todo `assets/raw/`:**
   ```
   node recolorear.js
   ```
   Recolorea cada PNG a la paleta (color más cercano por ΔE Lab; preserva transparencia
   y tamaño, sin suavizado) → `assets/recolor/`. Reporta PNG procesados, colores fuera de
   paleta, y archivos "embarrados" (revisá esos a mano; suelen ser de otro estilo/UI).
   *(Salta PNGs de <8 bits — UI rara — sin romper.)*

5. **Recortar un spritesheet a tiles del juego:**
   - Editá la CONFIG arriba de `recortar.js` (qué sheet, `TILE`, `MARGEN`, `ESPACIADO`).
   - Declará en `assets/mapa_recorte.json` qué celda (fila/col) es cada pieza, con el
     **nombre exacto del MANIFIESTO** (ej. `"pasto"`, `"casa_techo"`).
   - Corré:
     ```
     node recortar.js
     ```
   - Exporta cada celda **recortada + recoloreada** a `assets/tiles/` o `assets/sprites/`
     con el nombre correcto, y (opcional) **agrega el nombre a `assets/manifest.js`** solo
     para que el juego lo levante.

## Después

- Recargá el juego (doble clic en `index.html` o el server local): levanta tus PNG
  (16×16 / 16×24, escalados ×2). Lo que falte sigue procedural.
- Chequeá la cobertura: en la consola del juego, `AJ.VerificarAssets.correr()`.

## Detalles técnicos

- **Recoloreo:** cada pixel → color de paleta más cercano por **distancia perceptual
  Lab (ΔE76)** (mejor que RGB plano). Transparencia y **tamaño exacto** preservados
  (sin resample, sin suavizado).
- **Tamaños:** tiles **16×16**, personajes **16×24** (se ven ×2). Ver `assets/MANIFIESTO.md`.
- **Codec PNG propio** (con `zlib` de Node): decode (filtros 0–4, color types 0/2/3/4/6,
  8 bits, no entrelazado) + encode (RGBA). `recortar.js` reusa el codec y el recoloreo
  de `recolorear.js` (mismo algoritmo).
- **Reporte de "embarrados":** muchos pixeles lejos de la paleta = ese pack es de otro
  estilo o la paleta no cubre esos tonos. Revisalo o elegí otro pack/paleta.
