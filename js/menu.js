/* =====================================================================
 * menu.js — Menú de pausa y opciones (C2.2, CONFIG.menu)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.menu. Pantalla de pausa con: reanudar, mute,
 * ver controles/ayuda, reiniciar partida (con DOBLE confirmación para no
 * borrar sin querer) y volver al título. QoL: NO toca el balance.
 *
 * Mientras está abierto, la escena congela el juego (lo lee Pueblo.update).
 * Si el flag está off o algo falla, no se crea y todo sigue igual.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Menu = class {
  constructor(scene) {
    this.scene = scene;
    this.abierto = false;
    this.vista = 'menu'; // 'menu' | 'ayuda' | 'confirmar'
    this._construir();
  }

  _construir() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    this.cont = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(12000).setVisible(false);

    // Fondo oscurecedor (interactivo para bloquear clicks al juego).
    this.fondo = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.55)
      .setOrigin(0, 0).setInteractive();

    // Panel.
    const pw = 380, ph = 360;
    this.panelG = this.scene.add.graphics();
    this.panelG.fillStyle(0x2a1f12, 0.98); this.panelG.fillRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 16);
    this.panelG.lineStyle(3, 0xf3d9a0, 1); this.panelG.strokeRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 16);

    this.titulo = this.scene.add.text(W / 2, (H - ph) / 2 + 20, 'PAUSA', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#f5d020', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Contenedor de filas (se rearma según la vista).
    this.filas = this.scene.add.container(0, 0);

    this.cont.add([this.fondo, this.panelG, this.titulo, this.filas]);
  }

  // --- Construcción de botones de fila ---
  _boton(y, texto, onClick, color) {
    const W = this.scene.scale.width;
    const t = this.scene.add.text(W / 2, y, texto, {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: color || '#fff7e6',
      backgroundColor: '#00000000', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setBackgroundColor('#5a3a1f'));
    t.on('pointerout', () => t.setBackgroundColor('#00000000'));
    t.on('pointerdown', () => {
      if (AJ.Sonido) { try { AJ.Sonido.desbloquear(); AJ.Sonido.click(); } catch (e) {} }
      try { onClick(); } catch (e) { console.warn('[Menu] acción', e); }
    });
    this.filas.add(t);
    return t;
  }

  _limpiarFilas() { this.filas.removeAll(true); }

  // ¿Hay sub-panels para mostrar en "Registro / Opciones"?
  _hayExtras() {
    const sc = this.scene;
    return !!(sc.registro || sc.progreso ||
      (AJ.Accesibilidad && AJ.Accesibilidad.activo()) ||
      (AJ.CONFIG.creditos && AJ.Creditos));
  }

  _render() {
    this._limpiarFilas();
    const H = this.scene.scale.height;
    const y0 = H / 2 - 70;
    if (this.vista === 'menu') {
      this.titulo.setText('PAUSA');
      const muteTxt = (AJ.Sonido && AJ.Sonido.estaMuteado()) ? 'Sonido: 🔇 (apagado)' : 'Sonido: 🔊 (encendido)';
      this._boton(y0, 'Reanudar', () => this.cerrar());
      this._boton(y0 + 44, muteTxt, () => { if (AJ.Sonido) AJ.Sonido.toggleMute(); this._render(); });
      this._boton(y0 + 88, 'Controles / Ayuda', () => { this.vista = 'ayuda'; this._render(); });
      // Sub-menú "Registro / Opciones" sólo si hay algo que mostrar ahí.
      if (this._hayExtras()) this._boton(y0 + 132, 'Registro / Opciones', () => { this.vista = 'extras'; this._render(); });
      const dy = this._hayExtras() ? 44 : 0;
      this._boton(y0 + 132 + dy, 'Reiniciar partida', () => { this.vista = 'confirmar'; this._render(); }, '#e0a04a');
      this._boton(y0 + 176 + dy, 'Volver al título', () => this._volverTitulo());
    } else if (this.vista === 'extras') {
      this.titulo.setText('REGISTRO / OPCIONES');
      let y = y0;
      const sc = this.scene;
      // Abren un sub-panel ARRIBA del menú: el menú queda abierto (juego en pausa).
      if (sc.registro) { this._boton(y, '📋 Registro del Agente', () => sc.registro.abrir()); y += 44; }
      if (sc.progreso) { this._boton(y, '📊 Progreso y estadísticas', () => sc.progreso.abrir()); y += 44; }
      if (AJ.Accesibilidad && AJ.Accesibilidad.activo()) { this._boton(y, '⚙ Accesibilidad', () => AJ.Accesibilidad.abrirPanel(sc)); y += 44; }
      if (AJ.CONFIG.creditos && AJ.Creditos) { this._boton(y, '📜 Créditos', () => AJ.Creditos.abrir(sc)); y += 44; }
      this._boton(y + 16, '« Volver', () => { this.vista = 'menu'; this._render(); });
    } else if (this.vista === 'ayuda') {
      this.titulo.setText('CONTROLES');
      const W = this.scene.scale.width;
      const ayuda = this.scene.add.text(W / 2, y0, [
        'Moverse:  flechas / WASD',
        '          o joystick / d-pad (celular)',
        'Interactuar:  Espacio / E / botón E',
        'Pausa:  P  (o el botón ☰)',
        'Hablar con los vecinos para misiones',
        'y amistad. Viajá entre los dos pueblos',
        'por los carteles de salida.',
      ].join('\n'), {
        fontFamily: 'monospace', fontSize: '14px', color: '#fff7e6',
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5, 0);
      this.filas.add(ayuda);
      this._boton(H / 2 + 130, 'Volver', () => { this.vista = 'menu'; this._render(); });
    } else if (this.vista === 'confirmar') {
      this.titulo.setText('¿REINICIAR?');
      const W = this.scene.scale.width;
      const aviso = this.scene.add.text(W / 2, y0, [
        'Esto BORRA tu progreso guardado',
        '(misiones, monedas, amistades, granja).',
        'No se puede deshacer.',
      ].join('\n'), {
        fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f3d9a0', align: 'center', lineSpacing: 5,
      }).setOrigin(0.5, 0);
      this.filas.add(aviso);
      // Doble confirmación: primero "Sí, quiero reiniciar", luego "CONFIRMAR".
      this._boton(H / 2 + 30, 'No, volver', () => { this.vista = 'menu'; this._render(); });
      this._boton(H / 2 + 74, 'Sí, quiero reiniciar', () => { this.vista = 'confirmar2'; this._render(); }, '#e0a04a');
    } else if (this.vista === 'confirmar2') {
      this.titulo.setText('CONFIRMAR');
      const W = this.scene.scale.width;
      const aviso = this.scene.add.text(W / 2, y0, 'Última chance. ¿Borrar todo y empezar de nuevo?', {
        fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f3d9a0',
        align: 'center', wordWrap: { width: 320 },
      }).setOrigin(0.5, 0);
      this.filas.add(aviso);
      this._boton(H / 2 + 30, 'No, cancelar', () => { this.vista = 'menu'; this._render(); });
      this._boton(H / 2 + 74, 'SÍ, BORRAR Y REINICIAR', () => this._reiniciar(), '#e06a4a');
    }
  }

  _volverTitulo() {
    try { if (this.scene.guardar) this.scene.guardar(); } catch (e) {}
    this.cerrar();
    if (AJ.Juice) AJ.Juice.irA(this.scene, 'Titulo');
    else this.scene.scene.start('Titulo');
  }

  _reiniciar() {
    try { AJ.Guardado.borrar(); } catch (e) {}
    this.cerrar();
    if (AJ.Juice) AJ.Juice.irA(this.scene, 'Pueblo', { nuevo: true });
    else this.scene.scene.start('Pueblo', { nuevo: true });
  }

  alternar() { this.abierto ? this.cerrar() : this.abrir(); }

  abrir() {
    this.abierto = true;
    this.vista = 'menu';
    this._render();
    this.cont.setVisible(true);
    if (AJ.Juice) AJ.Juice.aparecer(this.scene, this.panelG);
  }

  cerrar() {
    this.abierto = false;
    // Cerrar también cualquier sub-panel de "extras" abierto, para no dejar un
    // overlay zombi con el juego despausado (review D/E).
    const sc = this.scene;
    try { if (sc.registro && sc.registro.abierto) sc.registro.cerrar(); } catch (e) {}
    try { if (sc.progreso && sc.progreso.abierto) sc.progreso.cerrar(); } catch (e) {}
    try { if (AJ.Accesibilidad && AJ.Accesibilidad.cerrarPanel) AJ.Accesibilidad.cerrarPanel(); } catch (e) {}
    try { if (AJ.Creditos && AJ.Creditos.cerrar) AJ.Creditos.cerrar(); } catch (e) {}
    this.cont.setVisible(false);
  }
};
