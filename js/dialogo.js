/* =====================================================================
 * dialogo.js — Cuadro de diálogo estilo RPG (FASE 2)
 * ---------------------------------------------------------------------
 * Muestra texto por tramos en un panel abajo de la pantalla. Se avanza
 * con Espacio/E/Enter o el botón de acción. Mientras está abierto, el
 * jugador no se mueve (lo controla la escena leyendo `dialogo.abierto`).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Dialogo = class {
  constructor(scene) {
    this.scene = scene;
    this.abierto = false;
    this.tramos = [];
    this.indice = 0;
    this.alCerrar = null;
    this._construirUI();
  }

  _construirUI() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const margen = 16, alto = 130;
    this.cont = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(10000);
    this.cont.setVisible(false);

    // Panel
    this.panel = this.scene.add.graphics();
    this.panel.fillStyle(0x2a1f12, 0.94);
    this.panel.fillRoundedRect(margen, H - alto - margen, W - margen * 2, alto, 12);
    this.panel.lineStyle(3, 0xf3d9a0, 1);
    this.panel.strokeRoundedRect(margen, H - alto - margen, W - margen * 2, alto, 12);

    // Nombre del que habla
    this.txtNombre = this.scene.add.text(margen + 18, H - alto - margen + 10, '', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f5d020', fontStyle: 'bold',
    });

    // Cuerpo del texto
    this.txtCuerpo = this.scene.add.text(margen + 18, H - alto - margen + 40, '', {
      fontFamily: 'Georgia, serif', fontSize: '17px', color: '#fff7e6',
      wordWrap: { width: W - margen * 2 - 36 }, lineSpacing: 4,
    });

    // Indicador "continuar"
    this.txtMas = this.scene.add.text(W - margen - 34, H - margen - 28, '▼', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f3d9a0',
    });

    this.cont.add([this.panel, this.txtNombre, this.txtCuerpo, this.txtMas]);

    // Parpadeo del indicador.
    this.scene.tweens.add({ targets: this.txtMas, alpha: 0.2, duration: 500,
      yoyo: true, repeat: -1 });
  }

  // tramos: array de strings (cada uno es una "pantalla" de diálogo).
  mostrar(nombre, tramos, alCerrar) {
    try {
      this.nombre = nombre || '';
      this.tramos = Array.isArray(tramos) ? tramos.slice() : [String(tramos)];
      if (this.tramos.length === 0) this.tramos = ['...'];
      this.indice = 0;
      this.alCerrar = alCerrar || null;
      this.abierto = true;
      this.cont.setVisible(true);
      this._render();
      if (AJ.Sonido) { try { AJ.Sonido.dialogo(); } catch (e) {} }
      // P1 (juice): el panel entra con un fade + leve deslizamiento.
      if (AJ.Juice && AJ.Juice.activo()) {
        try {
          this.cont.setAlpha(0); this.cont.y = 12;
          this.scene.tweens.add({ targets: this.cont, alpha: 1, y: 0,
            duration: 160, ease: 'Quad.easeOut' });
        } catch (e) { this.cont.setAlpha(1); this.cont.y = 0; }
      }
    } catch (e) {
      console.warn('[Dialogo] no se pudo mostrar', e);
      this.cerrar();
    }
  }

  _render() {
    this.txtNombre.setText(this.nombre);
    this.txtCuerpo.setText(this.tramos[this.indice] || '');
    this.txtMas.setText(this.indice < this.tramos.length - 1 ? '▼' : '✕');
  }

  // Avanza al siguiente tramo o cierra. Devuelve true si seguía abierto.
  avanzar() {
    if (!this.abierto) return false;
    this.indice++;
    if (this.indice >= this.tramos.length) { this.cerrar(); return false; }
    this._render();
    if (AJ.Sonido) { try { AJ.Sonido.dialogo(); } catch (e) {} }
    return true;
  }

  cerrar() {
    if (this.abierto && AJ.Sonido) { try { AJ.Sonido.dialogoCerrar(); } catch (e) {} }
    this.abierto = false;
    this.cont.setVisible(false);
    const cb = this.alCerrar;
    this.alCerrar = null;
    if (cb) { try { cb(); } catch (e) { console.warn('[Dialogo] callback', e); } }
  }
};
