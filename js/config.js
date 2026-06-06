/* =====================================================================
 * config.js — Configuración global y flags de sistemas (anti-rotura)
 * ---------------------------------------------------------------------
 * Cada sistema lee su flag. Si está en false, NO se inicializa.
 * Al cerrar cada noche de trabajo, sólo quedan en `true` los sistemas
 * verificados con el smoke-test. Los dudosos quedan en false + ROADMAP.
 *
 * Todo cuelga del namespace global `AJ` (Agente Juvenil) para evitar
 * módulos ES (import/export), que NO funcionan al abrir con doble clic
 * (protocolo file://). Ver DECISIONES.md.
 * ===================================================================== */

window.AJ = window.AJ || {};

AJ.CONFIG = {
  // --- Flags de sistemas (se encienden sólo si pasan smoke-test) ---
  // Arrancan en false; se ponen en true al cerrar cada fase verificada.
  npcsDialogo: true,   // FASE 2: NPCs + cuadro de diálogo
  misiones:    true,   // FASE 2: cuaderno de misiones cívicas
  diaNoche:    true,   // FASE 3: ciclo día/noche con tinte y reloj
  granja:      true,   // FASE 4: parcela, cultivos y economía mínima
  rutinas:     true,   // FASE A: NPCs con rutinas diarias + afinidad
  estaciones:  true,   // FASE B: 4 estaciones (paleta + ritmo de cultivos)
  crafteo:     true,   // FASE C: mesa de crafteo con recetas
  viaje:       true,   // FASE D: varios pueblos + viaje entre ellos
  // --- Capa de pulido (FASES P) ---
  juice:       true,   // P1: tweens, fades, shake, feedback visual
  sonido:      true,   // P2: efectos procedurales con Web Audio + mute
  uiPulida:    true,   // P3: UX de diálogo/cuaderno + táctil afinado
  // --- Capa C1 (vida en la Colonia) ---
  npcsColonia:    true,  // C1.1: NPCs propios de la Colonia (con rutinas/afinidad)
  misionesColonia: true,  // C1.2: misiones cívicas propias de la Colonia
  // --- Capa C2 (controles/opciones/cierre) ---
  joystickAnalogico: true,  // C2.1: joystick táctil analógico opcional
  menu:           true,  // C2.2: menú de pausa/opciones
  brujula:        true,  // C2.3: guía/flecha hacia la misión activa
  // --- Capa D (más mundo y más para hacer) ---
  poblarMundo:    true,  // D1: más NPCs con diálogo/afinidad en ambos pueblos
  masMisiones:    true,  // D2: más misiones plantilla (requiere poblarMundo: usan sus NPCs)
  registro:       true,  // D3: Registro del Agente (colección estilo "Pokédex")
  tercerPueblo:   true,  // D4: tercer pueblo (opcional, gated)
  // --- Capa E (meta, cierre y accesibilidad) ---
  progreso:       true,  // E1: pantalla de progreso/estadísticas
  accesibilidad:  true,  // E2: opciones de accesibilidad (texto, contraste, vel. diálogo)
  creditos:       true,  // E3: menú principal pulido + créditos
  // --- Capa F (identidad del agente y ganchos de arte) ---
  creadorAgente:  true,  // F1: elegir nombre/pronombre/variante al empezar
  capaArte:       true,  // F2: cargar PNG de /assets si existen (fallback procedural)
  estadisticas:   true,  // F4: estadísticas de sesión acumuladas
  // --- Modo Gestión (GDD; aditivo sobre el RPG, arranca en false hasta smoke) ---
  modoGestion:    true,  // G1: capa de datos (medidores, comunidades, pueblos, etc.)
  onboarding:     true,  // G2: armar la Agencia (4 pasos de la Hoja de Ruta)
  dilemas:        false, // G3: motor de dilemas (situación/opciones/impactos)
  tiradas:        false, // G4: dado + modificadores + resultados graduados

  // --- Modo desarrollo: corre el smoke-test y muestra logs ---
  dev: true,

  // --- Parámetros de mundo ---
  TILE: 32,            // tamaño de tile en px
  JUGADOR_W: 32,       // ancho del personaje
  JUGADOR_H: 48,       // alto del personaje
  VELOCIDAD: 150,      // px/seg de caminata

  // --- Tiempo de juego ---
  // Un día de juego dura este tanto en segundos reales.
  SEGUNDOS_POR_DIA: 240,

  // --- Granja ---
  SEG_CRECIMIENTO_CULTIVO: 30, // segundos reales por etapa de cultivo

  // --- Estaciones (FASE B) ---
  DIAS_POR_ESTACION: 3,        // días de juego por estación

  // --- Joystick analógico (C2.1) ---
  // ⚠️ El FEEL de estos valores necesita prueba humana en celular (ver PLAYTEST).
  JOYSTICK: {
    radioMax: 55,    // px de recorrido máximo del pulgar desde el centro.
    zonaMuerta: 0.30, // fracción del radio (0..1) por debajo de la cual NO se mueve.
                      // Más alto = hay que empujar más para arrancar (menos sensible).
  },
};

