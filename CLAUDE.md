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
  (Web Audio, `js/sonido.js`). Para reemplazar por PNG reales: ver cabecera de art.js.
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

`dev: true` hace que el **smoke-test corra solo** al cargar la escena Pueblo.
**Balance** (números de ritmo) centralizado en `AJ.CONFIG.BALANCE` — ver P5/PLAYTEST.

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
js/smoketest.js         Autotest de invariantes (corre en modo dev)
js/main.js              Input unificado + arranque
escenas/Titulo.js       Pantalla de título
escenas/Pueblo.js       Escena principal (orquesta todos los sistemas)
escenas/Final.js        Pantalla de cierre
*.md                    CLAUDE / HANDOFF / DECISIONES / ROADMAP / PLAYTEST / README
```

## Cómo correr y testear

- **Jugar:** doble clic en `index.html` (la 1ª vez necesita internet para Phaser CDN).
  O server local: `node` con un static server (¡OJO! `python` en esta máquina es el
  stub de Windows Store, no Python real — usar Node).
- **Smoke-test:** abrí la consola del navegador (F12). Con `dev:true` corre solo al
  entrar al pueblo e imprime PASS/FAIL. Hoy: **55/55 PASS** (Pueblo 1), 47/47 (Colonia).
  Programáticamente: `AJ.SmokeTest.correr(AJ.juego.scene.getScene('Pueblo'))`.

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
