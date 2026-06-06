/* =====================================================================
 * assets/manifest.js — Manifiesto de arte (Capa F2)
 * ---------------------------------------------------------------------
 * Lista los NOMBRES EXACTOS de textura que tengas como PNG en /assets.
 * El juego (con CONFIG.capaArte en true) carga esos PNG y, para todo lo
 * que NO esté listado, usa el generador procedural de art.js.
 *
 * CÓMO AGREGAR ARTE REAL (sin tocar el resto del código):
 *   1. Guardá el PNG con el nombre EXACTO de la textura:
 *        - tiles  -> /assets/tiles/<nombre>.png     (32x32)
 *        - sprites -> /assets/sprites/<nombre>.png   (32x48, 1 frame por archivo)
 *   2. Agregá ese <nombre> al array correspondiente de abajo.
 *   3. Listo: el juego lo levanta solo. Lo no listado sigue siendo procedural.
 *
 * Por qué un manifiesto y no "probar y caer": probar a ciegas 40+ PNGs
 * inexistentes ensucia la consola con 404. El manifiesto mantiene la regla
 * "abre sin errores en consola". Ver ARTE.md.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.ASSET_MANIFEST = {
  tiles: [],   // p. ej. ['pasto', 'tierra', 'agua']
  sprites: [], // p. ej. ['jugador_abajo_0', 'npc_cura_abajo_0']
};