/* =====================================================================
 * BALANCE (P5) — Todos los números que afectan el "ritmo" del juego, en
 * UN SOLO LUGAR para tunear fácil. Los sistemas leen de acá con fallback
 * a su default, así si borrás un valor el juego igual anda.
 *
 * ⚠️ IMPORTANTE: estos son defaults RAZONABLES, NO finos. El balance que
 * "se siente bien" (que no aburra ni frustre) SÓLO se ajusta JUGANDO.
 * La corrida nocturna no puede validar feel. Ver PLAYTEST.md.
 * ===================================================================== */
AJ.CONFIG.BALANCE = {
  // --- Movimiento y tiempo (espejo de los de arriba, documentados) ---
  // velocidadJugador: < 120 se siente lento; > 190 se siente incómodo. Default 150.
  // segundosPorDia: 240 = un día cada 4 min reales. Subilo si el día/noche marea.
  // diasPorEstacion: 3 = estaciones rápidas para ver el sistema; subí a 7+ para realismo.

  // --- Granja / economía ---
  segCrecimientoEtapa: 30,   // seg reales por etapa (4 etapas = ~2 min a maduro).
  cosechaMonedas: 10,        // monedas por cosechar un cultivo maduro.
  cosechaVerduras: 1,        // verduras (ingrediente de crafteo) por cosecha.

  // --- Afinidad (amistad) ---
  // Sube al hablar, 1 vez por día de juego. 5 charlas (5 días) = 100 = máximo.
  // Bajalo (p. ej. 10) si querés que la amistad cueste más.
  afinidadPorCharla: 20,

  // --- Crafteo ---
  // Escala las recompensas de MONEDAS de las recetas (1 = como en AJ.RECETAS).
  // Las recetas concretas (qué cuesta y qué da) viven en js/crafteo.js → AJ.RECETAS.
  factorPrecioCrafteo: 1.0,

  // --- Misiones ---
  // El ritmo es una cadena lineal de 5 misiones (ofrecer → objetivo → volver).
  // No hay timers: avanza al hablar con el NPC correcto. Las recompensas por
  // misión (10/15/15/20/30 monedas + logro) están en js/misiones.js → AJ.MISIONES.
  // Para cambiar el "ritmo" se editan esas plantillas (son datos, sin tocar lógica).
};

// Helper: leer un valor de BALANCE con fallback (no rompe si falta).
AJ.bal = function (clave, porDefecto) {
  try {
    const v = AJ.CONFIG.BALANCE[clave];
    return (v === undefined || v === null) ? porDefecto : v;
  } catch (e) { return porDefecto; }
};

// Clave de guardado en localStorage.
AJ.SAVE_KEY = 'agente_juvenil_la_pampa_save_v1';
