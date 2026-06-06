/* =====================================================================
 * gestion/ciclo.js — CICLO DE 30 DÍAS + MUDANZA (G5, CONFIG.cicloGestion)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.cicloGestion (requiere modoGestion). Integra el
 * motor (G1–G4) en el loop del GDD §2:
 *   - RECON (días 1–5): no gestionás; explorás, hablás y armás la Agencia
 *     (onboarding G2). Al completar los 5 días te ofrecen el rol según cómo te
 *     ganaste a la gente (Agencia o Referente solo).
 *   - GESTIÓN (días 6–30): 3 acciones por día. Cada acción es un DILEMA (G3) o
 *     una ACTIVIDAD de las 5 líneas (GDD §9), resuelta con el dado (G4).
 *   - CIERRE (día 30): perfil de gestor según los 5 medidores y los dilemas.
 *   - MUDANZA: te vas a otro pueblo; recon de nuevo, pero heredás experiencia
 *     (piso de Confianza, lectura más rápida).
 *
 * Las teclas temporales G/H (G2/G3) dejan de ser entradas sueltas: con el ciclo
 * activo, todo vive en el "menú del día" (AJ.Gestion.CicloUI).
 *
 * Si el flag está off o algo falla, no se inicializa y G1–G4 siguen como estaban.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

/* ----------------------- LÓGICA (pura, testeable) ------------------- */
AJ.Gestion.Ciclo = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;

  const RECON_DIAS = 5, TOTAL_DIAS = 30, ACCIONES_DIA = 3;

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.cicloGestion); }

  // Completa los campos del ciclo en un EstadoPueblo (migración suave: no pisa nada).
  function asegurarCampos(ep) {
    if (!ep) return ep;
    if (typeof ep.fase !== 'string') ep.fase = 'recon';
    if (typeof ep.dia !== 'number') ep.dia = 1;
    if (typeof ep.accionesHoy !== 'number') ep.accionesHoy = 0;
    if (typeof ep.accionesRecon !== 'number') ep.accionesRecon = 0;
    if (!('perfil' in ep)) ep.perfil = null;
    return ep;
  }
  function ep(estado) { E.asegurar(estado, null); return asegurarCampos(E.actual(estado)); }

  // ---- RECON (días 1–5) ----
  function reconRestantes(e) { return Math.max(0, RECON_DIAS - (e.accionesRecon || 0)); }
  function reconCompleto(e) { return (e.accionesRecon || 0) >= RECON_DIAS; }
  function puedeOfrecerRol(e) { return e.fase === 'recon' && reconCompleto(e); }

  // Una acción de reconocimiento (explorar / hablar / armar agencia) gasta un día.
  function accionRecon(estado, tipo) {
    const e = ep(estado);
    if (e.fase !== 'recon' || reconCompleto(e)) return null;
    const imp = {};
    if (tipo === 'explorar') { imp.conocimiento = 6; }
    else if (tipo === 'hablar') { imp.vinculoEscolar = 5; imp.conocimiento = 2; }
    // 'agencia' no aplica impactos acá: los aplica el onboarding (G2); sólo cuenta el día.
    const reales = Object.keys(imp).length ? E.aplicarImpacto(e, imp) : {};
    e.accionesRecon = (e.accionesRecon || 0) + 1;
    e.dia = Math.min(RECON_DIAS, 1 + e.accionesRecon);
    // G6: explorar/hablar revela una comunidad oculta del pueblo (si está activo).
    let comunidadRevelada = null;
    if ((tipo === 'explorar' || tipo === 'hablar') && AJ.Gestion.Comunidades && AJ.Gestion.Comunidades.activo && AJ.Gestion.Comunidades.activo()) {
      try { comunidadRevelada = AJ.Gestion.Comunidades.revelarUna(estado); } catch (e2) {}
    }
    return { tipo: tipo, impactos: reales, dia: e.dia, accionesRecon: e.accionesRecon, comunidadRevelada: comunidadRevelada };
  }

  // Aceptar el rol al cierre del recon: pasa a gestión (día 6). Sin Agencia → Referente solo.
  function aceptarRol(estado) {
    const e = ep(estado);
    if (e.fase !== 'recon') return null;
    if (!e.onboarding.hecho) {
      e.onboarding.hecho = true;
      e.onboarding.referenteSolo = true;
      E.setMedidor(e, 'agencia', 0);
    }
    e.fase = 'gestion';
    e.dia = RECON_DIAS + 1;
    e.accionesHoy = 0;
    return { fase: e.fase, dia: e.dia, referenteSolo: !!e.onboarding.referenteSolo };
  }

  // ---- GESTIÓN (días 6–30) ----
  function accionesRestantes(e) { return Math.max(0, ACCIONES_DIA - (e.accionesHoy || 0)); }
  function consumirAccion(estado) {
    const e = ep(estado);
    if (e.fase !== 'gestion' || accionesRestantes(e) <= 0) return false;
    e.accionesHoy = (e.accionesHoy || 0) + 1;
    return true;
  }
  function cerrarDia(estado) {
    const e = ep(estado);
    if (e.fase !== 'gestion') return null;
    e.accionesHoy = 0;
    e.dia += 1;
    if (e.dia > TOTAL_DIAS) { e.fase = 'cerrado'; e.perfil = calcularPerfil(e); }
    return { dia: e.dia, fase: e.fase };
  }

  // ---- PERFIL (día 30) ----
  function calcularPerfil(e) {
    const m = e.medidores;
    const solo = !!(e.onboarding && e.onboarding.referenteSolo);
    const reglas = [
      { id: 'articulador', cond: m.agencia >= 10 && m.conocimiento >= 60,
        titulo: 'Articulador/a de la comunidad',
        desc: 'Armaste equipo y conocés a los pibes: la agencia te sobrevive.' },
      { id: 'idealista', cond: m.conviccion >= 70 && m.confianza < 50,
        titulo: 'Idealista de fierro',
        desc: 'No cediste la agenda joven, aunque te costó recursos y roscas.' },
      { id: 'operador', cond: m.confianza >= 70 && m.conviccion < 45,
        titulo: 'Operador/a político/a',
        desc: 'Te ganaste al municipio y la caja; algunos dicen que de más.' },
      { id: 'cercano', cond: m.vinculoEscolar >= 65 && m.conocimiento >= 55,
        titulo: 'El/la del territorio',
        desc: 'La escuela y los pibes te abrieron la puerta; pisás fuerte abajo.' },
      { id: 'solitario', cond: solo,
        titulo: 'Referente solo',
        desc: 'Hiciste todo a pulmón. Llegaste, pero te costó el doble.' },
    ];
    const r = reglas.find((x) => x.cond);
    if (r) return { id: r.id, titulo: r.titulo, desc: r.desc };
    const prom = (m.vinculoEscolar + m.conocimiento + m.confianza + m.conviccion) / 4;
    if (prom >= 60) return { id: 'completo', titulo: 'Gestor/a equilibrado/a', desc: 'Nadie quedó del todo conforme, pero dejaste el pueblo mejor.' };
    return { id: 'aprendiz', titulo: 'Aprendiz de gestión', desc: 'Te llevás la experiencia; el próximo pueblo te va a salir mejor.' };
  }

  // ---- MUDANZA ----
  function pueblosDisponibles(estado) {
    E.asegurar(estado, null);
    const g = estado.gestion;
    return D.PUEBLOS.filter((p) => p.id !== g.actual);
  }
  function mudarse(estado, puebloId) {
    E.asegurar(estado, null);
    const g = estado.gestion;
    if (!D.pueblo(puebloId) || puebloId === g.actual) return null;
    // La experiencia y su bonus se aplican SÓLO al pisar un pueblo por PRIMERA vez
    // (si no, rebotar A↔B re-pisaría la Confianza y ratchetearía el Conocimiento).
    const nuevo = !g.pueblos[puebloId];
    if (nuevo) {
      g.pueblos[puebloId] = E.crearPueblo(puebloId);
      g.experiencia.mudanzas = (g.experiencia.mudanzas || 0) + 1;
      const veces = g.experiencia.mudanzas;
      const e = asegurarCampos(g.pueblos[puebloId]);
      const piso = Math.min(70, 40 + 8 * veces);
      if (e.medidores.confianza < piso) e.medidores.confianza = piso;
      e.medidores.conocimiento = E.clampMedidor('conocimiento', e.medidores.conocimiento + 6 * veces);
    } else {
      asegurarCampos(g.pueblos[puebloId]);
    }
    g.actual = puebloId;
    return g.pueblos[puebloId];
  }

  return {
    RECON_DIAS, TOTAL_DIAS, ACCIONES_DIA, activo, asegurarCampos, ep,
    reconRestantes, reconCompleto, puedeOfrecerRol, accionRecon, aceptarRol,
    accionesRestantes, consumirAccion, cerrarDia, calcularPerfil,
    pueblosDisponibles, mudarse,
  };
})();

