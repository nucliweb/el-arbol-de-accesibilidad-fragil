# VoiceOver: tiempo hasta el anuncio de cada opción

Chrome con CPU ×4, 20 pulsaciones de flecha abajo por página, 3 ejecuciones. Inicio: 2026-11-25T07:37:20.010Z.

Los pasos «desfasados» son aquellos en que VoiceOver anunció la opción anterior porque una pulsación previa no movió la selección; se excluyen de la latencia.

## N = 10

| Variante | Mediana (ms) | P90 (ms) | Pasos medidos | Desfasados | Silencios | Ejecuciones |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| native | 33 | 39 | 60 | 0 | 0 | 3 |
| native-styled | 32 | 37 | 60 | 0 | 0 | 3 |
| shadcn-base | 47 | 54 | 59 | 0 | 1 | 3 |
| shadcn-radix | 47 | 54 | 59 | 0 | 1 | 3 |
| mui | 57 | 64 | 60 | 0 | 0 | 3 |
| material-web | 45 | 55 | 60 | 0 | 0 | 3 |

## N = 100

| Variante | Mediana (ms) | P90 (ms) | Pasos medidos | Desfasados | Silencios | Ejecuciones |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| native | 64 | 69 | 40 | 19 | 1 | 3 |
| native-styled | 67 | 70 | 40 | 19 | 1 | 3 |
| shadcn-base | 106 | 112 | 60 | 0 | 0 | 3 |
| shadcn-radix | 99 | 105 | 60 | 0 | 0 | 3 |
| mui | 170.5 | 181 | 60 | 0 | 0 | 3 |
| material-web | 79 | 87 | 60 | 0 | 0 | 3 |

## N = 1000

| Variante | Mediana (ms) | P90 (ms) | Pasos medidos | Desfasados | Silencios | Ejecuciones |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| native | 436 | 446 | 40 | 18 | 2 | 3 |
| native-styled | 436.5 | 459 | 20 | 36 | 4 | 3 |
| shadcn-base | 1063 | 1095 | 60 | 0 | 0 | 3 |
| shadcn-radix | 858.5 | 888 | 60 | 0 | 0 | 3 |
| mui | 1972.5 | 2012 | 60 | 0 | 0 | 3 |
| material-web | 1067.5 | 1100 | 40 | 0 | 0 | 2 |

