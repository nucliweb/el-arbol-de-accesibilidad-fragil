# Pendiente

## Benchmark realista en tres niveles

El benchmark sintético (un grupo de 1, 10, 100 o 1000 radio buttons) demuestra el mecanismo, pero una página con 1000 radios no es lo que encontramos en un sitio habitual. El benchmark realista compara **librerías pesadas (legacy)** con una **aplicación con HTML nativo, siguiendo Modern Web Guidance**.

### Niveles

1. **Sintético**: un grupo de radio buttons con N opciones. Hecho.
2. **«A11yConf Travel»**: una web de viajes con filtros, selectores, radio buttons, desplegables y un modal. Hecho: versión nativa frente a React, MUI, react-select, react-datepicker y react-modal; medida en Chrome (trazas publicadas en `bench/traces/`) y con VoiceOver. Ver `bench/README.md`.
3. **Blog**: una página de contenido tipo blog con un formulario de comentarios. Pendiente.

### Pendiente del nivel Blog

- Mismas versiones que Travel (nativa frente a la misma pila legacy) y el mismo método: DOM, CSS y JavaScript; trazas de Chrome con la accesibilidad desactivada y activada; respuesta a la interacción; y latencia de VoiceOver.
- Recorrido de usuario: llegar al formulario, escribir y enviar un comentario.

## Prueba con VoiceOver

- Al cerrar VoiceOver por AppleScript, macOS puede dejar `voiceOverOnOffKey` a 1 y Chrome sigue creyendo que hay un lector de pantalla activo. Valorar avisar al terminar la prueba (sin tocar la configuración del sistema) y pedir Cmd+F5 dos veces.
- La elección de destino (react-select frente a `<select>` nativo) no se mide: escribir en el `<select>` no produce anuncio de VoiceOver. Buscar una forma comparable de medirla.
