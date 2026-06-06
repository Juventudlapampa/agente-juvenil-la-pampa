/* =====================================================================
 * misiones.js — Cuaderno del Agente: misiones cívicas (FASE 2)
 * ---------------------------------------------------------------------
 * 5 misiones cívicas, costumbristas y en cadena. Cada una:
 *   1) la ofrece un NPC (npcInicio),
 *   2) manda a hablar con otro NPC (objetivoNpc),
 *   3) se completa volviendo al que la dio (npcFin).
 * Al completar todas -> pantalla Final.
 *
 * Estado por misión en estado.misiones[id]:
 *   (sin clave) = aún no ofrecida / bloqueada
 *   'activa'      = ofrecida, falta cumplir el objetivo
 *   'objetivo_ok' = objetivo cumplido, falta volver
 *   'completada'  = lista
 * ===================================================================== */

window.AJ = window.AJ || {};

// --- Definición de las misiones (orden = orden de desbloqueo) ---------
AJ.MISIONES = [
  {
    id: 'bienvenida',
    titulo: 'Bienvenida al pueblo',
    npcInicio: 'maestra',
    objetivoNpc: 'intendenta',
    npcFin: 'maestra',
    pista: 'Presentate ante la Intendenta Beba en la Municipalidad.',
    dialogoOferta: [
      '¡Por fin llegás, Agente! Te estábamos esperando en la Casa de la Juventud.',
      'Tu trabajo es simple y enorme: dar una mano al pueblo.',
      'Andá a presentarte ante la Intendenta Beba, en la Municipalidad.',
    ],
    dialogoObjetivo: [
      'Así que vos sos el nuevo Agente Juvenil. ¡Bienvenido!',
      'Decile a la Maestra Rosa que cuente conmigo para todo.',
    ],
    dialogoFin: [
      '¿Viste que la Beba es un sol? Ya sos parte del pueblo.',
      'Tomá unas monedas para los mates. ¡A laburar con ganas!',
    ],
    recompensa: { monedas: 10, logro: 'Agente jurado' },
  },
  {
    id: 'plaza',
    titulo: 'La plaza de todos',
    npcInicio: 'intendenta',
    objetivoNpc: 'almacenero',
    npcFin: 'intendenta',
    pista: 'Pedile bolsas a Don Pedro en el almacén para limpiar la plaza.',
    dialogoOferta: [
      'Agente, la plaza está hecha un desastre tras la kermés.',
      'Necesitamos bolsas para juntar todo. Pedile a Don Pedro, del almacén.',
    ],
    dialogoObjetivo: [
      '¿Bolsas para la plaza? ¡Cómo no! Llevá las que necesites.',
      'Decile a la Beba que después le mando el fiado... es broma.',
    ],
    dialogoFin: [
      '¡Bárbaro! Con esas bolsas dejamos la plaza impecable.',
      'El monumento a los pioneros vuelve a lucir. ¡Gracias, Agente!',
    ],
    recompensa: { monedas: 15, logro: 'Plaza limpia' },
  },
  {
    id: 'acto',
    titulo: 'Campanas y memoria',
    npcInicio: 'cura',
    objetivoNpc: 'abuela',
    npcFin: 'cura',
    pista: 'Pedile a Doña Elsa que cuente la historia del pueblo para el acto.',
    dialogoOferta: [
      'Hijo, preparamos el acto patrio en la iglesia.',
      'Falta quien cuente cómo se fundó el pueblo. Doña Elsa lo sabe todo.',
      'Andá a la plaza y pedile a la Doña que nos comparta su memoria.',
    ],
    dialogoObjetivo: [
      '¿La historia del pueblo? Uy, me encanta que me pregunten.',
      'Decile al Padre Antonio que cuente conmigo para el acto.',
    ],
    dialogoFin: [
      'Con Doña Elsa, el acto va a emocionar a todos.',
      'Gracias, Agente. La memoria del pueblo está en buenas manos.',
    ],
    recompensa: { monedas: 15, logro: 'Guardián de la memoria' },
  },
  {
    id: 'aguada',
    titulo: 'Cuidar la aguada',
    npcInicio: 'chacarero',
    objetivoNpc: 'maestra',
    npcFin: 'chacarero',
    pista: 'Pedile a la Maestra Rosa una charla escolar sobre el agua.',
    dialogoOferta: [
      'Agente, la aguada es la vida del campo y la están descuidando.',
      'Si los chicos aprenden a cuidarla, cambia todo.',
      'Pedile a la Maestra Rosa que dé una charla en la escuela.',
    ],
    dialogoObjetivo: [
      '¿Una charla sobre el agua? ¡Justo lo que el pueblo necesita!',
      'Decile al Tano que el martes la damos junto a la aguada.',
    ],
    dialogoFin: [
      '¡Esa es la actitud! Con los pibes concientizados, la aguada se salva.',
      'Sos un fenómeno, Agente. La tierra te lo agradece.',
    ],
    recompensa: { monedas: 20, logro: 'Defensor de la aguada' },
  },
  {
    id: 'fiesta',
    titulo: 'La fiesta del pueblo',
    npcInicio: 'intendenta',
    objetivoNpc: 'abuela',
    npcFin: 'intendenta',
    pista: 'Invitá a Doña Elsa a la gran fiesta del pueblo.',
    dialogoOferta: [
      'Agente, llegó la hora: organizamos la gran fiesta del pueblo.',
      'Quiero que Doña Elsa sea la madrina de honor. Andá a invitarla.',
    ],
    dialogoObjetivo: [
      '¿Madrina de la fiesta? ¡Qué emoción, m\'hijo! Ahí voy a estar.',
      'Decile a la Beba que llevo las tortas fritas.',
    ],
    dialogoFin: [
      '¡Todo listo para la fiesta! Lo lograste, Agente.',
      'El pueblo entero te lo agradece. ¡Sos un orgullo!',
    ],
    recompensa: { monedas: 30, logro: 'Alma de la fiesta' },
  },
];

