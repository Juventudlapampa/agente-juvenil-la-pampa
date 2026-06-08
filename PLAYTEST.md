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

## 16. Modo Gestión — ciclo de 30 días, comunidades y mudanza (G5–G7)
> El ciclo ya está entero: con `cicloGestion` y `comunidades` en `true`, la tecla **G** abre el
> **menú del día**. Recon (días 1–5) → aceptás el rol → gestión (días 6–30, 3 acciones/día) →
> perfil al día 30 → mudanza. **Todos los números son defaults, no finos** — esto es 100% playtest.

- **¿El ritmo de 30 días aburre o engancha?** ¿Recon de 5 días se siente bien o largo? ¿3 acciones
  por día alcanzan o quedan cortas? ¿Llegar al día 30 se siente un viaje o una maratón? (Se tunea
  en `js/gestion/ciclo.js`: `RECON_DIAS`, `TOTAL_DIAS`, `ACCIONES_DIA`.)
- **¿El feel del dado se siente justo?** Al principio (medidores bajos) dependés de la suerte; más
  adelante, de tu gestión. ¿Esa curva se siente bien o castiga/regala? ¿Las actividades sin la infra
  del pueblo (dificultad +4) o con cooperación regional (−Confianza) son una elección interesante?
- **¿El balance de medidores funciona?** ¿Se siente la tensión de que no quedan los 5 arriba? ¿Algún
  medidor sube/baja de más con las actividades (`Actividades.BASE`) o los dilemas?
- **¿Descubrir comunidades motiva?** En pueblo chico arrancan ocultas (chips ???) y se revelan
  explorando; las raras son el "hallazgo". ¿Da ganas de explorar para destrabarlas? ¿Sembrar una
  latente (−Confianza) tienta? En la capital (nivel 4) es integración (actividad-puente): ¿se siente
  distinto y más rico que el pueblo chico?
- **¿La mudanza tiene sentido?** Irte a otro pueblo = recon de nuevo pero con experiencia heredada
  (piso de Confianza, leés más rápido). ¿Funciona como "selector de dificultad" (de un nivel 1 que
  dominaste a un nivel 4 que es otro mundo)? ¿El piso heredado se siente justo o regala?
- **¿Los perfiles de gestor cierran?** Al día 30 sale un perfil (articulador/idealista/operador/
  cercano/referente solo…). ¿Refleja cómo jugaste? (reglas en `Ciclo.calcularPerfil`).

> **Lo que escribe el humano (no la corrida nocturna):** los dilemas **sensibles**
> (`CONTENIDO_SENSIBLE.md`) y darles **voz propia / bajada institucional** a dilemas y actividades.
> El motor está listo; el contenido con identidad local y los temas delicados los aprueba una persona.

---

## Arte Kenney (revisión visual — criterio humano)

Se "vistió" parte del juego con arte CC0 de Kenney (recoloreado a DawnBringer 32
por el pipeline Node). El arte **no automatizable** es justo si *queda bien*. Mirá
en pantalla y decidí. Si algo no te gusta, **borralo de `assets/tiles/`** (o sacalo
del mapa y re-corré `recortar.js`) y vuelve solo al procedural — no rompe nada.

**Lo que SÍ se mapeó (mirá que calce):**
- **Edificios** (casa / iglesia / municipalidad / casa de juventud / almacén):
  techo+pared+ventana+puerta. Madera (techo rojo) para casa/juventud/almacén;
  piedra (techo azul) para iglesia/muni. ¿Se leen como esos edificios? ¿La muni y
  la casa de juventud se distinguen lo suficiente (hoy reusan tiles: muni=piedra,
  juventud=madera, igual que iglesia/casa)? Si querés diferenciarlas, hay que
  elegir otros tiles del sheet.
- **calden**: es un **arbusto redondo** de Tiny Town (1 tile). No es un caldén
  pampeano real; Tiny Town no tiene un árbol de 1 tile mejor. ¿Pasa o preferís el
  procedural?
- **tierra / pasto**: dirt sólido y pasto. OK.
- **agua**: agua cian del roguelike (viste la aguada). Tiene una piedrita en una
  esquina (del tile original). ¿Molesta al repetirse o suma textura?
- **plaza**: piso de piedra gris del roguelike. ¿Se lee como plaza?
- **vereda** (novena noche): ladrillo marrón del roguelike. ¿Pega como vereda/camino?
- **moneda** (novena noche): monedas de oro del roguelike (ícono de plata/pickups).
- **mesa_crafteo** (novena noche): un **yunque** del roguelike (estación de oficios).

**Coherencia visual — criterio humano (panel automático novena noche):**
Un panel de 3 lentes revisó el set completo. **Paleta: limpia** (todo DB32, cero
embarrado fuera de paleta). Marcas de DISEÑO (no de color → NO se tocaron, decidí vos):
- **agua**: el cian es el tile más **brillante y liso** del set; al lado de tierras/
  maderas apagadas "saltea". ¿Te gusta el contraste (look Pokémon) o lo querés más
  apagado? (volver a procedural = agua más oscura; o elegir otro tile de agua).
