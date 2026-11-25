# Banco de pruebas: un radio button, seis implementaciones

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

## Cómo ejecutarlo

```sh
# Instalar y compilar cada app
for app in apps/*/; do (cd "$app" && npm install && npm run build); done
npm install

# Tests de las utilidades de medición
npm test

# Medición completa (unos minutos) y resumen
node scripts/measure.js --runs=5
node scripts/summarize.js
```

Opciones de `measure.js`: `--runs`, `--n=1,10`, `--targets=native,mui`, `--modes=off,on` y `--throttle=4`.

Los resultados se guardan en `results/`: un `raw-*.jsonl` con cada ejecución y un `summary-*.md` y `summary-*.json` con las medianas.

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

# VoiceOver: la misma tarea, unos 6 minutos (toma el control del Mac)
npm run voiceover:travel:pilot
npm run voiceover:travel
npm run voiceover:travel:summary
```

`measure-travel.js` guarda dos trazas por ejecución, la carga y la tarea, que se abren en el panel Performance de DevTools; cada paso de la tarea es una medida de user timing con nombre. `summarize-travel.js` escribe las tablas en texto, incluidas las cifras paso a paso de la traza representativa de cada versión y modo. Las trazas representativas están publicadas en [`traces/`](traces/README.md).

Resultados del 25 de noviembre de 2026: [Chrome](results/travel-summary-2026-11-25T23-09-58-772Z.md) y [VoiceOver](results/voiceover-travel-summary-2026-11-25T22-04-58-137Z.md).

