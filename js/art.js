/* =====================================================================
 * art.js — Generación de TODO el arte por código (cero descargas)
 * ---------------------------------------------------------------------
 * Usa Phaser.Graphics + generateTexture() para crear texturas en memoria.
 * Render NATIVO 16×16 (tiles) y 16×24 (personaje/NPCs), estilo GBA. Se
 * muestra escalado ×2 (nearest-neighbor, pixelArt:true) → 32×32 / 32×48 en
 * pantalla. La grilla/colisión/cámara siguen en 32 px de pantalla: sólo las
 * TEXTURAS son 16-nativas y cada objeto del mundo usa setDisplaySize al
 * dibujarse. Así un PNG real (Kenney 16×16 CC0) entra directo.
 *
 * CÓMO REEMPLAZAR POR PNG REALES: ver ARTE.md / assets/README.md. Las claves
 * de textura son las de acá; un PNG 16×16 (tile) o 16×24 (personaje) se levanta
 * solo vía assets/manifest.js y se escala ×2 igual que el procedural.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Art = (function () {
  'use strict';

  // Paleta costumbrista pampeana (tonos tierra, verde seco, cielo).
  const PAL = {
    pastoA: 0x7ba349, pastoB: 0x6b9540, pastoDetalle: 0x8cb858,
    tierraA: 0xc7a06a, tierraB: 0xbb9258, tierraDetalle: 0xa9824a,
    veredaA: 0xcfcabd, veredaB: 0xbdb8a8, veredaLinea: 0x9a9486,
    aguaA: 0x4a90c4, aguaB: 0x3d7fb0, aguaBrillo: 0x7bb8e0,
    caldenTronco: 0x6b4a2f, caldenHoja: 0x4f6b34, caldenHojaB: 0x5f7d3f,
    paredA: 0xd8c9a8, paredB: 0xc7b690, techoA: 0xa8453a, techoB: 0x933a30,
    puerta: 0x5b3a26, ventana: 0x8fc7e0, marco: 0x6b4a2f,
    plazaA: 0xd2c9b0, plazaB: 0xc2b89e,
    monumento: 0x8a8f99, monumentoBase: 0x6f747e,
    iglesiaPared: 0xe8e0d0, iglesiaTecho: 0x7a6a55,
    municipalidad: 0xcdb98f, casaJuventud: 0xd9b08a,
    almacenPared: 0xb8a878, almacenToldo: 0xb84a3a,
    // Personaje (Agente Juvenil): camisa celeste, pantalón marrón.
    piel: 0xe8b88f, pelo: 0x4a3525, camisa: 0x4a8fc4, camisaB: 0x3d7aa8,
    pantalon: 0x55504a, zapato: 0x33302c, gorra: 0x2f6aa0,
  };
  AJ.PAL = PAL;

  // Tamaños NATIVOS (se muestran ×2 en pantalla).
  const TW = 16, TH = 16;      // tile
  const PW = 16, PH = 24;      // personaje / NPC

  function darken(c, n) { return Phaser.Display.Color.IntegerToColor(c).darken(n).color; }
  function lighten(c, n) { return Phaser.Display.Color.IntegerToColor(c).lighten(n).color; }

  // Ruido pseudo-aleatorio determinístico (sin Math.random: arte idéntico siempre).
  function picotear(g, color, x, y, ancho, alto, cantidad, semilla) {
    let s = semilla || 7;
    g.fillStyle(color, 1);
    for (let i = 0; i < cantidad; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const px = x + (s % ancho);
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const py = y + (s % alto);
      g.fillRect(px, py, 1, 1);
    }
  }

  // Crea una textura de tile 16×16 con una función de dibujo.
  function tile(scene, clave, dibujar) {
    if (scene.textures.exists(clave)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    dibujar(g);
    g.generateTexture(clave, TW, TH);
    g.destroy();
  }

  // --- Tiles de terreno y edificios -----------------------------------

  function pasto(scene) {
    tile(scene, 'pasto', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.pastoB, 1);
      for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 2);
      picotear(g, PAL.pastoDetalle, 0, 0, 15, 15, 10, 11);
    });
  }

  function tierra(scene) {
    tile(scene, 'tierra', (g) => {
      g.fillStyle(PAL.tierraA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.tierraB, 1); g.fillRect(0, 3, 16, 2); g.fillRect(0, 10, 16, 2);
      picotear(g, PAL.tierraDetalle, 0, 0, 15, 15, 12, 23);
    });
  }

  function vereda(scene) {
    tile(scene, 'vereda', (g) => {
      g.fillStyle(PAL.veredaA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.veredaB, 1); g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
      g.lineStyle(1, PAL.veredaLinea, 1); g.strokeRect(0.5, 0.5, 15, 15);
      g.beginPath(); g.moveTo(8, 0); g.lineTo(8, 16); g.strokePath();
    });
  }

  function agua(scene) {
    tile(scene, 'agua', (g) => {
      g.fillStyle(PAL.aguaA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.aguaB, 1); g.fillRect(0, 2, 16, 2); g.fillRect(0, 9, 16, 2);
      g.fillStyle(PAL.aguaBrillo, 1); g.fillRect(2, 4, 4, 1); g.fillRect(9, 9, 4, 1); g.fillRect(5, 13, 3, 1);
    });
  }

  function calden(scene) {
    // Monte de caldén (árbol). Colisiona.
    tile(scene, 'calden', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.caldenTronco, 1); g.fillRect(7, 9, 2, 6);
      g.fillStyle(PAL.caldenHoja, 1); g.fillCircle(8, 7, 6);
      g.fillStyle(PAL.caldenHojaB, 1); g.fillCircle(6, 6, 3); g.fillCircle(11, 7, 3);
      picotear(g, 0x415a2b, 2, 1, 12, 9, 8, 31);
    });
  }

  function plaza(scene) {
    tile(scene, 'plaza', (g) => {
      g.fillStyle(PAL.plazaA, 1); g.fillRect(0, 0, 16, 16);
      g.lineStyle(1, PAL.plazaB, 1); g.strokeRect(0.5, 0.5, 15, 15);
      g.beginPath(); g.moveTo(0, 8); g.lineTo(16, 8); g.moveTo(8, 0); g.lineTo(8, 16); g.strokePath();
    });
  }

  // Genera un tile de edificio parametrizado (pared con ventana/puerta).
  function edificioTiles(scene, prefijo, colPared, colTecho) {
    tile(scene, prefijo + '_pared', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(darken(colPared, 12), 1); g.fillRect(0, 14, 16, 2);
    });
    tile(scene, prefijo + '_techo', (g) => {
      g.fillStyle(colTecho, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(darken(colTecho, 15), 1); for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 2, 16);
    });
    tile(scene, prefijo + '_ventana', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.marco, 1); g.fillRect(4, 4, 8, 8);
      g.fillStyle(PAL.ventana, 1); g.fillRect(5, 5, 6, 6);
      g.fillStyle(0xffffff, 0.4); g.fillRect(6, 5, 2, 5);
    });
    tile(scene, prefijo + '_puerta', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.marco, 1); g.fillRect(4, 2, 8, 14);
      g.fillStyle(PAL.puerta, 1); g.fillRect(5, 3, 6, 13);
      g.fillStyle(0xd4af37, 1); g.fillRect(9, 9, 1, 1);
    });
  }

  function monumento(scene) {
    // Monumento de plaza (busto sobre pedestal). Colisiona.
    tile(scene, 'monumento', (g) => {
      g.fillStyle(PAL.plazaA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(PAL.monumentoBase, 1); g.fillRect(4, 11, 8, 4);
      g.fillStyle(PAL.monumento, 1); g.fillRect(6, 4, 4, 8);
      g.fillStyle(lighten(PAL.monumento, 20), 1); g.fillCircle(8, 4, 2);
    });
  }

  function aguada(scene) {
    // Borde de aguada (junco/barro). Decorativo, no colisiona.
    tile(scene, 'junco', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x5a7a3a, 1);
      for (let x = 2; x < 15; x += 3) { g.fillRect(x, 7, 1, 7); g.fillRect(x + 1, 9, 1, 5); }
    });
  }

  // --- Tiles de granja (FASE 4) ---------------------------------------

  function granjaTiles(scene) {
    const aradoBase = (g) => {
      g.fillStyle(0x7a5a38, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x6a4c2e, 1);
      for (let y = 1; y < 16; y += 4) g.fillRect(0, y, 16, 1);
    };
    tile(scene, 'arado', (g) => { aradoBase(g); });
    // 4 etapas de cultivo (semilla -> maduro), sobre tierra arada
    const etapas = [
      (g) => { g.fillStyle(0x6a4c2e, 1); g.fillRect(7, 10, 1, 3); }, // semilla
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(7, 7, 1, 6); g.fillRect(5, 9, 3, 1); }, // brote
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(7, 4, 1, 9); g.fillStyle(0x66b84d, 1); g.fillCircle(7, 5, 2); }, // crece
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(7, 4, 1, 9); g.fillStyle(0xe0b53a, 1); g.fillCircle(7, 4, 3); g.fillCircle(5, 6, 1); g.fillCircle(10, 6, 1); }, // maduro
    ];
    etapas.forEach((dib, i) => {
      tile(scene, 'cultivo_' + i, (g) => { aradoBase(g); dib(g); });
    });
  }

  // --- Personaje: Agente Juvenil 16×24, 4 dir x 3 frames --------------

  // Dibuja al agente mirando una dirección con un frame de paso.
  // dir: 'abajo'|'arriba'|'izq'|'der'  paso: 0 (quieto) | 1 | 2
  function dibujarAgente(g, dir, paso) {
    g.clear();
    const cx = 8;
    // Sombra
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, 23, 11, 3);
    // Piernas (con leve desfase de caminata)
    const desf = paso === 1 ? 2 : paso === 2 ? -2 : 0;
    g.fillStyle(PAL.pantalon, 1);
    g.fillRect(cx - 3, 17, 3, 5); g.fillRect(cx, 17, 3, 5);
    g.fillStyle(PAL.zapato, 1);
    g.fillRect(cx - 3 - (desf > 0 ? desf : 0), 21, 3, 2);
    g.fillRect(cx + (desf < 0 ? -desf : 0), 21, 3, 2);
    // Cuerpo / camisa
    g.fillStyle(PAL.camisa, 1); g.fillRect(cx - 4, 11, 8, 7);
    g.fillStyle(PAL.camisaB, 1); g.fillRect(cx - 4, 16, 8, 2);
    // Brazos
    g.fillStyle(PAL.piel, 1); g.fillRect(cx - 5, 12, 1, 5); g.fillRect(cx + 4, 12, 1, 5);
    // Cabeza
    g.fillStyle(PAL.piel, 1); g.fillRect(cx - 3, 4, 6, 7);
    // Gorra de agente
    g.fillStyle(PAL.gorra, 1); g.fillRect(cx - 4, 3, 8, 3);
    g.fillStyle(darken(PAL.gorra, 15), 1); g.fillRect(cx - 4, 5, 8, 1);
    // Rasgos según dirección
    g.fillStyle(0x2a2018, 1);
    if (dir === 'abajo') {
      g.fillRect(cx - 2, 7, 1, 1); g.fillRect(cx + 1, 7, 1, 1);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 3, 6, 1, 2); g.fillRect(cx + 2, 6, 1, 2);
    } else if (dir === 'arriba') {
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 3, 6, 6, 3);
    } else if (dir === 'izq') {
      g.fillRect(cx - 2, 7, 1, 1);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx + 2, 6, 1, 3);
    } else if (dir === 'der') {
      g.fillRect(cx + 1, 7, 1, 1);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 3, 6, 1, 3);
    }
  }

  function personaje(scene) {
    const dirs = ['abajo', 'arriba', 'izq', 'der'];
    // F1: si hay creador de agente, recolorear con la variante elegida. La
    // variante 0 usa los mismos colores que siempre -> sprite idéntico.
    let usar = null;
    if (AJ.CONFIG && AJ.CONFIG.creadorAgente && AJ.Agente && AJ.Agente.colores) {
      try { usar = AJ.Agente.colores(); } catch (e) { usar = null; }
    }
    const camOld = PAL.camisa, camBOld = PAL.camisaB, gorraOld = PAL.gorra;
    if (usar) { PAL.camisa = usar.camisa; PAL.camisaB = usar.camisaB; PAL.gorra = usar.gorra; }
    dirs.forEach((dir) => {
      for (let paso = 0; paso < 3; paso++) {
        const clave = 'jugador_' + dir + '_' + paso;
        if (scene.textures.exists(clave)) continue;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        dibujarAgente(g, dir, paso);
        g.generateTexture(clave, PW, PH);
        g.destroy();
      }
    });
    PAL.camisa = camOld; PAL.camisaB = camBOld; PAL.gorra = gorraOld;
  }

  // --- NPCs: variaciones simples de color sobre la base del agente -----

  function npc(scene, clave, colCamisa, colPelo) {
    const dirs = ['abajo', 'arriba', 'izq', 'der'];
    const camOld = PAL.camisa, camBOld = PAL.camisaB, peloOld = PAL.pelo, gorraOld = PAL.gorra;
    PAL.camisa = colCamisa;
    PAL.camisaB = Phaser.Display.Color.IntegerToColor(colCamisa).darken(15).color;
    PAL.pelo = colPelo;
    PAL.gorra = colPelo; // los NPC no usan gorra de agente; usan pelo
    dirs.forEach((dir) => {
      for (let paso = 0; paso < 3; paso++) {
        const k = clave + '_' + dir + '_' + paso;
        if (scene.textures.exists(k)) continue;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        dibujarAgente(g, dir, paso);
        g.generateTexture(k, PW, PH);
        g.destroy();
      }
    });
    PAL.camisa = camOld; PAL.camisaB = camBOld; PAL.pelo = peloOld; PAL.gorra = gorraOld;
  }

  // --- Iconos de UI ----------------------------------------------------

  function iconos(scene) {
    tile(scene, 'moneda', (g) => {
      g.fillStyle(0xd4af37, 1); g.fillCircle(8, 8, 6);
      g.fillStyle(0xf0d060, 1); g.fillCircle(8, 8, 4);
      g.fillStyle(0xb8941f, 1); g.fillRect(7, 4, 2, 8);
    });
    tile(scene, 'exclamacion', (g) => {
      g.fillStyle(0xf5d020, 1); g.fillCircle(8, 8, 6);
      g.fillStyle(0x3a2c10, 1); g.fillRect(7, 3, 2, 6); g.fillRect(7, 11, 2, 2);
    });
    tile(scene, 'check', (g) => {
      g.fillStyle(0x4caf50, 1); g.fillCircle(8, 8, 6);
      g.lineStyle(2, 0xffffff, 1);
      g.beginPath(); g.moveTo(5, 8); g.lineTo(7, 11); g.lineTo(12, 5); g.strokePath();
    });
  }

  // --- F2: Capa de arte (PNG de /assets con fallback procedural) -------
  //
  // preparar(scene) es el punto de entrada (lo llama Pueblo.preload):
  //   - Sin CONFIG.capaArte (o manifiesto vacío): genera todo procedural
  //     (16-nativo), sincrónico, idéntico a siempre.
  //   - Con capaArte y PNGs listados en AJ.ASSET_MANIFEST: encola la carga de
  //     esos PNG (esperados 16×16 tile / 16×24 personaje); al terminar,
  //     generarTodo() rellena procedural lo que falte. PNG faltante (404) -> procedural.
  function preparar(scene) {
    const usarCapa = !!(AJ.CONFIG && AJ.CONFIG.capaArte);
    const man = (window.AJ && AJ.ASSET_MANIFEST) || { tiles: [], sprites: [] };
    const tiles = man.tiles || [], sprites = man.sprites || [];
    if (!usarCapa || (tiles.length === 0 && sprites.length === 0)) {
      generarTodo(scene); // camino clásico, idéntico
      return;
    }
    try {
      tiles.forEach((k) => { if (!scene.textures.exists(k)) scene.load.image(k, 'assets/tiles/' + k + '.png'); });
      sprites.forEach((k) => { if (!scene.textures.exists(k)) scene.load.image(k, 'assets/sprites/' + k + '.png'); });
      scene.load.on('loaderror', function () {});
      scene.load.once('complete', function () {
        try { generarTodo(scene); } catch (e) { console.warn('[Art] generarTodo (capa)', e); }
      });
    } catch (e) {
      console.warn('[Art] capa de arte falló; uso procedural', e);
      generarTodo(scene);
    }
  }

  // --- Genera TODO lo procedural (saltea claves ya cargadas como PNG) --

  function generarTodo(scene) {
    pasto(scene); tierra(scene); vereda(scene); agua(scene);
    calden(scene); plaza(scene); monumento(scene); aguada(scene);
    edificioTiles(scene, 'casa', PAL.paredA, PAL.techoA);
    edificioTiles(scene, 'iglesia', PAL.iglesiaPared, PAL.iglesiaTecho);
    edificioTiles(scene, 'muni', PAL.municipalidad, PAL.techoB);
    edificioTiles(scene, 'juventud', PAL.casaJuventud, PAL.techoA);
    edificioTiles(scene, 'almacen', PAL.almacenPared, PAL.almacenToldo);
    granjaTiles(scene);
    personaje(scene);
    // NPCs con paletas distintas
    npc(scene, 'npc_intendenta', 0xb84a8f, 0x5a3a28);
    npc(scene, 'npc_cura', 0x3a3a3a, 0x888888);
    npc(scene, 'npc_almacenero', 0x8f7a3a, 0x4a3525);
    npc(scene, 'npc_maestra', 0x4aa86a, 0x6a4a30);
    npc(scene, 'npc_abuela', 0x9a6aa8, 0xcccccc);
    npc(scene, 'npc_chacarero', 0xa85a3a, 0x3a2a1a);
    // C1.1: NPCs propios de la Colonia (texturas nuevas, no tocan las de arriba).
    npc(scene, 'npc_puestero', 0x6a8a4a, 0x4a3525);
    npc(scene, 'npc_pulpero', 0xc4b86a, 0x888888);
    npc(scene, 'npc_maestrarural', 0x4a7ab8, 0x5a3a28);
    npc(scene, 'npc_partera', 0xb86a8f, 0xdddddd);
    iconos(scene);
  }

  return { preparar, generarTodo, dibujarAgente, PAL, TW: TW, TH: TH, PW: PW, PH: PH };
})();
