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
- NOTA: no hay joystick analógico (es d-pad de botones), así que "zona muerta" no
  aplica; si preferís joystick analógico, queda como pendiente en ROADMAP.

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

---

### Cómo apagar cualquier cosa que no te guste
Todos los sistemas tienen un flag en `js/config.js`. Poné en `false` el que no
quieras (`juice`, `sonido`, `uiPulida`, etc.) y el juego sigue andando sin esa parte.
