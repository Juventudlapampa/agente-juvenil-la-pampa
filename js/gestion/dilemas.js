/* =====================================================================
 * gestion/dilemas.js — MOTOR DE DILEMAS (G3, CONFIG.dilemas)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.dilemas (requiere modoGestion). Hereda el motor
 * del Simulador (decisiones con impacto multi-medidor) ampliado a los 5
 * medidores (GDD §7). Un dilema es un DATO reskinable:
 *   { id, situacion, problematica, fuente, opciones: [
 *       { id, texto, impactos:{medidor:delta}, reaccion, requiereTirada?, dificultad? } ] }
 *
 * BANCO_GENERICO: dilemas GENÉRICOS de arranque (situaciones de PODER y
 * problemáticas NO sensibles). Reskinables, sin nombres reales, sin plata real.
 *
 * CONTENIDO SENSIBLE (salud mental, consumos, violencias, bullying): NO se
 * autogenera. El motor lo SOPORTA vía registrarSensibles(); el contenido se
 * escribe a mano y lo aprueba un humano (ver CONTENIDO_SENSIBLE.md).
 *
 * Si requiereTirada, el impacto real lo modula el dado (G4); en G3, resolver()
 * aplica los impactos base directamente.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Dilemas = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  /* ---- BANCO GENÉRICO (hand-authored; se amplía con contenido validado) ---- */
  const BANCO_GENERICO = [
    {
      id: 'poder_intendente_numero', problematica: 'intendente', fuente: 'poder',
      situacion: 'El intendente te frena el SUM para el sábado: "Primero quiero ver número. Si no llenás la plaza, no hay nada." Te pide garantizar una foto multitudinaria antes de firmar.',
      opciones: [
        { id: 'a', texto: 'Le prometés el número y salís a llenar la plaza como sea.',
          impactos: { confianza: 10, conviccion: -8, agencia: -1 },
          reaccion: 'Firma, pero los pibes sienten que laburan para la foto, no para ellos.' },
        { id: 'b', texto: 'Le plantás que la actividad vale aunque vayan pocos.',
          impactos: { conviccion: 10, confianza: -8 },
          reaccion: 'Se va caliente; los pibes te bancan, el municipio te mira de reojo.' },
        { id: 'c', texto: 'Negociás: número más chico, pero algo cumplís.',
          impactos: { confianza: 3, conviccion: 1, conocimiento: 2 },
          reaccion: 'Quedan todos a medias conformes; nadie aplaude, nadie putea.' },
      ],
    },
    {
      id: 'poder_concejal_logo', problematica: 'concejal', fuente: 'poder',
      situacion: 'Un concejal te ofrece fondos para la feria joven… si su logo va más grande que todo lo demás.',
      opciones: [
        { id: 'a', texto: 'Aceptás: plata es plata.',
          impactos: { confianza: 12, conviccion: -10 },
          reaccion: 'Hay fondos, pero la feria queda con cara de campaña ajena.' },
        { id: 'b', texto: 'Le decís que la feria es de los pibes, sin padrinos.',
          impactos: { conviccion: 10, confianza: -7 },
          reaccion: 'Los pibes lo valoran; el concejal se lo guarda.' },
        { id: 'c', texto: 'Logo chico en un rincón, y los pibes al frente.',
          impactos: { confianza: 4, conviccion: 2 },
          reaccion: 'Negociación piola: nadie gana del todo, nadie pierde la cara.' },
      ],
    },
    {
      id: 'poder_provincia_folklore', problematica: 'provincia', fuente: 'poder',
      situacion: 'Provincia manda fondos, pero atados: sólo para folklore tradicional. Los pibes te venían pidiendo otra cosa.',
      opciones: [
        { id: 'a', texto: 'Tomás los fondos y armás folklore, aunque no era la demanda.',
          impactos: { confianza: 8, conocimiento: -6, vinculoEscolar: 2 },
          reaccion: 'Sale lindo, pero quedó la sensación de que decidieron por ellos.' },
        { id: 'b', texto: 'Rechazás los fondos para no traicionar lo que pidieron.',
          impactos: { conviccion: 9, confianza: -9 },
          reaccion: 'Coherente y caro: te quedaste sin un mango pero con la frente alta.' },
        { id: 'c', texto: 'Usás el folklore como excusa y le cruzás lo que querían.',
          impactos: { conocimiento: 5, conviccion: 3, confianza: 2 },
          reaccion: 'Actividad-puente: el folklore abre la puerta a lo nuevo. Bien jugado.',
          requiereTirada: true, dificultad: 12 },
      ],
    },
    {
      id: 'esp_sum_compartido', problematica: 'espacios', fuente: 'generico',
      situacion: 'El único SUM lo tiene ocupado el club justo los días que te sirven. Podés pelearte por el espacio o coordinar.',
      opciones: [
        { id: 'a', texto: 'Reclamás el SUM para la juventud, sí o sí.',
          impactos: { confianza: -4, conviccion: 4 },
          reaccion: 'Te ganás el espacio y, de paso, un enojo con el club.' },
        { id: 'b', texto: 'Coordinás horarios compartidos con el club.',
          impactos: { confianza: 6, conocimiento: 3, vinculoEscolar: 2 },
          reaccion: 'Cooperación: cada uno cede un poco y el SUM rinde para todos.' },
        { id: 'c', texto: 'Pedís usar el SUM del pueblo vecino.',
          impactos: { conocimiento: 4, confianza: 2, agencia: -1 },
          reaccion: 'Sumás un contacto regional; la logística del viaje cuesta.' },
      ],
    },
    {
      id: 'eco_feria_o_taller', problematica: 'economia', fuente: 'generico',
      situacion: 'Varios pibes quieren vender lo que hacen, pero no hay dónde ni con qué herramientas. ¿Feria ya o capacitación primero?',
      opciones: [
        { id: 'a', texto: 'Feria ya: que vendan este finde.',
          impactos: { confianza: 6, conocimiento: -2 },
          reaccion: 'Venden algo, pero sin oficio se quedan a mitad de camino.' },
        { id: 'b', texto: 'Primero capacitación, después feria.',
          impactos: { conocimiento: 6, vinculoEscolar: 3, confianza: -2 },
          reaccion: 'Tarda más, pero quedan con herramientas de verdad.' },
        { id: 'c', texto: 'Las dos cosas, partido en etapas.',
          impactos: { conocimiento: 3, confianza: 2, agencia: -1 },
          reaccion: 'Ambicioso: sale, pero tu equipo termina cansado.' },
      ],
    },
    {
      id: 'con_wifi_plaza', problematica: 'conectividad', fuente: 'generico',
      situacion: 'La plaza es el punto de encuentro pero no hay señal. Poner WiFi público sale caro y hay que pelearlo.',
      opciones: [
        { id: 'a', texto: 'Gastás presupuesto en WiFi de la plaza.',
          impactos: { confianza: -6, conocimiento: 4, vinculoEscolar: 2 },
          reaccion: 'Cuesta plata, pero la plaza se llena de nuevo.' },
        { id: 'b', texto: 'Conseguís que una escuela preste su sala con conexión.',
          impactos: { vinculoEscolar: 7, confianza: 2 },
          reaccion: 'La escuela se siente parte; ganás un aliado clave.' },
        { id: 'c', texto: 'Lo dejás para más adelante, priorizás otra cosa.',
          impactos: { confianza: 3, conocimiento: -3 },
          reaccion: 'Ahorrás, pero los pibes siguen sin lugar con señal.' },
      ],
    },
  ];

  // Banco de contenido SENSIBLE (vacío por defecto). Lo cargan humanos vía
  // registrarSensibles() (ver CONTENIDO_SENSIBLE.md). NUNCA se autogenera.
  let BANCO_SENSIBLE = [];

  function _validarDilema(d) {
    if (!d || !d.id || !d.situacion || !Array.isArray(d.opciones) || d.opciones.length < 2) return false;
    return d.opciones.every((o) => o && o.id && o.texto && o.impactos &&
      Object.keys(o.impactos).every((k) => !!D.medidor(k)));
  }

  // Registra dilemas GENÉRICOS validados (p. ej. los del workflow de escritura).
  function registrarGenericos(arr) {
    let n = 0;
    (arr || []).forEach((d) => {
      if (_validarDilema(d) && !BANCO_GENERICO.some((x) => x.id === d.id)) {
        d.fuente = d.fuente || 'generico';
        BANCO_GENERICO.push(d); n++;
      }
    });
    return n;
  }

  // Registra contenido SENSIBLE escrito a mano (revisado por humanos).
  function registrarSensibles(arr) {
    let n = 0;
    (arr || []).forEach((d) => {
      if (_validarDilema(d) && !BANCO_SENSIBLE.some((x) => x.id === d.id)) {
        d.fuente = 'sensible';
        BANCO_SENSIBLE.push(d); n++;
      }
    });
    return n;
  }

  function todos() { return BANCO_GENERICO.concat(BANCO_SENSIBLE); }
  function porId(id) { return todos().find((d) => d.id === id) || null; }

  // Dilemas que se le pueden presentar al estado actual (genéricos no resueltos).
  function elegibles(estado) {
    const ep = E.actual(estado);
    const hechos = (ep && ep.dilemasResueltos) || [];
    return BANCO_GENERICO.filter((d) => hechos.indexOf(d.id) < 0);
  }

  // Resuelve un dilema: aplica los impactos de la opción y lo marca resuelto.
  // Devuelve { reaccion, impactosReales, opcion } (o null si algo no existe).
  function resolver(estado, dilemaId, opcionId) {
    const ep = E.actual(estado);
    if (!ep) return null;
    const d = porId(dilemaId);
    if (!d) return null;
    const op = d.opciones.find((o) => o.id === opcionId);
    if (!op) return null;
    const reales = E.aplicarImpacto(ep, op.impactos);
    if (ep.dilemasResueltos.indexOf(d.id) < 0) ep.dilemasResueltos.push(d.id);
    return { reaccion: op.reaccion || '', impactosReales: reales, opcion: op, dilema: d };
  }

  return {
    BANCO_GENERICO, registrarGenericos, registrarSensibles,
    todos, porId, elegibles, resolver,
    get BANCO_SENSIBLE() { return BANCO_SENSIBLE; },
  };
})();

