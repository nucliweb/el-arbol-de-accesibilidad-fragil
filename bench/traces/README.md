# Trazas para DevTools

Trazas de Chrome de la medición del 25 de noviembre de 2026 (Chrome 158, CPU ×4, viewport 1280×800). Para cada versión y modo de accesibilidad se publica la ejecución representativa: la que tiene el tiempo de hilo principal de la tarea más cercano a la mediana de 5 ejecuciones.

## Cómo abrirlas

- En Chrome: DevTools > Performance > Cargar perfil, o arrastra el archivo `.json.gz` al panel.
- Sin instalar nada: [trace.cafe](https://trace.cafe/) (sube la traza a su almacenamiento) o una copia local de su repositorio.

En las trazas de la tarea, cada paso aparece con su nombre en la pista Timings (por ejemplo, «2. Marcar «4 estrellas» (anuncio de resultados)»). Las trazas incluyen capturas de pantalla, muestras de JavaScript y los eventos de accesibilidad de Chrome.

## Qué muestra cada traza

El resumen en texto de cada traza, paso a paso, está en [`results/travel-summary-2026-11-25T23-09-58-772Z.md`](../results/travel-summary-2026-11-25T23-09-58-772Z.md), sección «Trazas para abrir en DevTools». Estas son sus cifras principales.

| Archivo | Versión | Accesibilidad | Hilo principal (ms) | JavaScript (ms) | Accesibilidad (ms) | Otros |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `travel/travel-native-a11y-off-run1-load.json.gz` | Nativa | Desactivada | 204 | 30 | 0 | Carga; LCP 180 ms, TBT 31 ms |
| `travel/travel-native-a11y-off-run1-task.json.gz` | Nativa | Desactivada | 177 | 68 | 0 | Tarea de 14 pasos; TBT 0 ms |
| `travel/travel-legacy-a11y-off-run5-load.json.gz` | Legacy | Desactivada | 519 | 343 | 0 | Carga; LCP 472 ms, TBT 216 ms |
| `travel/travel-legacy-a11y-off-run5-task.json.gz` | Legacy | Desactivada | 893 | 452 | 0 | Tarea de 14 pasos; TBT 35 ms |
| `travel/travel-native-a11y-on-run2-load.json.gz` | Nativa | Activada | 232 | 27 | 32 | Carga; LCP 176 ms, TBT 65 ms |
| `travel/travel-native-a11y-on-run2-task.json.gz` | Nativa | Activada | 255 | 79 | 57 | Tarea de 14 pasos; TBT 0 ms; INP en DevTools 21 ms |
| `travel/travel-legacy-a11y-on-run3-load.json.gz` | Legacy | Activada | 518 | 299 | 50 | Carga; LCP 432 ms, TBT 223 ms |
| `travel/travel-legacy-a11y-on-run3-task.json.gz` | Legacy | Activada | 991 | 457 | 62 | Tarea de 14 pasos; TBT 40 ms; INP en DevTools 75 ms |

Las dos trazas de la tarea con la accesibilidad activada están también en trace.cafe: [legacy](https://trace.cafe/t/VoRFo6QOSY) y [nativa](https://trace.cafe/t/XLPHjpSGiI). Qué mirar: en el paso 2, un solo manejador de clic de React ocupa 49 ms en una tarea de 54 ms en la legacy; en el paso 11, abrir el detalle, la legacy ocupa 101 ms de hilo principal frente a 21; y cada Tab de la legacy reparte 30–44 ms en un centenar de tareas cortas, frente a unos 5 ms y una veintena en la nativa.

Lo que se ve en las trazas de la tarea de la versión legacy y no aparece en las tablas: frames y animaciones entre pulsaciones. Es el efecto de foco de MUI (`MuiTouchRipple-childPulsate`), que late en bucle infinito, con ciclos de 2,5 s, mientras un control tiene el foco del teclado, también con `prefers-reduced-motion: reduce`. Las trazas de `focus-idle/` lo muestran aislado.

## Foco de teclado en reposo (`focus-idle/`)

Las dos versiones con el foco de teclado en el checkbox «4 estrellas» y 5 segundos sin tocar nada, con la accesibilidad activada y `prefers-reduced-motion: reduce` (CPU ×4, ejecución representativa de 3). En la traza, el paso aparece en la pista Timings como «Foco de teclado en «4 estrellas», sin tocar nada (5 s)».

| Archivo | Animaciones en marcha | Frames | GPU (ms) | Tareas del compositor | Hilo principal del renderer (ms) | Recálculos de estilo |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `focus-idle/travel-native.json.gz` | Ninguna | 30 | 10 | 2 | 2 | 0 |
| `focus-idle/travel-legacy.json.gz` | Ripple de foco de MUI, 2,5 s, infinito | 299 | 74 | 1.719 | 21 | 13 |

En trace.cafe: [legacy](https://trace.cafe/t/ihrNliptjB) y [nativa](https://trace.cafe/t/J5PZ7aWCIg).

Qué buscar en DevTools: en la legacy, la pista Frames es una banda continua de frames durante los 5 segundos (unos 60 por segundo); en la nativa apenas aparecen frames (30 en total). La animación corre en el compositor, así que el hilo principal casi no trabaja, pero la GPU y el compositor no paran. Resumen completo: [`results/focus-idle-2026-11-25T23-50-39-283Z.md`](../results/focus-idle-2026-11-25T23-50-39-283Z.md); se genera con `npm run trace:focus-idle`.

## Demos de la charla (`demos/`)

Dos webs reales, grabadas el 27 de noviembre de 2026 con Chrome 158 y CPU ×4, para las demos en directo.

| Archivo | Qué es | trace.cafe |
| --- | --- | --- |
| `demos/renfe-mobile-slow4g-cpu4x.json.gz` | Carga de renfe.com/es/es en un Pixel 7 emulado con red Slow 4G. LCP 10,7 s, casi todo red; el hilo principal trabaja unos 2,5 s en 17 s. | [Abrir](https://trace.cafe/t/HJIoDNe5hJ) |
| `demos/mui-docs-radio-idle-reduced-motion.json.gz` | mui.com/material-ui/react-radio-button, 5 s sin tocar nada con `prefers-reduced-motion: reduce`: 20 botones «Edit in Chat» animan la posición del fondo sin parar. Unos 580 frames, 1,3 s de hilo principal y 14.840 pintados. | [Abrir](https://trace.cafe/t/rU5JSwqmGV) |

## Cómo se generan

`node scripts/measure-travel.js --runs=5` guarda todas las trazas en `results/traces/travel-<fecha>/` (fuera del repositorio por tamaño) y `node scripts/summarize-travel.js` elige las representativas y escribe el resumen.
