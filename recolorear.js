/* =====================================================================
 * recolorear.js — Recolorea packs CC0 a UNA paleta cerrada (Node, sin deps).
 * ---------------------------------------------------------------------
 * - Lee la paleta de assets/paleta.hex (un hex por línea).
 * - Recorre TODOS los .png de assets/raw/.
 * - Mapea cada pixel al color MÁS CERCANO de la paleta (distancia perceptual
 *   Lab ΔE76), preservando transparencia y tamaño exacto, SIN suavizado.
 * - Guarda en assets/recolor/ con el mismo nombre/subcarpeta.
 * - Reporta: PNG procesados, colores fuera de paleta, archivos "embarrados".
 *
 * Codec PNG propio (zlib de Node): decode (filtros 0–4, color types 0/2/3/4/6,
 * 8 bits, no entrelazado) + encode (RGBA, filtro 0). Se exporta para recortar.js.
 *
 * Uso:  node recolorear.js
 * ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const AQUI = __dirname;
const ASSETS = path.join(AQUI, 'assets');
const PALETA_PATH = path.join(ASSETS, 'paleta.hex');
const RAW_DIR = path.join(ASSETS, 'raw');
const OUT_DIR = path.join(ASSETS, 'recolor');

const UMBRAL_FUERA = 1.0;   // ΔE para contar "fuera de paleta" (>0 = no exacto)
const UMBRAL_LEJOS = 25.0;  // ΔE para contar "lejos" (color claramente distinto)
const FRAC_EMBARRADO = 0.30; // fracción de pixeles lejos para marcar el archivo

/* ----------------------------- PNG codec --------------------------- */
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// Decode PNG -> { width, height, data: Uint8Array RGBA }
function decodePNG(buf) {
  if (!buf.slice(0, 8).equals(SIG)) throw new Error('no es PNG');
  let off = 8, ihdr = null, plte = null, trns = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error('sin IHDR');
  const W = ihdr.readUInt32BE(0), H = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
  if (bitDepth !== 8) throw new Error('bitDepth ' + bitDepth + ' no soportado (sólo 8)');
  if (interlace !== 0) throw new Error('PNG entrelazado no soportado');
  const canales = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!canales) throw new Error('colorType ' + colorType + ' no soportado');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = canales;                 // bytes por pixel (muestra)
  const stride = W * bpp;
  const cruda = Buffer.alloc(H * stride);
  let pos = 0;
  for (let y = 0; y < H; y++) {
    const filtro = raw[pos++];
    const fila = cruda.slice(y * stride, (y + 1) * stride);
    const prev = y > 0 ? cruda.slice((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const valor = raw[pos++];
      const a = x >= bpp ? fila[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v;
      if (filtro === 0) v = valor;
      else if (filtro === 1) v = valor + a;
      else if (filtro === 2) v = valor + b;
      else if (filtro === 3) v = valor + ((a + b) >> 1);
      else if (filtro === 4) v = valor + paeth(a, b, c);
      else throw new Error('filtro ' + filtro + ' inválido');
      fila[x] = v & 0xff;
    }
  }
  // a RGBA
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let r, g, b, al = 255;
    const s = i * bpp;
    if (colorType === 6) { r = cruda[s]; g = cruda[s + 1]; b = cruda[s + 2]; al = cruda[s + 3]; }
    else if (colorType === 2) { r = cruda[s]; g = cruda[s + 1]; b = cruda[s + 2]; }
    else if (colorType === 0) { r = g = b = cruda[s]; if (trns && trns.readUInt16BE(0) === cruda[s]) al = 0; }
    else if (colorType === 4) { r = g = b = cruda[s]; al = cruda[s + 1]; }
    else if (colorType === 3) {
      const idx = cruda[s];
      r = plte[idx * 3]; g = plte[idx * 3 + 1]; b = plte[idx * 3 + 2];
      al = (trns && idx < trns.length) ? trns[idx] : 255;
    }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = al;
  }
  return { width: W, height: H, data: out };
}

