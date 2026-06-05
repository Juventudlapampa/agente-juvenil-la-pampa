/* =====================================================================
 * mapa.js — Pueblos pampeanos (40x30 tiles)
 * ---------------------------------------------------------------------
 * Genera dos matrices paralelas para el pueblo ACTIVO:
 *   AJ.Mapa.tex[y][x]  -> clave de textura del tile
 *   AJ.Mapa.col[y][x]  -> true si el tile colisiona
 * y metadatos (puertas, carteles, puntos de NPC, granja, salidas).
 *
 * FASE D: soporta varios pueblos. `AJ.Mapa.cargar(id)` reconstruye EN EL
 * MISMO objeto AJ.Mapa (mutando tex/col/meta/SPAWN), así NINGÚN sistema
 * necesita cambiar referencias: cada escena lee AJ.Mapa fresco al crearse.
 * Pueblo 1 ("El pueblo") quedó idéntico a las fases previas.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Mapa = (function () {
  'use strict';

  const ANCHO = 40;
  const ALTO = 30;

  // Definición de tiles base: textura + si colisiona.
  const T = {
    PASTO:     { tex: 'pasto',     col: false },
    TIERRA:    { tex: 'tierra',    col: false },
    VEREDA:    { tex: 'vereda',    col: false },
    PLAZA:     { tex: 'plaza',     col: false },
    AGUA:      { tex: 'agua',      col: true  },
    JUNCO:     { tex: 'junco',     col: false },
    CALDEN:    { tex: 'calden',    col: true  },
    MONUMENTO: { tex: 'monumento', col: true  },
    ARADO:     { tex: 'arado',     col: false },
  };

  // Matrices de salida (se mutan in-place al cargar cada pueblo).
  const tex = [];
  const col = [];
  const meta = {
    puertas: {}, carteles: [], npcSpots: {}, granja: null,
    salidas: [], conNPCs: false, nombre: '',
  };
  const SPAWN = { x: 19, y: 19 };
  let actual = 1;

  function dentro(x, y) { return x >= 0 && y >= 0 && x < ANCHO && y < ALTO; }

  function poner(x, y, def) {
    if (!dentro(x, y)) return;
    tex[y][x] = def.tex;
    col[y][x] = def.col;
  }

  // Inicializa todo como pasto.
  function base() {
    for (let y = 0; y < ALTO; y++) {
      tex[y] = []; col[y] = [];
      for (let x = 0; x < ANCHO; x++) { tex[y][x] = T.PASTO.tex; col[y][x] = false; }
    }
  }

  // Borde de monte de caldenes (con algo de irregularidad determinística).
  function montePerimetro() {
    for (let x = 0; x < ANCHO; x++) {
      poner(x, 0, T.CALDEN); poner(x, ALTO - 1, T.CALDEN);
      if ((x * 7 + 3) % 5 === 0) { poner(x, 1, T.CALDEN); poner(x, ALTO - 2, T.CALDEN); }
    }
    for (let y = 0; y < ALTO; y++) {
      poner(0, y, T.CALDEN); poner(ANCHO - 1, y, T.CALDEN);
      if ((y * 11 + 2) % 5 === 0) { poner(1, y, T.CALDEN); poner(ANCHO - 2, y, T.CALDEN); }
    }
  }

  function rect(x0, y0, w, h, def) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) poner(x, y, def);
  }

  function calleH(y, x0, x1) {
    for (let x = x0; x <= x1; x++) {
      poner(x, y, T.TIERRA); poner(x, y + 1, T.TIERRA);
      poner(x, y - 1, T.VEREDA); poner(x, y + 2, T.VEREDA);
    }
  }
  function calleV(x, y0, y1) {
    for (let y = y0; y <= y1; y++) {
      poner(x, y, T.TIERRA); poner(x + 1, y, T.TIERRA);
      poner(x - 1, y, T.VEREDA); poner(x + 2, y, T.VEREDA);
    }
  }

  function edificio(nombre, prefijo, x0, y0, w, h, puertaDX, cartel) {
    for (let x = x0; x < x0 + w; x++) poner(x, y0, { tex: prefijo + '_techo', col: true });
    for (let y = y0 + 1; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const esVentana = (y === y0 + 1) && (x % 2 === 0) && x !== x0 + puertaDX;
        poner(x, y, { tex: prefijo + (esVentana ? '_ventana' : '_pared'), col: true });
      }
    }
    const px = x0 + puertaDX, py = y0 + h - 1;
    poner(px, py, { tex: prefijo + '_puerta', col: true });
    meta.puertas[nombre] = { x: px, y: py + 1 };
    meta.npcSpots[nombre] = { x: px, y: py + 1 };
    if (cartel) meta.carteles.push({ x: px, y: py + 1, texto: cartel });
  }

  function aguada(x0, y0, w, h) {
    rect(x0 - 1, y0 - 1, w + 2, h + 2, T.JUNCO);
    rect(x0, y0, w, h, T.AGUA);
  }

  function caldenesDecor(lista) {
    lista.forEach(([x, y]) => { if (tex[y] && tex[y][x] === T.PASTO.tex) poner(x, y, T.CALDEN); });
  }

  // --- PUEBLO 1: "El pueblo" (idéntico a fases previas) ----------------
  function construirPueblo1() {
    base();
    montePerimetro();

    calleH(9, 3, 36);
    calleH(20, 3, 36);
    calleV(12, 4, 25);
    calleV(26, 4, 25);

    rect(15, 12, 9, 7, T.PLAZA);
    poner(19, 15, T.MONUMENTO);
    meta.carteles.push({ x: 19, y: 16, texto: 'Monumento a los Pioneros' });

    edificio('iglesia', 'iglesia', 17, 4, 5, 5, 2, 'Iglesia del pueblo');
    edificio('muni', 'muni', 5, 12, 5, 5, 2, 'Municipalidad');
    edificio('juventud', 'juventud', 30, 12, 5, 5, 2, 'Casa de la Juventud');
    edificio('almacen', 'almacen', 16, 23, 5, 4, 2, 'Almacén "La Estancia"');

    edificio('casa1', 'casa', 5, 4, 4, 4, 1, null);
    edificio('casa2', 'casa', 31, 4, 4, 4, 1, null);
    edificio('casa3', 'casa', 30, 23, 4, 4, 1, null);
    edificio('casa4', 'casa', 6, 23, 4, 4, 1, null);

    aguada(3, 17, 5, 4);

    const gx = 23, gy = 23, gw = 5, gh = 4;
    rect(gx, gy, gw, gh, T.ARADO);
    meta.granja = { x: gx, y: gy, w: gw, h: gh };
    meta.carteles.push({ x: gx, y: gy - 1, texto: 'Huerta comunitaria' });

    caldenesDecor([[10, 6], [34, 8], [9, 27], [35, 26], [14, 10], [25, 10]]);

    // FASE D: salida al este hacia la Colonia.
    poner(37, 20, T.TIERRA);
    meta.salidas = [{ x: 37, y: 20, destino: 2, llegada: { x: 4, y: 15 } }];
    meta.carteles.push({ x: 37, y: 19, texto: '→ Colonia' });
    meta.conNPCs = true;
    meta.nombre = 'El pueblo';
    SPAWN.x = 19; SPAWN.y = 19;
  }

  // --- PUEBLO 2: "Colonia La Esperanza" (chacra, sin NPCs) -------------
  function construirPueblo2() {
    base();
    montePerimetro();

    // Camino principal de oeste a este.
    calleH(15, 1, 38);

    // Chacras (casas bajas).
    edificio('chacraA', 'casa', 8, 6, 4, 4, 1, null);
    edificio('chacraB', 'casa', 27, 20, 4, 4, 1, null);

    // Chacra/huerta grande (es una colonia agrícola).
    const gx = 20, gy = 7, gw = 6, gh = 5;
    rect(gx, gy, gw, gh, T.ARADO);
    meta.granja = { x: gx, y: gy, w: gw, h: gh };
    meta.carteles.push({ x: gx, y: gy - 1, texto: 'Chacra de la Colonia' });

    // Aguada del molino.
    aguada(7, 21, 5, 3);

    // Mucho monte de caldenes (para juntar leña).
    caldenesDecor([[5, 5], [12, 19], [30, 7], [33, 23], [16, 25], [9, 11],
      [24, 25], [31, 12], [6, 25], [14, 6], [34, 18], [25, 5]]);

    // Carteles de la colonia.
    meta.carteles.push({ x: 4, y: 13, texto: 'Colonia La Esperanza' });
    meta.carteles.push({ x: 2, y: 13, texto: '← Al pueblo' });

    // FASE D: salida al oeste de vuelta al pueblo.
    poner(2, 15, T.TIERRA);
    meta.salidas = [{ x: 2, y: 15, destino: 1, llegada: { x: 35, y: 20 } }];
    // C1.1: la Colonia tiene NPCs sólo si el flag npcsColonia está en true.
    meta.conNPCs = !!(window.AJ && AJ.CONFIG && AJ.CONFIG.npcsColonia);
    meta.nombre = 'Colonia La Esperanza';
    SPAWN.x = 4; SPAWN.y = 15;
  }

  function _reset() {
    meta.puertas = {}; meta.carteles = []; meta.npcSpots = {}; meta.granja = null;
    meta.salidas = []; meta.conNPCs = false; meta.nombre = '';
  }

  // Carga (reconstruye in-place) el pueblo `id`. Devuelve el id activo.
  function cargar(id) {
    _reset();
    if (id === 2) { construirPueblo2(); actual = 2; }
    else { construirPueblo1(); actual = 1; }
    return actual;
  }

  function esColision(tx, ty) {
    if (!dentro(tx, ty)) return true;
    return col[ty][tx] === true;
  }

  function salidaEn(tx, ty) {
    return (meta.salidas || []).find((s) => s.x === tx && s.y === ty) || null;
  }

  // Construir el pueblo 1 al cargar.
  cargar(1);

  return {
    ANCHO, ALTO, tex, col, meta, SPAWN, T,
    esColision, dentro, cargar, salidaEn,
    get actual() { return actual; },
  };
})();
