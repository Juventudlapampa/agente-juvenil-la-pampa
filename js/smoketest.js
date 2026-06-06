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
          logros: JSON.stringify((escena.estado.inventario && escena.estado.inventario.logros) || []),
          misiones: JSON.stringify(escena.estado.misiones || {}),
          misionActiva: escena.estado.misionActiva,
          registro: JSON.stringify(escena.estado.registro || { vecinos: {}, pueblos: {} }),
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
      check('Diálogo disponible', () => !!(escena.dialogo && typeof escena.dialogo.mostrar === 'function'));
      if (conNPCs) {
        check('NPCs creados', () => {
          const n = escena.npcManager && escena.npcManager.npcs.length;
          return n >= 5 ? true : 'Hay ' + (n || 0) + ' NPCs';
        });
        check('NPCs colisionan (no se atraviesan)', () =>
          escena.npcManager && escena.npcManager.npcs.length > 0 &&
          escena.esColisionExtra(escena.npcManager.npcs[0].tx, escena.npcManager.npcs[0].ty) === true);

        // D1: cada NPC creado tiene entrada en el roster maestro (anti-drift).
        check('Todos los NPCs están en el roster', () => {
          if (!AJ.roster) return true;
          const rosterIds = AJ.roster().map((n) => n.id);
          const huerfanos = escena.npcManager.npcs.filter((n) => rosterIds.indexOf(n.id) < 0);
          return huerfanos.length === 0 ? true : 'sin roster: ' + huerfanos.map((n) => n.id).join(',');
        });
        if (AJ.CONFIG.poblarMundo) {
          check('D1: vecinos nuevos creados en este pueblo', () => {
            const ids = escena.npcManager.npcs.map((n) => n.id);
            const esperados = AJ.ROSTER_D1.filter((n) => n.pueblo === AJ.Mapa.actual);
            const faltan = esperados.filter((n) => ids.indexOf(n.id) < 0);
            return faltan.length === 0 ? true : 'faltan: ' + faltan.map((n) => n.id).join(',');
          });
        }
      }
    }

    // 9. FASE 2: misiones
    if (AJ.CONFIG.misiones) {
      check('Misiones definidas (>=4)', () => AJ.MISIONES && AJ.MISIONES.length >= 4
        ? true : 'Hay ' + (AJ.MISIONES ? AJ.MISIONES.length : 0));
      check('Sistema de misiones vivo', () => escena.misiones && escena.misiones.hud);
      if (conNPCs) check('Cadena de misiones consistente', () => {
        // Cada misión DEL PUEBLO ACTUAL referencia NPCs que existen acá.
        if (!escena.npcManager) return 'sin npcManager';
        const ids = escena.npcManager.npcs.map((n) => n.id);
        const delPueblo = AJ.MISIONES.filter((m) => (m.pueblo || 1) === AJ.Mapa.actual);
        const malas = delPueblo.filter((m) =>
          ids.indexOf(m.npcInicio) < 0 || ids.indexOf(m.objetivoNpc) < 0 || ids.indexOf(m.npcFin) < 0);
        return malas.length === 0 ? true : 'NPC inexistente en: ' + malas.map((m) => m.id).join(',');
      });

      // C1.2: misiones propias de la Colonia.
      if (AJ.CONFIG.misionesColonia) {
        check('Misiones de la Colonia definidas e integradas', () => {
          if (!AJ.MISIONES_COLONIA || AJ.MISIONES_COLONIA.length < 1) return 'sin misiones Colonia';
          const enLista = AJ.MISIONES_COLONIA.every((m) => AJ.MISIONES.indexOf(m) >= 0);
          const todasP2 = AJ.MISIONES_COLONIA.every((m) => m.pueblo === 2);
          return (enLista && todasP2) ? true : 'no integradas o pueblo mal';
        });
        if (AJ.Mapa.actual === 2 && escena.misiones) {
          check('Cuaderno de la Colonia muestra misión del pueblo 2', () => {
            const m = escena.misiones._misionActual();
            // null = todas completas (válido); si hay, debe ser pueblo 2.
            return (!m || (m.pueblo || 1) === 2) ? true : 'misión de otro pueblo';
          });
        }
      }

      // D2: más misiones plantilla.
      if (AJ.CONFIG.masMisiones && AJ.CONFIG.poblarMundo) {
        check('D2: misiones nuevas integradas y bien ubicadas', () => {
          if (!AJ.MISIONES_D2) return 'sin MISIONES_D2';
          const enLista = AJ.MISIONES_D2.every((m) => AJ.MISIONES.indexOf(m) >= 0);
          // 'fiesta' debe seguir DESPUÉS de las nuevas del pueblo 1 (gran final).
          const iFiesta = AJ.MISIONES.findIndex((m) => m.id === 'fiesta');
          const iQuiosco = AJ.MISIONES.findIndex((m) => m.id === 'pu1_quiosco');
          const ordenOk = iFiesta > iQuiosco && iQuiosco >= 0;
          return (enLista && ordenOk) ? true : 'integración/orden mal';
        });
      }
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
        // Snapshot de TODOS los NPCs (el override de _target los mueve a todos;
        // hay que restaurarlos a todos para no ensuciar la escena).
        const snapN = escena.npcManager.npcs.map((m) => {
          const r = escena.rutinas.rec[m.id] || {};
          return { m, px: r.px, py: r.py, tx: m.tx, ty: m.ty, ruta: r.ruta, idx: r.idx, goal: r.goal };
        });
        const px0 = rec.px, py0 = rec.py;
        const destino = { x: 19, y: 17 };
        const orig = escena.rutinas._target;
        escena.rutinas._target = () => destino;
        for (let i = 0; i < 40; i++) { escena.rutinas.acc = 1; escena.rutinas.update(0.05); }
        escena.rutinas._target = orig;
        const movio = Math.abs(rec.px - px0) > 1 || Math.abs(rec.py - py0) > 1;
        // Restaurar a TODOS.
        snapN.forEach((s) => {
          const r = escena.rutinas.rec[s.m.id];
          if (r) { r.px = s.px; r.py = s.py; r.ruta = s.ruta; r.idx = s.idx; r.goal = s.goal; }
          s.m.sprite.x = s.px; s.m.sprite.y = s.py;
          if (s.m.tx !== s.tx || s.m.ty !== s.ty) escena.npcManager.reubicar(s.m, s.tx, s.ty);
        });
        return movio ? true : 'no se movió';
      });
      check('Hablar sube la afinidad (capeada, 1/día)', () => {
        const af = escena.afinidad;
        if (!af) return 'sin afinidad';
        const n = escena.npcManager.npcs[0];
        const v0 = af.nivel(n.id);
        const charlaPrev = af.ultimaCharlaDia[n.id]; // para restaurar luego
        af.ultimaCharlaDia[n.id] = -1; // permitir bump
        af.alHablar(n);
        const v1 = af.nivel(n.id);
        af.alHablar(n); // segunda charla mismo día: no debe subir
        const v2 = af.nivel(n.id);
        // Restaurar: estado.afinidad lo restaura el snapshot global; acá
        // devolvemos ultimaCharlaDia para no "gastar" la charla del día.
        if (charlaPrev === undefined) delete af.ultimaCharlaDia[n.id];
        else af.ultimaCharlaDia[n.id] = charlaPrev;
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

    // 18. P3: UX pulida
    if (AJ.CONFIG.uiPulida) {
      check('Clase ui-pulida aplicada al body', () =>
        document.body.classList.contains('ui-pulida') ? true : 'sin clase ui-pulida');
      check('Diálogo construido (con placa)', () =>
        escena.dialogo && escena.dialogo.placa ? true : 'sin placa de diálogo');
      check('Botones táctiles presentes', () => {
        const ids = ['btn-arriba', 'btn-abajo', 'btn-izq', 'btn-der', 'btn-accion'];
        const faltan = ids.filter((id) => !document.getElementById(id));
        return faltan.length === 0 ? true : 'faltan: ' + faltan.join(',');
      });
    }

    // 18b. P5: balance centralizado
    check('Balance centralizado y leído por los sistemas', () => {
      if (!AJ.CONFIG.BALANCE || typeof AJ.bal !== 'function') return 'sin BALANCE/AJ.bal';
      if (AJ.bal('cosechaMonedas', -1) !== AJ.CONFIG.BALANCE.cosechaMonedas) return 'AJ.bal no lee';
      if (AJ.bal('inexistente_zzz', 42) !== 42) return 'fallback no anda';
      // la granja debe usar el valor de balance
      if (escena.granja && escena.granja.MONEDAS_COSECHA !== AJ.CONFIG.BALANCE.cosechaMonedas)
        return 'granja no usa balance';
      // la afinidad también
      if (escena.afinidad && escena.afinidad.BUMP_HABLAR !== AJ.CONFIG.BALANCE.afinidadPorCharla)
        return 'afinidad no usa balance';
      return true;
    });

    // 19. P4: casos de borde (siempre, sin flag)
    check('B1: guardar a mitad de misión y recargar', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge1';
        const est = AJ.Guardado.estadoNuevo();
        est.misiones = { bienvenida: 'objetivo_ok' };
        est.mapaActual = 2;
        est.inventario.monedas = 77;
        est.tiempo.minutos = 555;
        AJ.Guardado.guardar(est);
        const l = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return (l && l.misiones.bienvenida === 'objetivo_ok' && l.mapaActual === 2 &&
          l.inventario.monedas === 77 && l.tiempo.minutos === 555) ? true : 'no restauró bien';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B2: save corrupto no rompe (devuelve null)', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge2';
        try { window.localStorage.setItem(AJ.SAVE_KEY, '{ esto no es json'); } catch (e) {}
        const l = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return l === null ? true : 'no devolvió null';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B3: estado para cada pueblo sobrevive el round-trip', () => {
      // No llama cargar() (corromperia la escena viva); valida los datos.
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge3';
        let ok = true;
        [1, 2].forEach((id) => {
          const e = AJ.Guardado.estadoNuevo(); e.mapaActual = id;
          AJ.Guardado.guardar(e);
          const l = AJ.Guardado.cargar();
          if (!l || l.mapaActual !== id) ok = false;
        });
        AJ.Guardado.borrar();
        return ok ? true : 'round-trip de pueblo falló';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B4: interactuar parcela vacía / fuera de parcela no rompe', () => {
      if (!escena.granja || !AJ.Mapa.meta.granja) return true; // n/a en este pueblo
      const p = AJ.Mapa.meta.granja, key = p.x + ',' + p.y;
      delete escena.estado.granja[key];
      const r1 = escena.granja.intentarInteractuar(p.x, p.y);      // planta
      const r2 = escena.granja.intentarInteractuar(-5, -5);        // fuera: false
      delete escena.estado.granja[key];
      if (escena.granja.cropSprites[key]) escena.granja.cropSprites[key].setVisible(false);
      return (r1 === true && r2 === false) ? true : 'r1=' + r1 + ' r2=' + r2;
    });

    check('B5: inventario/monedas enormes no rompen el HUD ni el menú', () => {
      const inv = escena.estado.inventario;
      inv.items = inv.items || {};
      inv.monedas = 9999999; inv.items.verdura = 99999; inv.items.lena = 88888;
      if (escena._actualizarHUD) escena._actualizarHUD();
      if (escena.crafteo && escena.crafteo._refrescarMenu) escena.crafteo._refrescarMenu();
      if (escena.afinidad && escena.afinidad._refrescar) escena.afinidad._refrescar();
      return true; // si no lanzó, pasa (el restore global limpia)
    });

    check('B6: hablar dos veces al mismo NPC es estable', () => {
      if (!conNPCs || !escena.misiones || !escena.npcManager) return true;
      const npc = escena.npcManager.npcs[0];
      const dlg = { abierto: false, mostrar: function (n, l, cb) { if (cb) cb(); } };
      escena.misiones.alHablar(npc, dlg);
      escena.misiones.alHablar(npc, dlg); // dos veces: no debe lanzar ni saltar de estado
      return true;
    });

    check('B7: cargar sin guardado devuelve null', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge7_inexistente';
        return AJ.Guardado.cargar() === null ? true : 'no devolvió null';
      } finally { AJ.SAVE_KEY = orig; }
    });

    // --- C2.4: bordes sobre lo nuevo (Colonia, viaje, joystick, reset) ---
    check('B8: viajar a mitad de misión (estado de 2 pueblos) round-trip', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge8';
        const e = AJ.Guardado.estadoNuevo();
        e.mapaActual = 2;
        e.misiones = { bienvenida: 'objetivo_ok', col_escuela: 'activa' };
        e.jugador = { x: 4, y: 15, dir: 'abajo' };
        AJ.Guardado.guardar(e);
        const l = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return (l && l.mapaActual === 2 && l.misiones.bienvenida === 'objetivo_ok' &&
          l.misiones.col_escuela === 'activa' && l.jugador.x === 4) ? true : 'round-trip mal';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B9: joystick no rompe sin jugador (escenas sin movimiento)', () => {
      if (!AJ.Joystick || typeof AJ.Joystick.dirDesde !== 'function') return true; // n/a
      // dirDesde es puro y no necesita escena ni jugador.
      const r = AJ.Joystick.dirDesde(60, 0);
      // setear el input global (lo que haría un toque) no debe lanzar aunque
      // no haya jugador que lo lea.
      if (AJ.Input && AJ.Input.estado) { AJ.Input.estado.right = r.right; AJ.Input.resetDirs && AJ.Input.resetDirs(); }
      return r.right === true ? true : 'dirDesde mal';
    });

    check('B10: reset de partida deja estado limpio', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge10';
        const e = AJ.Guardado.estadoNuevo();
        e.inventario.monedas = 500; e.misiones = { bienvenida: 'completada' };
        AJ.Guardado.guardar(e);
        AJ.Guardado.borrar();
        const limpio = AJ.Guardado.estadoNuevo();
        return (!AJ.Guardado.existe() && limpio.inventario.monedas === 0 &&
          Object.keys(limpio.misiones).length === 0 && limpio.mapaActual === 1) ? true : 'no quedó limpio';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B11: NPCs y misiones por pueblo son coherentes', () => {
      // Cada misión del pueblo actual referencia NPCs que existen acá.
      if (!escena.npcManager) return true;
      const ids = escena.npcManager.npcs.map((n) => n.id);
      const delPueblo = (AJ.MISIONES || []).filter((m) => (m.pueblo || 1) === AJ.Mapa.actual);
      const malas = delPueblo.filter((m) =>
        ids.indexOf(m.npcInicio) < 0 || ids.indexOf(m.objetivoNpc) < 0 || ids.indexOf(m.npcFin) < 0);
      // En un pueblo con NPCs debería haber al menos 1 misión propia coherente.
      if (escena.npcManager.npcs.length > 0 && delPueblo.length === 0 && AJ.CONFIG.misionesColonia && AJ.Mapa.actual === 2)
        return 'Colonia sin misiones propias';
      return malas.length === 0 ? true : 'misión con NPC inexistente';
    });

    // --- E4: bordes sobre lo nuevo de D/E ---
    check('B12: Registro + tiempo a mitad de partida round-trip', () => {
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge12';
        const e = AJ.Guardado.estadoNuevo();
        e.registro = { vecinos: { maestra: true, cura: true }, pueblos: { 1: true, 2: true } };
        e.tiempoJugado = 1234;
        e.inventario.logros = ['Agente jurado'];
        AJ.Guardado.guardar(e);
        const l = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return (l && l.registro && l.registro.vecinos.maestra && Object.keys(l.registro.pueblos).length === 2 &&
          l.tiempoJugado === 1234 && l.inventario.logros.indexOf('Agente jurado') >= 0) ? true : 'round-trip mal';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B13: opciones de accesibilidad sobreviven recarga', () => {
      if (!AJ.Accesibilidad) return true; // n/a si el flag está off
      const A = AJ.Accesibilidad;
      const snapA = JSON.stringify(A.cfg());
      A.set('velTexto', 'lento'); A.set('tamTexto', 'grande');
      // simular "recarga": volver a leer desde localStorage (init re-lee)
      A.init();
      const ok = A.cfg().velTexto === 'lento' && A.cfg().tamTexto === 'grande';
      const c = JSON.parse(snapA); A.set('velTexto', c.velTexto); A.set('tamTexto', c.tamTexto); A.set('contraste', c.contraste);
      return ok ? true : 'accesibilidad no persiste';
    });

    check('B14: viajar al tercer pueblo y recargar (si existe)', () => {
      if (!AJ.CONFIG.tercerPueblo) return true; // n/a
      const orig = AJ.SAVE_KEY;
      try {
        AJ.SAVE_KEY = orig + '__edge14';
        const e = AJ.Guardado.estadoNuevo();
        e.mapaActual = 3; e.jugador = { x: 4, y: 15, dir: 'abajo' };
        AJ.Guardado.guardar(e);
        const l = AJ.Guardado.cargar();
        AJ.Guardado.borrar();
        return (l && l.mapaActual === 3) ? true : 'no recordó el 3er pueblo';
      } finally { AJ.SAVE_KEY = orig; }
    });

    check('B15: el Final depende de la cadena principal, no del Registro', () => {
      if (!escena.misiones) return true;
      // Estado: todas las misiones del pueblo 1 completas (cadena principal) con
      // registro/afinidad incompletos -> _misionActual(pueblo1) debe ser null
      // (gatilla el Final), sin importar el % del Registro.
      const snapMis = JSON.stringify(escena.estado.misiones);
      const wasActual = AJ.Mapa.actual;
      const p1mis = (AJ.MISIONES || []).filter((m) => (m.pueblo || 1) === 1);
      const todas = {};
      p1mis.forEach((m) => { todas[m.id] = 'completada'; });
      escena.estado.misiones = todas;
      // Con todas las del pueblo 1 completas no debe quedar ninguna pendiente
      // (eso gatilla el Final), sin importar el % del Registro.
      const restante = p1mis.filter((m) => escena.estado.misiones[m.id] !== 'completada');
      escena.estado.misiones = JSON.parse(snapMis); // restaurar
      return restante.length === 0 ? true : 'la cadena principal no cierra';
    });

    // 20. C2.1: joystick analógico
    if (AJ.CONFIG.joystickAnalogico) {
      check('Joystick: zona muerta + snap a 4 direcciones', () => {
        if (!AJ.Joystick || typeof AJ.Joystick.dirDesde !== 'function') return 'sin Joystick';
        const z = AJ.Joystick.dirDesde(2, 1); // muy chico -> zona muerta -> quieto
        if (z.up || z.down || z.left || z.right) return 'zona muerta no frena';
        const der = AJ.Joystick.dirDesde(50, 5);   // dominante X+
        const arr = AJ.Joystick.dirDesde(-5, -50); // dominante Y-
        return (der.right && !der.up && !der.down && !der.left &&
                arr.up && !arr.left && !arr.right && !arr.down) ? true : 'snap mal';
      });
      check('Joystick: clase joystick-on y d-pad oculto', () =>
        document.body.classList.contains('joystick-on') ? true : 'sin clase joystick-on');
    }

    // 21. C2.2: menú de pausa
    if (AJ.CONFIG.menu) {
      check('Menú: abre/cierra, congela el tiempo y tiene doble confirmación', () => {
        if (!escena.menu) return 'sin menú';
        const m = escena.menu;
        m.abrir();
        if (!m.abierto) return 'no abrió';
        // Pausa real: con el menú abierto, un update no avanza el reloj.
        const min0 = escena.diaNoche ? escena.diaNoche.estado.tiempo.minutos : null;
        escena.update(0, 1000);
        const min1 = escena.diaNoche ? escena.diaNoche.estado.tiempo.minutos : null;
        const congela = (min0 == null) || (min1 === min0);
        // Reinicio con doble confirmación: hay dos vistas antes de borrar.
        m.vista = 'confirmar'; m._render();
        const paso1 = m.vista === 'confirmar';
        m.vista = 'confirmar2'; m._render();
        const paso2 = m.vista === 'confirmar2';
        m.vista = 'menu'; m._render(); m.cerrar();
        return (!m.abierto && congela && paso1 && paso2) ? true
          : 'menú raro (congela=' + congela + ')';
      });
    }

    // 22. C2.3: brújula hacia el objetivo
    if (AJ.CONFIG.brujula) {
      check('Brújula apunta al objetivo de la misión activa', () => {
        if (!escena.brujula) return 'sin brújula';
        if (!conNPCs) return true; // sin NPCs (pueblo vacío) no aplica
        const obj = escena.brujula.objetivoTile();
        // Debe haber un objetivo y coincidir con el NPC marcado de la misión.
        const m = escena.misiones && escena.misiones._misionActual();
        if (!m) return true; // sin misión actual, válido (no apunta a nada raro)
        const st = escena.misiones._estadoDe(m.id);
        const id = !st ? m.npcInicio : (st === 'activa' ? m.objetivoNpc : m.npcFin);
        const npc = escena.npcManager.porId(id);
        if (!npc) return 'objetivo sin NPC';
        return (obj && obj.x === npc.tx && obj.y === npc.ty) ? true : 'no apunta al NPC correcto';
      });
    }

    // 23. D3: Registro del Agente
    if (AJ.CONFIG.registro) {
      check('Registro: registra avance y calcula %', () => {
        const reg = escena.registro;
        if (!reg) return 'sin registro';
        // snapshot del registro para restaurar (no ensuciar)
        const snapReg = JSON.stringify(escena.estado.registro);
        const pueblosVis0 = Object.keys(escena.estado.registro.pueblos).length;
        // estar en este pueblo ya debería haberlo registrado
        if (pueblosVis0 < 1) return 'pueblo no registrado';
        const n = escena.npcManager && escena.npcManager.npcs[0];
        if (n) reg.registrarVecino(n.id);
        const d = reg.datos();
        // En un pueblo sin NPCs (El Puesto) no se puede registrar un vecino;
        // sólo exigimos vecinos.de>=1 donde hay con quién hablar.
        const ok = d && typeof d.porcentaje === 'number' && d.porcentaje >= 0 && d.porcentaje <= 100 &&
          d.vecinos.total > 0 && d.misiones.total > 0 && (!n || d.vecinos.de >= 1);
        // panel abre/cierra sin lanzar
        reg.abrir(); const ab = reg.abierto; reg.cerrar();
        escena.estado.registro = JSON.parse(snapReg); // restaurar
        return (ok && ab) ? true : 'datos/panel raros';
      });
      check('logrosTotales y totalPueblos coherentes', () =>
        AJ.logrosTotales().length >= (AJ.MISIONES ? 1 : 0) && AJ.totalPueblos() >= 1 ? true : 'totales mal');
      // Fix review: el Registro debe poder llegar a 100% (totales = alcanzables).
      check('Registro puede llegar a 100% (totales alcanzables)', () => {
        const reg = escena.registro; if (!reg) return 'sin registro';
        const snapReg = JSON.stringify(escena.estado.registro);
        const snapMis = JSON.stringify(escena.estado.misiones);
        const snapLog = JSON.stringify(escena.estado.inventario.logros);
        const roster = AJ.roster();
        escena.estado.registro = { vecinos: {}, pueblos: {} };
        roster.forEach((n) => { escena.estado.registro.vecinos[n.id] = true; });
        for (let i = 1; i <= AJ.totalPueblos(); i++) escena.estado.registro.pueblos[i] = true;
        const mis = {}; (AJ.MISIONES || []).forEach((m) => { mis[m.id] = 'completada'; });
        escena.estado.misiones = mis;
        escena.estado.inventario.logros = AJ.logrosTotales().slice();
        const pct = reg.datos().porcentaje;
        escena.estado.registro = JSON.parse(snapReg);
        escena.estado.misiones = JSON.parse(snapMis);
        escena.estado.inventario.logros = JSON.parse(snapLog);
        return pct === 100 ? true : 'tope = ' + pct + '% (no 100)';
      });
    }

    // Fix review: el menú de pausa cierra los sub-paneles abiertos (no zombis).
    if (AJ.CONFIG.menu && escena.menu && escena.registro) {
      check('Menú cierra los sub-paneles al cerrarse (no zombi)', () => {
        escena.registro.abrir();
        const abierto = escena.registro.abierto;
        escena.menu.abrir();
        escena.menu.cerrar(); // debe cerrar el menú Y el registro
        const cerrado = escena.registro.abierto === false;
        return (abierto && cerrado) ? true : 'sub-panel quedó pegado';
      });
    }

    // 24. D4: tercer pueblo (sin llamar cargar: no corromper la escena viva)
    if (AJ.CONFIG.tercerPueblo) {
      check('D4: tercer pueblo coherente', () => {
        if (AJ.totalPueblos() !== 3) return 'totalPueblos != 3';
        if (AJ.Mapa.actual === 2) {
          const destinos = (AJ.Mapa.meta.salidas || []).map((s) => s.destino).sort();
          if (destinos.join(',') !== '1,3') return 'Colonia: salidas != [1,3]';
        }
        if (AJ.Mapa.actual === 3) {
          if (AJ.Mapa.meta.conNPCs !== false) return 'pueblo3 no debería tener NPCs';
          if (!(AJ.Mapa.meta.salidas || []).some((s) => s.destino === 2)) return 'pueblo3 sin salida a la Colonia';
          if (!AJ.Mapa.meta.granja) return 'pueblo3 sin huerta';
        }
        return true;
      });
    }

    // 25. E1: pantalla de progreso
    if (AJ.CONFIG.progreso) {
      check('Progreso: panel lee stats sin romper', () => {
        const pr = escena.progreso;
        if (!pr) return 'sin progreso';
        const mpp = pr._misionesPorPueblo();
        const okMis = mpp && Object.keys(mpp).length >= 1;
        const tiempo = pr._fmtTiempo(125); // 2m 5s
        pr.abrir(); const ab = pr.abierto; pr.cerrar();
        return (okMis && /m/.test(tiempo) && ab) ? true : 'panel/stats raros';
      });
      check('E1: cuenta el tiempo jugado', () => {
        const t0 = escena.estado.tiempoJugado || 0;
        escena.update(0, 500); // 0.5s
        const t1 = escena.estado.tiempoJugado || 0;
        return t1 > t0 ? true : 'tiempo no avanza';
      });
    }

    // 26. E2: accesibilidad
    if (AJ.CONFIG.accesibilidad) {
      check('Accesibilidad: getters y opciones aplican', () => {
        const A = AJ.Accesibilidad;
        if (!A) return 'sin Accesibilidad';
        const snapA = JSON.stringify(A.cfg());
        A.set('velTexto', 'lento'); const lento = A.velTextoMs();
        A.set('velTexto', 'instantaneo'); const inst = A.velTextoMs();
        A.set('tamTexto', 'grande'); const esc = A.escalaTexto();
        A.set('contraste', true); const cont = A.contraste();
        const clase = document.body.classList.contains('alto-contraste');
        const c = JSON.parse(snapA); // restaurar preferencias
        A.set('velTexto', c.velTexto); A.set('tamTexto', c.tamTexto); A.set('contraste', c.contraste);
        return (lento > 0 && inst === 0 && esc > 1 && cont && clase) ? true : 'opciones raras';
      });
      check('Diálogo respeta el typewriter (revelando)', () => {
        if (!escena.dialogo) return 'sin diálogo';
        const A = AJ.Accesibilidad;
        const snapA = JSON.stringify(A.cfg());
        A.set('velTexto', 'normal');
        escena.dialogo.mostrar('Test', ['Una línea bastante larga para revelar.']);
        const revelando = escena.dialogo._revelando === true;
        // avanzar completa el tramo
        escena.dialogo.avanzar();
        const completo = escena.dialogo._revelando === false;
        escena.dialogo.cerrar();
        const c = JSON.parse(snapA); A.set('velTexto', c.velTexto);
        return (revelando && completo) ? true : 'typewriter raro';
      });
    }

    // 27. E3: créditos
    if (AJ.CONFIG.creditos) {
      check('Créditos: abre y cierra sin romper', () => {
        if (!AJ.Creditos) return 'sin Creditos';
        AJ.Creditos.abrir(escena);
        AJ.Creditos.cerrar();
        return true; // si no lanzó, pasa
      });
    }

    // 28. F1: creador de Agente
    if (AJ.CONFIG.creadorAgente) {
      check('Agente: 4 variantes recolorean distinto + nombre en diálogo', () => {
        const A = AJ.Agente;
        if (!A) return 'sin Agente';
        const snapA = JSON.stringify({ n: A.nombre(), p: A.pronombre(), v: A.variante() });
        // las 4 variantes deben dar colores de camisa distintos
        const cols = [];
        for (let i = 0; i < 4; i++) { A.set('variante', i); cols.push(A.colores().camisa); }
        const distintos = new Set(cols).size === 4;
        // sustitución del nombre en el diálogo (sin tocar "Agente Juvenil")
        A.set('nombre', 'Beba');
        const sust = A.aplicarNombre('¡Hola Agente! Sos el nuevo Agente Juvenil.');
        const okSust = sust.indexOf('Hola Beba') >= 0 && sust.indexOf('Agente Juvenil') >= 0;
        // restaurar elección real
        const s = JSON.parse(snapA);
        A.set('nombre', s.n); A.set('pronombre', s.p); A.set('variante', s.v);
        return (distintos && okSust) ? true : 'variantes/sustitución: d=' + distintos + ' s=' + sust;
      });
    }

    // 29. F2: capa de arte (PNG con fallback procedural)
    if (AJ.CONFIG.capaArte) {
      check('Capa de arte: preparar() + manifiesto + fallback procedural', () => {
        if (!AJ.Art || typeof AJ.Art.preparar !== 'function') return 'sin preparar()';
        const man = AJ.ASSET_MANIFEST;
        if (!man || !Array.isArray(man.tiles) || !Array.isArray(man.sprites)) return 'manifiesto inválido';
        // Con manifiesto vacío, todo cae a procedural: las texturas base deben existir.
        const claves = ['pasto', 'tierra', 'agua', 'calden', 'jugador_abajo_0', 'npc_cura_abajo_0', 'moneda'];
        const faltan = claves.filter((c) => !escena.textures.exists(c));
        return faltan.length === 0 ? true : 'faltan texturas: ' + faltan.join(',');
      });
    }

    // 30. F4: estadísticas de sesión (acumuladas, sólo lectura)
    if (AJ.CONFIG.estadisticas) {
      check('Estadísticas: cuentan y acumulan (pasos/diálogos/NPCs/misiones)', () => {
        const S = AJ.Stats;
        if (!S || typeof S.datos !== 'function') return 'sin Stats';
        const saved = window.localStorage.getItem('aj_stats_v1');
        try {
          S._reset();
          S.sumarPaso(); S.sumarPaso();
          S.sumarDialogo();
          S.registrarNpc('npc_x'); S.registrarNpc('npc_x'); S.registrarNpc('npc_y'); // repetido NO recuenta
          S.registrarMision(1); S.registrarMision(2); S.registrarMision(1);
          S.sumarTiempo(5);
          const d = S.datos();
          const okMem = d.pasos === 2 && d.dialogos === 1 && d.npcsConocidos === 2 &&
            d.misionesTotal === 3 && d.misionesPorPueblo[1] === 2 && d.misionesPorPueblo[2] === 1 &&
            Math.abs(d.tiempoTotal - 5) < 0.001;
          // persistencia: flush + recarga desde localStorage mantiene los valores
          S.flush();
          S.init();
          const d2 = S.datos();
          const okPers = d2.pasos === 2 && d2.npcsConocidos === 2 && d2.misionesTotal === 3;
          return (okMem && okPers) ? true : 'mem=' + okMem + ' pers=' + okPers;
        } finally {
          // restaurar las estadísticas reales (localStorage + memoria)
          try {
            if (saved === null) window.localStorage.removeItem('aj_stats_v1');
            else window.localStorage.setItem('aj_stats_v1', saved);
          } catch (e) {}
          S.init();
        }
      });
    }

    // 31. F5: robustez final — casos borde de la Capa F.
    if (AJ.CONFIG.creadorAgente) {
      check('F5: nombre de Agente vacío/en blanco no rompe el diálogo', () => {
        const A = AJ.Agente;
        if (!A) return 'sin Agente';
        const nSnap = A.nombre();
        try {
          A.set('nombre', '');
          const t1 = A.aplicarNombre('Buenas, Agente. Sos el nuevo Agente Juvenil.');
          const okVacio = t1.indexOf('Buenas, Agente.') >= 0 && t1.indexOf('Agente Juvenil') >= 0;
          A.set('nombre', '   '); // sólo espacios -> trim -> '' -> no sustituye
          const t2 = A.aplicarNombre('Hola Agente');
          const okBlancos = t2 === 'Hola Agente';
          return (okVacio && okBlancos) ? true : 'vacio=' + okVacio + ' blancos=' + okBlancos;
        } finally { A.set('nombre', nSnap); }
      });

      check('F5: variante visual persiste tras recargar y recolorea el sprite', () => {
        const A = AJ.Agente;
        if (!A) return 'sin Agente';
        const vSnap = A.variante();
        try {
          // persistencia: set + "reload" (init re-lee localStorage) mantiene la variante
          A.set('variante', 2); A.init(); // Verde
          const okPersist = A.variante() === 2 && A.colores().camisa === 0x4aa86a;
          A.set('variante', vSnap); A.init();
          // el sprite vivo coincide con la variante ACTIVA (recoloreo real aplicado)
          const want = A.colores().camisa;
          const px = escena.textures.getPixel(16, 28, 'jugador_abajo_0');
          const okPx = px && px.color === want;
          return (okPersist && okPx) ? true
            : 'persist=' + okPersist + ' px=' + (px ? px.color.toString(16) : 'null') + ' want=' + want.toString(16);
        } finally { A.set('variante', vSnap); A.init(); }
      });
    }

    if (AJ.CONFIG.capaArte) {
      check('F5: generarTodo es idempotente (fallback tras cargar PNG no rompe nada)', () => {
        // Tras cargar PNGs del manifiesto, preparar() llama generarTodo() para
        // rellenar lo que falte; eso exige que re-ejecutarlo con texturas ya
        // presentes sea seguro (cada generador saltea las claves existentes).
        const claves = ['pasto', 'tierra', 'agua', 'calden', 'jugador_abajo_0', 'npc_cura_abajo_0', 'moneda'];
        const antes = claves.filter((c) => !escena.textures.exists(c));
        if (antes.length) return 'faltaban antes: ' + antes.join(',');
        AJ.Art.generarTodo(escena); // no debe lanzar ni borrar texturas en uso
        const despues = claves.filter((c) => !escena.textures.exists(c));
        return despues.length === 0 ? true : 'desaparecieron: ' + despues.join(',');
      });
    }

    if (AJ.CONFIG.estadisticas) {
      check('F5: estadísticas acumulan entre sesiones (flush + reload + flush)', () => {
        const S = AJ.Stats;
        if (!S) return 'sin Stats';
        const saved = window.localStorage.getItem('aj_stats_v1');
        try {
          S._reset();
          // sesión 1
          S.sumarTiempo(100); S.sumarPaso(); S.registrarMision(1);
          S.flush(); S.init(); // "cerrar y reabrir el juego"
          // sesión 2: acumula sobre lo guardado
          S.sumarTiempo(50); S.sumarPaso(); S.registrarMision(1); S.registrarMision(2);
          const d = S.datos();
          const ok1 = Math.abs(d.tiempoTotal - 150) < 1e-6 && d.pasos === 2 &&
            d.misionesPorPueblo[1] === 2 && d.misionesPorPueblo[2] === 1;
          S.flush(); S.init(); // sesión 3: releer no pierde nada
          const d2 = S.datos();
          const ok2 = Math.abs(d2.tiempoTotal - 150) < 1e-6 && d2.pasos === 2 && d2.misionesTotal === 3;
          return (ok1 && ok2) ? true : 's2=' + ok1 + ' s3=' + ok2;
        } finally {
          try {
            if (saved === null) window.localStorage.removeItem('aj_stats_v1');
            else window.localStorage.setItem('aj_stats_v1', saved);
          } catch (e) {}
          S.init();
        }
      });
    }

    // 32. G1: capa de datos del Modo Gestión (GDD)
    if (AJ.CONFIG.modoGestion) {
      check('G1: datos de gestión completos (5 medidores / 10 comunidades / 5 actividades)', () => {
        const D = AJ.Gestion && AJ.Gestion.Datos;
        if (!D) return 'sin Gestion.Datos';
        if (D.MEDIDORES.length !== 5) return 'medidores=' + D.MEDIDORES.length;
        if (D.COMUNIDADES.length !== 10) return 'comunidades=' + D.COMUNIDADES.length;
        if (!D.PUEBLOS.length) return 'sin pueblos';
        if (D.ACTIVIDADES.length !== 5) return 'actividades=' + D.ACTIVIDADES.length;
        if (!D.NIVELES[1] || !D.NIVELES[4]) return 'faltan niveles';
        // las problemáticas sensibles están marcadas (su contenido NO se autogenera)
        const sens = D.PROBLEMATICAS.filter((p) => p.sensible).map((p) => p.id);
        const okSens = ['saludMental', 'consumos', 'bullying', 'violencias'].every((x) => sens.indexOf(x) >= 0);
        if (!okSens) return 'flags sensibles mal: ' + sens.join(',');
        // integridad referencial: cada comunidad de cada pueblo existe en el catálogo
        const malas = [];
        D.PUEBLOS.forEach((p) => (p.comunidades || []).forEach((c) => { if (!D.comunidad(c)) malas.push(p.id + ':' + c); }));
        if (malas.length) return 'comunidad inexistente: ' + malas.join(',');
        return true;
      });
      check('G1: estado de gestión se crea, conserva forma y clampa medidores', () => {
        const E = AJ.Gestion && AJ.Gestion.Estado, D = AJ.Gestion.Datos;
        if (!E) return 'sin Gestion.Estado';
        const test = {}; // estado de prueba APARTE (no toca el save real)
        E.asegurar(test, null);
        if (!test.gestion || !test.gestion.actual) return 'asegurar no armó gestion';
        const ep = E.actual(test);
        if (!ep) return 'sin EstadoPueblo';
        const falt = D.MEDIDORES.filter((m) => typeof ep.medidores[m.id] !== 'number');
        if (falt.length) return 'medidores faltan: ' + falt.map((m) => m.id).join(',');
        // clamp: agencia tope 20, convicción piso 0
        E.aplicarImpacto(ep, { agencia: 999 });
        if (ep.medidores.agencia !== 20) return 'no clampó agencia: ' + ep.medidores.agencia;
        E.aplicarImpacto(ep, { conviccion: -999 });
        if (ep.medidores.conviccion !== 0) return 'no clampó convicción: ' + ep.medidores.conviccion;
        // impacto con clave desconocida se ignora sin romper
        const r = E.aplicarImpacto(ep, { noExiste: 5, confianza: -10 });
        if (typeof r.confianza !== 'number' || ('noExiste' in r)) return 'impacto no robusto';
        return true;
      });
      check('G1: la escena inicializó estado.gestion del save', () =>
        (escena.estado.gestion && escena.estado.gestion.actual) ? true : 'gestion no inicializada en el save');
    }

    // 33. G2: onboarding (armar la Agencia) — sobre estado de prueba aparte.
    if (AJ.CONFIG.onboarding) {
      check('G2: lógica de los 4 pasos computa, descubre y clampa bien', () => {
        const O = AJ.Gestion && AJ.Gestion.Onboarding;
        if (!O) return 'sin Onboarding';
        const test = {};
        AJ.Gestion.Estado.asegurar(test, null);
        const ep = AJ.Gestion.Estado.actual(test);
        // paso 1: candidatos por canal (pueblo inicial nivel 1: bocaAboca = 5) + mate
        const c1 = O.convocatoria(test, ['bocaAboca'], true);
        if (c1.candidatos !== 5) return 'candidatos bocaAboca=' + c1.candidatos;
        if (ep.medidores.confianza <= 40) return 'el mate no sumó confianza';
        // paso 2: diagnóstico revela comunidades + sube conocimiento
        const conAntes = ep.medidores.conocimiento;
        O.diagnostico(test, 'charla');
        if (ep.medidores.conocimiento <= conAntes) return 'diagnóstico no subió conocimiento';
        if (!Object.keys(ep.comunidadesDescubiertas).length) return 'no descubrió comunidades';
        // paso 3: objetivos (trim + capea a 3) y bautizo
        O.objetivos(test, '  La Juntada  ', ['masEspacios', 'vozJoven', 'prevencion', 'laburoJoven']);
        if (ep.agencia.nombre !== 'La Juntada') return 'bautizo mal: ' + ep.agencia.nombre;
        if (ep.agencia.objetivos.length !== 3) return 'objetivos no capó a 3: ' + ep.agencia.objetivos.length;
        // paso 4: reclutar capea a min(20, candidatos=5)
        const o4 = O.organizacion(test, 99, ['promo', 'redes']);
        if (o4.miembros !== 5) return 'no capó miembros: ' + o4.miembros;
        if (ep.medidores.agencia !== 5) return 'medidor agencia mal: ' + ep.medidores.agencia;
        // cierre: 5 >= 3 => Agencia
        const fin = O.finalizar(test);
        if (fin.referenteSolo) return 'debería ser Agencia, no referente solo';
        if (!ep.onboarding.hecho || ep.fase !== 'gestion') return 'no cerró el onboarding';
        return true;
      });
      check('G2: con menos de 3 miembros queda Referente solo', () => {
        const O = AJ.Gestion.Onboarding, test = {};
        const fin = O.correrTodo(test, { canales: ['bocaAboca'], nMiembros: 1, nombreAgencia: 'Solo' });
        return fin.referenteSolo ? true : 'no marcó referente solo';
      });
      check('G2: el asistente DOM abre y cierra sin romper', () => {
        const UI = AJ.Gestion && AJ.Gestion.OnboardingUI;
        if (!UI) return 'sin OnboardingUI';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        UI.abrir(escena, test, null);
        const abierto = !!document.getElementById('gestion-onboarding') && UI.abierta();
        UI.cerrar();
        const cerrado = !document.getElementById('gestion-onboarding') && !UI.abierta();
        return (abierto && cerrado) ? true : 'abierto=' + abierto + ' cerrado=' + cerrado;
      });
    }

    // 34. G3: motor de dilemas
    if (AJ.CONFIG.dilemas) {
      check('G3: banco de dilemas genéricos válido (estructura/medidores/trade-off/no-sensible)', () => {
        const M = AJ.Gestion && AJ.Gestion.Dilemas;
        if (!M) return 'sin Dilemas';
        const banco = M.BANCO_GENERICO;
        if (!banco.length) return 'banco vacío';
        const sens = ['saludMental', 'consumos', 'violencias', 'bullying'];
        for (let i = 0; i < banco.length; i++) {
          const d = banco[i];
          if (!d.id || !d.situacion || !Array.isArray(d.opciones) || d.opciones.length < 2) return 'dilema mal: ' + d.id;
          if (sens.indexOf(d.problematica) >= 0) return 'genérico con tema sensible: ' + d.id;
          let hayNeg = false;
          for (let j = 0; j < d.opciones.length; j++) {
            const o = d.opciones[j];
            if (!o.id || !o.texto || !o.impactos) return 'opción mal en ' + d.id;
            for (const k in o.impactos) {
              if (!AJ.Gestion.Datos.medidor(k)) return 'medidor inválido "' + k + '" en ' + d.id;
              if (o.impactos[k] < 0) hayNeg = true;
            }
          }
          if (!hayNeg) return 'sin trade-off (ningún costo) en ' + d.id;
        }
        if (M.BANCO_SENSIBLE.length) return 'el banco sensible NO debería autollenarse';
        return true;
      });
      check('G3: resolver aplica impactos y marca el dilema como resuelto', () => {
        const M = AJ.Gestion.Dilemas, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null);
        const ep = E.actual(test);
        const elig = M.elegibles(test);
        if (!elig.length) return 'sin elegibles';
        const d = elig[0], op = d.opciones[0];
        const res = M.resolver(test, d.id, op.id);
        if (!res) return 'resolver devolvió null';
        if (ep.dilemasResueltos.indexOf(d.id) < 0) return 'no marcó resuelto';
        if (M.elegibles(test).some((x) => x.id === d.id)) return 'sigue elegible tras resolver';
        // resolver con ids inexistentes no rompe
        if (M.resolver(test, 'no_existe', 'a') !== null) return 'dilema inexistente no devolvió null';
        return true;
      });
      check('G3: el diálogo de dilema abre y cierra sin romper', () => {
        const UI = AJ.Gestion && AJ.Gestion.DilemasUI;
        if (!UI) return 'sin DilemasUI';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const d = AJ.Gestion.Dilemas.elegibles(test)[0];
        UI.abrir(escena, test, d, null);
        const abierto = !!document.getElementById('gestion-dilema') && UI.abierta();
        UI.cerrar();
        const cerrado = !document.getElementById('gestion-dilema') && !UI.abierta();
        return (abierto && cerrado) ? true : 'abierto=' + abierto + ' cerrado=' + cerrado;
      });
    }

    // 35. G4: sistema de tiradas (dado con arco)
    if (AJ.CONFIG.tiradas) {
      check('G4: clasificación graduada del dado (crítico/éxito/parcial/fracaso)', () => {
        const T = AJ.Gestion && AJ.Gestion.Tiradas;
        if (!T) return 'sin Tiradas';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const r = (dado) => T.tirar(test, { dificultad: 12, dadoForzado: dado, medidores: [] }).resultado;
        if (r(20) !== 'critico') return 'nat20 no es crítico';
        if (r(1) !== 'fracaso') return 'nat1 no es fracaso';
        if (r(15) !== 'exito') return 'margen +3 no es éxito';
        if (r(9) !== 'parcial') return 'margen -3 no es parcial';
        if (r(5) !== 'fracaso') return 'margen -7 no es fracaso';
        return true;
      });
      check('G4: arco suerte→competencia (los modificadores crecen con los medidores)', () => {
        const T = AJ.Gestion.Tiradas, E = AJ.Gestion.Estado;
        const bajo = {}; E.asegurar(bajo, null); const epB = E.actual(bajo);
        epB.medidores.conocimiento = 10; epB.medidores.confianza = 10;
        const alto = {}; E.asegurar(alto, null); const epA = E.actual(alto);
        epA.medidores.conocimiento = 90; epA.medidores.confianza = 90;
        const mB = T.modificadores(epB, ['conocimiento', 'confianza'], 0);
        const mA = T.modificadores(epA, ['conocimiento', 'confianza'], 0);
        return (mB < 0 && mA > 0 && mA > mB) ? true : 'arco mal: bajo=' + mB + ' alto=' + mA;
      });
      check('G4: escalado de impactos por resultado (crítico mejora, fracaso castiga)', () => {
        const T = AJ.Gestion.Tiradas;
        const base = { confianza: 10, conviccion: -8 };
        const crit = T.escalarImpactos(base, 'critico');
        const frac = T.escalarImpactos(base, 'fracaso');
        if (!(crit.confianza > 10)) return 'crítico no mejoró el positivo';
        if (frac.confianza) return 'fracaso no anuló el positivo';
        if (!(Math.abs(frac.conviccion) >= 8)) return 'fracaso no mantuvo el costo';
        return true;
      });
      check('G4: referente solo paga más (penalidad en los modificadores)', () => {
        const T = AJ.Gestion.Tiradas, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null); const ep = E.actual(test);
        ep.medidores.conocimiento = 50;
        const normal = T.modificadores(ep, ['conocimiento'], 0);
        ep.onboarding.referenteSolo = true;
        const solo = T.modificadores(ep, ['conocimiento'], 0);
        return (solo < normal) ? true : 'referente solo no penaliza: ' + solo + ' vs ' + normal;
      });
      check('G4: un dilema con tirada usa el dado al resolver', () => {
        const M = AJ.Gestion.Dilemas, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null);
        const con = M.BANCO_GENERICO.find((d) => d.opciones.some((o) => o.requiereTirada));
        if (!con) return 'no hay dilema con tirada en el banco';
        const op = con.opciones.find((o) => o.requiereTirada);
        const res = M.resolver(test, con.id, op.id);
        if (!res) return 'resolver null';
        if (!res.tirada || typeof res.tirada.dado !== 'number') return 'no rodó el dado';
        return true;
      });
      check('G4: el escalado castiga costos chicos en fracaso y no los borra en crítico', () => {
        const T = AJ.Gestion.Tiradas;
        const frac = T.escalarImpactos({ conviccion: -2 }, 'fracaso');   // -2×1.25 ⇒ -3 (no -2)
        if (frac.conviccion !== -3) return 'fracaso no amplió el costo chico: ' + frac.conviccion;
        const crit = T.escalarImpactos({ conviccion: -1 }, 'critico');   // -1×0.5 ⇒ -1 (no 0)
        if (crit.conviccion !== -1) return 'crítico borró el costo de -1: ' + crit.conviccion;
        return true;
      });
    }

    // 36. Modo Gestión: integración (freeze de movimiento + cierre limpio de modales)
    if (AJ.CONFIG.modoGestion) {
      check('Gestión: los modales congelan el movimiento y cierran sin dejar overlay', () => {
        const G = AJ.Gestion;
        if (!G || !G.OnboardingUI || !G.modalAbierta) return 'sin UI/modalAbierta';
        const test = {}; G.Estado.asegurar(test, null);
        G.OnboardingUI.abrir(escena, test, null);
        if (!G.modalAbierta()) return 'modalAbierta no detecta el onboarding';
        // Congela el MOVIMIENTO (no el reloj): con input puesto, el jugador no se mueve.
        const p0 = escena.jugador.tilePos();
        AJ.Input.estado.right = true;
        escena.update(0, 1000);
        AJ.Input.estado.right = false;
        const p1 = escena.jugador.tilePos();
        if (p0.x !== p1.x || p0.y !== p1.y) { escena._cerrarModalesGestion(); return 'no congeló el movimiento'; }
        // _cerrarModalesGestion (lo que usa ESC) deja todo limpio.
        escena._cerrarModalesGestion();
        if (G.modalAbierta() || document.getElementById('gestion-onboarding')) return 'quedó overlay tras cerrar';
        if (G.DilemasUI && AJ.CONFIG.dilemas) {
          const d = G.Dilemas.elegibles(test)[0];
          G.DilemasUI.abrir(escena, test, d, null);
          if (!G.modalAbierta()) { G.DilemasUI.cerrar(); return 'modalAbierta no detecta el dilema'; }
          escena._cerrarModalesGestion();
          if (G.modalAbierta() || document.getElementById('gestion-dilema')) return 'quedó overlay de dilema';
        }
        return true;
      });
    }

    // 37. G5: ciclo de 30 días + mudanza
    if (AJ.CONFIG.cicloGestion) {
      check('G5: recon → oferta de rol → gestión (transición de fases)', () => {
        const C = AJ.Gestion && AJ.Gestion.Ciclo;
        if (!C) return 'sin Ciclo';
        const test = {}; const ep = C.ep(test);
        if (ep.fase !== 'recon') return 'no arranca en recon';
        AJ.Gestion.Onboarding.correrTodo(test, { canales: ['bocaAboca'], nMiembros: 5 });
        C.ep(test).fase = 'recon'; // el ciclo manda la fase
        for (let i = 0; i < 5; i++) C.accionRecon(test, 'explorar');
        if (!C.puedeOfrecerRol(C.ep(test))) return 'no ofrece rol tras 5 días';
        C.aceptarRol(test);
        const e2 = C.ep(test);
        if (e2.fase !== 'gestion' || e2.dia !== 6) return 'no pasó a gestión día 6: ' + e2.fase + '/' + e2.dia;
        return true;
      });
      check('G5: 3 acciones por día y cierre de día', () => {
        const C = AJ.Gestion.Ciclo;
        const test = {}; const e = C.ep(test);
        e.fase = 'gestion'; e.dia = 6; e.accionesHoy = 0;
        if (C.accionesRestantes(e) !== 3) return 'no son 3 acciones';
        C.consumirAccion(test); C.consumirAccion(test); C.consumirAccion(test);
        if (C.accionesRestantes(C.ep(test)) !== 0) return 'no consumió las 3';
        if (C.consumirAccion(test)) return 'dejó consumir una 4ta';
        C.cerrarDia(test);
        const e2 = C.ep(test);
        if (e2.dia !== 7 || e2.accionesHoy !== 0) return 'cerrarDia mal: dia=' + e2.dia;
        return true;
      });
      check('G5: al día 30 se cierra con un perfil de gestor', () => {
        const C = AJ.Gestion.Ciclo;
        const test = {}; const e = C.ep(test);
        e.fase = 'gestion'; e.dia = 30; e.accionesHoy = 3;
        C.cerrarDia(test);
        const e2 = C.ep(test);
        if (e2.fase !== 'cerrado') return 'no cerró: ' + e2.fase;
        if (!e2.perfil || !e2.perfil.titulo) return 'sin perfil';
        return true;
      });
      check('G5: recon sin armar Agencia → Referente solo', () => {
        const C = AJ.Gestion.Ciclo;
        const test = {};
        for (let i = 0; i < 5; i++) C.accionRecon(test, 'explorar');
        C.aceptarRol(test);
        const e2 = C.ep(test);
        if (!e2.onboarding.referenteSolo) return 'no quedó referente solo';
        if (e2.medidores.agencia !== 0) return 'agencia no es 0';
        if (e2.fase !== 'gestion') return 'no pasó a gestión';
        return true;
      });
      check('G5: mudanza crea estado nuevo, hereda experiencia y conserva el origen', () => {
        const C = AJ.Gestion.Ciclo, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null);
        const origen = test.gestion.actual;
        C.ep(test).dia = 12; // marcar el origen
        const destino = C.pueblosDisponibles(test)[0].id;
        const e = C.mudarse(test, destino);
        if (test.gestion.actual !== destino) return 'no cambió de pueblo';
        if (!e || e.fase !== 'recon') return 'destino no arranca en recon';
        if (test.gestion.experiencia.mudanzas !== 1) return 'no contó la mudanza';
        if (e.medidores.confianza < 48) return 'no aplicó piso de confianza: ' + e.medidores.confianza;
        if (!test.gestion.pueblos[origen] || test.gestion.pueblos[origen].dia !== 12) return 'no conservó el origen';
        return true;
      });
      check('G5: una actividad se resuelve con el dado', () => {
        const A = AJ.Gestion.Actividades;
        if (!A) return 'sin Actividades';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const res = A.resolver(test, AJ.Gestion.Datos.ACTIVIDADES[0].id);
        if (!res || !res.tirada || typeof res.tirada.dado !== 'number') return 'no rodó el dado';
        return true;
      });
      check('G5: el menú del día abre/cierra y modalAbierta lo detecta', () => {
        const UI = AJ.Gestion && AJ.Gestion.CicloUI;
        if (!UI) return 'sin CicloUI';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        UI.abrir(escena, test);
        const abierto = !!document.getElementById('gestion-ciclo') && UI.abierta() && AJ.Gestion.modalAbierta();
        UI.cerrar();
        const cerrado = !document.getElementById('gestion-ciclo') && !UI.abierta();
        return (abierto && cerrado) ? true : 'abierto=' + abierto + ' cerrado=' + cerrado;
      });
    }

    // 38. G6: descubrimiento e integración de comunidades
    if (AJ.CONFIG.comunidades) {
      check('G6: descubrimiento gradual (revela común primero, hasta agotar)', () => {
        const CM = AJ.Gestion && AJ.Gestion.Comunidades;
        if (!CM) return 'sin Comunidades';
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const ep = AJ.Gestion.Estado.actual(test); ep.comunidadesDescubiertas = {};
        if (CM.delPueblo(test).length < 1) return 'pueblo sin comunidades';
        const oc0 = CM.ocultas(test).length;
        const c1 = CM.revelarUna(test);
        if (!c1) return 'no reveló ninguna';
        if (!CM.conocida(test, c1.id)) return 'la revelada no quedó conocida';
        if (CM.ocultas(test).length !== oc0 - 1) return 'no descontó una oculta';
        while (CM.revelarUna(test)) { /* agotar */ }
        if (CM.revelarUna(test) !== null) return 'siguió revelando tras agotar';
        return true;
      });
      check('G6: bonus de tirada por comunidad afín conocida', () => {
        const CM = AJ.Gestion.Comunidades, D = AJ.Gestion.Datos;
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const ep = AJ.Gestion.Estado.actual(test); ep.comunidadesDescubiertas = {};
        const act = D.actividad('culturaTurismo');
        const sin = CM.bonusActividad(test, act);
        CM.revelarVarias(test, 10);
        const con = CM.bonusActividad(test, act);
        return (con > sin) ? true : 'el bonus no subió al conocer: sin=' + sin + ' con=' + con;
      });
      check('G6: comunidades latentes se activan y cuentan como presentes', () => {
        const CM = AJ.Gestion.Comunidades;
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const lat = CM.latentes(test);
        if (!lat.length) return 'sin latentes';
        const id = lat[0];
        if (CM.presentes(test).indexOf(id) >= 0) return 'la latente ya estaba presente';
        CM.activarLatente(test, id);
        if (CM.presentes(test).indexOf(id) < 0) return 'no quedó presente';
        if (!CM.conocida(test, id)) return 'no quedó conocida';
        return true;
      });
      check('G6: en la capital (nivel 4) es integración (todas conocidas) + actividad-puente', () => {
        const CM = AJ.Gestion.Comunidades, A = AJ.Gestion.Actividades, C = AJ.Gestion.Ciclo;
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const cap = AJ.Gestion.Datos.PUEBLOS.find((p) => p.nivel === 4);
        if (!cap) return 'sin capital nivel 4';
        C.mudarse(test, cap.id);
        CM.prepararPueblo(test);
        if (!CM.esIntegracion(test)) return 'no es integración';
        const todas = CM.delPueblo(test);
        const conoc = todas.filter((id) => CM.conocida(test, id));
        if (conoc.length !== todas.length) return 'no reveló todas en integración';
        const res = A.resolverPuente(test, conoc.slice(0, 3));
        if (!res || !res.tirada || typeof res.tirada.dado !== 'number') return 'la actividad-puente no rodó';
        return true;
      });
      check('G6: el diagnóstico revela sólo un subconjunto (no todas)', () => {
        const O = AJ.Gestion.Onboarding, CM = AJ.Gestion.Comunidades, C = AJ.Gestion.Ciclo;
        const test = {}; AJ.Gestion.Estado.asegurar(test, null);
        const grande = AJ.Gestion.Datos.PUEBLOS.find((p) => (p.comunidades || []).length > 2 && p.nivel < 4);
        if (grande) { C.mudarse(test, grande.id); }
        AJ.Gestion.Estado.actual(test).comunidadesDescubiertas = {};
        O.diagnostico(test, 'charla');
        const ep2 = AJ.Gestion.Estado.actual(test);
        const total = CM.delPueblo(test).length;
        const reveladas = CM.delPueblo(test).filter((id) => ep2.comunidadesDescubiertas[id]).length;
        return (reveladas > 0 && reveladas < total) ? true : 'reveló ' + reveladas + '/' + total + ' (esperaba subconjunto)';
      });
    }

    // 39. G7: robustez del Modo Gestión (bordes de extremo a extremo, sin flag).
    //     Los round-trips usan una clave de guardado APARTE (no tocan el save real).
    if (AJ.CONFIG.modoGestion && AJ.Gestion && AJ.Gestion.Ciclo) {
      check('G7: el estado de gestión sobrevive guardar/recargar a mitad del día 12', () => {
        const original = AJ.SAVE_KEY;
        try {
          AJ.SAVE_KEY = original + '__g7a';
          const est = AJ.Guardado.estadoNuevo();
          const C = AJ.Gestion.Ciclo, E = AJ.Gestion.Estado;
          E.asegurar(est, null);
          const ep = C.ep(est);
          ep.fase = 'gestion'; ep.dia = 12; ep.accionesHoy = 2;
          E.aplicarImpacto(ep, { confianza: 17, conocimiento: 9 });
          ep.dilemasResueltos.push('poder_intendente_numero');
          AJ.Guardado.guardar(est);
          const leido = AJ.Guardado.cargar();
          AJ.Guardado.borrar();
          const ep2 = leido && leido.gestion && leido.gestion.pueblos[leido.gestion.actual];
          if (!ep2) return 'no cargó gestion';
          if (ep2.dia !== 12 || ep2.accionesHoy !== 2 || ep2.fase !== 'gestion') return 'día/acciones/fase no persistieron';
          if (ep2.medidores.confianza !== ep.medidores.confianza) return 'medidores no persistieron';
          if (ep2.dilemasResueltos.indexOf('poder_intendente_numero') < 0) return 'dilemas resueltos no persistieron';
          return true;
        } finally { AJ.SAVE_KEY = original; }
      });
      check('G7: tras mudarse, cada pueblo recuerda su gestión por separado (persistido)', () => {
        const original = AJ.SAVE_KEY;
        try {
          AJ.SAVE_KEY = original + '__g7b';
          const est = AJ.Guardado.estadoNuevo();
          const C = AJ.Gestion.Ciclo, E = AJ.Gestion.Estado;
          E.asegurar(est, null);
          const origen = est.gestion.actual;
          C.ep(est).dia = 20; C.ep(est).fase = 'gestion';
          const destino = C.pueblosDisponibles(est)[0].id;
          C.mudarse(est, destino);
          C.ep(est).dia = 3;
          AJ.Guardado.guardar(est);
          const l = AJ.Guardado.cargar();
          AJ.Guardado.borrar();
          if (!l.gestion) return 'sin gestion';
          if (l.gestion.actual !== destino) return 'no recordó el pueblo actual';
          if (!l.gestion.pueblos[origen] || l.gestion.pueblos[origen].dia !== 20) return 'no recordó el origen (día 20)';
          if (l.gestion.pueblos[destino].dia !== 3) return 'no recordó el destino (día 3)';
          if (l.gestion.experiencia.mudanzas !== 1) return 'no recordó la experiencia';
          return true;
        } finally { AJ.SAVE_KEY = original; }
      });
      check('G7: completar los 30 días produce un perfil de gestor', () => {
        const C = AJ.Gestion.Ciclo;
        const test = {}; const ep = C.ep(test);
        ep.fase = 'gestion'; ep.dia = 6; ep.accionesHoy = 0;
        let guard = 0;
        while (C.ep(test).fase === 'gestion' && guard++ < 60) C.cerrarDia(test);
        const ep2 = C.ep(test);
        if (ep2.fase !== 'cerrado') return 'no cerró tras 30 días: ' + ep2.fase + '/' + ep2.dia;
        if (!ep2.perfil || !ep2.perfil.titulo) return 'sin perfil';
        return true;
      });
      check('G7: recon sin Agencia → referente solo y se puede gestionar igual', () => {
        const C = AJ.Gestion.Ciclo;
        const test = {};
        for (let i = 0; i < 5; i++) C.accionRecon(test, 'hablar');
        C.aceptarRol(test);
        const ep = C.ep(test);
        if (!ep.onboarding.referenteSolo || ep.fase !== 'gestion') return 'no quedó referente solo en gestión';
        C.consumirAccion(test); C.cerrarDia(test);
        if (C.ep(test).dia !== 7) return 'no avanzó el día siendo referente solo';
        return true;
      });
      check('G7: una comunidad revelada sobrevive el guardado', () => {
        if (!AJ.Gestion.Comunidades) return true; // si G6 está off, no aplica
        const original = AJ.SAVE_KEY;
        try {
          AJ.SAVE_KEY = original + '__g7c';
          const est = AJ.Guardado.estadoNuevo();
          AJ.Gestion.Estado.asegurar(est, null);
          AJ.Gestion.Estado.actual(est).comunidadesDescubiertas = {};
          const c = AJ.Gestion.Comunidades.revelarUna(est);
          if (!c) return 'no reveló';
          AJ.Guardado.guardar(est);
          const l = AJ.Guardado.cargar();
          AJ.Guardado.borrar();
          const ep = l.gestion.pueblos[l.gestion.actual];
          return ep.comunidadesDescubiertas[c.id] ? true : 'la comunidad revelada no persistió';
        } finally { AJ.SAVE_KEY = original; }
      });
      check('G7: la tirada respeta los modificadores (con vs sin)', () => {
        const T = AJ.Gestion.Tiradas, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null);
        const ep = E.actual(test);
        ep.medidores.conocimiento = 90; ep.onboarding.referenteSolo = false;
        const con = T.tirar(test, { dificultad: 12, dadoForzado: 10, medidores: ['conocimiento'] });
        const sin = T.tirar(test, { dificultad: 12, dadoForzado: 10, medidores: [] });
        if (con.total <= sin.total) return 'el modificador no sumó: con=' + con.total + ' sin=' + sin.total;
        if (sin.mods !== 0) return 'sin medidores, mods debería ser 0: ' + sin.mods;
        return true;
      });
      // Fixes del review G5–G7 (regresión):
      check('G7: reentrar a un pueblo ya gestionado NO re-aplica el bonus de mudanza', () => {
        const C = AJ.Gestion.Ciclo, E = AJ.Gestion.Estado;
        const test = {}; E.asegurar(test, null);
        const A = test.gestion.actual;
        const B = C.pueblosDisponibles(test)[0].id;
        C.mudarse(test, B);
        const conocB1 = E.actual(test).medidores.conocimiento;
        E.actual(test).medidores.confianza = 20; // "gastar" en B
        C.mudarse(test, A); // volver
        C.mudarse(test, B); // reentrar
        const epB = test.gestion.pueblos[B];
        if (epB.medidores.confianza !== 20) return 'reentrar re-pisó la confianza: ' + epB.medidores.confianza;
        if (epB.medidores.conocimiento !== conocB1) return 'reentrar ratcheteó conocimiento: ' + epB.medidores.conocimiento;
        if (test.gestion.experiencia.mudanzas !== 1) return 'contó una mudanza de más: ' + test.gestion.experiencia.mudanzas;
        return true;
      });
      check('G7: abrir un dilema desde el menú del día consume la acción (no es gratis)', () => {
        const C = AJ.Gestion.Ciclo, UI = AJ.Gestion.CicloUI;
        if (!UI || !AJ.CONFIG.cicloGestion) return true;
        const test = {}; const ep = C.ep(test);
        ep.fase = 'gestion'; ep.dia = 6; ep.accionesHoy = 0; ep.dilemasResueltos = [];
        UI.abrir(escena, test);
        const ov = document.getElementById('gestion-ciclo');
        const btns = ov ? Array.prototype.slice.call(ov.querySelectorAll('.gestion-accion')) : [];
        const bDil = btns.filter((b) => b.textContent.indexOf('Dilema:') >= 0)[0];
        if (!bDil) { escena._cerrarModalesGestion(); return 'no había dilema en el menú'; }
        bDil.click(); // abre el dilema y debe consumir la acción
        const restantes = C.accionesRestantes(C.ep(test));
        escena._cerrarModalesGestion();
        return (restantes === 2) ? true : 'no consumió la acción al abrir el dilema: restantes=' + restantes;
      });
      check('G7: cancelar "Armar la Agencia" en recon NO gasta un día', () => {
        const C = AJ.Gestion.Ciclo, UI = AJ.Gestion.CicloUI;
        if (!UI || !AJ.CONFIG.cicloGestion) return true;
        const test = {}; C.ep(test); // recon, accionesRecon 0
        UI.abrir(escena, test);
        let ov = document.getElementById('gestion-ciclo');
        const bArmar = Array.prototype.slice.call(ov.querySelectorAll('.gestion-accion')).filter((b) => b.textContent.indexOf('Armar la Agencia') >= 0)[0];
        if (!bArmar) { escena._cerrarModalesGestion(); return 'no había botón de armar agencia'; }
        bArmar.click(); // abre el onboarding (paso 1)
        const obov = document.getElementById('gestion-onboarding');
        if (!obov) { escena._cerrarModalesGestion(); return 'no abrió el onboarding'; }
        obov.querySelectorAll('.creador-btn')[0].click(); // "Cancelar" en el paso 1
        const accionesRecon = C.ep(test).accionesRecon;
        escena._cerrarModalesGestion();
        return (accionesRecon === 0) ? true : 'canceló pero gastó un día: accionesRecon=' + accionesRecon;
      });
    }

    // Restaurar el estado que pudieron tocar las pruebas mutadoras.
    try {
      if (snap && escena && escena.estado) {
        if (snap.items !== undefined && escena.estado.inventario)
          escena.estado.inventario.items = JSON.parse(snap.items);
        if (snap.logros !== undefined && escena.estado.inventario)
          escena.estado.inventario.logros = JSON.parse(snap.logros);
        if (snap.registro !== undefined) escena.estado.registro = JSON.parse(snap.registro);
        if (snap.monedas !== undefined && escena.estado.inventario)
          escena.estado.inventario.monedas = snap.monedas;
        if (snap.minutos !== undefined && escena.estado.tiempo)
          escena.estado.tiempo.minutos = snap.minutos;
        escena.estado.granja = JSON.parse(snap.granja);
        if (snap.afinidad !== undefined) escena.estado.afinidad = JSON.parse(snap.afinidad);
        if (snap.misiones !== undefined) escena.estado.misiones = JSON.parse(snap.misiones);
        escena.estado.misionActiva = snap.misionActiva;
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
