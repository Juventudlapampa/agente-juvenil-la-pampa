/* =====================================================================
 * Interior.js — Escena de INTERIOR de edificio (O2, CONFIG.mundoInteractivo)
 * ---------------------------------------------------------------------
 * Renderiza una sala (plantilla de AJ.Interiores), pone al jugador adentro,
 * maneja colisión propia (this.esColisionMapa → matriz del interior, no el
 * pueblo), NPCs y objetos interactivos, y la SALIDA (felpudo → vuelve al
 * pueblo en la puerta correcta). Guarda en qué interior está el jugador
 * (estado.interior) para que recargar lo devuelva adentro.
 *
 * BOLT-ON: sólo se entra acá si CONFIG.mundoInteractivo. El RPG del pueblo
 * no se toca; reusa AJ.Jugador, AJ.NPC y AJ.Dialogo.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.EscenaInterior = class extends Phaser.Scene {
  constructor() { super('Interior'); }

  init(data) {
    this._data = data || {};
    this._saliendo = false;
    // Estado: cargar el save (siempre debería existir; entramos guardando antes).
    let est = null;
    try { est = AJ.Guardado.cargar(); } catch (e) { est = null; }
    this.estado = est || AJ.Guardado.estadoNuevo();
    // Edificio/pueblo: del data (entrada nueva) o del estado.interior (recarga).
    const inf = this._data.edificio ? this._data : (this.estado.interior || {});
    this._edificio = inf.edificio || 'casa';
    this._pueblo = inf.pueblo || this.estado.mapaActual || 1;
    // Construir la sala.
    this.sala = AJ.Interiores.construir(this._edificio, this._pueblo);
  }

  preload() {
    try { (AJ.Art.preparar || AJ.Art.generarTodo)(this); } catch (e) { console.warn('[Interior] arte base', e); }
    try { AJ.Interiores.generarArte(this); } catch (e) { console.warn('[Interior] arte interior', e); }
  }

  create() {
    const T = AJ.CONFIG.TILE;
    const s = this.sala;
    this.cameras.main.setBackgroundColor('#1c1812');
    if (AJ.Juice) AJ.Juice.fadeIn(this, 240);

    // Ocultar botones DOM del pueblo mientras estás adentro.
    this._botonesPueblo(false);

    // Render de la sala.
    this._dibujar();

    // Jugador: posición restaurada (recarga) o entrada de la sala.
    let px = s.entrada.x, py = s.entrada.y, pdir = 'arriba';
    const guardadoAcaMismo = this.estado.interior && this.estado.interior.edificio === this._edificio &&
      typeof this.estado.interior.x === 'number';
    if (this._data.restaurar && guardadoAcaMismo) {
      px = this.estado.interior.x; py = this.estado.interior.y; pdir = this.estado.interior.dir || 'arriba';
    }
    this.jugador = new AJ.Jugador(this, px, py, pdir);

    // Cámara: la sala es chica → centrarla (sin scroll).
    this.cameras.main.setBounds(0, 0, s.ancho * T, s.alto * T);
    this.cameras.main.centerOn(s.ancho * T / 2, s.alto * T / 2);
    this.cameras.main.setRoundPixels(true);

    // NPCs del interior.
    this._crearNPCs();

    // Diálogo.
    try { this.dialogo = new AJ.Dialogo(this); } catch (e) { this.dialogo = null; }

    // HUD.
    this.hud = this.add.text(10, 10, s.nombre + '   (E: hablar/mirar · puerta o ESC: salir)', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fff',
      backgroundColor: '#000a', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(9000);

    // Marcar/guardar que el jugador está en este interior.
    this._guardar();

    // ESC sale al pueblo (si no hay diálogo abierto).
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.dialogo && this.dialogo.abierto) { this.dialogo.cerrar(); return; }
      this._salir();
    });

    // Guardado periódico + al cerrar la pestaña.
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this._guardar() });
    this._onUnload = () => this._guardar();
    window.addEventListener('beforeunload', this._onUnload);

    this.events.once('shutdown', () => this._limpiar());
  }

  _dibujar() {
    const T = AJ.CONFIG.TILE, s = this.sala;
    for (let y = 0; y < s.alto; y++) {
      for (let x = 0; x < s.ancho; x++) {
        const clave = s.tex[y][x];
        if (!this.textures.exists(clave)) continue;
        const img = this.add.image(x * T + T / 2, y * T + T / 2, clave).setDisplaySize(T, T);
        img.setDepth(s.suelo.has(clave) ? -1000 : (y * T + T));
      }
    }
  }

  _crearNPCs() {
    this.npcsInt = [];
    this.porTile = {};
    (this.sala.npcs || []).forEach((d) => {
      try {
        if (!this.textures.exists(d.tex + '_abajo_0')) return;
        const npc = new AJ.NPC(this, { id: d.id, nombre: d.nombre, tex: d.tex, tx: d.x, ty: d.y, dir: d.dir, saludo: d.saludo });
        this.npcsInt.push(npc);
        this.porTile[d.x + ',' + d.y] = npc;
      } catch (e) { console.warn('[Interior] npc', d.id, e); }
    });
  }

  // Colisión del interior (la consulta AJ.Jugador vía this.esColisionMapa).
  esColisionMapa(tx, ty) {
    const s = this.sala;
    if (tx < 0 || ty < 0 || tx >= s.ancho || ty >= s.alto) return true;
    return s.col[ty][tx] === true;
  }
  esColisionExtra(tx, ty) { return !!this.porTile[tx + ',' + ty]; }

  update(time, delta) {
    const dt = delta / 1000;
    const dialogoAbierto = !!(this.dialogo && this.dialogo.abierto);
    if (!dialogoAbierto) {
      try { this.jugador.update(dt, AJ.Input.estado); } catch (e) {}
      if (AJ.Sonido && this.jugador.moviendo) {
        this._tPaso = (this._tPaso || 0) + dt;
        if (this._tPaso >= 0.28) { this._tPaso = 0; try { AJ.Sonido.paso(); } catch (e) {} }
      }
      // ¿Pisó la salida? → volver al pueblo.
      if (!this._saliendo) {
        const p = this.jugador.tilePos();
        if (p.x === this.sala.salida.x && p.y === this.sala.salida.y) { this._salir(); return; }
      }
    }
    if (AJ.Input.tomarAccion && AJ.Input.tomarAccion()) {
      try { this._interactuar(); } catch (e) {}
    }
  }

  _interactuar() {
    if (this.dialogo && this.dialogo.abierto) { this.dialogo.avanzar(); return; }
    const f = this.jugador.tileFrente();
    // NPC al frente.
    const npc = this.porTile[f.x + ',' + f.y];
    if (npc) {
      if (npc.mirarHacia) { const p = this.jugador.tilePos(); npc.mirarHacia(p.x, p.y); }
      if (AJ.Juice && npc.sprite) AJ.Juice.pulso(this, npc.sprite);
      if (AJ.Stats && npc.id) { try { AJ.Stats.registrarNpc(npc.id); } catch (e) {} }
      if (this.dialogo) this.dialogo.mostrar(npc.nombre, npc.saludo || ['Buenas.']);
      return;
    }
    // Objeto interactivo al frente.
    const obj = this.sala.objetos[f.x + ',' + f.y];
    if (obj && this.dialogo) { this.dialogo.mostrar(obj.nombre, [obj.texto]); return; }
  }

  _guardar() {
    try {
      const p = this.jugador ? this.jugador.tilePos() : this.sala.entrada;
      this.estado.interior = {
        edificio: this._edificio, pueblo: this._pueblo,
        x: p.x, y: p.y, dir: this.jugador ? this.jugador.dir : 'arriba',
      };
      AJ.Guardado.guardar(this.estado);
      if (AJ.Stats) { try { AJ.Stats.flush(); } catch (e) {} }
    } catch (e) { console.warn('[Interior] guardar', e); }
  }

  // Vuelve al pueblo: limpia estado.interior y arranca Pueblo (carga el save).
  _salir() {
    if (this._saliendo) return;
    this._saliendo = true;
    try {
      this.estado.interior = null;
      AJ.Guardado.guardar(this.estado);
    } catch (e) {}
    if (AJ.Sonido) { try { AJ.Sonido.viaje(); } catch (e) {} }
    if (AJ.Juice) AJ.Juice.irA(this, 'Pueblo', { nuevo: false });
    else this.scene.start('Pueblo', { nuevo: false });
  }

  _botonesPueblo(mostrar) {
    ['btn-menu', 'btn-gestion'].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.style.display = mostrar ? (id === 'btn-gestion' ? 'block' : 'flex') : 'none';
    });
  }

  _limpiar() {
    if (this._onUnload) { window.removeEventListener('beforeunload', this._onUnload); this._onUnload = null; }
  }
};
