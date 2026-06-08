# AGENTE JUVENIL — LA PAMPA
## Documento de Diseño del Juego (GDD)

> Documento maestro de diseño del **Modo Gestión** de *Agente Juvenil – La Pampa*.
> Léelo antes de tocar código. Define el qué y el porqué; el cómo (capas, flags) está al final.
> **Fuente de los datos:** Mapeo de la Mesa Provincial de Agentes Juveniles (62 localidades, abril 2025),
> Agencias en Movimiento (2025), Hoja de Ruta Juvenil (2025) y el Observatorio de la Juventud (2018–2026).
> Lo marcado como *(real)* sale de esos relevamientos; lo marcado como *(estimado)* se completa por nivel.

---

## 0. CÓMO USAR ESTE DOCUMENTO

El juego ya tiene una base RPG construida y commiteada (mundo, movimiento, NPCs, misiones plantilla,
granja, día/noche, tres pueblos, Registro, accesibilidad). **Este GDD NO reescribe nada de eso.**
Define un **sistema nuevo, aditivo y detrás de flags**: el *Modo Gestión*, que convierte las misiones
planas en decisiones con consecuencias, agrega el armado de Agencia, los medidores y el azar.
Se construye por capas, sin romper la base. La regla de oro de siempre manda.

---

## 1. CONCEPTO

Sos un/a joven que llega a un pueblo pampeano y se convierte en **Agente Juvenil**: armás (o no) una
Agencia, conocés a los pibes, gestionás con plata que nunca alcanza, y aprendés que **gobernar es elegir
a quién dejás afuera**. El juego dura **30 días** por pueblo. Podés mudarte y volver a empezar en otro,
más difícil. La premisa emocional, sacada de los datos reales: *nadie queda del todo conforme, y el tipo
de gestor que sos se define en lo que elegís cuando los recursos no alcanzan.*

El hallazgo que estructura todo (Somos Parte, 2019): **las juventudes participan de formas que el Estado
no ve.** El agente que solo gestiona desde la oficina se las pierde. El que sale, escucha y arma agencia,
las encuentra. El juego premia mecánicamente lo segundo.

---

## 2. EL LOOP MACRO

**30 días por pueblo, divididos en dos tiempos.**

**Días 1–5 — RECONOCIMIENTO.** No gestionás todavía: leés el pueblo. Caminás, hablás, vas a la escuela,
la plaza, el club, la radio. Escuchás conflictos viejos (en pueblo chico, todo arrastra historia). Tu
desempeño acá define dos cosas: (a) si la comunidad te reconoce como agente o te queda mirando de afuera,
y (b) si lográs armar **Agencia** o quedás de **Referente solo**. Recién al cierre del día 5 te ofrecen
formalmente el rol, y el peso de esa oferta depende de cómo te ganaste (o no) a la gente.

**Días 6–30 — GESTIÓN.** Tres acciones por día (heredado del Simulador). Cada acción es una decisión que
mueve los medidores, casi siempre con trade-off. Se cierra con un **perfil de gestor** según cómo
quedaron los cinco medidores y qué dilemas resolviste.

**MUDANZA.** Podés irte a otro pueblo. Llegás de nuevo como desconocido (recon otra vez), pero te llevás
la **experiencia**: leés más rápido, tenés contactos provinciales, y arrancás con un piso de Confianza.
La mudanza es el selector de dificultad: de un nivel 1 que dominaste a un nivel 3 que es otro mundo.

---

## 2.bis — CAPA NARRATIVA-TEMPORAL (origen, Mesa, findes, temporadas, regiones)

> Capa **aditiva** sobre el loop macro: le pone un *antes* (de dónde venís), un *arriba*
> (la provincia que te respalda), un *reloj* (findes y temporadas) y un *territorio* (regiones
> que cambian la partida). Todo detrás de flags nuevos, sin tocar el RPG ni el motor de gestión.
> Implementada en las FASES N1–N6 (ver §12 ROADMAP).

### A. Origen del jugador — cómo llegaste a la Agencia  *(CONFIG.origenJugador, FASE N1)*

Antes de arrancar, elegís **cómo llegaste a estar a cargo de la Agencia Juvenil**. Eso reparte
tus medidores de inicio (es el "selector de dificultad blando" del comienzo, complementa al recon).
Las 5 configuraciones:

1. **Por mérito entre los jóvenes.** Te eligieron los pibes. → Agencia y Convicción altas;
   Confianza (del intendente) baja.
