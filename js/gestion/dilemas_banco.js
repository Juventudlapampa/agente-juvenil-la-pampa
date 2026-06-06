/* =====================================================================
 * gestion/dilemas_banco.js — Banco de dilemas GENERICOS validados (G3)
 * -------------------------------------------------------------------
 * Contenido reskinable, NO sensible, generado con un workflow de escritores
 * + un critico-editor que aplico las restricciones del GDD (sin nombres
 * reales, sin plata real, sin temas sensibles, con trade-off real en cada
 * dilema), y re-validado por codigo (medidores validos, ids unicos, costo
 * presente, scan de palabras sensibles/plata). Se registra en el motor.
 * Editable a mano como cualquier dato. El contenido SENSIBLE va aparte
 * (CONTENIDO_SENSIBLE.md), nunca aca.
 * ===================================================================== */

window.AJ = window.AJ || {};
(function () {
  "use strict";
  if (!(AJ.Gestion && AJ.Gestion.Dilemas)) return;
  var BANCO = [
    {
      "id": "intendente_foto_inauguracion",
      "problematica": "intendente",
      "situacion": "Venis laburando hace meses con los pibes en un mural comunitario que sale de diez. El dia que lo terminan, te llama el secretario del intendente: quiere venir a 'inaugurarlo' con prensa, cinta y discurso, y que la agencia aparezca como 'una iniciativa del municipio'. Los pibes lo bancaron a pulmon y te preguntan que onda.",
      "opciones": [
        {
          "id": "a",
          "texto": "Le decis que si, que venga con la cinta y la foto, total te abre puertas para los proximos proyectos.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -3,
            "conocimiento": 0,
            "confianza": 12,
            "conviccion": -12
          },
          "reaccion": "El intendente corta la cinta sonriente y al otro dia el mural sale en el portal del municipio como obra de gestion.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Le propones que venga pero que en el cartel y en la foto figuren los pibes que lo pintaron, no solo el municipio.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 6,
            "conocimiento": 4,
            "confianza": -3,
            "conviccion": 3
          },
          "reaccion": "El secretario acepta a regañadientes y los pibes posan orgullosos al lado del intendente, medio incomodos.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Le decis que el mural lo hicieron los pibes y que la foto la sacan ellos, sin acto oficial.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 10,
            "conocimiento": 2,
            "confianza": -10,
            "conviccion": 8
          },
          "reaccion": "Los pibes festejan que el mural es de ellos, pero en el municipio quedas marcado como el que dejo plantado al intendente.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "intendente_permiso_freezado",
      "problematica": "intendente",
      "situacion": "Tenes todo listo para el festival juvenil en la plaza: bandas, feria, el sonido prestado. Falta solo la firma del intendente para usar el espacio publico, y la tenia prometida. Faltando tres dias te avisan que 'el expediente esta en revision' justo despues de que vos firmaras una nota publica pidiendo mas presupuesto para juventud. El mensaje es claro: te estan apretando.",
      "opciones": [
        {
          "id": "a",
          "texto": "Vas a la oficina, pedis disculpas por la nota y le decis que vos jugas para el mismo equipo.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 0,
            "confianza": 10,
            "conviccion": -13
          },
          "reaccion": "El permiso aparece firmado esa misma tarde y el secretario te palmea la espalda como si nada hubiera pasado.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Movés el festival a la cancha del club, que te presta el espacio sin depender del municipio.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 5,
            "conocimiento": 5,
            "confianza": -6,
            "conviccion": 6
          },
          "reaccion": "El club te abre las puertas y el festival sale igual, pero el intendente toma nota de que te las arreglaste sin el.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Bancas el reclamo y contas en la radio que el permiso esta frenado por la nota que firmaste.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 8,
            "conocimiento": 3,
            "confianza": -12,
            "conviccion": 11
          },
          "reaccion": "Medio pueblo se entera del apriete y los pibes te bancan, pero la relacion con el municipio queda hecha pedazos.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "intendente_numeros_inflados",
      "problematica": "intendente",
      "situacion": "El intendente quiere mostrar gestion ante Provincia y te pide los numeros de pibes que pasaron por la agencia este año. Cuando le pasas la planilla real, el secretario te llama: 'esos numeros son flacos, ponele un cero atras, total nadie chequea'. Si inflas la cifra quedas bien parado para el año que viene; si no, te van a decir que no hacen falta tantos fondos.",
      "opciones": [
        {
          "id": "a",
          "texto": "Inflas los numeros como te piden, total con eso aseguras los fondos del año que viene.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 0,
            "conocimiento": -4,
            "confianza": 11,
            "conviccion": -14
          },
          "reaccion": "Provincia felicita al intendente por la 'enorme cobertura juvenil' y vos sabes que la mitad de esos pibes no existen.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Pasas los numeros reales pero los acompañas con fotos, testimonios y una carpeta que muestra el laburo de verdad.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 4,
            "conocimiento": 8,
            "confianza": -4,
            "conviccion": 7
          },
          "reaccion": "La carpeta impresiona mas que un numero inflado, pero el secretario queda picado porque le quedo chico su pedido.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Te plantas y le decis que no vas a falsear una planilla con tu firma, pase lo que pase.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 3,
            "conocimiento": 2,
            "confianza": -11,
            "conviccion": 12
          },
          "reaccion": "El secretario te trata de ingenuo y los fondos del año que viene quedan en veremos, pero dormis tranquilo.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "concejal_banner_inauguracion",
      "problematica": "concejal",
      "situacion": "Inaugurás el mural que pintaron los pibes en el paredón de la plaza. Aparece un concejal con un pasacalle gigante con su cara y se planta al lado para sacarse la foto justo cuando llega la radio. Los pibes te miran a vos.",
      "opciones": [
        {
          "id": "a",
          "texto": "Lo dejás posar al frente y le agradecés en público por \"el apoyo\".",
          "impactos": {
            "confianza": 9,
            "conviccion": -9,
            "agencia": -1
          },
          "reaccion": "Sale en la radio sonriente; los pibes pintores quedan corridos del cuadro."
        },
        {
          "id": "b",
          "texto": "Le pedís el micrófono y ponés a los pibes a contar el mural ellos mismos.",
          "impactos": {
            "conviccion": 10,
            "confianza": -8,
            "vinculoEscolar": 3
          },
          "reaccion": "Los pibes brillan en la nota; el concejal se va con el pasacalle bajo el brazo y la cara larga."
        },
        {
          "id": "c",
          "texto": "Foto grupal con todos, él metido entre la banda, sin pasacalle.",
          "impactos": {
            "confianza": 4,
            "conviccion": 1,
            "vinculoEscolar": -3
          },
          "reaccion": "Queda en la foto como uno más; los pibes te miran medio tibios por dejarlo entrar al cuadro."
        }
      ]
    },
    {
      "id": "concejal_voto_partida_juvenil",
      "problematica": "concejal",
      "situacion": "En el Concejo se vota la partida para la agencia juvenil. Un concejal te avisa por lo bajo: la banca para si vos llevás a los pibes a juntar firmas para un proyecto suyo el mes que viene. Sin ese voto, no hay plata.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptás el cambalache: votan la partida, los pibes salen a juntar firmas.",
          "impactos": {
            "confianza": 11,
            "conviccion": -10
          },
          "reaccion": "Entra la plata, pero usaste a la banda de patas para una agenda que no es de ellos."
        },
        {
          "id": "b",
          "texto": "Le decís que la juventud no es mano de obra de campaña y que vote lo que crea.",
          "impactos": {
            "conviccion": 11,
            "confianza": -9
          },
          "reaccion": "Se ofende y se abstiene; la partida sale raspando o no sale, pero quedás limpio."
        },
        {
          "id": "c",
          "texto": "Le ofrecés que los pibes hagan una jornada cívica abierta, sin atarla a su proyecto.",
          "impactos": {
            "confianza": -4,
            "conviccion": 4,
            "conocimiento": 3
          },
          "reaccion": "Acepta a regañadientes una versión sin su nombre; perdés la plata segura, pero la agenda sigue siendo joven."
        }
      ]
    },
    {
      "id": "provincia_fondo_cartelitos",
      "problematica": "provincia",
      "situacion": "Cae plata de Provincia para la agencia, pero con letra chica: la mitad hay que gastarla en cartelería con el logo provincial y un acto de inauguración. Los pibes habían pedido la guita para comprar equipos de sonido y armar talleres, no para pintar carteles.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptás todo como viene y hacés el acto con cartelería, así no perdés el desembolso.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -5,
            "conocimiento": 0,
            "confianza": 10,
            "conviccion": -10
          },
          "reaccion": "Provincia queda contenta con las fotos, pero los pibes te miran como diciendo che, esto no era lo que pedimos.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Pedís una reunión para renegociar y proponés meter solo un cartelito chico y volcar el resto a los equipos.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 8,
            "conocimiento": 5,
            "confianza": -5,
            "conviccion": 8
          },
          "reaccion": "El referente provincial duda un cacho, pero te dice que lo va a ver, y los pibes festejan que diste la pelea.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Rechazás el fondo condicionado y salís a buscar la plata por otro lado, con el club y la radio.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 10,
            "conocimiento": -3,
            "confianza": -12,
            "conviccion": 12
          },
          "reaccion": "Te quedás sin el envío grande pero los pibes te bancan a muerte porque no te dejaste comprar.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "provincia_rendicion_imposible",
      "problematica": "provincia",
      "situacion": "El fondo que mandó Provincia exige rendir cada gasto con facturas tipo A y proveedores habilitados, cuando en el pueblo casi todo se compra con remito o de fiado al almacén de la esquina. Los pibes querían comprar materiales rápido y barato, y la burocracia te lo hace imposible.",
      "opciones": [
        {
          "id": "a",
          "texto": "Frenás todas las compras hasta tener proveedor con factura A, aunque tardes meses y se enfríe la movida.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": -8,
            "conocimiento": 4,
            "confianza": 6,
            "conviccion": 3
          },
          "reaccion": "La rendición te va a quedar impecable, pero el grupo se desinfla esperando que aparezca la plata.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Le pedís al municipio que te preste su área contable para canalizar las compras y cumplir la rendición.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -3,
            "conocimiento": 6,
            "confianza": 8,
            "conviccion": -7
          },
          "reaccion": "El intendente te da una mano con la contadora pero ahora la agencia le debe un favor que sabés que va a cobrar.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Comprás como podés en el pueblo y armás vos la rendición a pulmón, rezando que Provincia te apruebe los remitos.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 9,
            "conocimiento": -4,
            "confianza": -10,
            "conviccion": 6
          },
          "reaccion": "Los talleres arrancan al toque y los pibes contentos, pero quedás con el cagazo de que te rechacen la rendición.",
          "requiereTirada": true
        }
      ]
    },
    {
      "id": "provincia_tema_impuesto",
      "problematica": "provincia",
      "situacion": "Provincia ofrece un fondo lindo pero atado a que la agencia se sume a una campaña sobre el tema que están bajando este año desde arriba. Los pibes venían laburando otra cosa que les importa de verdad y sienten que les imponen la agenda desde un escritorio que queda a 300 kilómetros.",
      "opciones": [
        {
          "id": "a",
          "texto": "Tomás el fondo y reorientás toda la agencia a la campaña de Provincia para no perder la oportunidad.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -10,
            "conocimiento": 3,
            "confianza": 11,
            "conviccion": -9
          },
          "reaccion": "Entra la guita y quedás bien parado con Provincia, pero los pibes sienten que les cambiaron el proyecto por arriba.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Negociás hacer la campaña como una actividad más, sin abandonar lo que los pibes venían armando.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 5,
            "conocimiento": 6,
            "confianza": 2,
            "conviccion": 4
          },
          "reaccion": "Te aprueban el combo a regañadientes y los pibes lo bancan porque no soltaron lo suyo, aunque ahora hay el doble de laburo y la agencia queda al límite.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Decís que no a la condición y defendés que la agenda la ponen los pibes del pueblo, no el escritorio.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 12,
            "conocimiento": -2,
            "confianza": -13,
            "conviccion": 13
          },
          "reaccion": "Te quedás sin el fondo y algún funcionario te tira la oreja, pero los pibes sienten que la agencia es de ellos.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "rec_micro_compartido",
      "problematica": "logistica",
      "situacion": "Tenes el evento del finde en un paraje a 40km y el unico micro del pueblo te lo cotizan carisimo. El club te ofrece el suyo gratis, pero solo si les colgas el cartel del club en la entrada del evento y lo nombras desde el escenario toda la tarde.",
      "opciones": [
        {
          "id": "a",
          "texto": "Agarras el micro del club y les das toda la pantalla que piden.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 0,
            "confianza": 10,
            "conviccion": -10
          },
          "reaccion": "El presi del club se sube al escenario antes que vos y agradece 'el laburo del club con la juventud'."
        },
        {
          "id": "b",
          "texto": "Pagas el micro caro de tu bolsillo y mantenes el evento limpio de logos.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 0,
            "conocimiento": 0,
            "confianza": -12,
            "conviccion": 8
          },
          "reaccion": "Los pibes llegan al paraje en un micro que te dejo sin plata para los choris."
        },
        {
          "id": "c",
          "texto": "Pedis a las familias que lleven pibes en sus autos y armas una caravana solidaria.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 8,
            "conocimiento": -5,
            "confianza": 3,
            "conviccion": 2
          },
          "reaccion": "Sale lindo pero se te quedan cinco pibes esperando porque un auto no arranco."
        }
      ]
    },
    {
      "id": "rec_fechas_chocan",
      "problematica": "logistica",
      "situacion": "Reservaste el salon municipal para tu jornada juvenil, pero a ultimo momento te avisan que ese dia hay un acto oficial y te 'sugieren' que muevas la tuya. El unico otro espacio libre es el patio de la escuela, que te lo presta la directora pero quiere meter su charla de media hora en tu programa.",
      "opciones": [
        {
          "id": "a",
          "texto": "Cedes el salon sin chistar y agradeces la 'sugerencia' del municipio.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 0,
            "confianza": 8,
            "conviccion": -9
          },
          "reaccion": "Te corren la fecha tres veces mas en el mes y ya nadie sabe cuando es tu jornada."
        },
        {
          "id": "b",
          "texto": "Te plantas y exigis respetar tu reserva del salon como corresponde.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 0,
            "confianza": -12,
            "conviccion": 10
          },
          "reaccion": "Conseguis el salon pero el encargado te lo entrega sin limpiar y con las luces que fallan."
        },
        {
          "id": "c",
          "texto": "Te mudas al patio de la escuela y le das los treinta minutos a la directora.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 12,
            "conocimiento": 0,
            "confianza": -3,
            "conviccion": -4
          },
          "reaccion": "La charla de la directora se estira a una hora y los pibes empiezan a irse antes de tu actividad."
        }
      ]
    },
    {
      "id": "rec_sonido_sillas",
      "problematica": "logistica",
      "situacion": "Para el festival juvenil te falta sonido y sillas, y la plata alcanza para una sola cosa. El sonidista del pueblo te hace precio si despues le tocas un par de eventos privados gratis; las sillas te las presta la escuela si le firmas que se las devolves impecables aunque se rompa alguna.",
      "opciones": [
        {
          "id": "a",
          "texto": "Pagas el sonido y le prometes al sonidista los eventos gratis a futuro.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": -3,
            "conocimiento": 0,
            "confianza": 6,
            "conviccion": -6
          },
          "reaccion": "El finde siguiente el tipo ya te esta llamando para que le cumplas con un cumpleanios."
        },
        {
          "id": "b",
          "texto": "Bancas las sillas de la escuela y armas el festival con un parlante prestado medio cascoteado.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 7,
            "conocimiento": 0,
            "confianza": -5,
            "conviccion": 4
          },
          "reaccion": "El parlante se corta en pleno cierre y los pibes terminan cantando a pulmon."
        },
        {
          "id": "c",
          "texto": "Achicas el festival a la mitad y haces algo chiquito que entre en el presupuesto.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": -6,
            "conocimiento": 5,
            "confianza": 8,
            "conviccion": 0
          },
          "reaccion": "Sale prolijo pero la mitad de los pibes que venian se quedan afuera y se quejan."
        }
      ]
    },
    {
      "id": "esp_sum_doble_turno",
      "problematica": "espacios",
      "situacion": "El SUM de la sociedad de fomento es el unico techo grande del barrio, pero el cura lo usa para catequesis y un grupo de jubilados lo tiene los martes para la murga. Vos necesitas un lugar fijo para los talleres con los pibes y la encargada te dice: 'Arreglate vos con los otros, yo no quiero quilombo'.",
      "opciones": [
        {
          "id": "a",
          "texto": "Te sentas con catequesis y la murga y armas una grilla compartida donde a cada uno le toca su franja sin pisarse.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 0,
            "conocimiento": 5,
            "confianza": 5,
            "conviccion": -3
          },
          "reaccion": "Quedaste con los horarios de la siesta, pero al menos nadie te puede echar.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Vas directo a la encargada y le pedis que te de a vos la prioridad porque 'los pibes son el futuro', aunque desplaces a los jubilados.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 0,
            "conocimiento": 8,
            "confianza": -8,
            "conviccion": 4
          },
          "reaccion": "Conseguiste la mejor franja, pero la murga te tiene en la lista negra y se nota en el barrio.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Dejas el SUM y mudas los talleres a la vereda y un par de garajes prestados para no pelearte con nadie.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 3,
            "conocimiento": -6,
            "confianza": 2,
            "conviccion": 6
          },
          "reaccion": "Quedaste bien con todos, pero el primer dia de viento se te volo media actividad.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "esp_poli_llave_club",
      "problematica": "espacios",
      "situacion": "El polideportivo municipal esta cerrado a la tarde porque no hay quien lo abra, y el unico que tiene una copia de la llave es el presidente del club, que te la presta 'si despues le das una mano con la cantina los findes'. Los pibes ya estan cansados de jugar en el descampado.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptas el trato con el club y te comprometes a poner gente tuya en la cantina a cambio de la llave.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 0,
            "conocimiento": 6,
            "confianza": 6,
            "conviccion": -7
          },
          "reaccion": "Ya tenes cancha techada, pero ahora parte de tu agencia labura gratis para la comision del club.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Vas al municipio y peleas para que pongan un sereno que abra el poli a la tarde, sin deberle nada al club.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 3,
            "confianza": -6,
            "conviccion": 7
          },
          "reaccion": "Te plantaste con dignidad, pero hasta que aparezca el sereno los pibes siguen en el descampado.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Organizas a los pibes para que ellos mismos limpien y cuiden el descampado y lo armen como cancha propia.",
          "impactos": {
            "agencia": 2,
            "vinculoEscolar": 2,
            "conocimiento": -4,
            "confianza": -3,
            "conviccion": 5
          },
          "reaccion": "Los pibes se coparon y se sienten duenos del lugar, aunque al primer aguacero queda un barrial.",
          "requiereTirada": false
        }
      ]
    },
    {
      "id": "esp_galpon_vacio_riesgo",
      "problematica": "espacios",
      "situacion": "Atras de la estacion hay un galpon viejo del ferrocarril, enorme y vacio, que seria perfecto para hacer un centro juvenil. Esta abandonado hace anios, nadie sabe bien de quien es y el techo tiene un par de chapas flojas. Un concejal te ofrece 'gestionarlo' si le pones su nombre a la futura sala.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptas la ayuda del concejal para destrabar los papeles y le concedes el cartel con su nombre en la sala.",
          "impactos": {
            "agencia": 2,
            "vinculoEscolar": 0,
            "conocimiento": 4,
            "confianza": 8,
            "conviccion": -9
          },
          "reaccion": "El galpon va a ser tuyo en tiempo record, pero todo el barrio sabe a quien le quedaste debiendo.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Rechazas el padrinazgo y arrancas vos mismo el tramite del galpon, golpeando puertas en Provincia sin atajos.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 0,
            "conocimiento": 9,
            "confianza": -7,
            "conviccion": 7
          },
          "reaccion": "Mantuviste la agencia limpia, pero el expediente va a tardar meses y el techo no espera.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Te metes igual sin permiso y empezas a usar el galpon de hecho mientras se aclara de quien es.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -3,
            "conocimiento": -5,
            "confianza": -2,
            "conviccion": 3
          },
          "reaccion": "Los pibes ya pintaron una pared, pero la escuela mira de reojo eso de ocupar un lugar que no es de nadie.",
          "requiereTirada": true
        }
      ]
    },
    {
      "id": "eco_feria_consignacion",
      "problematica": "economia",
      "situacion": "Los pibes del taller de la agencia hicieron un montón de cosas para vender (llaveros, bolsas pintadas, dulces) y no tienen dónde colocarlas. El almacenero del centro te ofrece una vitrina al lado de la caja, pero quiere quedarse con el 30% de cada venta. Mientras tanto, la feria de los sábados en la plaza es gratis pero hay que madrugar, armar el puesto y bancar que un sábado no venga nadie.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptás la vitrina del almacenero y le das el 30%, total siempre hay gente que entra.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 5,
            "confianza": 8,
            "conviccion": -8
          },
          "reaccion": "Las cosas se venden solas en la caja, pero los pibes ven que casi la mitad de la ganancia se la lleva otro.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Te plantás en la feria de la plaza y armás el puesto vos mismo cada sábado a las siete de la mañana.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 5,
            "conocimiento": 8,
            "confianza": -5,
            "conviccion": 8
          },
          "reaccion": "Algunos sábados es un desierto y volvés con casi todo, pero la plata que entra es entera de ellos.",
          "requiereTirada": true
        },
        {
          "id": "c",
          "texto": "Negociás con el almacenero bajarle al 15% a cambio de ponerle el logo de su negocio en cada producto.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": -3,
            "conocimiento": 10,
            "confianza": 5,
            "conviccion": -3
          },
          "reaccion": "Cerrás un trato más justo, pero ahora cada llavero lleva la marca del almacén y no la de la agencia.",
          "requiereTirada": true
        }
      ]
    },
    {
      "id": "eco_primer_laburo_pasantia",
      "problematica": "economia",
      "situacion": "Una empresa de servicios del pueblo te llama: necesitan dos chicos para una changa de tres meses cargando datos en la computadora. Pagan poco y en negro, pero es el primer laburo formal-ish que se le aparece a varios de la agencia. Le pedís al dueño que los anote en blanco y te dice que así no le cierran los números, que es tomar o dejar.",
      "opciones": [
        {
          "id": "a",
          "texto": "Mandás a los dos pibes nomás, en negro, porque la experiencia y la plata les viene bárbaro.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 0,
            "conocimiento": 5,
            "confianza": 8,
            "conviccion": -10
          },
          "reaccion": "Los chicos arrancan contentos con su primer sueldo, aunque vos sabés que quedaron sin ningún respaldo.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Le decís que sin blanqueo no hay trato y se cae la changa para los pibes.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": 3,
            "conocimiento": 3,
            "confianza": -10,
            "conviccion": 12
          },
          "reaccion": "El dueño corta y llama a otros; los pibes se quedan sin laburo y te miran medio caído, pero entendiendo.",
          "requiereTirada": false
        },
        {
          "id": "c",
          "texto": "Aceptás la changa pero armás con ellos un cuaderno de horas y tareas para usarlo como antecedente real.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 5,
            "conocimiento": 12,
            "confianza": 3,
            "conviccion": -3
          },
          "reaccion": "Los pibes laburan igual de informal, pero salen con un registro propio de lo que saben hacer.",
          "requiereTirada": true
        }
      ]
    },
    {
      "id": "eco_capacitacion_subsidio",
      "problematica": "economia",
      "situacion": "Conseguís cupo en una capacitación paga de oficios (panadería, instalaciones, costura) que sirve un montón. Hay diez lugares y veinte pibes anotados. Un concejal te ofrece bancar la diferencia de plata que falta para sumar más cupos, pero pide que en la foto de cierre estén él y solo los chicos que él te marque en una lista.",
      "opciones": [
        {
          "id": "a",
          "texto": "Aceptás la plata del concejal y armás la lista de cupos como él te la pasa.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": -5,
            "conocimiento": 10,
            "confianza": 10,
            "conviccion": -12
          },
          "reaccion": "Entran más pibes a capacitarse, pero la mitad de los lugares los puso un dedo de afuera y se nota.",
          "requiereTirada": false
        },
        {
          "id": "b",
          "texto": "Rechazás el arreglo y sorteás los diez cupos que tenés a la vista de todos.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 8,
            "conocimiento": 5,
            "confianza": -8,
            "conviccion": 12
          },
          "reaccion": "El sorteo es transparente y nadie se queja, pero quedan diez pibes afuera y el concejal se ofende.",
          "requiereTirada": false
        },
        {
          "id": "c",
          "texto": "Le aceptás la plata pero le decís que los cupos los define la agencia y a él lo invitás a la foto final.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 3,
            "conocimiento": 8,
            "confianza": 5,
            "conviccion": -5
          },
          "reaccion": "Sumás cupos sin entregar la lista, aunque el concejal queda con cara de que esto no era lo pactado.",
          "requiereTirada": true
        }
      ]
    },
    {
      "id": "con_antena_paraje",
      "problematica": "conectividad",
      "situacion": "Los pibes del paraje, a 40 km del pueblo, no tienen señal ni para mandar un mensaje. Para que lleguen a la agencia hay que resolverles la conexión, y aparecen tres caminos: una antena comunitaria que sale plata, pedirle al intendente que la ponga él, o armar una movida con el club rural que ya tiene un mástil.",
      "opciones": [
        {
          "id": "a",
          "texto": "Bancás de tu presupuesto una antena comunitaria en el paraje para que los pibes tengan señal propia.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 5,
            "conocimiento": 8,
            "confianza": -12,
            "conviccion": 6
          },
          "reaccion": "Los pibes del paraje empiezan a aparecer en los grupos y te mandan audios agradeciendo."
        },
        {
          "id": "b",
          "texto": "Le pedís al intendente que la ponga el municipio, aunque sabés que después te va a cobrar el favor.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 4,
            "conocimiento": 6,
            "confianza": 8,
            "conviccion": -10
          },
          "reaccion": "El intendente firma rapidísimo y ya te avisa que cuenta con vos para inaugurarla con foto."
        },
        {
          "id": "c",
          "texto": "Te juntás con el club rural y compartís el mástil que ya tienen, poniendo vos el laburo de cableado.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 6,
            "conocimiento": 5,
            "confianza": -3,
            "conviccion": 3
          },
          "reaccion": "El presidente del club te da una mano con el camión pero te aclara que el mantenimiento corre por tu cuenta."
        }
      ]
    },
    {
      "id": "con_wifi_o_datos",
      "problematica": "conectividad",
      "situacion": "La agencia no tiene plata para todo y hay que elegir dónde meter la conectividad. Podés poner un punto digital con WiFi libre en el local, pasarles datos a los referentes pibes para que laburen desde el celu, o cerrar un canje con la radio para difundir todo por aire y ahorrarte internet.",
      "opciones": [
        {
          "id": "a",
          "texto": "Instalás un punto digital con WiFi libre en el local para que los pibes vengan a usarlo.",
          "impactos": {
            "agencia": 2,
            "vinculoEscolar": 7,
            "conocimiento": 6,
            "confianza": -10,
            "conviccion": 4
          },
          "reaccion": "El local se llena de pibes pegados al router y algunos vienen sólo por el WiFi, pero al menos vienen."
        },
        {
          "id": "b",
          "texto": "Les pagás datos móviles a los referentes para que coordinen desde donde estén, sin atarlos al local.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 5,
            "conocimiento": 4,
            "confianza": -6,
            "conviccion": 2
          },
          "reaccion": "Los referentes responden al toque desde el celu, aunque uno ya te avisó que el saldo se le vuela."
        },
        {
          "id": "c",
          "texto": "Hacés un canje con la radio para comunicar todo al aire y te bancás un tiempo sin internet propio.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": -3,
            "conocimiento": 3,
            "confianza": 7,
            "conviccion": -2
          },
          "reaccion": "La radio te da un espacio fijo pero los pibes que no escuchan AM se quedan afuera de la rosca."
        }
      ]
    },
    {
      "id": "con_caida_red_evento",
      "problematica": "conectividad",
      "situacion": "Justo el día del evento grande se cae toda la red del pueblo y no podés cargar inscripciones ni mostrar nada online. Tenés que decidir al toque: seguir todo a papel y reírte del bajón, suspender y reprogramar para no quedar mal, o pedirle el equipo de internet satelital al concejal que justo lo tiene.",
      "opciones": [
        {
          "id": "a",
          "texto": "Seguís el evento a pura planilla de papel y lo bancás con onda, sin conexión.",
          "impactos": {
            "agencia": 1,
            "vinculoEscolar": 4,
            "conocimiento": -2,
            "confianza": 2,
            "conviccion": 5
          },
          "reaccion": "Los pibes se cuelgan anotándose con birome y al final queda una jornada medio analógica pero copada."
        },
        {
          "id": "b",
          "texto": "Suspendés y reprogramás para hacerlo bien con todo conectado, aunque la gente ya estaba en la puerta.",
          "impactos": {
            "agencia": -1,
            "vinculoEscolar": -8,
            "conocimiento": 1,
            "confianza": -4,
            "conviccion": -1
          },
          "reaccion": "Algunos pibes pegan la vuelta puteando y te cuesta convencerlos de que vuelvan otro día."
        },
        {
          "id": "c",
          "texto": "Le pedís prestado el internet satelital al concejal, sabiendo que va a querer figurar en la movida.",
          "impactos": {
            "agencia": 0,
            "vinculoEscolar": 3,
            "conocimiento": 4,
            "confianza": 6,
            "conviccion": -9
          },
          "reaccion": "El concejal te trae el equipo enseguida y se queda todo el evento sacándose fotos con los pibes."
        }
      ]
    }
  ];
  try { AJ.Gestion.Dilemas.registrarGenericos(BANCO); }
  catch (e) { console.warn("[Gestion] no se pudo registrar el banco de dilemas", e); }
})();
