#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
recolorear.py — Recolorea packs CC0 a UNA paleta cerrada (pixel-art, sin suavizado).

Qué hace:
  - Lee la paleta de assets/paleta.hex (un hex por línea).
  - Recorre TODOS los .png de assets/raw/ (donde soltás los packs sin tocar).
  - Recolorea cada pixel al color MÁS CERCANO de la paleta (distancia perceptual
    Lab ΔE), preservando transparencia, tamaño exacto y SIN suavizado (no resample).
  - Guarda en assets/recolor/ con el mismo nombre y subcarpetas.
  - Imprime un reporte: PNG procesados, colores fuera de paleta, y archivos
    "embarrados" (muchos pixeles lejos de la paleta) para revisar a mano.

Uso:  python recolorear.py
Requiere Pillow:  python -m pip install pillow
"""

import os
import sys
import math

# --- Config (ajustable) ---------------------------------------------------
AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, 'assets')
PALETA_PATH = os.path.join(ASSETS, 'paleta.hex')
RAW_DIR = os.path.join(ASSETS, 'raw')
OUT_DIR = os.path.join(ASSETS, 'recolor')

# Un pixel se cuenta "fuera de paleta" si su ΔE al color más cercano supera esto
# (ΔE ~0 = ya estaba en la paleta). 1.0 ≈ apenas distinto.
UMBRAL_FUERA = 1.0
# Un pixel se cuenta "lejos" (embarrado) si su ΔE supera esto. ΔE>25 = color
# claramente distinto al más cercano de la paleta.
UMBRAL_LEJOS = 25.0
# Si más de esta fracción de los pixeles OPACOS de un archivo quedan "lejos",
# el archivo se marca para revisión manual.
FRAC_EMBARRADO = 0.30


def leer_paleta(ruta):
    """Lee assets/paleta.hex -> lista de (r, g, b)."""
    cols = []
    with open(ruta, 'r', encoding='utf-8') as f:
        for ln in f:
            ln = ln.strip()
            if not ln or ln.startswith('#'):
                continue
            ln = ln.lstrip('#').strip()
            if len(ln) == 3:
                ln = ''.join(c * 2 for c in ln)
            if len(ln) != 6:
                continue
            try:
                cols.append((int(ln[0:2], 16), int(ln[2:4], 16), int(ln[4:6], 16)))
            except ValueError:
                pass
    return cols


# --- Conversión sRGB -> Lab (para distancia perceptual ΔE76) --------------
def _srgb_lin(c):
    c = c / 255.0
    return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92


def rgb_a_lab(rgb):
    r, g, b = (_srgb_lin(v) for v in rgb)
    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    x /= 0.95047
    z /= 1.08883

    def f(t):
        return t ** (1.0 / 3.0) if t > 0.008856 else 7.787 * t + 16.0 / 116.0

    fx, fy, fz = f(x), f(y), f(z)
    return (116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz))


def construir_indice(paleta):
    """Devuelve [(rgb, lab), ...] de la paleta."""
    return [(c, rgb_a_lab(c)) for c in paleta]


def color_cercano(rgb, indice, cache):
    """Devuelve (rgb_paleta, deltaE) del color de paleta más cercano. Cachea por color."""
    hit = cache.get(rgb)
    if hit is not None:
        return hit
    lab = rgb_a_lab(rgb)
    mejor = None
    mejor_d2 = None
    for (c, clab) in indice:
        d2 = (lab[0] - clab[0]) ** 2 + (lab[1] - clab[1]) ** 2 + (lab[2] - clab[2]) ** 2
        if mejor_d2 is None or d2 < mejor_d2:
            mejor_d2 = d2
            mejor = c
    res = (mejor, math.sqrt(mejor_d2))
    cache[rgb] = res
    return res


def listar_pngs(carpeta):
    out = []
    for root, _, files in os.walk(carpeta):
        for fn in files:
            if fn.lower().endswith('.png'):
                out.append(os.path.join(root, fn))
    return sorted(out)


def main():
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Falta Pillow. Instalá:  python -m pip install pillow")

    if not os.path.isfile(PALETA_PATH):
        sys.exit("No existe %s — creá la paleta primero." % PALETA_PATH)
    paleta = leer_paleta(PALETA_PATH)
    if not paleta:
        sys.exit("La paleta está vacía (%s). Poné un hex por línea." % PALETA_PATH)
    indice = construir_indice(paleta)
    print("Paleta: %d colores." % len(paleta))

    if not os.path.isdir(RAW_DIR):
        os.makedirs(RAW_DIR, exist_ok=True)
        sys.exit("Creé %s. Soltá ahí los PNG de los packs y volvé a correr." % RAW_DIR)

    pngs = listar_pngs(RAW_DIR)
    if not pngs:
        sys.exit("No hay PNG en %s. Soltá los packs ahí." % RAW_DIR)

    os.makedirs(OUT_DIR, exist_ok=True)
    cache = {}
    fuera_set = set()
    embarrados = []
    total_opacos = 0

    for ruta in pngs:
        img = Image.open(ruta).convert('RGBA')
        W, H = img.size
        px = img.load()
        lejos = 0
        opacos = 0
        for y in range(H):
            for x in range(W):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue  # transparente: se preserva tal cual
                opacos += 1
                col = (r, g, b)
                nuevo, d = color_cercano(col, indice, cache)
                if d > UMBRAL_FUERA:
                    fuera_set.add(col)
                if d > UMBRAL_LEJOS:
                    lejos += 1
                px[x, y] = (nuevo[0], nuevo[1], nuevo[2], a)
        rel = os.path.relpath(ruta, RAW_DIR)
        dest = os.path.join(OUT_DIR, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        # save sin resample: sólo cambiaron valores de pixel; tamaño exacto, sin suavizado.
        img.save(dest)
        total_opacos += opacos
        if opacos and (lejos / opacos) > FRAC_EMBARRADO:
            embarrados.append((rel, lejos, opacos))

    # --- Reporte ---
    print("\n== Recoloreo terminado ==")
    print("PNG procesados:                 %d" % len(pngs))
    print("Pixeles opacos totales:         %d" % total_opacos)
    print("Colores distintos fuera de paleta (mapeados al más cercano): %d" % len(fuera_set))
    print("Salida en:                      %s" % OUT_DIR)
    if embarrados:
        print("\n[!] Archivos EMBARRADOS (>%.0f%% de pixeles lejos de la paleta) — revisalos a mano:"
              % (FRAC_EMBARRADO * 100))
        for rel, lejos, op in embarrados:
            print("    %-40s  %d/%d lejos = %.0f%%" % (rel, lejos, op, 100.0 * lejos / op))
        print("    (Quizás tu paleta no cubre esos tonos, o ese pack es de otro estilo.)")
    else:
        print("\nNingún archivo quedó muy embarrado.  :)")


if __name__ == '__main__':
    main()