2. **Te conoce el intendente.** Llegás por arriba. → Confianza alta; Vínculo con los pibes bajo.
3. **No había más, tenías perfil.** Comodín. → Todo medio.
4. **Convocado de urgencia** (el anterior se mudó / se fue a estudiar). Modo bombero. → Menos
   tiempo (un finde menos en la temporada) y todo a medias.
5. **Vení­s del barrio / militancia social** (5ª variante): venís de organizar la murga/el club/
   el merendero. → Carisma y Vínculo con los pibes altos; Recursos bajos (no tenés caja propia).

**Reconciliación con los medidores que ya existen** (no se duplican): *fuerza de la Agencia* →
`agencia`; *confianza del intendente* y *recursos* → `confianza` (el medidor "Confianza / Recursos"
los combina); *vínculo con los pibes* → `conocimiento` (cercanía/lectura de la juventud);
*integridad* → `conviccion`. Falta una sola aptitud: **convencer/persuadir**, que se agrega como
**6º medidor `carisma`** (0–100, "Carisma / Persuasión") — alimenta las tiradas de persuasión.
El HUD ya itera los medidores, así que el 6º aparece solo. (El smoke se actualiza de 5 a 6.)

### B. Arranque narrativo — la Mesa Provincial  *(CONFIG.mesaProvincial, FASE N2)*

La partida abre con el jugador **viajando a la Mesa Provincial de Agentes Juveniles** (la Hoja de
Ruta hecha escena: tutorial disfrazado). En la Mesa recibe **herramientas, ideas, líneas de
trabajo y contactos** (genérico y reskinable, sin programas ni marcas reales). Al volver, aparece
en **su localidad** y arranca el reloj. La Mesa queda como un **lugar visitable** — el "mundo de
arriba" (provincia, recursos, respaldo) al que se vuelve entre temporadas o cuando hace falta
destrabar algo. Es la cara institucional del juego, sin bajada política.

### C. Reloj de fines de semana por temporada  *(CONFIG.relojTemporadas, FASE N3)*

La unidad de tiempo deja de ser el día plano y pasa a ser el **fin de semana de activación**
(viernes/sábado/domingo). **Una TEMPORADA = 90 días = 12 findes.** Dos ritmos:

- **La semana = PREPARACIÓN.** Conseguir permisos, hablar con la escuela, juntar a la Agencia,
  gestionar recursos. Acciones de bajo costo que preparan el finde (no "gastan" el finde).
- **El finde = EJECUCIÓN.** Se hace la actividad; se resuelven dilemas/tiradas. Avanza el reloj.

**Partida núcleo = UNA temporada (12 findes).** El **recon inicial sigue igual** (leer el pueblo);
lo que cambia es que el *cuerpo* de la temporada corre por findes en vez de por días 6–30. Al
cerrar los 12 findes: **perfil de gestor de la temporada** + opción de **mudarse de región** o
**seguir en el mismo pueblo** profundizando. Envuelve el ciclo G5 (no lo reemplaza: con el flag
off, G5 sigue corriendo por días como hasta ahora).

### D. Las cuatro temporadas y el Mes de las Juventudes  *(CONFIG.modoAnual, FASE N4)*

Modo largo desbloqueable: el **año completo** son 4 temporadas encadenadas, cada una con su clima:

| Temporada | Meses | Clima de juego |
|---|---|---|
| **Verano / vacaciones** | dic–feb | Colonias, pileta, aire libre. **Sin escuela** (el Vínculo escolar pesa menos). |
| **Laburo fuerte** | mar–jun | Escuela activa, Agencia a full. La temporada "de fondo". |
| **Receso de invierno** | jul | Actividades **bajo techo**; ritmo más bajo. |
| **Segunda mitad** | ago–nov | Sube la energía hacia el **clímax**. |

**SEPTIEMBRE = MES DE LAS JUVENTUDES = temporada alta / CLÍMAX.** Es el finde-faro donde *todo se
juega*: las decisiones del año se cobran o se lucen acá. El año entero orienta el juego a **llegar
bien parado a septiembre**. (Si N4 no pasa el smoke, queda en flag false + ROADMAP; N3 alcanza
para la partida núcleo de una temporada.)

### E. Regiones que cambian las misiones  *(CONFIG.misionesPorRegion, FASE N5)*

Cada **región** genera un **set distinto** de misiones, recursos y actividades — no es decorado.
Las misiones siguen siendo **plantillas reskinables y genéricas** (sin marcas/programas reales);
lo que cambia por región es el **sabor**, los **recursos** disponibles y **qué comunidades/temas**
aparecen. Las **zonas productivas** (capa nueva, reconciliada con las 9 regiones direccionales del
Apéndice B vía un campo `zona` por pueblo):

