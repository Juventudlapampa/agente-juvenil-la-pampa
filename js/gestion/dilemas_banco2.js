/* =====================================================================
 * gestion/dilemas_banco2.js — Más dilemas GENÉRICOS (GP1)
 * ---------------------------------------------------------------------
 * Segunda tanda de dilemas genéricos, escritos a mano, para que el ciclo de 30
 * días (G5) no se repita. Mismas reglas duras de siempre (GDD §7/§11):
 *   - GENÉRICOS y reskinables: ningún nombre real de localidad/persona/programa.
 *   - NADA sensible (salud mental / consumos / violencias / bullying): eso va a
 *     CONTENIDO_SENSIBLE.md, escrito y aprobado por una persona.
 *   - Sin apuestas ni plata real. Trade-off real en cada dilema.
 * Se registran en el motor (AJ.Gestion.Dilemas.registrarGenericos), que valida la
 * estructura y los medidores. Editable como cualquier dato.
 * ===================================================================== */

window.AJ = window.AJ || {};
(function () {
  'use strict';
  if (!(AJ.Gestion && AJ.Gestion.Dilemas)) return;

  var BANCO2 = [
    {
      id: 'gen_quemar_equipo', problematica: 'logistica', fuente: 'generico',
      situacion: 'Un evento grande es en dos días y el equipo está fundido. ¿Los exprimís o bajás la vara?',
      opciones: [
        { id: 'a', texto: 'Que metan toda la garra, sí o sí.', impactos: { confianza: 6, agencia: -2 },
          reaccion: 'Sale el evento, pero dos pibes te avisan que se toman el palo.' },
        { id: 'b', texto: 'Bajás expectativas: algo más chico, pero cuidás al equipo.', impactos: { agencia: 1, confianza: -4 },
          reaccion: 'El evento es modesto; el equipo te lo agradece y se queda.' },
        { id: 'c', texto: 'Repartís tareas y pedís una mano a la comunidad.', impactos: { agencia: 1, conocimiento: 3, confianza: -2 },
          reaccion: 'Se suma gente nueva; coordinar a último momento cuesta.' },
      ],
    },
    {
      id: 'gen_protagonismo', problematica: 'espacios', fuente: 'generico',
      situacion: 'Un logro de la agencia sale en la radio. ¿Quién da la nota?',
      opciones: [
        { id: 'a', texto: 'Hablás vos, sos la cara visible.', impactos: { confianza: 5, agencia: -2 },
          reaccion: 'Quedás bien parado; los pibes sienten que les corriste el momento.' },
        { id: 'b', texto: 'Que hable un pibe del equipo.', impactos: { agencia: 2, confianza: -2 },
          reaccion: 'El pibe se prende fuego de orgullo; vos quedás un escalón atrás.' },
        { id: 'c', texto: 'Nota coral, todos juntos.', impactos: { agencia: 1, vinculoEscolar: 2, confianza: -1 },
          reaccion: 'Sale desprolijo pero auténtico; nadie se queja.' },
      ],
    },
    {
      id: 'esp_club_llave', problematica: 'espacios', fuente: 'generico',
      situacion: 'El club presta la cancha, pero el encargado quiere quedarse con la llave y poner condiciones.',
      opciones: [
        { id: 'a', texto: 'Aceptás sus condiciones con tal de tener el espacio.', impactos: { confianza: 4, conviccion: -5 },
          reaccion: 'Tenés cancha, pero bailás al ritmo del encargado.' },
        { id: 'b', texto: 'Le decís que o es de los pibes o no es.', impactos: { conviccion: 6, confianza: -6 },
          reaccion: 'Te quedás sin cancha esta vez, pero sentaste una postura.' },
        { id: 'c', texto: 'Negociás un reglamento de uso compartido.', impactos: { confianza: 3, conocimiento: 3, conviccion: -1 },
          reaccion: 'Cuesta redactarlo y ceder algo, pero queda claro para todos.' },
      ],
    },
    {
      id: 'eco_changa_o_proyecto', problematica: 'economia', fuente: 'generico',
      situacion: 'Hay plata para UNA cosa: changas rápidas para varios pibes, o un proyecto más grande para pocos.',
      opciones: [
        { id: 'a', texto: 'Changas para muchos, ya.', impactos: { confianza: 5, conocimiento: -3 },
          reaccion: 'Muchos se llevan algo; nada queda en pie para el mes que viene.' },
        { id: 'b', texto: 'Un proyecto grande para pocos.', impactos: { conocimiento: 5, conviccion: 2, confianza: -3 },
          reaccion: 'Queda algo serio, pero varios se sienten afuera.' },
        { id: 'c', texto: 'Mitad y mitad, todo a medias.', impactos: { confianza: 1, agencia: -1 },
          reaccion: 'Repartís parejo y nadie queda del todo conforme.' },
      ],
    },
    {
      id: 'con_parajes', problematica: 'conectividad', fuente: 'generico',
      situacion: 'Los pibes de los parajes vecinos quedan afuera de todo. Llegar cuesta plata y tiempo.',
      opciones: [
        { id: 'a', texto: 'Bancás la logística y los incluís.', impactos: { confianza: -7, vinculoEscolar: 5, conocimiento: 4 },
          reaccion: 'Los parajes te adoran; la caja sufre.' },
        { id: 'b', texto: 'Hacés todo en el pueblo y que vengan ellos.', impactos: { confianza: 4, conocimiento: -4 },
          reaccion: 'Más fácil para vos, pero los de afuera se sienten de segunda.' },
        { id: 'c', texto: 'Armás una movida rotativa con el pueblo vecino.', impactos: { conocimiento: 5, confianza: -2, agencia: 1 },
          reaccion: 'Cooperación regional: cuesta coordinar, pero llega más lejos.' },
      ],
    },
    {
      id: 'poder_intendente_acto', problematica: 'intendente', fuente: 'poder',
      situacion: 'El intendente quiere que la juventud llene el palco en un acto oficial que no tiene nada que ver con ustedes.',
      opciones: [
        { id: 'a', texto: 'Llevás a los pibes al acto para quedar bien.', impactos: { confianza: 8, conviccion: -9 },
          reaccion: 'El intendente sonríe; los pibes preguntan qué hacían ahí.' },
        { id: 'b', texto: 'Decís que no, que no son relleno de actos.', impactos: { conviccion: 8, confianza: -7 },
          reaccion: 'Se ofende; los pibes te bancan la postura.' },
        { id: 'c', texto: 'Ofrecés una participación real, no de relleno.', impactos: { confianza: 3, conviccion: 2, conocimiento: -2 },
          reaccion: 'Negociás un espacio propio dentro del acto; te come tiempo armarlo.' },
      ],
    },
    {
      id: 'poder_concejal_interna', problematica: 'concejal', fuente: 'poder',
      situacion: 'Un concejal quiere usar a la agencia para pegarle a un rival político.',
      opciones: [
        { id: 'a', texto: 'Le seguís el juego a cambio de apoyo.', impactos: { confianza: 9, conviccion: -10 },
          reaccion: 'Conseguís respaldo, pero la agencia queda pegada a una interna.' },
        { id: 'b', texto: 'Te corrés: la juventud no es ariete de nadie.', impactos: { conviccion: 9, confianza: -6 },
          reaccion: 'Quedás limpio; perdés un apoyo cómodo.' },
        { id: 'c', texto: 'Le ofrecés una agenda propia, sin grietas.', impactos: { conviccion: 3, confianza: -3, conocimiento: 2 },
          reaccion: 'Lo dejás con cara rara y sin su favor, pero la agencia sigue siendo de los pibes.' },
      ],
    },
    {
      id: 'provincia_capacitacion', problematica: 'provincia', fuente: 'poder',
      situacion: 'Provincia ofrece una capacitación piola, pero es en la capital y a contraturno escolar.',
      opciones: [
        { id: 'a', texto: 'Mandás a los pibes aunque pierdan clases.', impactos: { conocimiento: 6, vinculoEscolar: -7 },
          reaccion: 'Vuelven con herramientas; la escuela te mira feo.' },
        { id: 'b', texto: 'La rechazás para no chocar con la escuela.', impactos: { vinculoEscolar: 5, conocimiento: -3 },
          reaccion: 'La directora te lo agradece; te perdés la formación.' },
        { id: 'c', texto: 'Negociás que sea sábado o que la traigan al pueblo.', impactos: { conocimiento: 4, vinculoEscolar: 3, confianza: -2 },
          reaccion: 'Cuesta gestionarlo, pero sale sin romper nada.', requiereTirada: true, dificultad: 12 },
      ],
    },
    {
      id: 'log_sonido', problematica: 'logistica', fuente: 'generico',
      situacion: 'Falta equipo de sonido para el evento. Podés alquilar (caro), pedir prestado (favores) o hacerlo acústico.',
      opciones: [
        { id: 'a', texto: 'Alquilás un buen equipo.', impactos: { confianza: -6, vinculoEscolar: 3 },
          reaccion: 'Suena de diez; la caja queda flaca.' },
        { id: 'b', texto: 'Pedís prestado y quedás debiendo favores.', impactos: { confianza: 2, conviccion: -3 },
          reaccion: 'Zafás barato, pero ahora le debés una a alguien.' },
        { id: 'c', texto: 'Lo hacés acústico, a pura gorra de talento.', impactos: { conocimiento: 3, conviccion: 3, confianza: -1 },
          reaccion: 'Sale humilde y querido; algunos esperaban más producción.' },
      ],
    },
    {
      id: 'gen_promesa', problematica: 'logistica', fuente: 'generico',
      situacion: 'Prometiste algo el mes pasado que ahora no podés cumplir como lo dijiste.',
      opciones: [
        { id: 'a', texto: 'Cumplís a medias y maquillás el resto.', impactos: { confianza: 3, conviccion: -6 },
          reaccion: 'Pocos se dan cuenta; vos sí.' },
        { id: 'b', texto: 'Avisás de frente que no llegás y reprogramás.', impactos: { conviccion: 6, confianza: -4 },
          reaccion: 'Cuesta el momento, pero te ganás respeto.' },
        { id: 'c', texto: 'Pedís ayuda para cumplir como sea.', impactos: { agencia: 1, confianza: -2, conocimiento: 2 },
          reaccion: 'El equipo se pone la diez; quedan algo cansados.' },
      ],
    },
    {
      id: 'esp_horario_escuela', problematica: 'espacios', fuente: 'generico',
      situacion: 'La única franja libre del SUM choca con el horario de clases.',
      opciones: [
        { id: 'a', texto: 'Hacés la actividad en horario de clase.', impactos: { conocimiento: 4, vinculoEscolar: -8 },
          reaccion: 'Va gente, pero la escuela se enoja fuerte.' },
        { id: 'b', texto: 'La movés a la tarde aunque vaya menos gente.', impactos: { vinculoEscolar: 5, confianza: -2 },
          reaccion: 'Menos convocatoria, pero la escuela te abre la puerta.' },
        { id: 'c', texto: 'Coordinás con un docente para que sume al programa.', impactos: { vinculoEscolar: 6, conocimiento: 3, conviccion: -1 },
          reaccion: 'La escuela se prende; tenés que ceder parte del formato.' },
      ],
    },
    {
      id: 'eco_emprendedor_solo', problematica: 'economia', fuente: 'generico',
      situacion: 'Un pibe la rompe con su emprendimiento y quiere ayuda, pero atenderlo a él te come el tiempo de todos.',
      opciones: [
        { id: 'a', texto: 'Le das bola full a él, que tiene potencial.', impactos: { confianza: 4, agencia: -2 },
          reaccion: 'Despega, pero el resto del equipo se siente relegado.' },
        { id: 'b', texto: 'Lo metés en una movida grupal, sin trato VIP.', impactos: { agencia: 1, conocimiento: 2, confianza: -2 },
          reaccion: 'Crece más lento, pero arrastra a otros.' },
        { id: 'c', texto: 'Lo conectás con alguien de afuera que lo guíe.', impactos: { conocimiento: 4, confianza: -1 },
          reaccion: 'Buena jugada de red; soltás un poco el control.' },
      ],
    },
  ];

  try { AJ.Gestion.Dilemas.registrarGenericos(BANCO2); }
  catch (e) { console.warn('[Gestion] no se pudo registrar el banco 2 de dilemas', e); }
})();
