/* =====================================================================
 * estadisticas.js — Estadísticas de sesión (F4, CONFIG.estadisticas)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.estadisticas. Contadores ACUMULADOS entre todas
 * las partidas, guardados en localStorage (aparte del save del juego):
 *   - tiempo total jugado, pasos caminados, NPCs conocidos (distintos),
 *     diálogos leídos, misiones completadas por pueblo.
 * Sólo lectura para el panel de Progreso (E1). No toca el balance.
 *
 * Para no escribir localStorage en cada frame, acumula en memoria y hace
 * flush() periódico (lo llama el autoguardado del Pueblo) y al cerrar.
 * Si el flag está off, no cuenta nada (los hooks son no-op).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Stats = (function () {
  'use strict';

  const KEY = 'aj_stats_v1';
  let s = null, sucio = false;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.estadisticas); }

  function _cargar() {
    try { s = JSON.parse(window.localStorage.getItem(KEY)) || {}; }
    catch (e) { s = {}; }
    if (typeof s.tiempoTotal !== 'number') s.tiempoTotal = 0;
    if (typeof s.pasos !== 'number') s.pasos = 0;
    if (typeof s.dialogos !== 'number') s.dialogos = 0;
    if (!s.npcs || typeof s.npcs !== 'object') s.npcs = {};
    if (!s.misionesPorPueblo || typeof s.misionesPorPueblo !== 'object') s.misionesPorPueblo = {};
    return s;
  }
  function _s() { if (!s) _cargar(); return s; }

  function flush() {
    if (!sucio) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); sucio = false; } catch (e) {}
  }

  function sumarTiempo(dt) { if (!activo()) return; _s().tiempoTotal += (dt || 0); sucio = true; }
  function sumarPaso() { if (!activo()) return; _s().pasos += 1; sucio = true; }
  function sumarDialogo() { if (!activo()) return; _s().dialogos += 1; sucio = true; }
  function registrarNpc(id) {
    if (!activo() || !id) return;
    if (!_s().npcs[id]) { _s().npcs[id] = true; sucio = true; }
  }
  function registrarMision(pueblo) {
    if (!activo()) return;
    const pu = pueblo || 1;
    _s().misionesPorPueblo[pu] = (_s().misionesPorPueblo[pu] || 0) + 1;
    sucio = true;
  }

  function datos() {
    const d = _s();
    let misTot = 0;
    Object.keys(d.misionesPorPueblo).forEach((k) => { misTot += d.misionesPorPueblo[k]; });
    return {
      tiempoTotal: d.tiempoTotal,
      pasos: d.pasos,
      dialogos: d.dialogos,
      npcsConocidos: Object.keys(d.npcs).length,
      misionesPorPueblo: d.misionesPorPueblo,
      misionesTotal: misTot,
    };
  }

  // Para tests: reset.
  function _reset() { s = { tiempoTotal: 0, pasos: 0, dialogos: 0, npcs: {}, misionesPorPueblo: {} }; sucio = true; flush(); }

  function init() {
    _cargar();
    try { window.addEventListener('beforeunload', flush); } catch (e) {}
  }

  return {
    activo, init, flush, datos,
    sumarTiempo, sumarPaso, sumarDialogo, registrarNpc, registrarMision, _reset,
  };
})();
