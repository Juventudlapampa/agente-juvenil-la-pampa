/* =====================================================================
 * mapa.js — El pueblo pampeano (40x30 tiles)
 * ---------------------------------------------------------------------
 * Genera dos matrices paralelas:
 *   AJ.Mapa.tex[y][x]  -> clave de textura del tile
 *   AJ.Mapa.col[y][x]  -> true si el tile colisiona
 * y metadatos de landmarks (puertas, carteles, puntos de NPC).
 *
 * El pueblo es ficticio pero reconociblemente pampeano: plaza con
 * monumento, iglesia, Municipalidad, Casa de la Juventud, almacén de
 * ramos generales, casas bajas, calles de tierra y vereda, monte de
 * caldenes en los bordes y una aguada con agua.
 *
 * Se construye por código (stamps) en vez de a mano: es una matriz igual
 * pero mucho menos propensa a errores de tipeo. Ver DECISIONES.md.
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

  // Matrices de salida.
  const tex = [];
  const col = [];
  const meta = {
    puertas: {},   // nombre -> {x, y} (en tiles) entrada del edificio
    carteles: [],  // {x, y, texto}
    npcSpots: {},  // nombre -> {x, y}
    granja: null,  // {x, y, w, h} parcela cultivable
  };

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

  // Pinta un rectángulo de un tile.
  function rect(x0, y0, w, h, def) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) poner(x, y, def);
  }

  // Calle de tierra con veredas a ambos lados (horizontal o vertical).
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

  // Estampa un edificio: paredes (colisión), techo arriba, una puerta.
  // nombre se usa para registrar la puerta y el punto de NPC al frente.
  function edificio(nombre, prefijo, x0, y0, w, h, puertaDX, cartel) {
    // Techo (fila superior y la de abajo del techo)
    for (let x = x0; x < x0 + w; x++) {
      poner(x, y0, { tex: prefijo + '_techo', col: true });
    }
    // Paredes
    for (let y = y0 + 1; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        // ventanas en filas intermedias
        const esVentana = (y === y0 + 1) && (x % 2 === 0) && x !== x0 + puertaDX;
        poner(x, y, { tex: prefijo + (esVentana ? '_ventana' : '_pared'), col: true });
      }
    }
    // Puerta en la última fila (planta baja), no colisiona (entrada).
    const px = x0 + puertaDX, py = y0 + h - 1;
    poner(px, py, { tex: prefijo + '_puerta', col: true }); // colisiona como pared
    // Punto frente a la puerta (donde se ubica el NPC / se interactúa)
    meta.puertas[nombre] = { x: px, y: py + 1 };
    meta.npcSpots[nombre] = { x: px, y: py + 1 };
    if (cartel) meta.carteles.push({ x: px, y: py + 1, texto: cartel });
  }

  // Aguada (laguna chica) con borde de juncos.
  function aguada(x0, y0, w, h) {
    rect(x0 - 1, y0 - 1, w + 2, h + 2, T.JUNCO);
    rect(x0, y0, w, h, T.AGUA);
  }

  // --- Construcción del pueblo ----------------------------------------

  function construir() {
    base();
    montePerimetro();

    // Red de calles alrededor de la plaza central.
    calleH(9, 3, 36);    // avenida norte
    calleH(20, 3, 36);   // avenida sur
    calleV(12, 4, 25);   // calle oeste
    calleV(26, 4, 25);   // calle este

    // Plaza central (rodeada por las calles).
    rect(15, 12, 9, 7, T.PLAZA);
    // Monumento al centro de la plaza.
    poner(19, 15, T.MONUMENTO);
    meta.carteles.push({ x: 19, y: 16, texto: 'Monumento a los Pioneros' });

    // Iglesia (al norte de la plaza).
    edificio('iglesia', 'iglesia', 17, 4, 5, 5, 2, 'Iglesia del pueblo');
    // Municipalidad (al oeste).
    edificio('muni', 'muni', 5, 12, 5, 5, 2, 'Municipalidad');
    // Casa de la Juventud (al este).
    edificio('juventud', 'juventud', 30, 12, 5, 5, 2, 'Casa de la Juventud');
    // Almacén de ramos generales (al sur).
    edificio('almacen', 'almacen', 16, 23, 5, 4, 2, 'Almacén "La Estancia"');

    // Casas bajas dispersas.
    edificio('casa1', 'casa', 5, 4, 4, 4, 1, null);
    edificio('casa2', 'casa', 31, 4, 4, 4, 1, null);
    edificio('casa3', 'casa', 30, 23, 4, 4, 1, null);
    edificio('casa4', 'casa', 6, 23, 4, 4, 1, null);

    // Aguada en zona libre (entre municipalidad y almacén, abajo-izq).
    aguada(3, 17, 5, 4);

    // Parcela de granja (FASE 4): tierra arada al sureste, junto a casa3.
    const gx = 23, gy = 23, gw = 5, gh = 4;
    rect(gx, gy, gw, gh, T.ARADO);
    meta.granja = { x: gx, y: gy, w: gw, h: gh };
    meta.carteles.push({ x: gx, y: gy - 1, texto: 'Huerta comunitaria' });

    // Algunos caldenes decorativos dentro del pueblo (no en calles).
    [[10, 6], [34, 8], [9, 27], [35, 26], [14, 10], [25, 10]].forEach(([x, y]) => {
      if (tex[y] && tex[y][x] === T.PASTO.tex) poner(x, y, T.CALDEN);
    });
  }

  // Punto de aparición del jugador (vereda de la plaza, abajo).
  const SPAWN = { x: 19, y: 19 };

  function esColision(tx, ty) {
    if (!dentro(tx, ty)) return true; // fuera del mapa = pared
    return col[ty][tx] === true;
  }

  // Construir al cargar.
  construir();

  return { ANCHO, ALTO, tex, col, meta, SPAWN, T, esColision, dentro };
})();
