/* =====================================================================
 * gestion/regiones.js — MISIONES POR REGIÓN (N5, CONFIG.misionesPorRegion)
 * ---------------------------------------------------------------------
 * Capa narrativa-temporal (GDD §2.bis E). Cada ZONA PRODUCTIVA genera un SET
 * DISTINTO de misiones, recursos y sabor. Las misiones son PLANTILLAS genéricas
 * y reskinables (sin marcas/programas reales); lo que cambia por zona es el
 * sabor, los recursos y qué comunidades/temas aparecen. La mudanza entre
 * temporadas cambia de región → cambia el tipo de partida.
 *
 * RECONCILIACIÓN: el GDD trae 9 regiones DIRECCIONALES (datos.js REGIONES);
 * acá se mapean a 6 ZONAS productivas (REGION_ZONA). El contenido de ZONAS lo
 * generó un workflow de agentes con revisión de compliance (sin marcas reales,
 * sin apuestas, agua/Atuel en clave EDUCATIVA y APARTIDARIA, ids válidos).
 *
 * BOLT-ON aditivo detrás de CONFIG.misionesPorRegion (requiere modoGestion).
 * Las misiones se resuelven con el dado (reusa G4). Sólo lógica + datos; el
 * enganche a la UI del finde vive en ciclo.js (aditivo).
 * ===================================================================== */

window.AJ = window.AJ || {};
AJ.Gestion = AJ.Gestion || {};

