/* =====================================================================
 * npc.js — Vecinos del pueblo (FASE 2)
 * ---------------------------------------------------------------------
 * Cada NPC ocupa un tile (colisiona), tiene nombre, textura y líneas de
 * ambiente. El NPCManager los crea en los puntos frente a cada edificio
 * (AJ.Mapa.meta.npcSpots) y resuelve la interacción "tile de enfrente".
 *
 * Diseñado para bolt-on futuro: agregar `rutina`/`amistad` no rompe esto
 * (ver ROADMAP.md).
 * ===================================================================== */

window.AJ = window.AJ || {};

/* ROSTER maestro: lista de TODOS los vecinos (id, nombre, pueblo) para el
 * Registro del Agente (D3), que necesita saber el total aunque no estés en ese
 * pueblo. Los de D1 se suman sólo si CONFIG.poblarMundo. Mantener alineado con
 * los defs de abajo (un smoke-check verifica que no haya NPCs sin roster). */
AJ.ROSTER_BASE = [
  { id: 'intendenta', nombre: 'Intendenta Beba', pueblo: 1 },
  { id: 'maestra', nombre: 'La Maestra Rosa', pueblo: 1 },
  { id: 'almacenero', nombre: 'Don Pedro', pueblo: 1 },
  { id: 'cura', nombre: 'El Padre Antonio', pueblo: 1 },
  { id: 'abuela', nombre: 'Doña Elsa', pueblo: 1 },
  { id: 'chacarero', nombre: 'El Tano Bruno', pueblo: 1 },
  { id: 'puestero', nombre: 'Don Ramón el Puestero', pueblo: 2 },
  { id: 'pulpero', nombre: 'El Gallego', pueblo: 2 },
  { id: 'maestra_rural', nombre: 'La Seño Marta', pueblo: 2 },
  { id: 'tractorista', nombre: 'El Colorado', pueblo: 2 },
  { id: 'partera', nombre: 'Doña Anunciación', pueblo: 2 },
];

// D1 — vecinos nuevos (poblarMundo). tile = lugar fijo y walkable; rutinas reubica
// si cae sobre algo. Textos generados y revisados (genéricos, sin marcas/apuestas).
AJ.ROSTER_D1 = [
  { id: 'quiosquera', nombre: 'La Coca del Quiosco', tex: 'npc_partera', pueblo: 1, dir: 'abajo',
    tile: { x: 6, y: 8 },
    saludo: ['Pasá, pasá, que recién entraron los caramelos.', 'Acá me entero de todo antes que el diario.'] },
  { id: 'bombero', nombre: 'El Lucho, Bombero Voluntario', tex: 'npc_pulpero', pueblo: 1, dir: 'abajo',
    tile: { x: 32, y: 8 },
    saludo: ['Somos cuatro gatos locos, pero el cuartel nunca cierra.', 'Si suena la sirena, salimos volando, agente.'] },
  { id: 'jubilado', nombre: 'Don Tito del Banco de la Plaza', tex: 'npc_puestero', pueblo: 1, dir: 'abajo',
    tile: { x: 21, y: 17 },
    saludo: ['Este banco es mío de nueve a doce; después que se sienten otros.', 'Mirá cómo creció el pueblo, pibe. Yo lo vi de barro.'] },
  { id: 'apicultora', nombre: 'La Flor de Miel', tex: 'npc_maestra', pueblo: 2, dir: 'abajo',
    tile: { x: 28, y: 10 },
    saludo: ['Despacito con las abejas, que ellas saben lo que hacen.', '¿Sentís ese zumbido? Es la Colonia trabajando.'] },
  { id: 'alambrador', nombre: 'El Vasco Iturri', tex: 'npc_chacarero', pueblo: 2, dir: 'der',
    tile: { x: 12, y: 12 },
    saludo: ['Un buen alambre tira derecho de tranquera a tranquera.', 'Sin postes firmes no hay campo que se tenga, che.'] },
  { id: 'almacenera_rural', nombre: 'La Pochi del Boliche', tex: 'npc_abuela', pueblo: 2, dir: 'abajo',
    tile: { x: 24, y: 18 },
    saludo: ['Pasá, que recién bajé bizcochitos del horno.', 'Acá en el boliche de ramos te fío hasta la cosecha, querido.'] },
];

