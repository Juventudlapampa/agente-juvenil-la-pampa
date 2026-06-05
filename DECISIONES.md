# DECISIONES.md — Bitácora de decisiones de diseño e ingeniería

Cada decisión tomada sin frenar a preguntar queda anotada acá, con su porqué.

## Arquitectura

### D1 — Sin módulos ES (`import`/`export`); namespace global `AJ`
**Por qué:** el requisito "abre con doble clic y funciona" (protocolo `file://`)
choca con los módulos ES: Chrome/Firefox bloquean `import` por CORS en `file://`.
Para garantizar que el juego abra con doble clic **y** ande en GitHub Pages, todos
los archivos son `<script>` clásicos que cuelgan de un único objeto global `AJ`.
El código sigue siendo modular (un archivo por sistema), sólo cambia el mecanismo
de carga. Es la opción más robusta dado el criterio "mejor chico y funcionando".

### D2 — Mapa construido por código en vez de matriz tipeada a mano
**Por qué:** una matriz de 40x30 tipeada a mano es muy propensa a errores de
alineación. `mapa.js` genera las matrices `tex[][]` y `col[][]` con funciones de
estampado (calles, plaza, edificios, aguada). El resultado **es** una matriz
(accesible en `AJ.Mapa.tex`/`AJ.Mapa.col`), pero se arma de forma verificable.

### D3 — Colisiones por chequeo de tile, sin Arcade Physics
**Por qué:** para un top-down con grilla, chequear las 4 esquinas de la caja de
pies contra `AJ.Mapa.col` es más predecible y liviano que configurar cuerpos de
física. Permite "deslizar" contra paredes moviendo eje por eje.

### D4 — Arte 100% generado por código (`art.js`)
**Por qué:** requisito de cero descargas. Cada textura se crea con
`Phaser.Graphics.generateTexture()`. Las claves de textura están documentadas para
reemplazarlas por PNG reales sin tocar el resto del juego (ver cabecera de art.js).

### D5 — Flags de sistema + try/catch por sistema (anti-rotura)
**Por qué:** `CONFIG` tiene un flag por sistema. Cada uno se inicializa sólo si su
flag está en `true`, dentro de un try/catch que lo apaga si falla. Un sistema roto
nunca tira abajo el juego. Los flags arrancan en `false` y se ponen en `true`
recién cuando el smoke-test del sistema da PASS.

### D6 — Phaser 3.80.1 desde jsDelivr
**Por qué:** versión estable y CDN confiable. Si no hay internet la primera vez,
`main.js` muestra un mensaje claro en lugar de pantalla en blanco.

## Resultados del smoke-test

> Se completa al cerrar cada fase. Ver consola del navegador (F12).

- **FASE 1 (verificada en navegador):** Smoke-test **9/9 PASS**.
  - Phaser carga, escena Pueblo activa, mapa 40x30 con colisiones, texturas
    generadas, jugador en spawn válido, cámara siguiéndolo, guardado lee/escribe.
  - Movimiento 4 direcciones OK; colisiones verificadas: caminando al monumento
    (19,15) el jugador se frena en (19,16); caminando a la aguada se frena en la
    orilla sin entrar al agua.
  - Render visual confirmado (canvas no vacío): se ve el pueblo pampeano con
    edificios, plaza, monumento, aguada, calles, veredas, caldenes y HUD.
  - **Nota de entorno:** el preview headless deja la pestaña "hidden", así que
    `requestAnimationFrame` se pausa y el screenshot del harness se cuelga. Se
    verificó manejando el loop a mano (`game.step`) y leyendo `canvas.toDataURL`.
    En un navegador real (doble clic / GitHub Pages) el loop corre normal.

### D7 — Bug encontrado y corregido por el smoke-test
El helper `check()` del smoke-test marcaba como FAIL cualquier retorno "truthy"
no booleano (p. ej. el sprite del jugador). Se corrigió para tratar truthy como
PASS y string como motivo de falla. El autotest cumplió su función: atrapó el
problema antes de cerrar la fase.
