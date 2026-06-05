/* =====================================================================
 * rutinas.js — NPCs con rutinas diarias + afinidad (FASE A, CONFIG.rutinas)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.rutinas. No reescribe nada de la FASE 2:
 *   - AJ.Rutinas: mueve a los NPCs entre puntos según la hora del juego
 *     (usa el reloj de CONFIG.diaNoche). Movimiento por ejes con chequeo
 *     de colisión; si un NPC no puede avanzar, espera (nunca rompe nada).
 *   - AJ.Afinidad: amistad por NPC (0..100) que sube al hablarles. Como
 *     cada misión exige varias charlas con sus NPCs, cumplir misiones
 *     también sube la afinidad. Visible en el panel "Cuaderno · Vecinos".
 *
 * Si algo falla en runtime, la escena lo captura y apaga el sistema sin
 * crashear el juego (ver Pueblo._iniciarSistema y los try/catch del tick).
 * ===================================================================== */

window.AJ = window.AJ || {};

/* ----------------------------- RUTINAS ------------------------------ */
AJ.Rutinas = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    this.mgr = scene.npcManager;
    this.vel = 38;            // px/seg de caminata de los NPCs (tranqui)
    this.acc = 0;            // acumulador para throttle del tick
    this.rec = {};           // id -> { px, py, animT }
    this.def = {};           // id -> { trabajo, social, hogar }
  }

  init() {
    // FASE D: en un pueblo sin NPCs (Colonia) el sistema se inicia vacío.
    if (!this.mgr || !this.mgr.npcs.length) return;
    // Puntos sociales en la plaza (evitando el monumento 19,15).
    const plaza = [
      { x: 16, y: 13 }, { x: 22, y: 13 }, { x: 16, y: 17 },
      { x: 22, y: 17 }, { x: 17, y: 14 }, { x: 21, y: 16 },
    ];
    this.mgr.npcs.forEach((n, i) => {
      // Si el spot quedó sobre un tile que colisiona (p. ej. la Muni mira a
      // la aguada, solape latente del mapa), reubicar al walkable más cercano.
      this._asegurarWalkable(n);
      this.rec[n.id] = { px: n.sprite.x, py: n.sprite.y, animT: 0 };
      // trabajo/hogar = su lugar (ya saneado); social = un punto de plaza.
      this.def[n.id] = {
        trabajo: { x: n.tx, y: n.ty },
        hogar: { x: n.tx, y: n.ty },
        social: plaza[i % plaza.length],
      };
      // Pausar el bob de la marca: ahora la posiciona la rutina.
      if (n.marcaTween && n.marcaTween.pause) { try { n.marcaTween.pause(); } catch (e) {} }
    });
  }

  // Mueve al NPC al tile walkable libre más cercano si su tile colisiona.
  _asegurarWalkable(n) {
    if (!AJ.Mapa.esColision(n.tx, n.ty) && !this._ocupadoPorOtro(n, n.tx, n.ty)) return;
    const T = AJ.CONFIG.TILE;
    for (let radio = 1; radio <= 4; radio++) {
      for (let dy = -radio; dy <= radio; dy++) {
        for (let dx = -radio; dx <= radio; dx++) {
          const tx = n.tx + dx, ty = n.ty + dy;
          if (AJ.Mapa.esColision(tx, ty)) continue;
          if (this._ocupadoPorOtro(n, tx, ty)) continue;
          if (this.scene.jugador) {
            const jp = this.scene.jugador.tilePos();
            if (jp.x === tx && jp.y === ty) continue;
          }
          // Reubicar acá.
          if (this.mgr.reubicar) this.mgr.reubicar(n, tx, ty);
          n.sprite.x = tx * T + T / 2; n.sprite.y = ty * T + T / 2;
          n.sprite.setDepth(n.sprite.y);
          return;
        }
      }
    }
  }

  _ocupadoPorOtro(n, tx, ty) {
    const o = this.mgr.porTile[tx + ',' + ty];
    return o && o !== n;
  }

  // Tile destino según la franja horaria (costumbrista).
  _target(id, min) {
    const d = this.def[id];
    if (!d) return null;
    if (min >= 420 && min < 780) return d.trabajo;   // 07:00–13:00 en su lugar
    if (min >= 780 && min < 1140) return d.social;    // 13:00–19:00 en la plaza
    return d.hogar;                                   // resto: en su lugar
  }

  update(dt) {
    if (!this.mgr) return;
    // Congelar durante un diálogo (que no se vaya caminando).
    if (this.scene.dialogo && this.scene.dialogo.abierto) return;
    this.acc += dt;
    if (this.acc < 0.04) return;          // ~25 veces/seg como mucho
    const paso = this.acc; this.acc = 0;

    const min = this.scene.diaNoche
      ? Math.floor(this.scene.diaNoche.estado.tiempo.minutos) % 1440
      : 720;

    this.mgr.npcs.forEach((n) => {
      const t = this._target(n.id, min);
      if (t) this._seguir(n, t.x, t.y, paso);
      if (n.marca) { n.marca.x = n.sprite.x; n.marca.y = n.sprite.y - 58; }
    });
  }

  // Camina al destino siguiendo una ruta de waypoints (BFS). Los caminos son
  // 4-conexos sobre tiles caminables, así que cada tramo es recto y sin chocar
  // estáticos; sólo esperamos si un blocker dinámico (jugador/otro NPC) tapa el
  // próximo tile. Esto elimina el problema de quedarse trabado en una esquina.
  _seguir(n, gx, gy, dt) {
    const T = AJ.CONFIG.TILE, rec = this.rec[n.id];
    if (!rec) return;

    // ¿Ya está en el destino? Quedarse quieto.
    if (n.tx === gx && n.ty === gy &&
        Math.abs(rec.px - (gx * T + T / 2)) < 1.5 && Math.abs(rec.py - (gy * T + T / 2)) < 1.5) {
      n.sprite.setTexture(n.tex + '_' + n.dir + '_0');
      rec.ruta = null;
      return;
    }

    // (Re)calcular ruta si cambió el destino o no hay.
    if (!rec.ruta || !rec.goal || rec.goal.x !== gx || rec.goal.y !== gy || rec.idx >= rec.ruta.length) {
      rec.goal = { x: gx, y: gy };
      rec.ruta = this._bfsPath(n.tx, n.ty, gx, gy);
      rec.idx = 0;
      if (!rec.ruta || rec.ruta.length === 0) { // ya está o no hay camino
        n.sprite.setTexture(n.tex + '_' + n.dir + '_0');
        return;
      }
    }

    const wp = rec.ruta[rec.idx];
    if (!wp) { rec.ruta = null; return; }

    // Blocker dinámico en el próximo tile.
    if (this._dinamicoBloquea(n, wp.x, wp.y)) {
      // Si lo tapa un NPC parado (no el jugador), recalcular evitando a los
      // demás NPCs para no quedar en deadlock contra su lugar de descanso.
      const jp = this.scene.jugador ? this.scene.jugador.tilePos() : null;
      const esJugador = jp && jp.x === wp.x && jp.y === wp.y;
      if (!esJugador) {
        const alt = this._bfsPath(n.tx, n.ty, gx, gy, this._tilesDeOtros(n));
        if (alt && alt.length) { rec.ruta = alt; rec.idx = 0; rec.goal = { x: gx, y: gy }; }
      }
      return; // esperar este tick; el próximo toma la ruta nueva
    }

    const destX = wp.x * T + T / 2, destY = wp.y * T + T / 2;
    let dx = destX - rec.px, dy = destY - rec.py;
    const dist = Math.hypot(dx, dy);
    const v = this.vel * dt;

    if (dist <= v || dist < 1.5) {
      // Llegó al waypoint: encajar y avanzar al siguiente.
      rec.px = destX; rec.py = destY;
      rec.idx += 1;
    } else {
      rec.px += (dx / dist) * v; rec.py += (dy / dist) * v;
    }
    rec.animT += dt;

    // Dirección + frame de caminata.
    if (Math.abs(dx) > Math.abs(dy)) n.dir = dx < 0 ? 'izq' : 'der';
    else n.dir = dy < 0 ? 'arriba' : 'abajo';
    const fase = (Math.floor(rec.animT * 6) % 2) ? 1 : 2;
    n.sprite.setTexture(n.tex + '_' + n.dir + '_' + fase);
    n.sprite.x = Math.round(rec.px);
    n.sprite.y = Math.round(rec.py);
    n.sprite.setDepth(rec.py);

    // Sincronizar tile lógico (colisión + interacción) si cambió.
    const ntx = Math.floor(rec.px / T), nty = Math.floor(rec.py / T);
    if (ntx !== n.tx || nty !== n.ty) {
      if (this.mgr.reubicar) this.mgr.reubicar(n, ntx, nty);
    }
  }

  // Tiles ocupados por los demás NPCs (para esquivar a los que están parados).
  _tilesDeOtros(n) {
    const s = {};
    this.mgr.npcs.forEach((o) => { if (o !== n) s[o.tx + ',' + o.ty] = true; });
    return s;
  }

  // BFS 4-conexo sobre tiles caminables. `evitar` (opcional) es un set de
  // "x,y" a tratar como bloqueados (salvo el destino). Devuelve la ruta (sin
  // el origen, incluyendo el destino) o null si no hay camino. Acotado.
  _bfsPath(sx, sy, gx, gy, evitar) {
    if (sx === gx && sy === gy) return [];
    if (AJ.Mapa.esColision(gx, gy)) return null;
    const W = AJ.Mapa.ANCHO, H = AJ.Mapa.ALTO;
    const k = (x, y) => x + ',' + y;
    const ev = evitar || null;
    const vis = {}, prev = {};
    const cola = [[sx, sy]];
    vis[k(sx, sy)] = true;
    let cabeza = 0, lim = 0, hallado = false;
    while (cabeza < cola.length && lim++ < 4000) {
      const nodo = cola[cabeza++];
      const x = nodo[0], y = nodo[1];
      if (x === gx && y === gy) { hallado = true; break; }
      const vec = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const v of vec) {
        const nx = v[0], ny = v[1], kk = k(nx, ny);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (vis[kk]) continue;
        if (AJ.Mapa.esColision(nx, ny)) continue;
        // Evitar tiles ocupados, salvo que sea el destino.
        if (ev && ev[kk] && !(nx === gx && ny === gy)) continue;
        vis[kk] = true; prev[kk] = k(x, y); cola.push([nx, ny]);
      }
    }
    if (!hallado) return null;
    const ruta = [];
    let cur = k(gx, gy);
    while (cur !== k(sx, sy)) {
      const p = cur.split(',');
      ruta.push({ x: +p[0], y: +p[1] });
      cur = prev[cur];
      if (cur === undefined) break;
    }
    ruta.reverse();
    return ruta;
  }

  // Bloqueo dinámico: el jugador o otro NPC ocupando un tile.
  _dinamicoBloquea(n, tx, ty) {
    const jp = this.scene.jugador ? this.scene.jugador.tilePos() : null;
    if (jp && jp.x === tx && jp.y === ty) return true;
    const otro = this.mgr.porTile[tx + ',' + ty];
    if (otro && otro !== n) return true;
    return false;
  }
};