| Zona | Sabor / recursos / temas |
|---|---|
| **Este cerealero** | Comercio, más comunidades, **eventos de cosecha**; feria joven de emprendimientos. |
| **Caldenal** (monte) | Patrimonio, identidad, **comunidades dispersas**; circuito naturaleza + cultura. |
| **Oeste árido** | **Agua escasa**, puesteros aislados; misiones ligadas al recurso hídrico — el **Atuel en clave EDUCATIVA y apartidaria** (aprender del agua, no militar una postura). |
| **Salinas** | Zona minera; **eventos de cosecha de sal**; logística dura. |
| **Cuenca del Colorado / Sur** | Oasis de riego, **energía**; producción y trabajo joven. |
| **Hub Centro (capitales)** | Las **10 comunidades activas**, modo **integración** (actividades-puente). |

La **mudanza entre temporadas** cambia de región → cambia el tipo de partida (qué se puede hacer,
qué comunidades hay, qué eventos caen). Reskinable: la bajada local se agrega por fuera del código.

---

## 2.ter — APERTURA CINEMATOGRÁFICA Y MUNDO INTERACTIVO (O1–O2)

Capa de **presentación y exploración**, aditiva y detrás de flags. No agrega mecánicas de
gestión nuevas: **reusa** el creador (F1), el origen (N1) y los medidores (G1), y le da al RPG
del pueblo una capa de "mundo vivo".

### A. Apertura cinematográfica  *(CONFIG.aperturaCine, FASE O1)*

El botón **"Jugar"** ya no cae directo al pueblo: arranca una **secuencia guionada** (salteable
en cualquier momento con un botón/tecla):

1. **Viaje en colectivo** — el agente viaja por una ruta pampeana; paisaje lateral con parallax
   (campo, caldenes, postes, ruta, cielo amplio). Dura unos segundos o se saltea con tap/tecla.
2. **Bajada y transición** — fundido a negro y aparición en la Mesa.
3. **La Mesa de Agentes** — vista de una mesa con varios agentes juveniles de distintas
   localidades (ficticias). Diálogo de bienvenida cálido y costumbrista; un par se presentan.
4. **Enfoque en vos → crear avatar** — se dispara el **creador existente** (nombre, pronombre,
   variante visual) **+ de qué localidad sos** (campo nuevo, opcional).
5. **Vida previa (estilo Mount & Blade)** — 4 ejes encadenados que construyen tu pasado y
   definen tu **perfil inicial**: *crianza* (pueblo chico / ciudad / campo), *adolescencia*
   (deporte / estudio / centro de estudiantes / laburo / arte), **cómo llegaste a la Agencia**
   (= los **orígenes N1**: mérito / intendente / comodín / urgencia / barrio) y *fortaleza*
   personal. **Cómo llegaste** fija la distribución de medidores (absoluta, reusa N1); los otros
   3 ejes son **matices narrativos** (deltas, clampeados). Cierra con un resumen "Sos alguien que…".
6. **Charla de cierre / tutorial** — la Mesa te entrega la caja de herramientas (las 5 líneas de
   trabajo, el dado, la Mesa como respaldo) y un fundido te deja en tu localidad: empieza el juego.

> Reusa, no duplica: la apertura **es** la Mesa N2 (marca `mesaVista`) y reparte los medidores
> con el sistema de origen N1. Con el flag off, "Jugar" usa el creador clásico → pueblo.

### B. Mundo interactivo  *(CONFIG.mundoInteractivo, FASE O2)*

El pueblo deja de ser sólo "caminable":

- **Entrar a edificios** — interactuar frente a la puerta de un edificio clave (Casa de la
  Juventud, almacén, Municipalidad, iglesia, casas) abre una escena de **interior** (con fundido).
  Hay **plantillas reusables** (oficina / local / casa / iglesia). Adentro: una **salida** (felpudo)
  que devuelve al pueblo en la puerta correcta. El juego **recuerda** en qué interior estás
  (recargar adentro = seguís adentro).
- **Objetos interactivos** — el monumento, los carteles, las estanterías, la radio comunitaria,
  el mural de proyectos, etc., responden con una descripción costumbrista.
- **Gente de interiores** — NPCs propios de cada interior (el secretario de la Muni, los pibes de
  la Casa de la Juventud, Don Pedro en el almacén, el Padre en la iglesia, vecinos en las casas)
  con el **sistema de diálogo existente**; dan sabor e información.

