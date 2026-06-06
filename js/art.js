/* =====================================================================
 * art.js — Generación de TODO el arte por código (cero descargas)
 * ---------------------------------------------------------------------
 * Usa Phaser.Graphics + generateTexture() para crear texturas en memoria.
 * Tiles 32x32, personaje 32x48, paleta tipo 16 bits y costumbrista.
 *
 * CÓMO REEMPLAZAR POR PNG REALES MÁS ADELANTE:
 *   1. Poné los PNG en /assets (tile 32x32, sprite-sheet del personaje).
 *   2. En la escena Pueblo, en preload(), cargá:
 *        this.load.image('pasto', 'assets/pasto.png');
 *        this.load.spritesheet('jugador', 'assets/jugador.png',
 *            { frameWidth: 32, frameHeight: 48 });
 *   3. Borrá (o salteá) la llamada a AJ.Art.generarTodo() para esa clave.
 *      Las claves de textura son las mismas que se usan acá, así que el
 *      resto del juego sigue funcionando sin tocar nada.
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

  // Ruido pseudo-aleatorio determinístico (sin Math.random para que el
  // arte sea idéntico en cada carga).
  function picotear(g, color, x, y, ancho, alto, cantidad, semilla) {
    let s = semilla || 7;
    g.fillStyle(color, 1);
    for (let i = 0; i < cantidad; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const px = x + (s % ancho);
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const py = y + (s % alto);
      g.fillRect(px, py, 2, 2);
    }
  }

  // Crea una textura de tile 32x32 con una función de dibujo.
  function tile(scene, clave, dibujar) {
    if (scene.textures.exists(clave)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    dibujar(g);
    g.generateTexture(clave, 32, 32);
    g.destroy();
  }

  // --- Tiles de terreno y edificios -----------------------------------

  function pasto(scene) {
    tile(scene, 'pasto', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.pastoB, 1);
      for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 4);
      picotear(g, PAL.pastoDetalle, 0, 0, 30, 30, 18, 11);
    });
  }

  function tierra(scene) {
    tile(scene, 'tierra', (g) => {
      g.fillStyle(PAL.tierraA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.tierraB, 1);
      g.fillRect(0, 6, 32, 3); g.fillRect(0, 20, 32, 3);
      picotear(g, PAL.tierraDetalle, 0, 0, 30, 30, 22, 23);
    });
  }

  function vereda(scene) {
    tile(scene, 'vereda', (g) => {
      g.fillStyle(PAL.veredaA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.veredaB, 1); g.fillRect(0, 0, 32, 2); g.fillRect(0, 0, 2, 32);
      g.lineStyle(1, PAL.veredaLinea, 1);
      g.strokeRect(0.5, 0.5, 31, 31);
      g.beginPath(); g.moveTo(16, 0); g.lineTo(16, 32); g.strokePath();
    });
  }

  function agua(scene) {
    tile(scene, 'agua', (g) => {
      g.fillStyle(PAL.aguaA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.aguaB, 1);
      for (let y = 4; y < 32; y += 10) g.fillRect(0, y, 32, 4);
      g.fillStyle(PAL.aguaBrillo, 1);
      g.fillRect(5, 7, 8, 2); g.fillRect(18, 18, 9, 2); g.fillRect(10, 25, 6, 2);
    });
  }

  function calden(scene) {
    // Monte de caldén (árbol). Colisiona.
    tile(scene, 'calden', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.caldenTronco, 1); g.fillRect(14, 18, 5, 12);
      g.fillStyle(PAL.caldenHoja, 1); g.fillCircle(16, 13, 13);
      g.fillStyle(PAL.caldenHojaB, 1); g.fillCircle(12, 11, 7); g.fillCircle(21, 14, 6);
      picotear(g, 0x415a2b, 4, 2, 24, 18, 14, 31);
    });
  }

  function plaza(scene) {
    tile(scene, 'plaza', (g) => {
      g.fillStyle(PAL.plazaA, 1); g.fillRect(0, 0, 32, 32);
      g.lineStyle(1, PAL.plazaB, 1);
      g.strokeRect(0.5, 0.5, 31, 31);
      g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 16);
      g.moveTo(16, 0); g.lineTo(16, 32); g.strokePath();
    });
  }

  // Genera un tile de edificio parametrizado (pared con ventana/puerta).
  function edificioTiles(scene, prefijo, colPared, colTecho) {
    // pared
    tile(scene, prefijo + '_pared', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(Phaser.Display.Color.IntegerToColor(colPared).darken(12).color, 1);
      g.fillRect(0, 28, 32, 4);
    });
    // techo
    tile(scene, prefijo + '_techo', (g) => {
      g.fillStyle(colTecho, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(Phaser.Display.Color.IntegerToColor(colTecho).darken(15).color, 1);
      for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 4, 32);
    });
    // ventana
    tile(scene, prefijo + '_ventana', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.marco, 1); g.fillRect(8, 8, 16, 16);
      g.fillStyle(PAL.ventana, 1); g.fillRect(10, 10, 12, 12);
      g.fillStyle(0xffffff, 0.4); g.fillRect(11, 11, 4, 11);
    });
    // puerta
    tile(scene, prefijo + '_puerta', (g) => {
      g.fillStyle(colPared, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.marco, 1); g.fillRect(8, 4, 16, 28);
      g.fillStyle(PAL.puerta, 1); g.fillRect(10, 6, 12, 26);
      g.fillStyle(0xd4af37, 1); g.fillRect(19, 18, 2, 2);
    });
  }

  function monumento(scene) {
    // Monumento de plaza (busto sobre pedestal). Colisiona.
    tile(scene, 'monumento', (g) => {
      g.fillStyle(PAL.plazaA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(PAL.monumentoBase, 1); g.fillRect(8, 22, 16, 8);
      g.fillStyle(PAL.monumento, 1); g.fillRect(12, 8, 8, 16);
      g.fillStyle(Phaser.Display.Color.IntegerToColor(PAL.monumento).lighten(20).color, 1);
      g.fillCircle(16, 8, 5);
    });
  }

  function aguada(scene) {
    // Borde de aguada (junco/barro). Decorativo, no colisiona.
    tile(scene, 'junco', (g) => {
      g.fillStyle(PAL.pastoA, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x5a7a3a, 1);
      for (let x = 4; x < 30; x += 6) {
        g.fillRect(x, 14, 2, 14);
        g.fillRect(x + 2, 18, 2, 10);
      }
    });
  }

  // --- Tiles de granja (FASE 4) ---------------------------------------

  function granjaTiles(scene) {
    // Tierra arada
    tile(scene, 'arado', (g) => {
      g.fillStyle(0x7a5a38, 1); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x6a4c2e, 1);
      for (let y = 2; y < 32; y += 7) g.fillRect(0, y, 32, 3);
    });
    // 4 etapas de cultivo (brote -> maduro), sobre tierra arada
    const etapas = [
      (g) => { g.fillStyle(0x6a4c2e, 1); g.fillRect(13, 18, 3, 6); }, // semilla
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(14, 14, 3, 12); g.fillRect(10, 18, 5, 2); }, // brote
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(14, 8, 3, 18); g.fillStyle(0x66b84d,1); g.fillCircle(15,10,5); }, // crece
      (g) => { g.fillStyle(0x4f8f3a, 1); g.fillRect(14, 8, 3, 18); g.fillStyle(0xe0b53a,1); g.fillCircle(15,9,6); g.fillCircle(11,13,3); g.fillCircle(20,13,3);}, // maduro
    ];
    etapas.forEach((dib, i) => {
      tile(scene, 'cultivo_' + i, (g) => {
        g.fillStyle(0x7a5a38, 1); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x6a4c2e, 1);
        for (let y = 2; y < 32; y += 7) g.fillRect(0, y, 32, 3);
        dib(g);
      });
    });
  }

  // --- Personaje: Agente Juvenil 32x48, 4 dir x 3 frames ---------------

  // Dibuja al agente mirando una dirección con un frame de paso.
  // dir: 'abajo'|'arriba'|'izq'|'der'  paso: 0 (quieto) | 1 | 2
  function dibujarAgente(g, dir, paso) {
    g.clear();
    const cx = 16;
    // Sombra
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, 46, 22, 6);

    // Piernas (con leve desfase según paso para caminata)
    const desf = paso === 1 ? 3 : paso === 2 ? -3 : 0;
    g.fillStyle(PAL.pantalon, 1);
    g.fillRect(cx - 7, 34, 6, 9 + (paso === 1 ? 0 : 0));
    g.fillRect(cx + 1, 34, 6, 9);
    g.fillStyle(PAL.zapato, 1);
    g.fillRect(cx - 7 - (desf > 0 ? desf : 0), 42, 7, 4);
    g.fillRect(cx + 1 + (desf < 0 ? -desf : 0), 42, 7, 4);

    // Cuerpo / camisa
    g.fillStyle(PAL.camisa, 1); g.fillRect(cx - 8, 22, 16, 14);
    g.fillStyle(PAL.camisaB, 1); g.fillRect(cx - 8, 32, 16, 4);

    // Brazos
    g.fillStyle(PAL.piel, 1);
    g.fillRect(cx - 10, 23, 3, 10);
    g.fillRect(cx + 7, 23, 3, 10);

    // Cabeza
    g.fillStyle(PAL.piel, 1); g.fillRect(cx - 6, 8, 12, 13);
    // Gorra de agente
    g.fillStyle(PAL.gorra, 1); g.fillRect(cx - 7, 6, 14, 5);
    g.fillStyle(Phaser.Display.Color.IntegerToColor(PAL.gorra).darken(15).color, 1);
    g.fillRect(cx - 7, 10, 14, 2);

    // Rasgos según dirección
    g.fillStyle(0x2a2018, 1);
    if (dir === 'abajo') {
      g.fillRect(cx - 4, 13, 2, 2); g.fillRect(cx + 2, 13, 2, 2);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 6, 11, 2, 4); g.fillRect(cx + 4, 11, 2, 4);
    } else if (dir === 'arriba') {
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 6, 11, 12, 6);
    } else if (dir === 'izq') {
      g.fillRect(cx - 4, 13, 2, 2);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx + 3, 11, 3, 5);
    } else if (dir === 'der') {
      g.fillRect(cx + 2, 13, 2, 2);
      g.fillStyle(PAL.pelo, 1); g.fillRect(cx - 6, 11, 3, 5);
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
        g.generateTexture(clave, 32, 48);
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
        // Tapar la gorra para que parezca pelo (redibujo simple).
        g.generateTexture(k, 32, 48);
        g.destroy();
      }
    });
    PAL.camisa = camOld; PAL.camisaB = camBOld; PAL.pelo = peloOld; PAL.gorra = gorraOld;
  }

  // --- Iconos de UI ----------------------------------------------------

  function iconos(scene) {
    tile(scene, 'moneda', (g) => {
      g.fillStyle(0xd4af37, 1); g.fillCircle(16, 16, 12);
      g.fillStyle(0xf0d060, 1); g.fillCircle(16, 16, 8);
      g.fillStyle(0xb8941f, 1); g.fillRect(14, 9, 4, 14);
    });
    tile(scene, 'exclamacion', (g) => {
      g.fillStyle(0xf5d020, 1); g.fillCircle(16, 16, 11);
      g.fillStyle(0x3a2c10, 1); g.fillRect(14, 7, 4, 11); g.fillRect(14, 21, 4, 4);
    });
    tile(scene, 'check', (g) => {
      g.fillStyle(0x4caf50, 1); g.fillCircle(16, 16, 11);
      g.lineStyle(3, 0xffffff, 1);
      g.beginPath(); g.moveTo(10, 16); g.lineTo(14, 21); g.lineTo(23, 10); g.strokePath();
    });
  }

  // --- F2: Capa de arte (PNG de /assets con fallback procedural) -------
  //
  // preparar(scene) es el NUEVO punto de entrada (lo llama Pueblo.preload):
  //   - Sin CONFIG.capaArte (o manifiesto vacío): genera todo procedural,
  //     sincrónico, EXACTAMENTE como siempre. Cero cambios.
  //   - Con capaArte y PNGs listados en AJ.ASSET_MANIFEST: encola la carga de
  //     esos PNG; cuando termina, generarTodo() rellena procedural lo que falte
  //     (cada generador saltea las claves que ya existen). Si un PNG listado
  //     falla (404), se ignora y cae a procedural.
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
      // PNG faltante -> se ignora; el procedural lo cubre.
      scene.load.on('loaderror', function () {});
      // Cuando termina la carga, rellenar lo que falte con el generador.
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

  return { preparar, generarTodo, dibujarAgente, PAL };
})();
