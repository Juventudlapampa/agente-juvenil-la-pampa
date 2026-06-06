/* =====================================================================
 * registro.js — Registro del Agente (D3, CONFIG.registro)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.registro. Colección estilo "Pokédex" que se
 * llena sola con el avance: vecinos conocidos, pueblos visitados, misiones
 * cumplidas, logros desbloqueados, con un % global. Meta-progresión visible.
 * NO toca el balance: sólo lee/registra estado.
 *
 * Lo conocido se guarda en estado.registro = { vecinos:{}, pueblos:{} }.
 * Misiones/logros se derivan del estado existente (no se duplican).
 * ===================================================================== */

window.AJ = window.AJ || {};

// Lista de TODOS los logros posibles (según flags activos): misiones + recetas + granja.
AJ.logrosTotales = function () {
  const C = AJ.CONFIG || {};
  const s = {};
  // Logros de misiones (siempre existen las que estén cargadas).
  (AJ.MISIONES || []).forEach((m) => { if (m.recompensa && m.recompensa.logro) s[m.recompensa.logro] = 1; });
  // Logros de crafteo y de granja sólo si esos sistemas están activos (si no, son
  // inalcanzables y no deben contar para el 100% del Registro).
  if (C.crafteo) (AJ.RECETAS || []).forEach((r) => { if (r.logro) s[r.logro] = 1; });
  if (C.granja) s['Primera cosecha'] = 1;
  return Object.keys(s);
};

// Cantidad de pueblos del mundo (según flags).
AJ.totalPueblos = function () {
  if (AJ.CONFIG && AJ.CONFIG.tercerPueblo) return 3;
  if (AJ.CONFIG && AJ.CONFIG.viaje) return 2;
  return 1;
};

AJ.Registro = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.registro || !this.estado.registro.vecinos) {
      this.estado.registro = { vecinos: {}, pueblos: {} };
    }
    this.abierto = false;
  }

  // --- Registrar avance ---
  registrarVecino(id) {
    if (!id) return;
    if (!this.estado.registro.vecinos[id]) {
      this.estado.registro.vecinos[id] = true;
      this._guardar();
    }
  }
  registrarPueblo(id) {
    if (id == null) return;
    if (!this.estado.registro.pueblos[id]) {
      this.estado.registro.pueblos[id] = true;
      this._guardar();
    }
  }

  // --- Cálculo de datos ---
  datos() {
    const roster = AJ.roster ? AJ.roster() : [];
    const totVec = roster.length;
    const conVec = roster.filter((n) => this.estado.registro.vecinos[n.id]).length;

    const totPue = AJ.totalPueblos();
    const visPue = Object.keys(this.estado.registro.pueblos || {}).length;

    const todasMis = AJ.MISIONES || [];
    const totMis = todasMis.length;
    const cumMis = todasMis.filter((m) => this.estado.misiones[m.id] === 'completada').length;

    const totLog = AJ.logrosTotales().length;
    const desLog = (this.estado.inventario && this.estado.inventario.logros) ? this.estado.inventario.logros.length : 0;

    const hechos = conVec + Math.min(visPue, totPue) + cumMis + Math.min(desLog, totLog);
    const total = totVec + totPue + totMis + totLog;
    const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;

    return {
      vecinos: { de: conVec, total: totVec },
      pueblos: { de: Math.min(visPue, totPue), total: totPue },
      misiones: { de: cumMis, total: totMis },
      logros: { de: Math.min(desLog, totLog), total: totLog },
      porcentaje: pct,
      roster,
    };
  }

  // --- Panel UI ---
  _construir() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    this.cont = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(13000).setVisible(false);
    this.fondo = this.scene.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0, 0).setInteractive();
    const pw = 460, ph = 400;
    const g = this.scene.add.graphics();
    g.fillStyle(0x1f2a14, 0.98); g.fillRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    g.lineStyle(3, 0xa8e063, 1); g.strokeRoundedRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14);
    this.titulo = this.scene.add.text(W / 2, (H - ph) / 2 + 16, 'REGISTRO DEL AGENTE', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#cde9a0', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.cuerpo = this.scene.add.text((W - pw) / 2 + 26, (H - ph) / 2 + 56, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#fff7e6', lineSpacing: 7,
    });
    this.btnVolver = this.scene.add.text(W / 2, (H + ph) / 2 - 28, '« Volver', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#cde9a0',
      backgroundColor: '#3a5a1f', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.btnVolver.on('pointerdown', () => {
      if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (e) {} }
      this.cerrar();
    });
    this.cont.add([this.fondo, g, this.titulo, this.cuerpo, this.btnVolver]);
  }

  _barra(de, total) {
    const n = total > 0 ? Math.round((de / total) * 12) : 0;
    return '[' + '█'.repeat(n) + '░'.repeat(12 - n) + ']';
  }

  _refrescar() {
    if (!this.cuerpo) return;
    const d = this.datos();
    const lineas = [
      'Avance global:  ' + d.porcentaje + '%   ' + this._barra(d.porcentaje, 100),
      '',
      'Vecinos conocidos    ' + d.vecinos.de + ' / ' + d.vecinos.total + '   ' + this._barra(d.vecinos.de, d.vecinos.total),
      'Pueblos visitados    ' + d.pueblos.de + ' / ' + d.pueblos.total + '   ' + this._barra(d.pueblos.de, d.pueblos.total),
      'Misiones cumplidas   ' + d.misiones.de + ' / ' + d.misiones.total + '   ' + this._barra(d.misiones.de, d.misiones.total),
      'Logros desbloqueados ' + d.logros.de + ' / ' + d.logros.total + '   ' + this._barra(d.logros.de, d.logros.total),
      '',
      'Logros:',
    ];
    const logros = (this.estado.inventario && this.estado.inventario.logros) || [];
    if (logros.length === 0) lineas.push('  (todavía ninguno — ¡a cumplir misiones!)');
    else logros.slice(0, 9).forEach((l) => lineas.push('  ★ ' + l));
    if (logros.length > 9) lineas.push('  ...y ' + (logros.length - 9) + ' más');
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

  _guardar() { try { AJ.Guardado.guardar(this.estado); } catch (e) {} }
};