/* --------------------- ACTIVIDADES (las 5 líneas) ------------------- */
AJ.Gestion.Actividades = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const T = AJ.Gestion.Tiradas;

  // Impacto BASE de cada línea (en éxito; el dado lo modula). Las actividades
  // cuestan recursos (confianza−) y construyen otros medidores.
  const BASE = {
    culturaTurismo: { vinculoEscolar: 7, conocimiento: 3, confianza: -4 },
    feriaMercado: { confianza: 6, conocimiento: 3, conviccion: -3 },
    mediosComunicacion: { conocimiento: 7, vinculoEscolar: 3, confianza: -4 },
    capacitacionesPrevencion: { vinculoEscolar: 6, conviccion: 5, confianza: -5 },
    interesesAlternativos: { conocimiento: 6, agencia: 1, confianza: -4 },
  };

  // ¿El pueblo tiene la infraestructura que pide la actividad?
  function infraOk(estado, act) {
    const g = estado.gestion; const p = D.pueblo(g.actual);
    const tiene = (p && p.infra) || [];
    return (act.infra || []).every((i) => tiene.indexOf(i) >= 0);
  }

  // G6 lo sobrescribe para sumar bonus por comunidad conocida; en G5 es 0.
  function bonusComunidad(estado, act) { return 0; }

  // Resuelve una actividad con tirada. Sin la infra → cuesta más (dificultad +4),
  // salvo que pidas COOPERACIÓN REGIONAL (G6): te prestan la infra vecina pero
  // cuesta coordinar (−Confianza), a cambio de tirar en dificultad normal.
  function resolver(estado, actividadId, opts) {
    opts = opts || {};
    const act = D.actividad(actividadId);
    if (!act) return null;
    let base = BASE[actividadId] || {};
    const okInfra = infraOk(estado, act);
    let dificultad = okInfra ? 12 : 16;
    let cooperacion = false;
    if (!okInfra && opts.cooperacion) {
      dificultad = 12; cooperacion = true;
      base = Object.assign({}, base, { confianza: (base.confianza || 0) - 3 }); // costo de coordinar
    }
    const bonus = bonusComunidad(estado, act);
    const r = T.aplicar(estado, base, { dificultad: dificultad, medidores: ['conocimiento', 'confianza'], bonus: bonus });
    return { actividad: act, infraOk: okInfra, cooperacion: cooperacion, dificultad: dificultad, bonus: bonus, tirada: r.tirada, impactosReales: r.impactosReales };
  }

  return { BASE, infraOk, bonusComunidad, resolver };
})();