- **calden / moneda / mesa_crafteo**: vienen del **roguelike**, que tiene outline más
  oscuro y sombreado más fino que el estilo **plano y chunky** de Tiny Town (edificios/
  pasto/tierra). ¿La mezcla molesta o pasa? Si molesta, hay que buscar equivalentes
  en Tiny Town o dibujarlos a mano.
- **moneda y calden** salieron "embarrados" en la auditoría (original lejos de DB32:
  77% y 24%): igual leen bien (panel 3/3), pero mirá si el oro/verde te convencen.
  Ver `AUDITORIA_ARTE.md` (lo genera `node auditar_arte.js`).

**Lo que quedó PROCEDURAL (no había equivalente claro en los packs bajados):**
- **PERSONAJES (jugador + 10 NPCs).** Es el 78% del inventario de arte (132/170).
  Los packs en `assets/raw/` son de **entorno/UI**: NINGUNO trae personajes con 4
  direcciones + frames de caminata. Tiny Town tiene 1 pose de frente; el roguelike
  no trae personajes (falta su `roguelikeChar`). Mantenerlos procedurales además
  **preserva las 4 variantes de color del creador de agente** y las animaciones.
  → Para vestir personajes hay que **bajar un pack de personajes** (p. ej. Kenney
  "Tiny Dungeon/Town Characters" o "roguelikeChar") y re-correr el pipeline.
- **cultivo_0..3** (no hay cultivos en etapas), **arado** (hay tierra, pero se deja
  procedural por **coherencia** con los cultivos procedurales: plot vacío y plantado
  deben matchear), **monumento** (la estatua del roguelike no calzó: panel 0/3),
  **junco**, **exclamación**, **check**, **brujula_flecha** (UI 32×28, tamaño especial):
  sin equivalente claro → siguen por código. Detalle y motivos: `AUDITORIA_ARTE.md`.
- **UI y controles táctiles (FASE 4 pendiente):** los packs `pixel-ui` y
  `mobile-controls` ESTÁN en `raw/`, pero (a) la UI del juego se dibuja procedural
  (Phaser.Graphics) y los táctiles son HTML/CSS — cablearlos es reescribir código
  de UI con riesgo de romper el input; (b) sus PNG son de 4-bit y el recolorador
  (8-bit) los saltea. Se dejó para una sesión dedicada **con tu ojo** (el look de
  UI es criterio visual). No mueve el % de cobertura (que mide tiles+sprites).

**Cobertura de arte hoy:** `AJ.VerificarAssets.correr()` → **16% (28/170)**.
Topeada por los personajes (sin pack). Con un pack de personajes saltaría a ~90%+.

---

## Capa narrativa-temporal del Modo Gestión (N1–N6) — criterio humano

Esto es nuevo y **el feel hay que jugarlo** (la corrida nocturna verificó que funciona y
no rompe, no que "se sienta bien"). Entrá al Modo Gestión (tecla **G** o botón 🗂) y:

- **¿El ORIGEN cambia bien la sensación de partida?** Probá los 5 (mérito / intendente /
  comodín / urgencia / barrio). ¿Se nota que arrancás distinto? ¿Alguno se siente regalado
  o injugable? ¿El 6º medidor **Carisma** aporta o sobra? (presets en `datos.js` → `ORIGENES`).
- **¿El RITMO DE FINDES engancha?** Semana = preparación (2 gestiones), finde = ejecución
  (1 actividad/dilema/misión con dado). 12 findes por temporada. ¿12 findes es largo/corto?
  ¿La preparación suma o es trámite? ¿El cap de 2 preparaciones está bien? (`temporadas.js`:
  `FINDES_TEMPORADA`, `PREP_CAP`, `PREP`). **Ojo balance:** las preparaciones dan medidores
  modestos directos — si inflan de más, bajales el impacto.
- **¿SEPTIEMBRE se siente como clímax?** En el modo anual (verano→laburo→invierno→segunda
  mitad), el último finde de la segunda mitad es el **Mes de las Juventudes** (banner ⭐).
  ¿Se siente que "todo se juega ahí" o pasa de largo? Hoy el clímax es narrativo (no hay
  multiplicador mecánico, para no tocar el balance) — ¿alcanza, o querés que pese más?
- **¿Las REGIONES se juegan distinto?** Mudate entre zonas (este cerealero / caldenal / oeste
  árido / salinas / Colorado-Sur / hub centro). ¿El sabor + las misiones de cada zona se sienten
  propios? ¿El agua/Atuel del oeste quedó **educativo y apartidario** (no militante)? Las
  misiones son plantillas genéricas (`regiones.js` → `ZONAS`); reskinables.
- **Mesa Provincial:** ¿el arranque (viaje → Mesa → vuelta) sienta bien el tono institucional?
  ¿Volver a la Mesa (botón en el menú del día) aporta?

