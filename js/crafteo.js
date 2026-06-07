/* =====================================================================
 * crafteo.js — Mesa de crafteo + recetas (FASE C, CONFIG.crafteo)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.crafteo. Una mesa de trabajo donde combinar
 * cosechas (verdura, de la huerta) y objetos juntados (leña, de los
 * caldenes) en ítems nuevos, con 5 recetas. Suma a la economía existente.
 *
 * Ingredientes:
 *   - 🥕 verdura: la da la cosecha de la huerta (hook en granja.js).
 *   - 🪵 leña: se junta de los caldenes (1 por árbol por día de juego).
 * Inventario en estado.inventario.items (persistido). Sin azar ni plata
 * real: craftear es determinístico.
 *
 * Si el flag está en false o algo falla, no se inicializa y el juego sigue
 * igual (FASE 4 intacta: la cosecha igual da +1 verdura, que no molesta).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.RECETAS = [
  { id: 'mermelada', nombre: 'Mermelada casera', emoji: '🍯',
    cuesta: { verdura: 3 }, da: { monedas: 30 }, logro: 'Manos a la masa' },
  { id: 'fardo', nombre: 'Fardo de leña', emoji: '🪵',
    cuesta: { lena: 4 }, da: { monedas: 20 }, logro: 'Hachero' },
  { id: 'guiso', nombre: 'Guiso criollo', emoji: '🍲',
    cuesta: { verdura: 2, lena: 2 }, da: { monedas: 15, item: 'guiso' }, logro: 'Cocinero del pueblo' },
  { id: 'canasta', nombre: 'Canasta de la huerta', emoji: '🧺',
    cuesta: { verdura: 5 }, da: { item: 'canasta' }, logro: 'Canastero solidario' },
  { id: 'adorno', nombre: 'Adorno de caldén', emoji: '🎋',
    cuesta: { lena: 3 }, da: { item: 'adorno' }, logro: 'Artesano del pueblo' },
];

AJ.Crafteo = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.inventario) this.estado.inventario = { monedas: 0, logros: [], items: {} };
    if (!this.estado.inventario.items) this.estado.inventario.items = {};
    this.menuAbierto = false;
    this.lenaPorDia = {};                 // "x,y" -> día en que ya se juntó leña
    this.mesaTile = { x: 22, y: 24 };     // tile de la mesa (se valida en init)
  }

  init() {
    this._generarTexturas();
    this._ubicarMesa();
    this._crearMenu();
  }

  // --- Texturas propias (sin tocar art.js) ---
  _generarTexturas() {
    const mk = (clave, w, h, dibujar) => {
      if (this.scene.textures.exists(clave)) return;
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      dibujar(g); g.generateTexture(clave, w, h); g.destroy();
    };
    mk('mesa_crafteo', 16, 16, (g) => {
      g.fillStyle(0x7ba349, 1); g.fillRect(0, 0, 16, 16);          // pasto base
      g.fillStyle(0x8a5a2f, 1); g.fillRect(2, 5, 12, 7);           // tabla
      g.fillStyle(0x6b4423, 1); g.fillRect(2, 5, 12, 2);           // borde
      g.fillRect(3, 11, 2, 4); g.fillRect(11, 11, 2, 4);           // patas
      g.fillStyle(0xb0884f, 1); g.fillRect(4, 7, 3, 3);            // herramientas
      g.fillStyle(0x9a9486, 1); g.fillRect(9, 7, 4, 2);
    });
  }

  _ubicarMesa() {
    // Validar/ajustar el tile de la mesa a uno walkable cerca de la huerta.
    // FASE D: priorizar tiles pegados a la parcela del pueblo ACTUAL.
    const cand = [];
    const g = AJ.Mapa.meta.granja;
    if (g) {
      cand.push({ x: g.x - 1, y: g.y + g.h - 1 }, { x: g.x + g.w, y: g.y + g.h - 1 },
        { x: g.x, y: g.y + g.h }, { x: g.x - 1, y: g.y });
    }
    cand.push(this.mesaTile, { x: 22, y: 25 }, { x: 21, y: 24 }, { x: 28, y: 24 }, { x: 19, y: 22 });
    let elegido = null;
    for (const c of cand) {
      if (!AJ.Mapa.esColision(c.x, c.y)) { elegido = c; break; }
    }
    if (!elegido) elegido = this.mesaTile;
    this.mesaTile = elegido;
    const T = AJ.CONFIG.TILE;
    this.sprite = this.scene.add.image(elegido.x * T + T / 2, elegido.y * T + T / 2, 'mesa_crafteo')
      .setDisplaySize(T, T) // textura 16×16 mostrada a 32 (×2)
      .setDepth(elegido.y * T + T);
    // Cartelito.
    this.scene.add.text(elegido.x * T + T / 2, elegido.y * T - 4, 'Mesa de oficios', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff',
      backgroundColor: '#000a', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(5000).setAlpha(0.85);
  }

  // La mesa colisiona (no se puede pisar); se interactúa de frente.
  ocupa(tx, ty) { return this.mesaTile && tx === this.mesaTile.x && ty === this.mesaTile.y; }

  // --- Inventario ---
  _cant(item) { return this.estado.inventario.items[item] || 0; }
  _agregar(item, n) {
    this.estado.inventario.items[item] = this._cant(item) + n;
  }
  _alcanza(cuesta) {
    for (const k in cuesta) if (this._cant(k) < cuesta[k]) return false;
    return true;
  }

  _diaActual() { return this.scene.diaNoche ? this.scene.diaNoche.dia : 1; }

  // --- Interacción desde la escena (tile de enfrente) ---
  intentarInteractuar(tx, ty) {
    // Mesa -> abrir menú.
    if (this.ocupa(tx, ty)) { this.abrirMenu(); return true; }
    // Caldén -> juntar leña.
    if (AJ.Mapa.tex[ty] && AJ.Mapa.tex[ty][tx] === 'calden') {
      this._juntarLena(tx, ty);
      return true;
    }
    return false;
  }

  _juntarLena(tx, ty) {
    const key = tx + ',' + ty, dia = this._diaActual();
    if (this.lenaPorDia[key] === dia) {
      this._flotante('Ya juntaste acá hoy', tx, ty, '#cccccc');
      return;
    }
    this.lenaPorDia[key] = dia;
    this._agregar('lena', 1);
    this._flotante('+1 🪵 leña', tx, ty, '#c8a05a');
    this._guardar();
    if (this.menuAbierto) this._refrescarMenu();
  }

  _flotante(txt, tx, ty, color) {
    try {
      const T = AJ.CONFIG.TILE;
      const t = this.scene.add.text(tx * T + T / 2, ty * T, txt, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: color || '#fff',
        stroke: '#2a1f12', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(9500);
      this.scene.tweens.add({ targets: t, y: t.y - 22, alpha: 0, duration: 900,
        onComplete: () => t.destroy() });
    } catch (e) {}
  }

  // --- Craftear ---
  craftear(receta) {
    if (!receta) return false;
    if (!this._alcanza(receta.cuesta)) { this._avisoMenu('Te faltan ingredientes'); return false; }
    for (const k in receta.cuesta) this._agregar(k, -receta.cuesta[k]);
    const inv = this.estado.inventario;
    if (receta.da.monedas) {
      // P5: factor de precio de crafteo (balance, con fallback a 1).
      const factor = AJ.bal ? AJ.bal('factorPrecioCrafteo', 1) : 1;
      inv.monedas = (inv.monedas || 0) + Math.round(receta.da.monedas * factor);
    }
    if (receta.da.item) this._agregar(receta.da.item, 1);
    if (receta.logro && inv.logros.indexOf(receta.logro) < 0) inv.logros.push(receta.logro);
    if (AJ.Sonido) { try { AJ.Sonido.craft(); } catch (e) {} }
    this._guardar();
    if (this.scene._actualizarHUD) this.scene._actualizarHUD();
    this._avisoMenu('¡Hiciste ' + receta.emoji + ' ' + receta.nombre + '!');
    this._refrescarMenu();
    return true;
  }

  // --- Menú UI ---
  _crearMenu() {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    this.menu = this.scene.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(11000).setVisible(false);
    const pw = 520, ph = 360;
    const fondo = this.scene.add.graphics();
    fondo.fillStyle(0x2a1f12, 0.97); fondo.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
    fondo.lineStyle(3, 0xf3d9a0, 1); fondo.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
    this.titulo = this.scene.add.text(0, -ph / 2 + 14, 'MESA DE OFICIOS', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f5d020', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.stock = this.scene.add.text(0, -ph / 2 + 44, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#cfe8a0',
    }).setOrigin(0.5, 0);
    this.menu.add([fondo, this.titulo, this.stock]);

    // Filas de recetas (clickeables) + atajo numérico.
    this.filas = [];
    AJ.RECETAS.forEach((rec, i) => {
      const y = -ph / 2 + 80 + i * 48;
      const fila = this.scene.add.text(-pw / 2 + 24, y, '', {
        fontFamily: 'monospace', fontSize: '15px', color: '#fff7e6',
        backgroundColor: '#00000000', padding: { x: 6, y: 6 }, fixedWidth: pw - 48,
      }).setInteractive({ useHandCursor: true });
      fila.on('pointerover', () => { if (this._alcanza(rec.cuesta)) fila.setBackgroundColor('#5a3a1f'); });
      fila.on('pointerout', () => fila.setBackgroundColor('#00000000'));
      fila.on('pointerdown', () => this.craftear(rec));
      this.menu.add(fila);
      this.filas.push({ fila, rec, tecla: i + 1 });
    });

    this.aviso = this.scene.add.text(0, ph / 2 - 40, '', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f5d020',
    }).setOrigin(0.5, 0.5);
    this.cerrar = this.scene.add.text(0, ph / 2 - 16,
      'Tecla 1–5 para hacer · (acción/Esc para cerrar)', {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#cdbfa0',
      }).setOrigin(0.5, 0.5);
    this.menu.add([this.aviso, this.cerrar]);

    // Atajos numéricos para craftear (1–5) mientras el menú está abierto.
    if (this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown', (e) => {
        if (!this.menuAbierto) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= AJ.RECETAS.length) this.craftear(AJ.RECETAS[n - 1]);
      });
    }
  }

  abrirMenu() { this.menuAbierto = true; this._refrescarMenu(); if (this.menu) this.menu.setVisible(true); }
  cerrarMenu() { this.menuAbierto = false; if (this.menu) this.menu.setVisible(false); }

  _avisoMenu(txt) { if (this.aviso) this.aviso.setText(txt); }

  _refrescarMenu() {
    if (!this.stock) return;
    this.stock.setText('🥕 verdura: ' + this._cant('verdura') + '    🪵 leña: ' + this._cant('lena') +
      '    ¢ ' + (this.estado.inventario.monedas || 0));
    this.filas.forEach(({ fila, rec, tecla }) => {
      const puede = this._alcanza(rec.cuesta);
      const costo = Object.keys(rec.cuesta).map((k) => rec.cuesta[k] + ' ' + this._icono(k)).join(' + ');
      const premio = [];
      if (rec.da.monedas) premio.push('+' + rec.da.monedas + '¢');
      if (rec.da.item) premio.push(rec.emoji);
      fila.setText('[' + tecla + '] ' + rec.emoji + ' ' + rec.nombre.padEnd(20, ' ') +
        '  ' + costo + '  → ' + premio.join(' '));
      fila.setColor(puede ? '#fff7e6' : '#8a8276');
    });
  }

  _icono(k) { return k === 'verdura' ? '🥕' : k === 'lena' ? '🪵' : k; }

  _guardar() { try { AJ.Guardado.guardar(this.estado); } catch (e) {} }
};
