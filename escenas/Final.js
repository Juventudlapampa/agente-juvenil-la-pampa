/* =====================================================================
 * Final.js — Pantalla de cierre al completar todas las misiones
 * ---------------------------------------------------------------------
 * Felicita al jugador. Se llega acá desde el sistema de misiones cuando
 * se completan todas. Botón para volver al título.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.EscenaFinal = class extends Phaser.Scene {
  constructor() { super('Final'); }

  init(data) { this.resumen = (data && data.resumen) || {}; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    if (AJ.Juice) AJ.Juice.fadeIn(this);

    // Fondo atardecer pampeano.
    const g = this.add.graphics();
    g.fillStyle(0xf6b26b, 1); g.fillRect(0, 0, W, H * 0.55);
    g.fillStyle(0xe98a4b, 1); g.fillRect(0, 0, W, H * 0.30);
    g.fillStyle(0x5a6b34, 1); g.fillRect(0, H * 0.55, W, H * 0.45);
    g.fillStyle(0xffe08a, 1); g.fillCircle(W / 2, H * 0.5, 70);

    this.add.text(W / 2, H * 0.20, '¡Felicitaciones, Agente!', {
      fontFamily: 'Georgia, serif', fontSize: '46px', color: '#3a2c10',
      fontStyle: 'bold', stroke: '#fff3c4', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.34,
      'Cumpliste todas las misiones cívicas del pueblo.\n' +
      'La Pampa te lo agradece. ¡Sos un orgullo de la Casa de la Juventud!',
      { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#3a2c10',
        align: 'center', wordWrap: { width: W * 0.8 } }
    ).setOrigin(0.5);

    if (this.resumen.monedas != null) {
      this.add.text(W / 2, H * 0.66,
        'Monedas reunidas: ' + this.resumen.monedas,
        { fontFamily: 'monospace', fontSize: '18px', color: '#3a2c10' }
      ).setOrigin(0.5);
    }

    // Botón volver al título.
    const cont = this.add.container(W / 2, H * 0.82);
    const fondo = this.add.graphics();
    fondo.fillStyle(0xa85a3a, 1); fondo.fillRoundedRect(-130, -28, 260, 56, 10);
    fondo.lineStyle(3, 0x3a2c10, 1); fondo.strokeRoundedRect(-130, -28, 260, 56, 10);
    const t = this.add.text(0, 0, 'Volver al inicio', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff3c4', fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([fondo, t]);
    cont.setSize(260, 56);
    cont.setInteractive(new Phaser.Geom.Rectangle(-130, -28, 260, 56),
      Phaser.Geom.Rectangle.Contains);
    cont.on('pointerdown', () => {
      if (AJ.Juice) AJ.Juice.irA(this, 'Titulo');
      else this.scene.start('Titulo');
    });

    // E3: acceso a créditos desde el final.
    if (AJ.CONFIG.creditos && AJ.Creditos) {
      const cr = this.add.text(W / 2, H * 0.92, '📜 Ver créditos', {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: '#3a2c10',
        backgroundColor: '#f4cd6088', padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      cr.on('pointerover', () => cr.setColor('#8a4a2a'));
      cr.on('pointerout', () => cr.setColor('#3a2c10'));
      cr.on('pointerdown', () => { if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} } AJ.Creditos.abrir(this); });
    }
  }
};
