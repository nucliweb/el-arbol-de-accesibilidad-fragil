# Banco de pruebas: un radio button, seis implementaciones

¿Quieres ejecutarlo en tu equipo y compartir los resultados? Sigue la guía [PARTICIPA.md](PARTICIPA.md) ([in English](PARTICIPATE.md)).

Mide cuánto cuesta un grupo de radio buttons según cómo se construya: DOM, CSS, JavaScript, trabajo del hilo principal y trabajo del árbol de accesibilidad.

## Implementaciones

Cada una es una app independiente, montada siguiendo su documentación oficial, que renderiza el mismo escenario (`shared/scenario.js`): un título "Ajustes" y un grupo "Tono de llamada" con N opciones.

| Variante | Carpeta | Cómo está construida |
| --- | --- | --- |
| `native` | `apps/native` | `<input type="radio">` con `accent-color`. Sin JavaScript. |
| `native-styled` | `apps/native` | El mismo input nativo con estilos propios (`appearance: none`). Sin JavaScript. |
| `shadcn-base` | `apps/shadcn` | shadcn/ui con su configuración por defecto (Base UI, preset Nova). |
| `shadcn-radix` | `apps/shadcn-radix` | shadcn/ui con Radix. |
| `mui` | `apps/mui` | Material UI con Emotion y Roboto. |
| `material-web` | `apps/material-web` | Web components de Material Web (Lit). |

## Método

- Chrome estable vía Playwright, un navegador nuevo por ejecución (caché fría), CPU ralentizada ×4 y viewport de 1280×800.
- N = 1, 10, 100 y 1000 opciones; 5 ejecuciones por combinación, intercaladas entre variantes; se reporta la mediana.
- Dos modos: accesibilidad desactivada (lo habitual sin tecnología de asistencia) y activada con `--force-renderer-accessibility` (lo que ocurre cuando hay un lector de pantalla en marcha). El modo desactivado usa además `--disable-platform-accessibility-integration`: si macOS marca VoiceOver como activo (puede quedarse marcado tras cerrarlo por AppleScript), Chrome construye el árbol de accesibilidad en todas las páginas aunque no haya ningún lector de pantalla. Se comprueba en `chrome://accessibility`, en «Active assistive technology».
- En cada ejecución se graba una traza de la carga y otra de un clic en la última opción. Además se cuentan el DOM y el CSS (incluido el shadow DOM), se mide el clic con Event Timing y se lee el árbol de accesibilidad completo por CDP.
- Comprobación de cordura: tras el clic, el radio pulsado debe ser el único marcado en el árbol de accesibilidad.

Limitaciones: servidor local sin limitar la red, un Apple M4 con la CPU ralentizada como aproximación a un dispositivo de gama baja, y solo Chrome.

## Requisitos

