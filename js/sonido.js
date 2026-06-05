/* =====================================================================
 * sonido.js — Efectos procedurales con Web Audio (FASE P2, CONFIG.sonido)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.sonido. TODOS los sonidos se GENERAN con la
 * Web Audio API (osciladores + envolventes + ruido): cero descargas.
 *
 * Autoplay: los navegadores bloquean el audio hasta un gesto del usuario.
 * El AudioContext se crea perezoso y se "desbloquea" en el primer
 * teclazo/toque. Si el navegador igual lo bloquea, los sonidos se saltean
 * en silencio (nunca rompen el juego). Botón de mute visible (DOM).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Sonido = (function () {
  'use strict';

  let ctx = null;
  let master = null;
  let muteado = false;
  let listo = false;

  const MUTE_KEY = 'aj_mute_v1';

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.sonido); }

  function _leerMute() {
    try { return window.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
  }
  function _guardarMute(v) {
    try { window.localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) {}
  }

  function _ctx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muteado ? 0 : 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  // Desbloquea el audio tras un gesto del usuario.
  function desbloquear() {
    if (!activo()) return;
    const c = _ctx();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
  }

  // --- Síntesis básica ------------------------------------------------

  // Un tono con envolvente ADSR simple (opcionalmente con glissando a freq2).
  function _tono(freq, dur, tipo, vol, freq2) {
    if (!activo() || muteado) return;
    const c = _ctx();
    if (!c || c.state !== 'running') return;
    try {
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = tipo || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch (e) {}
  }

  // Ruido corto (para pasos): buffer de ruido filtrado.
  function _ruido(dur, vol, freqFiltro) {
    if (!activo() || muteado) return;
    const c = _ctx();
    if (!c || c.state !== 'running') return;
    try {
      const t = c.currentTime;
      const n = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const data = buf.getChannelData(0);
      let s = 12345;
      for (let i = 0; i < n; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        data[i] = ((s / 0x7fffffff) * 2 - 1) * (1 - i / n); // decae
      }
      const src = c.createBufferSource(); src.buffer = buf;
      const filtro = c.createBiquadFilter();
      filtro.type = 'lowpass'; filtro.frequency.value = freqFiltro || 700;
      const g = c.createGain(); g.gain.value = vol || 0.15;
      src.connect(filtro); filtro.connect(g); g.connect(master);
      src.start(t);
    } catch (e) {}
  }

  // --- Efectos del juego ----------------------------------------------

  let _pasoAlt = false;
  function paso() { _pasoAlt = !_pasoAlt; _ruido(0.07, 0.10, _pasoAlt ? 600 : 480); }
  function dialogo() { _tono(420, 0.06, 'square', 0.10); }
  function dialogoCerrar() { _tono(300, 0.05, 'square', 0.08); }
  function click() { _tono(520, 0.07, 'triangle', 0.14, 640); }
  function cosecha() { _tono(660, 0.10, 'sine', 0.16, 880); }
  function plantar() { _tono(300, 0.09, 'sine', 0.10, 420); }
  function moneda() { _tono(880, 0.07, 'square', 0.12); setTimeout(() => _tono(1320, 0.09, 'square', 0.12), 70); }
  function craft() { _tono(440, 0.08, 'triangle', 0.13, 560); setTimeout(() => _tono(660, 0.10, 'triangle', 0.13), 80); }
  function mision() {
    // Arpegio alegre ascendente.
    const notas = [523, 659, 784, 1047];
    notas.forEach((f, i) => setTimeout(() => _tono(f, 0.16, 'triangle', 0.16), i * 90));
  }
  function viaje() { _tono(500, 0.18, 'sine', 0.12, 260); }

  // --- Mute ------------------------------------------------------------

  function setMute(v) {
    muteado = !!v;
    _guardarMute(muteado);
    if (master) master.gain.value = muteado ? 0 : 0.5;
    _refrescarBoton();
  }
  function toggleMute() { setMute(!muteado); }
  function estaMuteado() { return muteado; }

  function _refrescarBoton() {
    const b = document.getElementById('btn-mute');
    if (b) { b.textContent = muteado ? '🔇' : '🔊'; b.setAttribute('aria-label', muteado ? 'Activar sonido' : 'Silenciar'); }
  }

  // --- Init ------------------------------------------------------------

  function init() {
    if (!activo() || listo) return;
    listo = true;
    muteado = _leerMute();

    // Desbloquear el audio en el primer gesto.
    const unlock = () => { desbloquear(); };
    window.addEventListener('keydown', unlock, { once: false });
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });

    // Botón de mute (DOM, visible en todas las escenas).
    const b = document.getElementById('btn-mute');
    if (b) {
      b.style.display = 'flex';
      b.addEventListener('click', (e) => { e.preventDefault(); desbloquear(); toggleMute(); });
      _refrescarBoton();
    }
  }

  return {
    activo, init, desbloquear, setMute, toggleMute, estaMuteado,
    paso, dialogo, dialogoCerrar, click, cosecha, plantar, moneda, craft, mision, viaje,
  };
})();