> Aditivo: la colisión del jugador es enchufable (el interior usa su propia matriz; el pueblo
> queda idéntico). El arte de interiores y del colectivo es procedural (placeholders; ver
> `AUDITORIA_ARTE.md`). Con el flag off, las puertas no abren y el pueblo queda como antes.

---

## 3. ONBOARDING CANÓNICO — ARMAR LA AGENCIA

> Esto NO se inventa: son los cuatro pasos de la **Hoja de Ruta Juvenil** que escribió la Subsecretaría,
> hechos jugables. Suceden dentro de los días 1–5.

1. **CONVOCATORIA — que la localidad se entere.** Reunión masiva, informal, *el mate no puede faltar*.
   Usás redes, afiches, radio local, boca a boca. **Mecánica:** elegís canales según lo que el pueblo
   usa (en pueblo chico el boca a boca gana; en nivel 3 las redes). Buena convocatoria = más candidatos
   a la Agencia.
2. **DIAGNÓSTICO — qué pasa con los jóvenes.** Charla abierta o encuesta rápida: qué necesitan, qué les
   preocupa, qué sueñan, qué vieron en otro lado. **Mecánica:** sube *Conocimiento Juvenil*; descubrís
   qué comunidades y problemáticas existen en ESTE pueblo.
3. **OBJETIVOS — a dónde queremos llegar.** Definís metas y **bautizás la Agencia** (el jugador elige el
   nombre del grupo). **Mecánica:** fijás 2–3 objetivos que dan bonus a líneas de acción afines.
4. **ORGANIZACIÓN — cómo nos organizamos.** Estructura horizontal, equipo, redes, suplentes. **Mecánica:**
   reclutás de 3 a 20 miembros; cada uno aporta un rol (llegada a la promo, redes, club, etc.).

Si fallás los cuatro pasos, quedás de **Referente solo**: jugable, pero todo cuesta el doble.

---

## 4. LOS CINCO MEDIDORES

Pocos y en tensión permanente. Subir uno suele costar otro.

| Medidor | Qué representa | Sube con | Baja con |
|---|---|---|---|
| **AGENCIA** | Tamaño y fuerza de tu equipo (0 = referente solo … 20) | Buen onboarding, cumplir con el grupo, darles protagonismo | Decidir solo, no escucharlos, quemarlos en tareas |
| **VÍNCULO ESCOLAR** | Llegada a la promo y los 6 años, docentes/directores piolas, familias | Charlas, encuestas, presencia en la escuela, respetar tiempos docentes | Pasar por encima de la escuela, actividades en horario de clase |
| **CONOCIMIENTO JUVENIL** | Cuánto sabés de quiénes son y qué hacen | Diagnóstico, estar en las actividades, encuestas, descubrir comunidades | Gestionar de oído desde la oficina |
| **CONFIANZA / RECURSOS** | Presupuesto + capital político que destraba más | Buena gestión, gente conforme, cumplir lo prometido | Gastar mal, prometer y no cumplir, conflicto con el municipio |
| **CONVICCIÓN** | Integridad: defendés la agenda joven vs. cedés a la presión | Plantarte por los pibes, decisiones íntegras | Ceder al intendente/concejal/Provincia por conveniencia |

**Tensiones de diseño (deben sentirse):** subir Confianza cediendo a la política baja Convicción;
meterte de lleno con los pibes puede enfriar al municipio; crecer la Agencia exige darles poder, lo que
te quita control. *Nunca quedan los cinco arriba a la vez.*

---

## 5. LAS DIEZ COMUNIDADES

Sacadas del mapeo real. El número entre paréntesis es **cuán común es en el territorio** (rareza para el
descubrimiento): cuanto más raro, más emociona encontrarlo.

1. **Deportistas** — universal, la puerta de entrada (el deporte aparece en casi todos los pueblos).
2. **Folklore y Materos** — el piso cultural; está en casi todos lados *(muy común)*.
3. **Gamers y eSports** — base digital, muy común.
4. **Tecnología y Streamers** — base digital, muy común.
5. **Danza urbana** — común.
6. **Música y Trap / Rap** — media.
7. **Teatro y Cultura** — media.
8. **Literatura y Ajedrez** (lo "intelectual") — media-baja.
9. **Anime, Manga y K-pop** — *rara*: marca un pueblo con vida juvenil organizada.
10. **Ciencia, Robótica y Activismo / Eco** — *la más rara*: encontrarla en un pueblo chico es un hallazgo.