// Encode RGBA -> PNG (color type 6, filtro 0).
function encodePNG(W, H, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = W * 4;
  const raw = Buffer.alloc(H * (1 + stride));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + stride)] = 0;
    for (let x = 0; x < stride; x++) raw[y * (1 + stride) + 1 + x] = rgba[y * stride + x];
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* --------------------------- Paleta + Lab -------------------------- */
function leerPaleta(ruta) {
  const cols = [];
  for (let ln of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    ln = ln.trim(); if (!ln || ln[0] === '#') continue;
    ln = ln.replace(/^#/, '').trim();
    if (ln.length === 3) ln = ln.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(ln)) continue;
    const n = parseInt(ln, 16);
    cols.push([(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  return cols;
}
function srgbLin(c) { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; }
function rgbALab(r, g, b) {
  r = srgbLin(r); g = srgbLin(g); b = srgbLin(b);
  let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  x /= 0.95047; z /= 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function construirIndice(paleta) { return paleta.map((c) => ({ rgb: c, lab: rgbALab(c[0], c[1], c[2]) })); }

// Devuelve { rgb:[r,g,b], dE } del color de paleta más cercano (cacheado por color).
function colorCercano(r, g, b, indice, cache) {
  const key = (r << 16) | (g << 8) | b;
  const hit = cache.get(key);
  if (hit) return hit;
  const lab = rgbALab(r, g, b);
  let mejor = null, mejorD2 = Infinity;
  for (const it of indice) {
    const d2 = (lab[0] - it.lab[0]) ** 2 + (lab[1] - it.lab[1]) ** 2 + (lab[2] - it.lab[2]) ** 2;
    if (d2 < mejorD2) { mejorD2 = d2; mejor = it.rgb; }
  }
  const res = { rgb: mejor, dE: Math.sqrt(mejorD2) };
  cache.set(key, res);
  return res;
}

// Recolorea un buffer RGBA in-place. Devuelve {opacos, lejos, fueraSet}.
function recolorearRGBA(rgba, indice, cache, fueraSet) {
  let opacos = 0, lejos = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a === 0) continue;
    opacos++;
    const { rgb, dE } = colorCercano(rgba[i], rgba[i + 1], rgba[i + 2], indice, cache);
    if (dE > UMBRAL_FUERA && fueraSet) fueraSet.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
    if (dE > UMBRAL_LEJOS) lejos++;
    rgba[i] = rgb[0]; rgba[i + 1] = rgb[1]; rgba[i + 2] = rgb[2];
  }
  return { opacos, lejos };
}

/* ------------------------------ utils ------------------------------ */
function listarPngs(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.png')) out.push(p);
    }
  })(dir);
  return out.sort();
}

/* ------------------------------ main ------------------------------- */
function main() {
  if (!fs.existsSync(PALETA_PATH)) { console.error('No existe ' + PALETA_PATH); process.exit(1); }
  const paleta = leerPaleta(PALETA_PATH);
  if (!paleta.length) { console.error('Paleta vacía en ' + PALETA_PATH); process.exit(1); }
  console.log('Paleta: ' + paleta.length + ' colores.');
  const indice = construirIndice(paleta);

  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
    console.log('Creé ' + RAW_DIR + '. Soltá ahí los PNG y volvé a correr.'); return;
  }
  const pngs = listarPngs(RAW_DIR).filter((p) => path.basename(p).toLowerCase() !== 'readme.md');
  if (!pngs.length) { console.log('No hay PNG en ' + RAW_DIR); return; }

  const cache = new Map();
  const fueraSet = new Set();
  const embarrados = [];
  let totalOpacos = 0, ok = 0, fallos = 0;

  for (const ruta of pngs) {
    const rel = path.relative(RAW_DIR, ruta);
    let img;
    try { img = decodePNG(fs.readFileSync(ruta)); }
    catch (e) { fallos++; console.log('  [skip] ' + rel + ' (' + e.message + ')'); continue; }
    const r = recolorearRGBA(img.data, indice, cache, fueraSet);
    const dest = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, encodePNG(img.width, img.height, img.data));
    ok++; totalOpacos += r.opacos;
    if (r.opacos && r.lejos / r.opacos > FRAC_EMBARRADO) embarrados.push([rel, r.lejos, r.opacos]);
  }

  console.log('\n== Recoloreo terminado ==');
  console.log('PNG procesados:            ' + ok + (fallos ? '  (saltados: ' + fallos + ')' : ''));
  console.log('Pixeles opacos totales:    ' + totalOpacos);
  console.log('Colores distintos fuera de paleta (mapeados): ' + fueraSet.size);
  console.log('Salida en:                 ' + OUT_DIR);
  if (embarrados.length) {
    console.log('\n[!] Archivos EMBARRADOS (>' + (FRAC_EMBARRADO * 100) + '% de pixeles lejos) — revisá a mano:');
    embarrados.sort((a, b) => (b[1] / b[2]) - (a[1] / a[2]));
    for (const [rel, lejos, op] of embarrados.slice(0, 40)) {
      console.log('    ' + rel + '  (' + lejos + '/' + op + ' = ' + Math.round(100 * lejos / op) + '%)');
    }
    if (embarrados.length > 40) console.log('    ...y ' + (embarrados.length - 40) + ' más.');
  } else {
    console.log('\nNingún archivo quedó muy embarrado.  :)');
  }
}

module.exports = {
  decodePNG, encodePNG, leerPaleta, construirIndice, colorCercano, recolorearRGBA,
  PALETA_PATH, RAW_DIR, OUT_DIR, ASSETS,
};

if (require.main === module) main();
