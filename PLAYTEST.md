# PLAYTEST.md — Lo único que necesita ojo humano

> La corrida nocturna automatizó todo el pulido que NO depende del gusto (juice,
> sonido, UX, bordes, robustez, balance con defaults razonables). Pero el *feel*
> —que algo "se sienta bien"— no se automatiza: **hay que jugarlo**. Esta es la
> lista corta y concreta de lo que un humano tiene que probar y decidir.
>
> Cómo: abrí `index.html` (doble clic) en compu **y** en celular. Jugá 5–10 min.
> Para cada punto, anotá: ¿bien / lento / rápido / molesto? Si querés cambiar algo,
> casi todo se tunea en `js/config.js` → `AJ.CONFIG.BALANCE` (un solo lugar).

## 1. Velocidad del personaje
- ¿Camina cómodo, o se siente lento/pesado o demasiado rápido?
- Tunear: `BALANCE` (doc) / `CONFIG.VELOCIDAD` (px/seg, default 150).

## 2. Ritmo del diálogo
- ¿Los tramos de texto son muy largos? ¿Se avanza cómodo con E / botón?
- ¿El sonido de diálogo (blip) cansa o está bien?
- Tunear texto: es contenido (en `js/misiones.js` → `AJ.MISIONES`).
- **E2:** ahora la **velocidad de texto del diálogo la elige el jugador**
  (Accesibilidad: lento/normal/rápido/instantáneo). Esto esquiva el debate de "qué
  ritmo es el correcto". Igual: ¿el **default 'normal'** está bien para arrancar, o
  conviene otro? (es lo único de ritmo que sigue siendo una decisión de default).

## 3. Ciclo día/noche y estaciones
- ¿El día dura bien (default 4 min reales) o marea?
- ¿Las estaciones cambian muy seguido (default cada 3 días)?
- Tunear: `CONFIG.SEGUNDOS_POR_DIA`, `CONFIG.DIAS_POR_ESTACION`.

## 4. Balance de la granja / economía
- ¿Los cultivos crecen tan lento que aburre, o tan rápido que no tiene gracia?
  (default ~2 min a maduro).
- ¿10 monedas por cosecha se siente justo? ¿Las recetas valen la pena?
- Tunear: `BALANCE.segCrecimientoEtapa`, `BALANCE.cosechaMonedas`,
  `BALANCE.factorPrecioCrafteo`, y las recetas en `js/crafteo.js` → `AJ.RECETAS`.

## 5. Misiones
- ¿Se entiende a dónde ir (el "!" sobre el NPC, la pista del Cuaderno)?
- ¿La cadena de 5 misiones se siente corta/larga? ¿Aburre ir y volver?

## 6. Afinidad / amistad
- ¿Subir afinidad hablando 1 vez por día tiene sentido, o querés que cueste más?
- Tunear: `BALANCE.afinidadPorCharla` (default 20; 5 charlas = máximo).

## 7. Controles táctiles (CELULAR — importante)
- ¿Los botones del d-pad caen cómodos bajo el pulgar? ¿Tamaño y separación OK?
- ¿El botón de acción (E) está bien ubicado? ¿Y el de mute?
- ¿Se traba alguna dirección al deslizar el dedo?
- Si algo no cae cómodo: el layout está en `css/estilo.css` bajo `body.ui-pulida`.

## 7b. Joystick analógico (CELULAR — C2.1)
- Con `CONFIG.joystickAnalogico` en `true`, el d-pad se reemplaza por un **joystick
  analógico** abajo-izquierda. Probalo en el celu: ¿se siente mejor que los botones?
- ¿La **zona muerta** está bien (no se mueve solo, pero arranca sin tener que empujar
  de más)? ¿El **radio** es cómodo para el pulgar?
- Tunear: `CONFIG.JOYSTICK.zonaMuerta` (0..1, default 0.30) y `CONFIG.JOYSTICK.radioMax`
  (px, default 55). Es 4 direcciones con "snap" (el juego es top-down 4-dir).
- Decisión tuya: ¿dejás el joystick o el d-pad como control por defecto? (Se elige con
  el flag; sólo uno se muestra a la vez para no encimarse.)

## 8. Sonido
- ¿Los efectos procedurales (pasos, cosecha, misión) suman o molestan?
- El primer sonido recién suena tras tocar/teclear algo (los navegadores bloquean
  el audio hasta un gesto: es esperado, no es un bug). Botón de mute arriba-derecha.

## 9. Juice
- ¿Los fades entre pantallas se sienten bien o lentos? (default ~260 ms).
- ¿El shake al cumplir misión / cambiar estación es sutil o exagerado?

## 10. Viaje entre pueblos
- ¿Se entiende que el cartel "→ Colonia" lleva al otro pueblo?
- ¿La Colonia se siente como un lugar útil (farmear/craftear tranquilo) o vacío?

## 11. La Colonia (C1) — ¿engancha como el pueblo principal?
- Ahora la Colonia tiene 5 vecinos propios (Don Ramón, El Gallego, La Seño Marta,
  El Colorado, Doña Anunciación) con diálogo y afinidad, y 2 misiones propias.
- ¿Da ganas de pasar tiempo en la Colonia o se siente de segunda? ¿Las 2 misiones
  alcanzan o querés más?
- ¿El progreso por separado (cada pueblo recuerda lo suyo) se entiende al jugar?

