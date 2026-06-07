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
    this._viajando = false;
    // Cargar estado o crear uno nuevo.
    let est = null;
    if (!this.nuevo) { try { est = AJ.Guardado.cargar(); } catch (e) { est = null; } }
    // FASE D: asegurar el pueblo correcto ANTES de armar el estado nuevo
    // (así un juego nuevo toma el spawn del pueblo 1).
    if (AJ.CONFIG.viaje && AJ.Mapa.cargar) {
      const id = (est && est.mapaActual) ? est.mapaActual : 1;
      try { AJ.Mapa.cargar(id); } catch (e) { console.warn('[Pueblo] cargar mapa', e); }
    }
    this.estado = est || AJ.Guardado.estadoNuevo();
    if (this.estado.mapaActual == null) this.estado.mapaActual = 1;
    // Reconciliar: si el pueblo guardado no existe (p. ej. save en el 3er pueblo
    // con tercerPueblo apagado), cargar() cae al pueblo 1; el estado debe seguirlo
    // y reubicar al jugador en el spawn para no quedar fuera de mapa.
    if (AJ.CONFIG.viaje && AJ.Mapa.cargar && this.estado.mapaActual !== AJ.Mapa.actual) {
      this.estado.mapaActual = AJ.Mapa.actual;
      this.estado.jugador = { x: AJ.Mapa.SPAWN.x, y: AJ.Mapa.SPAWN.y, dir: 'abajo' };
    }
    // Registro de sistemas activos (para el smoke-test y el HUD).
    this.sistemas = {};
  }

  preload() {
    // F2: prepara el arte. Sin capaArte (o manifiesto vacío) es generación
    // procedural sincrónica, idéntica a siempre; con PNGs en /assets los carga
    // y rellena procedural el resto.
    try { (AJ.Art.preparar || AJ.Art.generarTodo)(this); }
    catch (e) { console.error('[Pueblo] Falló la preparación de arte:', e); }
  }

  create() {
    const T = AJ.CONFIG.TILE;
    const M = AJ.Mapa;

    // P1: la escena entra desde negro (no-op si juice está apagado).
    if (AJ.Juice) AJ.Juice.fadeIn(this);

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
    // FASE B: estaciones (deriva del día; modula paleta y crecimiento).
    this._iniciarSistema('estaciones', () => {
      if (AJ.Estaciones) { this.estaciones = new AJ.Estaciones(this, this.estado); this.estaciones.init(); }
    });
    // FASE C: mesa de crafteo + recetas.
    this._iniciarSistema('crafteo', () => {
      if (AJ.Crafteo) { this.crafteo = new AJ.Crafteo(this, this.estado); this.crafteo.init(); }
    });
    // MODO GESTIÓN (GDD): capa de datos/estado (G1). Aditivo; sin UI propia.
    this._iniciarSistema('modoGestion', () => {
      if (AJ.Gestion && AJ.Gestion.init) AJ.Gestion.init(this, this.estado);
    });

    // --- Diálogo (UI compartida por NPCs/misiones) ---
    if (AJ.CONFIG.npcsDialogo && AJ.Dialogo) {
      try { this.dialogo = new AJ.Dialogo(this); } catch (e) { console.warn('[Pueblo] diálogo off', e); }
    }

    // --- C2.3: brújula hacia la misión activa (gated por flag) ---
    if (AJ.CONFIG.brujula && AJ.Brujula) {
      try { this.brujula = new AJ.Brujula(this); } catch (e) { console.warn('[Pueblo] brújula off', e); this.brujula = null; }
    }

    // --- D3: Registro del Agente (gated por flag) ---
    if (AJ.CONFIG.registro && AJ.Registro) {
      try {
        this.registro = new AJ.Registro(this, this.estado);
        this.registro.registrarPueblo(this.estado.mapaActual || 1); // visitaste este pueblo
      } catch (e) { console.warn('[Pueblo] registro off', e); this.registro = null; }
    }

    // --- E1: pantalla de progreso/estadísticas (gated por flag) ---
    if (AJ.CONFIG.progreso && AJ.Progreso) {
      try { this.progreso = new AJ.Progreso(this, this.estado); }
      catch (e) { console.warn('[Pueblo] progreso off', e); this.progreso = null; }
    }

    // --- C2.2: menú de pausa/opciones (gated por flag) ---
    if (AJ.CONFIG.menu && AJ.Menu) {
      try {
        this.menu = new AJ.Menu(this);
        this.input.keyboard.on('keydown-P', () => this.menu.alternar());
        const btn = document.getElementById('btn-menu');
        if (btn) {
          btn.style.display = 'flex';
          this._onBtnMenu = (e) => { e.preventDefault(); this.menu.alternar(); };
          btn.addEventListener('click', this._onBtnMenu);
        }
      } catch (e) { console.warn('[Pueblo] menú off', e); this.menu = null; }
    }

    // --- Modo Gestión: tecla G. Con el ciclo de 30 días (G5) activo, G abre el
    //     "menú del día" (hub que reparte onboarding/dilemas/actividades). Sin el
    //     ciclo, G/H son las entradas sueltas de G2/G3 (compatibilidad). ---
    const _gestionBloqueada = () =>
      (this.dialogo && this.dialogo.abierto) || (this.menu && this.menu.abierto) ||
      (AJ.Gestion && AJ.Gestion.modalAbierta && AJ.Gestion.modalAbierta());
    if (AJ.CONFIG.modoGestion && AJ.CONFIG.cicloGestion && AJ.Gestion && AJ.Gestion.CicloUI) {
      // Arranque encadenado (capa narrativa-temporal): origen (N1) → Mesa intro (N2)
      //  → menú del día (G5). Cada paso sólo aparece la primera vez; después G va directo.
      const abrirMenuDia = () => {
        try { AJ.Gestion.CicloUI.abrir(this, this.estado); }
        catch (e) { console.warn('[Pueblo] ciclo off', e); }
      };
      const trasOrigen = () => {
        if (AJ.Gestion.Mesa && AJ.Gestion.Mesa.pendiente && AJ.Gestion.Mesa.pendiente(this.estado) &&
            AJ.Gestion.MesaUI) {
          AJ.Gestion.MesaUI.abrirIntro(this, this.estado, () => { try { this.guardar(); } catch (e) {} abrirMenuDia(); });
          return;
        }
        abrirMenuDia();
      };
      const abrirCiclo = () => {
        if (_gestionBloqueada()) return;
        try {
          if (AJ.Gestion.Origen && AJ.Gestion.Origen.pendiente && AJ.Gestion.Origen.pendiente(this.estado) &&
              AJ.Gestion.OrigenUI) {
            AJ.Gestion.OrigenUI.abrir(this, this.estado, () => { try { this.guardar(); } catch (e) {} trasOrigen(); });
            return;
          }
          trasOrigen();
        } catch (e) { console.warn('[Pueblo] ciclo off', e); }
      };
      this.input.keyboard.on('keydown-G', abrirCiclo);
      // GP2: botón DOM visible (también en celular) para entrar al Modo Gestión.
      const bg = document.getElementById('btn-gestion');
      if (bg) {
        bg.style.display = 'block';
        this._onBtnGestion = (e) => { e.preventDefault(); abrirCiclo(); };
        bg.addEventListener('click', this._onBtnGestion);
      }
    } else {
      if (AJ.CONFIG.modoGestion && AJ.CONFIG.onboarding && AJ.Gestion && AJ.Gestion.OnboardingUI) {
        this.input.keyboard.on('keydown-G', () => {
          if (_gestionBloqueada()) return;
          try { AJ.Gestion.OnboardingUI.abrir(this, this.estado); }
          catch (e) { console.warn('[Pueblo] onboarding off', e); }
        });
      }
      if (AJ.CONFIG.modoGestion && AJ.CONFIG.dilemas && AJ.Gestion && AJ.Gestion.DilemasUI) {
        this.input.keyboard.on('keydown-H', () => {
          if (_gestionBloqueada()) return;
          try {
            const lista = AJ.Gestion.Dilemas.elegibles(this.estado);
            if (lista.length) AJ.Gestion.DilemasUI.abrir(this, this.estado, lista[0], () => this.guardar());
          } catch (e) { console.warn('[Pueblo] dilemas off', e); }
        });
      }
    }

    // --- Guardado automático periódico + al cerrar la pestaña ---
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.guardar() });
    this._onUnload = () => this.guardar();
    window.addEventListener('beforeunload', this._onUnload);

    // --- Tecla ESC: cierra el menú de crafteo si está abierto; si no, vuelve
    //     al título (guardando). ---
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.menu && this.menu.abierto) { this.menu.cerrar(); return; }
      if (this.crafteo && this.crafteo.menuAbierto) { this.crafteo.cerrarMenu(); return; }
      // Modo Gestión: los modales son overlays DOM; cerralos antes de salir o
      // quedan flotando sobre el Título (rompen la pantalla). Cerrar y NO salir.
      if (AJ.Gestion && AJ.Gestion.modalAbierta && AJ.Gestion.modalAbierta()) {
        this._cerrarModalesGestion();
        return;
      }
      this.guardar();
      if (AJ.Juice) AJ.Juice.irA(this, 'Titulo');
      else this.scene.start('Titulo');
    });

    // Smoke-test (modo dev): correr al final del create.
    if (AJ.CONFIG.dev && AJ.SmokeTest) {
      this.time.delayedCall(50, () => { try { AJ.SmokeTest.correr(this); } catch (e) { console.error(e); } });
    }
  }

  // Colisión extra que consulta el jugador (NPCs y la mesa de crafteo).
  esColisionExtra(tx, ty) {
    if (this.npcManager && this.npcManager.ocupa(tx, ty)) return true;
    if (this.crafteo && this.crafteo.ocupa && this.crafteo.ocupa(tx, ty)) return true;
    return false;
  }

  // Cierra cualquier overlay DOM del Modo Gestión (idempotente: no-op si no hay).
  _cerrarModalesGestion() {
    try {
      if (AJ.Gestion) {
        if (AJ.Gestion.CicloUI && AJ.Gestion.CicloUI.cerrar) AJ.Gestion.CicloUI.cerrar();
        if (AJ.Gestion.OnboardingUI && AJ.Gestion.OnboardingUI.cerrar) AJ.Gestion.OnboardingUI.cerrar();
        if (AJ.Gestion.DilemasUI && AJ.Gestion.DilemasUI.cerrar) AJ.Gestion.DilemasUI.cerrar();
        if (AJ.Gestion.OrigenUI && AJ.Gestion.OrigenUI.cerrar) AJ.Gestion.OrigenUI.cerrar();
        if (AJ.Gestion.MesaUI && AJ.Gestion.MesaUI.cerrar) AJ.Gestion.MesaUI.cerrar();
      }
    } catch (e) {}
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
        // Textura 16-nativa mostrada a T×T (32 px) en pantalla → ×2 nearest-neighbor.
        // setDisplaySize es robusto: cualquier tamaño de PNG real cae igual a T×T.
        const img = this.add.image(x * T + T / 2, y * T + T / 2, clave).setDisplaySize(T, T);
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
      if (AJ.Stats) { try { AJ.Stats.flush(); } catch (e) {} } // F4: persistir stats junto al autoguardado
    } catch (e) { console.warn('[Pueblo] no se pudo guardar', e); }
  }

  update(time, delta) {
    const dt = delta / 1000;
    // C2.2: con el menú de pausa abierto, se congela TODO (pausa real).
    const menuAbierto = !!(this.menu && this.menu.abierto);
    // E1: contar tiempo jugado (segundos reales), salvo en pausa.
    if (!menuAbierto) this.estado.tiempoJugado = (this.estado.tiempoJugado || 0) + dt;
    // F4: estadísticas de sesión (tiempo total acumulado entre partidas).
    if (!menuAbierto && AJ.Stats) { try { AJ.Stats.sumarTiempo(dt); } catch (e) {} }
    // ¿Hay un diálogo, el menú de crafteo, la pausa o un modal de gestión
    //  abiertos? -> sin movimiento.
    const gestionAbierta = !!(AJ.Gestion && AJ.Gestion.modalAbierta && AJ.Gestion.modalAbierta());
    const dialogoAbierto = (this.dialogo && this.dialogo.abierto) ||
                           (this.crafteo && this.crafteo.menuAbierto) || menuAbierto || gestionAbierta;

    if (!dialogoAbierto) {
      try { this.jugador.update(dt, AJ.Input.estado); }
      catch (e) { console.warn('[Pueblo] update jugador', e); }
      // F4: contar un "paso" cada vez que el jugador entra a un tile nuevo.
      if (AJ.Stats) {
        try {
          const tp = this.jugador.tilePos();
          if (!this._statTile) this._statTile = tp.x + ',' + tp.y;
          else if (this._statTile !== tp.x + ',' + tp.y) { this._statTile = tp.x + ',' + tp.y; AJ.Stats.sumarPaso(); }
        } catch (e) {}
      }
      // P2: pasos (con throttle) mientras camina.
      if (AJ.Sonido && this.jugador.moviendo) {
        this._tPaso = (this._tPaso || 0) + dt;
        if (this._tPaso >= 0.28) { this._tPaso = 0; try { AJ.Sonido.paso(); } catch (e) {} }
      } else { this._tPaso = 0.28; }
      // FASE D: ¿el jugador pisó una salida? -> viajar de pueblo.
      if (AJ.CONFIG.viaje && !this._viajando) {
        try {
          const p = this.jugador.tilePos();
          const sal = AJ.Mapa.salidaEn ? AJ.Mapa.salidaEn(p.x, p.y) : null;
          if (sal) this._viajar(sal);
        } catch (e) { console.warn('[Pueblo] viaje', e); }
      }
    }

    // Acción (espacio/E/botón). En pausa no interactúa.
    if (!menuAbierto && AJ.Input.tomarAccion()) {
      try { this._interactuar(); } catch (e) { console.warn('[Pueblo] interacción', e); }
    }

    // Sistemas con tick — congelados durante la pausa (no pasa el tiempo).
    if (!menuAbierto) {
      if (this.diaNoche) { try { this.diaNoche.update(dt); } catch (e) {} }
      if (this.granja) { try { this.granja.update(dt); } catch (e) {} }
      if (this.npcManager) { try { this.npcManager.update(dt); } catch (e) {} }
      if (this.rutinas) { try { this.rutinas.update(dt); } catch (e) {} }
      if (this.estaciones) { try { this.estaciones.update(dt); } catch (e) {} }
      if (this.brujula) { try { this.brujula.update(dt); } catch (e) {} }
    }
  }

  _interactuar() {
    // Si hay diálogo abierto, avanzarlo.
    if (this.dialogo && this.dialogo.abierto) { this.dialogo.avanzar(); return; }
    // Si el menú de crafteo está abierto, la acción lo cierra.
    if (this.crafteo && this.crafteo.menuAbierto) { this.crafteo.cerrarMenu(); return; }
    // Buscar NPC al frente.
    const frente = this.jugador.tileFrente();
    if (this.npcManager) {
      const npc = this.npcManager.enTile(frente.x, frente.y);
      if (npc) { this._hablarCon(npc); return; }
    }
    // Si hay granja, intentar interactuar con la parcela.
    if (this.granja && this.granja.intentarInteractuar(frente.x, frente.y)) return;
    // Mesa de crafteo / juntar leña de caldenes.
    if (this.crafteo && this.crafteo.intentarInteractuar(frente.x, frente.y)) return;
  }

  // FASE D: viaja al pueblo destino, llegando al punto indicado.
  _viajar(sal) {
    this._viajando = true;
    try {
      this.estado.mapaActual = sal.destino;
      this.estado.jugador = { x: sal.llegada.x, y: sal.llegada.y, dir: 'abajo' };
      AJ.Guardado.guardar(this.estado);
    } catch (e) { console.warn('[Pueblo] guardar viaje', e); }
    // Reiniciar la escena cargando el estado recién guardado (NO un juego
    // nuevo): init recargará el mapa destino y la posición de llegada.
    if (AJ.Sonido) { try { AJ.Sonido.viaje(); } catch (e) {} }
    if (AJ.Juice) AJ.Juice.reiniciar(this, { nuevo: false });
    else this.scene.restart({ nuevo: false });
  }

  _hablarCon(npc) {
    // P1: feedback visual: el NPC pega un saltito al hablarle.
    if (AJ.Juice && npc && npc.sprite) AJ.Juice.pulso(this, npc.sprite);
    // D3: conociste a este vecino (queda en el Registro).
    if (this.registro && npc) { try { this.registro.registrarVecino(npc.id); } catch (e) {} }
    // F4: NPCs conocidos (distintos) en las estadísticas acumuladas.
    if (AJ.Stats && npc) { try { AJ.Stats.registrarNpc(npc.id); } catch (e) {} }
    // FASE A: hablar sube la afinidad (una vez por día por NPC).
    if (this.afinidad) { try { this.afinidad.alHablar(npc); } catch (e) {} }
    if (this.misiones) { this.misiones.alHablar(npc, this.dialogo); }
    else if (this.dialogo) { this.dialogo.mostrar(npc.nombre, npc.saludo || ['Buenas.']); }
  }

  shutdown() {
    if (this._onUnload) window.removeEventListener('beforeunload', this._onUnload);
    // C2.2: limpiar el listener del botón de menú (DOM persiste entre escenas).
    if (this._onBtnMenu) {
      const btn = document.getElementById('btn-menu');
      if (btn) btn.removeEventListener('click', this._onBtnMenu);
      this._onBtnMenu = null;
    }
    // GP2: limpiar el listener del botón de Modo Gestión (DOM persiste entre escenas).
    if (this._onBtnGestion) {
      const bg = document.getElementById('btn-gestion');
      if (bg) { bg.removeEventListener('click', this._onBtnGestion); bg.style.display = 'none'; }
      this._onBtnGestion = null;
    }
    // Red de seguridad: si la escena se reinicia (p. ej. viaje) con un modal de
    // gestión abierto, cerrarlo para no dejar overlays DOM huérfanos.
    this._cerrarModalesGestion();
  }
};
