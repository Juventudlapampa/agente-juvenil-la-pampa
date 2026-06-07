/* =====================================================================
 * gestion/datos.js — CAPA DE DATOS del Modo Gestión (G1, CONFIG.modoGestion)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.modoGestion. SÓLO datos + estado (sin UI). Es la
 * fuente única de verdad del Modo Gestión definido en GDD_Agente_Juvenil_La_Pampa.md:
 *   - los 5 MEDIDORES (§4)
 *   - las 10 COMUNIDADES (§5)
 *   - los 4 NIVELES de pueblo + el BANCO de parámetros del modelo real (§6)
 *   - los PUEBLOS jugables (FICTICIOS, §11) derivados de ese banco
 *   - las 5 LÍNEAS DE ACTIVIDAD (§9) y la INFRAESTRUCTURA (§10)
 *   - las PROBLEMÁTICAS (§7), marcando cuáles son SENSIBLES (no se autogeneran)
 *   - las REGIONES (Apéndice B) para dar carácter
 * Más AJ.Gestion.Estado: fábrica del estado de gestión y helpers de medidores.
 *
 * RESTRICCIONES (GDD §11, NO negociables):
 *   - Los pueblos jugables son INVENTADOS. Los datos reales del mapeo son sólo
 *     el MODELO INTERNO (distribución por nivel); acá NO se nombran localidades
 *     reales. Ver MODELO_NIVEL (parámetros anonimizados).
 *   - El contenido SENSIBLE (salud mental, consumos, violencias, bullying) NO se
 *     escribe acá: la taxonomía sí, el contenido va a CONTENIDO_SENSIBLE.md.
 *   - Sin apuestas ni azar con plata real (el dado es mecánica, ver G4).
 *
 * Si el flag está off o algo falla, no se inicializa y el RPG sigue igual.
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Datos = (function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * §4 — LOS CINCO MEDIDORES
   * AGENCIA va 0..20 (atado a los miembros reclutados); los otros 0..100.
   * `inicial` es un default RAZONABLE para arrancar — el balance fino se
   * ajusta jugando (ver PLAYTEST.md). El onboarding (G2) los reescribe.
   * ------------------------------------------------------------------ */
  const MEDIDORES = [
    {
      id: 'agencia', nombre: 'Agencia', abrev: 'AGE', min: 0, max: 20, inicial: 0,
      desc: 'Tamaño y fuerza de tu equipo (0 = referente solo … 20).',
      sube: 'Buen onboarding, cumplir con el grupo, darles protagonismo.',
      baja: 'Decidir solo, no escucharlos, quemarlos en tareas.',
    },
    {
      id: 'vinculoEscolar', nombre: 'Vínculo escolar', abrev: 'ESC', min: 0, max: 100, inicial: 30,
      desc: 'Llegada a la promo y los 6 años, docentes/directores piolas, familias.',
      sube: 'Charlas, encuestas, presencia en la escuela, respetar tiempos docentes.',
      baja: 'Pasar por encima de la escuela, actividades en horario de clase.',
    },
    {
      id: 'conocimiento', nombre: 'Conocimiento juvenil', abrev: 'CON', min: 0, max: 100, inicial: 20,
      desc: 'Cuánto sabés de quiénes son y qué hacen.',
      sube: 'Diagnóstico, estar en las actividades, encuestas, descubrir comunidades.',
      baja: 'Gestionar de oído desde la oficina.',
    },
    {
      id: 'confianza', nombre: 'Confianza / Recursos', abrev: 'CNF', min: 0, max: 100, inicial: 40,
      desc: 'Presupuesto + capital político que destraba más.',
      sube: 'Buena gestión, gente conforme, cumplir lo prometido.',
      baja: 'Gastar mal, prometer y no cumplir, conflicto con el municipio.',
    },
    {
      id: 'conviccion', nombre: 'Convicción', abrev: 'CVC', min: 0, max: 100, inicial: 60,
      desc: 'Integridad: defendés la agenda joven vs. cedés a la presión.',
      sube: 'Plantarte por los pibes, decisiones íntegras.',
      baja: 'Ceder al intendente/concejal/Provincia por conveniencia.',
    },
    {
      // 6º medidor (capa narrativa-temporal, GDD §2.bis). Aptitud para CONVENCER:
      // destrabar con la palabra, no con el cargo. Alimenta las tiradas de persuasión.
      id: 'carisma', nombre: 'Carisma / Persuasión', abrev: 'CAR', min: 0, max: 100, inicial: 40,
      desc: 'Aptitud para convencer: leer al otro y construir acuerdos.',
      sube: 'Hablar bien, escuchar, ceder en lo chico para ganar en lo grande.',
      baja: 'Imponer, prometer de más, quedar en offside.',
    },
  ];

  /* ------------------------------------------------------------------ *
   * §2.bis — ORÍGENES DEL JUGADOR (capa narrativa-temporal, FASE N1).
   * Cómo llegaste a estar a cargo de la Agencia. Reparte los medidores de
   * inicio (selector de dificultad blando). `medidores` = valores ABSOLUTOS
   * de arranque (el resto queda en su `inicial`). `findesMenos` = la temporada
   * arranca con ese tanto de findes menos (lo usa N3). Sin opción "mala".
   * ------------------------------------------------------------------ */
  const ORIGENES = [
    {
      id: 'merito', nombre: 'Por mérito entre los jóvenes',
      desc: 'Te eligieron los pibes. Tenés equipo y convicción, pero el intendente te mira de reojo.',
      medidores: { agencia: 8, vinculoEscolar: 35, conocimiento: 45, confianza: 25, conviccion: 80, carisma: 55 },
    },
    {
      id: 'intendente', nombre: 'Te conoce el intendente',
      desc: 'Llegás por arriba: confianza política y recursos de sobra, pero los pibes no te registran.',
      medidores: { agencia: 3, vinculoEscolar: 40, conocimiento: 15, confianza: 80, conviccion: 45, carisma: 50 },
    },
    {
      id: 'comodin', nombre: 'No había más, tenías perfil',
      desc: 'Caíste de comodín. Nada sobra, nada falta: todo medio. El recon define todo.',
      medidores: { agencia: 5, vinculoEscolar: 40, conocimiento: 40, confianza: 45, conviccion: 55, carisma: 50 },
    },
    {
      id: 'urgencia', nombre: 'Convocado de urgencia',
      desc: 'El anterior se mudó o se fue a estudiar y te llamaron a las apuradas. Modo bombero: menos tiempo y todo a medias.',
      medidores: { agencia: 2, vinculoEscolar: 30, conocimiento: 25, confianza: 35, conviccion: 45, carisma: 40 },
      findesMenos: 1,
    },
    {
      id: 'barrio', nombre: 'Venís del barrio',
      desc: 'Venís de organizar la murga, el club, el merendero. Carisma y calle de sobra; caja propia, cero.',
      medidores: { agencia: 6, vinculoEscolar: 45, conocimiento: 65, confianza: 20, conviccion: 65, carisma: 80 },
    },
  ];

  /* ------------------------------------------------------------------ *
   * §5 — LAS DIEZ COMUNIDADES
   * `rareza` 1..10: cuán raro es encontrarla (1 = universal, 10 = la más
   * rara). `tags` mapea las abreviaturas del banco del modelo (Apéndice A)
   * a esta comunidad (varias abreviaturas pueden caer en una comunidad).
   * ------------------------------------------------------------------ */
  const COMUNIDADES = [
    { id: 'deportistas', nombre: 'Deportistas', rareza: 1, tags: ['Dep'], nota: 'Universal, la puerta de entrada (el deporte aparece en casi todos los pueblos).' },
    { id: 'folklore', nombre: 'Folklore y Materos', rareza: 1, tags: ['Folk'], nota: 'El piso cultural; está en casi todos lados.' },
    { id: 'gamers', nombre: 'Gamers y eSports', rareza: 2, tags: ['Gam'], nota: 'Base digital, muy común.' },
    { id: 'tecnologia', nombre: 'Tecnología y Streamers', rareza: 2, tags: ['Tec'], nota: 'Base digital, muy común.' },
    { id: 'danza', nombre: 'Danza urbana', rareza: 3, tags: ['Danza'], nota: 'Común.' },
    { id: 'musica', nombre: 'Música y Trap / Rap', rareza: 5, tags: ['Rap'], nota: 'Media.' },
    { id: 'teatro', nombre: 'Teatro y Cultura', rareza: 5, tags: ['Teat'], nota: 'Media.' },
    { id: 'letras', nombre: 'Literatura y Ajedrez', rareza: 6, tags: ['Lit', 'Aje'], nota: 'Lo "intelectual"; media-baja.' },
    { id: 'animekpop', nombre: 'Anime, Manga y K-pop', rareza: 8, tags: ['AniK'], nota: 'Rara: marca un pueblo con vida juvenil organizada.' },
    { id: 'cienciaeco', nombre: 'Ciencia, Robótica y Activismo / Eco', rareza: 10, tags: ['Cien', 'Rob', 'Act'], nota: 'La más rara: encontrarla en un pueblo chico es un hallazgo.' },
  ];

  /* ------------------------------------------------------------------ *
   * §6 — NIVELES (1..4) y banco de parámetros del MODELO real.
   * MODELO_NIVEL: distribución empírica ANONIMIZADA (sólo números) sacada
   * del mapeo (Apéndice A). NO incluye nombres de localidades reales (§11);
   * es el banco para muestrear pueblos ficticios fieles a la distribución.
   * `comCounts` = cantidades de comunidades observadas en pueblos de ese
   * nivel (donde el dato es real; los "(estimar)" se omiten).
   * ------------------------------------------------------------------ */
  const NIVELES = {
    1: {
      nivel: 1, tamano: '< 1.000', comunidadesRango: [1, 2], presupuesto: 'mínimo', presupuestoBase: 100,
      sistema: 'Priorímetro crudo',
      sensacion: 'Cara a cara; "si no lo hacés ahora, no se hace más". El agente cubre varios pueblos.',
    },
    2: {
      nivel: 2, tamano: '1.000–3.000', comunidadesRango: [2, 3], presupuesto: 'chico', presupuestoBase: 250,
      sistema: 'Priorímetro',
      sensacion: 'Todos se conocen; las quejas son personales.',
    },
    3: {
      nivel: 3, tamano: '3.000–cabecera', comunidadesRango: [3, 7], presupuesto: 'medio', presupuestoBase: 600,
      sistema: 'Simulador + Priorímetro',
      sensacion: 'Cabeceras; arrastran parajes vecinos; el intendente pesa pero es manejable.',
    },
    4: {
      nivel: 4, tamano: 'capital', comunidadesRango: [10, 10], presupuesto: 'grande pero superado', presupuestoBase: 1200,
      sistema: 'Simulador completo',
      sensacion: 'Prensa y radio como actor; integrar, no descubrir; nadie queda conforme al máximo.',
    },
  };

  // Banco anonimizado (cantidades de comunidades por nivel, del mapeo real).
  // Sin nombres de localidades (restricción §11). Sirve para muestreo fiel.
  const MODELO_NIVEL = {
    1: { comCounts: [4, 4, 3, 2, 4, 3, 1, 1, 2, 3, 6, 3, 1, 5, 4, 1, 4, 4, 7, 1, 3, 1, 4, 2, 7, 3, 2, 4, 3, 4] },
    2: { comCounts: [8, 5, 2, 4, 3, 3, 5, 6, 2, 1, 4, 2, 4, 5, 4, 2, 2, 5] },
    3: { comCounts: [6, 8, 6, 7, 9, 8, 3, 12, 4, 1, 7] },
    4: { comCounts: [10, 10] },
  };

  /* ------------------------------------------------------------------ *
   * §10 — INFRAESTRUCTURA (lo que cada actividad pide; el pueblo lo tiene o no).
   * ------------------------------------------------------------------ */
  const INFRA = [
    { id: 'plaza', nombre: 'Plaza / espacio abierto' },
    { id: 'sum', nombre: 'SUM (salón de usos múltiples)' },
    { id: 'polideportivo', nombre: 'Polideportivo / club' },
    { id: 'salaRadio', nombre: 'Sala de radio' },
    { id: 'wifi', nombre: 'WiFi / conectividad' },
    { id: 'puntoDigital', nombre: 'Punto digital' },
  ];

  /* ------------------------------------------------------------------ *
   * PUEBLOS JUGABLES — FICTICIOS (GDD §11). NO referencian localidades
   * reales: son inventados, parametrizados según el modelo por nivel.
   * `comunidades` = ids de COMUNIDADES presentes; `infra` = ids de INFRA.
   * `region` apunta a REGIONES (carácter). El default de arranque es nivel 1.
   * ------------------------------------------------------------------ */
  const PUEBLOS = [
    {
      id: 'chanaral', nombre: 'Paraje El Chañaral', nivel: 1, region: 'oeste',
      comunidades: ['deportistas', 'folklore'],
      infra: ['plaza'],
      nota: 'Punta de rieles del oeste; todo es cara a cara.',
    },
    {
      id: 'treslagunas', nombre: 'Colonia Tres Lagunas', nivel: 1, region: 'norte',
      comunidades: ['deportistas', 'folklore', 'tecnologia', 'gamers'],
      infra: ['plaza', 'sum'],
      nota: 'Colonia chacarera con conectividad reciente.',
    },
    {
      id: 'caldenvilla', nombre: 'Villa del Caldén', nivel: 2, region: 'centro-oeste',
      comunidades: ['deportistas', 'folklore', 'danza', 'gamers', 'tecnologia'],
      infra: ['plaza', 'sum', 'polideportivo'],
      nota: 'Todos se conocen; las quejas son personales.',
    },
    {
      id: 'lomasquebracho', nombre: 'Lomas del Quebracho', nivel: 2, region: 'noreste',
      comunidades: ['folklore', 'teatro', 'animekpop', 'letras', 'tecnologia'],
      infra: ['plaza', 'sum', 'salaRadio'],
      nota: 'Pueblo con centro cultural y una camada joven inquieta.',
    },
    {
      id: 'cabeceraoeste', nombre: 'Cabecera del Oeste', nivel: 3, region: 'oeste',
      comunidades: ['deportistas', 'musica', 'danza', 'letras', 'teatro', 'gamers', 'folklore'],
      infra: ['plaza', 'sum', 'polideportivo', 'salaRadio', 'wifi'],
      nota: 'Cabecera que arrastra parajes vecinos; el intendente pesa.',
    },
    {
      id: 'capitalllano', nombre: 'Capital del Llano', nivel: 4, region: 'centro',
      comunidades: ['deportistas', 'folklore', 'gamers', 'tecnologia', 'danza', 'musica', 'teatro', 'letras', 'animekpop', 'cienciaeco'],
      infra: ['plaza', 'sum', 'polideportivo', 'salaRadio', 'wifi', 'puntoDigital'],
      nota: 'Capital con las diez comunidades organizadas: integrar, no descubrir.',
    },
  ];

  /* ------------------------------------------------------------------ *
   * §9 — LAS CINCO LÍNEAS DE ACTIVIDAD.
   * `infra` = infraestructura mínima que pide; `comunidadesAfines` = a qué
   * comunidades apunta (acierta más si la comunidad existe y la conocés, §8).
   * ------------------------------------------------------------------ */
  const ACTIVIDADES = [
    {
      id: 'culturaTurismo', nombre: 'Cultura y turismo joven',
      infra: ['sum'], comunidadesAfines: ['folklore', 'teatro', 'danza', 'musica'],
    },
    {
      id: 'feriaMercado', nombre: 'Ferias y mercado joven de emprendimientos',
      infra: ['plaza'], comunidadesAfines: ['tecnologia', 'folklore', 'letras'],
    },
    {
      id: 'mediosComunicacion', nombre: 'Medios y comunicación hechos por juventudes',
      infra: ['salaRadio', 'wifi'], comunidadesAfines: ['tecnologia', 'musica'],
    },
    {
      id: 'capacitacionesPrevencion', nombre: 'Capacitaciones, talleres y stands de prevención',
      infra: ['sum'], comunidadesAfines: ['deportistas', 'folklore', 'letras'],
    },
    {
      id: 'interesesAlternativos', nombre: 'Intereses alternativos (eSports, ciencia, k-pop, muralismo, eco)',
      infra: ['wifi', 'puntoDigital'], comunidadesAfines: ['gamers', 'cienciaeco', 'animekpop', 'danza'],
    },
  ];

  /* ------------------------------------------------------------------ *
   * §7 — PROBLEMÁTICAS (taxonomía). `sensible: true` => el CONTENIDO de sus
   * dilemas NO se autogenera: se escribe a mano en CONTENIDO_SENSIBLE.md y lo
   * aprueba un humano. El motor (G3) las soporta; acá sólo está la taxonomía.
   * Las situaciones de PODER (intendente/concejal/Provincia/logística) no son
   * "problemáticas" y sí admiten dilemas genéricos (ver MOTIVOS_PODER).
   * ------------------------------------------------------------------ */
  const PROBLEMATICAS = [
    { id: 'consumos', nombre: 'Consumos problemáticos (sustancias y apuestas digitales)', sensible: true, nota: 'La más mencionada del mapeo.' },
    { id: 'saludMental', nombre: 'Salud mental', sensible: true, nota: 'Segunda; aparece como demanda espontánea.' },
    { id: 'espacios', nombre: 'Falta de espacios y actividades', sensible: false, nota: 'Alta; admite dilemas genéricos.' },
    { id: 'bullying', nombre: 'Bullying y ciberbullying', sensible: true, nota: 'Recurrente pueblo tras pueblo.' },
    { id: 'economia', nombre: 'Situación económica y empleo', sensible: false, nota: 'Alta; admite dilemas genéricos.' },
    { id: 'conectividad', nombre: 'Conectividad', sensible: false, nota: 'Media; logística/infra, admite dilemas genéricos.' },
    { id: 'violencias', nombre: 'Violencias (incluida la de género)', sensible: true, nota: 'Media; contenido a mano.' },
  ];

  // Motivos de los dilemas de PODER (no sensibles): heredados del Simulador.
  const MOTIVOS_PODER = [
    { id: 'intendente', nombre: 'El intendente exige un número antes de firmar' },
    { id: 'concejal', nombre: 'El concejal quiere su logo en todo' },
    { id: 'provincia', nombre: 'Provincia manda fondos sólo para folklore tradicional' },
    { id: 'logistica', nombre: 'La logística no alcanza (espacios/recursos)' },
  ];

  /* ------------------------------------------------------------------ *
   * Apéndice B — REGIONES (carácter por zona). Sólo dirección + fortaleza +
   * foco; SIN nombres de localidades reales (§11).
   * ------------------------------------------------------------------ */
  const REGIONES = [
    { id: 'norte', nombre: 'Norte', fortaleza: 'Red escolar y conectividad', foco: 'Liga deportiva + eSports' },
    { id: 'noreste', nombre: 'Noreste', fortaleza: 'Clubes y centros culturales', foco: 'Circuito cultural itinerante, feria joven' },
    { id: 'este', nombre: 'Este', fortaleza: 'Polideportivos y SUM', foco: 'Ferias de talentos, turismo joven' },
    { id: 'centro', nombre: 'Centro', fortaleza: 'Oferta grande', foco: 'Laboratorio de empleo, eventos faro' },
    { id: 'centro-oeste', nombre: 'Centro-Oeste', fortaleza: 'Red de SUM y clubes', foco: 'Circuito rotativo, liga mixta' },
    { id: 'oeste', nombre: 'Oeste', fortaleza: 'Coordinación municipal', foco: 'Turismo joven, giras' },
    { id: 'noroeste', nombre: 'Noroeste', fortaleza: 'Identidad cultural', foco: 'Circuito naturaleza + cultura' },
    { id: 'suroeste', nombre: 'Suroeste', fortaleza: 'Atractivo natural', foco: 'Escapadas, regatas, trekking' },
    { id: 'sur', nombre: 'Sur', fortaleza: 'Deporte como puerta', foco: 'Ferias, festivales, formación exprés' },
  ];

  /* ------------------------------------------------------------------ *
   * Lookups (todos defensivos: devuelven null/undefined si no existe).
   * ------------------------------------------------------------------ */
  function _index(arr, k) { const m = {}; (arr || []).forEach((x) => { m[x[k || 'id']] = x; }); return m; }
  const _med = _index(MEDIDORES);
  const _com = _index(COMUNIDADES);
  const _pue = _index(PUEBLOS);
  const _act = _index(ACTIVIDADES);
  const _pro = _index(PROBLEMATICAS);
  const _inf = _index(INFRA);
  const _reg = _index(REGIONES);
  const _ori = _index(ORIGENES);

  function medidor(id) { return _med[id] || null; }
  function comunidad(id) { return _com[id] || null; }
  function pueblo(id) { return _pue[id] || null; }
  function actividad(id) { return _act[id] || null; }
  function problematica(id) { return _pro[id] || null; }
  function infra(id) { return _inf[id] || null; }
  function region(id) { return _reg[id] || null; }
  function origen(id) { return _ori[id] || null; }
  function nivel(n) { return NIVELES[n] || null; }
  function puebloInicial() { return PUEBLOS[0]; } // nivel 1 = arranque fácil

  return {
    MEDIDORES, COMUNIDADES, NIVELES, MODELO_NIVEL, PUEBLOS, INFRA,
    ACTIVIDADES, PROBLEMATICAS, MOTIVOS_PODER, REGIONES, ORIGENES,
    medidor, comunidad, pueblo, actividad, problematica, infra, region, origen, nivel, puebloInicial,
  };
})();

