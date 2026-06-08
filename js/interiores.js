/* =====================================================================
 * interiores.js — INTERIORES de edificios (O2, CONFIG.mundoInteractivo)
 * ---------------------------------------------------------------------
 * Define plantillas REUSABLES de interior (oficina / local / casa / iglesia),
 * su arte procedural propio (16×16, no toca el inventario de art.js → la
 * cobertura de assets sigue en 170), y los NPCs/objetos de cada edificio.
 *
 * `construir(edificio, pueblo)` devuelve la sala lista para que la escena
 * EscenaInterior la renderice:
 *   { nombre, ancho, alto, tex[][], col[][], entrada, salida, suelo:Set,
 *     objetos:{ "x,y": {nombre, texto} }, npcs:[ {id,nombre,tex,x,y,dir,saludo} ] }
 *
 * BOLT-ON: si el flag está off, nada de esto se usa y el pueblo queda igual.
 * Contenido GENÉRICO/costumbrista, sin marcas reales (GDD §11).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Interiores = (function () {
  'use strict';

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.mundoInteractivo); }

  // Diccionario de tiles del interior: textura + si colisiona.
  // (Las texturas las genera generarArte() la primera vez en la escena.)
  const TILE = {
    piso_madera:  { tex: 'int_piso_madera',  col: false },
    piso_baldosa: { tex: 'int_piso_baldosa', col: false },
    pared:        { tex: 'int_pared',        col: true  },
    puerta:       { tex: 'int_puerta',       col: false }, // salida (felpudo)
    mesa:         { tex: 'int_mesa',         col: true  },
    silla:        { tex: 'int_silla',        col: false },
    mostrador:    { tex: 'int_mostrador',    col: true  },
    estanteria:   { tex: 'int_estanteria',   col: true  },
    cama:         { tex: 'int_cama',          col: true  },
    planta:       { tex: 'int_planta',       col: true  },
    radio:        { tex: 'int_radio',        col: true  },
    afiche:       { tex: 'int_afiche',       col: true  },
    alfombra:     { tex: 'int_alfombra',     col: false },
  };
  const SUELO = ['int_piso_madera', 'int_piso_baldosa', 'int_puerta', 'int_alfombra'];

  // --- Configuración por edificio (qué plantilla y qué le metemos adentro) --
  // muebles: [{x,y,t}] (t = clave de TILE). objetos: [{x,y,nombre,texto}].
  // npcs: [{id,nombre,tex,x,y,dir,saludo}]. Coordenadas en tiles del interior.
  const EDIF = {
    muni: {
      nombre: 'Municipalidad', piso: 'piso_baldosa', w: 13, h: 9,
      muebles: [
        { x: 3, y: 2, t: 'mesa' }, { x: 4, y: 2, t: 'mesa' }, { x: 3, y: 3, t: 'silla' },
        { x: 9, y: 2, t: 'estanteria' }, { x: 10, y: 2, t: 'estanteria' },
        { x: 6, y: 0, t: 'afiche' }, { x: 1, y: 4, t: 'planta' },
      ],
      objetos: [
        { x: 9, y: 2, nombre: 'Archivo municipal', texto: 'Expedientes, sellos y café frío. Acá duerme la mitad de los proyectos del pueblo.' },
        { x: 6, y: 0, nombre: 'Cartelera oficial', texto: '"Atención al vecino: lunes a viernes de 8 a 13." Y, abajo, un afiche de la Agencia medio tapado.' },
      ],
      npcs: [
        { id: 'int_muni_sec', nombre: 'Secretario Quiroga', tex: 'npc_cura', x: 4, y: 3, dir: 'abajo',
          saludo: ['La Intendenta está en una reunión, pero algo te destrabo.', 'Consejo de amigo: si la Agencia presenta todo por nota, sale el triple de rápido.'] },
      ],
    },
    juventud: {
      nombre: 'Casa de la Juventud', piso: 'piso_madera', w: 13, h: 9,
      muebles: [
        { x: 3, y: 2, t: 'mesa' }, { x: 4, y: 2, t: 'mesa' }, { x: 3, y: 3, t: 'silla' }, { x: 4, y: 3, t: 'silla' },
        { x: 10, y: 2, t: 'radio' }, { x: 6, y: 0, t: 'afiche' }, { x: 9, y: 0, t: 'afiche' },
        { x: 1, y: 5, t: 'planta' }, { x: 6, y: 5, t: 'alfombra' },
      ],
      objetos: [
        { x: 10, y: 2, nombre: 'Radio comunitaria', texto: 'Una consola medio destartalada pero al aire. Acá los pibes pasan música y avisan las actividades.' },
        { x: 6, y: 0, nombre: 'Mural de proyectos', texto: 'Fotos de la última jornada, un cronograma a mano y mil ideas pegadas con cinta. Esto está vivo.' },
      ],
      npcs: [
        { id: 'int_juv_pibe', nombre: 'Tomi (referente)', tex: 'npc_chacarero', x: 3, y: 4, dir: 'der',
          saludo: ['¡Llegó la Agencia! Tenemos mil ideas y cero presupuesto, como siempre.', 'Si conseguís el SUM para el finde, armamos un festival que se habla todo el año.'] },
        { id: 'int_juv_piba', nombre: 'Sofi (la del taller)', tex: 'npc_maestra', x: 9, y: 4, dir: 'izq',
          saludo: ['Vení que te muestro lo que estamos haciendo en el taller.', 'Lo importante es que los pibes sientan que el lugar es de ellos.'] },
      ],
    },
    almacen: {
      nombre: 'Almacén "La Estancia"', piso: 'piso_baldosa', w: 13, h: 9,
      muebles: [
        { x: 2, y: 2, t: 'estanteria' }, { x: 3, y: 2, t: 'estanteria' }, { x: 4, y: 2, t: 'estanteria' },
        { x: 8, y: 2, t: 'estanteria' }, { x: 9, y: 2, t: 'estanteria' },
        { x: 5, y: 5, t: 'mostrador' }, { x: 6, y: 5, t: 'mostrador' }, { x: 7, y: 5, t: 'mostrador' },
        { x: 11, y: 4, t: 'planta' },
      ],
      objetos: [
        { x: 3, y: 2, nombre: 'Estantería de ramos generales', texto: 'Yerba, clavos, fideos, pilas y un poco de todo. Si no está acá, no está en el pueblo.' },
        { x: 9, y: 2, nombre: 'Vitrina de fiambres', texto: 'Salame casero, queso de la zona y aceitunas. El olor te abre el apetito.' },
      ],
      npcs: [
        { id: 'int_alm_pedro', nombre: 'Don Pedro', tex: 'npc_almacenero', x: 6, y: 6, dir: 'arriba',
          saludo: ['Pasá, agente. ¿Te fío hasta la cosecha o pagás al contado?', 'Acá me entero de todo: si querés saber qué necesita el pueblo, preguntame a mí.'] },
      ],
    },
    iglesia: {
      nombre: 'Iglesia del pueblo', piso: 'piso_baldosa', w: 11, h: 9,
      muebles: [
        { x: 5, y: 1, t: 'mesa' }, // altar
        { x: 2, y: 3, t: 'silla' }, { x: 3, y: 3, t: 'silla' }, { x: 7, y: 3, t: 'silla' }, { x: 8, y: 3, t: 'silla' },
        { x: 2, y: 5, t: 'silla' }, { x: 3, y: 5, t: 'silla' }, { x: 7, y: 5, t: 'silla' }, { x: 8, y: 5, t: 'silla' },
        { x: 5, y: 7, t: 'alfombra' },
      ],
      objetos: [
        { x: 5, y: 1, nombre: 'Altar', texto: 'Velas, flores del jardín de alguna vecina y un silencio que invita a frenar un rato.' },
      ],
      npcs: [
        { id: 'int_igl_cura', nombre: 'El Padre Antonio', tex: 'npc_cura', x: 5, y: 2, dir: 'abajo',
          saludo: ['La campana suena para todos, hijo.', 'El salón parroquial está disponible para los chicos cuando lo necesiten.'] },
      ],
    },
    // Plantilla genérica de CASA (para casa1..4, chacras, ranchos).
    casa: {
      nombre: 'Casa', piso: 'piso_madera', w: 11, h: 8,
      muebles: [
        { x: 2, y: 2, t: 'cama' }, { x: 5, y: 3, t: 'mesa' }, { x: 5, y: 4, t: 'silla' },
        { x: 8, y: 2, t: 'estanteria' }, { x: 9, y: 5, t: 'planta' }, { x: 4, y: 6, t: 'alfombra' },
      ],
      objetos: [
        { x: 8, y: 2, nombre: 'Repisa familiar', texto: 'Fotos viejas, un trofeo de bochas y la radio que nunca se apaga. Una casa de pueblo, nomás.' },
        { x: 5, y: 3, nombre: 'Mesa de la cocina', texto: 'El mantel a cuadros, el mate listo y una silla siempre de más por si cae alguien.' },
      ],
      npcs: [
        { id: 'int_casa_vecino', nombre: 'Una vecina', tex: 'npc_abuela', x: 5, y: 5, dir: 'arriba',
          saludo: ['Pasá, agente, ¿unos mates? La pava recién hierve.', 'Qué bueno que la juventud tenga quien la represente, m\'hijo.'] },
      ],
    },
  };

  // Mapea un nombre de edificio del pueblo a su clave de plantilla en EDIF.
  function _claveEdif(edificio) {
    if (EDIF[edificio]) return edificio;
    const e = String(edificio || '');
    if (e.indexOf('casa') === 0 || e.indexOf('chacra') === 0 || e.indexOf('rancho') === 0) return 'casa';
    return 'casa'; // fallback seguro
  }

  // ¿Este edificio tiene interior? (Hoy: todos los que tengan puerta lo tendrán.)
  function tieneInterior(edificio) { return activo() && !!_claveEdif(edificio); }

  // Construye la sala (matrices + metadatos) para un edificio.
  function construir(edificio, pueblo) {
    const clave = _claveEdif(edificio);
    const cfg = EDIF[clave] || EDIF.casa;
    const w = cfg.w, h = cfg.h;
    const piso = cfg.piso || 'piso_madera';
    const tex = [], col = [];
    // Base: paredes en el borde, piso adentro.
    for (let y = 0; y < h; y++) {
      tex[y] = []; col[y] = [];
      for (let x = 0; x < w; x++) {
        const borde = (x === 0 || y === 0 || x === w - 1 || y === h - 1);
        const def = borde ? TILE.pared : TILE[piso];
        tex[y][x] = def.tex; col[y][x] = def.col;
      }
    }
    // Puerta de salida: centro de la pared de abajo (felpudo, no colisiona).
    const cx = Math.floor(w / 2);
    const sy = h - 1;
    tex[sy][cx] = TILE.puerta.tex; col[sy][cx] = false;
    const salida = { x: cx, y: sy };
    const entrada = { x: cx, y: h - 2 };

    // Muebles.
    (cfg.muebles || []).forEach((m) => {
      const d = TILE[m.t];
      if (!d || !_dentro(w, h, m.x, m.y)) return;
      tex[m.y][m.x] = d.tex; col[m.y][m.x] = d.col;
    });

    // Objetos interactivos (mapa "x,y" -> {nombre, texto}). Coexisten con el mueble.
    const objetos = {};
    (cfg.objetos || []).forEach((o) => { if (_dentro(w, h, o.x, o.y)) objetos[o.x + ',' + o.y] = { nombre: o.nombre, texto: o.texto }; });

    // NPCs (copia defensiva; no se modifican los defs).
    const npcs = (cfg.npcs || []).filter((n) => _dentro(w, h, n.x, n.y)).map((n) => ({
      id: n.id, nombre: n.nombre, tex: n.tex, x: n.x, y: n.y, dir: n.dir || 'abajo', saludo: n.saludo,
    }));

    return {
      nombre: cfg.nombre, ancho: w, alto: h, tex, col, entrada, salida,
      suelo: new Set(SUELO), objetos, npcs, edificio, pueblo, piso,
    };
  }

  function _dentro(w, h, x, y) { return x >= 0 && y >= 0 && x < w && y < h; }

  // --- Arte procedural de interiores (16×16, ×2 en pantalla). Idempotente. ---
  function generarArte(scene) {
    const tex = (key, fn) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      fn(g); g.generateTexture(key, 16, 16); g.destroy();
    };
    tex('int_piso_madera', (g) => {
      g.fillStyle(0xa9824a, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x8a6a38, 1); for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
      g.fillStyle(0xbb9258, 1); g.fillRect(0, 1, 16, 1);
    });
    tex('int_piso_baldosa', (g) => {
      g.fillStyle(0xcfcabd, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0xbdb8a8, 1); g.fillRect(8, 0, 8, 8); g.fillRect(0, 8, 8, 8);
      g.lineStyle(1, 0x9a9486, 1); g.strokeRect(0.5, 0.5, 15, 15);
    });
    tex('int_pared', (g) => {
      g.fillStyle(0x8a6a55, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x70543f, 1); g.fillRect(0, 11, 16, 5);   // zócalo
      g.fillStyle(0x9a7a63, 1); g.fillRect(0, 0, 16, 2);     // moldura superior
    });
    tex('int_puerta', (g) => {
      g.fillStyle(0xa9824a, 1); g.fillRect(0, 0, 16, 16);    // piso debajo del felpudo
      g.fillStyle(0x6e4f33, 1); g.fillRect(2, 4, 12, 9);     // felpudo
      g.fillStyle(0xcaa56a, 1); g.fillRect(2, 4, 12, 1);
      g.fillStyle(0xf3d9a0, 1); // flechita "salida" hacia abajo
      g.fillRect(7, 6, 2, 4); g.fillRect(5, 9, 6, 1); g.fillRect(6, 10, 4, 1); g.fillRect(7, 11, 2, 1);
    });
    tex('int_mesa', (g) => {
      g.fillStyle(0x6e4f33, 1); g.fillRect(1, 4, 14, 9);
      g.fillStyle(0x5b4029, 1); g.fillRect(1, 11, 14, 2);
      g.fillStyle(0x80603d, 1); g.fillRect(1, 4, 14, 2);
    });
    tex('int_silla', (g) => {
      g.fillStyle(0x000000, 0.12); g.fillEllipse(8, 14, 10, 3);
      g.fillStyle(0x7a5836, 1); g.fillRect(4, 7, 8, 6); g.fillRect(4, 3, 8, 3);
      g.fillStyle(0x60492d, 1); g.fillRect(4, 11, 8, 2);
    });
    tex('int_mostrador', (g) => {
      g.fillStyle(0x8a6a45, 1); g.fillRect(0, 3, 16, 12);
      g.fillStyle(0x6e5235, 1); g.fillRect(0, 3, 16, 2);
      g.fillStyle(0xb89868, 1); g.fillRect(0, 6, 16, 1);
    });
    tex('int_estanteria', (g) => {
      g.fillStyle(0x6e4f33, 1); g.fillRect(1, 0, 14, 16);
      g.fillStyle(0x3a2c1c, 1); for (let y = 2; y < 16; y += 5) g.fillRect(1, y, 14, 1);
      // productos/libros de colores
      const cols = [0xb84a4a, 0x4a8fc4, 0x4aa86a, 0xc4a24a];
      for (let y = 3; y < 14; y += 5) for (let x = 2; x < 14; x += 3) { g.fillStyle(cols[(x + y) % 4], 1); g.fillRect(x, y, 2, 3); }
    });
    tex('int_cama', (g) => {
      g.fillStyle(0x6e4f33, 1); g.fillRect(1, 1, 14, 14);     // marco
      g.fillStyle(0xcfd6e0, 1); g.fillRect(2, 5, 12, 9);      // sábana
      g.fillStyle(0xe8b88f, 1); g.fillRect(3, 2, 10, 4);      // almohada
      g.fillStyle(0x4a8fc4, 1); g.fillRect(2, 10, 12, 4);     // manta
    });
    tex('int_planta', (g) => {
      g.fillStyle(0x8a5a3a, 1); g.fillRect(5, 11, 6, 4);      // maceta
      g.fillStyle(0x4f8f3a, 1); g.fillCircle(8, 7, 5);
      g.fillStyle(0x66b84d, 1); g.fillCircle(6, 6, 2); g.fillCircle(10, 7, 2);
    });
    tex('int_radio', (g) => {
      g.fillStyle(0x33302c, 1); g.fillRect(2, 5, 12, 9);
      g.fillStyle(0x8fc7e0, 1); g.fillRect(3, 6, 6, 4);       // display
      g.fillStyle(0xd4af37, 1); g.fillCircle(12, 8, 1); g.fillCircle(12, 11, 1);
      g.fillStyle(0xb8b8b8, 1); g.fillRect(7, 2, 1, 4);       // antena
    });
    tex('int_afiche', (g) => {
      g.fillStyle(0x8a6a55, 1); g.fillRect(0, 0, 16, 16);     // sobre pared
      g.fillStyle(0xf4eede, 1); g.fillRect(3, 2, 10, 12);     // papel
      g.fillStyle(0xb84a4a, 1); g.fillRect(4, 3, 8, 3);
      g.fillStyle(0x4a8fc4, 1); g.fillRect(4, 8, 8, 1); g.fillRect(4, 10, 6, 1);
    });
    tex('int_alfombra', (g) => {
      g.fillStyle(0xa9824a, 1); g.fillRect(0, 0, 16, 16);     // piso debajo
      g.fillStyle(0x9a4a4a, 1); g.fillRect(1, 2, 14, 12);
      g.fillStyle(0xc46a5a, 1); g.fillRect(3, 4, 10, 8);
      g.lineStyle(1, 0xe0c060, 1); g.strokeRect(1.5, 2.5, 13, 11);
    });
  }

  return { activo, tieneInterior, construir, generarArte, TILE, SUELO, EDIF };
})();
