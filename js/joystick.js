/* =====================================================================
 * joystick.js — Joystick táctil analógico opcional (C2.1)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.joystickAnalogico. Es una ALTERNATIVA al d-pad
 * de botones (cuando está activo, el CSS oculta el d-pad). Alimenta el
 * mismo AJ.Input.estado (booleans up/down/left/right) con "snap" a 4
 * direcciones, así el movimiento del jugador NO cambia.
 *
 * Zona muerta y radio son tuneables y DOCUMENTADOS en CONFIG.JOYSTICK.
 * ⚠️ El feel (si responde cómodo) necesita prueba humana en celular.
 *
 * Si el flag está off o algo falla, no se inicializa: el d-pad clásico
 * sigue funcionando igual (cero riesgo).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Joystick = (function () {
  'use strict';

  let base = null, knob = null, cont = null;
  let activoToque = false;
  let idToque = null;
  let cx = 0, cy = 0; // centro del joystick en px de pantalla
  let listo = false;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.joystickAnalogico); }
  function _cfg() {
    const j = (AJ.CONFIG && AJ.CONFIG.JOYSTICK) || {};
    return { radio: j.radioMax || 55, zona: (j.zonaMuerta != null ? j.zonaMuerta : 0.3) };
  }

  // Convierte un desplazamiento (dx,dy desde el centro) en booleans de 4 dirs,
  // con zona muerta y "snap" al eje dominante. Exportado para el smoke-test.
  function dirDesde(dx, dy) {
    const { radio, zona } = _cfg();
    const mag = Math.hypot(dx, dy) / radio; // 0..1+
    const r = { up: false, down: false, left: false, right: false };
    if (mag < zona) return r; // dentro de la zona muerta: quieto
    if (Math.abs(dx) >= Math.abs(dy)) { if (dx < 0) r.left = true; else r.right = true; }
    else { if (dy < 0) r.up = true; else r.down = true; }
    return r;
  }

  function _setInput(r) {
    if (!AJ.Input || !AJ.Input.estado) return;
    AJ.Input.estado.up = r.up; AJ.Input.estado.down = r.down;
    AJ.Input.estado.left = r.left; AJ.Input.estado.right = r.right;
  }

  function _moverKnob(dx, dy) {
    if (!knob) return;
    const { radio } = _cfg();
    const mag = Math.hypot(dx, dy);
    let kx = dx, ky = dy;
    if (mag > radio) { kx = dx / mag * radio; ky = dy / mag * radio; }
    knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
  }

  function _resetKnob() {
    if (knob) knob.style.transform = 'translate(0px,0px)';
  }

  function _centro() {
    if (!base) return;
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
  }

  function _inicioToque(px, py, id) {
    activoToque = true; idToque = (id == null ? 'mouse' : id);
    _centro();
    _arrastrar(px, py);
  }
  function _arrastrar(px, py) {
    if (!activoToque) return;
    const dx = px - cx, dy = py - cy;
    _moverKnob(dx, dy);
    _setInput(dirDesde(dx, dy));
  }
  function _finToque() {
    activoToque = false; idToque = null;
    _resetKnob();
    _setInput({ up: false, down: false, left: false, right: false });
  }

  function _bind() {
    // Touch
    cont.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      e.preventDefault(); _inicioToque(t.clientX, t.clientY, t.identifier);
    }, { passive: false });
    cont.addEventListener('touchmove', (e) => {
      if (!activoToque) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === idToque) { e.preventDefault(); _arrastrar(t.clientX, t.clientY); break; }
      }
    }, { passive: false });
    const fin = (e) => { e.preventDefault(); _finToque(); };
    cont.addEventListener('touchend', fin, { passive: false });
    cont.addEventListener('touchcancel', fin, { passive: false });
    // Mouse (para probar en escritorio)
    cont.addEventListener('mousedown', (e) => { e.preventDefault(); _inicioToque(e.clientX, e.clientY, null); });
    window.addEventListener('mousemove', (e) => { if (activoToque) _arrastrar(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => { if (activoToque) _finToque(); });
  }

  function init() {
    if (listo) return;
    listo = true;
    if (!activo()) return;
    try {
      cont = document.getElementById('joystick');
      base = document.getElementById('joystick-base');
      knob = document.getElementById('joystick-knob');
      if (!cont || !base || !knob) return;
      document.body.classList.add('joystick-on'); // el CSS muestra joystick / oculta d-pad
      _bind();
    } catch (e) { console.warn('[Joystick] no se pudo iniciar', e); }
  }

  return { activo, init, dirDesde };
})();