/* --------------------------- UI (menú del día) ---------------------- */
AJ.Gestion.CicloUI = (function () {
  'use strict';

  const C = AJ.Gestion.Ciclo;
  const D = AJ.Gestion.Datos;
  const A = AJ.Gestion.Actividades;
  const M = AJ.Gestion.Dilemas;

  let overlay = null, scene = null, estado = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function abierta() { return !!overlay; }
  function cerrar() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }

  function abrir(sc, est) { scene = sc; estado = est; C.ep(estado); render(); }

  function _guardar() { if (scene && scene.guardar) { try { scene.guardar(); } catch (e) {} } }
  function _sonido(fn) { if (AJ.Sonido && AJ.Sonido[fn]) { try { AJ.Sonido[fn](); } catch (e) {} } }

  function medidoresHTML(e) {
    const cont = _el('div', 'gestion-medidores');
    D.MEDIDORES.forEach((m) => {
      const row = _el('div', 'gestion-med-row');
      row.appendChild(_el('span', 'gestion-med-nom', m.abrev));
      const bar = _el('div', 'gestion-med-bar');
      const fill = _el('div', 'gestion-med-fill');
      const v = e.medidores[m.id], pct = Math.round((v - m.min) / (m.max - m.min) * 100);
      fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(_el('span', 'gestion-med-val', '' + v));
      row.title = m.nombre;
      cont.appendChild(row);
    });
    return cont;
  }

  // G6: panel de comunidades (descubiertas / total) — sólo si el flag está on.
  function comunidadesHTML(e) {
    const CM = AJ.Gestion.Comunidades;
    if (!CM || !CM.activo || !CM.activo()) return null;
    const total = CM.delPueblo(estado).length;
    const conoc = CM.delPueblo(estado).filter((id) => CM.conocida(estado, id));
    const cont = _el('div', 'gestion-comunidades');
    const tit = CM.esIntegracion(estado)
      ? 'Comunidades (integración): ' + conoc.length + '/' + total
      : 'Comunidades descubiertas: ' + conoc.length + '/' + total;
    cont.appendChild(_el('p', 'gestion-com-tit', tit));
    const chips = _el('div', 'gestion-com-chips');
    CM.delPueblo(estado).forEach((id) => {
      const c = D.comunidad(id); const vista = CM.conocida(estado, id);
      const chip = _el('span', 'gestion-com-chip' + (vista ? ' vista' : ''), vista ? c.nombre : '???');
      if (vista) chip.title = c.nota || '';
      chips.appendChild(chip);
    });
    cont.appendChild(chips);
    return cont;
  }

  function render() {
    cerrar();
    if (AJ.Gestion.Comunidades && AJ.Gestion.Comunidades.prepararPueblo) {
      try { AJ.Gestion.Comunidades.prepararPueblo(estado); } catch (e) {}
    }
    const e = C.ep(estado);
    const pueblo = D.pueblo(estado.gestion.actual);
    const ov = _el('div', 'modal-dom'); ov.id = 'gestion-ciclo';
    const panel = _el('div', 'modal-panel gestion-panel'); ov.appendChild(panel);

    panel.appendChild(_el('h2', null, pueblo.nombre));
    const faseTxt = e.fase === 'recon' ? 'Reconocimiento' : (e.fase === 'gestion' ? 'Gestión' : 'Cierre');
    let sub = 'Día ' + e.dia + '/' + C.TOTAL_DIAS + ' · ' + faseTxt;
    if (e.fase === 'gestion') sub += '  ·  ' + C.accionesRestantes(e) + ' acciones hoy';
    panel.appendChild(_el('p', 'gestion-sub', sub));
    panel.appendChild(medidoresHTML(e));
    const comHTML = comunidadesHTML(e);
    if (comHTML) panel.appendChild(comHTML);

    const cuerpo = _el('div', 'gestion-cuerpo'); panel.appendChild(cuerpo);
    if (e.fase === 'recon') renderRecon(cuerpo, e);
    else if (e.fase === 'gestion') renderGestion(cuerpo, e);
    else renderCierre(cuerpo, e);

    const pie = _el('div', 'creador-fila acciones'); panel.appendChild(pie);
    const bSalir = _el('button', 'creador-btn', 'Cerrar'); bSalir.type = 'button';
    bSalir.addEventListener('click', () => { _guardar(); cerrar(); });
    pie.appendChild(bSalir);

    document.body.appendChild(ov); overlay = ov;
  }

  function _btn(cuerpo, txt, sub, onClick) {
    const b = _el('button', 'gestion-accion'); b.type = 'button';
    b.appendChild(_el('span', 'gestion-accion-tit', txt));
    if (sub) b.appendChild(_el('span', 'gestion-accion-sub', sub));
    b.addEventListener('click', onClick);
    cuerpo.appendChild(b);
    return b;
  }

  // ---- RECON ----
  function renderRecon(cuerpo, e) {
    cuerpo.appendChild(_el('p', 'gestion-paso-tit', 'Reconocimiento — leé el pueblo (días 1–5)'));
    if (C.puedeOfrecerRol(e)) {
      const conAgencia = e.onboarding.hecho && !e.onboarding.referenteSolo;
      const standing = e.medidores.vinculoEscolar + e.medidores.conocimiento;
      const txt = conAgencia
        ? 'Cerraste el reconocimiento con una Agencia armada. La comunidad te reconoce: te ofrecen ser el/la Agente Juvenil.'
        : (e.onboarding.hecho
          ? 'Cerraste el reconocimiento. Te ofrecen el rol, pero vas a estar bastante solo.'
          : 'Pasaron los 5 días sin armar Agencia. Te ofrecen el rol igual, pero todo va a costar el doble.');
      cuerpo.appendChild(_el('p', 'gestion-hint', txt + (standing >= 110 ? ' Te ganaste a la gente.' : '')));
      _btn(cuerpo, 'Aceptar el rol y empezar a gestionar', 'Pasás a los días 6–30', () => {
        C.aceptarRol(estado); _sonido('mision'); _guardar(); render();
      });
      return;
    }
    cuerpo.appendChild(_el('p', 'gestion-hint', 'Te quedan ' + C.reconRestantes(e) + ' días de reconocimiento.'));
    if (!e.onboarding.hecho && AJ.Gestion.OnboardingUI) {
      _btn(cuerpo, 'Armar la Agencia', 'Los 4 pasos de la Hoja de Ruta (gasta un día)', () => {
        cerrar();
        AJ.Gestion.OnboardingUI.abrir(scene, estado, (res) => {
          // Si canceló (res == null) NO gasta el día: sólo reabrir el menú.
          if (!res) { render(); return; }
          // El ciclo manda sobre la fase: el onboarding no debe saltar a "gestión".
          const e2 = C.ep(estado); e2.fase = 'recon';
          C.accionRecon(estado, 'agencia'); _guardar(); render();
        });
      });
    }
    _btn(cuerpo, 'Explorar el pueblo', '+Conocimiento, revela una comunidad (gasta un día)', () => {
      C.accionRecon(estado, 'explorar'); _sonido('click'); _guardar(); render();
    });
    _btn(cuerpo, 'Hablar con la gente', '+Vínculo escolar, revela una comunidad (gasta un día)', () => {
      C.accionRecon(estado, 'hablar'); _sonido('click'); _guardar(); render();
    });
    // G6: activar una comunidad LATENTE (sembrar una movida nueva). No gasta día,
    // pero cuesta capital político (−Confianza).
    const CM = AJ.Gestion.Comunidades;
    if (CM && CM.activo && CM.activo()) {
      CM.latentes(estado).forEach((id) => {
        const c = D.comunidad(id);
        if (!c || CM.conocida(estado, id)) return;
        _btn(cuerpo, 'Sembrar: ' + c.nombre, 'Activás una comunidad latente (−2 Confianza)', () => {
          CM.activarLatente(estado, id);
          AJ.Gestion.Estado.aplicarImpacto(C.ep(estado), { confianza: -2 });
          _sonido('click'); _guardar(); render();
        });
      });
    }
  }

  // ---- GESTIÓN ----
  function renderGestion(cuerpo, e) {
    if (C.accionesRestantes(e) <= 0) {
      cuerpo.appendChild(_el('p', 'gestion-hint', 'Se te acabaron las acciones de hoy.'));
      _btn(cuerpo, 'Cerrar el día', 'Avanza al día siguiente', () => {
        C.cerrarDia(estado); _sonido('click'); _guardar(); render();
      });
      renderMudanza(cuerpo, 'Mudarte a otro pueblo (abandona este)');
      return;
    }
    cuerpo.appendChild(_el('p', 'gestion-paso-tit', 'Elegí una acción (te quedan ' + C.accionesRestantes(e) + ')'));
    // Dilemas elegibles (hasta 2).
    const dilemas = M ? M.elegibles(estado).slice(0, 2) : [];
    dilemas.forEach((d) => {
      const pro = D.problematica(d.problematica);
      _btn(cuerpo, 'Dilema: ' + (pro ? pro.nombre : d.problematica), d.situacion.slice(0, 70) + '…', () => {
        // Consumir la acción al ABRIR (como las actividades): así resolver y salir
        // con ESC no deja un dilema resuelto "gratis" (el efecto se materializa al elegir).
        if (!C.consumirAccion(estado)) return;
        cerrar();
        AJ.Gestion.DilemasUI.abrir(scene, estado, d, () => { _guardar(); render(); });
      });
    });
    // Actividades (las 5 líneas).
    const CM = AJ.Gestion.Comunidades;
    const conComunidades = !!(CM && CM.activo && CM.activo());
    D.ACTIVIDADES.forEach((act) => {
      const okInfra = A.infraOk(estado, act);
      const bonus = (A.bonusComunidad ? A.bonusComunidad(estado, act) : 0);
      const usarCoop = !okInfra && conComunidades; // sin infra: cooperación regional
      let sub = okInfra ? 'Tirada normal' : (usarCoop ? 'Con cooperación regional (−3 Confianza)' : 'Sin la infra: cuesta más');
      if (bonus > 0) sub += '  ·  +' + bonus + ' por comunidad conocida';
      _btn(cuerpo, 'Actividad: ' + act.nombre, sub, () => {
        C.consumirAccion(estado);
        const res = A.resolver(estado, act.id, { cooperacion: usarCoop });
        _sonido('mision');
        renderResultadoActividad(res);
      });
    });
    // G6: actividad-puente (sólo en integración, nivel 4) — junta comunidades.
    if (conComunidades && CM.esIntegracion(estado) && A.resolverPuente) {
      const conoc = CM.delPueblo(estado).filter((id) => CM.conocida(estado, id));
      if (conoc.length >= 2) {
        _btn(cuerpo, 'Actividad-puente', 'Junta ' + conoc.length + ' comunidades; vale más, más difícil', () => {
          C.consumirAccion(estado);
          const res = A.resolverPuente(estado, conoc);
          _sonido('mision');
          renderResultadoActividad({ actividad: { nombre: 'Actividad-puente' }, infraOk: true, tirada: res.tirada, impactosReales: res.impactosReales });
        });
      }
    }
  }

  function renderResultadoActividad(res) {
    cerrar();
    const ov = _el('div', 'modal-dom'); ov.id = 'gestion-ciclo';
    const panel = _el('div', 'modal-panel gestion-panel'); ov.appendChild(panel);
    panel.appendChild(_el('h2', null, res.actividad.nombre));
    const t = res.tirada;
    const linea = '🎲 ' + t.dado + (t.mods >= 0 ? ' + ' + t.mods : ' − ' + Math.abs(t.mods)) +
      ' = ' + t.total + '  vs  ' + t.dificultad + '   →   ' + (t.info ? t.info.nombre : t.resultado);
    panel.appendChild(_el('p', 'gestion-tirada gestion-res-' + t.resultado, linea));
    if (!res.infraOk) panel.appendChild(_el('p', 'gestion-hint', 'Sin la infraestructura que pedía, salió más difícil.'));
    panel.appendChild(_el('p', 'gestion-deltas', _fmtImpactos(res.impactosReales)));
    const seguir = _el('button', 'creador-btn primario', 'Seguir »'); seguir.type = 'button';
    seguir.addEventListener('click', () => { _guardar(); render(); });
    panel.appendChild(seguir);
    document.body.appendChild(ov); overlay = ov;
  }

  function _fmtImpactos(reales) {
    const out = [];
    Object.keys(reales || {}).forEach((k) => {
      const m = D.medidor(k); if (!m || !reales[k]) return;
      out.push(m.nombre + ' ' + (reales[k] > 0 ? '+' : '') + reales[k]);
    });
    return out.join('  ·  ') || 'Sin cambios.';
  }

  // ---- CIERRE (día 30) ----
  function renderCierre(cuerpo, e) {
    const p = e.perfil || C.calcularPerfil(e);
    cuerpo.appendChild(_el('p', 'gestion-paso-tit', 'Cierre de los 30 días'));
    const card = _el('div', 'gestion-perfil');
    card.appendChild(_el('div', 'gestion-perfil-tit', p.titulo));
    card.appendChild(_el('div', 'gestion-perfil-desc', p.desc));
    cuerpo.appendChild(card);
    renderMudanza(cuerpo, 'Mudarte a otro pueblo y empezar de nuevo');
  }

  function renderMudanza(cuerpo, label) {
    const lista = C.pueblosDisponibles(estado);
    if (!lista.length) return;
    cuerpo.appendChild(_el('p', 'gestion-hint', label + ' (heredás experiencia: piso de Confianza + leés más rápido):'));
    lista.forEach((p) => {
      const nv = D.nivel(p.nivel);
      _btn(cuerpo, p.nombre, 'Nivel ' + p.nivel + (nv ? ' · ' + nv.sensacion.slice(0, 40) + '…' : ''), () => {
        C.mudarse(estado, p.id); _sonido('viaje'); _guardar(); render();
      });
    });
  }

  return { abrir, cerrar, abierta, render };
})();

// modalAbierta() ahora cubre TODOS los modales de gestión (ciclo + onboarding +
// dilemas). Redefine las versiones previas (este script carga último).
AJ.Gestion.modalAbierta = function () {
  try {
    const ui = AJ.Gestion;
    return !!(
      (ui.CicloUI && ui.CicloUI.abierta && ui.CicloUI.abierta()) ||
      (ui.OnboardingUI && ui.OnboardingUI.abierta && ui.OnboardingUI.abierta()) ||
      (ui.DilemasUI && ui.DilemasUI.abierta && ui.DilemasUI.abierta())
    );
  } catch (e) { return false; }
};
