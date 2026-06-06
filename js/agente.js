/* =====================================================================
 * agente.js — Identidad del Agente / Creador (F1, CONFIG.creadorAgente)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.creadorAgente. Al empezar una partida nueva el
 * jugador elige: nombre (máx 12), pronombre (él/ella/elle) y variante
 * visual (4 recoloreos del sprite base existente, SIN arte nuevo).
 * Se guarda en localStorage y se usa en los diálogos (el nombre reemplaza
 * "Agente" como vocativo, sin tocar el título "Agente Juvenil").
 *
 * Variante 0 = colores originales -> con el flag off / variante 0 el sprite
 * y los diálogos quedan EXACTAMENTE como antes (cero regresión).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Agente = (function () {
  'use strict';

  const KEY = 'aj_agente_v1';
  let data = null;

  // 4 variantes de camisa+gorra (la 0 = original: camisa celeste, gorra azul).
  const VARIANTES = [
    { nombre: 'Celeste', camisa: 0x4a8fc4, gorra: 0x2f6aa0 },
    { nombre: 'Bordó',   camisa: 0xb84a4a, gorra: 0x7a2f2f },
    { nombre: 'Verde',   camisa: 0x4aa86a, gorra: 0x2f7a4a },
    { nombre: 'Mostaza', camisa: 0xc4a24a, gorra: 0x8a6a2f },
  ];

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.creadorAgente); }

  function _cargar() {
    try { data = JSON.parse(window.localStorage.getItem(KEY)) || {}; }
    catch (e) { data = {}; }
    if (typeof data.nombre !== 'string') data.nombre = '';
    if (['el', 'ella', 'elle'].indexOf(data.pronombre) < 0) data.pronombre = 'elle';
    if (typeof data.variante !== 'number' || data.variante < 0 || data.variante > 3) data.variante = 0;
    return data;
  }
  function _data() { if (!data) _cargar(); return data; }
  function _guardar() { try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  function nombre() { return (_data().nombre || '').trim(); }
  function pronombre() { return _data().pronombre; }
  function variante() { return _data().variante; }
  function set(k, v) { _data()[k] = v; _guardar(); }

  function colores() {
    const v = VARIANTES[variante()] || VARIANTES[0];
    return {
      camisa: v.camisa,
      camisaB: Phaser.Display.Color.IntegerToColor(v.camisa).darken(15).color,
      gorra: v.gorra,
    };
  }

  // Reemplaza el vocativo "Agente" por el nombre elegido (sin tocar
  // "Agente Juvenil"). Si no hay nombre o el flag está off, devuelve igual.
  function aplicarNombre(texto) {
    if (!activo() || !nombre() || typeof texto !== 'string') return texto;
    try { return texto.replace(/\bAgente\b(?! Juvenil)/g, nombre()); } catch (e) { return texto; }
  }

  function init() { _cargar(); }

  function _hex(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }

  // --- Creador (overlay DOM) ------------------------------------------
  let overlay = null;

  function abrirCreador(scene, onConfirm) {
    cerrarCreador();
    _cargar();
    const ov = document.createElement('div');
    ov.id = 'creador-agente';
    ov.className = 'modal-dom';

    const panel = document.createElement('div');
    panel.className = 'modal-panel';
    ov.appendChild(panel);

    const h = document.createElement('h2'); h.textContent = 'Creá tu Agente'; panel.appendChild(h);

    // Nombre
    const lblN = document.createElement('label'); lblN.textContent = 'Nombre (máx. 12):'; panel.appendChild(lblN);
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 12; inp.value = data.nombre || '';
    inp.placeholder = 'Agente'; inp.autocomplete = 'off'; inp.className = 'creador-input';
    panel.appendChild(inp);

    // Pronombre
    const lblP = document.createElement('label'); lblP.textContent = 'Pronombre:'; panel.appendChild(lblP);
    const filaP = document.createElement('div'); filaP.className = 'creador-fila'; panel.appendChild(filaP);
    let pron = data.pronombre;
    const botonesP = [];
    [['el', 'él'], ['ella', 'ella'], ['elle', 'elle']].forEach(([val, txt]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.className = 'creador-opt';
      const pintar = () => { b.classList.toggle('sel', pron === val); };
      pintar();
      b.addEventListener('click', () => { pron = val; botonesP.forEach((x) => x.pintar()); });
      filaP.appendChild(b); botonesP.push({ pintar });
    });

    // Variante visual
    const lblV = document.createElement('label'); lblV.textContent = 'Variante visual:'; panel.appendChild(lblV);
    const filaV = document.createElement('div'); filaV.className = 'creador-fila'; panel.appendChild(filaV);
    let varSel = data.variante;
    const botonesV = [];
    VARIANTES.forEach((v, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'creador-swatch';
      b.title = v.nombre;
      b.style.background = _hex(v.camisa);
      b.style.borderColor = _hex(v.gorra);
      const pintar = () => { b.classList.toggle('sel', varSel === i); };
      pintar();
      b.addEventListener('click', () => { varSel = i; botonesV.forEach((x) => x.pintar()); });
      filaV.appendChild(b); botonesV.push({ pintar });
    });

    // Acciones
    const filaB = document.createElement('div'); filaB.className = 'creador-fila acciones'; panel.appendChild(filaB);
    const bVolver = document.createElement('button'); bVolver.type = 'button'; bVolver.textContent = 'Volver'; bVolver.className = 'creador-btn';
    const bEmpezar = document.createElement('button'); bEmpezar.type = 'button'; bEmpezar.textContent = '¡Empezar!'; bEmpezar.className = 'creador-btn primario';
    filaB.appendChild(bVolver); filaB.appendChild(bEmpezar);

    bVolver.addEventListener('click', () => { cerrarCreador(); });
    bEmpezar.addEventListener('click', () => {
      data.nombre = (inp.value || '').trim().slice(0, 12);
      data.pronombre = pron;
      data.variante = varSel;
      _guardar();
      // Regenerar el sprite del jugador con la variante elegida: borrar las
      // texturas para que el preload del Pueblo las recree.
      try {
        ['abajo', 'arriba', 'izq', 'der'].forEach((d) => {
          for (let p = 0; p < 3; p++) {
            const k = 'jugador_' + d + '_' + p;
            if (scene && scene.textures && scene.textures.exists(k)) scene.textures.remove(k);
          }
        });
      } catch (e) {}
      if (AJ.Sonido) { try { AJ.Sonido.desbloquear(); AJ.Sonido.click(); } catch (e) {} }
      cerrarCreador();
      if (onConfirm) { try { onConfirm(); } catch (e) { console.warn('[Agente] onConfirm', e); } }
    });

    document.body.appendChild(ov);
    overlay = ov;
    setTimeout(() => { try { inp.focus(); } catch (e) {} }, 50);
  }

  function cerrarCreador() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  return {
    activo, init, nombre, pronombre, variante, set, colores, aplicarNombre,
    abrirCreador, cerrarCreador, VARIANTES,
  };
})();