/* --------------------------- UI (overlay DOM) ----------------------- */
AJ.Gestion.DilemasUI = (function () {
  'use strict';

  const M = AJ.Gestion.Dilemas;
  const D = AJ.Gestion.Datos;

  let overlay = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function cerrar() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }
  function abierta() { return !!overlay; }

  // Texto corto de un set de impactos reales: "Confianza +10 · Convicción -8".
  function _fmtImpactos(reales) {
    const out = [];
    Object.keys(reales || {}).forEach((k) => {
      const m = D.medidor(k); if (!m || !reales[k]) return;
      out.push(m.nombre + ' ' + (reales[k] > 0 ? '+' : '') + reales[k]);
    });
    return out.join('  ·  ') || 'Sin cambios.';
  }

  // Abre un dilema. onResuelto(resultado) al cerrar tras elegir.
  function abrir(scene, estado, dilema, onResuelto) {
    cerrar();
    if (!dilema) { if (onResuelto) onResuelto(null); return null; }
    const ov = _el('div', 'modal-dom'); ov.id = 'gestion-dilema';
    const panel = _el('div', 'modal-panel gestion-panel');
    ov.appendChild(panel);
    panel.appendChild(_el('h2', null, 'Una decisión'));
    const pro = D.problematica(dilema.problematica);
    if (pro) panel.appendChild(_el('p', 'gestion-sub', pro.nombre));
    panel.appendChild(_el('p', 'gestion-situacion', dilema.situacion));
    const cont = _el('div', 'gestion-opciones'); panel.appendChild(cont);

    dilema.opciones.forEach((op) => {
      const b = _el('button', 'gestion-opcion', op.texto); b.type = 'button';
      if (op.requiereTirada) b.appendChild(_el('span', 'gestion-dado', ' 🎲'));
      b.addEventListener('click', () => {
        const res = M.resolver(estado, dilema.id, op.id);
        if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
        // Mostrar reacción + impactos y un botón para seguir.
        cont.innerHTML = '';
        panel.appendChild(_el('p', 'gestion-reaccion', (res && res.reaccion) || ''));
        panel.appendChild(_el('p', 'gestion-deltas', _fmtImpactos(res && res.impactosReales)));
        const seguir = _el('button', 'creador-btn primario', 'Seguir »'); seguir.type = 'button';
        seguir.addEventListener('click', () => { cerrar(); if (onResuelto) { try { onResuelto(res); } catch (e) {} } });
        panel.appendChild(seguir);
      });
      cont.appendChild(b);
    });

    document.body.appendChild(ov);
    overlay = ov;
    return ov;
  }

  return { abrir, cerrar, abierta };
})();

// modalAbierta() ahora considera TODOS los modales de gestión (onboarding +
// dilemas). Redefine la versión de onboarding.js (este script carga después).
AJ.Gestion.modalAbierta = function () {
  try {
    const ob = AJ.Gestion.OnboardingUI && AJ.Gestion.OnboardingUI.abierta && AJ.Gestion.OnboardingUI.abierta();
    const di = AJ.Gestion.DilemasUI && AJ.Gestion.DilemasUI.abierta && AJ.Gestion.DilemasUI.abierta();
    return !!(ob || di);
  } catch (e) { return false; }
};
