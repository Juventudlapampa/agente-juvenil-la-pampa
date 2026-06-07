# CLAUDE.md — Guía para la próxima sesión de Claude Code

> Documento maestro del repo. Si abrís este proyecto, leé esto primero. Después,
> para detalle: `HANDOFF.md` (estado fase por fase), `DECISIONES.md` (por qué de
> cada cosa), `PLAYTEST.md` (lo único que necesita ojo humano), `ROADMAP.md`
> (pendientes).

## Qué es

**Agente Juvenil – La Pampa**: juego 2D top-down (estilo Pokémon / Stardew) en un
pueblo pampeano ficticio. El jugador es un "Agente Juvenil" que cumple misiones
cívicas. Tono cálido y costumbrista. Hecho para la Subsecretaría de Juventudes de
La Pampa, pero **genérico y reskinable** (sin marcas reales hard-codeadas).

## Stack y POR QUÉ (no cambiar sin entender esto)

- **Phaser 3 por CDN**, JavaScript vanilla, **sin build, sin npm, sin bundler**.
- **NADA de ES modules** (`import`/`export`). Todo cuelga del **namespace global `AJ`**
  y se carga con `<script>` clásicos en `index.html`. **Por qué:** los módulos ES no
  cargan con `file://` (doble clic) por CORS; este enfoque abre con doble clic **y**
  anda en GitHub Pages igual.
- **Arte 100% generado por código** (`js/art.js` con `Phaser.Graphics` +
  `generateTexture`). **Cero descargas de assets.** Sonido también es procedural
  (Web Audio, `js/sonido.js`). Para reemplazar por PNG reales: ver `ARTE.md`.
- **Render 16-nativo ×2 (look GBA):** las texturas son **16×16** (tiles) y **16×24**
  (personajes), mostradas ×2 con `setDisplaySize` (nearest-neighbor, `pixelArt:true`) →
  32 px en pantalla. **La grilla/colisión/cámara siguen en 32 px de pantalla** (no se
  zoomea la cámara: eso duplicaría toda la UI Phaser). PNG CC0 16×16 (Kenney) entran directo.
- **Sin apuestas ni azar con plata** (pedido firme; la economía es determinística).
- **Guardado** en `localStorage` (`js/guardado.js`), con fallback a memoria.

## Arquitectura anti-rotura (clave)

- Cada sistema tiene un **flag en `js/config.js`** y se inicializa dentro de un
  `try/catch` (`Pueblo._iniciarSistema`). Si un sistema falla, **se apaga solo** y el
  juego sigue: nunca un sistema roto crashea todo.
- Regla de oro: **no reescribir lo que anda**. Lo nuevo va detrás de un flag nuevo,
  con hooks aditivos y guardados (`if (AJ.Sistema) { try {...} catch {} }`).
- Un flag pasa a `true` SÓLO cuando su smoke-test da PASS.

## Flags (`js/config.js`) — todos en `true` hoy

