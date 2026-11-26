# Pendiente

## Benchmark realista en tres niveles

El benchmark sintético (un grupo de 1, 10, 100 o 1000 radio buttons) demuestra el mecanismo, pero una página con 1000 radios no es lo que encontramos en un sitio habitual. El benchmark realista compara **librerías pesadas (legacy)** con una **aplicación con HTML nativo, siguiendo Modern Web Guidance**.

### Niveles

1. **Sintético**: un grupo de radio buttons con N opciones. Hecho.
2. **«A11yConf Travel»**: una web de viajes con filtros, selectores, radio buttons, desplegables y un modal. Hecho: versión nativa frente a React, MUI, react-select, react-datepicker y react-modal; medida en Chrome (trazas publicadas en `bench/traces/`) y con VoiceOver. Ver `bench/README.md`.
3. **Blog**: una página de contenido tipo blog con un formulario de comentarios. Descartado para la charla del 28 de noviembre de 2026: A11yConf Travel ya cubre el caso realista. Queda como posible ampliación, con las mismas versiones y el mismo método que Travel, y como recorrido llegar al formulario, escribir y enviar un comentario.

## Prueba con VoiceOver

- Al cerrar VoiceOver por AppleScript, macOS puede dejar `voiceOverOnOffKey` a 1 y Chrome sigue creyendo que hay un lector de pantalla activo. Valorar avisar al terminar la prueba (sin tocar la configuración del sistema) y pedir Cmd+F5 dos veces.
- La elección de destino (react-select frente a `<select>` nativo) no se mide: escribir en el `<select>` no produce anuncio de VoiceOver. Buscar una forma comparable de medirla.

## Antes de la charla (28 de noviembre de 2026)

- Comprobar con VoiceOver las diapositivas con QR («Sigue la charla», «Haz la prueba») y «Un iPhone 16 Pro y 1000 radio buttons».
- Validar el segundo issue de resultados del iPhone 16 Pro (sesión sin VoiceOver) y, si hace falta, ajustar la diapositiva del iPhone con sus datos.
- Averiguar por qué un clic en 1000 radios de MUI bloquea Safari unos 5 s en un iPhone real (con y sin VoiceOver) y solo 72–81 ms en WebKit emulado: grabar una línea de tiempo con el inspector web de Safari conectando el iPhone al Mac.

## Benchmark en el navegador

- Publicado en <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/> (diapositivas en la raíz). Los resultados llegan como issues con la etiqueta `benchmark-results`.