/* C1.2 — Misiones propias de la Colonia (pueblo: 2). Se suman a AJ.MISIONES
 * sólo si CONFIG.misionesColonia está en true (ver final del archivo). Son
 * plantillas de texto reskinables, igual que las del pueblo principal. */
AJ.MISIONES_COLONIA = [
  {
    id: 'col_escuela',
    pueblo: 2,
    titulo: 'La escuelita rural',
    npcInicio: 'maestra_rural',
    objetivoNpc: 'puestero',
    npcFin: 'maestra_rural',
    pista: 'Pedile a Don Ramón unos tablones para arreglar la escuelita.',
    dialogoOferta: [
      'Agente, a la escuelita rural se le llueve el techo.',
      'Don Ramón el Puestero siempre tiene madera de sobra. ¿Le pedís unos tablones?',
    ],
    dialogoObjetivo: [
      '¿Tablones para la escuela? Para los chicos, lo que haga falta.',
      'Decile a la Seño Marta que mañana se los acerco con el sulky.',
    ],
    dialogoFin: [
      '¡Gracias, Agente! Con ese techo los chicos estudian secos.',
      'Acá en la Colonia la escuela es sagrada.',
    ],
    recompensa: { monedas: 15, logro: 'Amigo de la escuelita' },
  },
  {
    id: 'col_aguada',
    pueblo: 2,
    titulo: 'El agua de la Colonia',
    npcInicio: 'tractorista',
    objetivoNpc: 'partera',
    npcFin: 'tractorista',
    pista: 'Pedile a Doña Anunciación que enseñe a cuidar el agua del molino.',
    dialogoOferta: [
      'Agente, el molino y la aguada son la vida de la Colonia.',
      'Doña Anunciación conoce cada secreto del agua. Que nos dé una mano.',
    ],
    dialogoObjetivo: [
      '¿Cuidar el agua? Hace 50 años que se lo digo a todos, m\'hijo.',
      'Contale al Colorado que el sábado junto a las mujeres en el molino.',
    ],
    dialogoFin: [
      '¡Bárbaro! Con Doña Anunciación al frente, el agua está cuidada.',
      'La Colonia te lo agradece, Agente.',
    ],
    recompensa: { monedas: 20, logro: 'Cuidador del molino' },
  },
];

/* D2 — Más misiones plantilla (CONFIG.masMisiones). Reusan vecinos de D1, así que
 * requieren CONFIG.poblarMundo. Contenido generado y revisado por workflow (genérico,
 * sin marcas ni apuestas; una rifa fue reescrita como colecta cívica). Las del pueblo
 * 1 se insertan ANTES de "fiesta" (que queda como gran final); las de la Colonia van
 * al final de su cadena. Ver el concat al final del archivo. */
