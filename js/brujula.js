/* =====================================================================
 * brujula.js — Guía/flecha hacia la misión activa (C2.3, CONFIG.brujula)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.brujula. Una flecha discreta alrededor del
 * jugador que apunta hacia el objetivo de la misión activa (el NPC con
 * el "!"). Si el objetivo está en el otro pueblo, apunta a la salida.
 * Así no te perdés entre los dos pueblos.
 *
 * Si el flag está off o algo falla, no se crea: el juego sigue igual.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Brujula = class {
  constructor(scene) {
    this.scene = scene;
    this._crear();
  }

  _crear() {
    if (!this.scene.textures.exists('brujula_flecha')) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      // Flecha (punta hacia arriba) amarilla con borde.
      g.fillStyle(0xf5d020, 1);
      g.beginPath();
      g.moveTo(16, 2); g.lineTo(27, 24); g.lineTo(16, 18); g.lineTo(5, 24);
      g.closePath(); g.fillPath();
      g.lineStyle(2, 0x2a1f12, 1); g.strokePath();
      g.generateTexture('brujula_flecha', 32, 28);
      g.destroy();
    }
    this.flecha = this.scene.add.image(0, 0, 'brujula_flecha')
      .setScale(0.8).setVisible(false);
    // Latido suave para que se note sin molestar.
    try {
      this.scene.tweens.add({ targets: this.flecha, alpha: 0.55, duration: 700,
        yoyo: true, repeat: -1 });
    } catch (e) {}
  }

  // Tile objetivo (o null): el NPC relevante de la misión actual, o la salida
  // si lo que falta está en el otro pueblo.
  objetivoTile() {
    const sc = this.scene;
    const mis = sc.misiones;
    if (!mis || !mis._misionActual) return null;
    const m = mis._misionActual();
    if (m) {
      const st = mis._estadoDe(m.id);
      const id = !st ? m.npcInicio : (st === 'activa' ? m.objetivoNpc : m.npcFin);
      const npc = sc.npcManager && sc.npcManager.porId(id);
      if (npc) return { x: npc.tx, y: npc.ty };
      return null;
    }
    // Pueblo actual sin misión pendiente: ¿hay misiones en el otro pueblo? -> salida.
    try {
      const hayOtro = (AJ.MISIONES || []).some((mm) =>
        (mm.pueblo || 1) !== AJ.Mapa.actual && mis._estadoDe(mm.id) !== 'completada');
      if (hayOtro) {
        const sal = (AJ.Mapa.meta.salidas || [])[0];
        if (sal) return { x: sal.x, y: sal.y };
      }
    } catch (e) {}
    return null;
  }

  update() {
    const sc = this.scene;
    if (!this.flecha) return;
    const obj = this.objetivoTile();
    if (!obj || !sc.jugador) { this.flecha.setVisible(false); return; }
    const T = AJ.CONFIG.TILE;
    const px = sc.jugador.x, py = sc.jugador.y;
    const tx = obj.x * T + T / 2, ty = obj.y * T + T / 2;
    const dx = tx - px, dy = ty - py;
    const dist = Math.hypot(dx, dy);
    if (dist < T * 1.7) { this.flecha.setVisible(false); return; } // ya estás al lado
    const ang = Math.atan2(dy, dx);
    // La flecha apunta "hacia arriba" por defecto -> rotar para alinear con ang.
    this.flecha.setRotation(ang + Math.PI / 2);
    this.flecha.x = px + Math.cos(ang) * 42;
    this.flecha.y = (py - 16) + Math.sin(ang) * 42;
    this.flecha.setDepth(py + 200);
    this.flecha.setVisible(true);
  }
};
