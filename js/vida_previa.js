/* =====================================================================
 * vida_previa.js — VIDA PREVIA estilo Mount & Blade (apertura, O1)
 * ---------------------------------------------------------------------
 * Parte de la APERTURA CINEMATOGRÁFICA (CONFIG.aperturaCine). Una secuencia
 * de 4 ejes de "vida previa" que construye el pasado del Agente y define su
 * PERFIL inicial repartiendo los medidores.
 *
 * REUSA el sistema que YA existe (no inventa uno nuevo):
 *   - El eje "cómo llegaste a la Agencia" SON los ORÍGENES de N1
 *     (AJ.Gestion.Datos.ORIGENES) y se aplican con AJ.Gestion.Origen.elegir
 *     (valores ABSOLUTOS de arranque, igual que la pantalla de origen).
 *   - Los otros 3 ejes (crianza / adolescencia / fortaleza) son matices
 *     NARRATIVOS que se suman encima como deltas con AJ.Gestion.Estado
 *     .aplicarImpacto (clampeado). El origen sigue mandando la distribución.
 *
 * Es BOLT-ON: si modoGestion/origenJugador están off o algo falla, aplicar()
 * no toca medidores y la apertura igual desemboca en el juego (perfil neutro).
 *
 * Acá: datos (EJES) + lógica pura (aplicar/resumen) + UI (overlay DOM, mismo
 * estilo que las pantallas de gestión). Texto GENÉRICO y reskinable (GDD §11).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.VidaPrevia = (function () {
  'use strict';

  // --- Los 3 ejes de matices narrativos (deltas relativos, clampeados) ---
  // Cada opción suma un poco a 1-2 medidores. Sin opción "mala": cada combo
  // es otra partida. Los ids de medidor son los de AJ.Gestion.Datos.MEDIDORES.
  const CRIANZA = {
    id: 'crianza', titulo: 'Tu infancia', icono: '🏡',
    pregunta: '¿Dónde te criaste?',
    opciones: [
      { id: 'pueblochico', label: 'En un pueblo chico', desc: 'Donde todos se conocen y la palabra vale.', impactos: { vinculoEscolar: 10, conocimiento: 8 } },
      { id: 'ciudad', label: 'En la ciudad', desc: 'Colectivos, cola en todos lados, mil estímulos.', impactos: { carisma: 10, confianza: 6 } },
      { id: 'campo', label: 'En el campo', desc: 'Lejos de todo; aprendiste a aguantar y a resolver.', impactos: { conviccion: 10, confianza: 6 } },
    ],
  };
  const ADOLESCENCIA = {
    id: 'adolescencia', titulo: 'Tu adolescencia', icono: '🎒',
    pregunta: '¿Qué hacías de adolescente?',
    opciones: [
      { id: 'deporte', label: 'Deporte en el club', desc: 'Entrenamientos, equipo, tercer tiempo.', impactos: { agencia: 3, confianza: 8 } },
      { id: 'estudio', label: 'A los libros', desc: 'Abanderada/o, olimpíadas, siempre estudiando.', impactos: { conocimiento: 12, vinculoEscolar: 6 } },
      { id: 'militancia', label: 'Centro de estudiantes', desc: 'Asambleas, reclamos, organizar a los pibes.', impactos: { conviccion: 10, agencia: 3 } },
      { id: 'laburo', label: 'Laburando desde pibe/a', desc: 'Changas, el negocio familiar, la calle.', impactos: { confianza: 10, carisma: 6 } },
      { id: 'arte', label: 'Arte y música', desc: 'La banda, el taller, la murga, los escenarios.', impactos: { carisma: 12, conocimiento: 5 } },
    ],
  };
  const FORTALEZA = {
    id: 'fortaleza', titulo: 'Tu fuerte', icono: '⭐',
    pregunta: '¿Cuál es tu mayor fortaleza?',
    opciones: [
      { id: 'escuchar', label: 'Sabés escuchar', desc: 'La gente te cuenta cosas que no le cuenta a nadie.', impactos: { conocimiento: 8, vinculoEscolar: 8 } },
      { id: 'plantarte', label: 'Te plantás', desc: 'No aflojás cuando hay que bancar una postura.', impactos: { conviccion: 10, confianza: 6 } },
      { id: 'caerbien', label: 'Caés bien a todos', desc: 'Donde entrás, en cinco minutos sos de la casa.', impactos: { carisma: 10, agencia: 2 } },
      { id: 'resolver', label: 'Resolvés quilombos', desc: 'Donde otros ven un lío, vos ves el cómo.', impactos: { confianza: 8, conocimiento: 8 } },
    ],
  };

  // Orden de presentación: crianza → adolescencia → LLEGADA (orígenes N1) → fortaleza.
  // El eje LLEGADA se arma dinámicamente desde los ORÍGENES existentes.
  function llegadaEje() {
    const D = AJ.Gestion && AJ.Gestion.Datos;
    const ors = (D && D.ORIGENES) || [];
    return {
      id: 'llegada', titulo: 'Cómo llegaste', icono: '🚪', origen: true,
      pregunta: '¿Cómo llegaste a la Agencia?',
      opciones: ors.map((o) => ({ id: o.id, label: o.nombre, desc: o.desc, origen: true })),
    };
  }

  function ejes() { return [CRIANZA, ADOLESCENCIA, llegadaEje(), FORTALEZA]; }

  function _opcion(eje, id) { return (eje.opciones || []).find((o) => o.id === id) || null; }

  // Selección por defecto (la 1ª opción de cada eje) — usada al saltear.
  function seleccionDefault() {
    const out = {};
    ejes().forEach((e) => { if (e.opciones && e.opciones[0]) out[e.id] = e.opciones[0].id; });
    return out;
  }

  // Aplica una selección { crianza, adolescencia, llegada, fortaleza } al estado.
  // - llegada: AJ.Gestion.Origen.elegir (ABSOLUTO; setea ep.origen + findesMenos).
  // - el resto: deltas con aplicarImpacto (clamp). Devuelve el EstadoPueblo (o null).
  //
  // IDEMPOTENTE: resetea los medidores a su base y limpia el origen antes de
  // recomponer, así llamarlo N veces (preview del resumen + finalización) da
  // SIEMPRE el mismo resultado (los deltas relativos no se acumulan).
  function aplicar(estado, sel) {
    try {
      if (!estado || !AJ.Gestion || !AJ.Gestion.Estado) return null;
      const E = AJ.Gestion.Estado;
      E.asegurar(estado, (estado.gestion && estado.gestion.actual) || null);
      const ep = E.actual(estado);
      if (!ep) return null;
      sel = sel || {};
      // 0) Reset a base (idempotencia): medidores iniciales + origen sin elegir.
      ep.medidores = E.medidoresIniciales();
      ep.origen = null;
      // 1) Base ABSOLUTA: el origen (reusa N1). Si no hay elección, queda el default.
      const llegada = sel.llegada;
      if (llegada && AJ.Gestion.Origen && AJ.Gestion.Origen.elegir) {
        AJ.Gestion.Origen.elegir(estado, llegada);
      }
      // 2) Matices narrativos: deltas relativos (clampeados) de los otros 3 ejes.
      [CRIANZA, ADOLESCENCIA, FORTALEZA].forEach((eje) => {
        const op = _opcion(eje, sel[eje.id]);
        if (op && op.impactos) E.aplicarImpacto(ep, op.impactos);
      });
      // 3) Esto ENVUELVE la Mesa (N2): la apertura ES la Mesa, no la repitas después.
      if (estado.gestion) estado.gestion.mesaVista = true;
      return ep;
    } catch (e) { console.warn('[VidaPrevia] aplicar falló', e); return null; }
  }

  // Frase-resumen del perfil ("Sos alguien que...") + los medidores destacados.
  function resumen(estado, sel) {
    sel = sel || {};
    const fr = [];
    const cz = _opcion(CRIANZA, sel.crianza);
    const ad = _opcion(ADOLESCENCIA, sel.adolescencia);
    const fo = _opcion(FORTALEZA, sel.fortaleza);
    const ll = (llegadaEje().opciones || []).find((o) => o.id === sel.llegada);
    if (cz) fr.push('se crió ' + cz.label.toLowerCase());
    if (ad) fr.push('de joven andaba ' + ad.label.toLowerCase());
    if (ll) fr.push('llegó a la Agencia "' + ll.label.toLowerCase() + '"');
    if (fo) fr.push('y su fuerte es que ' + fo.label.toLowerCase());
    const frase = 'Sos alguien que ' + (fr.length ? fr.join(', ') : 'recién empieza') + '.';

    // Medidores destacados (top 2 / bottom 1) tras aplicar — sobre una copia.
    let destacados = '';
    try {
      const D = AJ.Gestion && AJ.Gestion.Datos, E = AJ.Gestion && AJ.Gestion.Estado;
      const ep = E && E.actual(estado);
      if (D && ep) {
        const ranked = D.MEDIDORES.map((m) => ({ m, v: ep.medidores[m.id] }))
          .sort((a, b) => (b.v / b.m.max) - (a.v / a.m.max));
        const top = ranked.slice(0, 2).map((x) => '↑ ' + x.m.nombre);
        const low = ranked.slice(-1).map((x) => '↓ ' + x.m.nombre);
        destacados = top.concat(low).join('   ·   ');
      }
    } catch (e) {}
    return { frase, destacados };
  }

  return { ejes, llegadaEje, CRIANZA, ADOLESCENCIA, FORTALEZA, seleccionDefault, aplicar, resumen };
})();

/* --------------------------- UI (overlay DOM) ----------------------- */
AJ.VidaPreviaUI = (function () {
  'use strict';

  const V = AJ.VidaPrevia;
  let overlay = null;

  function _el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function cerrar() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }
  function abierta() { return !!overlay; }

  // Recorre los ejes uno por uno y al final muestra el resumen. onDone(sel).
  // estado: se va aplicando en vivo para que el resumen muestre los medidores.
  function abrir(scene, estado, onDone) {
    cerrar();
    const ejes = V.ejes();
    const sel = {};
    let i = 0;

    const ov = _el('div', 'modal-dom'); ov.id = 'vida-previa';
    const panel = _el('div', 'modal-panel gestion-panel'); ov.appendChild(panel);

    function pintarEje() {
      const eje = ejes[i];
      panel.innerHTML = '';
      panel.appendChild(_el('p', 'gestion-sub', 'Tu historia  ·  paso ' + (i + 1) + '/' + (ejes.length + 1)));
      panel.appendChild(_el('h2', null, (eje.icono ? eje.icono + ' ' : '') + eje.pregunta));
      const cont = _el('div', 'gestion-cuerpo'); panel.appendChild(cont);
      (eje.opciones || []).forEach((o) => {
        const b = _el('button', 'gestion-accion'); b.type = 'button';
        b.appendChild(_el('span', 'gestion-accion-tit', o.label));
        if (o.desc) b.appendChild(_el('span', 'gestion-accion-sub', o.desc));
        b.addEventListener('click', () => {
          sel[eje.id] = o.id;
          if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
          i++;
          if (i >= ejes.length) { V.aplicar(estado, sel); pintarResumen(); }
          else pintarEje();
        });
        cont.appendChild(b);
      });
    }

    function pintarResumen() {
      panel.innerHTML = '';
      const res = V.resumen(estado, sel);
      panel.appendChild(_el('p', 'gestion-sub', 'Tu perfil'));
      panel.appendChild(_el('h2', null, '¿Quién sos?'));
      panel.appendChild(_el('p', 'gestion-situacion', res.frase));
      if (res.destacados) panel.appendChild(_el('p', 'gestion-accion-sub', res.destacados));
      const pie = _el('div', 'creador-fila acciones'); panel.appendChild(pie);
      const b1 = _el('button', 'creador-btn primario', '¡A trabajar! »'); b1.type = 'button';
      b1.addEventListener('click', () => {
        if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
        cerrar();
        if (onDone) { try { onDone(sel); } catch (e) {} }
      });
      pie.appendChild(b1);
    }

    pintarEje();
    document.body.appendChild(ov);
    overlay = ov;
    return ov;
  }

  return { abrir, cerrar, abierta };
})();