AJ.MISIONES_D2 = [
  {
    id: 'pu1_quiosco', pueblo: 1, titulo: 'La colecta del cuartel',
    npcInicio: 'quiosquera', objetivoNpc: 'jubilado', npcFin: 'quiosquera',
    pista: 'Buscá a Don Tito en el banco de la plaza para la colecta del cuartel.',
    dialogoOferta: [
      'Agente, juntamos donaciones para el cuartel de bomberos y andamos flojos.',
      'Don Tito se sienta todo el día en la plaza: andá a pedirle una manito.',
    ],
    dialogoObjetivo: [
      '¿Una mano para los bomberos? Pongo lo mío, que para algo está la jubilación.',
      'Decile a la Coca que cuente conmigo, como siempre.',
    ],
    dialogoFin: [
      '¡Don Tito colaboró! Ese viejo tiene más corazón que cara de amargo.',
      'Con lo juntado el cuartel se compra mangueras nuevas. Gracias, Agente.',
    ],
    recompensa: { monedas: 15, logro: 'Puntal del cuartel' },
  },
  {
    id: 'pu1_sirena', pueblo: 1, titulo: 'La sirena del cuartel',
    npcInicio: 'bombero', objetivoNpc: 'cura', npcFin: 'bombero',
    pista: 'Pedile al Padre Antonio una bendición para el cuartel de bomberos.',
    dialogoOferta: [
      'Agente, arreglamos la sirena vieja y el sábado la estrenamos.',
      'Estaría lindo que el Padre Antonio venga a bendecir el cuartel. ¿Lo invitás?',
    ],
    dialogoObjetivo: [
      '¿Bendecir a los bomberos? Con todo gusto, hijo, que arriesgan el cuero por todos.',
      'Decile al Lucho que llevo el agua bendita y unas facturas.',
    ],
    dialogoFin: [
      '¡El Padre dijo que sí! El sábado va a estar lleno de gente.',
      'El pueblo va a dormir más tranquilo. Sos un grande, Agente.',
    ],
    recompensa: { monedas: 20, logro: 'Padrino del cuartel' },
  },
  {
    id: 'col_colmenas', pueblo: 2, titulo: 'Miel para la Colonia',
    npcInicio: 'apicultora', objetivoNpc: 'alambrador', npcFin: 'apicultora',
    pista: 'Pedile al Vasco Iturri unos postes para cercar las colmenas.',
    dialogoOferta: [
      'Agente, las vacas andan rondando las colmenas y me las van a voltear.',
      'El Vasco Iturri tiene postes de ñandubay de sobra. ¿Le pedís unos para el cerco?',
    ],
    dialogoObjetivo: [
      '¿Postes para las colmenas? Llevá los que quieras, están estacionados.',
      'Decile a la Flor de Miel que el sábado le clavo el cerco yo mismo.',
    ],
    dialogoFin: [
      '¡Gracias, Agente! Con el cerco las abejas trabajan tranquilas.',
      'Pasá cuando quieras, que te guardo un frasco de la primera miel.',
    ],
    recompensa: { monedas: 15, logro: 'Amigo de las abejas' },
  },
  {
    id: 'col_boliche', pueblo: 2, titulo: 'El boliche de ramos generales',
    npcInicio: 'almacenera_rural', objetivoNpc: 'puestero', npcFin: 'almacenera_rural',
    pista: 'Pedile a Don Ramón que arrime la carga al boliche con el sulky.',
    dialogoOferta: [
      'Querido, me llegó la mercadería a la estación y no tengo cómo traerla.',
      'Don Ramón el Puestero anda con el sulky liviano. ¿Le pedís que me dé una mano?',
    ],
    dialogoObjetivo: [
      '¿Acarrear la mercadería de la Pochi? Cómo no, si me fía desde que tengo memoria.',
      'Andá avisándole que antes del mediodía le dejo todo en el mostrador.',
    ],
    dialogoFin: [
      '¡Bendito seas, Agente! Ya tengo yerba y harina para toda la Colonia.',
      'Llevate unos bizcochitos para el camino, que no se diga que la Pochi es amarreta.',
    ],
    recompensa: { monedas: 20, logro: 'Puntal del boliche' },
  },
];

