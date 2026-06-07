/* =====================================================================
 * auditar_arte.js — Auditoría automática del arte mapeado (Node, sin deps).
 * ---------------------------------------------------------------------
 * Recorre el inventario canónico de texturas (espejo de verificar_assets.js)
 * y los PNG reales en assets/tiles y assets/sprites, y reporta a
 * AUDITORIA_ARTE.md exactamente lo que necesita OJO HUMANO:
 *
 *  1. SIN PNG  → nombres del inventario que siguen procedurales (candidatos a
 *     dibujo a mano o sin equivalente en los packs).
 *  2. EMBARRADOS → tiles mapeados cuyo ORIGINAL estaba lejos de la paleta
 *     (el recoloreo tuvo que aproximar mucho ⇒ puede verse sucio). Se mide
 *     re-recortando la celda original del sheet y midiendo ΔE Lab.
 *  3. TRANSPARENCIA → tiles con píxeles semi-transparentes (riesgo de halo) o
 *     tiles de SUELO (deberían ser 100% opacos) con agujeros.
 *  4. FUERA DE PALETA → píxeles del PNG exportado que NO son exactamente un
 *     color de la paleta (no debería pasar; chequeo de sanidad del pipeline).
 *
 * NO arregla nada: sólo LISTA lo dudoso para revisión humana.
 * Uso:  node auditar_arte.js
 * ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const R = require('./recolorear.js');

const ASSETS = R.ASSETS;
const RAW = path.join(ASSETS, 'raw');
const PAL = R.leerPaleta(R.PALETA_PATH);
const IDX = R.construirIndice(PAL);
const PAL_SET = new Set(PAL.map((c) => (c[0] << 16) | (c[1] << 8) | c[2]));
const CACHE = new Map();

// Umbrales
const DE_LEJOS = 25;       // ΔE Lab para contar un pixel "lejos" de la paleta
const FRAC_EMBARRADO = 0.20; // fracción de píxeles lejos para marcar el tile

// ---- Inventario canónico (espejo EXACTO de js/verificar_assets.js) ----
const TILES = [
  'pasto', 'tierra', 'vereda', 'agua', 'junco', 'arado', 'calden', 'plaza', 'monumento',
  'cultivo_0', 'cultivo_1', 'cultivo_2', 'cultivo_3',
  'casa_pared', 'casa_techo', 'casa_ventana', 'casa_puerta',
  'iglesia_pared', 'iglesia_techo', 'iglesia_ventana', 'iglesia_puerta',
  'muni_pared', 'muni_techo', 'muni_ventana', 'muni_puerta',
  'juventud_pared', 'juventud_techo', 'juventud_ventana', 'juventud_puerta',
  'almacen_pared', 'almacen_techo', 'almacen_ventana', 'almacen_puerta',
  'moneda', 'exclamacion', 'check', 'mesa_crafteo', 'brujula_flecha',
];
const SPRITE_BASES = [
  'jugador',
  'npc_intendenta', 'npc_cura', 'npc_almacenero', 'npc_maestra', 'npc_abuela', 'npc_chacarero',
  'npc_puestero', 'npc_pulpero', 'npc_maestrarural', 'npc_partera',
];
const DIRS = ['abajo', 'arriba', 'izq', 'der'];
const FRAMES = [0, 1, 2];
function spriteNames() {
  const out = [];
  SPRITE_BASES.forEach((b) => DIRS.forEach((d) => FRAMES.forEach((f) => out.push(b + '_' + d + '_' + f))));
  return out;
}

// Suelos full-bleed: deberían ser 100% opacos (cualquier transparencia = agujero).
const SUELOS = new Set(['pasto', 'tierra', 'vereda', 'agua', 'plaza', 'arado', 'junco']);

// ---- Sheets de origen (para medir "embarrado" del original) ----
const SHEETS = [
  { mapa: 'mapa_recorte.json', sheet: path.join(RAW, 'kenney_tiny-town', 'Tilemap', 'tilemap_packed.png'), tile: 16, esp: 0, margen: 0 },
  { mapa: 'mapa_roguelike.json', sheet: path.join(RAW, 'kenney_roguelike-rpg-pack', 'Spritesheet', 'roguelikeSheet_transparent.png'), tile: 16, esp: 1, margen: 0 },
];

function leerMapa(p) {
  const full = path.join(ASSETS, p);
  if (!fs.existsSync(full)) return [];
  try { return (JSON.parse(fs.readFileSync(full, 'utf8')).celdas) || []; } catch (e) { return []; }
}

function medirEmbarradoOriginal() {
  // Devuelve { nombre: {lejos, opacos, frac} } para cada celda mapeada cuyo sheet exista.
  const res = {};
  for (const S of SHEETS) {
    if (!fs.existsSync(S.sheet)) continue;
    let img;
    try { img = R.decodePNG(fs.readFileSync(S.sheet)); } catch (e) { continue; }
    for (const c of leerMapa(S.mapa)) {
      const nombre = (c.nombre || '').trim(); if (!nombre) continue;
      const x0 = S.margen + (c.col | 0) * (S.tile + S.esp);
      const y0 = S.margen + (c.fila | 0) * (S.tile + S.esp);
      if (x0 + S.tile > img.width || y0 + S.tile > img.height) continue;
      let opacos = 0, lejos = 0;
      for (let y = 0; y < S.tile; y++) for (let x = 0; x < S.tile; x++) {
        const si = ((y0 + y) * img.width + (x0 + x)) * 4;
        if (img.data[si + 3] === 0) continue;
        opacos++;
        const { dE } = R.colorCercano(img.data[si], img.data[si + 1], img.data[si + 2], IDX, CACHE);
        if (dE > DE_LEJOS) lejos++;
      }
      res[nombre] = { lejos, opacos, frac: opacos ? lejos / opacos : 0 };
    }
  }
  return res;
}

function analizarPNG(ruta) {
  // Devuelve { w, h, opacos, transp, semi, fueraPaleta }
  const img = R.decodePNG(fs.readFileSync(ruta));
  let opacos = 0, transp = 0, semi = 0, fuera = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const a = img.data[i + 3];
    if (a === 0) { transp++; continue; }
    if (a < 255) semi++;
    opacos++;
    const key = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
    if (!PAL_SET.has(key)) fuera++;
  }
  return { w: img.width, h: img.height, opacos, transp, semi, fuera };
}

function main() {
  const tilesDir = path.join(ASSETS, 'tiles');
  const spritesDir = path.join(ASSETS, 'sprites');
  const tieneTile = (n) => fs.existsSync(path.join(tilesDir, n + '.png'));
  const tieneSprite = (n) => fs.existsSync(path.join(spritesDir, n + '.png'));

  const sprites = spriteNames();
  const conPNG = [], sinPNG = [];
  TILES.forEach((n) => (tieneTile(n) ? conPNG : sinPNG).push({ n, dir: 'tiles' }));
  sprites.forEach((n) => (tieneSprite(n) ? conPNG : sinPNG).push({ n, dir: 'sprites' }));

  const total = TILES.length + sprites.length;
  const pct = Math.round((conPNG.length / total) * 100);

  const embar = medirEmbarradoOriginal();
  const embarrados = [], semialpha = [], huecos = [], fuera = [];
  for (const { n, dir } of conPNG) {
    const ruta = path.join(ASSETS, dir, n + '.png');
    let a; try { a = analizarPNG(ruta); } catch (e) { continue; }
    const e = embar[n];
    if (e && e.opacos && e.frac >= FRAC_EMBARRADO) embarrados.push({ n, ...e });
    if (a.semi > 0) semialpha.push({ n, semi: a.semi });
    if (SUELOS.has(n) && a.transp > 0) huecos.push({ n, transp: a.transp });
    if (a.fuera > 0) fuera.push({ n, fuera: a.fuera });
  }
  embarrados.sort((x, y) => y.frac - x.frac);

  // ---- Notas de por qué cada faltante sigue procedural (criterio de esta pasada) ----
  const NOTA = {
    junco: 'Sin equivalente claro (no hay tile de juncos/totora en los packs).',
    arado: 'Hay tierra en el roguelike, pero se deja procedural por COHERENCIA con los cultivos (que son procedurales): el plot vacío y plantado deben matchear.',
    monumento: 'Probado statue del roguelike → panel adversarial 0/3 (lee como caja/pileta, sin figura). Candidato a dibujo a mano.',
    cultivo_0: 'No hay cultivos en etapas en los packs. Candidato a dibujo a mano (4 etapas).',
    cultivo_1: 'Idem cultivo_0 (etapa).',
    cultivo_2: 'Idem cultivo_0 (etapa).',
    cultivo_3: 'Idem cultivo_0 (etapa).',
    exclamacion: 'Símbolo "!" de UI: no hay en los packs. Procedural (o dibujo a mano).',
    check: 'Símbolo "✓" de UI: no hay en los packs. Procedural (o dibujo a mano).',
    brujula_flecha: 'UI 32×28 (tamaño especial, rota hacia la misión). Procedural; mapear arriesga escala.',
  };
  function notaDe(n) {
    if (NOTA[n]) return NOTA[n];
    if (n.indexOf('jugador') === 0 || n.indexOf('npc_') === 0) {
      return 'PERSONAJE: ningún pack en raw/ trae personajes con 4 direcciones + caminata. Falta un pack de personajes (ej. roguelikeChar / Tiny Characters). Candidato a dibujo a mano o pack nuevo.';
    }
    return 'Sin PNG asignado.';
  }

  // ---- Render del reporte ----
  const L = [];
  const stamp = process.env.STAMP || '(corré con STAMP="AAAA-MM-DD" para fechar)';
  L.push('# AUDITORÍA DE ARTE — qué necesita ojo humano');
  L.push('');
  L.push('> **Autogenerado por `node auditar_arte.js`.** No edites a mano: re-corré el script.');
  L.push('> Lista lo dudoso; NO arregla nada solo. Fecha de esta corrida: ' + stamp + '.');
  L.push('');
  L.push('## Cobertura');
  L.push('');
  L.push('- **' + conPNG.length + '/' + total + ' piezas con PNG (' + pct + '%).** El resto se dibuja por código (fallback procedural).');
  L.push('- Tiles con PNG: ' + TILES.filter(tieneTile).length + '/' + TILES.length + '. Sprites con PNG: ' + sprites.filter(tieneSprite).length + '/' + sprites.length + '.');
  L.push('- Paleta: ' + PAL.length + ' colores (DawnBringer 32). Umbral embarrado: ≥' + (FRAC_EMBARRADO * 100) + '% de píxeles a ΔE>' + DE_LEJOS + '.');
  L.push('');

  L.push('## 1. Fuera de paleta (chequeo de sanidad del pipeline)');
  L.push('');
  if (!fuera.length) {
    L.push('✅ Ningún PNG exportado tiene píxeles fuera de la paleta. El recoloreo es exacto.');
  } else {
    L.push('⚠️ PNG con píxeles que NO son color de paleta (revisar el pipeline):');
    fuera.forEach((f) => L.push('- `' + f.n + '` — ' + f.fuera + ' px fuera de paleta.'));
  }
  L.push('');

  L.push('## 2. Tiles embarrados (el original estaba lejos de la paleta)');
  L.push('');
  L.push('El recoloreo aproxima al color más cercano; si el original tenía muchos tonos lejanos a DB32, el resultado puede verse sucio. Revisar EN PANTALLA si convencen:');
  L.push('');
  if (!embarrados.length) {
    L.push('✅ Ningún tile mapeado quedó embarrado (todos los originales estaban cerca de la paleta).');
  } else {
    embarrados.forEach((e) => L.push('- `' + e.n + '` — ' + Math.round(e.frac * 100) + '% de píxeles lejos (' + e.lejos + '/' + e.opacos + '). 👀 revisar a mano.'));
  }
  L.push('');

  L.push('## 3. Transparencia');
  L.push('');
  L.push('**Semi-transparencia (0<alpha<255, riesgo de halo al escalar ×2):**');
  if (!semialpha.length) L.push('- ✅ Ninguno: todos los PNG son alpha duro (0 ó 255).');
  else semialpha.forEach((s) => L.push('- `' + s.n + '` — ' + s.semi + ' px semi-transparentes. 👀'));
  L.push('');
  L.push('**Suelos con agujeros (tiles de suelo que deberían ser 100% opacos):**');
  if (!huecos.length) L.push('- ✅ Ninguno: todos los suelos son full-bleed.');
  else huecos.forEach((h) => L.push('- `' + h.n + '` — ' + h.transp + ' px transparentes (¿agujero?). 👀'));
  L.push('');

  L.push('## 4. Sin PNG (procedural) — candidatos a dibujo a mano');
  L.push('');
  const sinTiles = sinPNG.filter((x) => x.dir === 'tiles');
  const sinSprites = sinPNG.filter((x) => x.dir === 'sprites');
  L.push('### Tiles (' + sinTiles.length + ')');
  sinTiles.forEach((x) => L.push('- `' + x.n + '` — ' + notaDe(x.n)));
  L.push('');
  L.push('### Sprites de personajes (' + sinSprites.length + ')');
  L.push('');
  L.push('Los 132 sprites (jugador + 10 NPCs × 4 dirs × 3 frames) siguen procedurales: **falta un pack de personajes** en `raw/` (los packs actuales son de entorno/UI). Es el 78% del inventario; bajar un pack de personajes es el mayor salto de cobertura posible.');
  L.push('');
  L.push('<details><summary>lista completa de sprites sin PNG</summary>');
  L.push('');
  sinSprites.forEach((x) => L.push('- `' + x.n + '`'));
  L.push('');
  L.push('</details>');
  L.push('');

  const out = L.join('\n');
  fs.writeFileSync(path.join(R.ASSETS, '..', 'AUDITORIA_ARTE.md'), out);
  console.log('AUDITORIA_ARTE.md generado.');
  console.log('Cobertura: ' + conPNG.length + '/' + total + ' (' + pct + '%).');
  console.log('Embarrados: ' + embarrados.length + ' | Semi-alpha: ' + semialpha.length + ' | Suelos c/agujero: ' + huecos.length + ' | Fuera de paleta: ' + fuera.length + '.');
}

if (require.main === module) main();
