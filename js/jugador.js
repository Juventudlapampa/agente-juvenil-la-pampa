/* =====================================================================
 * jugador.js — El Agente Juvenil
 * ---------------------------------------------------------------------
 * Movimiento en 4 direcciones, animación de caminata y colisiones contra
 * la matriz del mapa (chequeo por tile, sin física pesada de Phaser para
 * mantenerlo simple y predecible).
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Jugador = class {
  constructor(scene, tileX, tileY, dir) {
    this.scene = scene;
    const T = AJ.CONFIG.TILE;
    // Posición en píxeles (centro-x, pies). El sprite se ancla al centro.
    this.x = tileX * T + T / 2;
    this.y = tileY * T + T / 2;
    this.dir = dir || 'abajo';
    this.moviendo = false;

    this.sprite = scene.add.sprite(this.x, this.y, 'jugador_' + this.dir + '_0');
    this.sprite.setOrigin(0.5, 0.75); // pies cerca de la base del tile
    this.sprite.setDepth(this.y);

    this._crearAnimaciones();
    this._t = 0; // acumulador para animación
  }

  _crearAnimaciones() {
    const anims = this.scene.anims;
    const dirs = ['abajo', 'arriba', 'izq', 'der'];
    dirs.forEach((d) => {
      const key = 'cam_' + d;
      if (anims.exists(key)) return;
      try {
        anims.create({
          key,
          frames: [
            { key: 'jugador_' + d + '_1' },
            { key: 'jugador_' + d + '_0' },
            { key: 'jugador_' + d + '_2' },
            { key: 'jugador_' + d + '_0' },
          ],
          frameRate: 8,
          repeat: -1,
        });
      } catch (e) {
        console.warn('[Jugador] No se pudo crear animación', key, e);
      }
    });
  }

  // Rectángulo de colisión del jugador (a sus pies), en píxeles.
  _puedeIr(nx, ny) {
    const T = AJ.CONFIG.TILE;
    // Caja de pies: 18px ancho, 10px alto centrada en los pies.
    const medioW = 9, alto = 8;
    const piesY = ny + 6;
    const esquinas = [
      [nx - medioW, piesY - alto], [nx + medioW, piesY - alto],
      [nx - medioW, piesY],        [nx + medioW, piesY],
    ];
    for (const [px, py] of esquinas) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (AJ.Mapa.esColision(tx, ty)) return false;
      // Colisión extra opcional (NPCs, objetos): la provee la escena.
      if (this.scene.esColisionExtra && this.scene.esColisionExtra(tx, ty)) return false;
    }
    return true;
  }

  // Tile que el jugador tiene "enfrente" (para interactuar).
  tileFrente() {
    const T = AJ.CONFIG.TILE;
    let tx = Math.floor(this.x / T), ty = Math.floor(this.y / T);
    if (this.dir === 'abajo') ty += 1;
    else if (this.dir === 'arriba') ty -= 1;
    else if (this.dir === 'izq') tx -= 1;
    else if (this.dir === 'der') tx += 1;
    return { x: tx, y: ty };
  }

  update(dt, input) {
    if (!input) return;
    let dx = 0, dy = 0;
    if (input.left)  { dx = -1; this.dir = 'izq'; }
    else if (input.right) { dx = 1; this.dir = 'der'; }
    else if (input.up)    { dy = -1; this.dir = 'arriba'; }
    else if (input.down)  { dy = 1; this.dir = 'abajo'; }

    this.moviendo = (dx !== 0 || dy !== 0);

    if (this.moviendo) {
      const v = AJ.CONFIG.VELOCIDAD * dt;
      const nx = this.x + dx * v;
      const ny = this.y + dy * v;
      // Mover por eje para poder "deslizar" contra paredes.
      if (dx !== 0 && this._puedeIr(nx, this.y)) this.x = nx;
      if (dy !== 0 && this._puedeIr(this.x, ny)) this.y = ny;

      const animKey = 'cam_' + this.dir;
      if (this.scene.anims.exists(animKey)) this.sprite.play(animKey, true);
    } else {
      this.sprite.anims.stop();
      this.sprite.setTexture('jugador_' + this.dir + '_0');
    }

    this.sprite.x = Math.round(this.x);
    this.sprite.y = Math.round(this.y);
    this.sprite.setDepth(this.y);
  }

  tilePos() {
    const T = AJ.CONFIG.TILE;
    return { x: Math.floor(this.x / T), y: Math.floor(this.y / T) };
  }
};