AJ.Gestion.Regiones = (function () {
  'use strict';

  const D = AJ.Gestion.Datos;
  const E = AJ.Gestion.Estado;
  const Tir = AJ.Gestion.Tiradas;

  // Las 9 regiones direccionales del GDD (Apéndice B) → 6 zonas productivas.
  const REGION_ZONA = {
    oeste: 'oeste_arido', noroeste: 'oeste_arido',
    norte: 'este_cerealero', este: 'este_cerealero',
    noreste: 'caldenal', 'centro-oeste': 'caldenal',
    centro: 'hub_centro',
    suroeste: 'colorado_sur', sur: 'salinas',
  };

  // Contenido de las zonas (validado por workflow). Cada zona:
  //   { id, nombre, sabor, recursos[], comunidadesDestacadas[], temas[], eventos[],
  //     misiones: [ { id, titulo, situacion, impactos:{medidor:delta}, dificultad } ] }
  const ZONAS = {
    este_cerealero: {
      id: 'este_cerealero', nombre: 'Este cerealero',
      sabor: 'Llanura dorada de trigo y maíz donde los pueblos crecen al ritmo de la cosecha. Acá la juventud tiene mate, ideas de emprendimiento y ganas de juntarse: silos, ferias y peñas conviven en la misma cuadra.',
      recursos: ['silo cooperativo', 'feria de emprendimientos', 'galpón comunitario', 'wifi del pueblo'],
      comunidadesDestacadas: ['tecnologia', 'folklore', 'letras'],
      temas: ['economia', 'cosecha', 'conectividad'],
      eventos: ['Cosecha gruesa', 'Feria Joven de Emprendimientos'],
      misiones: [
        { id: 'este_cerealero_feria_joven', titulo: 'Stands en la feria',
          situacion: 'Un grupo de pibes y pibas quiere montar puestos de emprendimientos en la feria del pueblo, pero no tienen lugar ni permisos. Te piden que la Agencia los ayude a organizarse.',
          impactos: { agencia: 2, carisma: 8, conviccion: -4 }, dificultad: 11 },
        { id: 'este_cerealero_wifi_silo', titulo: 'Conectar el galpón',
          situacion: 'La comunidad de tecnología armó un punto de encuentro en un viejo galpón, pero la señal no llega. Hay que gestionar la conexión sin desviar fondos que el pueblo esperaba para otra cosa.',
          impactos: { conocimiento: 7, agencia: 2, confianza: -5 }, dificultad: 13 },
        { id: 'este_cerealero_pena_cosecha', titulo: 'Peña de fin de cosecha',
          situacion: 'Terminó la trilla y los grupos de folklore y letras quieren cerrar la temporada con una peña abierta. Falta coordinar a las familias trabajadoras, agotadas tras semanas a full.',
          impactos: { vinculoEscolar: 6, carisma: 5, conocimiento: -3 }, dificultad: 12 },
      ],
    },
    caldenal: {
      id: 'caldenal', nombre: 'Caldenal (monte)',
      sabor: 'El monte de caldenes, donde las distancias son largas y cada paraje guarda su propia copla. Acá la identidad se teje despacio, entre el silencio del bosque y las peñas que juntan a los pueblos dispersos.',
      recursos: ['monte de caldenes', 'salones de fomento y peñas', 'circuito naturaleza y cultura', 'tradición oral y folklore'],
      comunidadesDestacadas: ['folklore', 'teatro', 'letras'],
      temas: ['identidad', 'cultura', 'conectividad'],
      eventos: ['festival de peñas y folklore en el monte', 'recorrida de senderos del caldenal'],
      misiones: [
        { id: 'caldenal_pena_dispersa', titulo: 'Una peña que junte al paraje',
          situacion: 'Los parajes del monte están lejos unos de otros y los pibes casi no se cruzan. Te proponen armar una peña folklórica que sirva de excusa para que se conozcan y compartan una noche de música.',
          impactos: { carisma: 8, confianza: 6, agencia: -2 }, dificultad: 11 },
        { id: 'caldenal_sendero_cultura', titulo: 'El sendero que cuenta el monte',
          situacion: 'Hay un viejo circuito por el caldenal que nadie señaliza ni cuida. Te piden sumar a chicos del teatro y de letras para armar carteles, relatos y postas que cuenten la historia del lugar a quien lo recorra.',
          impactos: { conocimiento: 9, conviccion: 5, carisma: -3 }, dificultad: 13 },
        { id: 'caldenal_voces_del_monte', titulo: 'Voces del monte que no se pierden',
          situacion: 'Los abuelos del paraje guardan coplas, cuentos y oficios que no están anotados en ningún lado. Los pibes de letras quieren registrarlos antes de que se olviden, pero falta quien coordine las visitas entre tanta distancia.',
          impactos: { conocimiento: 10, vinculoEscolar: 4, confianza: -4 }, dificultad: 15 },
      ],
    },
    oeste_arido: {
      id: 'oeste_arido', nombre: 'Oeste árido',
      sabor: 'Tierra seca de horizontes largos y puesteros que se conocen por el apodo. Acá el agua es oro, la distancia se mide en horas de ripio y la guitarra junta lo que el viento dispersa.',
      recursos: ['aljibe comunitario', 'camioneta 4x4 prestada', 'radio VHF de banda rural', 'molino de viento'],
      comunidadesDestacadas: ['deportistas', 'folklore', 'cienciaeco'],
      temas: ['ambiente', 'conectividad', 'identidad'],
      eventos: ['jineteada y festival de doma criolla', 'marcada de hacienda en los puestos'],
      misiones: [
        { id: 'oeste_arido_aljibe_escuela', titulo: 'El aljibe de la escuela rural',
          situacion: 'La escuelita del paraje junta agua de lluvia en un aljibe viejo que pierde. Los chicos quieren aprender a medir cuánta agua se desperdicia y arreglarlo entre todos.',
          impactos: { conocimiento: 8, vinculoEscolar: 6, agencia: -2, confianza: 4 }, dificultad: 11 },
        { id: 'oeste_arido_taller_agua', titulo: 'Taller del agua que no sobra',
          situacion: 'Un grupo de jóvenes propone un taller itinerante para enseñar a cuidar y reusar el agua en los puestos. Llegar a cada familia significa muchos kilómetros de ripio.',
          impactos: { conviccion: 7, carisma: 5, agencia: -3, conocimiento: 4 }, dificultad: 13 },
        { id: 'oeste_arido_radio_distancias', titulo: 'La radio que acorta distancias',
          situacion: 'Entre puestos aislados, una vieja radio comunitaria podría volver a unir a la gente: avisos del clima, música folklórica y la voz de los que viven lejos. Falta quien la haga andar.',
          impactos: { confianza: 8, carisma: 6, agencia: -2, conviccion: -3 }, dificultad: 12 },
      ],
    },
    salinas: {
      id: 'salinas', nombre: 'Salinas',
      sabor: 'Costras blancas hasta donde alcanza la vista, sol que parte y caminos de tierra que se cortan con la primera lluvia. Acá se vive de juntar la sal: trabajo estacional, pulmón y aguante, y un orgullo callado de la gente que sabe leer el salitral.',
      recursos: ['galpón de acopio y romana', 'camionetas y zorras para la logística del salitral', 'cancha de tierra y club de barrio', 'peña folklórica con fogón y guitarras'],
      comunidadesDestacadas: ['deportistas', 'folklore'],
      temas: ['trabajo', 'cosecha', 'conectividad'],
      eventos: ['Cosecha de sal: temporada alta de cuadrillas, sol fuerte y todos al salitral', 'Corte de caminos tras la lluvia: la logística se complica y nada entra ni sale'],
      misiones: [
        { id: 'salinas_cuadrilla_joven', titulo: 'Pibes a la cuadrilla',
          situacion: 'Arranca la cosecha de sal y faltan brazos. Varios pibes quieren sumarse a la cuadrilla por unos pesos, pero el sol pega fuerte y la jornada es larga. Te piden que organices los turnos y consigas agua y sombra.',
          impactos: { conocimiento: 6, confianza: 5, conviccion: -3 }, dificultad: 12 },
        { id: 'salinas_camino_cortado', titulo: 'El camino quedó cortado',
          situacion: 'Llovió y el camino al salitral quedó intransitable justo cuando tenías la salida juvenil al club armada. Los pibes ya están listos y vos tenés que decidir si reprogramás, conseguís otra movilidad o lo bancás igual.',
          impactos: { agencia: 1, carisma: 5, confianza: -4 }, dificultad: 14 },
        { id: 'salinas_pena_post_cosecha', titulo: 'Peña de fin de cosecha',
          situacion: 'Terminó la temporada y la gente quiere festejar con una peña folklórica. Los grupos de baile y los músicos del pueblo se ofrecen, pero hay que conseguir el espacio, el sonido y que no se cruce con los turnos de los que todavía laburan.',
          impactos: { vinculoEscolar: 4, carisma: 6, conviccion: -3 }, dificultad: 13 },
      ],
    },
    colorado_sur: {
      id: 'colorado_sur', nombre: 'Cuenca del Colorado / Sur',
      sabor: 'Una franja verde de chacras bajo riego que sigue el río como una vena en medio del monte seco. Acá el trabajo joven se mezcla con el agro tecnificado y las torres de energía: hay laburo, hay futuro y muchas ganas de que la gente no se vaya.',
      recursos: ['agua de riego del río (en clave educativa: cómo se usa, se mide y se cuida)', 'chacras y packing de fruta y hortaliza, con changas y empleo joven de temporada', 'parque de energía que trae técnicos jóvenes y capacitación', 'galpón comunal con WiFi, punto de encuentro y aula digital'],
      comunidadesDestacadas: ['tecnologia', 'deportistas', 'musica'],
      temas: ['trabajo', 'ambiente', 'cosecha'],
      eventos: ['Pico de cosecha bajo riego: el pueblo se llena de cuadrillas jóvenes y todo gira alrededor del packing', 'Jornada del agua y la energía: muestran cómo se produce y se cuida el recurso'],
      misiones: [
        { id: 'colorado_sur_cuadrilla_cosecha', titulo: 'La cuadrilla de la cosecha',
          situacion: 'Llega el pico de cosecha y un montón de pibes y pibas se anotan para la changa en el packing. Te piden que armes una jornada para que entren bien parados: derechos, seguridad y que no los carneen.',
          impactos: { vinculoEscolar: 6, conocimiento: 5, carisma: 4, agencia: -3 }, dificultad: 12 },
        { id: 'colorado_sur_aula_riego', titulo: 'Aula a cielo abierto en la cuenca',
          situacion: 'Los chacareros y la gente del consorcio de riego ofrecen abrir las compuertas para una recorrida educativa: cómo llega el agua, cómo se mide y por qué cuidarla. Vos coordinás la visita con la escuela, sin meterte en internas de quién tiene más derecho al río.',
          impactos: { conocimiento: 7, conviccion: 5, confianza: -4, carisma: -3 }, dificultad: 13 },
        { id: 'colorado_sur_pasantia_energia', titulo: 'Pasantía en el parque de energía',
          situacion: 'El parque energético quiere abrir unos cupos de capacitación para jóvenes técnicos, pero solo para quienes ya saben algo de tecnología. Te toca decidir a quiénes proponés y cómo no dejar afuera a los que recién arrancan.',
          impactos: { confianza: 6, conocimiento: 4, conviccion: -4, agencia: -2 }, dificultad: 14 },
      ],
    },
    hub_centro: {
      id: 'hub_centro', nombre: 'Hub Centro (capitales)',
      sabor: 'Las capitales laten distinto: diez comunidades ya tienen su salita, su grupo y su agenda. Acá no se descubre, se teje, y la radio del centro repite cada paso que das.',
      recursos: ['red de espacios y sedes compartidas', 'prensa y radio comunitaria', 'agenda integrada de eventos', 'voluntariado entre comunidades'],
      comunidadesDestacadas: ['cienciaeco', 'animekpop', 'tecnologia'],
      temas: ['espacios', 'conectividad', 'cultura'],
      eventos: ['semana de actividades-puente entre comunidades', 'feria abierta con cobertura de radio'],
      misiones: [
        { id: 'hub_centro_puente_comunidades', titulo: 'Tender un puente',
          situacion: 'Dos comunidades del centro usan la misma sala pero nunca se cruzan. Te piden armar una actividad-puente que las haga colaborar sin que ninguna pierda su impronta.',
          impactos: { carisma: 8, confianza: 6, agencia: -2 }, dificultad: 12 },
        { id: 'hub_centro_radio_cobertura', titulo: 'Al aire en la radio del centro',
          situacion: 'La radio comunitaria quiere una nota sobre lo que hace la Agencia. Una buena cobertura suma reconocimiento, pero exponerse antes de tiempo te obliga a cumplir lo prometido.',
          impactos: { carisma: 10, conviccion: 5, confianza: -4 }, dificultad: 13 },
        { id: 'hub_centro_agenda_unica', titulo: 'Una sola agenda',
          situacion: 'Cada comunidad publica sus eventos por su lado y se pisan las fechas. Coordinar una agenda integrada ordena todo, aunque algunos sientan que pierden protagonismo.',
          impactos: { conocimiento: 7, agencia: 4, carisma: -3 }, dificultad: 14 },
      ],
    },
  };

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.modoGestion && AJ.CONFIG.misionesPorRegion); }

  function zonaIdDe(estado) {
    try {
      const p = D.pueblo(estado.gestion.actual);
      const r = p && p.region;
      return REGION_ZONA[r] || 'este_cerealero';
    } catch (e) { return 'este_cerealero'; }
  }
  function zona(estado) { return ZONAS[zonaIdDe(estado)] || null; }
  function todas() { return Object.keys(ZONAS).map((k) => ZONAS[k]); }
  function misionesDe(estado) { const z = zona(estado); return (z && z.misiones) || []; }

  // Una misión de la región para este finde (rota por número de finde).
  function misionDelFinde(estado, ep) {
    const ms = misionesDe(estado); if (!ms.length) return null;
    const i = (((ep && ep.finde) || 1) - 1);
    return ms[((i % ms.length) + ms.length) % ms.length];
  }
  function mision(estado, misionId) { return misionesDe(estado).filter((m) => m.id === misionId)[0] || null; }

  // Resolver una misión con el dado (reusa G4). Filtra impactos a medidores
  // válidos (robustez ante datos generados). Devuelve { mision, tirada, impactosReales }.
  function resolverMision(estado, misionId) {
    const m = mision(estado, misionId); if (!m) return null;
    const imp = {};
    Object.keys(m.impactos || {}).forEach((k) => { if (D.medidor(k)) imp[k] = m.impactos[k]; });
    if (Tir && Tir.aplicar) {
      const r = Tir.aplicar(estado, imp, { dificultad: m.dificultad || 12, medidores: ['carisma', 'conocimiento'] });
      return { mision: m, tirada: r.tirada, impactosReales: r.impactosReales };
    }
    const reales = E.aplicarImpacto(E.actual(estado), imp);
    return { mision: m, tirada: null, impactosReales: reales };
  }

  return { REGION_ZONA, ZONAS, activo, zonaIdDe, zona, todas, misionesDe, misionDelFinde, mision, resolverMision };
})();
