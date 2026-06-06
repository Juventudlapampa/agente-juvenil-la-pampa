/* =====================================================================
 * gestion/comunidades.js — DESCUBRIMIENTO E INTEGRACIÓN (G6, CONFIG.comunidades)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.comunidades (requiere modoGestion + cicloGestion).
 * Implementa GDD §5:
 *   - En pueblos chicos (nivel 1–3) las comunidades arrancan OCULTAS y se
 *     revelan explorando/hablando/diagnóstico (lo más común primero; las raras
 *     son el "hallazgo"). Hay comunidades LATENTES que el jugador puede activar.
 *   - En las capitales (nivel 4) están las 10 y el modo se INVIERTE: integración.
 *     Actividades-puente que juntan comunidades distintas valen más.
 *   - Una actividad acierta más si apunta a una comunidad que EXISTE y que
 *     CONOCÉS → bonus de tirada por Conocimiento (engancha en G4/G5).
 *
 * Es 100% aditivo: extiende AJ.Gestion.Comunidades y le enchufa el bonus a
 * AJ.Gestion.Actividades (G5). Si el flag está off, no cambia nada.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Comunidades = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.comunidades); }

  function puebloActual(estado) { E.asegurar(estado, null); return D.pueblo(estado.gestion.actual); }
  function esIntegracion(estado) { const p = puebloActual(estado); return !!(p && p.nivel >= 4); }

  // ids de comunidades del pueblo, ordenadas por rareza ascendente (común primero).
  function delPueblo(estado) {
    const p = puebloActual(estado); if (!p) return [];
    return (p.comunidades || []).slice().sort((a, b) => {
      const ca = D.comunidad(a), cb = D.comunidad(b);
      return (ca ? ca.rareza : 9) - (cb ? cb.rareza : 9);
    });
  }
  function _ep(estado) { return E.actual(estado); }
  function descubiertas(ep) { return ep && ep.comunidadesDescubiertas ? Object.keys(ep.comunidadesDescubiertas) : []; }
  function conocida(estado, comId) { const ep = _ep(estado); return !!(ep && ep.comunidadesDescubiertas && ep.comunidadesDescubiertas[comId]); }
  function ocultas(estado) {
    const ep = _ep(estado); const d = (ep && ep.comunidadesDescubiertas) || {};
    return delPueblo(estado).filter((id) => !d[id]);
  }

  // Revela la próxima comunidad oculta (la más común primero).
  function revelarUna(estado) {
    const ep = _ep(estado); if (!ep) return null;
    const oc = ocultas(estado); if (!oc.length) return null;
    ep.comunidadesDescubiertas[oc[0]] = true;
    return D.comunidad(oc[0]);
  }
  function revelarVarias(estado, n) {
    const out = []; for (let i = 0; i < (n || 1); i++) { const c = revelarUna(estado); if (!c) break; out.push(c); }
    return out;
  }

  // Comunidades LATENTES: no están en el pueblo pero el jugador puede activarlas
  // (sembrar una movida nueva). Nivel 1–3: las 2 más raras que el pueblo NO tiene.
  function latentes(estado) {
    const p = puebloActual(estado); if (!p || p.nivel >= 4) return [];
    const tiene = {}; (p.comunidades || []).forEach((id) => { tiene[id] = true; });
    return D.COMUNIDADES.filter((c) => !tiene[c.id]).sort((a, b) => b.rareza - a.rareza).slice(0, 2).map((c) => c.id);
  }
  function activarLatente(estado, comId) {
    const ep = _ep(estado); if (!ep) return null;
    if (latentes(estado).indexOf(comId) < 0) return null; // sólo las latentes válidas
    if (!ep.comunidadesActivadas) ep.comunidadesActivadas = {};
    ep.comunidadesActivadas[comId] = true;
    ep.comunidadesDescubiertas[comId] = true; // activarla la hace conocida
    return D.comunidad(comId);
  }

  // Comunidades "presentes": las del pueblo + las latentes activadas.
  function presentes(estado) {
    const ep = _ep(estado);
    const base = (puebloActual(estado).comunidades || []).slice();
    const act = ep && ep.comunidadesActivadas ? Object.keys(ep.comunidadesActivadas) : [];
    act.forEach((id) => { if (base.indexOf(id) < 0) base.push(id); });
    return base;
  }

  // En las capitales (nivel 4) el modo es integración: todo está y se conoce.
  function prepararPueblo(estado) {
    if (!activo()) return;
    const ep = _ep(estado);
    if (ep && esIntegracion(estado)) {
      // "todo conocido" incluye cualquier latente activada presente (defensivo:
      // hoy no se pueden sembrar latentes en nivel 4, pero cubre saves migrados).
      presentes(estado).forEach((id) => { ep.comunidadesDescubiertas[id] = true; });
    }
  }

  // Bonus de tirada de una actividad: +2 por cada comunidad afín que EXISTE y
  // CONOCÉS (cap +6). En integración (todo conocido) premia apuntar bien.
  function bonusActividad(estado, act) {
    if (!activo() || !act) return 0;
    const ep = _ep(estado); if (!ep) return 0;
    const pres = {}; presentes(estado).forEach((id) => { pres[id] = true; });
    const conoc = ep.comunidadesDescubiertas || {};
    let n = 0;
    (act.comunidadesAfines || []).forEach((id) => { if (pres[id] && conoc[id]) n++; });
    return Math.min(6, n * 2);
  }

  return {
    activo, esIntegracion, delPueblo, descubiertas, conocida, ocultas,
    revelarUna, revelarVarias, latentes, activarLatente, presentes, prepararPueblo, bonusActividad,
  };
})();

/* --- Enchufes en el motor (aditivos, sólo si el flag está on) ------- */
(function () {
  'use strict';
  const G = AJ.Gestion;
  if (!G.Actividades) return;

  // Bonus de tirada por comunidad conocida (sobrescribe el stub de G5).
  G.Actividades.bonusComunidad = function (estado, act) {
    try { return G.Comunidades.bonusActividad(estado, act); } catch (e) { return 0; }
  };

  // ACTIVIDAD-PUENTE (integración, GDD §5): junta comunidades conocidas, vale
  // más y es un poco más difícil. comIds = comunidades a juntar.
  G.Actividades.resolverPuente = function (estado, comIds) {
    const T = AJ.Gestion.Tiradas;
    const conoc = (comIds || []).filter((id) => G.Comunidades.conocida(estado, id));
    const n = conoc.length;
    const base = { conocimiento: 4 + 2 * n, vinculoEscolar: 3, agencia: n >= 2 ? 1 : 0, confianza: -5 };
    const bonus = Math.min(8, 2 * n);
    const r = T.aplicar(estado, base, { dificultad: 14, medidores: ['conocimiento', 'confianza', 'conviccion'], bonus: bonus });
    return { puente: true, comunidades: conoc, tirada: r.tirada, impactosReales: r.impactosReales };
  };
})();
