/* =====================================================================
 * accesibilidad.js — Opciones de accesibilidad (E2, CONFIG.accesibilidad)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.accesibilidad. Son OPCIONES QUE ELIGE EL
 * JUGADOR, no cambios de default:
 *   - Velocidad de texto del diálogo (lento / normal / rápido / instantáneo).
 *     ↳ Esto esquiva el debate de "qué ritmo es el correcto": se lo damos al
 *       jugador en vez de adivinarlo.
 *   - Tamaño de texto del diálogo (normal / grande).
 *   - Alto contraste (botones y panel de diálogo más marcados).
 *
 * Se guardan en localStorage (preferencia del jugador, vale para todas las
 * partidas). Si el flag está off, todo queda como el default original.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Accesibilidad = (function () {
  'use strict';

  const KEY = 'aj_a11y_v1';
  let cfg = null;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.accesibilidad); }

  function _cargar() {
    try { cfg = JSON.parse(window.localStorage.getItem(KEY)) || {}; }
    catch (e) { cfg = {}; }
    if (!cfg.velTexto) cfg.velTexto = 'normal';
    if (!cfg.tamTexto) cfg.tamTexto = 'normal';
    if (cfg.contraste == null) cfg.contraste = false;
    return cfg;
  }
  function _cfg() { if (!cfg) _cargar(); return cfg; }
  function _guardar() { try { window.localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  // Getters que leen los sistemas (con el flag off devuelven el default original).
  function velTextoMs() {
    if (!activo()) return 0; // 0 = instantáneo (comportamiento original)
    const v = _cfg().velTexto;
    return v === 'lento' ? 55 : v === 'normal' ? 28 : v === 'rapido' ? 12 : 0;
  }
  function escalaTexto() { return activo() && _cfg().tamTexto === 'grande' ? 1.3 : 1; }
  function contraste() { return activo() && _cfg().contraste; }

  function aplicar() {
    try { document.body.classList.toggle('alto-contraste', contraste()); } catch (e) {}
  }

  function init() { _cargar(); aplicar(); }

  function _set(k, v) { _cfg()[k] = v; _guardar(); aplicar(); }
  function _ciclar(k, valores) {
    const c = _cfg();
    const i = valores.indexOf(c[k]);
    _set(k, valores[(i + 1) % valores.length]);
  }

  // --- Panel de opciones (overlay reutilizable en cualquier escena) ---
  let panel = null;

  function abrirPanel(scene) {
    if (!scene) return;
    _cerrarPanel(); // por si quedó uno de otra escena
    const W = scene.scale.width, H = scene.scale.height;
    const cont = scene.add.container(0, 0).setScrollFactor(0).setDepth(13500).setVisible(true);
    const fondo = scene.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0, 0).setInteractive();
    const pw = 460, ph = 320;
    const g = scene.add.graphics();
    g.fillStyle(0x231a10, 0.99); g.fillRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    g.lineStyle(3, 0xf3d9a0, 1); g.strokeRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    const titulo = scene.add.text(W / 2, (H - ph) / 2 + 16, 'ACCESIBILIDAD', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#f5d020', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    cont.add([fondo, g, titulo]);

    const filas = [];
    const mkFila = (y, etiqueta, valorFn, onClick) => {
      const t = scene.add.text(W / 2, y, '', {
        fontFamily: 'monospace', fontSize: '17px', color: '#fff7e6',
        backgroundColor: '#00000000', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const pintar = () => t.setText(etiqueta + ':  ‹ ' + valorFn() + ' ›');
      pintar();
      t.on('pointerover', () => t.setBackgroundColor('#4a3a1f'));
      t.on('pointerout', () => t.setBackgroundColor('#00000000'));
      t.on('pointerdown', () => { if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} } onClick(); pintar(); });
      cont.add(t); filas.push(t);
    };
    const y0 = (H - ph) / 2 + 64;
    const nombreVel = { lento: 'Lento', normal: 'Normal', rapido: 'Rápido', instantaneo: 'Instantáneo' };
    mkFila(y0, 'Velocidad de texto', () => nombreVel[_cfg().velTexto] || _cfg().velTexto,
      () => _ciclar('velTexto', ['lento', 'normal', 'rapido', 'instantaneo']));
    mkFila(y0 + 44, 'Tamaño de texto', () => (_cfg().tamTexto === 'grande' ? 'Grande' : 'Normal'),
      () => _ciclar('tamTexto', ['normal', 'grande']));
    mkFila(y0 + 88, 'Alto contraste', () => (_cfg().contraste ? 'Sí' : 'No'),
      () => _set('contraste', !_cfg().contraste));

    const ayuda = scene.add.text(W / 2, y0 + 130,
      'Tocá cada opción para cambiarla. Se guarda para todas tus partidas.', {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#cdbfa0', align: 'center',
        wordWrap: { width: pw - 40 },
      }).setOrigin(0.5, 0);
    const volver = scene.add.text(W / 2, (H + ph) / 2 - 28, '« Volver', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f3d9a0',
      backgroundColor: '#5a3a1f', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    volver.on('pointerdown', () => { if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} } _cerrarPanel(); });
    cont.add([ayuda, volver]);

    panel = { cont, scene };
    if (AJ.Juice) AJ.Juice.aparecer(scene, cont);
  }

  function _cerrarPanel() {
    if (panel && panel.cont) { try { panel.cont.destroy(); } catch (e) {} }
    panel = null;
  }

  return {
    activo, init, aplicar, abrirPanel,
    velTextoMs, escalaTexto, contraste,
    cfg: _cfg, set: _set,
  };
})();