| Flag | Qué prende |
|------|-----------|
| `npcsDialogo` | NPCs + cuadro de diálogo (FASE 2) |
| `misiones` | 5 misiones cívicas + Cuaderno (FASE 2) |
| `diaNoche` | reloj + tinte horario (FASE 3) |
| `granja` | plantar/crecer/cosechar + monedas (FASE 4) |
| `rutinas` | NPCs caminan por hora (pathfinding BFS) + afinidad (FASE A) |
| `estaciones` | 4 estaciones: paleta + ritmo de cultivos (FASE B) |
| `crafteo` | mesa de oficios + 5 recetas (FASE C) |
| `viaje` | 2º pueblo "Colonia La Esperanza" + viaje (FASE D) |
| `juice` | tweens, fades, shake, feedback visual (P1) |
| `sonido` | efectos procedurales Web Audio + mute (P2) |
| `uiPulida` | diálogo/cuaderno + táctil afinado (P3) |
| `npcsColonia` | 5 vecinos propios de la Colonia (C1.1) |
| `misionesColonia` | 2 misiones propias de la Colonia (C1.2) |
| `joystickAnalogico` | joystick táctil analógico (reemplaza el d-pad) (C2.1) |
| `menu` | menú de pausa/opciones + reset con doble confirmación (C2.2) |
| `brujula` | flecha hacia la misión activa / la salida (C2.3) |
| `poblarMundo` | +6 vecinos (3 por pueblo), reusando texturas (D1) |
| `masMisiones` | +4 misiones (requiere poblarMundo) (D2) |
| `registro` | Registro del Agente (colección + %) (D3) |
| `tercerPueblo` | 3er pueblo "El Puesto del Monte" (D4) |
| `progreso` | pantalla de progreso/estadísticas (E1) |
| `accesibilidad` | vel. de texto / tamaño / contraste, elegibles (E2) |
| `creditos` | título pulido + créditos (E3) |
| `creadorAgente` | crear Agente (nombre/pronombre/variante visual) al empezar (F1) |
| `capaArte` | cargar PNG de `/assets` si existen, fallback procedural (F2) |
| `estadisticas` | estadísticas de sesión acumuladas entre partidas (F4) |
| `modoGestion` | **Modo Gestión**: capa de datos (medidores/comunidades/pueblos) (G1) |
| `onboarding` | armar la Agencia: 4 pasos de la Hoja de Ruta (G2) |
| `dilemas` | motor de dilemas (situación/opciones/impactos multi-medidor) (G3) |
| `tiradas` | dado 1–20 + modificadores, arco suerte→competencia (G4) |
| `cicloGestion` | ciclo de 30 días (recon/gestión) + mudanza + menú del día (G5) |
| `comunidades` | descubrimiento (pueblo chico) e integración (capital) de comunidades (G6) |

`dev: true` hace que el **smoke-test corra solo** al cargar la escena Pueblo.
Hoy: **Pueblo 1 128/128, Colonia 129/129, El Puesto 119/119 PASS**. 32 flags en true.
**Balance** (números de ritmo) centralizado en `AJ.CONFIG.BALANCE` — ver P5/PLAYTEST.
Joystick: `AJ.CONFIG.JOYSTICK` (radio + zona muerta).

### NPCs y misiones por pueblo (C1.2 + D1/D2) — datos reskinables
- **NPCs:** `AJ.ROSTER_BASE` (11) + `AJ.ROSTER_D1` (6, si `poblarMundo`). `AJ.roster()`
  devuelve la lista efectiva (la usa el Registro). `npc.js` `_defsPueblo1/_defsColonia`
  crean los de cada pueblo; en pueblos sin NPCs (`meta.conNPCs===false`) no se crean.
- **Misiones:** `AJ.MISIONES` (pueblo 1) + `AJ.MISIONES_COLONIA` (si `misionesColonia`) +
  `AJ.MISIONES_D2` (si `masMisiones` Y `poblarMundo`; las del pueblo 1 se insertan ANTES
  de `fiesta`). Cada misión tiene `pueblo` (1 por defecto). El Cuaderno muestra la cadena
  del pueblo actual (`AJ.Mapa.actual`); el estado vive en `estado.misiones[id]` → progreso
  por pueblo. El Final (felicitación) lo dispara sólo la cadena del pueblo 1.
- **Mundo:** `AJ.Mapa.cargar(id)` (1=El pueblo, 2=Colonia, 3=El Puesto si `tercerPueblo`).
  `meta.salidas` = tiles de viaje. `AJ.totalPueblos()` = 2 ó 3.
- **Contenido (D1/D2) generado por un workflow** de agentes (escritores + crítico). Todo
  genérico, sin marcas/programas/nombres reales.

## Estructura

