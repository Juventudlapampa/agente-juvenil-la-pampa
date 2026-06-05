/* =====================================================================
 * granja.js — Huerta comunitaria: plantar, crecer, cosechar (FASE 4)
 * ---------------------------------------------------------------------
 * En la parcela arada (AJ.Mapa.meta.granja) el Agente:
 *   - planta parado frente a un tile vacío (acción E),
 *   - el cultivo crece con el paso del tiempo de juego (4 etapas),
 *   - lo cosecha cuando está maduro y suma monedas.
 *
 * Estado persistido en estado.granja: { "x,y": { etapa, seg } }.
 * `seg` acumula segundos reales dentro de la etapa actual.
 *
 * Plantar es gratis (es una huerta comunitaria, bien costumbrista).
 * Cosechar paga MONEDAS_COSECHA. NADA de azar ni apuestas.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Granja = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.granja) this.estado.granja = {};
    this.parcela = AJ.Mapa.meta.granja || { x: 23, y: 23, w: 5, h: 4 };
    this.cropSprites = {}; // "x,y" -> sprite del cultivo
    this.MONEDAS_COSECHA = 10;
    this.ETAPA_MADURO = 3;
  }

  init() {
    const T = AJ.CONFIG.TILE, p = this.parcela;
    // Crear un sprite de cultivo (invisible) por cada tile de la parcela.
    for (let y = p.y; y < p.y + p.h; y++) {
      for (let x = p.x; x < p.x + p.w; x++) {
        const s = this.scene.add.image(x * T + T / 2, y * T + T / 2, 'cultivo_0')
          .setDepth(y * T + 8).setVisible(false);
        this.cropSprites[x + ',' + y] = s;
      }
    }
    // Restaurar cultivos guardados.
    Object.keys(this.estado.granja).forEach((k) => {
      const c = this.estado.granja[k];
      if (c && this.cropSprites[k]) this._pintar(k, c.etapa);
    });
  }

  _enParcela(tx, ty) {
    const p = this.parcela;
    return tx >= p.x && tx < p.x + p.w && ty >= p.y && ty < p.y + p.h;
  }

  _pintar(key, etapa) {
    const s = this.cropSprites[key];
    if (!s) return;
    const e = Math.max(0, Math.min(this.ETAPA_MADURO, etapa));
    s.setTexture('cultivo_' + e).setVisible(true);
  }

  // Llamado por la escena cuando el jugador presiona acción mirando (tx,ty).
  // Devuelve true si la interacción fue con la parcela (se consumió).
  intentarInteractuar(tx, ty) {
    if (!this._enParcela(tx, ty)) return false;
    const key = tx + ',' + ty;
    const crop = this.estado.granja[key];

    if (!crop) {
      // Plantar.
      this.estado.granja[key] = { etapa: 0, seg: 0 };
      this._pintar(key, 0);
      this._flotante('🌱 ¡Plantado!', tx, ty, '#a8e063');
      this._guardar();
      return true;
    }

    if (crop.etapa >= this.ETAPA_MADURO) {
      // Cosechar.
      delete this.estado.granja[key];
      const s = this.cropSprites[key];
      if (s) s.setVisible(false);
      try {
        const inv = this.estado.inventario;
        inv.monedas = (inv.monedas || 0) + this.MONEDAS_COSECHA;
        if (inv.logros && inv.logros.indexOf('Primera cosecha') < 0) inv.logros.push('Primera cosecha');
        // FASE C (opcional): además de monedas, la cosecha da 1 'verdura' para
        // craftear. Guardado: si el crafteo está apagado igual no molesta.
        if (!inv.items) inv.items = {};
        inv.items.verdura = (inv.items.verdura || 0) + 1;
      } catch (e) {}
      this._flotante('+' + this.MONEDAS_COSECHA + ' ¢  +1 🥕', tx, ty, '#f5d020');
      if (this.scene._actualizarHUD) this.scene._actualizarHUD();
      this._guardar();
      return true;
    }

    // Todavía creciendo.
    this._flotante('Creciendo…', tx, ty, '#cfe8a0');
    return true;
  }

  // Texto flotante de feedback sobre un tile.
  _flotante(txt, tx, ty, color) {
    try {
      const T = AJ.CONFIG.TILE;
      const t = this.scene.add.text(tx * T + T / 2, ty * T, txt, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: color || '#fff',
        stroke: '#2a1f12', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(9500);
      this.scene.tweens.add({ targets: t, y: t.y - 22, alpha: 0, duration: 900,
        onComplete: () => t.destroy() });
    } catch (e) {}
  }

  update(dt) {
    const paso = Math.max(1, AJ.CONFIG.SEG_CRECIMIENTO_CULTIVO);
    // FASE B (opcional): la estación acelera/frena el crecimiento. Si no hay
    // sistema de estaciones, el factor es 1 y el comportamiento es el de FASE 4.
    let factor = 1;
    if (this.scene.estaciones && this.scene.estaciones.factorCrecimiento) {
      try { factor = this.scene.estaciones.factorCrecimiento(); } catch (e) { factor = 1; }
    }
    let cambio = false;
    const g = this.estado.granja;
    for (const key in g) {
      const c = g[key];
      if (!c || c.etapa >= this.ETAPA_MADURO) continue;
      c.seg = (c.seg || 0) + dt * factor;
      while (c.seg >= paso && c.etapa < this.ETAPA_MADURO) {
        c.seg -= paso;
        c.etapa += 1;
        this._pintar(key, c.etapa);
        cambio = true;
      }
    }
    if (cambio) this._guardar();
  }

  _guardar() { try { AJ.Guardado.guardar(this.estado); } catch (e) {} }
};