## 11b. El tercer pueblo "El Puesto del Monte" (D4) — ¿engancha?
- Es un outpost de monte (huerta, mesa de oficios, mucha leña, aguada), SIN vecinos.
- ¿Da ganas de ir, o se siente un mapa de relleno? ¿Le falta algo (un par de NPCs,
  una misión)? Si te parece de más, se apaga con `CONFIG.tercerPueblo`.

## 11c. El Registro del Agente (D3/E1) — ¿motiva o es relleno?
- El Registro (menú → Registro / Opciones) muestra % de avance: vecinos, pueblos,
  misiones, logros. ¿Te dan ganas de completarlo (verlo al 100%) o lo ignorás?
- La pantalla de Progreso suma tiempo jugado y afinidad por vecino. ¿Sirve o sobra?

## 12. Menú de pausa, brújula (C2) — QoL
- ¿El menú de pausa (tecla **P** o botón ☰) tiene lo que esperás? ¿El reset con doble
  confirmación es claro (no se borra sin querer)?
- ¿La **brújula** (flecha hacia la misión) ayuda sin molestar, o la sentís invasiva?
  Se puede apagar con `CONFIG.brujula`.

## 13. Identidad del Agente (creador) — Capa F
- Al "Jugar" se elige nombre, pronombre y **variante visual** (4 colores del sprite).
- **¿Las 4 variantes de color se distinguen bien** entre sí en pantalla (no que dos
  parezcan iguales)? Si alguna se confunde, los colores están en `js/agente.js` →
  `VARIANTES` (camisa + gorra de cada una).
- **¿El nombre del Agente en los diálogos se siente natural o forzado?** (los NPCs lo usan
  como vocativo donde antes decían "Agente"). ¿Hay alguna línea donde queda raro?
- Probá también **sin nombre** (dejarlo vacío): debe quedar "Agente" como antes, sin
  huecos. (Ya verificado en el smoke; igual mirá que se lea natural.)

## 14. Estadísticas de sesión (F4) — ¿motivan?
- En el panel de Progreso (menú → Progreso) hay una sección "Estadísticas (todas tus
  partidas)": tiempo total, pasos, diálogos leídos, vecinos conocidos, misiones por pueblo.
  Se acumulan entre partidas (localStorage).
- **¿Las estadísticas motivan a seguir jugando** (dan ganas de subir los números) o son
  relleno que se ignora? Si motivan poco, se podría sumar alguna meta/medalla más adelante
  (queda en ROADMAP). Se apaga con `CONFIG.estadisticas`.

## 15. Modo Gestión (GDD) — balance y ritmo (G1–G4)
> El Modo Gestión está en capas tempranas (datos, onboarding, dilemas, dado). El ciclo de
> 30 días (G5) todavía no está, así que por ahora se prueba por entradas temporales:
> tecla **G** (armar la Agencia) y tecla **H** (siguiente dilema), con `modoGestion` y sus
> sub-flags en `true`. **Todos los números de abajo son defaults razonables, no finos.**

- **Balance de los 5 medidores.** Arrancan en valores fijos (Agencia 0, Vínculo 30,
  Conocimiento 20, Confianza 40, Convicción 60, en `js/gestion/datos.js` → `MEDIDORES.inicial`).
  ¿Se siente la tensión de que "no quedan los cinco arriba a la vez"? ¿Algún medidor sube/baja
  demasiado fácil? Los impactos de cada opción están en los dilemas (datos).
- **Ritmo de los dilemas.** ¿Las situaciones se entienden y enganchan? ¿Las opciones tienen un
  trade-off que se siente (no hay una obviamente mejor)? ¿El tono pampeano suena natural?
  (26 dilemas genéricos; el contenido es dato editable en `dilemas.js`/`dilemas_banco.js`.)
- **El dado (arco suerte→competencia).** ¿Al principio (medidores bajos) se siente que dependés
  de la suerte, y más adelante que tu gestión manda? ¿La dificultad por defecto (12) y los
  modificadores se sienten justos o castigan/regalan? Se tunea en `js/gestion/tiradas.js`
  (`modMedidor`, `clasificar`, `PENAL_REFERENTE_SOLO`). **Ojo:** esto es lo más sensible al feel.
- **Referente solo vs Agencia.** ¿"Quedar referente solo" (menos de 3 miembros) se siente como
  una elección válida pero más dura, o como un castigo? (penalidad −3 al dado).
- **Onboarding.** ¿Los 4 pasos se entienden? ¿Elegir canales según el pueblo (boca a boca vs
  redes) tiene sentido? ¿Bautizar la Agencia se siente tuyo?
- **Reacción tras una tirada fallida.** Cuando el dado da Fracaso/Parcial en una opción con 🎲,
  ¿el texto que aparece acompaña bien el resultado, o conviene escribir reacciones por resultado?

> **Contenido sensible (salud mental, consumos, violencias, bullying):** NO está en el juego;
> va escrito a mano y revisado (ver `CONTENIDO_SENSIBLE.md`). Eso es decisión humana, no de la
> corrida nocturna.

---

### Cómo apagar cualquier cosa que no te guste
Todos los sistemas tienen un flag en `js/config.js`. Poné en `false` el que no
quieras (`juice`, `sonido`, `uiPulida`, etc.) y el juego sigue andando sin esa parte.
