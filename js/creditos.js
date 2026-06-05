/* =====================================================================
 * creditos.js — Pantalla de créditos (E3, CONFIG.creditos)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.creditos. Overlay reutilizable accesible desde
 * el menú de pausa, el título y la pantalla final. Texto GENÉRICO: sin
 * nombres reales, sin marcas, sin programas. QoL, no toca nada.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Creditos = (function () {
  'use strict';

  let actual = null;

  const LINEAS = [
    'Un juego costumbrista pampeano,',
    'ficticio pero con olor a campo.',
    '',
    'Motor:  Phaser 3 (por CDN).',
    'Arte y sonido:  generados por código.',
    'Cero descargas. Abre con doble clic.',
    '',
    'Sin apuestas ni azar con plata.',
    'Hecho para jugar y cuidar tu pueblo.',
    '',
    '¡Gracias por ser Agente Juvenil!',
  ];

  function abrir(scene) {
    if (!scene) return;
    cerrar();
    const W = scene.scale.width, H = scene.scale.height;
    const cont = scene.add.container(0, 0).setScrollFactor(0).setDepth(13500).setVisible(true);
    const fondo = scene.add.rectangle(0, 0, W, H, 0x000000, 0.72).setOrigin(0, 0).setInteractive();
    const pw = 480, ph = 400;
    const g = scene.add.graphics();
    g.fillStyle(0x2a1f12, 0.99); g.fillRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 16);
    g.lineStyle(3, 0xf3d9a0, 1); g.strokeRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 16);
    const titulo = scene.add.text(W / 2, (H - ph) / 2 + 18, 'AGENTE JUVENIL', {
      fontFamily: 'Georgia, serif', fontSize: '28px', color: '#f5d020', fontStyle: 'bold',
      stroke: '#1c1a17', strokeThickness: 4,
    }).setOrigin(0.5, 0);
    const subt = scene.add.text(W / 2, (H - ph) / 2 + 54, 'La Pampa', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#e98a4b', fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    const cuerpo = scene.add.text(W / 2, (H - ph) / 2 + 92, LINEAS.join('\n'), {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#fff7e6',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const volver = scene.add.text(W / 2, (H + ph) / 2 - 28, '« Volver', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f3d9a0',
      backgroundColor: '#5a3a1f', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    volver.on('pointerdown', () => { if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} } cerrar(); });
    cont.add([fondo, g, titulo, subt, cuerpo, volver]);
    actual = cont;
    if (AJ.Juice) AJ.Juice.aparecer(scene, cont);
  }

  function cerrar() {
    if (actual) { try { actual.destroy(); } catch (e) {} }
    actual = null;
  }

  return { abrir, cerrar };
})();
