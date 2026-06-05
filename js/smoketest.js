/* =====================================================================
 * smoketest.js — Autotest de invariantes (modo dev)
 * ---------------------------------------------------------------------
 * Corre solo al cargar la escena Pueblo (si CONFIG.dev). Verifica que las
 * piezas críticas estén vivas e imprime un reporte PASS/FAIL en consola.
 * No toca el estado real del jugador: el test de guardado usa una clave
 * aparte.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.SmokeTest = (function () {
  'use strict';

  function correr(escena) {
    const r = [];

    // El autotest NO debe ensuciar el estado real del jugador: las pruebas de
    // granja/tiempo mutan economía y reloj. Snapshot + restore al final.
    let snap = null;
    try {
      if (escena && escena.estado) {
        snap = {
          monedas: escena.estado.inventario ? escena.estado.inventario.monedas : undefined,
          minutos: escena.estado.tiempo ? escena.estado.tiempo.minutos : undefined,
          granja: JSON.stringify(escena.estado.granja || {}),
          afinidad: JSON.stringify(escena.estado.afinidad || {}),
          items: JSON.stringify((escena.estado.inventario && escena.estado.inventario.items) || {}),
        };
      }
    } catch (e) { snap = null; }
    const check = (nombre, fn) => {
      let ok = false, detalle = '';
      try {
        const res = fn();
        if (typeof res === 'string') { ok = false; detalle = res; } // string = motivo de falla
        else { ok = !!res || res === undefined; }                   // truthy (u omitido) = PASS
      } catch (e) { ok = false; detalle = (e && e.message) || String(e); }
      r.push({ nombre, ok, detalle });
    };

    // 1. Phaser y juego
    check('Phaser cargado', () => typeof Phaser !== 'undefined');
    check('Escena Pueblo activa', () => escena && escena.scene.key === 'Pueblo');

    // 2. Mapa
    check('Mapa cargó (40x30)', () =>
      AJ.Mapa && AJ.Mapa.tex.length === AJ.Mapa.ALTO && AJ.Mapa.tex[0].length === AJ.Mapa.ANCHO);
    check('Mapa tiene colisiones', () => {
      let n = 0;
      for (let y = 0; y < AJ.Mapa.ALTO; y++) for (let x = 0; x < AJ.Mapa.ANCHO; x++) if (AJ.Mapa.col[y][x]) n++;
      return n > 50 ? true : 'Pocas colisiones: ' + n;
    });

    // 3. Arte generado
    check('Texturas base existen', () => {
      const claves = ['pasto', 'tierra', 'vereda', 'agua', 'calden', 'jugador_abajo_0'];
      const faltan = claves.filter((c) => !escena.textures.exists(c));
      return faltan.length === 0 ? true : 'Faltan: ' + faltan.join(', ');
    });

    // 4. Jugador
    check('Jugador existe', () => escena.jugador && escena.jugador.sprite);
    check('Jugador dentro del mapa', () => {
      const p = escena.jugador.tilePos();
      return AJ.Mapa.dentro(p.x, p.y) && !AJ.Mapa.esColision(p.x, p.y)
        ? true : 'Spawn inválido en ' + p.x + ',' + p.y;
    });

    // 5. Cámara
    check('Cámara sigue al jugador', () =>
      escena.cameras.main._follow === escena.jugador.sprite);

    // 6. Guardado: escribe y lee (con clave de prueba aparte)
    check('Guardado escribe y lee', () => {
      const original = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = original + '__smoketest';
        const est = AJ.Guardado.estadoNuevo();
        est.inventario.monedas = 1234;
        AJ.Guardado.guardar(est);
        const leido = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return leido && leido.inventario.monedas === 1234
          ? true : 'No coincide lo leído';
      } finally {
        AJ.SAVE_KEY = original;
      }
    });

    // 7. Sistemas activos: cada flag en true debe haberse inicializado
    Object.keys(escena.sistemas || {}).forEach((nombre) => {
      if (AJ.CONFIG[nombre]) {
        check('Sistema "' + nombre + '" inició', () =>
          escena.sistemas[nombre] === true ? true : 'No inició');
      }
    });

    // ¿Este pueblo tiene NPCs? (FASE D: la Colonia no.) Algunos checks de NPC
    // sólo aplican donde hay vecinos.
    const conNPCs = !AJ.Mapa.meta || AJ.Mapa.meta.conNPCs !== false;

    // 8. FASE 2: NPCs y diálogo (si el flag está activo)
    if (AJ.CONFIG.npcsDialogo) {
      check('Diálogo disponible', () => escena.dialogo && typeof escena.dialogo.mostrar === 'function');
      if (conNPCs) {
        check('NPCs creados', () => {
          const n = escena.npcManager && escena.npcManager.npcs.length;
          return n >= 5 ? true : 'Hay ' + (n || 0) + ' NPCs';
        });
        check('NPCs colisionan (no se atraviesan)', () =>
          escena.npcManager && escena.npcManager.npcs.length > 0 &&
          escena.esColisionExtra(escena.npcManager.npcs[0].tx, escena.npcManager.npcs[0].ty) === true);
      }
    }

    // 9. FASE 2: misiones
    if (AJ.CONFIG.misiones) {
      check('Misiones definidas (>=4)', () => AJ.MISIONES && AJ.MISIONES.length >= 4
        ? true : 'Hay ' + (AJ.MISIONES ? AJ.MISIONES.length : 0));
      check('Sistema de misiones vivo', () => escena.misiones && escena.misiones.hud);
      if (conNPCs) check('Cadena de misiones consistente', () => {
        // Cada misión referencia NPCs que existen.
        if (!escena.npcManager) return 'sin npcManager';
        const ids = escena.npcManager.npcs.map((n) => n.id);
        const malas = AJ.MISIONES.filter((m) =>
          ids.indexOf(m.npcInicio) < 0 || ids.indexOf(m.objetivoNpc) < 0 || ids.indexOf(m.npcFin) < 0);
        return malas.length === 0 ? true : 'NPC inexistente en: ' + malas.map((m) => m.id).join(',');
      });
    }

    // 10. FASE 3: día/noche
    if (AJ.CONFIG.diaNoche) {
      check('Reloj y tinte creados', () => escena.diaNoche && escena.diaNoche.overlay && escena.diaNoche.reloj);
      check('El tiempo avanza', () => {
        if (!escena.diaNoche) return 'sin sistema';
        const antes = escena.diaNoche.estado.tiempo.minutos;
        escena.diaNoche.update(1.0); // simula 1 seg
        const desp = escena.diaNoche.estado.tiempo.minutos;
        return desp > antes ? true : 'no avanzó (' + antes + '->' + desp + ')';
      });
    }

    // 11. FASE 4: granja
    if (AJ.CONFIG.granja) {
      check('Parcela y cultivos listos', () => {
        const g = escena.granja;
        return g && AJ.Mapa.meta.granja && Object.keys(g.cropSprites).length > 0
          ? true : 'sin parcela';
      });
      check('Plantar → crecer → cosechar paga monedas', () => {
        const g = escena.granja;
        if (!g) return 'sin granja';
        const p = AJ.Mapa.meta.granja;
        const tx = p.x, ty = p.y, key = tx + ',' + ty;
        const monedas0 = escena.estado.inventario.monedas || 0;
        // limpiar ese tile por si había algo
        delete escena.estado.granja[key];
        const plantado = g.intentarInteractuar(tx, ty); // planta
        if (!plantado || !escena.estado.granja[key]) return 'no plantó';
        // forzar crecimiento a maduro
        const paso = AJ.CONFIG.SEG_CRECIMIENTO_CULTIVO;
        g.update(paso * 3 + 1);
        if (escena.estado.granja[key].etapa < g.ETAPA_MADURO) return 'no maduró';
        const cosechado = g.intentarInteractuar(tx, ty); // cosecha
        const monedas1 = escena.estado.inventario.monedas || 0;
        return (cosechado && monedas1 === monedas0 + g.MONEDAS_COSECHA && !escena.estado.granja[key])
          ? true : 'cosecha no pagó (' + monedas0 + '->' + monedas1 + ')';
      });
    }

    // 12. FASE A: rutinas + afinidad (sólo donde hay NPCs)
    if (AJ.CONFIG.rutinas && conNPCs) {
      check('Rutinas y afinidad vivas', () =>
        escena.rutinas && escena.afinidad && Object.keys(escena.rutinas.def).length > 0
          ? true : 'sin sistema');
      check('Cada NPC tiene rutina (trabajo/social/hogar)', () => {
        if (!escena.rutinas) return 'sin rutinas';
        const ids = escena.npcManager.npcs.map((n) => n.id);
        const malas = ids.filter((id) => {
          const d = escena.rutinas.def[id];
          return !d || !d.trabajo || !d.social || !d.hogar;
        });
        return malas.length === 0 ? true : 'sin rutina: ' + malas.join(',');
      });
      check('El NPC camina hacia su destino', () => {
        if (!escena.rutinas) return 'sin rutinas';
        const n = escena.npcManager.npcs[0];
        const rec = escena.rutinas.rec[n.id];
        if (!rec) return 'sin rec';
        const px0 = rec.px, py0 = rec.py, tx0 = n.tx, ty0 = n.ty;
        // Forzar destino lejano (esquina de plaza) y tickear varias veces.
        const destino = { x: 19, y: 17 };
        const orig = escena.rutinas._target;
        escena.rutinas._target = () => destino;
        for (let i = 0; i < 40; i++) { escena.rutinas.acc = 1; escena.rutinas.update(0.05); }
        escena.rutinas._target = orig;
        const movio = Math.abs(rec.px - px0) > 1 || Math.abs(rec.py - py0) > 1;
        // restaurar posición del NPC para no dejarlo corrido
        rec.px = px0; rec.py = py0;
        n.sprite.x = px0; n.sprite.y = py0;
        if (n.tx !== tx0 || n.ty !== ty0) escena.npcManager.reubicar(n, tx0, ty0);
        return movio ? true : 'no se movió';
      });
      check('Hablar sube la afinidad (capeada, 1/día)', () => {
        const af = escena.afinidad;
        if (!af) return 'sin afinidad';
        const n = escena.npcManager.npcs[0];
        const v0 = af.nivel(n.id);
        af.ultimaCharlaDia[n.id] = -1; // permitir bump
        af.alHablar(n);
        const v1 = af.nivel(n.id);
        af.alHablar(n); // segunda charla mismo día: no debe subir
        const v2 = af.nivel(n.id);
        return (v1 === Math.min(af.MAX, v0 + af.BUMP_HABLAR) && v2 === v1)
          ? true : 'bump raro (' + v0 + '->' + v1 + '->' + v2 + ')';
      });
    }

    // 13. FASE B: estaciones
    if (AJ.CONFIG.estaciones) {
      check('Estaciones vivas (overlay + cartel)', () =>
        escena.estaciones && escena.estaciones.overlay && escena.estaciones.cartel ? true : 'sin sistema');
      check('Estación correcta según el día', () => {
        const E = escena.estaciones;
        if (!E) return 'sin sistema';
        const dpe = E.DIAS_POR_ESTACION;
        // día 1 -> Primavera(0); día dpe+1 -> Verano(1); etc.
        const orig = escena.diaNoche ? escena.diaNoche.dia : null;
        const probar = (dia, esp) => {
          if (escena.diaNoche) escena.diaNoche.dia = dia; else E.estado.tiempo.dia = dia;
          return E.indice() === esp;
        };
        const ok = probar(1, 0) && probar(dpe + 1, 1) && probar(2 * dpe + 1, 2) &&
                   probar(3 * dpe + 1, 3) && probar(4 * dpe + 1, 0);
        if (escena.diaNoche && orig != null) escena.diaNoche.dia = orig; // restaurar
        return ok ? true : 'mapa día→estación mal';
      });
      check('El factor de crecimiento varía por estación', () => {
        const factores = AJ.Estaciones.DATA.map((d) => d.factor);
        const distintos = new Set(factores).size;
        return distintos >= 3 ? true : 'factores poco variados';
      });
    }

    // 14. FASE C: crafteo
    if (AJ.CONFIG.crafteo) {
      check('Mesa de crafteo lista', () =>
        escena.crafteo && escena.crafteo.mesaTile && escena.crafteo.sprite &&
        !AJ.Mapa.esColision(escena.crafteo.mesaTile.x, escena.crafteo.mesaTile.y)
          ? true : 'mesa en tile inválido');
      check('Recetas definidas (>=4)', () => AJ.RECETAS && AJ.RECETAS.length >= 4
        ? true : 'hay ' + (AJ.RECETAS ? AJ.RECETAS.length : 0));
      check('Juntar leña de un caldén (1/día)', () => {
        const c = escena.crafteo;
        if (!c) return 'sin crafteo';
        // buscar un caldén
        let cx = -1, cy = -1;
        for (let y = 0; y < AJ.Mapa.ALTO && cx < 0; y++)
          for (let x = 0; x < AJ.Mapa.ANCHO; x++)
            if (AJ.Mapa.tex[y][x] === 'calden') { cx = x; cy = y; break; }
        if (cx < 0) return 'no hay caldenes';
        const l0 = c._cant('lena');
        c.lenaPorDia[cx + ',' + cy] = -1; // permitir
        c.intentarInteractuar(cx, cy);
        const l1 = c._cant('lena');
        c.intentarInteractuar(cx, cy); // segunda vez mismo día: no suma
        const l2 = c._cant('lena');
        return (l1 === l0 + 1 && l2 === l1) ? true : 'leña rara (' + l0 + '->' + l1 + '->' + l2 + ')';
      });
      check('Craftear consume y produce', () => {
        const c = escena.crafteo;
        if (!c) return 'sin crafteo';
        const rec = AJ.RECETAS.find((r) => r.id === 'mermelada'); // 3 verdura -> 30 monedas
        c.estado.inventario.items.verdura = 3;
        const m0 = c.estado.inventario.monedas || 0;
        const ok = c.craftear(rec);
        const v = c._cant('verdura'), m1 = c.estado.inventario.monedas || 0;
        const logro = c.estado.inventario.logros.indexOf(rec.logro) >= 0;
        return (ok && v === 0 && m1 === m0 + 30 && logro) ? true
          : 'craft mal (ok=' + ok + ' v=' + v + ' m=' + m0 + '->' + m1 + ')';
      });
      check('No craftear sin ingredientes', () => {
        const c = escena.crafteo;
        if (!c) return 'sin crafteo';
        c.estado.inventario.items.lena = 0;
        const rec = AJ.RECETAS.find((r) => r.id === 'fardo'); // 4 leña
        return c.craftear(rec) === false ? true : 'crafteó sin leña';
      });
    }

    // 15. FASE D: viaje entre pueblos (sin llamar cargar: no corromper la escena)
    if (AJ.CONFIG.viaje) {
      check('Multi-pueblo disponible', () => typeof AJ.Mapa.cargar === 'function' &&
        typeof AJ.Mapa.salidaEn === 'function' ? true : 'sin API de viaje');
      check('El pueblo activo coincide con el estado', () =>
        AJ.Mapa.actual === escena.estado.mapaActual
          ? true : 'mapa ' + AJ.Mapa.actual + ' != estado ' + escena.estado.mapaActual);
      check('Salidas con destino y llegada definidos', () => {
        const sal = AJ.Mapa.meta.salidas || [];
        if (sal.length === 0) return 'sin salidas';
        const malas = sal.filter((s) => !s.destino || !s.llegada ||
          typeof s.llegada.x !== 'number' || typeof s.llegada.y !== 'number');
        return malas.length === 0 ? true : 'salida mal definida';
      });
      check('mapaActual se guarda', () =>
        typeof escena.estado.mapaActual === 'number' ? true : 'sin mapaActual');
    }

    // 16. P1: juice (visual, no debe romper nada)
    if (AJ.CONFIG.juice) {
      check('Juice disponible y sano', () => {
        if (!AJ.Juice || !AJ.Juice.activo()) return 'sin Juice';
        // ninguna de estas llamadas debe lanzar (sobre un objeto descartable
        // para no alterar el HUD real)
        const tmp = escena.add.text(-9999, -9999, '.', {}).setVisible(false);
        AJ.Juice.shake(escena, 0.001, 1);
        AJ.Juice.aparecer(escena, tmp);
        AJ.Juice.pulso(escena, tmp);
        escena.tweens.killTweensOf(tmp); tmp.destroy();
        return true;
      });
    }

    // 17. P2: sonido (no debe romper aunque el audio esté bloqueado)
    if (AJ.CONFIG.sonido) {
      check('Sonido disponible y sano', () => {
        if (!AJ.Sonido) return 'sin Sonido';
        const fns = ['paso', 'dialogo', 'cosecha', 'mision', 'click'];
        const faltan = fns.filter((f) => typeof AJ.Sonido[f] !== 'function');
        if (faltan.length) return 'faltan: ' + faltan.join(',');
        // llamarlas no debe lanzar (son no-op si el contexto no corre)
        fns.forEach((f) => AJ.Sonido[f]());
        // toggle de mute reversible
        const m0 = AJ.Sonido.estaMuteado();
        AJ.Sonido.toggleMute(); const m1 = AJ.Sonido.estaMuteado();
        AJ.Sonido.setMute(m0); // restaurar
        return (m1 === !m0) ? true : 'mute no togglea';
      });
    }

    // Restaurar el estado que pudieron tocar las pruebas mutadoras.
    try {
      if (snap && escena && escena.estado) {
        if (snap.items !== undefined && escena.estado.inventario)
          escena.estado.inventario.items = JSON.parse(snap.items);
        if (snap.monedas !== undefined && escena.estado.inventario)
          escena.estado.inventario.monedas = snap.monedas;
        if (snap.minutos !== undefined && escena.estado.tiempo)
          escena.estado.tiempo.minutos = snap.minutos;
        escena.estado.granja = JSON.parse(snap.granja);
        if (snap.afinidad !== undefined) escena.estado.afinidad = JSON.parse(snap.afinidad);
        // Re-sincronizar la vista de la granja con el estado restaurado.
        if (escena.granja && escena.granja.cropSprites) {
          Object.keys(escena.granja.cropSprites).forEach((k) => {
            const c = escena.estado.granja[k];
            const s = escena.granja.cropSprites[k];
            if (c) s.setTexture('cultivo_' + Math.min(3, c.etapa)).setVisible(true);
            else s.setVisible(false);
          });
        }
        if (escena._actualizarHUD) escena._actualizarHUD();
      }
    } catch (e) { console.warn('[SmokeTest] no se pudo restaurar estado', e); }

    // --- Reporte ---
    const pasados = r.filter((x) => x.ok).length;
    const total = r.length;
    const estilo = 'font-weight:bold;';
    console.log('%c===== SMOKE TEST: Agente Juvenil – La Pampa =====', estilo);
    r.forEach((x) => {
      const tag = x.ok ? '%cPASS' : '%cFAIL';
      const color = x.ok ? 'color:#2ecc71;font-weight:bold' : 'color:#e74c3c;font-weight:bold';
      console.log(tag + '%c  ' + x.nombre + (x.detalle ? '  → ' + x.detalle : ''),
        color, 'color:inherit');
    });
    const todoOk = pasados === total;
    console.log('%c=> ' + pasados + '/' + total + (todoOk ? ' TODO PASS ✓' : ' CON FALLAS ✗'),
      'font-weight:bold;color:' + (todoOk ? '#2ecc71' : '#e74c3c'));

    AJ.ultimoSmoke = { pasados, total, todoOk, items: r };
    return AJ.ultimoSmoke;
  }

  return { correr };
})();
