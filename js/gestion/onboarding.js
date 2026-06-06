/* =====================================================================
 * gestion/onboarding.js — ARMAR LA AGENCIA (G2, CONFIG.onboarding)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.onboarding (requiere modoGestion). Los CUATRO
 * pasos de la Hoja de Ruta Juvenil (GDD §3) hechos jugables:
 *   1) CONVOCATORIA — elegís canales según lo que el pueblo usa (+ el mate).
 *   2) DIAGNÓSTICO — charla abierta o encuesta: sube Conocimiento y descubrís
 *      comunidades/problemáticas del pueblo.
 *   3) OBJETIVOS — fijás 2–3 objetivos y BAUTIZÁS la Agencia (el jugador
 *      elige el nombre).
 *   4) ORGANIZACIÓN — reclutás de 3 a 20 miembros (con roles) o quedás de
 *      Referente solo (jugable, pero todo cuesta el doble).
 *
 * Se separa en LÓGICA pura (testeable sin DOM) y UI (overlay DOM, estilo del
 * creador de Agente). Si el flag está off o algo falla, no se inicializa.
 *
 * Restricciones: nada sensible se autogenera; sin plata real; reskinable.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

/* ---------------------- LÓGICA (pura, testeable) --------------------- */
AJ.Gestion.Onboarding = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  // Canales de convocatoria (GDD §3.1).
  const CANALES = [
    { id: 'bocaAboca', nombre: 'Boca a boca', nota: 'En pueblo chico, gana.' },
    { id: 'afiches', nombre: 'Afiches', nota: 'Clásico; llega parejo.' },
    { id: 'radio', nombre: 'Radio local', nota: 'Fuerte en el interior.' },
    { id: 'redes', nombre: 'Redes sociales', nota: 'Gana en pueblos grandes.' },
  ];
  // Cuántos candidatos aporta cada canal, por nivel de pueblo.
  // (En nivel 1 manda el boca a boca; en nivel 3–4, las redes/radio.)
  const EFECT = {
    1: { bocaAboca: 5, afiches: 3, radio: 3, redes: 1 },
    2: { bocaAboca: 5, afiches: 3, radio: 4, redes: 3 },
    3: { bocaAboca: 3, afiches: 3, radio: 5, redes: 6 },
    4: { bocaAboca: 2, afiches: 3, radio: 5, redes: 8 },
  };

  // Roles que aporta cada miembro reclutado (GDD §3.4).
  const ROLES = [
    { id: 'promo', nombre: 'Llegada a la promo' },
    { id: 'redes', nombre: 'Redes y comunicación' },
    { id: 'club', nombre: 'Club / deporte' },
    { id: 'escuela', nombre: 'Puente con la escuela' },
    { id: 'cultura', nombre: 'Cultura y eventos' },
    { id: 'logistica', nombre: 'Logística y armado' },
  ];

  // Objetivos posibles (GDD §3.3): cada uno da bonus a líneas de actividad afines.
  const OBJETIVOS = [
    { id: 'masEspacios', nombre: 'Más espacios para juntarse', actividades: ['culturaTurismo', 'interesesAlternativos'] },
    { id: 'vozJoven', nombre: 'Que la voz joven se escuche', actividades: ['mediosComunicacion'] },
    { id: 'prevencion', nombre: 'Prevención y cuidado', actividades: ['capacitacionesPrevencion'] },
    { id: 'laburoJoven', nombre: 'Laburo y emprender', actividades: ['feriaMercado'] },
    { id: 'integrar', nombre: 'Integrar a las comunidades', actividades: ['interesesAlternativos', 'culturaTurismo'] },
  ];

  function _ep(estado) { E.asegurar(estado, null); return E.actual(estado); }

  // Paso 1 — CONVOCATORIA. canales: array de ids; conMate: boolean.
  function convocatoria(estado, canales, conMate) {
    const ep = _ep(estado);
    const p = D.pueblo(ep.puebloId);
    const ef = EFECT[p ? p.nivel : 1] || EFECT[1];
    let candidatos = 0;
    (canales || []).forEach((c) => { candidatos += (ef[c] || 0); });
    const impactos = {};
    // El mate / la informalidad suma calidez (GDD §3.1).
    if (conMate) { impactos.confianza = 2; impactos.vinculoEscolar = 1; }
    E.aplicarImpacto(ep, impactos);
    ep.onboarding.canales = (canales || []).slice();
    ep.onboarding.conMate = !!conMate;
    ep.onboarding.candidatos = candidatos;
    ep.onboarding.paso = Math.max(ep.onboarding.paso || 0, 1);
    return { candidatos, impactos };
  }

  // Paso 2 — DIAGNÓSTICO. modo: 'charla' | 'encuesta'.
  function diagnostico(estado, modo) {
    const ep = _ep(estado);
    const p = D.pueblo(ep.puebloId);
    const impactos = {};
    if (modo === 'charla') { impactos.conocimiento = 18; impactos.vinculoEscolar = 6; }
    else { modo = 'encuesta'; impactos.conocimiento = 12; }
    // Revela comunidades del pueblo. Con G6 (CONFIG.comunidades) el diagnóstico
    // revela sólo las 2 más comunes (el resto se descubre explorando); sin G6,
    // revela todas como antes.
    const coms = (p ? p.comunidades : []) || [];
    const conDescubrimiento = !!(AJ.CONFIG && AJ.CONFIG.comunidades);
    if (conDescubrimiento && AJ.Gestion.Comunidades && AJ.Gestion.Comunidades.delPueblo) {
      // delPueblo viene ordenado por rareza (común primero).
      AJ.Gestion.Comunidades.delPueblo(estado).slice(0, 2).forEach((c) => { ep.comunidadesDescubiertas[c] = true; });
    } else {
      coms.forEach((c) => { ep.comunidadesDescubiertas[c] = true; });
    }
    // Ve las problemáticas NO sensibles (las sensibles van a mano, CONTENIDO_SENSIBLE.md).
    D.PROBLEMATICAS.filter((pr) => !pr.sensible).forEach((pr) => { ep.problematicasVistas[pr.id] = true; });
    E.aplicarImpacto(ep, impactos);
    ep.onboarding.diagnostico = modo;
    ep.onboarding.paso = Math.max(ep.onboarding.paso || 0, 2);
    return { modo, impactos, comunidades: Object.keys(ep.comunidadesDescubiertas) };
  }

  // Paso 3 — OBJETIVOS + bautizar la Agencia.
  function objetivos(estado, nombreAgencia, objetivosIds) {
    const ep = _ep(estado);
    const nom = (nombreAgencia || '').trim().slice(0, 24);
    ep.agencia.nombre = nom;
    ep.agencia.objetivos = (objetivosIds || [])
      .filter((id) => OBJETIVOS.some((o) => o.id === id)).slice(0, 3);
    ep.onboarding.paso = Math.max(ep.onboarding.paso || 0, 3);
    return { nombre: nom, objetivos: ep.agencia.objetivos.slice() };
  }

  // Paso 4 — ORGANIZACIÓN (reclutar). nMiembros se capa a [0, min(20, candidatos)].
  function organizacion(estado, nMiembros, rolesIds) {
    const ep = _ep(estado);
    const cap = Math.min(20, ep.onboarding.candidatos || 0);
    const n = Math.max(0, Math.min(nMiembros | 0, cap));
    const pool = (rolesIds && rolesIds.length) ? rolesIds : ROLES.map((r) => r.id);
    const miembros = [];
    for (let i = 0; i < n; i++) miembros.push({ rol: pool[i % pool.length] });
    ep.agencia.miembros = miembros;
    E.setMedidor(ep, 'agencia', n);
    ep.onboarding.paso = Math.max(ep.onboarding.paso || 0, 4);
    return { miembros: n, cap };
  }

  // CIERRE — define Agencia (≥3) vs Referente solo (<3) y aplica el resultado.
  function finalizar(estado) {
    const ep = _ep(estado);
    const n = (ep.agencia.miembros || []).length;
    const referenteSolo = n < 3; // GDD §3: con menos de 3 quedás de referente solo
    ep.onboarding.hecho = true;
    ep.onboarding.referenteSolo = referenteSolo;
    ep.fase = 'gestion'; // tras los 4 pasos arranca la gestión (días 6–30, G5)
    if (referenteSolo) {
      E.setMedidor(ep, 'agencia', 0);
    } else {
      E.aplicarImpacto(ep, { confianza: Math.min(8, n), conocimiento: 4 });
    }
    return { referenteSolo, miembros: n, agencia: ep.agencia };
  }

  // Atajo: corre los 4 pasos con un set de elecciones (útil para tests/IA).
  function correrTodo(estado, elecciones) {
    const o = elecciones || {};
    convocatoria(estado, o.canales || ['bocaAboca'], o.conMate);
    diagnostico(estado, o.diagnostico || 'charla');
    objetivos(estado, o.nombreAgencia || '', o.objetivos || []);
    organizacion(estado, (o.nMiembros == null ? 5 : o.nMiembros), o.roles || []);
    return finalizar(estado);
  }

  return {
    CANALES, EFECT, ROLES, OBJETIVOS,
    convocatoria, diagnostico, objetivos, organizacion, finalizar, correrTodo,
  };
})();

