/* =====================================================================
 * diaNoche.js — Ciclo día/noche con tinte y reloj (FASE 3)
 * ---------------------------------------------------------------------
 * Avanza el reloj del juego (estado.tiempo.minutos, 0..1439) y pinta un
 * tinte de color sobre toda la escena según la hora. Muestra un reloj
 * arriba al centro. Liviano: una sola capa de color a pantalla completa.
 *
 * Bolt-on previsto (ROADMAP): estaciones = otra capa de tinte y un
 * contador de días; ya hay un gancho en `_avanzarDia()`.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.DiaNoche = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.tiempo) this.estado.tiempo = { minutos: 8 * 60 };
    if (typeof this.estado.tiempo.minutos !== 'number') this.estado.tiempo.minutos = 8 * 60;
    this.dia = this.estado.tiempo.dia || 1;
  }

  // Claves de color/alpha del tinte a lo largo del día (minutos del día).
  static get KEYS() {
    return [
      { m: 0,    color: 0x0a1840, alpha: 0.55 }, // medianoche
      { m: 300,  color: 0x0a1840, alpha: 0.55 }, // 05:00 noche
      { m: 420,  color: 0xff8c42, alpha: 0.30 }, // 07:00 amanecer
      { m: 540,  color: 0xffffff, alpha: 0.00 }, // 09:00 día pleno
      { m: 1020, color: 0xffffff, alpha: 0.00 }, // 17:00 día
      { m: 1140, color: 0xff7a30, alpha: 0.34 }, // 19:00 atardecer
      { m: 1260, color: 0x0a1840, alpha: 0.50 }, // 21:00 anochecer
      { m: 1440, color: 0x0a1840, alpha: 0.55 }, // 24:00 = 0
    ];
  }

  init() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    // Capa de tinte a pantalla completa (fija a la cámara).
    this.overlay = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(8000);

    // Reloj arriba al centro.
    this.reloj = this.scene.add.text(W / 2, 10, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff7e6',
      backgroundColor: '#2a1f12cc', padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9000);

    this._aplicar();
  }

  // Interpola color y alpha del tinte para la hora actual.
  _tinte(min) {
    const K = AJ.DiaNoche.KEYS;
    let a = K[0], b = K[K.length - 1];
    for (let i = 0; i < K.length - 1; i++) {
      if (min >= K[i].m && min <= K[i + 1].m) { a = K[i]; b = K[i + 1]; break; }
    }
    const t = (b.m === a.m) ? 0 : (min - a.m) / (b.m - a.m);
    const ca = Phaser.Display.Color.IntegerToColor(a.color);
    const cb = Phaser.Display.Color.IntegerToColor(b.color);
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, t * 100);
    const alpha = a.alpha + (b.alpha - a.alpha) * t;
    return { color: Phaser.Display.Color.GetColor(col.r, col.g, col.b), alpha };
  }

  _periodo(min) {
    if (min < 360) return 'Noche';
    if (min < 480) return 'Amanecer';
    if (min < 1080) return 'Día';
    if (min < 1200) return 'Atardecer';
    return 'Noche';
  }

  _aplicar() {
    const min = Math.floor(this.estado.tiempo.minutos) % 1440;
    const tn = this._tinte(min);
    if (this.overlay) { this.overlay.setFillStyle(tn.color, tn.alpha); }
    if (this.reloj) {
      const hh = String(Math.floor(min / 60)).padStart(2, '0');
      const mm = String(min % 60).padStart(2, '0');
      this.reloj.setText('Día ' + this.dia + '  ·  ' + hh + ':' + mm + '  ' + this._periodo(min));
    }
  }

  _avanzarDia() {
    this.dia += 1;
    this.estado.tiempo.dia = this.dia;
    // Gancho para estaciones / crecimiento de cultivos por día (ROADMAP).
  }

  update(dt) {
    // Minutos de juego que pasan por segundo real.
    const minPorSeg = 1440 / Math.max(1, AJ.CONFIG.SEGUNDOS_POR_DIA);
    this.estado.tiempo.minutos += dt * minPorSeg;
    if (this.estado.tiempo.minutos >= 1440) {
      this.estado.tiempo.minutos -= 1440;
      this._avanzarDia();
    }
    this._aplicar();
  }

  // Minutos absolutos de juego (para la granja: crecimiento por tiempo).
  minutosAbsolutos() {
    return (this.dia - 1) * 1440 + this.estado.tiempo.minutos;
  }
};
