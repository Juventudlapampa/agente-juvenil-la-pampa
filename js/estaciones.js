/* =====================================================================
 * estaciones.js — 4 estaciones (FASE B, CONFIG.estaciones)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.estaciones. Extiende el ciclo día/noche con
 * estaciones que:
 *   - cambian la paleta general (una capa de tinte suave sobre la escena,
 *     POR DEBAJO del tinte día/noche, así se combinan),
 *   - modulan el ritmo de los cultivos (factor de crecimiento que lee la
 *     granja, ver granja.update).
 *
 * La estación deriva del día de juego (estado.tiempo.dia), que ya persiste
 * y lo avanza diaNoche. No agrega estado nuevo: si recargás, la estación se
 * recalcula sola. Si el flag está en false o algo falla, no se inicializa y
 * el juego sigue igual (FASE 3/4 intactas).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Estaciones = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    // Cada estación dura estos días de juego.
    this.DIAS_POR_ESTACION = (AJ.CONFIG.DIAS_POR_ESTACION || 3);
    this._idxActual = -1; // para detectar cambios y avisar
  }

  static get DATA() {
    return [
      { nombre: 'Primavera', art: 'la', emoji: '🌱', tint: 0x86d96a, alpha: 0.10, factor: 1.2 },
      { nombre: 'Verano',    art: 'el', emoji: '☀️', tint: 0xffe24a, alpha: 0.08, factor: 1.4 },
      { nombre: 'Otoño',     art: 'el', emoji: '🍂', tint: 0xcf7a33, alpha: 0.16, factor: 0.9 },
      { nombre: 'Invierno',  art: 'el', emoji: '❄️', tint: 0x9fc0e0, alpha: 0.22, factor: 0.5 },
    ];
  }

  init() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    // Capa de tinte estacional, por DEBAJO del tinte día/noche (depth 8000).
    this.overlay = this.scene.add.rectangle(0, 0, W, H, 0xffffff, 0)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(7990);
    // Cartel de estación (arriba al centro, debajo del reloj de diaNoche).
    this.cartel = this.scene.add.text(W / 2, 38, '', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff7e6',
      backgroundColor: '#2a4a2acc', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9000);
    this._aplicar();
  }

  diaActual() {
    if (this.scene.diaNoche && typeof this.scene.diaNoche.dia === 'number') return this.scene.diaNoche.dia;
    return (this.estado.tiempo && this.estado.tiempo.dia) || 1;
  }

  // Índice de estación 0..3 según el día.
  indice() {
    const dia = this.diaActual();
    const d = Math.max(0, dia - 1);
    return Math.floor(d / this.DIAS_POR_ESTACION) % 4;
  }

  actual() { return AJ.Estaciones.DATA[this.indice()]; }

  factorCrecimiento() { return this.actual().factor; }

  _aplicar() {
    const idx = this.indice();
    const e = AJ.Estaciones.DATA[idx];
    if (this.overlay) this.overlay.setFillStyle(e.tint, e.alpha);
    if (this.cartel) {
      const dia = this.diaActual();
      const diaEnEstacion = ((dia - 1) % this.DIAS_POR_ESTACION) + 1;
      this.cartel.setText(e.emoji + ' ' + e.nombre + '  (día ' + diaEnEstacion + '/' + this.DIAS_POR_ESTACION + ')');
    }
    // Aviso flotante si cambió la estación (no en el primer apply).
    if (this._idxActual !== -1 && this._idxActual !== idx) this._avisarCambio(e);
    this._idxActual = idx;
  }

  _avisarCambio(e) {
    try {
      const W = this.scene.scale.width, H = this.scene.scale.height;
      const t = this.scene.add.text(W / 2, H / 2, '¡Llegó ' + e.art + ' ' + e.nombre + '! ' + e.emoji, {
        fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff7e6',
        stroke: '#2a1f12', strokeThickness: 5,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11000);
      this.scene.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 2200,
        onComplete: () => t.destroy() });
    } catch (e2) {}
  }

  update() { this._aplicar(); }
};