/* --------------------------- UI (overlay DOM) ----------------------- */
AJ.Gestion.OnboardingUI = (function () {
  'use strict';

  const L = AJ.Gestion.Onboarding;
  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  let overlay = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function cerrar() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }
  function abierta() { return !!overlay; }

  // Abre el asistente. onDone(resultado) al terminar (o null si cancela).
  function abrir(scene, estado, onDone) {
    cerrar();
    E.asegurar(estado, null);
    const ep = E.actual(estado);
    const pueblo = D.pueblo(ep.puebloId);

    // Elecciones locales (no tocan el estado hasta confirmar cada paso).
    const sel = {
      canales: (ep.onboarding.canales || []).slice(),
      conMate: ep.onboarding.conMate !== false,
      diagnostico: ep.onboarding.diagnostico || 'charla',
      nombre: ep.agencia.nombre || '',
      objetivos: (ep.agencia.objetivos || []).slice(),
      nMiembros: 5,
      roles: [],
    };
    let paso = 1;

    const ov = _el('div', 'modal-dom'); ov.id = 'gestion-onboarding';
    const panel = _el('div', 'modal-panel gestion-panel');
    ov.appendChild(panel);

    const h = _el('h2', null, 'Armar la Agencia'); panel.appendChild(h);
    const sub = _el('p', 'gestion-sub', ''); panel.appendChild(sub);
    const cuerpo = _el('div', 'gestion-cuerpo'); panel.appendChild(cuerpo);
    const pie = _el('div', 'creador-fila acciones'); panel.appendChild(pie);
    const bVolver = _el('button', 'creador-btn', '« Atrás'); bVolver.type = 'button';
    const bSig = _el('button', 'creador-btn primario', 'Siguiente »'); bSig.type = 'button';
    pie.appendChild(bVolver); pie.appendChild(bSig);

    function nivelTxt() { const nv = D.nivel(pueblo.nivel); return 'Nivel ' + pueblo.nivel + ' · ' + (nv ? nv.sistema : ''); }

    function render() {
      cuerpo.innerHTML = '';
      sub.textContent = pueblo.nombre + ' — ' + nivelTxt() + '   (paso ' + paso + ' de 4)';
      bVolver.textContent = paso === 1 ? 'Cancelar' : '« Atrás';
      bSig.textContent = paso === 4 ? '¡Listo!' : 'Siguiente »';

      if (paso === 1) {
        cuerpo.appendChild(_el('p', 'gestion-paso-tit', '1. Convocatoria — que la localidad se entere'));
        const ef = L.EFECT[pueblo.nivel] || L.EFECT[1];
        L.CANALES.forEach((c) => {
          const fila = _el('label', 'gestion-check');
          const cb = _el('input'); cb.type = 'checkbox'; cb.checked = sel.canales.indexOf(c.id) >= 0;
          cb.addEventListener('change', () => {
            const i = sel.canales.indexOf(c.id);
            if (cb.checked && i < 0) sel.canales.push(c.id);
            else if (!cb.checked && i >= 0) sel.canales.splice(i, 1);
            actualizarCandidatos();
          });
          fila.appendChild(cb);
          fila.appendChild(_el('span', 'gestion-check-nom', c.nombre + ' (+' + (ef[c.id] || 0) + ')'));
          fila.appendChild(_el('span', 'gestion-hint', c.nota));
          cuerpo.appendChild(fila);
        });
        const mate = _el('label', 'gestion-check');
        const cbM = _el('input'); cbM.type = 'checkbox'; cbM.checked = sel.conMate;
        cbM.addEventListener('change', () => { sel.conMate = cbM.checked; });
        mate.appendChild(cbM);
        mate.appendChild(_el('span', 'gestion-check-nom', 'Con mate 🧉 (el mate no puede faltar)'));
        cuerpo.appendChild(mate);
        const cand = _el('p', 'gestion-candidatos', ''); cand.id = 'gestion-cand'; cuerpo.appendChild(cand);
        actualizarCandidatos();
      } else if (paso === 2) {
        cuerpo.appendChild(_el('p', 'gestion-paso-tit', '2. Diagnóstico — qué pasa con los jóvenes'));
        [['charla', 'Charla abierta', 'Más profunda: +Conocimiento y +Vínculo escolar.'],
         ['encuesta', 'Encuesta rápida', 'Más rápida: +Conocimiento (menos profundidad).']]
          .forEach(([val, nom, nota]) => {
            const b = _el('button', 'creador-opt' + (sel.diagnostico === val ? ' sel' : ''), nom);
            b.type = 'button';
            b.addEventListener('click', () => { sel.diagnostico = val; render(); });
            cuerpo.appendChild(b);
            cuerpo.appendChild(_el('span', 'gestion-hint', nota));
          });
        cuerpo.appendChild(_el('p', 'gestion-hint', 'Vas a descubrir las comunidades de ' + pueblo.nombre + '.'));
      } else if (paso === 3) {
        cuerpo.appendChild(_el('p', 'gestion-paso-tit', '3. Objetivos — a dónde queremos llegar'));
        cuerpo.appendChild(_el('label', null, 'Nombre de la Agencia (máx. 24):'));
        const inp = _el('input', 'creador-input'); inp.type = 'text'; inp.maxLength = 24;
        inp.value = sel.nombre; inp.placeholder = 'La Juntada, El Galpón, etc.';
        inp.addEventListener('input', () => { sel.nombre = inp.value; });
        cuerpo.appendChild(inp);
        cuerpo.appendChild(_el('p', 'gestion-hint', 'Elegí 2–3 objetivos (dan empuje a las líneas afines):'));
        L.OBJETIVOS.forEach((o) => {
          const fila = _el('label', 'gestion-check');
          const cb = _el('input'); cb.type = 'checkbox'; cb.checked = sel.objetivos.indexOf(o.id) >= 0;
          cb.addEventListener('change', () => {
            const i = sel.objetivos.indexOf(o.id);
            if (cb.checked && i < 0) { if (sel.objetivos.length >= 3) { cb.checked = false; return; } sel.objetivos.push(o.id); }
            else if (!cb.checked && i >= 0) sel.objetivos.splice(i, 1);
          });
          fila.appendChild(cb);
          fila.appendChild(_el('span', 'gestion-check-nom', o.nombre));
          cuerpo.appendChild(fila);
        });
      } else if (paso === 4) {
        cuerpo.appendChild(_el('p', 'gestion-paso-tit', '4. Organización — cómo nos organizamos'));
        const cap = Math.min(20, ep.onboarding.candidatos || 0);
        if (sel.nMiembros > cap) sel.nMiembros = cap;
        cuerpo.appendChild(_el('p', 'gestion-hint', 'Tu convocatoria juntó ' + (ep.onboarding.candidatos || 0) + ' candidatos (tope ' + cap + ').'));
        const filaR = _el('div', 'gestion-rango');
        const rango = _el('input'); rango.type = 'range'; rango.min = 0; rango.max = String(cap); rango.value = String(sel.nMiembros);
        const lbl = _el('span', 'gestion-rango-val', '');
        function pintarN() {
          lbl.textContent = sel.nMiembros + (sel.nMiembros < 3 ? ' → Referente solo (todo cuesta el doble)' : ' miembros → Agencia');
          lbl.className = 'gestion-rango-val' + (sel.nMiembros < 3 ? ' solo' : '');
        }
        rango.addEventListener('input', () => { sel.nMiembros = parseInt(rango.value, 10) || 0; pintarN(); });
        filaR.appendChild(rango); filaR.appendChild(lbl);
        cuerpo.appendChild(filaR); pintarN();
        cuerpo.appendChild(_el('p', 'gestion-hint', 'Roles que querés cubrir (opcional):'));
        const filaRoles = _el('div', 'creador-fila');
        L.ROLES.forEach((r) => {
          const b = _el('button', 'creador-opt' + (sel.roles.indexOf(r.id) >= 0 ? ' sel' : ''), r.nombre);
          b.type = 'button';
          b.addEventListener('click', () => {
            const i = sel.roles.indexOf(r.id);
            if (i >= 0) sel.roles.splice(i, 1); else sel.roles.push(r.id);
            b.classList.toggle('sel');
          });
          filaRoles.appendChild(b);
        });
        cuerpo.appendChild(filaRoles);
      }
    }

    function actualizarCandidatos() {
      const ef = L.EFECT[pueblo.nivel] || L.EFECT[1];
      let n = 0; sel.canales.forEach((c) => { n += (ef[c] || 0); });
      const el = document.getElementById('gestion-cand');
      if (el) el.textContent = 'Candidatos estimados: ' + n + (n < 3 ? '  (cuidado: pocos para armar Agencia)' : '');
    }

    function avanzar() {
      // Confirma el paso actual en el estado y avanza.
      if (paso === 1) L.convocatoria(estado, sel.canales, sel.conMate);
      else if (paso === 2) L.diagnostico(estado, sel.diagnostico);
      else if (paso === 3) L.objetivos(estado, sel.nombre, sel.objetivos);
      else if (paso === 4) {
        L.organizacion(estado, sel.nMiembros, sel.roles);
        const res = L.finalizar(estado);
        if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
        cerrar();
        if (onDone) { try { onDone(res); } catch (e) { console.warn('[Onboarding] onDone', e); } }
        return;
      }
      if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
      paso++; render();
    }
    function retroceder() {
      if (paso === 1) { cerrar(); if (onDone) { try { onDone(null); } catch (e) {} } return; }
      paso--; render();
    }

    bSig.addEventListener('click', avanzar);
    bVolver.addEventListener('click', retroceder);

    document.body.appendChild(ov);
    overlay = ov;
    render();
    return ov;
  }

  return { abrir, cerrar, abierta };
})();

// ¿Hay un modal de gestión abierto? (lo consulta Pueblo.update para congelar
// el movimiento mientras el asistente está abierto).
AJ.Gestion.modalAbierta = function () {
  try { return !!(AJ.Gestion.OnboardingUI && AJ.Gestion.OnboardingUI.abierta && AJ.Gestion.OnboardingUI.abierta()); }
  catch (e) { return false; }
};
