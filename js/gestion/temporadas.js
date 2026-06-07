/* =====================================================================
 * gestion/temporadas.js — RELOJ DE FINDES (N3, CONFIG.relojTemporadas)
 * ---------------------------------------------------------------------
 * Capa narrativa-temporal (GDD §2.bis). La unidad de tiempo del CUERPO de la
 * temporada pasa a ser el FIN DE SEMANA de activación, no el día plano:
 *   - Una TEMPORADA = 12 findes (origen "urgencia" resta findesMenos).
 *   - La SEMANA = PREPARACIÓN (gestiones de bajo costo que arman el finde).
 *   - El FINDE = EJECUCIÓN (la actividad / el dilema con el dado). Avanza el reloj.
 * Al cerrar los 12 findes: perfil de gestor de la temporada + mudarse o seguir.
 *
 * ENVUELVE el ciclo G5 (no lo reemplaza): este módulo es SÓLO LÓGICA; el
 * render del finde vive en ciclo.js (CicloUI.renderFinde, aditivo). Con el flag
 * OFF, el ciclo sigue corriendo por días 6–30 exactamente como antes.
 *
 * BOLT-ON aditivo detrás de CONFIG.relojTemporadas (requiere cicloGestion).
 * El estado de finde vive en EstadoPueblo (finde/sub/findePrep/totalFindes).
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Temporadas = (function () {
  'use strict';

  const E = AJ.Gestion.Estado;
  const C = AJ.Gestion.Ciclo;

  const FINDES_TEMPORADA = 12;  // 90 días ≈ 12 findes (GDD §2.bis C)
  const PREP_CAP = 2;           // gestiones de preparación por finde (la "semana")

  // La "semana": preparación de bajo costo que arma el finde (impactos modestos).
  // (El balance fino del impacto es criterio humano — ver PLAYTEST.)
  const PREP = [
    { id: 'permisos', nombre: 'Conseguir permisos', sub: 'Papeles y habilitaciones para el finde.', impactos: { confianza: 3 } },
    { id: 'escuela', nombre: 'Pasar por la escuela', sub: 'Avisar, coordinar, sumar familias.', impactos: { vinculoEscolar: 4 } },
    { id: 'agencia', nombre: 'Juntar a la Agencia', sub: 'Repartir tareas, darles protagonismo.', impactos: { conocimiento: 3 } },
    { id: 'recursos', nombre: 'Gestionar recursos', sub: 'Conseguir lo que falta sin gastar de más.', impactos: { confianza: 2, carisma: 2 } },
  ];

  function activo() {
    return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.cicloGestion && AJ.CONFIG.relojTemporadas);
  }

  // Total de findes de la temporada para este pueblo (origen "urgencia" resta).
  function totalFindes(ep) {
    const menos = (ep && ep.findesMenos) || 0;
    return Math.max(6, FINDES_TEMPORADA - menos);
  }

  // Asegura los campos de finde en el EstadoPueblo (migración defensiva).
  function asegurar(ep) {
    if (!ep) return ep;
    if (typeof ep.finde !== 'number' || ep.finde < 1) ep.finde = 1;
    if (ep.sub !== 'preparacion' && ep.sub !== 'ejecucion') ep.sub = 'preparacion';
    if (typeof ep.findePrep !== 'number') ep.findePrep = 0;
    if (typeof ep.totalFindes !== 'number') ep.totalFindes = totalFindes(ep);
    return ep;
  }

  function prepDef(id) { return PREP.find((p) => p.id === id) || null; }
  function prepRestantes(ep) { asegurar(ep); return Math.max(0, PREP_CAP - ep.findePrep); }
  function enEjecucion(ep) { asegurar(ep); return ep.sub === 'ejecucion'; }

  // Una gestión de preparación (gratis, no avanza el finde). Cap por finde.
  function hacerPrep(estado, prepId) {
    const ep = E.actual(estado); if (!ep) return null; asegurar(ep);
    if (ep.sub !== 'preparacion' || prepRestantes(ep) <= 0) return null;
    const p = prepDef(prepId); if (!p) return null;
    const reales = E.aplicarImpacto(ep, p.impactos);
    ep.findePrep += 1;
    return { prep: p, impactosReales: reales };
  }

  // Pasar de la semana (preparación) al finde (ejecución).
  function pasarAEjecucion(estado) {
    const ep = E.actual(estado); if (!ep) return false; asegurar(ep);
    if (ep.sub === 'preparacion') { ep.sub = 'ejecucion'; return true; }
    return false;
  }

  // Avanzar el finde (tras la ejecución). Si supera el total → cierre + perfil.
  // Devuelve { cerrado, finde?, perfil? }.
  function avanzarFinde(estado) {
    const ep = E.actual(estado); if (!ep) return null; asegurar(ep);
    ep.finde += 1; ep.findePrep = 0; ep.sub = 'preparacion';
    if (ep.finde > ep.totalFindes) {
      ep.fase = 'cerrado';
      try { ep.perfil = C.calcularPerfil(ep); } catch (e) { ep.perfil = ep.perfil || null; }
      return { cerrado: true, perfil: ep.perfil };
    }
    return { cerrado: false, finde: ep.finde };
  }

  // Seguir otra temporada en el MISMO pueblo (profundizar). Conserva medidores
  // y progreso; reinicia el reloj de findes. (La mudanza la maneja el ciclo.)
  function nuevaTemporada(estado) {
    const ep = E.actual(estado); if (!ep) return null; asegurar(ep);
    ep.finde = 1; ep.findePrep = 0; ep.sub = 'preparacion';
    ep.fase = 'gestion'; ep.perfil = null;
    ep.totalFindes = totalFindes(ep);
    ep.temporadasJugadas = (ep.temporadasJugadas || 1) + 1;
    return ep;
  }

  return {
    FINDES_TEMPORADA, PREP_CAP, PREP, activo, totalFindes, asegurar,
    prepDef, prepRestantes, enEjecucion, hacerPrep, pasarAEjecucion, avanzarFinde, nuevaTemporada,
  };
})();
