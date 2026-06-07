/* =====================================================================
 * recortar.js — Recorta un spritesheet en tiles y los cablea al juego (Node).
 * ---------------------------------------------------------------------
 * - Lee la grilla de CONFIG (qué sheet, TILE, MARGEN, ESPACIADO) y el mapa
 *   assets/mapa_recorte.json: { "celdas": [ {fila, col, nombre, tipo}, ... ] }.
 *   tipo "tile"   -> assets/tiles/<nombre>.png   (16×16)
 *   tipo "sprite" -> assets/sprites/<nombre>.png (16×24)
 * - Recorta cada celda del sheet (sin resample), la RECOLOREA a la paleta
 *   (assets/paleta.hex) y la guarda con el nombre EXACTO del MANIFIESTO.
 * - Regenera assets/manifest.js listando TODO lo que haya en assets/tiles y
 *   assets/sprites, así el juego (capa de arte) lo levanta solo. <- "cablear".
 *
 * Reusa el codec PNG y el recoloreo de recolorear.js (cero dependencias).
 * Uso:  node recortar.js
 * ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./recolorear.js');

// ---------------------- CONFIG (editá esto) -------------------------------
const ASSETS = R.ASSETS;
// Spritesheet a recortar (Tiny Town "packed": 12×11 tiles de 16, sin spacing):
const SHEET = path.join(ASSETS, 'raw', 'kenney_tiny-town', 'Tilemap', 'tilemap_packed.png');
const TILE_W = 16;
const TILE_H = 16;      // para personajes (sheet de gente): 24
const MARGEN = 0;       // px de borde externo del sheet
const ESPACIADO = 0;    // px entre celdas (la versión "packed" usa 0; "tilemap.png" usa 1)
const RECOLOREAR = true;
const MAPA_PATH = path.join(ASSETS, 'mapa_recorte.json');
// --------------------------------------------------------------------------

function recortarCelda(img, x0, y0, w, h) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y0 + y) * img.width + (x0 + x)) * 4;
      const di = (y * w + x) * 4;
      out[di] = img.data[si]; out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2]; out[di + 3] = img.data[si + 3];
    }
  }
  return out;
}

function listarNombres(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .map((f) => f.slice(0, -4))
    .sort();
}

function regenerarManifest() {
  const tiles = listarNombres(path.join(ASSETS, 'tiles'));
  const sprites = listarNombres(path.join(ASSETS, 'sprites'));
  const j = (arr) => arr.map((n) => "'" + n + "'").join(', ');
  const txt =
    '/* =====================================================================\n' +
    ' * manifest.js — Lista de PNG reales que reemplazan al arte procedural (F2).\n' +
    ' * AUTOGENERADO por recortar.js: lista lo que hay en assets/tiles y\n' +
    ' * assets/sprites. La capa de arte (art.js -> preparar) carga estos PNG; el\n' +
    ' * resto sigue procedural. Si agregás PNG a mano, volvé a correr recortar.js\n' +
    ' * (o editá esta lista). Tiles 16×16, sprites 16×24 (se ven ×2).\n' +
    ' * ===================================================================== */\n' +
    'window.AJ = window.AJ || {};\n' +
    'AJ.ASSET_MANIFEST = {\n' +
    '  tiles: [' + j(tiles) + '],\n' +
    '  sprites: [' + j(sprites) + '],\n' +
    '};\n';
  fs.writeFileSync(path.join(ASSETS, 'manifest.js'), txt);
  return { tiles: tiles.length, sprites: sprites.length };
}

function main() {
  if (!fs.existsSync(SHEET)) { console.error('No existe el sheet: ' + SHEET); process.exit(1); }
  if (!fs.existsSync(MAPA_PATH)) { console.error('No existe ' + MAPA_PATH); process.exit(1); }

  const mapa = JSON.parse(fs.readFileSync(MAPA_PATH, 'utf8'));
  const celdas = mapa.celdas || [];
  if (!celdas.length) { console.error('mapa_recorte.json no tiene "celdas".'); process.exit(1); }

  let indice = null, cache = null;
  if (RECOLOREAR) {
    indice = R.construirIndice(R.leerPaleta(R.PALETA_PATH));
    cache = new Map();
  }

  const img = R.decodePNG(fs.readFileSync(SHEET));
  const cols = Math.floor((img.width - MARGEN + ESPACIADO) / (TILE_W + ESPACIADO));
  const rows = Math.floor((img.height - MARGEN + ESPACIADO) / (TILE_H + ESPACIADO));
  console.log('Sheet ' + path.basename(SHEET) + ' ' + img.width + 'x' + img.height +
    '  grilla ' + cols + 'x' + rows + ' (celda ' + TILE_W + 'x' + TILE_H + ')');

  const outTiles = path.join(ASSETS, 'tiles');
  const outSprites = path.join(ASSETS, 'sprites');
  fs.mkdirSync(outTiles, { recursive: true });
  fs.mkdirSync(outSprites, { recursive: true });

  let hechos = 0; const saltados = [];
  for (const c of celdas) {
    const fila = c.fila | 0, col = c.col | 0;
    const nombre = (c.nombre || '').trim();
    const tipo = (c.tipo || 'tile').trim().toLowerCase();
    if (!nombre) { saltados.push('celda sin nombre: ' + JSON.stringify(c)); continue; }
    const x0 = MARGEN + col * (TILE_W + ESPACIADO);
    const y0 = MARGEN + fila * (TILE_H + ESPACIADO);
    if (x0 + TILE_W > img.width || y0 + TILE_H > img.height) {
      saltados.push(nombre + ': celda (' + fila + ',' + col + ') fuera del sheet'); continue;
    }
    const rgba = recortarCelda(img, x0, y0, TILE_W, TILE_H);
    if (RECOLOREAR) R.recolorearRGBA(rgba, indice, cache, null);
    const dest = path.join(tipo === 'sprite' ? outSprites : outTiles, nombre + '.png');
    fs.writeFileSync(dest, R.encodePNG(TILE_W, TILE_H, rgba));
    hechos++;
  }

  const man = regenerarManifest();
  console.log('\n== Recorte terminado ==');
  console.log('Tiles exportados: ' + hechos + (RECOLOREAR ? ' (recoloreados)' : ''));
  console.log('manifest.js regenerado -> tiles: ' + man.tiles + ', sprites: ' + man.sprites);
  if (saltados.length) { console.log('\n[!] Saltados:'); saltados.forEach((s) => console.log('    ' + s)); }
  console.log('\nRecargá el juego: la capa de arte levanta estos PNG (lo que falte sigue procedural).');
}

if (require.main === module) main();
