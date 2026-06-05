/* =====================================================================
 * Titulo.js — Pantalla de título
 * ---------------------------------------------------------------------
 * Muestra el nombre del juego y botones Jugar / Continuar (este último
 * sólo si hay guardado). Dibuja un fondo pampeano simple con código.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.EscenaTitulo = class extends Phaser.Scene {
  constructor() { super('Titulo'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    if (AJ.Juice) AJ.Juice.fadeIn(this);

    // Fondo: cielo pampeano con degradé y horizonte de campo.
    const g = this.add.graphics();
    g.fillStyle(0x9fc6e8, 1); g.fillRect(0, 0, W, H * 0.55);
    g.fillStyle(0xbfd9ee, 1); g.fillRect(0, 0, W, H * 0.30);
    g.fillStyle(0x7ba349, 1); g.fillRect(0, H * 0.55, W, H * 0.45);
    g.fillStyle(0x6b9540, 1);
    for (let y = H * 0.6; y < H; y += 26) g.fillRect(0, y, W, 12);
    // Sol
    g.fillStyle(0xfff3c4, 1); g.fillCircle(W - 120, 120, 50);
    // Caldenes en el horizonte
    g.fillStyle(0x4f6b34, 1);
    [120, 300, 520, 680].forEach((x, i) => {
      const y = H * 0.55;
      g.fillRect(x, y - 30, 8, 30);
      g.fillCircle(x + 4, y - 34, 18 + (i % 2) * 4);
    });

    // Título
    this.add.text(W / 2, H * 0.22, 'AGENTE JUVENIL', {
      fontFamily: 'Georgia, serif', fontSize: '52px', color: '#3a2c10',
      fontStyle: 'bold', stroke: '#fff3c4', strokeThickness: 6,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.33, 'La Pampa', {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#8a4a2a',
      fontStyle: 'italic', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5);

    const hayGuardado = AJ.Guardado.existe();

    // Botón JUGAR (nueva partida)
    this._boton(W / 2, H * 0.58, 'Jugar', () => {
      try { AJ.Guardado.borrar(); } catch (e) {}
      if (AJ.Juice) AJ.Juice.irA(this, 'Pueblo', { nuevo: true });
      else this.scene.start('Pueblo', { nuevo: true });
    });

    // Botón CONTINUAR (sólo si hay guardado)
    if (hayGuardado) {
      this._boton(W / 2, H * 0.70, 'Continuar', () => {
        if (AJ.Juice) AJ.Juice.irA(this, 'Pueblo', { nuevo: false });
        else this.scene.start('Pueblo', { nuevo: false });
      });
    }

    // Pie de página
    this.add.text(W / 2, H - 28,
      'Flechas/WASD para moverte · Espacio/E para interactuar',
      { fontFamily: 'monospace', fontSize: '14px', color: '#3a2c10' }
    ).setOrigin(0.5);
  }

  _boton(x, y, texto, onClick) {
    const ancho = 240, alto = 56;
    const cont = this.add.container(x, y);
    const fondo = this.add.graphics();
    const dibujar = (hover) => {
      fondo.clear();
      fondo.fillStyle(hover ? 0x8a4a2a : 0xa85a3a, 1);
      fondo.fillRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 10);
      fondo.lineStyle(3, 0x3a2c10, 1);
      fondo.strokeRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 10);
    };
    dibujar(false);
    const t = this.add.text(0, 0, texto, {
      fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff3c4', fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([fondo, t]);
    cont.setSize(ancho, alto);
    cont.setInteractive(new Phaser.Geom.Rectangle(-ancho / 2, -alto / 2, ancho, alto),
      Phaser.Geom.Rectangle.Contains);
    cont.on('pointerover', () => dibujar(true));
    cont.on('pointerout', () => dibujar(false));
    cont.on('pointerdown', () => {
      if (AJ.Sonido) { try { AJ.Sonido.desbloquear(); AJ.Sonido.click(); } catch (e) {} }
      try { onClick(); } catch (e) { console.error(e); }
    });
    return cont;
  }
};
