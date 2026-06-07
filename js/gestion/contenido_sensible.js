/* =====================================================================
 * gestion/contenido_sensible.js — DILEMAS SENSIBLES (REVISIÓN HUMANA)
 * ---------------------------------------------------------------------
 * >>> ESTE ARCHIVO ESTÁ VACÍO A PROPÓSITO. <<<
 *
 * Salud mental, consumos, violencias (incl. de género) y bullying/ciber-
 * bullying se escriben A MANO y los aprueba una persona (idealmente del área
 * de salud/juventudes). NUNCA se autogeneran ni se tratan como "puntos".
 * Ver la regla completa y las recomendaciones de redacción en
 * CONTENIDO_SENSIBLE.md (en la raíz del repo).
 *
 * CÓMO USARLO (cuando tengas dilemas APROBADOS):
 *   1. Escribilos con la estructura de la plantilla de abajo.
 *   2. Pegalos DENTRO del array `DILEMAS_APROBADOS` (reemplazá el `[]`).
 *   3. Listo: este script ya está cargado en index.html y los registra.
 *
 * El motor (dilemas.js) valida la estructura y fuerza fuente:'sensible'.
 * Mientras el array esté vacío, el juego corre igual con los dilemas
 * genéricos (cero dependencia) y el smoke-test verifica que el banco
 * sensible siga vacío.
 *
 * PLANTILLA (medidores válidos: agencia, vinculoEscolar, conocimiento,
 * confianza, conviccion; en contenido sensible: impactos chicos o nulos):
 *
 *   {
 *     id: 'sm_ejemplo',                 // único
 *     problematica: 'saludMental',      // saludMental | consumos | violencias | bullying
 *     situacion: 'Texto redactado con cuidado (no moraleja, no diagnóstico).',
 *     opciones: [
 *       { id: 'a', texto: 'Acompañar / escuchar / derivar al área.',
 *         impactos: {}, reaccion: 'Qué se aprende, sin moraleja.' },
 *       { id: 'b', texto: 'Otra respuesta posible.',
 *         impactos: {}, reaccion: '…' },
 *     ],
 *   }
 * ===================================================================== */
(function () {
  'use strict';

  // <<< PEGÁ ACÁ los dilemas sensibles APROBADOS por una persona. Vacío = nada. >>>
  var DILEMAS_APROBADOS = [];

  try {
    if (window.AJ && AJ.Gestion && AJ.Gestion.Dilemas &&
        typeof AJ.Gestion.Dilemas.registrarSensibles === 'function' &&
        DILEMAS_APROBADOS.length) {
      var n = AJ.Gestion.Dilemas.registrarSensibles(DILEMAS_APROBADOS);
      if (window.console && n) console.log('[contenido_sensible] registrados ' + n + ' dilemas sensibles aprobados.');
    }
  } catch (e) { /* nunca romper el juego por contenido opcional */ }
})();