/* ----------------------------- AFINIDAD ----------------------------- */
AJ.Afinidad = class {
  constructor(scene, estado) {
    this.scene = scene;
    this.estado = estado;
    if (!this.estado.afinidad) this.estado.afinidad = {};
    this.MAX = 100;
    this.BUMP_HABLAR = 20;     // sube un "corazón" por charla nueva del día
    this.ultimaCharlaDia = {}; // id -> día en que ya charló (anti-farmeo)
    this.abierto = false;
  }

  init() { this._crearUI(); }

  nivel(id) { return this.estado.afinidad[id] || 0; }

  _diaActual() { return this.scene.diaNoche ? this.scene.diaNoche.dia : 1; }

  // Sube afinidad al hablar (una vez por día de juego por NPC).
  alHablar(npc) {
    if (!npc) return;
    const dia = this._diaActual();
    if (this.ultimaCharlaDia[npc.id] === dia) return; // ya charlaron hoy
    this.ultimaCharlaDia[npc.id] = dia;
    this.subir(npc.id, this.BUMP_HABLAR);
  }

  subir(id, n) {
    const cur = this.nivel(id);
    this.estado.afinidad[id] = Math.max(0, Math.min(this.MAX, cur + n));
    if (this.abierto) this._refrescar();
    try { AJ.Guardado.guardar(this.estado); } catch (e) {}
  }

  _corazones(v) {
    const llenos = Math.round(v / 20);
    return '♥'.repeat(llenos) + '♡'.repeat(5 - llenos);
  }

  _etiqueta(v) {
    if (v >= 100) return 'Compañero del alma';
    if (v >= 80) return 'Gran amigo';
    if (v >= 60) return 'Amigo';
    if (v >= 40) return 'Conocido';
    if (v >= 20) return 'Saludo y vuelta';
    return 'Recién llegado';
  }

  _crearUI() {
    const W = this.scene.scale.width, H = this.scene.scale.height;

    // Botón "♥ Vecinos" (debajo del HUD básico).
    this.boton = this.scene.add.text(10, 40, '♥ Vecinos', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff7e6',
      backgroundColor: '#8a4a2acc', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(9000).setInteractive({ useHandCursor: true });
    this.boton.on('pointerdown', () => this.alternar());

    // Tecla C para abrir/cerrar.
    if (this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-C', () => this.alternar());
    }

    // Panel (oculto).
    this.panel = this.scene.add.container(W / 2, H / 2).setScrollFactor(0).setDepth(11000).setVisible(false);
    const pw = 460, ph = 320;
    const fondo = this.scene.add.graphics();
    fondo.fillStyle(0x2a1f12, 0.96); fondo.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
    fondo.lineStyle(3, 0xf3d9a0, 1); fondo.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 14);
    const titulo = this.scene.add.text(0, -ph / 2 + 18, 'CUADERNO · Vecinos', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f5d020', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.lista = this.scene.add.text(-pw / 2 + 24, -ph / 2 + 56, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#fff7e6', lineSpacing: 8,
    });
    const ayuda = this.scene.add.text(0, ph / 2 - 22, 'Hablá con los vecinos para hacerte amigo · (C para cerrar)', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: '#cdbfa0',
    }).setOrigin(0.5, 0.5);
    this.panel.add([fondo, titulo, this.lista, ayuda]);
  }

  alternar() { this.abierto ? this.cerrar() : this.abrir(); }

  abrir() {
    this.abierto = true;
    this._refrescar();
    if (this.panel) this.panel.setVisible(true);
  }

  cerrar() {
    this.abierto = false;
    if (this.panel) this.panel.setVisible(false);
  }

  _refrescar() {
    if (!this.lista) return;
    const mgr = this.scene.npcManager;
    if (!mgr) { this.lista.setText('(sin vecinos)'); return; }
    const lineas = mgr.npcs.map((n) => {
      const v = this.nivel(n.id);
      const nombre = (n.nombre + '').padEnd(20, ' ').slice(0, 20);
      return nombre + ' ' + this._corazones(v) + '  ' + this._etiqueta(v);
    });
    this.lista.setText(lineas.join('\n'));
  }
};
