/* =====================================================================
 * Apertura.js — APERTURA CINEMATOGRÁFICA (O1, CONFIG.aperturaCine)
 * ---------------------------------------------------------------------
 * Reemplaza el arranque por una secuencia guionada:
 *   1.1 Viaje en colectivo por una ruta pampeana (parallax procedural).
 *   1.2 Bajada + fundido a negro → Mesa.
 *   1.3 La Mesa de Agentes: mesa con varios agentes; diálogo de bienvenida.
 *   1.4 Enfoque en vos → CREADOR de avatar (nombre/pronombre/variante + localidad).
 *   1.5 Vida previa estilo Mount & Blade (AJ.VidaPreviaUI) → reparte medidores.
 *   1.6 Charla de cierre (tutorial/herramientas) → fundido → tu localidad (Pueblo).
 *
 * SALTEABLE en cualquier momento (tecla/tap/botón "Saltear"): finaliza con lo
 * elegido hasta ahí (o defaults) y arranca el juego con un perfil válido.
 *
 * BOLT-ON: si el flag está off, el Título arranca el Pueblo como siempre. Si
 * algo de gestión falta, la apertura igual desemboca en el juego (perfil neutro).
 * Arte 100% procedural (lo pampeano: colectivo/ruta/caldenes) — ver AUDITORIA_ARTE.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.EscenaApertura = class extends Phaser.Scene {
  constructor() { super('Apertura'); }

  preload() {
    // Sprites/NPCs del juego (idempotente y seguro) para la Mesa.
    try { (AJ.Art.preparar || AJ.Art.generarTodo)(this); }
    catch (e) { console.warn('[Apertura] arte base', e); }
    try { this._generarArteApertura(); } catch (e) { console.warn('[Apertura] arte apertura', e); }
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this._W = W; this._H = H;
    this.cameras.main.setBackgroundColor('#2d2a26');
    if (AJ.Juice) AJ.Juice.fadeIn(this, 400);

    // Estado de partida nueva (los medidores se reparten en la vida previa).
    this._estado = AJ.Guardado.estadoNuevo();
    this._sel = null;          // selección de vida previa
    this._creado = false;      // ya pasó por el creador
    this._terminando = false;  // evita doble finalización

    // Botón "Saltear intro" (DOM, siempre visible arriba a la derecha).
    this._botonSaltear();

    // Arranca el viaje en colectivo.
    this._faseColectivo();

    // Limpieza si la escena se va.
    this.events.once('shutdown', () => this._limpiar());
  }

  /* =================== 1.1 — VIAJE EN COLECTIVO ===================== */
  _faseColectivo() {
    const W = this._W, H = this._H;
    this._fase = 'colectivo';
    this._capas = [];
    const hY = Math.round(H * 0.52); // horizonte

    // Cielo (degradé pampeano por bandas).
    const cielo = this.add.graphics().setDepth(0);
    cielo.fillStyle(0xbfd9ee, 1); cielo.fillRect(0, 0, W, hY);
    cielo.fillStyle(0x9fc6e8, 1); cielo.fillRect(0, Math.round(H * 0.22), W, hY - Math.round(H * 0.22));
    cielo.fillStyle(0xfff3c4, 1); cielo.fillCircle(W - 110, 96, 46); // sol
    // Suelo (campo).
    const suelo = this.add.graphics().setDepth(1);
    suelo.fillStyle(0x7ba349, 1); suelo.fillRect(0, hY, W, H - hY);
    suelo.fillStyle(0x6b9540, 1);
    for (let y = hY + 18; y < H; y += 26) suelo.fillRect(0, y, W, 10);
    this._capasFijas = [cielo, suelo];

    // Capas parallax (tileSprites): caldenes lejanos, caldenes cercanos, postes, ruta.
    const mk = (key, x, y, w, h, depth, speed) => {
      if (!this.textures.exists(key)) return null;
      const ts = this.add.tileSprite(x, y, w, h, key).setOrigin(0, 0).setDepth(depth);
      ts._spd = speed; this._capas.push(ts); return ts;
    };
    mk('ap_calden', 0, hY - 56, W, 64, 2, 30);                 // lejanos (lento)
    mk('ap_calden', 0, hY - 30, W, 64, 3, 70);                 // cercanos (medio)
    mk('ap_poste', 0, hY + Math.round(H * 0.06), W, 48, 4, 150); // postes (rápido)
    mk('ap_ruta', 0, H - 40, W, 40, 5, 220);                   // ruta (más rápido)

    // Interior del colectivo: marco/ventana + asiento + el agente sentado.
    this._busFrame();

    // Textos de la escena.
    this._cap = this.add.text(W / 2, 28, 'Camino a la Mesa Provincial', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#fff7e6',
      fontStyle: 'bold', stroke: '#2a1f12', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(60);
    this._sub = this.add.text(W / 2, H - 22,
      'La ruta es larga y derecha…  (Espacio / tap para seguir)', {
        fontFamily: 'monospace', fontSize: '13px', color: '#fff7e6',
        backgroundColor: '#000a', padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(60);

    // Tap en el canvas avanza (mouse desktop). El botón Saltear es DOM (no choca).
    this.input.on('pointerdown', this._onTap, this);
    // Auto-avance tras unos segundos.
    this._tColectivo = 0;
  }

  _busFrame() {
    const W = this._W, H = this._H;
    const g = this.add.graphics().setDepth(50);
    this._busFrameGfx = g; // guardarlo para poder destruirlo al pasar a la Mesa
    const marco = 0x3a3026, marcoB = 0x2a2018, asiento = 0x5b4636;
    const b = 26; // grosor del marco
    g.fillStyle(marco, 1);
    g.fillRect(0, 0, W, b); g.fillRect(0, 0, b, H);
    g.fillRect(W - b, 0, b, H); g.fillRect(0, H - b, W, b);
    // Montante central de la ventanilla.
    g.fillRect(Math.round(W / 2) - 5, 0, 10, H);
    g.fillStyle(marcoB, 1);
    g.fillRect(0, b - 3, W, 3); g.fillRect(0, H - b, W, 3);
    // Asiento + respaldo abajo a la izquierda.
    g.fillStyle(asiento, 1);
    g.fillRoundedRect(30, H - 96, 150, 80, 10);
    g.fillStyle(0x4a3729, 1);
    g.fillRoundedRect(30, H - 96, 150, 16, 8);
    // El agente sentado (mirando hacia adelante).
    if (this.textures.exists('jugador_abajo_0')) {
      this._busAvatar = this.add.image(105, H - 92, 'jugador_abajo_0')
        .setDisplaySize(AJ.CONFIG.JUGADOR_W, AJ.CONFIG.JUGADOR_H).setDepth(51);
    }
  }

  /* =================== 1.3 — LA MESA DE AGENTES ==================== */
  _faseMesa() {
    if (this._fase === 'mesa') return;   // un tap/acción no re-dispara la fase
    this._fase = 'mesa';
    // Limpiar el colectivo.
    this._destruirColectivo();
    if (AJ.Juice) AJ.Juice.fadeIn(this, 350);

    const W = this._W, H = this._H;
    // Piso de madera.
    const piso = this.add.graphics().setDepth(0);
    piso.fillStyle(0x8a6b46, 1); piso.fillRect(0, 0, W, H);
    piso.fillStyle(0x7d5f3d, 1);
    for (let y = 0; y < H; y += 22) piso.fillRect(0, y, W, 3);
    // Mesa grande ovalada en el centro. Tamaño PROPORCIONAL a la pantalla para
    // que se vea bien con la cámara cercana (448×336) y con 800×600 (flag off).
    const cx = W / 2, cy = H * 0.50;
    const mw = W * 0.62, mh = H * 0.42; // diámetros de la mesa
    this._dibujarMesa(cx, cy, mw, mh);

    // Agentes alrededor (sprites NPC con cartelito de localidad ficticia).
    const sillas = [
      { tex: 'npc_intendenta', ang: -2.4, etq: 'del Norte' },
      { tex: 'npc_chacarero', ang: -1.4, etq: 'del Este' },
      { tex: 'npc_maestrarural', ang: -0.5, etq: 'del Oeste' },
      { tex: 'npc_pulpero', ang: 0.6, etq: 'del Monte' },
      { tex: 'npc_partera', ang: 1.6, etq: 'del Sur' },
      { tex: 'npc_puestero', ang: 2.5, etq: 'de la Colonia' },
    ];
    this._mesaSprites = [];
    const rx = W * 0.34, ry = H * 0.30; // radio de la ronda de agentes (proporcional)
    sillas.forEach((s) => {
      const x = cx + Math.cos(s.ang) * rx;
      const y = cy + Math.sin(s.ang) * ry;
      // Sombrita de contacto bajo cada agente (los apoya en el piso).
      const sm = this.add.graphics().setDepth(99 + y);
      sm.fillStyle(0x000000, 0.16); sm.fillEllipse(x, y + 14, 26, 9);
      this._mesaSprites.push(sm);
      if (this.textures.exists(s.tex + '_abajo_0')) {
        const sp = this.add.image(x, y - 12, s.tex + '_abajo_0')
          .setDisplaySize(AJ.CONFIG.JUGADOR_W, AJ.CONFIG.JUGADOR_H).setDepth(100 + y);
        this._mesaSprites.push(sp);
      }
      const t = this.add.text(x, y + 20, s.etq, {
        fontFamily: 'monospace', fontSize: '10px', color: '#fff',
        backgroundColor: '#000a', padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(9000);
      this._mesaSprites.push(t);
    });

    // Tu lugar (silla resaltada abajo, de frente a la mesa).
    this._tuSillaXY = { x: cx, y: Math.min(cy + ry + H * 0.10, H - 24) };
    const halo = this.add.graphics().setDepth(90);
    halo.fillStyle(0xf4cd60, 0.25); halo.fillCircle(this._tuSillaXY.x, this._tuSillaXY.y, 26);
    this._tuHalo = halo;
    // Pulso suave del halo: que se note que ESE es tu lugar.
    try { this.tweens.add({ targets: halo, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); } catch (e) {}

    // Diálogo de bienvenida (reusa AJ.Dialogo). Al cerrar: enfoque en vos → creador.
    this.dialogo = new AJ.Dialogo(this);
    const bienvenida = [
      'La Mesa Provincial de Agentes Juveniles está reunida. Te corren la silla con una sonrisa.',
      'Una agente del Norte alza el mate: «Bienvenido/a, che. Acá nos juntamos los referentes de cada pueblo a poner en común lo que funciona.»',
      'El del Monte te cebá uno: «Soy de un puesto donde somos cuatro gatos locos, pero hacemos ruido. Vas a ver que no estás solo/a en esto.»',
      'La del Sur sonríe: «Antes de arrancar… contanos quién sos. Acá cada historia suma.»',
    ];
    const mostrarBienvenida = () => {
      if (this._bienvenidaVista || this._terminando) return;
      this._bienvenidaVista = true;
      this.dialogo.mostrar('Mesa Provincial', bienvenida,
        () => this._enfocarEnVos(() => this._faseCreador()));
    };

    // Plano de apertura (momento clave): abrimos cerca de la mesa y SACAMOS la
    // cámara hacia atrás para revelar toda la ronda. Termina en zoom 1.0 porque
    // el diálogo es scrollFactor(0): un zoom ≠1 escalaría la UI (ver D48/D52 en
    // CLAUDE.md). Sin cámara/efecto → muestra el diálogo directo.
    if (this._camDisponible()) {
      try {
        this.cameras.main.setZoom(1.18);
        this.cameras.main.zoomTo(1.0, 1300, 'Sine.easeOut', false, (cam, prog) => {
          if (prog >= 1) mostrarBienvenida();
        });
        // Fallback por si el efecto no progresa (entorno sin requestAnimationFrame).
        this.time.delayedCall(1500, mostrarBienvenida);
      } catch (e) { mostrarBienvenida(); }
    } else {
      mostrarBienvenida();
    }
  }

  // Dibuja la Mesa con profundidad: sombra proyectada en el piso, canto (grosor),
  // tapa con vetas y brillo cenital, y AO contra el borde. Aditivo/cosmético.
  _dibujarMesa(cx, cy, mw, mh) {
    // Sombra proyectada en el piso (más ancha y desplazada hacia abajo).
    const sombra = this.add.graphics().setDepth(3);
    sombra.fillStyle(0x000000, 0.22); sombra.fillEllipse(cx, cy + mh * 0.16, mw * 1.06, mh * 0.92);
    sombra.fillStyle(0x000000, 0.13); sombra.fillEllipse(cx, cy + mh * 0.24, mw * 1.16, mh * 0.66);

    // Canto de la mesa: una "pollera" oscura bajo la tapa que asoma = grosor.
    const grosor = Math.max(8, mh * 0.10);
    const canto = this.add.graphics().setDepth(4);
    canto.fillStyle(0x3f2c1c, 1); canto.fillEllipse(cx, cy + grosor, mw, mh);

    // Tapa de la mesa.
    const mesa = this.add.graphics().setDepth(5);
    mesa.fillStyle(0x5b4029, 1); mesa.fillEllipse(cx, cy, mw, mh);            // borde madera oscura
    mesa.fillStyle(0x6e4f33, 1); mesa.fillEllipse(cx, cy, mw * 0.9, mh * 0.86); // bisel interior
    // Vetas (anillos concéntricos sutiles).
    mesa.lineStyle(2, 0x5a4128, 0.65);
    mesa.strokeEllipse(cx, cy, mw * 0.74, mh * 0.7);
    mesa.strokeEllipse(cx, cy, mw * 0.52, mh * 0.5);
    mesa.strokeEllipse(cx, cy, mw * 0.30, mh * 0.3);
    // Brillo cenital (desplazado arriba-izquierda, como luz de techo).
    mesa.fillStyle(0x7e5c3c, 0.55); mesa.fillEllipse(cx - mw * 0.10, cy - mh * 0.12, mw * 0.50, mh * 0.34);
    mesa.fillStyle(0x8a663f, 0.30); mesa.fillEllipse(cx - mw * 0.13, cy - mh * 0.16, mw * 0.26, mh * 0.18);
    // AO: sombra interior contra el borde (la tapa "cae" hacia el canto).
    mesa.lineStyle(3, 0x3f2c1c, 0.5); mesa.strokeEllipse(cx, cy, mw * 0.97, mh * 0.95);
    // Contorno final.
    mesa.lineStyle(3, 0x4a3422, 1); mesa.strokeEllipse(cx, cy, mw, mh);

    // Mates sobre la mesa (detalle costumbrista), con su sombrita proyectada.
    [[-0.2, -0.06], [0.16, 0.05], [0, 0.12]].forEach(([fx, fy]) => {
      const dx = fx * mw, dy = fy * mh;
      mesa.fillStyle(0x000000, 0.18); mesa.fillEllipse(cx + dx + 2, cy + dy + 5, 14, 7); // sombra
      mesa.fillStyle(0x2f5e2f, 1); mesa.fillCircle(cx + dx, cy + dy, 6);                  // mate
      mesa.fillStyle(0x3a6b3a, 1); mesa.fillCircle(cx + dx - 1, cy + dy - 1, 4);          // luz del mate
      mesa.fillStyle(0xcfcabd, 1); mesa.fillRect(cx + dx + 3, cy + dy - 8, 2, 8);         // bombilla
    });

    this._mesaGfx = [sombra, canto, mesa];
  }

  /* =================== CÁMARA (momentos clave) ==================== */
  _camDisponible() {
    try { return !!(this.cameras && this.cameras.main && typeof this.cameras.main.zoomTo === 'function'); }
    catch (e) { return false; }
  }

  // Enfoque en vos: empuje suave hacia tu silla antes de abrir el creador.
  // El creador es un overlay DOM que tapa la pantalla; el zoom se resetea al
  // entrar al cierre (_camReset) para que el diálogo de cierre quede a zoom 1.
  _enfocarEnVos(cb) {
    const done = () => { if (cb) { try { cb(); } catch (e) {} } };
    if (!this._camDisponible() || !this._tuSillaXY) { done(); return; }
    try {
      const W = this._W, H = this._H, z = 1.14;
      const halfW = W / z / 2, halfH = H / z / 2;
      // Clamp del centro para no mostrar piso vacío fuera del cuadro.
      const tx = Math.max(halfW, Math.min(W - halfW, this._tuSillaXY.x));
      const ty = Math.max(halfH, Math.min(H - halfH, this._tuSillaXY.y));
      const cam = this.cameras.main;
      cam.zoomTo(z, 480, 'Sine.easeInOut');
      cam.pan(tx, ty, 480, 'Sine.easeInOut');
      this.time.delayedCall(520, done);
    } catch (e) { done(); }
  }

  // Resetea la cámara a zoom 1 y centrada (antes del diálogo de cierre, que es
  // scrollFactor 0). Instantáneo: la pantalla viene tapada por el overlay DOM.
  _camReset() {
    if (!this._camDisponible()) return;
    try {
      const cam = this.cameras.main;
      if (cam.panEffect && cam.panEffect.isRunning) cam.panEffect.reset();
      if (cam.zoomEffect && cam.zoomEffect.isRunning) cam.zoomEffect.reset();
      cam.setZoom(1);
      cam.centerOn(this._W / 2, this._H / 2);
    } catch (e) {}
  }

  /* =================== 1.4 — CREAR AVATAR ========================== */
  _faseCreador() {
    this._fase = 'creador';
    if (!(AJ.CONFIG.creadorAgente && AJ.Agente && AJ.Agente.abrirCreador)) { this._faseVidaPrevia(); return; }
    AJ.Agente.abrirCreador(this, () => {
      this._creado = true;
      // Recolorear el sprite del jugador a la variante elegida (las texturas
      // las borró el creador; regenerarlas con la variante actual).
      try { AJ.Art.generarTodo(this); } catch (e) {}
      // Mostrar tu avatar en tu silla.
      try {
        if (this.textures.exists('jugador_arriba_0')) {
          this._tuAvatar = this.add.image(this._tuSillaXY.x, this._tuSillaXY.y, 'jugador_arriba_0')
            .setDisplaySize(AJ.CONFIG.JUGADOR_W, AJ.CONFIG.JUGADOR_H).setDepth(9001);
        }
      } catch (e) {}
      this._faseVidaPrevia();
    }, { conLocalidad: true, titulo: '¿Quién sos, agente?', sub: 'Tu nombre, tu cara y de dónde venís.', cta: 'Contá tu historia »', sinVolver: true });
  }

  /* =================== 1.5 — VIDA PREVIA ========================== */
  _faseVidaPrevia() {
    this._fase = 'vidaprevia';
    if (!(AJ.VidaPreviaUI && AJ.VidaPreviaUI.abrir)) { this._faseCierre(); return; }
    AJ.VidaPreviaUI.abrir(this, this._estado, (sel) => {
      this._sel = sel;
      this._faseCierre();
    });
  }

  /* =================== 1.6 — CHARLA DE CIERRE ===================== */
  _faseCierre() {
    this._fase = 'cierre';
    this._camReset(); // volver a zoom 1 / centrado antes del diálogo (scrollFactor 0)
    const nom = (AJ.Agente && AJ.Agente.nombre && AJ.Agente.nombre()) || '';
    const loc = (AJ.Agente && AJ.Agente.localidad && AJ.Agente.localidad()) || 'tu pueblo';
    if (!this.dialogo) { try { this.dialogo = new AJ.Dialogo(this); } catch (e) {} }
    const cierre = [
      (nom ? nom + ', ' : '') + 'te llevás la caja de herramientas de la Mesa: cinco líneas de trabajo (cultura, ferias, medios, prevención e intereses alternativos).',
      'Te explican el oficio: vas a recorrer ' + loc + ', conocer a los pibes, armar tu Agencia y resolver dilemas. Cuando dudes, se tira el dado: la suerte al principio, la competencia después.',
      'La Mesa te queda como "piso de arriba": volvé cuando necesites respaldo. Ahora sí: a tu localidad, que la gestión empieza caminando.',
    ];
    if (this.dialogo) this.dialogo.mostrar('Mesa Provincial', cierre, () => this._finalizar());
    else this._finalizar();
  }

  /* =================== SALTEAR / FINALIZAR ======================== */
  _onTap() {
    if (this._fase === 'colectivo') { this._faseMesa(); return; }
    if (this.dialogo && this.dialogo.abierto) { this.dialogo.avanzar(); return; }
  }

  _saltear() {
    // Cerrar cualquier overlay DOM abierto (creador / vida previa).
    try { if (AJ.Agente && AJ.Agente.cerrarCreador) AJ.Agente.cerrarCreador(); } catch (e) {}
    try { if (AJ.VidaPreviaUI && AJ.VidaPreviaUI.cerrar) AJ.VidaPreviaUI.cerrar(); } catch (e) {}
    // Si no eligió vida previa, aplicar una selección por defecto (perfil neutro).
    if (!this._sel) { this._sel = AJ.VidaPrevia ? AJ.VidaPrevia.seleccionDefault() : null; }
    this._finalizar();
  }

  _finalizar() {
    if (this._terminando) return;
    this._terminando = true;
    try {
      // Aplicar la vida previa (reparte medidores reusando origen/medidores).
      if (this._sel && AJ.VidaPrevia && AJ.VidaPrevia.aplicar) AJ.VidaPrevia.aplicar(this._estado, this._sel);
      else if (AJ.Gestion && AJ.Gestion.Estado) {
        // Sin selección: asegurar gestión y marcar la Mesa vista igual.
        AJ.Gestion.Estado.asegurar(this._estado, null);
        if (this._estado.gestion) this._estado.gestion.mesaVista = true;
      }
      AJ.Guardado.guardar(this._estado);
    } catch (e) { console.warn('[Apertura] finalizar', e); }
    this._limpiar();
    if (AJ.Juice) AJ.Juice.irA(this, 'Pueblo', { nuevo: false });
    else this.scene.start('Pueblo', { nuevo: false });
  }

  update(time, delta) {
    const dt = delta / 1000;
    // Parallax del colectivo.
    if (this._fase === 'colectivo') {
      (this._capas || []).forEach((c) => { try { c.tilePositionX += (c._spd || 0) * dt; } catch (e) {} });
      // Acción (espacio/E/botón táctil) avanza a la Mesa.
      if (AJ.Input && AJ.Input.tomarAccion && AJ.Input.tomarAccion()) { this._faseMesa(); return; }
      this._tColectivo += dt;
      if (this._tColectivo > 7) { this._faseMesa(); return; }
      return;
    }
    // Avance de diálogos con la tecla de acción.
    if (this.dialogo && this.dialogo.abierto) {
      if (AJ.Input && AJ.Input.tomarAccion && AJ.Input.tomarAccion()) this.dialogo.avanzar();
    }
  }

  /* =================== UTILIDADES ================================= */
  _botonSaltear() {
    let b = document.getElementById('btn-saltear');
    if (!b) {
      b = document.createElement('button');
      b.id = 'btn-saltear';
      b.textContent = 'Saltear intro ⏭';
      b.style.cssText = 'position:absolute;top:10px;right:12px;z-index:50;' +
        'background:#2a1f12cc;color:#fff7e6;border:2px solid #f3d9a0;border-radius:8px;' +
        'padding:6px 12px;font-family:Georgia,serif;font-size:14px;cursor:pointer;';
      document.body.appendChild(b);
    }
    b.style.display = 'block';
    this._onSaltear = (e) => { e.preventDefault(); if (AJ.Sonido) { try { AJ.Sonido.click(); } catch (_) {} } this._saltear(); };
    b.addEventListener('click', this._onSaltear);
  }

  _destruirColectivo() {
    this.input.off('pointerdown', this._onTap, this);
    (this._capas || []).forEach((c) => { try { c.destroy(); } catch (e) {} });
    (this._capasFijas || []).forEach((c) => { try { c.destroy(); } catch (e) {} });
    [this._cap, this._sub, this._busAvatar, this._busFrameGfx].forEach((o) => { try { o && o.destroy(); } catch (e) {} });
    this._busFrameGfx = null;
    this._capas = []; this._capasFijas = [];
  }

  _limpiar() {
    try {
      const b = document.getElementById('btn-saltear');
      if (b) { if (this._onSaltear) b.removeEventListener('click', this._onSaltear); b.style.display = 'none'; }
    } catch (e) {}
    try { if (AJ.Agente && AJ.Agente.cerrarCreador) AJ.Agente.cerrarCreador(); } catch (e) {}
    try { if (AJ.VidaPreviaUI && AJ.VidaPreviaUI.cerrar) AJ.VidaPreviaUI.cerrar(); } catch (e) {}
  }

  // --- Arte procedural específico de la apertura (colectivo/ruta/caldenes) ---
  _generarArteApertura() {
    const tex = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      fn(g); g.generateTexture(key, w, h); g.destroy();
    };
    // Caldén en silueta (transparente a los lados → tiled da árboles espaciados).
    tex('ap_calden', 96, 64, (g) => {
      const cx = 48;
      g.fillStyle(0x6b4a2f, 1); g.fillRect(cx - 2, 40, 4, 22);
      g.fillStyle(0x4f6b34, 1); g.fillCircle(cx, 32, 16);
      g.fillStyle(0x5f7d3f, 1); g.fillCircle(cx - 10, 30, 9); g.fillCircle(cx + 11, 33, 8);
      g.fillStyle(0x415a2b, 1); g.fillCircle(cx + 2, 26, 6);
    });
    // Poste de alambrado con dos hilos (transparente → tiled da una línea de postes).
    tex('ap_poste', 48, 48, (g) => {
      g.fillStyle(0x000000, 0.2); g.fillRect(0, 30, 48, 1); g.fillRect(0, 36, 48, 1);
      g.fillStyle(0x6b4a2f, 1); g.fillRect(22, 14, 4, 30);
      g.fillStyle(0x8a6a45, 1); g.fillRect(22, 14, 1, 30);
    });
    // Ruta de tierra (banda; tiled horizontal da sensación de movimiento).
    tex('ap_ruta', 48, 40, (g) => {
      g.fillStyle(0xbb9258, 1); g.fillRect(0, 0, 48, 40);
      g.fillStyle(0xa9824a, 1); for (let x = 0; x < 48; x += 6) g.fillRect(x, 18, 4, 4);
      g.fillStyle(0xcaa56a, 1); g.fillRect(0, 2, 48, 2);
    });
  }
};
