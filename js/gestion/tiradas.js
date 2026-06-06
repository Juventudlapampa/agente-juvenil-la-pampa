/* =====================================================================
 * gestion/tiradas.js — SISTEMA DE AZAR / DADO CON ARCO (G4, CONFIG.tiradas)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.tiradas (requiere modoGestion). El dado es una
 * MECÁNICA de juego (GDD §8 y §11): NUNCA dinero ni apuestas con plata real.
 *
 *   resultado = dado(1..20) + modificadores
 *
 * - ARCO suerte → competencia: con medidores bajos los modificadores son
 *   negativos/chicos y dependés del dado (suerte); a medida que gestionás bien
 *   los modificadores suben y la suerte pesa menos (competencia). Es emergente
 *   del modelo lineal: el modificador de cada medidor va de negativo (valor
 *   bajo) a positivo (valor alto).
 * - El CONOCIMIENTO es el modificador por defecto (si hiciste el diagnóstico,
 *   tirás con ventaja; de oído, a ciegas). `bonus` modela estudio/creatividad.
 * - REFERENTE SOLO paga más: penalidad fija en los modificadores.
 * - RESULTADOS GRADUADOS: crítico / éxito / éxito parcial (sale con costo) /
 *   fracaso. No es sí/no.
 *
 * Para tests, tirar() acepta `dadoForzado`. Si el flag está off, no se usa.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Tiradas = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;
  const DADO_MAX = 20;
  const PENAL_REFERENTE_SOLO = 3; // "todo cuesta el doble": tirás con -3

  function _rand20() { return 1 + Math.floor(Math.random() * DADO_MAX); }

  // Modificador de un medidor (de negativo a positivo según su valor → el arco).
  function modMedidor(ep, id) {
    const v = ep && ep.medidores ? ep.medidores[id] : undefined;
    if (typeof v !== 'number') return 0;
    if (id === 'agencia') return Math.round((v - 10) / 5);   // 0..20  → -2..+2
    return Math.round((v - 50) / 12.5);                       // 0..100 → -4..+4
  }

  // Suma de modificadores de los medidores relevantes + bonus - penalidad.
  function modificadores(ep, medidores, bonus) {
    let m = 0;
    (medidores || ['conocimiento']).forEach((id) => { m += modMedidor(ep, id); });
    m += (bonus || 0);
    if (ep && ep.onboarding && ep.onboarding.referenteSolo) m -= PENAL_REFERENTE_SOLO;
    return m;
  }

  function clasificar(dado, total, dificultad) {
    if (dado === DADO_MAX) return 'critico'; // 20 natural: siempre lo mejor
    if (dado === 1) return 'fracaso';        // 1 natural: pifia (tensión hasta con todo alto)
    const margin = total - dificultad;
    if (margin >= 10) return 'critico';
    if (margin >= 0) return 'exito';
    if (margin >= -4) return 'parcial';
    return 'fracaso';
  }

  // Cómo modula cada resultado los impactos de una opción.
  const RESULTADOS = {
    critico: { id: 'critico', nombre: 'Éxito crítico', factorPos: 1.5, factorNeg: 0.5 },
    exito: { id: 'exito', nombre: 'Éxito', factorPos: 1.0, factorNeg: 1.0 },
    parcial: { id: 'parcial', nombre: 'Éxito parcial', factorPos: 0.5, factorNeg: 1.0 },
    fracaso: { id: 'fracaso', nombre: 'Fracaso', factorPos: 0.0, factorNeg: 1.25 },
  };

  // Tira el dado. opts: { dificultad=12, medidores=['conocimiento'], bonus=0, dadoForzado }.
  function tirar(estado, opts) {
    opts = opts || {};
    const ep = E.actual(estado);
    const dificultad = (typeof opts.dificultad === 'number') ? opts.dificultad : 12;
    const dado = (typeof opts.dadoForzado === 'number') ? opts.dadoForzado : _rand20();
    const mods = ep ? modificadores(ep, opts.medidores, opts.bonus) : 0;
    const total = dado + mods;
    const resultado = clasificar(dado, total, dificultad);
    return { dado, mods, total, dificultad, margin: total - dificultad, resultado, info: RESULTADOS[resultado] };
  }

  // Escala un set de impactos según el resultado (positivos y negativos por separado).
  function escalarImpactos(impactos, resultado) {
    const r = RESULTADOS[resultado] || RESULTADOS.exito;
    const out = {};
    Object.keys(impactos || {}).forEach((k) => {
      if (!D.medidor(k)) return;
      const v = impactos[k];
      const f = v >= 0 ? r.factorPos : r.factorNeg;
      // Redondeo SIMÉTRICO (alejándose de cero) para que un costo chico no se
      // diluya por el redondeo: -2×1.25 → -3 (no -2), y un costo de -1 no
      // desaparece en un crítico. factorPos 0 (fracaso) sí anula los positivos.
      const nv = (f === 0) ? 0 : Math.sign(v) * Math.round(Math.abs(v) * f);
      if (nv !== 0) out[k] = nv;
    });
    return out;
  }

  // Tira y APLICA los impactos escalados al estado. Devuelve {tirada, impactosReales}.
  function aplicar(estado, impactos, opts) {
    const ep = E.actual(estado);
    const tirada = tirar(estado, opts);
    const escalados = escalarImpactos(impactos, tirada.resultado);
    const reales = ep ? E.aplicarImpacto(ep, escalados) : {};
    return { tirada, impactosReales: reales };
  }

  return { DADO_MAX, modMedidor, modificadores, clasificar, RESULTADOS, tirar, escalarImpactos, aplicar };
})();
