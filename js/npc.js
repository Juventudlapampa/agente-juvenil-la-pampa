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
    this.sprite.setDepth(this.ty * T + T);

    // Globito con "!" sobre el NPC (se prende/apaga según misiones).
    this.marca = scene.add.image(this.tx * T + T / 2, this.ty * T - 14, 'exclamacion')
      .setDepth(9000).setScale(0.7).setVisible(false);
    scene.tweens.add({ targets: this.marca, y: this.marca.y - 4, duration: 600,
      yoyo: true, repeat: -1 });
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
    const spots = AJ.Mapa.meta.npcSpots || {};
    // Punto en la plaza para la abuela (banco al sol).
    const plazaSpot = { x: 17, y: 17 };
    // Punto frente a la huerta para el chacarero.
    const g = AJ.Mapa.meta.granja;
    const huertaSpot = g ? { x: g.x, y: g.y + g.h } : { x: 24, y: 27 };

    const defs = [
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
    ];

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

  update() { /* reservado para rutinas (ROADMAP) */ }
};