// Roster efectivo (vecinos ALCANZABLES) según flags (lo usa el Registro D3).
// Pueblo 1 siempre; pueblo 2 (Colonia) sólo si npcsColonia; los de D1 sólo si
// poblarMundo. Así el % del Registro puede llegar a 100 con cualquier combinación.
AJ.roster = function () {
  const C = AJ.CONFIG || {};
  const alcanzable = (pu) => pu === 1 ? true : (pu === 2 ? !!C.npcsColonia : false);
  const map = (n) => ({ id: n.id, nombre: n.nombre, pueblo: n.pueblo });
  let r = AJ.ROSTER_BASE.filter((n) => alcanzable(n.pueblo)).map(map);
  if (C.poblarMundo) {
    r = r.concat(AJ.ROSTER_D1.filter((n) => alcanzable(n.pueblo)).map(map));
  }
  return r;
};

AJ.NPC = class {
  constructor(scene, def) {
    this.scene = scene;
    this.id = def.id;
    this.nombre = def.nombre;
    this.tex = def.tex;             // prefijo de textura, p. ej. 'npc_intendenta'
    this.tx = def.tx; this.ty = def.ty;
    this.dir = def.dir || 'abajo';
    this.saludo = def.saludo || ['Buenas.'];

    const T = AJ.CONFIG.TILE;
    this.sprite = scene.add.sprite(this.tx * T + T / 2, this.ty * T + T / 2,
      this.tex + '_' + this.dir + '_0');
    this.sprite.setOrigin(0.5, 0.75);
    // Textura 16×24 nativa mostrada a 32×48 (×2), igual que el jugador.
    this.sprite.setDisplaySize(AJ.CONFIG.JUGADOR_W, AJ.CONFIG.JUGADOR_H);
    this.sprite.setDepth(this.ty * T + T);

    // Globito con "!" sobre el NPC (se prende/apaga según misiones). La textura
    // 'exclamacion' es 16×16 (antes 32): por eso la escala se dobla (0.7 -> 1.4).
    this.marca = scene.add.image(this.tx * T + T / 2, this.ty * T - 14, 'exclamacion')
      .setDepth(9000).setScale(1.4).setVisible(false);
    // Guardamos la referencia del tween: la FASE A (rutinas) la pausa para
    // posicionar la marca a mano cuando el NPC camina.
    this.marcaTween = scene.tweens.add({ targets: this.marca, y: this.marca.y - 4,
      duration: 600, yoyo: true, repeat: -1 });
  }

  // Hace que el NPC mire hacia un tile (cuando le hablan).
  mirarHacia(tx, ty) {
    const dx = tx - this.tx, dy = ty - this.ty;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'izq' : 'der';
    else this.dir = dy < 0 ? 'arriba' : 'abajo';
    this.sprite.setTexture(this.tex + '_' + this.dir + '_0');
  }

  mostrarMarca(v) { if (this.marca) this.marca.setVisible(!!v); }
};

