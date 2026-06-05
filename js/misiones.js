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
  _completadas() {
    return AJ.MISIONES.filter((m) => this._estadoDe(m.id) === 'completada').length;
  }
  // La primera misión no completada es la "actual" desbloqueada.
  _misionActual() {
    return AJ.MISIONES.find((m) => this._estadoDe(m.id) !== 'completada') || null;
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

    // ¿Se completaron todas? -> Final.
    if (!siguiente) {
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
    this.hud = this.scene.add.text(W - 12, 10, '', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff7e6',
      backgroundColor: '#2a1f12cc', padding: { x: 8, y: 6 },
      align: 'right', wordWrap: { width: 280 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(9000);
  }

  _actualizarHUD() {
    if (!this.hud) return;
    const m = this._misionActual();
    const total = AJ.MISIONES.length, hechas = this._completadas();
    if (!m) { this.hud.setText('★ ¡Todas las misiones cumplidas! (' + total + '/' + total + ')'); return; }
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
