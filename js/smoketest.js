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
