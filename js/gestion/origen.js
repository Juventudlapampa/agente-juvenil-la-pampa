/* =====================================================================
 * gestion/origen.js — ORIGEN DEL JUGADOR (N1, CONFIG.origenJugador)
 * ---------------------------------------------------------------------
 * Capa narrativa-temporal (GDD §2.bis). Antes de gestionar, el jugador
 * elige CÓMO llegó a estar a cargo de la Agencia; eso reparte sus medidores
 * de inicio. BOLT-ON aditivo detrás de CONFIG.origenJugador (requiere
 * modoGestion). Si el flag está off o algo falla, no se inicializa y el
 * Modo Gestión sigue arrancando con los medidores `inicial` de siempre.
 *
 * Datos en datos.js (D.ORIGENES). Acá: lógica (Origen) + asistente DOM
 * (OrigenUI). El origen se guarda en EstadoPueblo.origen (una sola vez).
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Origen = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.origenJugador); }

  // Origen ya elegido para el pueblo activo (id) o null.
  function elegido(estado) { const ep = E.actual(estado); return (ep && ep.origen) || null; }

  // ¿Hay que mostrar la pantalla de origen? (flag on + pueblo sin origen).
  function pendiente(estado) { return activo() && !elegido(estado); }

  // Aplica un origen: setea los medidores absolutos y marca ep.origen.
  // NO re-aplica si ya había uno (idempotente y a prueba de doble-click).
  function elegir(estado, origenId) {
    const ep = E.actual(estado);
    if (!ep) return null;
    if (ep.origen) return ep.origen;            // ya elegido: no pisar
    const o = D.origen(origenId);
    if (!o) return null;
    Object.keys(o.medidores || {}).forEach((k) => {
      if (D.medidor(k)) E.setMedidor(ep, k, o.medidores[k]);
    });
    ep.origen = o.id;
    if (o.findesMenos) ep.findesMenos = o.findesMenos; // lo lee el reloj de findes (N3)
    return o.id;
  }

  return { activo, elegido, pendiente, elegir };
})();

/* --------------------------- UI (overlay DOM) ----------------------- */
AJ.Gestion.OrigenUI = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const M = AJ.Gestion.Origen;

  let overlay = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function cerrar() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }
  function abierta() { return !!overlay; }

  // Resumen corto de las barras que el origen sube (para que la elección se sienta).
  function _destacados(o) {
    const med = o.medidores || {};
    const ranked = Object.keys(med)
      .map((k) => ({ k, v: med[k], m: D.medidor(k) }))
      .filter((x) => x.m)
      .sort((a, b) => (b.v / b.m.max) - (a.v / a.m.max));
    const top = ranked.slice(0, 2).map((x) => '↑ ' + x.m.nombre);
    const low = ranked.slice(-1).map((x) => '↓ ' + x.m.nombre);
    return top.concat(low).join('   ·   ');
  }

  // Abre la pantalla de elección de origen. onDone(origenId) al elegir.
  function abrir(scene, estado, onDone) {
    cerrar();
    const ov = _el('div', 'modal-dom'); ov.id = 'gestion-origen';
    const panel = _el('div', 'modal-panel gestion-panel'); ov.appendChild(panel);
    panel.appendChild(_el('h2', null, '¿Cómo llegaste a la Agencia?'));
    panel.appendChild(_el('p', 'gestion-sub', 'Tu punto de partida reparte tus medidores. No hay opción mala: cada una es otra partida.'));
    const cont = _el('div', 'gestion-cuerpo'); panel.appendChild(cont);

    (D.ORIGENES || []).forEach((o) => {
      const b = _el('button', 'gestion-accion'); b.type = 'button';
      b.appendChild(_el('span', 'gestion-accion-tit', o.nombre));
      b.appendChild(_el('span', 'gestion-accion-sub', o.desc));
      b.appendChild(_el('span', 'gestion-accion-sub', _destacados(o)));
      b.addEventListener('click', () => {
        let id = null;
        try { id = M.elegir(estado, o.id); } catch (e) {}
        if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
        cerrar();
        if (onDone) { try { onDone(id); } catch (e) {} }
      });
      cont.appendChild(b);
    });

    document.body.appendChild(ov);
    overlay = ov;
    return ov;
  }

  return { abrir, cerrar, abierta };
})();

// Encadena modalAbierta() para que la pantalla de origen también congele el
// movimiento y se cierre con ESC. Captura la versión previa (ciclo/onboarding/
// dilemas) y le suma OrigenUI; robusto al orden de carga (este script va último).
(function () {
  'use strict';
  const prev = AJ.Gestion.modalAbierta;
  AJ.Gestion.modalAbierta = function () {
    try {
      const mine = AJ.Gestion.OrigenUI && AJ.Gestion.OrigenUI.abierta && AJ.Gestion.OrigenUI.abierta();
      const before = (typeof prev === 'function') ? prev() : false;
      return !!(mine || before);
    } catch (e) { return false; }
  };
})();