**Descubrimiento gamificado.** En pueblo chico no sabés cuáles existen hasta encontrarlas (íconos
bloqueados que se revelan, como el Registro ya construido). A veces están **latentes** y las activás vos.
En **Santa Rosa y General Pico están las diez** y ya tienen vida propia: ahí el desafío se invierte, no es
descubrir sino **integrar** — una actividad que junte a deportistas, K-popers y materos es un logro de
gestión, no un trámite. Esas **actividades-puente** son el corazón del juego avanzado.

---

## 6. SISTEMA DE PUEBLOS — 4 NIVELES

El juego usa pueblos **ficticios** (ver §11), pero parametrizados según el modelo real por nivel.

| Nivel | Tamaño (modelo) | Comunidades | Presupuesto | Sistema dominante | Sensación |
|---|---|---|---|---|---|
| **1** | < 1.000 | 1–2 (o "los pibes" sin subdividir) | Mínimo | Priorímetro crudo | Cara a cara; "si no lo hacés ahora, no se hace más". El agente cubre varios pueblos. |
| **2** | 1.000–3.000 | 2–3 | Chico | Priorímetro | Todos se conocen; las quejas son personales. |
| **3** | 3.000–Toay | 3–7 | Medio | Simulador + Priorímetro | Cabeceras; arrastran parajes vecinos; el intendente pesa pero es manejable. |
| **4** | Capitales (SR, Pico) | 10 (todas, organizadas) | Grande pero superado | Simulador completo | Prensa y radio como actor; integrar, no descubrir; nadie queda conforme al máximo. |

### Apéndice A — Tabla modelo (80 pueblos)
*Nivel y comunidades reales del mapeo donde existen; el resto se estima por nivel. Esta tabla es el banco
de parámetros: los pueblos jugables son ficticios pero fieles a esta distribución.*
(Leyenda: Rap, Danza, Aje=ajedrez, Cien=ciencia, Teat=teatro, Rob=robótica, AniK=anime/kpop, Gam=gamers,
Folk=folklore, Act=activismo, Lit=literatura, Tec=tecnología.)

