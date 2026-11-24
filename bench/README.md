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
- Dos modos: accesibilidad desactivada (lo habitual sin tecnología de asistencia) y activada con `--force-renderer-accessibility` (lo que ocurre cuando hay un lector de pantalla en marcha).
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
