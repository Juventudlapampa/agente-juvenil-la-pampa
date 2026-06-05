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
  diaNoche:    false,  // FASE 3: ciclo día/noche con tinte y reloj
  granja:      false,  // FASE 4: parcela, cultivos y economía mínima

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
};

// Clave de guardado en localStorage.
AJ.SAVE_KEY = 'agente_juvenil_la_pampa_save_v1';
