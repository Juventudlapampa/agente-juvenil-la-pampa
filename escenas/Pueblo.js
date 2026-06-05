/* =====================================================================
 * Pueblo.js — Escena principal de juego
 * ---------------------------------------------------------------------
 * Renderiza el pueblo desde la matriz del mapa, crea al jugador, sigue la
 * cámara, guarda el estado y arranca (con flags + try/catch) los sistemas
 * opcionales de fases posteriores. Si un sistema falla, se apaga y el
 * juego sigue: NUNCA crashea entero.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.EscenaPueblo = class extends Phaser.Scene {
  constructor() { super('Pueblo'); }

  init(data) {
    this.nuevo = data && data.nuevo;
    // Cargar estado o crear uno nuevo.
    let est = null;
    if (!this.nuevo) { try { est = AJ.Guardado.cargar(); } catch (e) { est = null; } }
    this.estado = est || AJ.Guardado.estadoNuevo();
    // Registro de sistemas activos (para el smoke-test y el HUD).
    this.sistemas = {};
  }

  preload() {
    // Generar TODO el arte por código (cero descargas).
    try { AJ.Art.generarTodo(this); }
    catch (e) { console.error('[Pueblo] Falló la generación de arte:', e); }
  }

  create() {
    const T = AJ.CONFIG.TILE;
    const M = AJ.Mapa;

    // --- Render del mapa ---
    this._dibujarMapa();

    // --- Jugador ---
    const j = this.estado.jugador;
    this.jugador = new AJ.Jugador(this, j.x, j.y, j.dir);

    // --- Cámara ---
    this.cameras.main.setBounds(0, 0, M.ANCHO * T, M.ALTO * T);
    this.cameras.main.startFollow(this.jugador.sprite, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    // --- HUD básico (siempre): cartelito de ubicación / ayuda ---
    this._crearHUD();

    // --- Sistemas opcionales (gated por flags, con try/catch) ---
    this._iniciarSistema('npcsDialogo', () => {
      if (AJ.NPCManager) { this.npcManager = new AJ.NPCManager(this); this.npcManager.crearTodos(); }
    });
    this._iniciarSistema('misiones', () => {
      if (AJ.Misiones) { this.misiones = new AJ.Misiones(this, this.estado); this.misiones.init(); }
    });
    this._iniciarSistema('diaNoche', () => {
      if (AJ.DiaNoche) { this.diaNoche = new AJ.DiaNoche(this, this.estado); this.diaNoche.init(); }
    });
    this._iniciarSistema('granja', () => {
      if (AJ.Granja) { this.granja = new AJ.Granja(this, this.estado); this.granja.init(); }
    });
    // FASE A: rutinas de NPCs + afinidad (necesita npcManager ya creado).
    this._iniciarSistema('rutinas', () => {
      if (AJ.Rutinas && this.npcManager) { this.rutinas = new AJ.Rutinas(this, this.estado); this.rutinas.init(); }
      if (AJ.Afinidad && this.npcManager) { this.afinidad = new AJ.Afinidad(this, this.estado); this.afinidad.init(); }
    });

    // --- Diálogo (UI compartida por NPCs/misiones) ---
    if (AJ.CONFIG.npcsDialogo && AJ.Dialogo) {
      try { this.dialogo = new AJ.Dialogo(this); } catch (e) { console.warn('[Pueblo] diálogo off', e); }
    }

    // --- Guardado automático periódico + al cerrar la pestaña ---
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.guardar() });
    this._onUnload = () => this.guardar();
    window.addEventListener('beforeunload', this._onUnload);

    // --- Tecla ESC para volver al título (guardando) ---
    this.input.keyboard.on('keydown-ESC', () => {
      this.guardar();
      this.scene.start('Titulo');
    });

    // Smoke-test (modo dev): correr al final del create.
    if (AJ.CONFIG.dev && AJ.SmokeTest) {
      this.time.delayedCall(50, () => { try { AJ.SmokeTest.correr(this); } catch (e) { console.error(e); } });
    }
  }

  // Colisión extra que consulta el jugador (NPCs ocupan su tile).
  esColisionExtra(tx, ty) {
    return this.npcManager ? this.npcManager.ocupa(tx, ty) : false;
  }

  // Arranca un sistema sólo si su flag está en true; si falla, lo apaga.
  _iniciarSistema(nombre, fn) {
    if (!AJ.CONFIG[nombre]) { this.sistemas[nombre] = false; return; }
    try {
      fn();
      this.sistemas[nombre] = true;
    } catch (e) {
      console.error('[Pueblo] Sistema "' + nombre + '" falló al iniciar; lo apago.', e);
      this.sistemas[nombre] = false;
    }
  }

  _dibujarMapa() {
    const T = AJ.CONFIG.TILE, M = AJ.Mapa;
    // Texturas que son "suelo" (siempre de fondo).
    const suelo = new Set(['pasto', 'tierra', 'vereda', 'plaza', 'agua', 'junco', 'arado']);
    this.tilesObjeto = []; // imágenes que ordenan por profundidad (árboles, edificios)
    for (let y = 0; y < M.ALTO; y++) {
      for (let x = 0; x < M.ANCHO; x++) {
        const clave = M.tex[y][x];
        if (!this.textures.exists(clave)) continue;
        const img = this.add.image(x * T + T / 2, y * T + T / 2, clave);
        if (suelo.has(clave)) {
          img.setDepth(-1000);
        } else {
          // Objetos altos: ordenan por su base para ocluir al jugador.
          img.setDepth(y * T + T);
        }
      }
    }
    // Carteles de landmarks (texto chico flotante).
    (M.meta.carteles || []).forEach((c) => {
      const t = this.add.text(c.x * T + T / 2, c.y * T - 4, c.texto, {
        fontFamily: 'monospace', fontSize: '11px', color: '#fff',
        backgroundColor: '#000a', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(5000);
      t.setAlpha(0.85);
    });
  }

  _crearHUD() {
    this.hud = this.add.text(10, 10, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fff',
      backgroundColor: '#000a', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(9000);
    this._actualizarHUD();
  }

  _actualizarHUD() {
    if (!this.hud) return;
    let txt = 'Agente Juvenil – La Pampa';
    if (this.estado.inventario) txt += '   ¢ ' + (this.estado.inventario.monedas || 0);
    this.hud.setText(txt);
  }

  // Sincroniza el estado del jugador y guarda en localStorage.
  guardar() {
    try {
      const p = this.jugador.tilePos();
      this.estado.jugador.x = p.x;
      this.estado.jugador.y = p.y;
      this.estado.jugador.dir = this.jugador.dir;
      AJ.Guardado.guardar(this.estado);
    } catch (e) { console.warn('[Pueblo] no se pudo guardar', e); }
  }

  update(time, delta) {
    const dt = delta / 1000;
    // ¿Hay un diálogo abierto? Si sí, el movimiento se congela.
    const dialogoAbierto = this.dialogo && this.dialogo.abierto;

    if (!dialogoAbierto) {
      try { this.jugador.update(dt, AJ.Input.estado); }
      catch (e) { console.warn('[Pueblo] update jugador', e); }
    }

    // Acción (espacio/E/botón)
    if (AJ.Input.tomarAccion()) {
      try { this._interactuar(); } catch (e) { console.warn('[Pueblo] interacción', e); }
    }

    // Sistemas con tick
    if (this.diaNoche) { try { this.diaNoche.update(dt); } catch (e) {} }
    if (this.granja) { try { this.granja.update(dt); } catch (e) {} }
    if (this.npcManager) { try { this.npcManager.update(dt); } catch (e) {} }
    if (this.rutinas) { try { this.rutinas.update(dt); } catch (e) {} }
  }

  _interactuar() {
    // Si hay diálogo abierto, avanzarlo.
    if (this.dialogo && this.dialogo.abierto) { this.dialogo.avanzar(); return; }
    // Buscar NPC al frente.
    const frente = this.jugador.tileFrente();
    if (this.npcManager) {
      const npc = this.npcManager.enTile(frente.x, frente.y);
      if (npc) { this._hablarCon(npc); return; }
    }
    // Si hay granja, intentar interactuar con la parcela.
    if (this.granja && this.granja.intentarInteractuar(frente.x, frente.y)) return;
  }

  _hablarCon(npc) {
    // FASE A: hablar sube la afinidad (una vez por día por NPC).
    if (this.afinidad) { try { this.afinidad.alHablar(npc); } catch (e) {} }
    if (this.misiones) { this.misiones.alHablar(npc, this.dialogo); }
    else if (this.dialogo) { this.dialogo.mostrar(npc.nombre, npc.saludo || ['Buenas.']); }
  }

  shutdown() {
    if (this._onUnload) window.removeEventListener('beforeunload', this._onUnload);
  }
};
