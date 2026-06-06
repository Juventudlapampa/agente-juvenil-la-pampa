# Agente Juvenil – La Pampa

Juego top-down (estilo Pokémon / Stardew Valley) ambientado en un pueblo pampeano
ficticio pero reconocible. Sos un **Agente Juvenil** que cumple misiones cívicas.
Tono cálido y costumbrista.

Hecho con **Phaser 3** por CDN, JavaScript vanilla, sin build ni npm. Todo el arte
se genera por código (cero descargas). Guardado en `localStorage`.

## Cómo correr

### Opción A — Doble clic
Abrí `index.html` con doble clic. Funciona en Chrome, Firefox o Edge.
> Necesitás internet la **primera** vez para que el navegador baje Phaser del CDN.

### Opción B — Servidor local (recomendado para desarrollo)
```bash
# Python 3
python -m http.server 8000
# luego abrí http://localhost:8000
```

## Controles

| Acción      | Teclado            | Celular            |
|-------------|--------------------|--------------------|
| Moverse     | Flechas o WASD     | D-pad en pantalla  |
| Interactuar | Espacio / E / Enter| Botón **E**        |
| Volver al título | Esc           | —                  |

## Publicar en GitHub Pages

1. Creá un repo y subí todo el contenido de esta carpeta.
   ```bash
   git add .
   git commit -m "Agente Juvenil – La Pampa"
   git branch -M main
   git remote add origin https://github.com/USUARIO/REPO.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Branch: `main` / root** → Save.
3. A los minutos queda en `https://USUARIO.github.io/REPO/`.

No hace falta configurar nada más: es HTML + JS estático.

## Reemplazar el arte por PNG reales (artist-ready)

El arte se genera por código (`js/art.js`), pero el juego está **listo para
artistas** (Capa de Arte, `CONFIG.capaArte`). Para usar un PNG real:

1. Guardá el PNG con el **nombre exacto** de la textura:
   `assets/tiles/<nombre>.png` (32×32) o `assets/sprites/<nombre>.png` (32×48).
2. Agregá ese `<nombre>` al array correcto en **`assets/manifest.js`**.
3. Recargá: el juego usa tu PNG; todo lo demás sigue procedural. **No tocás código.**

La guía completa (lista de nombres, dimensiones, paleta recomendada) está en
**[`ARTE.md`](ARTE.md)**.

## Envolver en .exe con Tauri (escritorio)

[Tauri](https://tauri.app) empaqueta la web en un ejecutable liviano.

1. Instalá Rust y los prerequisitos de Tauri (ver su web).
2. Instalá la CLI:
   ```bash
   npm create tauri-app@latest
   ```
   o, en un proyecto existente:
   ```bash
   npm install -D @tauri-apps/cli
   ```
3. En `src-tauri/tauri.conf.json`, apuntá `frontendDist` a esta carpeta (donde está
   `index.html`) y dejá `beforeBuildCommand` vacío (no hay build).
4. Compilá:
   ```bash
   npx tauri build
   ```
   El `.exe` (o instalador) queda en `src-tauri/target/release/`.

> Alternativa simple sin Rust: **Electron** o incluso un acceso directo al
> `index.html`. Tauri da el binario más chico.

## Estructura

```
index.html              Carga Phaser (CDN) y todos los scripts
css/estilo.css          Layout + controles táctiles
js/config.js            CONFIG: flags de sistemas y parámetros
js/art.js               Genera TODO el arte por código
js/mapa.js              El pueblo (matrices tex/col + landmarks)
js/jugador.js           Movimiento, animación y colisiones
js/guardado.js          Persistencia robusta en localStorage
js/dialogo.js           Cuadro de diálogo RPG (FASE 2)
js/npc.js               NPCs (FASE 2)
js/misiones.js          Cuaderno de misiones cívicas (FASE 2)
js/diaNoche.js          Ciclo día/noche (FASE 3)
js/granja.js            Parcela y cultivos (FASE 4)
js/rutinas.js           NPCs con rutinas diarias + afinidad (FASE A)
js/estaciones.js        4 estaciones: paleta + ritmo de cultivos (FASE B)
js/crafteo.js           Mesa de oficios + recetas (FASE C)
js/smoketest.js         Autotest de invariantes (modo dev)
js/main.js              Input unificado + arranque
escenas/Titulo.js       Pantalla de título
escenas/Pueblo.js       Escena principal
escenas/Final.js        Pantalla de cierre
DECISIONES.md           Bitácora de decisiones
ROADMAP.md              Pendientes y futuras noches
```

## Qué hay para hacer

- **Misiones cívicas**: hablá con los vecinos del pueblo (tienen un "!" cuando te
  toca). Completá las 5 para llegar al final.
- **Amistad**: hablar con los vecinos sube la afinidad (botón **♥ Vecinos** o tecla
  **C** para ver el Cuaderno de Vecinos).
- **Rutinas**: los vecinos caminan por el pueblo según la hora (a la plaza a la
  tarde, a su lugar de mañana y de noche).
- **Granja**: plantá en la huerta (E), esperá que crezca y cosechá por monedas + 🥕.
- **Estaciones**: cada 3 días cambia la estación (paleta + ritmo de los cultivos).
- **Mesa de oficios**: combiná verdura (cosecha) y leña (de los caldenes, con E) en
  5 recetas.
- **Viajá**: caminá hasta el cartel **→ Colonia** (este del pueblo) para ir a la
  **Colonia La Esperanza**, una chacra para farmear y craftear tranquilo. El juego
  recuerda en qué pueblo estás.

## Flags de sistemas (`js/config.js`)

`npcsDialogo`, `misiones`, `diaNoche`, `granja`, `rutinas`, `estaciones`, `crafteo`,
`viaje`. Cada uno prende/apaga su sistema. Poné cualquiera en `false` y el juego sigue
andando sin esa parte (útil para depurar o para una versión más chica).

## Filosofía anti-rotura

Cada sistema tiene un flag en `CONFIG` y se inicializa dentro de un try/catch. Si un
sistema falla, se apaga solo y el juego sigue. Un autotest (`smoketest.js`) verifica
invariantes en cada carga (modo dev) e imprime PASS/FAIL en la consola. Hoy: **42/42
PASS** en el pueblo principal.
