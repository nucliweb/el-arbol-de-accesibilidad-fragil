# Trazas de A11yConf Travel para DevTools

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

Lo que se ve en las trazas de la tarea de la versión legacy y no aparece en las tablas: una pista Animations casi continua y trabajo de renderizado entre pulsaciones. Es el efecto de foco de MUI (`MuiTouchRipple-childPulsate`), que late en bucle infinito, con ciclos de 2,5 s, mientras un control tiene el foco del teclado, también con `prefers-reduced-motion: reduce`.

## Cómo se generan

`node scripts/measure-travel.js --runs=5` guarda todas las trazas en `results/traces/travel-<fecha>/` (fuera del repositorio por tamaño) y `node scripts/summarize-travel.js` elige las representativas y escribe el resumen.
