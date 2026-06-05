/* =====================================================================
 * progreso.js — Pantalla de progreso/estadísticas (E1, CONFIG.progreso)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.progreso. Panel de SÓLO LECTURA que lee del
 * Registro (D3) + el estado: % global, tiempo jugado, día, misiones por
 * pueblo y afinidad con cada vecino conocido. No toca nada.
 *
 * Si el flag está off o algo falla, no se crea y el juego sigue igual.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Progreso = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    this.abierto = false;
  }

  _fmtTiempo(seg) {
    seg = Math.floor(seg || 0);
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  _corazones(v) {
    const ll = Math.round((v || 0) / 20);
    return '♥'.repeat(ll) + '♡'.repeat(5 - ll);
  }

  _construir() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    this.cont = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(13000).setVisible(false);
    this.fondo = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0, 0).setInteractive();
    const pw = 480, ph = 410;
    const g = this.scene.add.graphics();
    g.fillStyle(0x14202a, 0.98); g.fillRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    g.lineStyle(3, 0x7bb8e0, 1); g.strokeRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    this.titulo = this.scene.add.text(W / 2, (H - ph) / 2 + 16, 'PROGRESO Y ESTADÍSTICAS', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#bfe0f5', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.cuerpo = this.scene.add.text((W - pw) / 2 + 26, (H - ph) / 2 + 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fff7e6', lineSpacing: 6,
    });
    this.btnVolver = this.scene.add.text(W / 2, (H + ph) / 2 - 26, '« Volver', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#bfe0f5',
      backgroundColor: '#234a5a', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.btnVolver.on('pointerdown', () => {
      if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
      this.cerrar();
    });
    this.cont.add([this.fondo, g, this.titulo, this.cuerpo, this.btnVolver]);
  }

  _misionesPorPueblo() {
    const out = {};
    (AJ.MISIONES || []).forEach((m) => {
      const pu = m.pueblo || 1;
      if (!out[pu]) out[pu] = { de: 0, total: 0 };
      out[pu].total++;
      if (this.estado.misiones[m.id] === 'completada') out[pu].de++;
    });
    return out;
  }

  _refrescar() {
    if (!this.cuerpo) return;
    const pct = (this.scene.registro && this.scene.registro.datos) ? this.scene.registro.datos().porcentaje : 0;
    const lineas = [
      'Avance global:  ' + pct + '%',
      'Tiempo jugado:  ' + this._fmtTiempo(this.estado.tiempoJugado),
      'Día de juego:   ' + ((this.estado.tiempo && this.estado.tiempo.dia) || 1),
      'Monedas:        ¢ ' + ((this.estado.inventario && this.estado.inventario.monedas) || 0),
      '',
      'Misiones por pueblo:',
    ];
    const nombres = { 1: 'El pueblo', 2: 'La Colonia', 3: 'El Puesto' };
    const mpp = this._misionesPorPueblo();
    Object.keys(mpp).forEach((pu) => {
      lineas.push('  ' + (nombres[pu] || ('Pueblo ' + pu)).padEnd(12, ' ') + mpp[pu].de + ' / ' + mpp[pu].total);
    });
    lineas.push('');
    lineas.push('Amistad con los vecinos conocidos:');
    const roster = AJ.roster ? AJ.roster() : [];
    const conocidos = roster.filter((n) => this.estado.registro && this.estado.registro.vecinos && this.estado.registro.vecinos[n.id]);
    if (conocidos.length === 0) lineas.push('  (todavía no conocés a nadie)');
    else conocidos.slice(0, 8).forEach((n) => {
      const af = (this.estado.afinidad && this.estado.afinidad[n.id]) || 0;
      lineas.push('  ' + (n.nombre + '').slice(0, 20).padEnd(20, ' ') + ' ' + this._corazones(af));
    });
    if (conocidos.length > 8) lineas.push('  ...y ' + (conocidos.length - 8) + ' más');
    this.cuerpo.setText(lineas.join('\n'));
  }

  abrir() {
    if (!this.cont) this._construir();
    this.abierto = true;
    this._refrescar();
    this.cont.setVisible(true);
    if (AJ.Juice) AJ.Juice.aparecer(this.scene, this.cont);
  }
  cerrar() { this.abierto = false; if (this.cont) this.cont.setVisible(false); }
};
