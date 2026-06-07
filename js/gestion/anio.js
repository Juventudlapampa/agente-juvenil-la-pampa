/* =====================================================================
 * gestion/anio.js — LAS 4 TEMPORADAS + MES DE LAS JUVENTUDES (N4, CONFIG.modoAnual)
 * ---------------------------------------------------------------------
 * Capa narrativa-temporal (GDD §2.bis D). Modo largo: el AÑO completo son 4
 * temporadas encadenadas (cada una = una temporada de findes de N3), con su
 * clima. SEPTIEMBRE = MES DE LAS JUVENTUDES = clímax: el año entero orienta a
 * llegar bien parado a septiembre.
 *
 * BOLT-ON aditivo detrás de CONFIG.modoAnual (requiere relojTemporadas). Con el
 * flag off, jugás una sola temporada (núcleo de N3). SÓLO LÓGICA + datos; el
 * enganche al cierre/subtítulo vive en ciclo.js (aditivo). El estado del año
 * vive en estado.gestion.anio = { idx:0..3, anio:1.. }.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Anio = (function () {
  'use strict';

  const T = AJ.Gestion.Temporadas;

  // Las 4 temporadas del año (GDD §2.bis D). `climax` = la del Mes de las Juventudes.
  const TEMPORADAS = [
    { id: 'verano', nombre: 'Verano', meses: 'dic–feb',
      clima: 'Colonias, pileta, aire libre. La escuela no está: el vínculo escolar pesa menos y mandan los espacios abiertos.' },
    { id: 'laburo', nombre: 'Laburo fuerte', meses: 'mar–jun',
      clima: 'Escuela activa y Agencia a full. La temporada de fondo, donde se construye lo que después se luce.' },
    { id: 'invierno', nombre: 'Receso de invierno', meses: 'jul',
      clima: 'Todo bajo techo; el ritmo baja un cambio. Buen momento para talleres y planificar lo que viene.' },
    { id: 'segunda', nombre: 'Segunda mitad', meses: 'ago–nov', climax: true, faro: 'Mes de las Juventudes',
      clima: 'La energía sube hacia SEPTIEMBRE, el Mes de las Juventudes: el finde-faro donde se cobran o se lucen las decisiones del año.' },
  ];

  function activo() {
    return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.relojTemporadas && AJ.CONFIG.modoAnual);
  }

  // Estado del año (migración defensiva). idx 0..3 = temporada del año; anio 1..
  function estadoAnio(estado) {
    if (!estado || !estado.gestion) return null;
    const g = estado.gestion;
    if (!g.anio || typeof g.anio !== 'object') g.anio = { idx: 0, anio: 1 };
    if (typeof g.anio.idx !== 'number' || g.anio.idx < 0 || g.anio.idx > 3) g.anio.idx = 0;
    if (typeof g.anio.anio !== 'number') g.anio.anio = 1;
    return g.anio;
  }

  function temporadaActual(estado) { const a = estadoAnio(estado); return a ? TEMPORADAS[a.idx] : TEMPORADAS[0]; }
  function siguiente(estado) { const a = estadoAnio(estado); return TEMPORADAS[((a ? a.idx : 0) + 1) % 4]; }
  function esClimax(estado) { const t = temporadaActual(estado); return !!(t && t.climax); }

  // ¿Estamos en el finde-faro (septiembre) de la temporada clímax? = último finde.
  function esFaro(estado, ep) {
    return esClimax(estado) && !!ep && typeof ep.finde === 'number' && typeof ep.totalFindes === 'number' &&
      ep.finde >= ep.totalFindes;
  }

  // Avanzar a la temporada siguiente del año (y reiniciar el reloj de findes en el
  // mismo pueblo). Al pasar de 'segunda' vuelve a 'verano' y suma un año.
  function avanzarTemporada(estado) {
    const a = estadoAnio(estado); if (!a) return null;
    let nuevoAnio = false;
    a.idx += 1;
    if (a.idx > 3) { a.idx = 0; a.anio += 1; nuevoAnio = true; }
    try { if (T && T.nuevaTemporada) T.nuevaTemporada(estado); } catch (e) {}
    return { temporada: TEMPORADAS[a.idx], nuevoAnio: nuevoAnio, anio: a.anio };
  }

  return { TEMPORADAS, activo, estadoAnio, temporadaActual, siguiente, esClimax, esFaro, avanzarTemporada };
})();
