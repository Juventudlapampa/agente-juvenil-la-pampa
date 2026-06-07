#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
recortar.py — Recorta un spritesheet de Kenney en tiles individuales y los exporta
con el NOMBRE EXACTO del MANIFIESTO (assets/MANIFIESTO.md), recoloreados a la paleta.

Cómo:
  1. Editá la CONFIG de abajo (qué sheet, tile size, columnas/filas, márgenes).
  2. Declará en assets/mapa_recorte.json qué celda (fila/col) es cada pieza, p.ej.
       { "celdas": [ {"fila":0,"col":0,"nombre":"pasto","tipo":"tile"}, ... ] }
     tipo "tile"   -> sale a assets/tiles/<nombre>.png   (16×16)
     tipo "sprite" -> sale a assets/sprites/<nombre>.png (16×24)
  3. python recortar.py

Recolorea usando assets/paleta.hex (misma lógica que recolorear.py). Sin suavizado.
Requiere Pillow:  python -m pip install pillow
"""

import os
import sys
import json

# --- CONFIG (editá esto) --------------------------------------------------
AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, 'assets')

# Spritesheet a recortar (ponelo en assets/raw/).
SPRITESHEET = os.path.join(ASSETS, 'raw', 'tilesheet.png')

# Tamaño de cada celda del sheet (en px del sheet, ANTES de escalar):
TILE_W = 16
TILE_H = 16        # para personajes usá 24 (frame 16×24)

MARGEN = 0         # px de margen externo del sheet (Kenney a veces usa 0)
ESPACIADO = 0      # px entre celdas (Kenney "spacing", a veces 1)

RECOLOREAR = True  # aplicar assets/paleta.hex al recortar
MAPA_PATH = os.path.join(ASSETS, 'mapa_recorte.json')
# --------------------------------------------------------------------------

# Reutiliza la lógica de paleta/cercanía de recolorear.py (mismo algoritmo).
try:
    from recolorear import leer_paleta, construir_indice, color_cercano, PALETA_PATH
except Exception as e:  # pragma: no cover
    sys.exit("No pude importar recolorear.py (debe estar al lado): %s" % e)


def celda_box(fila, col):
    x = MARGEN + col * (TILE_W + ESPACIADO)
    y = MARGEN + fila * (TILE_H + ESPACIADO)
    return (x, y, x + TILE_W, y + TILE_H)


def recolorear_tile(img, indice, cache):
    px = img.load()
    W, H = img.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            nuevo, _ = color_cercano((r, g, b), indice, cache)
            px[x, y] = (nuevo[0], nuevo[1], nuevo[2], a)
    return img


def main():
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Falta Pillow. Instalá:  python -m pip install pillow")

    if not os.path.isfile(SPRITESHEET):
        sys.exit("No existe el spritesheet: %s\n(editá SPRITESHEET arriba o poné el archivo)." % SPRITESHEET)
    if not os.path.isfile(MAPA_PATH):
        sys.exit("No existe %s — declará ahí las celdas a recortar." % MAPA_PATH)

    with open(MAPA_PATH, 'r', encoding='utf-8') as f:
        mapa = json.load(f)
    celdas = mapa.get('celdas', [])
    if not celdas:
        sys.exit("mapa_recorte.json no tiene 'celdas'.")

    indice = None
    cache = {}
    if RECOLOREAR:
        if not os.path.isfile(PALETA_PATH):
            sys.exit("RECOLOREAR=True pero no existe %s." % PALETA_PATH)
        indice = construir_indice(leer_paleta(PALETA_PATH))

    sheet = Image.open(SPRITESHEET).convert('RGBA')
    SW, SH = sheet.size
    out_tiles = os.path.join(ASSETS, 'tiles')
    out_sprites = os.path.join(ASSETS, 'sprites')
    os.makedirs(out_tiles, exist_ok=True)
    os.makedirs(out_sprites, exist_ok=True)

    hechos = 0
    saltados = []
    for c in celdas:
        try:
            fila = int(c['fila'])
            col = int(c['col'])
            nombre = str(c['nombre']).strip()
            tipo = str(c.get('tipo', 'tile')).strip().lower()
        except (KeyError, ValueError):
            saltados.append("celda inválida: %r" % (c,))
            continue
        box = celda_box(fila, col)
        if box[2] > SW or box[3] > SH:
            saltados.append("%s: celda (%d,%d) fuera del sheet %dx%d" % (nombre, fila, col, SW, SH))
            continue
        tile = sheet.crop(box)  # recorte exacto, sin resample
        if RECOLOREAR:
            tile = recolorear_tile(tile, indice, cache)
        carpeta = out_sprites if tipo == 'sprite' else out_tiles
        dest = os.path.join(carpeta, nombre + '.png')
        tile.save(dest)
        hechos += 1

    print("== Recorte terminado ==")
    print("Sheet: %s  (%dx%d, celda %dx%d)" % (os.path.basename(SPRITESHEET), SW, SH, TILE_W, TILE_H))
    print("Tiles exportados: %d  (recoloreados: %s)" % (hechos, 'sí' if RECOLOREAR else 'no'))
    print("Salida: assets/tiles/ y assets/sprites/")
    if saltados:
        print("\n[!] Celdas saltadas:")
        for s in saltados:
            print("    " + s)
    print("\nAcordate de listar los nombres exportados en assets/manifest.js para que el juego los levante.")


if __name__ == '__main__':
    main()
