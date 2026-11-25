# Foco de teclado y 5 segundos sin tocar nada

Chrome con la accesibilidad activada y `prefers-reduced-motion: reduce`, CPU ×4, 3 ejecuciones por versión; se muestra la mediana. El foco de teclado está en el checkbox «4 estrellas» (Tab desde «5 estrellas») y durante 5 segundos no se toca nada. Inicio: 2026-11-25T23-49-00-740Z.

| Versión | Animaciones en marcha | Pintados (Paint) | Recálculos de estilo | Hilo principal (ms) | Estilos (ms) | Pintado (ms) | Accesibilidad (ms) | Traza publicada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| travel-native | Ninguna | 0 | 0 | 1.9 | 0 | 0 | 0 | `traces/focus-idle/travel-native.json.gz` (ejecución 3) |
| travel-legacy | MuiTouchRipple-child (2500 ms, infinita) | 0 | 13 | 25.0 | 1.3 | 0 | 0.2 | `traces/focus-idle/travel-legacy.json.gz` (ejecución 3) |

En todas las ejecuciones la página informó `prefers-reduced-motion: reduce`: sí. Foco en: 4 estrellas.
