# El árbol de accesibilidad frágil

Repositorio de la presentación de la charla **[El árbol de accesibilidad frágil: por qué el HTML semántico es clave para el rendimiento web](https://2026.a11yconf.com/agenda/el-arbol-de-accesibilidad-fragil)**, presentada en la A11y Conf 2026.

## Sobre la charla

Cada vez que el navegador pinta una página construye dos árboles: el DOM y, combinado con ARIA, el árbol de accesibilidad. Este árbol es el que usan lectores de pantalla y otras tecnologías de asistencia, pero también es clave, y poco conocida, para el rendimiento web.

Veremos cómo funciona el renderizado de un navegador y en qué momento se genera el árbol de accesibilidad. Compararemos dos implementaciones reales de un radio button: una con un design system popular basado en divs y JavaScript, y otra con HTML semántico accesible por defecto. La diferencia en elementos del DOM, atributos, CSS y JS es enorme, y se traduce en tiempo de parsing, cálculo de estilos y bloqueo del hilo principal.

Descubriremos la relación, no siempre visible, entre "accesible" y "rápido", y por qué el HTML semántico frente a soluciones sobrediseñadas mejora tanto la experiencia de personas usuarias de tecnología de asistencia como las métricas de Core Web Vitals. Priorizar la experiencia de desarrollo sobre la de usuario final tiene un coste real y medible.

Saldrás con argumentos y ejemplos concretos para defender el HTML semántico como primera línea de optimización, de accesibilidad y de rendimiento.

## Cómo usar este repositorio

| Carpeta | Qué contiene | Cómo empezar |
| --- | --- | --- |
| `deck/` | La presentación: HTML, CSS y un poco de JavaScript, sin build. Atajos de teclado en el panel de ayuda (tecla <kbd>?</kbd>). | Publicada en <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/>. En local: `cd deck && npm start` y abre <http://127.0.0.1:8000> (necesita Python 3; sin él, cualquier servidor estático sirve). |
| `bench/` | El banco de pruebas: las apps comparadas, los scripts de medición, los resultados y las trazas para DevTools. | Requisitos, instalación, comandos y dependencias en [bench/README.md](bench/README.md). |
| `docs/` | Referencias de la charla y tareas pendientes. | — |

Para ejecutar los tests de la presentación (navegación, notas, atajos y auditoría axe en cada diapositiva): `cd deck && npm ci && npm test`.

## Participa en el benchmark

Desde cualquier navegador, también en el móvil y con tu lector de pantalla: **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>**. Tarda unos 2 minutos y no hay que instalar nada.

Si sabes usar la terminal, también puedes ejecutar el banco de pruebas completo en tu equipo: en Chrome con cualquier sistema operativo y, opcionalmente, con VoiceOver en macOS. La guía está en [bench/PARTICIPA.md](bench/PARTICIPA.md) ([in English](bench/PARTICIPATE.md)).