> Todo esto es **aditivo y apagable**: si algo no te cierra, poné su flag en `false`
> (`origenJugador`, `mesaProvincial`, `relojTemporadas`, `modoAnual`, `misionesPorRegion`)
> y el Modo Gestión vuelve al ciclo de 30 días de antes. **Contenido sensible sigue a mano**
> (no se autogeneró nada). El balance fino de los nuevos números es criterio humano.

## Apertura cinematográfica + Mundo interactivo (O1–O2) — criterio humano

Esto es **lo nuevo de esta corrida** y es PURO feel: la corrida verificó que funciona y no
rompe, pero si "engancha" sólo lo decís jugando. Empezá una **partida nueva** ("Jugar"):

- **¿La APERTURA engancha?** Mirá la secuencia entera: colectivo (parallax) → Mesa → crear
  avatar → vida previa → charla de cierre → tu pueblo. ¿El **ritmo de la intro** es el justo,
  o se hace larga / corta? ¿El viaje en colectivo dura bien (hoy ~7s o tap para saltar)? ¿El
  botón **"Saltear intro"** está donde tiene que estar? Probá **saltearla** entera y ver que
  igual arrancás bien.
- **¿La VIDA PREVIA se siente significativa?** Los 4 ejes (crianza / adolescencia / cómo
  llegaste / fortaleza). ¿Las opciones se sienten distintas y "tuyas"? ¿El **resumen** ("Sos
  alguien que…") cierra bien? ¿Las elecciones se NOTAN después en los medidores del Modo
  Gestión, o el efecto es muy sutil? (los deltas están en `js/vida_previa.js`; "cómo llegaste"
  reusa los orígenes N1). ¿Falta/sobra algún eje?
- **¿La MESA y el tono?** Los 6 agentes de otras localidades, el mate, el "no estás solo/a".
  ¿El texto suena a La Pampa, canchero pero sin gallegadas? ¿El **tutorial** del cierre alcanza
  para entender qué hacer, o conviene reforzarlo?
- **¿Aporta ENTRAR a las casas/edificios?** Entrá a la Casa de la Juventud, el almacén, la
  Muni, la iglesia y un par de casas (interactuá de frente a la puerta con **E**). ¿Da
  sensación de "mundo vivo"? ¿Los interiores se ven bien o muy placeholder? ¿Los NPCs de
  adentro y los objetos (radio, mural, estantería, monumento) suman o son de relleno?
  ¿La cámara/centrado del interior se ve bien?
- **Arte (placeholder):** el colectivo, la ruta y los interiores son **procedurales** (ver
  `AUDITORIA_ARTE.md` → apéndice O1/O2). ¿Cuáles vale la pena DIBUJAR primero? (el colectivo
  y los muebles de interior son los candidatos más obvios).

> Aditivo y apagable: `aperturaCine` y `mundoInteractivo` en `js/config.js`. Con `aperturaCine`
> off, "Jugar" usa el creador clásico → pueblo. Con `mundoInteractivo` off, las puertas no
> abren y todo queda como antes.

## Cámara cercana (O-cam) — criterio humano

Lo nuevo de esta corrida. La cámara ahora es **cercana** (se ve ~14 tiles, no el pueblo entero).
Jugá un rato caminando por el pueblo y entrando a las casas, y decidí:

- **¿El nivel de ZOOM se siente bien?** ¿14 tiles de ancho es la distancia justa, o querés ver
  **más** (sensación más abierta) o **menos** (más íntimo/claustrofóbico)? Es un solo número:
  `js/config.js` → `CONFIG.VISTA` (más chico = más zoom; p. ej. `416×312` ≈ 13 tiles, `512×384`
  ≈ 16 tiles). Mantené 4:3.
- **¿La EXPLORACIÓN engancha ahora?** Antes se veía todo de un vistazo; ahora descubrís el pueblo
  caminando. ¿Da más ganas de recorrer, o se siente que "no ves lo suficiente" y molesta?
- **¿El seguimiento de la cámara es cómodo?** ¿Sigue suave al caminar o notás tirones/temblor?
  (el lerp está en `escenas/Pueblo.js` → `startFollow(..., 0.12, 0.12)`; subir el número = más
  pegada/rápida, bajar = más suave/lenta).
- **¿Entrar a las casas aporta** con la cámara cercana? ¿Los interiores se ven bien centrados?
- **¿Se juega cómodo en CELULAR?** Probalo en el teléfono: ¿el personaje y el texto se ven a buen
  tamaño?, ¿los botones táctiles quedan cómodos (no tapan nada importante)?, ¿la porción de mundo
  visible alcanza para jugar sin marearse?

> Apagable: `camaraCercana: false` en `js/config.js` vuelve a la cámara lejana (800×600) de antes.

### Cómo apagar cualquier cosa que no te guste
Todos los sistemas tienen un flag en `js/config.js`. Poné en `false` el que no
quieras (`juice`, `sonido`, `uiPulida`, etc.) y el juego sigue andando sin esa parte.
**Arte:** para volver al procedural de una pieza, borrá su PNG de `assets/tiles/`
(o `assets/sprites/`) y re-corré `node recortar.js` para regenerar el manifest.