```
index.html              Carga Phaser (CDN) + todos los scripts EN ORDEN
css/estilo.css          Layout, controles táctiles, mute, UI pulida (body.ui-pulida)
js/config.js            CONFIG: flags + parámetros + BALANCE + AJ.bal()
js/art.js               Genera TODO el arte por código
js/mapa.js              Pueblos (AJ.Mapa.cargar(id) reconstruye in-place)
js/jugador.js           Movimiento, animación, colisiones
js/guardado.js          Persistencia (localStorage + fallback memoria)
js/dialogo.js           Cuadro de diálogo RPG
js/npc.js               NPCs + NPCManager
js/misiones.js          Cuaderno + 5 misiones (AJ.MISIONES = datos reskinables)
js/diaNoche.js          Reloj + tinte
js/granja.js            Parcela, cultivos, economía
js/rutinas.js           AJ.Rutinas (movimiento BFS) + AJ.Afinidad (amistad)
js/estaciones.js        4 estaciones
js/crafteo.js           Mesa + AJ.RECETAS (datos)
js/juice.js             AJ.Juice (tweens/fades/shake/celebrar)
js/sonido.js            AJ.Sonido (Web Audio procedural + mute)
js/joystick.js          AJ.Joystick (joystick táctil analógico, C2.1)
js/menu.js              AJ.Menu (pausa/opciones/reset, C2.2; sub-vista 'extras')
js/brujula.js           AJ.Brujula (guía hacia la misión, C2.3)
js/registro.js          AJ.Registro (colección estilo Pokédex, D3) + AJ.roster()
js/progreso.js          AJ.Progreso (stats: tiempo/afinidad/misiones, E1)
js/accesibilidad.js     AJ.Accesibilidad (vel. texto/tamaño/contraste, E2)
js/creditos.js          AJ.Creditos (overlay de créditos, E3)
js/agente.js            AJ.Agente (creador: nombre/pronombre/variante + recoloreo, F1)
assets/manifest.js      AJ.ASSET_MANIFEST (lista de PNG reales para la capa de arte, F2)
js/estadisticas.js      AJ.Stats (estadísticas de sesión acumuladas, F4)
js/gestion/datos.js     Modo Gestión: datos + estado (AJ.Gestion.Datos/Estado, G1)
js/gestion/onboarding.js Armar la Agencia: 4 pasos + UI (AJ.Gestion.Onboarding/UI, G2)
js/gestion/dilemas.js   Motor de dilemas + UI (AJ.Gestion.Dilemas/DilemasUI, G3)
js/gestion/dilemas_banco.js 20 dilemas genéricos validados (banco de contenido, G3)
js/gestion/tiradas.js   Dado con arco suerte→competencia (AJ.Gestion.Tiradas, G4)
js/gestion/ciclo.js     Ciclo 30 días + mudanza + actividades + menú del día (AJ.Gestion.Ciclo/Actividades/CicloUI, G5)
js/gestion/comunidades.js Descubrimiento/integración de comunidades (AJ.Gestion.Comunidades, G6)
js/smoketest.js         Autotest de invariantes (corre en modo dev)
js/main.js              Input unificado + arranque
escenas/Titulo.js       Pantalla de título
escenas/Pueblo.js       Escena principal (orquesta todos los sistemas)
escenas/Final.js        Pantalla de cierre
CONTENIDO_SENSIBLE.md   Dilemas sensibles: estructura + plantilla, REVISIÓN HUMANA
GDD_Agente_Juvenil_La_Pampa.md  Documento de diseño del Modo Gestión
*.md                    CLAUDE / HANDOFF / DECISIONES / ROADMAP / PLAYTEST / README
```

## Modo Gestión (GDD) — aditivo sobre el RPG

Sistema nuevo definido en `GDD_Agente_Juvenil_La_Pampa.md`, **detrás de flags**, que
**no toca el RPG**. Todo cuelga de `AJ.Gestion` (scripts clásicos en `js/gestion/`).
- **G1 `modoGestion`** (`datos.js`): 5 medidores (Agencia/Vínculo escolar/Conocimiento/
  Confianza/Convicción), 10 comunidades, 4 niveles + banco anonimizado del modelo real
  (`MODELO_NIVEL`, **sin nombres reales**), pueblos jugables **FICTICIOS**, 5 líneas de
  actividad, problemáticas con flag `sensible`. `AJ.Gestion.Estado` = estado por pueblo
  en `estado.gestion` (clamp de medidores, `asegurar/actual/aplicarImpacto`).
- **G2 `onboarding`** (`onboarding.js`): los 4 pasos de la Hoja de Ruta (convocatoria/
  diagnóstico/objetivos+bautizo/organización). Lógica pura + asistente DOM (tecla **G**).
  ≥3 miembros = Agencia; <3 = Referente solo.
