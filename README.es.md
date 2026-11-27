# El árbol de accesibilidad frágil

[English](README.md) · **Español** · [Català](README.ca.md)

Diapositivas, benchmark y datos de la charla **[El árbol de accesibilidad frágil: por qué el HTML semántico es clave para el rendimiento web](https://2026.a11yconf.com/agenda/el-arbol-de-accesibilidad-fragil)**, presentada en la A11y Conf 2026.

- **Diapositivas**: [Español](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/) · [English](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/en/) · [Català](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/ca/). Cada diapositiva tiene notas escritas para leerlas, con un atajo de teclado para mostrarlas, y una vista de texto con tablas en lugar de gráficos.
- **Haz la prueba en tu dispositivo**: <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>. Unos 2 minutos, sin instalar nada, también en el móvil y con tu lector de pantalla.

## Sobre la charla

Cada vez que el navegador pinta una página construye dos árboles: el DOM y, combinado con ARIA, el árbol de accesibilidad. Este árbol es el que usan lectores de pantalla y otras tecnologías de asistencia, pero también es clave, y poco conocido, para el rendimiento web.

La charla explica cómo funciona el renderizado de un navegador y en qué momento se genera el árbol de accesibilidad. Compara implementaciones reales de un radio button: design systems populares basados en divs y JavaScript, y HTML semántico accesible por defecto. La diferencia en elementos del DOM, atributos, CSS y JS es enorme, y se traduce en tiempo de parsing, cálculo de estilos y bloqueo del hilo principal.

Muestra la relación, no siempre visible, entre "accesible" y "rápido", y por qué el HTML semántico frente a soluciones sobrediseñadas mejora tanto la experiencia de las personas usuarias de tecnología de asistencia como las métricas de Core Web Vitals. Priorizar la experiencia de desarrollo sobre la de usuario final tiene un coste real y medible.

## Lo que dicen los datos

Medido en Chrome con el árbol de accesibilidad activado (`--force-renderer-accessibility`) y la CPU ralentizada ×4, y con VoiceOver automatizado en macOS:

- Tras un clic en un grupo de 1000 radio buttons, Chrome dedica **2,6 ms** al trabajo de accesibilidad con radios nativos y **185–1.189 ms** con librerías de componentes (shadcn/ui, Material Web, MUI).
- Con 1000 opciones, VoiceOver tarda **436 ms** en anunciar la opción siguiente con radios nativos y hasta **1.973 ms** con MUI.
- En una búsqueda de hoteles realista, A11yConf Travel, el árbol de accesibilidad cuesta lo mismo en las dos versiones (56 y 57 ms en una tarea de 14 pasos con teclado). Lo que cambia es todo lo de alrededor: **255 frente a 991 ms** de hilo principal y **79 frente a 464 ms** de JavaScript. Cada Tab en la versión legacy ejecuta un centenar de tareas pequeñas (manejadores de foco, frames del ripple) en lugar de una veintena: ninguna es larga, así que ninguna métrica las marca.
- En un iPhone 16 Pro, un clic en 1000 radios de MUI congela Safari unos **5 s**, con o sin VoiceOver; con HTML nativo, 0 ms.
- El HTML semántico reduce el coste, pero no lo elimina: cargar 1000 radios nativos pasa de 16 ms de bloqueo con la accesibilidad desactivada a 479 ms con ella activada. Menos DOM es menos trabajo para el árbol de accesibilidad.

La diapositiva «Lo que estos datos no dicen» recoge los límites: solo Chrome y VoiceOver, un portátil rápido con la CPU ralentizada, un servidor local. Todo el código está aquí para que cualquiera pueda repetirlo con otros navegadores y lectores de pantalla.

## Trazas

Ábrelas en trace.cafe o arrastra el archivo al panel Performance de Chrome DevTools. En las trazas de la tarea, cada paso aparece con su nombre en la pista Timings.

| Qué | trace.cafe | Archivo |
| --- | --- | --- |
| A11yConf Travel, tarea de 14 pasos con teclado y la accesibilidad activada: legacy (React, MUI y otras) | [Abrir](https://trace.cafe/t/VoRFo6QOSY) | `bench/traces/travel/travel-legacy-a11y-on-run3-task.json.gz` |
| La misma tarea: HTML nativo | [Abrir](https://trace.cafe/t/XLPHjpSGiI) | `bench/traces/travel/travel-native-a11y-on-run2-task.json.gz` |
| Foco de teclado en un control, 5 s sin tocar nada, con reducir movimiento: legacy (el ripple de foco de MUI no para) | [Abrir](https://trace.cafe/t/ihrNliptjB) | `bench/traces/focus-idle/travel-legacy.json.gz` |
| Lo mismo: HTML nativo | [Abrir](https://trace.cafe/t/J5PZ7aWCIg) | `bench/traces/focus-idle/travel-native.json.gz` |
| Documentación de radio buttons de mui.com, 5 s quieta con reducir movimiento: 20 botones «Edit in Chat» animados sin fin | [Abrir](https://trace.cafe/t/rU5JSwqmGV) | `bench/traces/demos/mui-docs-radio-idle-reduced-motion.json.gz` |
| Carga de renfe.com en un móvil de gama media (Pixel 7 emulado, Slow 4G, CPU ×4) | [Abrir](https://trace.cafe/t/HJIoDNe5hJ) | `bench/traces/demos/renfe-mobile-slow4g-cpu4x.json.gz` |

## Cómo usar este repositorio

| Carpeta | Qué contiene | Cómo empezar |
| --- | --- | --- |
| `deck/` | La presentación: HTML, CSS y un poco de JavaScript, sin build. En español (`index.html`), inglés (`en/`) y catalán (`ca/`), con tema claro y oscuro y vista visual o de texto. Atajos de teclado y ajustes en el panel de ayuda (<kbd>?</kbd>): <kbd>G</kbd> cambia la vista, <kbd>T</kbd> el tema, <kbd>L</kbd> el idioma y <kbd>H</kbd> oculta la barra de controles; mantén <kbd>Alt</kbd> 2 segundos para ver la tecla de cada botón. | Publicada en <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/>. En local: `cd deck && npm start` y abre <http://127.0.0.1:8000> (necesita Python 3; cualquier servidor estático sirve). |
| `bench/` | El banco de pruebas: las apps comparadas, los scripts de medición, los resultados y las trazas para DevTools. | Requisitos, instalación, comandos y dependencias en [bench/README.md](bench/README.md). |
| `docs/` | Referencias de la charla y tareas pendientes. | — |

Para ejecutar los tests de la presentación (navegación, notas, atajos, vistas, temas, idiomas, demos, ninguna diapositiva con scroll y auditoría axe en cada diapositiva de cada idioma, con los dos temas): `cd deck && npm ci && npm test`.

## Participa en el benchmark

Desde cualquier navegador, también en el móvil y con tu lector de pantalla: **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>**, en español, inglés o catalán. Si usas un lector de pantalla, hazla dos veces, con el lector apagado y encendido: la diferencia es lo que el árbol de accesibilidad le cuesta a tu dispositivo. No se envía nada sin que lo decidas; al final puedes compartir los resultados en una issue de GitHub, como [esta de un iPhone 16 Pro con VoiceOver](https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/1).

Si sabes usar la terminal, también puedes ejecutar el banco de pruebas completo en tu equipo: en Chrome con cualquier sistema operativo y, opcionalmente, con VoiceOver en macOS. La guía está en [bench/PARTICIPA.md](bench/PARTICIPA.md) ([in English](bench/PARTICIPATE.md)).