/* =====================================================================
 * AJ.Gestion.Estado — fábrica del estado de gestión y helpers de medidores.
 * El estado de gestión vive en `estado.gestion` (parte del save por partida).
 * Estructura:
 *   estado.gestion = {
 *     actual: <puebloId>,            // pueblo de gestión activo
 *     pueblos: { <puebloId>: EstadoPueblo },
 *     experiencia: { mudanzas, ... } // herencia entre pueblos (se usa en G5)
 *   }
 * EstadoPueblo = {
 *   puebloId, fase: 'recon'|'gestion', dia, accionesHoy,
 *   medidores: { agencia, vinculoEscolar, conocimiento, confianza, conviccion },
 *   agencia: { nombre, miembros: [], objetivos: [] },   // se llena en G2
 *   comunidadesDescubiertas: { <comId>: true },
 *   problematicasVistas: { <proId>: true },
 *   dilemasResueltos: [],            // ids (G3)
 *   onboarding: { paso: 0, hecho: false }, // (G2)
 * }
 * ===================================================================== */
AJ.Gestion.Estado = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;

  function clampMedidor(id, v) {
    const m = D.medidor(id);
    if (!m) return v;
    if (v < m.min) return m.min;
    if (v > m.max) return m.max;
    return v;
  }

  function medidoresIniciales() {
    const out = {};
    D.MEDIDORES.forEach((m) => { out[m.id] = m.inicial; });
    return out;
  }

  // Crea el estado de gestión de UN pueblo.
  function crearPueblo(puebloId) {
    const p = D.pueblo(puebloId) || D.puebloInicial();
    return {
      puebloId: p.id,
      fase: 'recon',        // días 1–5 reconocimiento (GDD §2)
      dia: 1,
      accionesHoy: 0,
      medidores: medidoresIniciales(),
      agencia: { nombre: '', miembros: [], objetivos: [] },
      comunidadesDescubiertas: {}, // en pueblo chico se descubren (G6)
      problematicasVistas: {},
      dilemasResueltos: [],
      onboarding: { paso: 0, hecho: false },
      origen: null,                // capa narrativa-temporal (N1): cómo llegó el jugador
    };
  }

  // Crea el contenedor de gestión (todos los pueblos + experiencia).
  function crear(puebloId) {
    const inicial = D.pueblo(puebloId) ? puebloId : D.puebloInicial().id;
    const g = { actual: inicial, pueblos: {}, experiencia: { mudanzas: 0 } };
    g.pueblos[inicial] = crearPueblo(inicial);
    return g;
  }

  // Asegura que `estado.gestion` exista y tenga el pueblo actual armado.
  // Migración defensiva: nunca pisa lo guardado, sólo completa lo que falte.
  function asegurar(estado, puebloId) {
    if (!estado) return null;
    if (!estado.gestion || typeof estado.gestion !== 'object') estado.gestion = crear(puebloId);
    const g = estado.gestion;
    if (!g.pueblos || typeof g.pueblos !== 'object') g.pueblos = {};
    if (!g.experiencia || typeof g.experiencia !== 'object') g.experiencia = { mudanzas: 0 };
    let id = puebloId || g.actual;
    if (!D.pueblo(id)) id = D.puebloInicial().id;
    g.actual = id;
    if (!g.pueblos[id]) g.pueblos[id] = crearPueblo(id);
    // completar medidores faltantes (si se agregó alguno nuevo)
    const ep = g.pueblos[id];
    if (!ep.medidores) ep.medidores = medidoresIniciales();
    D.MEDIDORES.forEach((m) => { if (typeof ep.medidores[m.id] !== 'number') ep.medidores[m.id] = m.inicial; });
    if (!ep.agencia) ep.agencia = { nombre: '', miembros: [], objetivos: [] };
    if (!ep.comunidadesDescubiertas) ep.comunidadesDescubiertas = {};
    if (!ep.problematicasVistas) ep.problematicasVistas = {};
    if (!Array.isArray(ep.dilemasResueltos)) ep.dilemasResueltos = [];
    if (!ep.onboarding) ep.onboarding = { paso: 0, hecho: false };
    if (typeof ep.origen === 'undefined') ep.origen = null; // N1 (migración defensiva)
    return g;
  }

  // Devuelve el EstadoPueblo activo (o null).
  function actual(estado) {
    if (!estado || !estado.gestion) return null;
    const g = estado.gestion;
    return (g.pueblos && g.pueblos[g.actual]) || null;
  }

  function getMedidor(ep, id) { return ep && ep.medidores ? ep.medidores[id] : undefined; }

  function setMedidor(ep, id, v) {
    if (!ep || !ep.medidores) return;
    ep.medidores[id] = clampMedidor(id, v);
  }

  // Aplica un objeto de impactos { medidorId: delta, ... } con clamp.
  // Devuelve los deltas REALES aplicados (tras clamp) para feedback/UI.
  function aplicarImpacto(ep, impactos) {
    const reales = {};
    if (!ep || !ep.medidores || !impactos) return reales;
    Object.keys(impactos).forEach((id) => {
      if (!D.medidor(id)) return; // ignora claves desconocidas (robustez)
      const antes = ep.medidores[id];
      const despues = clampMedidor(id, antes + impactos[id]);
      ep.medidores[id] = despues;
      reales[id] = despues - antes;
    });
    return reales;
  }

  return {
    crear, crearPueblo, asegurar, actual,
    medidoresIniciales, clampMedidor, getMedidor, setMedidor, aplicarImpacto,
  };
})();

/* =====================================================================
 * AJ.Gestion.init — arranque mínimo del Modo Gestión (G1).
 * Sólo asegura el estado de gestión y deja el controlador colgado de la
 * escena. SIN UI todavía (eso llega en G2+). Llamado por Pueblo._iniciarSistema
 * dentro de try/catch: si algo falla, el flag se apaga y el RPG sigue.
 * ===================================================================== */
AJ.Gestion.activo = function () { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion); };

AJ.Gestion.init = function (scene, estado) {
  if (!AJ.Gestion.activo()) return;
  // El pueblo de gestión arranca en el inicial (nivel 1). La vinculación con
  // el pueblo del RPG (mapaActual) es asunto del ciclo de 30 días (G5).
  AJ.Gestion.Estado.asegurar(estado, (estado.gestion && estado.gestion.actual) || null);
  if (scene) scene.gestion = AJ.Gestion; // controlador accesible desde la escena
};
