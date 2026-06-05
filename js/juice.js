/* =====================================================================
 * juice.js — "Jugo" visual: tweens, fades, shake, feedback (FASE P1)
 * ---------------------------------------------------------------------
 * BOLT-ON detrás de CONFIG.juice. Helpers centrales que CADA UNO chequea
 * el flag, así los llamados desde otros archivos son no-op cuando está
 * apagado (cero riesgo: si juice=false, todo funciona como antes).
 *
 * Todo con try/catch: si algo del juice falla, no rompe el juego.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.Juice = (function () {
  'use strict';

  function activo() { return !!(AJ.CONFIG && AJ.CONFIG.juice); }

  // Cámara entra desde negro al crear la escena.
  function fadeIn(scene, ms) {
    if (!activo() || !scene || !scene.cameras) return;
    try { scene.cameras.main.fadeIn(ms || 280, 0, 0, 0); } catch (e) {}
  }

  // Cambia de escena con fade a negro (con fallback por si el evento no llega).
  function irA(scene, key, data) {
    if (!activo()) { scene.scene.start(key, data); return; }
    try {
      const cam = scene.cameras.main;
      let saltó = false;
      const go = () => { if (saltó) return; saltó = true; scene.scene.start(key, data); };
      cam.once('camerafadeoutcomplete', go);
      cam.fadeOut(260, 0, 0, 0);
      scene.time.delayedCall(420, go); // fallback
    } catch (e) { scene.scene.start(key, data); }
  }

  // Reinicia la escena con fade (para el viaje entre pueblos).
  function reiniciar(scene, data) {
    if (!activo()) { scene.scene.restart(data); return; }
    try {
      const cam = scene.cameras.main;
      let saltó = false;
      const go = () => { if (saltó) return; saltó = true; scene.scene.restart(data); };
      cam.once('camerafadeoutcomplete', go);
      cam.fadeOut(220, 0, 0, 0);
      scene.time.delayedCall(360, go);
    } catch (e) { scene.scene.restart(data); }
  }

  // Sacudón sutil de cámara.
  function shake(scene, intensidad, ms) {
    if (!activo() || !scene || !scene.cameras) return;
    try { scene.cameras.main.shake(ms || 180, intensidad || 0.004); } catch (e) {}
  }

  // Aparición de un contenedor/objeto con un tween (escala + alpha).
  function aparecer(scene, obj, opts) {
    if (!obj) return;
    if (!activo()) { obj.setScale && obj.setScale(1); obj.setAlpha && obj.setAlpha(1); return; }
    try {
      const o = opts || {};
      obj.setAlpha(0);
      const ex = (obj.scaleX != null ? obj.scaleX : 1);
      const ey = (obj.scaleY != null ? obj.scaleY : 1);
      obj.setScale(ex * 0.92, ey * 0.92);
      scene.tweens.add({
        targets: obj, alpha: 1, scaleX: ex, scaleY: ey,
        duration: o.ms || 180, ease: 'Back.easeOut',
      });
    } catch (e) { try { obj.setAlpha(1); } catch (_) {} }
  }

  // Pulso rápido de un sprite (feedback al interactuar con un NPC).
  function pulso(scene, sprite) {
    if (!activo() || !sprite) return;
    try {
      const sx = sprite.scaleX || 1, sy = sprite.scaleY || 1;
      scene.tweens.add({
        targets: sprite, scaleX: sx * 1.14, scaleY: sy * 1.14,
        duration: 110, yoyo: true, ease: 'Quad.easeOut',
      });
    } catch (e) {}
  }

  // Celebración breve: estrellitas que estallan + shake suave.
  function celebrar(scene, x, y) {
    if (!activo() || !scene) return;
    try {
      shake(scene, 0.006, 220);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i) / n;
        const t = scene.add.text(x, y, '✨', { fontSize: '20px' })
          .setOrigin(0.5).setDepth(11000).setScrollFactor(0);
        scene.tweens.add({
          targets: t, x: x + Math.cos(ang) * 60, y: y + Math.sin(ang) * 60,
          alpha: 0, duration: 650, ease: 'Quad.easeOut',
          onComplete: () => t.destroy(),
        });
      }
    } catch (e) {}
  }

  return { activo, fadeIn, irA, reiniciar, shake, aparecer, pulso, celebrar };
})();
