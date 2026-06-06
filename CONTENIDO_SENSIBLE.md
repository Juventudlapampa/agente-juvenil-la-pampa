# CONTENIDO_SENSIBLE.md — Dilemas sensibles (REVISIÓN HUMANA, NO AUTOGENERAR)

> **Regla no negociable (GDD §7 y §11).** Los dilemas sobre **salud mental,
> consumos problemáticos, violencias (incluida la de género) y bullying/ciberbullying**
> se **escriben a mano, con criterio humano**. **NUNCA** se autogeneran, ni se
> tratan como "puntos para sumar". El motor de dilemas (`js/gestion/dilemas.js`) los
> **soporta**; el **contenido lo aprueba una persona** antes de entrar al juego.
>
> Este archivo es el lugar de trabajo y revisión de ese contenido. **Mientras un
> dilema sensible no esté revisado y aprobado, NO va al juego.**

## Por qué a mano

Estas temáticas salieron como las más mencionadas del mapeo real (consumos y salud
mental, primero y segundo). Tratarlas mal —frívolamente, con moraleja barata, o como
un trade-off de medidores— hace daño. Un dilema sobre salud mental no es "elegí A o B
y subí Convicción": es una situación delicada que pide redacción cuidada, derivación
correcta (no improvisar diagnósticos), y foco en el cuidado, no en el puntaje.

Por eso el juego trae listo el **motor** y los **dilemas genéricos** (poder,
espacios, economía, conectividad), pero deja estos cuatro temas para que los escriba
y apruebe el equipo humano.

## Problemáticas sensibles (taxonomía; el contenido va escrito a mano)

| id | Tema | Estado |
|----|------|--------|
| `saludMental` | Salud mental | ⏳ pendiente de redacción + revisión humana |
| `consumos` | Consumos problemáticos (sustancias y apuestas digitales*) | ⏳ pendiente |
| `violencias` | Violencias (incluida la de género) | ⏳ pendiente |
| `bullying` | Bullying y ciberbullying | ⏳ pendiente |

\* Las **apuestas digitales** aparecen acá **como problemática a prevenir**, jamás como
mecánica. El juego no tiene apuestas ni azar con plata real (el dado es mecánica). 

## Cómo se carga un dilema sensible (cuando esté aprobado)

1. Una persona redacta el dilema siguiendo la plantilla de abajo, con criterio de
   cuidado (no moralina, no diagnóstico, foco en acompañar/derivar).
2. Lo revisa el equipo (idealmente alguien del área de salud/juventudes).
3. Recién aprobado, se carga llamando, en un script propio (p. ej.
   `js/gestion/contenido_sensible.js`, creado por el humano y agregado al `index.html`):
   ```js
   AJ.Gestion.Dilemas.registrarSensibles([ /* dilemas aprobados */ ]);
   ```
   El motor valida la estructura y los marca `fuente: 'sensible'`. Si este archivo no
   existe, el juego corre igual con los dilemas genéricos (cero dependencia).

## Plantilla (estructura que entiende el motor)

```js
{
  id: 'sm_ejemplo',                 // único
  problematica: 'saludMental',      // saludMental | consumos | violencias | bullying
  fuente: 'sensible',               // el motor lo fuerza igual
  situacion: 'Texto de la situación, redactado con cuidado.',
  opciones: [
    {
      id: 'a',
      texto: 'Una respuesta posible (acompañar / derivar / consultar al área).',
      impactos: { /* medidor: delta, … usar con MUCHA mesura o vacío */ },
      reaccion: 'Qué pasa / qué se aprende, sin moraleja.'
    },
    // 2 a 4 opciones…
  ]
}
```

Medidores válidos: `agencia` (0–20), `vinculoEscolar`, `conocimiento`, `confianza`,
`conviccion` (0–100). En contenido sensible se recomienda **impactos chicos o nulos**:
el valor está en la situación y la reflexión, no en el puntaje.

## Recomendaciones de redacción (mínimas)

- **No diagnosticar ni improvisar respuestas clínicas.** La opción "correcta" suele ser
  escuchar, no minimizar, y **derivar** a quien corresponde.
- **No premiar la frivolidad** ni convertir el dolor ajeno en farmeo de medidores.
- **Evitar el golpe bajo** y el detalle morboso. La situación se entiende sin regodearse.
- **Lenguaje cuidado y local**, sin estigmatizar a la persona que la está pasando mal.
- Ante la duda, que la mejor opción sea **pedir ayuda / consultar al área de salud**.

> Hasta acá llega lo que hace la máquina. El resto es decisión y redacción humana.