| Pueblo | Nivel | Comunidades (dato real) | Detalle |
|---|---|---|---|
| General Pico | 4 | 10 | Rap/Danza/Aje/Cien/Rob/Gam/Folk/Act/Lit/Tec |
| Santa Rosa | 4 | — | (estimar por nivel) |
| Catriló | 3 | 6 | Rap/Danza/Aje/Gam/Folk/Tec |
| Colonia 25 de Mayo | 3 | 8 | Danza/Aje/Rob/AniK/Gam/Folk/Act/Tec |
| Eduardo Castex | 3 | 6 | Cien/Teat/Gam/Folk/Act/Tec |
| General Acha | 3 | 7 | Rap/Aje/Teat/Rob/Gam/Folk/Tec |
| Guatraché | 3 | — | (estimar por nivel) |
| Ingeniero Luiggi | 3 | 9 | Danza/Cien/Teat/Rob/AniK/Gam/Folk/Act/Tec |
| Intendente Alvear | 3 | 8 | Rap/Danza/Teat/Rob/AniK/Gam/Folk/Tec |
| Macachín | 3 | — | (estimar por nivel) |
| Quemú Quemú | 3 | 3 | Danza/Teat/Folk |
| Rancul | 3 | — | (estimar por nivel) |
| Realicó | 3 | 12 | TODAS |
| Toay | 3 | 4 | Rap/Danza/Teat/Folk |
| Trenel | 3 | 1 | Folk |
| Victorica | 3 | 7 | Rap/Aje/Teat/Folk/Act/Lit/Tec |
| Alpachiri | 2 | 8 | Rap/Danza/Teat/Rob/AniK/Gam/Folk/Tec |
| Alta Italia | 2 | 5 | Cien/Teat/Folk/Lit/Tec |
| Anguil | 2 | 2 | Folk/Lit |
| Arata | 2 | 4 | Danza/Gam/Folk/Tec |
| Bernardo Larroudé | 2 | — | (estimar por nivel) |
| Bernasconi | 2 | 3 | Rap/Aje/Folk |
| Caleufú | 2 | 3 | Danza/Folk/Tec |
| Colonia Barón | 2 | — | (estimar por nivel) |
| Doblas | 2 | 5 | Danza/Gam/Folk/Lit/Tec |
| Embajador Martini | 2 | 6 | Danza/Aje/Teat/Gam/Folk/Tec |
| General Campos | 2 | 2 | Teat/Folk |
| General San Martín | 2 | 1 | Folk |
| Jacinto Aráuz | 2 | 4 | Danza/Cien/Rob/Folk |
| La Adela | 2 | — | (estimar por nivel) |
| La Maruja | 2 | 2 | Danza/Folk |
| Lonquimay | 2 | 4 | Rap/Danza/Folk/Tec |
| Miguel Riglos | 2 | 5 | AniK/Gam/Folk/Lit/Tec |
| Parera | 2 | — | (estimar por nivel) |
| Santa Isabel | 2 | 4 | Danza/Aje/Folk/Lit |
| Telén | 2 | 2 | Aje/Folk |
| Uriburu | 2 | 2 | Aje/Gam |
| Winifreda | 2 | 5 | Teat/AniK/Folk/Act/Lit |
| Abramo | 1 | — | (estimar por nivel) |
| Adolfo Van Praet | 1 | 4 | Danza/Cien/Rob/Folk |
| Agustoni | 1 | 4 | Danza/Rob/Gam/Folk |
| Algarrobo del Águila | 1 | 3 | Folk/Lit/Tec |
| Ataliva Roca | 1 | 2 | Danza/Folk |
| Carro Quemado | 1 | 4 | Danza/Aje/Folk/Lit |
| Casa de Piedra | 1 | — | (estimar por nivel) |
| Ceballos | 1 | 3 | Gam/Folk/Tec |
| Chacharramendi | 1 | 1 | Tec |
| Colonia Santa María | 1 | 1 | Folk |
| Colonia Santa Teresa | 1 | 2 | Folk/Tec |
| Conhelo | 1 | — | (estimar por nivel) |
| Coronel Hilario Lagos | 1 | — | (estimar por nivel) |
| Cuchillo Co | 1 | — | (estimar por nivel) |
| Dorila | 1 | 3 | Danza/Cien/Folk |
| Falucho | 1 | 6 | Rap/Danza/Rob/Gam/Lit/Tec |
| Gobernador Duval | 1 | 3 | Folk/Lit/Tec |
| La Humada | 1 | — | (estimar por nivel) |
| La Reforma | 1 | — | (estimar por nivel) |
| Limay Mahuida | 1 | 1 | Folk |
| Loventuel | 1 | — | (estimar por nivel) |
| Luan Toro | 1 | 5 | Gam/Folk/Act/Lit/Tec |
| Maisonave | 1 | 4 | Rap/Aje/Gam/Folk |
| Mauricio Mayer | 1 | 1 | Tec |
| Metileo | 1 | 4 | Danza/Gam/Folk/Tec |
| Miguel Cané | 1 | 4 | Danza/Gam/Folk/Tec |
| Monte Nievas | 1 | 7 | Danza/AniK/Gam/Folk/Act/Lit/Tec |
| Perú | 1 | — | (estimar por nivel) |
| Pichi Huinca | 1 | 1 | Folk |
| Puelches | 1 | 3 | Danza/Gam/Folk |
| Puelén | 1 | 1 | Folk |
| Quehué | 1 | 4 | Danza/Gam/Folk/Tec |
| Quetrequén | 1 | 2 | Danza/Folk |
| Relmo | 1 | — | (estimar por nivel) |
| Rolón | 1 | 7 | Rap/Danza/Teat/AniK/Gam/Folk/Tec |
| Rucanelo | 1 | — | (estimar por nivel) |
| Sarah | 1 | 3 | Gam/Folk/Tec |
| Speluzzi | 1 | 2 | Gam/Tec |
| Tomás M. Anchorena | 1 | 4 | Danza/Gam/Folk/Tec |
| Unanué | 1 | — | (estimar por nivel) |
| Villa Mirasol | 1 | 3 | Aje/Folk/Tec |
| Vértiz | 1 | 4 | Danza/Folk/Lit/Tec |

---

## 7. SISTEMA DE DILEMAS

Hereda el motor del Simulador de Gestión (decisiones con impacto multi-medidor) pero ampliado a los cinco
medidores. Cada dilema es un dato reskinable: situación + 2–4 opciones, cada una con impactos y una
reacción. Las **problemáticas reales** del mapeo son la sustancia:

- **Consumos problemáticos** (sustancias y apuestas digitales) — la más mencionada.
- **Salud mental** — segunda, aparece incluso como demanda espontánea.
- **Falta de espacios y actividades** — alta.
- **Bullying y ciberbullying** — recurrente pueblo tras pueblo.
- **Situación económica y empleo** — alta.
- **Conectividad / violencias (incl. de género)** — media.