- [Node.js](https://nodejs.org/) 26 (la LTS activa) o posterior, y npm. El archivo `.nvmrc` de la raíz fija la versión para nvm y fnm.
- [Google Chrome](https://www.google.com/chrome/) estable (las pruebas lo lanzan con Playwright, `channel: 'chrome'`). Si no lo tienes: `npx playwright install chrome`.
- Git.
- Unos 1,1 GB libres para las dependencias de las apps.
- Para las pruebas con VoiceOver: macOS, y en Utilidad VoiceOver > General, «Permitir que VoiceOver se controle con AppleScript».

Solo se ha probado en macOS. Las mediciones de Chrome deberían funcionar en Windows y Linux, pero no se han probado; las instrucciones para esos sistemas están en [PARTICIPA.md](PARTICIPA.md#windows-y-linux-sin-probar).

## Instalación

```sh
git clone https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil.git
cd el-arbol-de-accesibilidad-fragil/bench
npm ci            # Playwright, para controlar Chrome
npm run setup     # instala y compila las 7 apps y comprueba Node y Chrome
npm test          # tests de las utilidades de medición
```

## Uso

| Comando | Qué hace | Duración |
| --- | --- | --- |
| `npm run participate` | Mediciones de Chrome de los dos niveles con CPU ×4 y ×1, y un informe para compartir. Ver [PARTICIPA.md](PARTICIPA.md). | 10–25 min |
| `npm run participate:voiceover` | Lo mismo con VoiceOver (solo macOS; ocupa el Mac). | unos 20 min |
| `node scripts/measure.js --runs=5` y `node scripts/summarize.js` | Medición completa del grupo de radios (1, 10, 100 y 1000 opciones). | unos 35 min |
| `node scripts/measure-travel.js --runs=5` y `node scripts/summarize-travel.js` | Medición completa de A11yConf Travel, con trazas para DevTools. | unos 5 min |
| `npm run voiceover` y `node scripts/summarize-voiceover.js` | VoiceOver en el grupo de radios. | unos 25 min |
| `npm run voiceover:travel` y `npm run voiceover:travel:summary` | VoiceOver en A11yConf Travel. | unos 4 min |
| `npm run trace:focus-idle` | Trazas del foco de teclado en reposo (el ripple de MUI). | unos 2 min |

Opciones de `measure.js`: `--runs`, `--n=1,10`, `--targets=native,mui`, `--modes=off,on` y `--throttle=4`. `measure-travel.js` acepta `--runs`, `--targets`, `--modes` y `--throttle`.

Los resultados se guardan en `results/`: un `raw-*.jsonl` con cada ejecución y un `summary-*.md` y `summary-*.json` con las medianas (con el prefijo `travel-` para A11yConf Travel). Las trazas completas van a `results/traces/`, fuera del repositorio por tamaño.

## Dependencias

Lo que instala `npm run setup`, app por app. Las versiones exactas están en el `package-lock.json` de cada carpeta.

| Carpeta | Dependencias de la página | Herramientas de build |
| --- | --- | --- |
| `bench` | — | Playwright |
| `apps/native`, `apps/travel-native` | Ninguna: HTML y CSS generados con Node | Ninguna |
| `apps/shadcn` | React, Base UI, shadcn, `cn`, Tailwind CSS, lucide-react, Geist | Vite, TypeScript, oxlint |
| `apps/shadcn-radix` | React, Radix UI, shadcn, `cn`, Tailwind CSS, lucide-react, Geist | Vite, TypeScript, oxlint |
| `apps/mui` | React, MUI, Emotion, Roboto | Vite, TypeScript, oxlint |
| `apps/material-web` | Material Web (Lit), Roboto | Vite, TypeScript |
| `apps/travel-legacy` | React, MUI, MUI Icons, Emotion, react-select, react-datepicker, react-modal, date-fns, Roboto | Vite, TypeScript, oxlint |

Las apps se sirven desde un servidor local en `127.0.0.1`; las pruebas no se conectan a internet.

## Prueba con VoiceOver

Mide cuánto tarda VoiceOver (macOS) en anunciar cada opción al recorrer el grupo con la flecha abajo: abre cada página en Chrome con la CPU ×4, espera a que VoiceOver anuncie la primera opción, pulsa la flecha 20 veces y registra el tiempo hasta que VoiceOver dice la opción siguiente.

Controla VoiceOver por AppleScript (`scripts/lib/voiceover.js`), sin modificar archivos del sistema. Necesita:

- Marcar «Permitir que VoiceOver se controle con AppleScript» en Utilidad VoiceOver > General.
- Dar permiso a la terminal para controlar VoiceOver cuando macOS lo pida.

```sh
npm run voiceover:pilot   # prueba rápida, unos segundos
npm run voiceover         # prueba completa, unos 25 minutos
node scripts/summarize-voiceover.js
```

Mientras se ejecuta, VoiceOver habla y controla el foco: no uses el equipo. Los pasos en que VoiceOver quedó una opción por detrás (una pulsación previa no movió la selección) se cuentan como «desfasados» y se excluyen de la latencia.

## Versión para el navegador

`web/` es una versión del benchmark que funciona en cualquier navegador, publicada en <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/> con GitHub Pages (`.github/workflows/pages.yml`). Carga las apps ya compiladas en un iframe visible, repite 3 veces cada paso (1000 radios con HTML nativo, shadcn/ui con Radix y MUI; y A11yConf Travel) y mide, desde la propia página, el tiempo que el hilo principal queda bloqueado hasta que vuelve a estar en reposo: una cadena de tareas mínimas con `MessageChannel` en la que cada hueco de más de 8 ms es trabajo del navegador (`web/src/lib/busy.js`). Con el lector de pantalla apagado y encendido, la diferencia es el coste del árbol de accesibilidad en ese dispositivo. No puede medir cuándo habla el lector de pantalla.

```sh
npm run setup        # compila las apps
npm run web:build    # monta el sitio en web/dist
npx http-server web/dist   # o cualquier servidor estático
```

Validación: con la accesibilidad de Chrome forzada, un clic en 1000 radios pasa de 44–48 a 85–97 ms con shadcn/ui y de 58–71 a 80–97 ms con MUI; con VoiceOver real encendido, 86 y 98 ms; el nativo, 0 ms en todos los casos. Funciona en Chrome, WebKit y Firefox (probados con Playwright, también con perfiles de móvil); no se ha probado todavía en un móvil real.

## A11yConf Travel: una web realista

Una búsqueda de hoteles ficticia con formulario de búsqueda, filtros (estrellas, precio, régimen, servicios, cancelación gratuita), 30 resultados, orden y un modal de detalle. Los datos y la lógica de filtrado y orden son comunes (`shared/travel.js`), así que las dos versiones muestran el mismo contenido con los mismos nombres accesibles.

| Variante | Carpeta | Cómo está construida |
| --- | --- | --- |
| `travel-native` | `apps/travel-native` | HTML semántico generado en build: `<select>`, `<input type="date">`, `range`, checkbox, radio y `<dialog>`, con unos 3 KB de JavaScript propio para filtrar y abrir el detalle. |
| `travel-legacy` | `apps/travel-legacy` | React, MUI con `@mui/icons-material`, react-select (destino), react-datepicker (fechas) y react-modal (detalle). |

La tarea medida (`scripts/lib/travel-task.js`) son 14 pasos con teclado, iguales en las dos versiones: Tab por los filtros de estrellas, marcar 4 estrellas (hasta el anuncio «6 hoteles encontrados»), bajar el precio, cambiar el régimen con las flechas, abrir el detalle del primer hotel, recorrer las habitaciones y cerrar con Escape. La elección de destino queda fuera: escribir en el `<select>` nativo no produce ningún anuncio de VoiceOver y react-select necesita otras teclas, así que no son comparables.

```sh
(cd apps/travel-native && npm run build)
(cd apps/travel-legacy && npm install && npm run build)

# Chrome: estructura, carga y tarea, con la accesibilidad desactivada y activada
node scripts/measure-travel.js --runs=5
node scripts/summarize-travel.js

# VoiceOver: la misma tarea, unos 4 minutos (toma el control del Mac)
npm run voiceover:travel:pilot
npm run voiceover:travel
npm run voiceover:travel:summary
```

`measure-travel.js` guarda dos trazas por ejecución, la carga y la tarea, que se abren en el panel Performance de DevTools; cada paso de la tarea es una medida de user timing con nombre. `summarize-travel.js` escribe las tablas en texto, incluidas las cifras paso a paso de la traza representativa de cada versión y modo. Las trazas representativas están publicadas en [`traces/`](traces/README.md).

`npm run trace:focus-idle` graba las dos versiones con el foco de teclado en un checkbox y 5 segundos sin tocar nada, con `prefers-reduced-motion: reduce`: muestra el ripple de foco de MUI, que genera unos 60 frames por segundo, frente a 30 frames en total en la versión nativa. Ver [`traces/`](traces/README.md#foco-de-teclado-en-reposo-focus-idle).

Resultados del 25 de noviembre de 2026: [Chrome](results/travel-summary-2026-11-25T23-09-58-772Z.md) y [VoiceOver](results/voiceover-travel-summary-2026-11-25T22-04-58-137Z.md).