AJ.Misiones = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.misiones) this.estado.misiones = {};
    if (!this.estado.inventario) this.estado.inventario = { monedas: 0, logros: [] };
  }

  init() {
    this._crearHUD();
    this._recalcularMarcas();
    this._actualizarHUD();
  }

  // --- Helpers de estado ---
  _estadoDe(id) { return this.estado.misiones[id]; }
  // C1.2: las misiones se agrupan por pueblo (pueblo||1). El "Cuaderno" muestra
  // la cadena DEL PUEBLO ACTUAL; el progreso de cada pueblo se recuerda aparte
  // (todo vive en estado.misiones, que se persiste).
  _pueblo() { return (window.AJ && AJ.Mapa) ? AJ.Mapa.actual : 1; }
  _delPueblo() {
    const pu = this._pueblo();
    return AJ.MISIONES.filter((m) => (m.pueblo || 1) === pu);
  }
  _completadas() {
    return this._delPueblo().filter((m) => this._estadoDe(m.id) === 'completada').length;
  }
  _totalPueblo() { return this._delPueblo().length; }
  // La primera misión no completada del pueblo actual es la "actual".
  _misionActual() {
    return this._delPueblo().find((m) => this._estadoDe(m.id) !== 'completada') || null;
  }
  // ¿Está desbloqueada? Sólo la actual (las anteriores ya están completas).
  _desbloqueada(m) { return this._misionActual() === m; }

  // --- Interacción al hablar con un NPC ---
  alHablar(npc, dialogo) {
    const m = this._misionActual();
    if (!m) { // todo completo
      this._mostrar(dialogo, npc, npc.saludo);
      return;
    }
    const st = this._estadoDe(m.id);

    // 1) Ofrecer la misión.
    if (!st && npc.id === m.npcInicio) {
      this.estado.misiones[m.id] = 'activa';
      this.estado.misionActiva = m.id;
      this._guardar();
      this._mostrar(dialogo, npc, m.dialogoOferta, () => {
        this._recalcularMarcas(); this._actualizarHUD();
      });
      return;
    }
    // 2) Cumplir objetivo (hablar con objetivoNpc).
    if (st === 'activa' && npc.id === m.objetivoNpc) {
      this.estado.misiones[m.id] = 'objetivo_ok';
      this._guardar();
      this._mostrar(dialogo, npc, m.dialogoObjetivo, () => {
        this._recalcularMarcas(); this._actualizarHUD();
      });
      return;
    }
    // 3) Volver al que la dio -> completar.
    if (st === 'objetivo_ok' && npc.id === m.npcFin) {
      this._mostrar(dialogo, npc, m.dialogoFin, () => this._completar(m));
      return;
    }

    // Si no aplica a la misión, línea de ambiente (con pista si está activa).
    let lineas = npc.saludo ? npc.saludo.slice() : ['...'];
    if (st === 'activa' || st === 'objetivo_ok') {
      lineas = lineas.concat(['(Misión: ' + m.pista + ')']);
    } else if (!st && npc.id !== m.npcInicio) {
      lineas = lineas.concat(['Andá a ver a ' + this._nombreDe(m.npcInicio) + '.']);
    }
    this._mostrar(dialogo, npc, lineas);
  }

  _nombreDe(id) {
    const n = this.scene.npcManager && this.scene.npcManager.porId(id);
    return n ? n.nombre : 'alguien del pueblo';
  }

  _mostrar(dialogo, npc, lineas, alCerrar) {
    if (npc && npc.mirarHacia && this.scene.jugador) {
      const p = this.scene.jugador.tilePos();
      npc.mirarHacia(p.x, p.y);
    }
    if (dialogo) dialogo.mostrar(npc ? npc.nombre : '', lineas, alCerrar);
  }

  _completar(m) {
    this.estado.misiones[m.id] = 'completada';
    // F4: misión completada por pueblo (estadísticas acumuladas).
    if (AJ.Stats) { try { AJ.Stats.registrarMision(m.pueblo || 1); } catch (e) {} }
    if (AJ.Sonido) { try { AJ.Sonido.mision(); } catch (e) {} }
    // P1 (juice): celebración breve al cumplir una misión.
    if (AJ.Juice) {
      try {
        const W = this.scene.scale.width, H = this.scene.scale.height;
        AJ.Juice.celebrar(this.scene, W / 2, H * 0.4);
      } catch (e) {}
    }
    // Recompensa
    try {
      const inv = this.estado.inventario;
      inv.monedas = (inv.monedas || 0) + (m.recompensa.monedas || 0);
      if (m.recompensa.logro && inv.logros.indexOf(m.recompensa.logro) < 0) {
        inv.logros.push(m.recompensa.logro);
      }
    } catch (e) { console.warn('[Misiones] recompensa', e); }

    const siguiente = this._misionActual();
    this.estado.misionActiva = siguiente ? siguiente.id : null;
    this._guardar();
    this._recalcularMarcas();
    this._actualizarHUD();
    if (this.scene._actualizarHUD) this.scene._actualizarHUD();

    // ¿Se completó la cadena? El Final (felicitación) es la historia PRINCIPAL
    // (Pueblo 1). Las misiones de la Colonia son contenido aparte: al terminarlas
    // se celebra pero no se dispara el Final. C1.2.
    const esPrincipal = (m.pueblo || 1) === 1;
    if (!siguiente && esPrincipal) {
      this.scene.time.delayedCall(700, () => {
        try {
          this.scene.guardar();
          const datos = { resumen: { monedas: this.estado.inventario.monedas } };
          if (AJ.Juice) AJ.Juice.irA(this.scene, 'Final', datos);
          else this.scene.scene.start('Final', datos);
        } catch (e) { console.warn('[Misiones] no se pudo ir al Final', e); }
      });
    }
  }

  // Marca "!" sobre los NPCs con los que hay que interactuar ahora.
  _recalcularMarcas() {
    const mgr = this.scene.npcManager;
    if (!mgr) return;
    const m = this._misionActual();
    mgr.npcs.forEach((n) => n.mostrarMarca(false));
    if (!m) return;
    const st = this._estadoDe(m.id);
    let objetivoId = null;
    if (!st) objetivoId = m.npcInicio;
    else if (st === 'activa') objetivoId = m.objetivoNpc;
    else if (st === 'objetivo_ok') objetivoId = m.npcFin;
    if (objetivoId) {
      const n = mgr.porId(objetivoId);
      if (n) n.mostrarMarca(true);
    }
  }

  // --- HUD de misión activa (esquina superior derecha) ---
  _crearHUD() {
    const W = this.scene.scale.width;
    // y=62: deja lugar arriba-derecha para el botón de mute (P2).
    this.hud = this.scene.add.text(W - 12, 62, '', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff7e6',
      backgroundColor: '#2a1f12cc', padding: { x: 8, y: 6 },
      align: 'right', wordWrap: { width: 280 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(9000);
  }

  _actualizarHUD() {
    if (!this.hud) return;
    const m = this._misionActual();
    const total = this._totalPueblo(), hechas = this._completadas();
    if (!m) { this.hud.setText('★ ¡Misiones cumplidas! (' + hechas + '/' + total + ')'); return; }
    const st = this._estadoDe(m.id);
    let estado = 'Nueva';
    if (st === 'activa') estado = 'En curso';
    else if (st === 'objetivo_ok') estado = '¡Volvé a avisar!';
    let txt = 'CUADERNO  (' + hechas + '/' + total + ')\n';
    txt += '▶ ' + m.titulo + '\n';
    txt += (st ? m.pista : 'Buscá a ' + this._nombreDe(m.npcInicio) + '.');
    this.hud.setText(txt);
  }

  _guardar() { try { AJ.Guardado.guardar(this.estado); } catch (e) {} }
};

// C1.2: sumar las misiones de la Colonia a la lista global SÓLO si el flag está
// en true. Si está en false, AJ.MISIONES queda como en FASE 2 (cadena del Pueblo 1)
// y la Colonia no tiene misiones. El estado de cada misión se guarda por id, así el
// progreso de cada pueblo se recuerda por separado.
if (window.AJ && AJ.CONFIG && AJ.CONFIG.misionesColonia &&
    AJ.MISIONES && AJ.MISIONES_COLONIA &&
    AJ.MISIONES.indexOf(AJ.MISIONES_COLONIA[0]) < 0) {
  AJ.MISIONES = AJ.MISIONES.concat(AJ.MISIONES_COLONIA);
}

// D2: sumar las misiones nuevas SÓLO si masMisiones Y poblarMundo (usan vecinos de
// D1). Las del pueblo 1 se insertan ANTES de 'fiesta' (que sigue siendo el gran final
// que dispara la pantalla Final); las de la Colonia se agregan al final de su cadena.
if (window.AJ && AJ.CONFIG && AJ.CONFIG.masMisiones && AJ.CONFIG.poblarMundo &&
    AJ.MISIONES && AJ.MISIONES_D2 &&
    AJ.MISIONES.indexOf(AJ.MISIONES_D2[0]) < 0) {
  const d2p1 = AJ.MISIONES_D2.filter((m) => (m.pueblo || 1) === 1);
  const d2p2 = AJ.MISIONES_D2.filter((m) => (m.pueblo || 1) === 2);
  const iFiesta = AJ.MISIONES.findIndex((m) => m.id === 'fiesta');
  if (iFiesta >= 0) AJ.MISIONES.splice.apply(AJ.MISIONES, [iFiesta, 0].concat(d2p1));
  else AJ.MISIONES = AJ.MISIONES.concat(d2p1);
  AJ.MISIONES = AJ.MISIONES.concat(d2p2);
}
