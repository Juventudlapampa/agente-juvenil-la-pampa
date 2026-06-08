/* =====================================================================
 * guardado.js — Persistencia robusta en localStorage
 * ---------------------------------------------------------------------
 * Nunca crashea: si localStorage no está disponible (modo incógnito,
 * file:// con restricciones, etc.) cae a un guardado en memoria para que
 * el juego siga andando igual.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Guardado = (function () {
  'use strict';

  let memoria = null; // fallback si no hay localStorage

  function hayLocalStorage() {
    try {
      const k = '__aj_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  const DISPONIBLE = hayLocalStorage();

  // Estado por defecto de una partida nueva.
  function estadoNuevo() {
    return {
      version: 1,
      jugador: { x: AJ.Mapa.SPAWN.x, y: AJ.Mapa.SPAWN.y, dir: 'abajo' },
      mapaActual: 1,       // id del pueblo donde está el jugador (FASE D)
      misiones: {},        // id -> 'activa' | 'completada'
      misionActiva: null,  // id de la misión a mostrar en pantalla
      inventario: { monedas: 0, logros: [], items: {} }, // items: ingredientes/objetos (FASE C)
      tiempo: { minutos: 8 * 60, dia: 1 }, // arranca Día 1, 08:00
      granja: {},          // "x,y" -> { etapa, plantadoEnMin }
      afinidad: {},        // id de NPC -> afinidad 0..100 (FASE A)
      registro: { vecinos: {}, pueblos: {} }, // Registro del Agente (D3)
      tiempoJugado: 0,     // segundos reales jugados (E1)
      gestion: {},         // estado del Modo Gestión por pueblo (G1; lo arma AJ.Gestion)
      interior: null,      // si el jugador está dentro de un edificio (O2): { edificio, pueblo, x, y, dir }
    };
  }

  function existe() {
    try {
      if (DISPONIBLE) return window.localStorage.getItem(AJ.SAVE_KEY) != null;
      return memoria != null;
    } catch (e) { return false; }
  }

  function guardar(estado) {
    try {
      const txt = JSON.stringify(estado);
      if (DISPONIBLE) window.localStorage.setItem(AJ.SAVE_KEY, txt);
      else memoria = txt;
      return true;
    } catch (e) {
      console.warn('[Guardado] No se pudo guardar:', e);
      try { memoria = JSON.stringify(estado); } catch (_) {}
      return false;
    }
  }

  function cargar() {
    try {
      const txt = DISPONIBLE ? window.localStorage.getItem(AJ.SAVE_KEY) : memoria;
      if (!txt) return null;
      const est = JSON.parse(txt);
      // Migración defensiva: completar campos faltantes.
      const base = estadoNuevo();
      return Object.assign(base, est, {
        jugador: Object.assign(base.jugador, est.jugador || {}),
        inventario: Object.assign(base.inventario, est.inventario || {}),
        tiempo: Object.assign(base.tiempo, est.tiempo || {}),
        granja: est.granja || {},
        misiones: est.misiones || {},
        afinidad: est.afinidad || {},
        mapaActual: est.mapaActual || 1,
        registro: est.registro && est.registro.vecinos
          ? { vecinos: est.registro.vecinos || {}, pueblos: est.registro.pueblos || {} }
          : { vecinos: {}, pueblos: {} },
        tiempoJugado: est.tiempoJugado || 0,
        gestion: (est.gestion && typeof est.gestion === 'object') ? est.gestion : {},
        interior: (est.interior && typeof est.interior === 'object') ? est.interior : null,
      });
    } catch (e) {
      console.warn('[Guardado] Save corrupto, ignoro:', e);
      return null;
    }
  }

  function borrar() {
    try {
      if (DISPONIBLE) window.localStorage.removeItem(AJ.SAVE_KEY);
      memoria = null;
      return true;
    } catch (e) { return false; }
  }

  return { estadoNuevo, existe, guardar, cargar, borrar, DISPONIBLE };
})();
