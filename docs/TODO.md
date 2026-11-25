# Pendiente

## Benchmark realista en tres niveles

El benchmark actual (un grupo de 1, 10, 100 o 1000 radio buttons) demuestra el mecanismo, pero una página con 1000 radios no es lo que encontramos en un sitio habitual. El objetivo es un benchmark más realista que compare **librerías pesadas (legacy)** con una **aplicación moderna construida con Modern Web Guidance**.

### Niveles

1. **Sintético** (el actual): un grupo de radio buttons con N opciones. Se mantiene como prueba del mecanismo.
2. **Blog**: una página de contenido tipo blog con un formulario de comentarios.
3. **«A11yConf Travel»**: una web de viajes con filtros, selectores, radio buttons, desplegables, modales y otros controles habituales.

En cada nivel, medir lo mismo que hoy: DOM, CSS y JavaScript; trazas de Chrome con la accesibilidad desactivada y activada; respuesta a la interacción; y latencia de VoiceOver.

### Preguntas abiertas para la próxima sesión

- Qué librerías representan la versión «legacy» (¿MUI, shadcn/ui con Radix, otra?) y si se escriben a mano o las genera un agente sin Modern Web Guidance.
- Si la versión moderna la genera un agente con Modern Web Guidance y `AGENTS.md`, o se escribe a mano siguiendo sus guías.
- Qué recorridos de usuario se automatizan en cada nivel (por ejemplo, escribir y enviar un comentario; filtrar, elegir fechas y abrir un modal en la web de viajes), y cómo se mide VoiceOver en ellos.
- Cuánto cabe antes de la charla del sábado 28 de noviembre de 2026 y qué se deja para una versión posterior.