AJ.NPCManager = class {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];
    this.porTile = {}; // "x,y" -> npc
  }

  crearTodos() {
    // FASE D: pueblos sin NPCs se quedan vacíos. El sistema igual queda
    // "iniciado" (sin vecinos), sin romper nada.
    if (AJ.Mapa.meta && AJ.Mapa.meta.conNPCs === false) return;
    // C1.1: cada pueblo trae su propio elenco. Pueblo 1 queda idéntico.
    const defs = (AJ.Mapa.actual === 2) ? this._defsColonia() : this._defsPueblo1();
    this._instanciar(defs);
  }

  // Pueblo 1 — el elenco original (sin cambios respecto de FASE 2).
  _defsPueblo1() {
    const spots = AJ.Mapa.meta.npcSpots || {};
    const plazaSpot = { x: 17, y: 17 };
    const g = AJ.Mapa.meta.granja;
    const huertaSpot = g ? { x: g.x, y: g.y + g.h } : { x: 24, y: 27 };
    return [
      { id: 'intendenta', nombre: 'Intendenta Beba', tex: 'npc_intendenta',
        spot: spots.muni, dir: 'abajo',
        saludo: ['La Municipalidad siempre tiene la puerta abierta, che.'] },
      { id: 'maestra', nombre: 'La Maestra Rosa', tex: 'npc_maestra',
        spot: spots.juventud, dir: 'abajo',
        saludo: ['En la Casa de la Juventud se cocina el futuro del pueblo.'] },
      { id: 'almacenero', nombre: 'Don Pedro', tex: 'npc_almacenero',
        spot: spots.almacen, dir: 'abajo',
        saludo: ['Ramos generales: hay de todo, hasta charla.'] },
      { id: 'cura', nombre: 'El Padre Antonio', tex: 'npc_cura',
        spot: spots.iglesia, dir: 'abajo',
        saludo: ['La campana suena para todos, hijo.'] },
      { id: 'abuela', nombre: 'Doña Elsa', tex: 'npc_abuela',
        spot: plazaSpot, dir: 'abajo',
        saludo: ['Tomá unos mates conmigo cuando quieras, m\'hijo.'] },
      { id: 'chacarero', nombre: 'El Tano Bruno', tex: 'npc_chacarero',
        spot: huertaSpot, dir: 'arriba',
        saludo: ['La tierra da si la cuidás. Así de simple.'] },
    ].concat(this._defsD1(1));
  }

  // D1 (poblarMundo): vecinos nuevos de un pueblo, mapeados desde AJ.ROSTER_D1.
  _defsD1(pueblo) {
    if (!AJ.CONFIG.poblarMundo || !AJ.ROSTER_D1) return [];
    return AJ.ROSTER_D1.filter((n) => n.pueblo === pueblo).map((n) => ({
      id: n.id, nombre: n.nombre, tex: n.tex, spot: n.tile, dir: n.dir, saludo: n.saludo,
    }));
  }

  // C1.1 — Colonia La Esperanza: su propio elenco rural.
  _defsColonia() {
    const spots = AJ.Mapa.meta.npcSpots || {};
    const g = AJ.Mapa.meta.granja;
    const huertaSpot = g ? { x: g.x, y: g.y + g.h } : { x: 22, y: 12 };
    return [
      { id: 'puestero', nombre: 'Don Ramón el Puestero', tex: 'npc_puestero',
        spot: spots.chacraA || { x: 9, y: 10 }, dir: 'abajo',
        saludo: ['Acá en la Colonia el día empieza con la primera luz.'] },
      { id: 'pulpero', nombre: 'El Gallego', tex: 'npc_pulpero',
        spot: spots.chacraB || { x: 28, y: 24 }, dir: 'abajo',
        saludo: ['La pulpería tiene yerba, clavos y chismes. ¿Qué te doy?'] },
      { id: 'maestra_rural', nombre: 'La Seño Marta', tex: 'npc_maestrarural',
        spot: { x: 16, y: 14 }, dir: 'abajo',
        saludo: ['La escuelita rural es chica pero no le falta corazón.'] },
      { id: 'tractorista', nombre: 'El Colorado', tex: 'npc_chacarero',
        spot: huertaSpot, dir: 'arriba',
        saludo: ['Con el tractor andando, la chacra es otra cosa.'] },
      { id: 'partera', nombre: 'Doña Anunciación', tex: 'npc_partera',
        spot: { x: 10, y: 20 }, dir: 'abajo',
        saludo: ['Traje al mundo a media Colonia, m\'hijo.'] },
    ].concat(this._defsD1(2));
  }

  _instanciar(defs) {
    defs.forEach((d) => {
      try {
        const spot = d.spot || { x: 20, y: 20 };
        const npc = new AJ.NPC(this.scene, {
          id: d.id, nombre: d.nombre, tex: d.tex,
          tx: spot.x, ty: spot.y, dir: d.dir, saludo: d.saludo,
        });
        this.npcs.push(npc);
        this.porTile[spot.x + ',' + spot.y] = npc;
      } catch (e) {
        console.warn('[NPC] no se pudo crear', d.id, e);
      }
    });
  }

  enTile(tx, ty) { return this.porTile[tx + ',' + ty] || null; }
  porId(id) { return this.npcs.find((n) => n.id === id) || null; }

  // ¿Hay un NPC en este tile? (lo usa la escena para colisión.)
  ocupa(tx, ty) { return !!this.porTile[tx + ',' + ty]; }

  // Reubica un NPC a un tile nuevo manteniendo sincronizado porTile
  // (lo usa la FASE A de rutinas cuando un NPC camina). Aditivo: si las
  // rutinas están apagadas, nunca se llama y todo queda como antes.
  reubicar(npc, nx, ny) {
    const viejo = npc.tx + ',' + npc.ty;
    if (this.porTile[viejo] === npc) delete this.porTile[viejo];
    npc.tx = nx; npc.ty = ny;
    this.porTile[nx + ',' + ny] = npc;
  }

  update() { /* el tick de movimiento lo maneja AJ.Rutinas (FASE A) */ }
};