Y los dilemas de poder del Simulador: el intendente que exige un número antes de firmar, el concejal que
quiere su logo, Provincia que manda fondos solo para folklore tradicional, la logística que no alcanza.

> **CUIDADO (no negociable):** los dilemas sobre salud mental, consumos, violencias y bullying se
> **escriben a mano, con criterio humano**, NUNCA se autogeneran ni se tratan como "puntos para sumar".
> Van en un archivo aparte (`CONTENIDO_SENSIBLE.md`) marcado para revisión. El motor los soporta; el
> contenido lo aprueba el humano.

---

## 8. SISTEMA DE AZAR — DADO CON ARCO

Cada acción importante es una **tirada** contra una dificultad: resultado = dado (1–20) + modificadores.
Los modificadores salen de tus medidores y tus decisiones previas.

- **Arco suerte → competencia.** Al principio, medidores bajos: dependés del dado (tenés suerte o no lo
  conseguís). A medida que gestionás bien, los modificadores suben y la suerte pesa menos: el novato reza,
  el que laburó bien controla. **Las buenas decisiones se sienten recompensadas sin matar la tensión.**
- **El conocimiento es modificador.** Si hiciste el diagnóstico y conocés a los pibes, sabés qué actividad
  va a pegar y tirás con ventaja; si gestionás de oído, tirás a ciegas. Estudio y creatividad = bonus de
  dado concretos.
- **Resultados graduados:** éxito crítico / éxito / éxito parcial (sale pero con costo) / fracaso. No solo
  sí/no.

---

## 9. ACTIVIDADES — LAS CINCO LÍNEAS

Del documento Agencias en Movimiento. Son el menú de lo que el agente puede hacer:

1. **Cultura y turismo joven.**
2. **Ferias y mercado joven de emprendimientos.**
3. **Medios y comunicación hechos por juventudes.**
4. **Capacitaciones, talleres y stands de prevención.**
5. **Intereses alternativos** — eSports, ciencia, k-pop, muralismo, eco-brigadas.

Cada actividad pide **infraestructura** (SUM, polideportivo, sala de radio, WiFi, punto digital) que el
pueblo tiene o no — restricción real del mapeo. Compartir SUM/polideportivo con la localidad vecina es la
mecánica de **cooperación regional**. Una actividad acierta más si apunta a una comunidad que existe y
conocés (ver §8).

---

## 10. RECURSOS E INFRAESTRUCTURA

Base de presupuesto según nivel. Crece con Confianza. La demanda nº 1 del mapeo es **logística y espacios**
(no falta voluntad, faltan recursos), así que la escasez material es el motor: casi nunca podés con todo,
y elegir es perder algo. La infraestructura por pueblo (de los datos reales) condiciona qué actividades
son posibles sin pedir ayuda regional o provincial.

---

## 11. RESTRICCIONES (no negociables)

- **Nombres ficticios.** Los datos reales son el modelo interno; los pueblos jugables son inventados. No
  se nombran localidades, personas ni contactos reales en el juego.
- **Contenido sensible a mano** (§7).
- **Sin apuestas ni azar con plata real.** El dado es mecánica de juego, nunca dinero real. (Las apuestas
  digitales aparecen como *problemática a prevenir* en los dilemas, jamás como mecánica.)
- **Genérico y reskinable.** El motor no hard-codea "Tarjeta Joven" ni programas reales; la bajada
  institucional se agrega después, por fuera del código.
