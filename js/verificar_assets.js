/* =====================================================================
 * verificar_assets.js — Verificador de cobertura de arte (dev tool)
 * ---------------------------------------------------------------------
 * Recorre el inventario de texturas reemplazables (ver assets/MANIFIESTO.md),
 * intenta cargar cada PNG de /assets/tiles|sprites/ y reporta en consola
 * PASS (hay PNG) / FALTA (se usa el procedural), con el % de cobertura de arte.
 *
 * NO rompe nada si faltan PNGs: el fallback procedural (art.js) ya cubre todo.
 * Es 100% lectura: sólo prueba a cargar imágenes y loguea. No toca el juego.
 *
 * OPT-IN para no ensuciar la consola: probar ~170 PNGs inexistentes generaría
 * ~170 errores 404 por carga, rompiendo el invariante "abre sin errores en
 * consola". Por eso corre solo si CONFIG.dev && CONFIG.verificarAssets. Igual
 * podés correrlo a mano cuando quieras:  AJ.VerificarAssets.correr()
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.VerificarAssets = (function () {
  'use strict';

  // Inventario canónico (espejo de art.js / crafteo.js / brujula.js y de
  // assets/MANIFIESTO.md). Si agregás texturas al juego, actualizá esto.
  const TILES = [
    'pasto', 'tierra', 'vereda', 'agua', 'junco', 'arado', 'calden', 'plaza', 'monumento',
    'cultivo_0', 'cultivo_1', 'cultivo_2', 'cultivo_3',
    'casa_pared', 'casa_techo', 'casa_ventana', 'casa_puerta',
    'iglesia_pared', 'iglesia_techo', 'iglesia_ventana', 'iglesia_puerta',
    'muni_pared', 'muni_techo', 'muni_ventana', 'muni_puerta',
    'juventud_pared', 'juventud_techo', 'juventud_ventana', 'juventud_puerta',
    'almacen_pared', 'almacen_techo', 'almacen_ventana', 'almacen_puerta',
    'moneda', 'exclamacion', 'check',
    'mesa_crafteo',      // lo genera crafteo.js (16×16)
    'brujula_flecha',    // lo genera brujula.js (32×28, icono UI; NO se convirtió a 16)
  ];

  const SPRITE_BASES = [
    'jugador',
    'npc_intendenta', 'npc_cura', 'npc_almacenero', 'npc_maestra', 'npc_abuela', 'npc_chacarero',
    'npc_puestero', 'npc_pulpero', 'npc_maestrarural', 'npc_partera',
  ];
  const DIRS = ['abajo', 'arriba', 'izq', 'der'];
  const FRAMES = [0, 1, 2];

  function _sprites() {
    const out = [];
    SPRITE_BASES.forEach((base) => {
      DIRS.forEach((dir) => { FRAMES.forEach((f) => { out.push(base + '_' + dir + '_' + f); }); });
    });
    return out;
  }

  // Inventario completo, con su ruta (carpeta). Sincrónico (no carga nada).
  function inventario() {
    const tiles = TILES.map((n) => ({ nombre: n, carpeta: 'tiles', ruta: 'assets/tiles/' + n + '.png' }));
    const sprites = _sprites().map((n) => ({ nombre: n, carpeta: 'sprites', ruta: 'assets/sprites/' + n + '.png' }));
    return { tiles: tiles, sprites: sprites, todos: tiles.concat(sprites) };
  }

  // Prueba a cargar UN PNG. Resuelve true (existe) / false (falta). Nunca rechaza.
  function _probar(ruta) {
    return new Promise(function (resolve) {
      try {
        const img = new Image();
        let listo = false;
        const fin = (ok) => { if (!listo) { listo = true; resolve(ok); } };
        img.onload = () => fin(img.naturalWidth > 0);
        img.onerror = () => fin(false);
        img.src = ruta + '?v=' + (window.AJ && AJ.SAVE_KEY ? 'v1' : 'v1'); // sin Date.now (determinista)
      } catch (e) { resolve(false); }
    });
  }

  // Recorre el inventario, prueba cada PNG y reporta. opts.verbose (default true)
  // lista cada pieza; opts.soloPresentes lista sólo los PASS. Devuelve un resumen.
  function correr(opts) {
    opts = opts || {};
    const verbose = opts.verbose !== false;
    const inv = inventario();
    const piezas = inv.todos;
    return Promise.all(piezas.map((p) => _probar(p.ruta).then((ok) => ({ pieza: p, ok: ok }))))
      .then(function (resultados) {
        const porCarpeta = { tiles: { present: 0, total: 0, faltan: [], estan: [] }, sprites: { present: 0, total: 0, faltan: [], estan: [] } };
        resultados.forEach(function (r) {
          const c = porCarpeta[r.pieza.carpeta];
          c.total++;
          if (r.ok) { c.present++; c.estan.push(r.pieza.nombre); } else { c.faltan.push(r.pieza.nombre); }
        });
        const present = porCarpeta.tiles.present + porCarpeta.sprites.present;
        const total = piezas.length;
        const pct = total ? Math.round(present / total * 100) : 0;

        // --- Reporte en consola ---
        const titulo = 'font-weight:bold;';
        try {
          console.log('%c===== VERIFICADOR DE ASSETS (cobertura de arte) =====', titulo);
          ['tiles', 'sprites'].forEach(function (carpeta) {
            const c = porCarpeta[carpeta];
            console.log('%c/assets/' + carpeta + '/  →  ' + c.present + '/' + c.total + ' PNG',
              'font-weight:bold;color:#7bb8e0');
            if (verbose) {
              c.estan.forEach(function (n) { console.log('%cPASS%c  ' + n + '.png', 'color:#2ecc71;font-weight:bold', 'color:inherit'); });
              if (!opts.soloPresentes) {
                c.faltan.forEach(function (n) { console.log('%cFALTA%c ' + n + '.png  (usa procedural)', 'color:#e0a85a;font-weight:bold', 'color:inherit'); });
              }
            }
          });
          const color = pct >= 100 ? '#2ecc71' : (pct > 0 ? '#e0a85a' : '#9aa0a6');
          console.log('%c=> Cobertura de arte: ' + pct + '%  (' + present + '/' + total + ' PNG). El resto se dibuja por código.',
            'font-weight:bold;color:' + color);
          if (present === 0) {
            console.log('%c   (Todo procedural por ahora. Poné PNGs en /assets/ y listalos en assets/manifest.js — ver assets/README.md.)', 'color:#9aa0a6');
          }
        } catch (e) {}

        const resumen = {
          coberturaPct: pct, present: present, total: total,
          tiles: { present: porCarpeta.tiles.present, total: porCarpeta.tiles.total, faltan: porCarpeta.tiles.faltan },
          sprites: { present: porCarpeta.sprites.present, total: porCarpeta.sprites.total, faltan: porCarpeta.sprites.faltan },
        };
        AJ.ultimaVerificacionAssets = resumen;
        return resumen;
      })
      .catch(function (e) { console.warn('[VerificarAssets] falló la verificación', e); return null; });
  }

  return { inventario, correr, TILES: TILES, SPRITE_BASES: SPRITE_BASES };
})();

// Auto-run sólo si está pedido explícitamente (dev + flag), para no ensuciar la
// consola con 404s en cada carga. Igual: AJ.VerificarAssets.correr() a mano.
window.addEventListener('load', function () {
  try {
    if (window.AJ && AJ.CONFIG && AJ.CONFIG.dev && AJ.CONFIG.verificarAssets && AJ.VerificarAssets) {
      AJ.VerificarAssets.correr();
    }
  } catch (e) {}
});
