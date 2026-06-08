/* =====================================================================
 * main.js — Arranque del juego, input unificado y registro de escenas
 * ---------------------------------------------------------------------
 * Crea el juego Phaser, define el estado de input (teclado + táctil) y
 * arranca en la pantalla de Título.
 * ===================================================================== */

window.AJ = window.AJ || {};

/* --------------------- Input unificado (AJ.Input) -------------------- */
AJ.Input = (function () {
  'use strict';

  // Estado leído por el jugador cada frame.
  const estado = { up: false, down: false, left: false, right: false };
  // Flag de "acción" (espacio/E/boton). Se consume con tomarAccion().
  let accionPendiente = false;

  function setDir(prop, val) { if (prop in estado) estado[prop] = val; }
  function disparAccion() { accionPendiente = true; }
  function tomarAccion() {
    if (accionPendiente) { accionPendiente = false; return true; }
    return false;
  }

  // --- Teclado ---
  // Si el foco está en un campo editable (input/textarea/select/contenteditable),
  // el teclado del juego NO intercepta: así se puede tipear el nombre del Agente
  // (letras w/a/s/d/e y espacio) sin que el juego se las "coma".
  function enCampoEditable(e) {
    const el = (e && e.target) || document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function conectarTeclado() {
    const map = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
    };
    window.addEventListener('keydown', (e) => {
      if (enCampoEditable(e)) return;
      if (map[e.code]) { setDir(map[e.code], true); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        disparAccion(); e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (enCampoEditable(e)) return;
      if (map[e.code]) { setDir(map[e.code], false); e.preventDefault(); }
    });
    // Soltar todo si la ventana pierde foco (evita "quedarse caminando").
    window.addEventListener('blur', resetDirs);
  }

  function resetDirs() {
    estado.up = estado.down = estado.left = estado.right = false;
  }

  // --- Controles táctiles (botones HTML en el DOM) ---
  function conectarTactil() {
    const bind = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on = (e) => { e.preventDefault(); setDir(prop, true); el.classList.add('presionado'); };
      const off = (e) => { e.preventDefault(); setDir(prop, false); el.classList.remove('presionado'); };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    };
    bind('btn-arriba', 'up');
    bind('btn-abajo', 'down');
    bind('btn-izq', 'left');
    bind('btn-der', 'right');

    const acc = document.getElementById('btn-accion');
    if (acc) {
      const fire = (e) => { e.preventDefault(); disparAccion(); acc.classList.add('presionado'); };
      const rel = (e) => { e.preventDefault(); acc.classList.remove('presionado'); };
      acc.addEventListener('touchstart', fire, { passive: false });
      acc.addEventListener('touchend', rel, { passive: false });
      acc.addEventListener('mousedown', fire);
      acc.addEventListener('mouseup', rel);
    }
  }

  // Muestra los controles táctiles si el dispositivo tiene pantalla táctil.
  function mostrarTactilSiCorresponde() {
    const esTactil = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const cont = document.getElementById('tactil');
    if (cont && esTactil) cont.classList.add('visible');
  }

  function init() {
    try { conectarTeclado(); } catch (e) { console.warn('[Input] teclado falló', e); }
    try { conectarTactil(); } catch (e) { console.warn('[Input] táctil falló', e); }
    try { mostrarTactilSiCorresponde(); } catch (e) {}
  }

  return { estado, init, tomarAccion, disparAccion, resetDirs };
})();

/* --------------------------- Arranque -------------------------------- */
AJ.iniciarJuego = function () {
  try {
    AJ.Input.init();
    if (AJ.Sonido) { try { AJ.Sonido.init(); } catch (e) { console.warn('[main] sonido off', e); } }
    if (AJ.Joystick) { try { AJ.Joystick.init(); } catch (e) { console.warn('[main] joystick off', e); } }
    if (AJ.Accesibilidad) { try { AJ.Accesibilidad.init(); } catch (e) { console.warn('[main] accesibilidad off', e); } }
    if (AJ.Agente) { try { AJ.Agente.init(); } catch (e) { console.warn('[main] agente off', e); } }
    if (AJ.Stats) { try { AJ.Stats.init(); } catch (e) { console.warn('[main] stats off', e); } }
    // P3: estilo de UI pulida (gateado por flag; el CSS lee la clase del body).
    try { if (AJ.CONFIG.uiPulida) document.body.classList.add('ui-pulida'); } catch (e) {}

    const config = {
      type: Phaser.AUTO,
      parent: 'juego',
      width: 800,
      height: 600,
      pixelArt: true,
      backgroundColor: '#2d2a26',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [AJ.EscenaTitulo, AJ.EscenaApertura, AJ.EscenaPueblo, AJ.EscenaFinal]
        .filter(Boolean),
    };

    AJ.juego = new Phaser.Game(config);
    return AJ.juego;
  } catch (e) {
    console.error('[main] No se pudo iniciar el juego:', e);
    const cont = document.getElementById('juego');
    if (cont) cont.innerHTML =
      '<p style="color:#fff;padding:20px;font-family:sans-serif">' +
      'Ups, no se pudo iniciar el juego. Revisá la consola.</p>';
  }
};

// Esperar a que el DOM y Phaser estén listos.
window.addEventListener('load', function () {
  if (typeof Phaser === 'undefined') {
    console.error('[main] Phaser no cargó (revisá la conexión / CDN).');
    const cont = document.getElementById('juego');
    if (cont) cont.innerHTML =
      '<p style="color:#fff;padding:20px;font-family:sans-serif">' +
      'No se pudo cargar Phaser desde el CDN. Necesitás conexión a internet ' +
      'la primera vez.</p>';
    return;
  }
  AJ.iniciarJuego();
});