- **Stack intacto:** namespace global AJ, scripts clásicos (sin ES modules por CORS file://), arte por
  código con fallback a PNG, todo nuevo detrás de flags con try/catch que autoapaga.

---

## 12. ROADMAP DE CONSTRUCCIÓN (para Claude Code)

Todo aditivo, por capas, detrás de flags. El RPG existente no se toca.

- **G1 — CAPA DE DATOS (`CONFIG.modoGestion`).** `/js/gestion/datos.js`: los 5 medidores, las 10
  comunidades, la tabla de pueblos (banco de parámetros), las 5 líneas de actividad, las problemáticas.
  Solo datos + estado, sin UI todavía. Smoke-test de carga.
- **G2 — ONBOARDING (`CONFIG.onboarding`).** Los 4 pasos de la Hoja de Ruta como flujo jugable: convocatoria,
  diagnóstico, objetivos (bautizar agencia), organización (reclutar 3–20 o quedar referente solo).
- **G3 — MOTOR DE DILEMAS (`CONFIG.dilemas`).** Estructura dato situación/opciones/impactos/reacción.
  Dilemas GENÉRICOS de arranque. Los sensibles quedan en `CONTENIDO_SENSIBLE.md`, NO se generan.
- **G4 — SISTEMA DE TIRADAS (`CONFIG.tiradas`).** Dado + modificadores por medidor + conocimiento, con
  resultados graduados y el arco suerte→competencia.
- **G5 — CICLO DE 30 DÍAS + MUDANZA (`CONFIG.cicloGestion`).** Recon 5 días, gestión 25, 3 acciones/día,
  perfil de gestor al cierre, mudanza con experiencia heredada.
- **G6 — DESCUBRIMIENTO E INTEGRACIÓN DE COMUNIDADES (`CONFIG.comunidades`).** Revelado por exploración en
  pueblo chico; modo integración (actividades-puente) en SR y Pico.
- **G7 — ROBUSTEZ.** Smoke-test de bordes sobre todo lo nuevo; guardado del estado de gestión por pueblo.

Cada capa: lee su flag, autoapaga si falla, commit al cerrar, checks PASS/FAIL en el smoke-test,
y actualiza CLAUDE.md / HANDOFF.md / DECISIONES.md / ROADMAP.md. Lo que dependa del gusto (ritmo, balance
fino) va a `PLAYTEST.md` para ojo humano, no se adivina.

> **Estado de implementación (al cierre de la sexta noche): G1–G7 COMPLETAS y verificadas**
> (smoke Pueblo 126/126 · Colonia 127/127 · Puesto 117/117, sin errores de consola; pasó un review
> adversarial con 4 fixes). Pendiente
> de **trabajo humano**, no de la corrida nocturna: el banco de **dilemas sensibles**
> (`CONTENIDO_SENSIBLE.md`, vacío para revisión), darle **voz propia / bajada institucional** a
> dilemas y actividades, y el **balance fino + playtest** (ver `PLAYTEST.md` §15–16). El diseño de
> este GDD no se modificó: se implementó fiel.
>
> **CAPA NARRATIVA-TEMPORAL (§2.bis) — N1–N6 COMPLETAS (décima noche).** Aditiva, sin tocar el
> motor G1–G7. N1 origen + 6º medidor `carisma` · N2 Mesa Provincial · N3 reloj de findes
> (1 temporada = 12 findes; envuelve G5) · N4 4 temporadas + Mes de las Juventudes (septiembre =
> clímax) · N5 misiones por zona productiva (contenido validado por workflow, Atuel apartidario) ·
> N6 robustez (save/reload real verificado). Flags: `origenJugador`, `mesaProvincial`,
> `relojTemporadas`, `modoAnual`, `misionesPorRegion` (todos en true). Smoke Pueblo 1 **134/134
> PASS**. Pendiente humano: **balance/feel** del ritmo de findes, el peso de cada origen, si
> septiembre se siente clímax, si las regiones se juegan distinto (ver `PLAYTEST.md`).

---

## 13. APÉNDICE B — DIAGNÓSTICO REGIONAL (real, Agencias en Movimiento)

Para dar carácter a los pueblos por zona (fortaleza → foco de trabajo):

- **Norte** (Pico, Alvear, Trenel, Dorila): red escolar y conectividad → liga deportiva + eSports.
- **Noreste** (Realicó, Luiggi, Castex, Alta Italia, Caleufú): clubes y centros culturales → circuito
  cultural itinerante, feria joven.
- **Este** (San Martín, Jacinto Aráuz, Alpachiri, Doblas, Riglos): polideportivos y SUM → ferias de
  talentos, turismo joven.
- **Centro** (Santa Rosa, Toay, Winifreda, Ataliva): oferta grande → laboratorio de empleo, eventos faro.
- **Centro-Oeste** (Catriló, Anguil, Uriburu, Lonquimay, Villa Mirasol): red de SUM y clubes → circuito
  rotativo, liga mixta.
- **Oeste** (Victorica, Telén, Luan Toro, Carro Quemado): coordinación municipal → turismo joven, giras.
- **Noroeste** (Santa Isabel, Algarrobo, Limay Mahuida): identidad cultural → circuito naturaleza+cultura.
- **Suroeste** (25 de Mayo, Puelén, Gobernador Duval): atractivo natural → escapadas, regatas, trekking.
- **Sur** (Acha, Quehué, Chacharramendi, Puelches): deporte como puerta → ferias, festivales, formación exprés.

*Fin del documento. Afinable. La base es real; el juego es ficción fiel a esa base.*