- **G3 `dilemas`** (`dilemas.js` + `dilemas_banco.js`): motor situación/opciones/impactos;
  26 dilemas genéricos (6 a mano + 20 de un workflow validado). El contenido **sensible NO
  se autogenera** (`CONTENIDO_SENSIBLE.md`, banco sensible vacío). UI = tecla **H**.
- **G4 `tiradas`** (`tiradas.js`): dado 1–20 + modificadores por medidor (arco suerte→
  competencia), resultados graduados (crítico/éxito/parcial/fracaso); modula los impactos
  de las opciones `requiereTirada`. **El dado es mecánica, nunca plata real.**
- **G5 `cicloGestion`** (`ciclo.js`): loop del GDD §2. RECON días 1–5 (explorar/hablar/armar
  Agencia, cada acción gasta un día) → oferta de rol → GESTIÓN días 6–30 con **3 acciones/día**
  (cada una un dilema o una de las 5 actividades, resuelta con el dado) → **perfil de gestor** al
  día 30 → **MUDANZA** (recon de nuevo, heredás experiencia: piso de Confianza + lectura más
  rápida; cada pueblo guarda su estado por separado). Todo vive en el **menú del día** (tecla **G**).
  Con el ciclo activo, las teclas G/H sueltas de G2/G3 se reemplazan por el menú.
- **G6 `comunidades`** (`comunidades.js`): en pueblo chico las comunidades arrancan ocultas y se
  revelan explorando/hablando (la más común primero); hay **latentes** que el jugador siembra. En
  la capital (nivel 4) están las 10 y el modo se invierte: **integración** (actividad-puente que
  junta comunidades, vale más). Una actividad acierta más si apunta a una comunidad que existe **y
  conocés** (bonus de tirada). Sin la infra del pueblo → **cooperación regional** (−Confianza).
- **GP (pulido de gestión, sin flags nuevos):** GP1 = más dilemas genéricos (banco **38**, en
  `dilemas_banco2.js`); GP2 = entrada visible (botón **🗂 Modo Gestión** + tecla G) y ayuda
  "¿cómo se juega?" en el menú del día. Sin tocar balance.
- **Cierre G1–G7 + GP hecho.** Lo que sigue es bajada institucional + contenido a mano (ver abajo).
- **Pendiente humano:** los dilemas **sensibles** (`CONTENIDO_SENSIBLE.md`, salud mental/consumos/
  violencias/bullying) y los dilemas con **voz propia** los escribe y aprueba una persona.

## Cómo correr y testear

- **Jugar:** doble clic en `index.html` (la 1ª vez necesita internet para Phaser CDN).
  O server local: `node` con un static server (¡OJO! `python` en esta máquina es el
  stub de Windows Store, no Python real — usar Node).
- **Smoke-test:** abrí la consola del navegador (F12). Con `dev:true` corre solo al
  entrar al pueblo e imprime PASS/FAIL. Hoy: **Pueblo 1 123/123, Colonia 124/124, El Puesto
  114/114 PASS**. Programáticamente: `AJ.SmokeTest.correr(AJ.juego.scene.getScene('Pueblo'))`.

## Dónde retomar

1. **Lo más valioso ahora es el playtest humano** (ver `PLAYTEST.md`): el *feel*
   (velocidad, ritmo, balance, confort táctil) no se puede automatizar. Preguntale
   eso al humano antes de seguir tocando números.
2. **Pendientes técnicos** en `ROADMAP.md` (p. ej. NPCs propios de la Colonia,
   joystick analógico opcional, más recetas, arreglar el solape latente Muni/aguada
   en el mapa base).
3. **Git:** no hay remote configurado. El `git push` lo hace el humano (crear repo en
   GitHub y `git remote add origin ... && git push`). Ver README → GitHub Pages.

## Reglas que NO se negocian
Sin ES modules. Sin descargas de assets. Sin apuestas/azar con plata. No romper la
base: todo lo nuevo detrás de un flag, con try/catch que autoapaga. Commit por fase.
