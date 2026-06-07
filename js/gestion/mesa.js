/* =====================================================================
 * gestion/mesa.js — MESA PROVINCIAL (N2, CONFIG.mesaProvincial)
 * ---------------------------------------------------------------------
 * Capa narrativa-temporal (GDD §2.bis). Arranque narrativo: el jugador viaja
 * a la Mesa Provincial de Agentes Juveniles (la Hoja de Ruta hecha escena:
 * tutorial disfrazado), recibe líneas de trabajo / ideas / contactos, y vuelve
 * a su localidad. La Mesa queda como un lugar VISITABLE (el "mundo de arriba":
 * provincia, recursos, respaldo).
 *
 * BOLT-ON aditivo detrás de CONFIG.mesaProvincial (requiere modoGestion).
 * Texto GENÉRICO y reskinable: sin programas ni marcas reales (GDD §11).
 * El "intro visto" se guarda en estado.gestion.mesaVista (una sola vez).
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Mesa = (function () {
  'use strict';

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.mesaProvincial); }

  function vista(estado) { return !!(estado && estado.gestion && estado.gestion.mesaVista); }
  function marcarVista(estado) { if (estado && estado.gestion) estado.gestion.mesaVista = true; }
  // ¿Mostrar el arranque narrativo? (flag on + gestión lista + intro no visto).
  function pendiente(estado) { return activo() && !!(estado && estado.gestion) && !vista(estado); }

  // Arranque narrativo (viaje → Mesa → vuelta). Genérico/reskinable.
  const INTRO = [
    { titulo: 'En viaje', texto: 'Arrancás temprano. La ruta es larga y derecha; el mate se enfría en la mano. Vas a la Mesa Provincial de Agentes Juveniles: cada tanto, los referentes de todas las localidades se juntan a poner en común lo que funciona.' },
    { titulo: 'La Mesa', texto: 'Llegás. Hay agentes de pueblos que ni sabías que existían: del monte, del oeste seco, de las colonias del este. Cada uno trae su lío y su hallazgo. Caés en algo simple: no estás solo/a en esto.' },
    { titulo: 'Caja de herramientas', texto: 'Te llevás cinco líneas de trabajo probadas (cultura, ferias, medios, prevención, intereses alternativos), ideas que en otros pueblos prendieron, y una sola cosa fija en la cabeza: que las juventudes que el Estado no ve, se vean.' },
    { titulo: 'Contactos y respaldo', texto: 'Anotás teléfonos, te ofrecen una mano para destrabar permisos y algo de respaldo provincial para cuando el intendente apriete. La Mesa te queda como "piso de arriba": volvés cuando lo necesites.' },
    { titulo: 'De vuelta', texto: 'Volvés a tu localidad con la valija llena de ideas y un puñado de contactos. Tu pueblo todavía no sabe quién sos: eso se gana caminando. Empieza tu gestión.' },
  ];

  // Vista del lugar VISITABLE (cuando volvés a la Mesa).
  const HUB = {
    intro: 'La Mesa Provincial — tu "mundo de arriba". Acá está el respaldo de la provincia: lo que te llevaste y lo que podés pedir.',
    secciones: [
      { titulo: 'Líneas de trabajo', texto: 'Las cinco líneas siguen disponibles para tus actividades: cultura y turismo joven, ferias y mercado, medios y comunicación, capacitaciones y prevención, intereses alternativos.' },
      { titulo: 'Caja de herramientas', texto: 'Ideas que prendieron en otros pueblos, encuestas, formatos de evento. Todo reskinable a lo tuyo, sin copiar y pegar.' },
      { titulo: 'Contactos y respaldo', texto: 'Agentes de otras localidades y la espalda provincial para destrabar lo que el municipio traba. Volvé entre temporadas para recargar.' },
    ],
  };

  return { activo, vista, marcarVista, pendiente, INTRO, HUB };
})();

/* --------------------------- UI (overlay DOM) ----------------------- */
AJ.Gestion.MesaUI = (function () {
  'use strict';

  const M = AJ.Gestion.Mesa;
  let overlay = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function cerrar() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }
  function abierta() { return !!overlay; }

  function _panel(id) {
    const ov = _el('div', 'modal-dom'); ov.id = id;
    const panel = _el('div', 'modal-panel gestion-panel'); ov.appendChild(panel);
    return { ov, panel };
  }

  // Arranque narrativo: pasa los beats de a uno y al final marca visto + onDone.
  function abrirIntro(scene, estado, onDone) {
    cerrar();
    const beats = M.INTRO || [];
    let i = 0;
    const { ov, panel } = _panel('gestion-mesa');
    function pintar() {
      panel.innerHTML = '';
      const b = beats[i] || { titulo: 'Mesa', texto: '' };
      panel.appendChild(_el('p', 'gestion-sub', 'Mesa Provincial  ·  ' + (i + 1) + '/' + beats.length));
      panel.appendChild(_el('h2', null, b.titulo));
      panel.appendChild(_el('p', 'gestion-situacion', b.texto));
      const pie = _el('div', 'creador-fila acciones'); panel.appendChild(pie);
      const ultimo = (i >= beats.length - 1);
      const b1 = _el('button', 'creador-btn primario', ultimo ? 'Llegar al pueblo »' : 'Seguir »'); b1.type = 'button';
      b1.addEventListener('click', () => {
        if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
        if (ultimo) {
          try { M.marcarVista(estado); } catch (e) {}
          cerrar();
          if (onDone) { try { onDone(); } catch (e) {} }
        } else { i++; pintar(); }
      });
      pie.appendChild(b1);
    }
    pintar();
    document.body.appendChild(ov); overlay = ov;
    return ov;
  }

  // Mesa visitable: el hub del "mundo de arriba". onDone() al volver.
  function abrirHub(scene, estado, onDone) {
    cerrar();
    const { ov, panel } = _panel('gestion-mesa');
    panel.appendChild(_el('h2', null, 'Mesa Provincial'));
    panel.appendChild(_el('p', 'gestion-sub', M.HUB.intro));
    const cuerpo = _el('div', 'gestion-cuerpo'); panel.appendChild(cuerpo);
    (M.HUB.secciones || []).forEach((s) => {
      const card = _el('div', 'gestion-accion');
      card.appendChild(_el('span', 'gestion-accion-tit', s.titulo));
      card.appendChild(_el('span', 'gestion-accion-sub', s.texto));
      cuerpo.appendChild(card);
    });
    const pie = _el('div', 'creador-fila acciones'); panel.appendChild(pie);
    const bVolver = _el('button', 'creador-btn primario', 'Volver al pueblo'); bVolver.type = 'button';
    bVolver.addEventListener('click', () => {
      if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
      cerrar();
      if (onDone) { try { onDone(); } catch (e) {} }
    });
    pie.appendChild(bVolver);
    document.body.appendChild(ov); overlay = ov;
    return ov;
  }

  return { abrirIntro, abrirHub, cerrar, abierta };
})();

// Encadena modalAbierta() para que la Mesa también congele el movimiento y
// cierre con ESC. Captura la versión previa (origen/ciclo/onboarding/dilemas).
(function () {
  'use strict';
  const prev = AJ.Gestion.modalAbierta;
  AJ.Gestion.modalAbierta = function () {
    try {
      const mine = AJ.Gestion.MesaUI && AJ.Gestion.MesaUI.abierta && AJ.Gestion.MesaUI.abierta();
      const before = (typeof prev === 'function') ? prev() : false;
      return !!(mine || before);
    } catch (e) { return false; }
  };
})();
