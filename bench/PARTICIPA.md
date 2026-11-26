# Participa en el benchmark

[English version](PARTICIPATE.md)

Este benchmark mide cuánto cuesta el árbol de accesibilidad según cómo se construya una página: con HTML nativo o con librerías de componentes. Mis datos salen de un solo equipo, un Apple M4 con la CPU ralentizada para parecerse a un móvil modesto. Con tus resultados, en tu equipo real, la comparación deja de depender de una sola máquina.

## La forma más fácil: en tu navegador

Abre **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/>** en tu ordenador o en tu móvil. No hay que instalar nada y tarda unos 2 minutos. Si usas un lector de pantalla, hazla dos veces, con el lector apagado y encendido: la página compara las dos y prepara el informe para enviarlo.

Mide algo más sencillo que la versión de terminal: cuánto tiempo queda bloqueado tu navegador después de cada acción. No mide cuánto tarda tu lector de pantalla en hablar, ni guarda trazas. A cambio, funciona en cualquier navegador y con cualquier lector de pantalla, en tu dispositivo real.

## En la terminal

Hay dos pruebas:

- **Chrome** (`npm run participate`): cualquier sistema (macOS, Windows o Linux). Mide la carga y una tarea con teclado en dos niveles, un grupo de radio buttons y una web de viajes realista (A11yConf Travel), con la accesibilidad de Chrome desactivada y activada. Tarda entre 10 y 25 minutos, según el equipo, y puedes seguir usando el equipo, aunque un uso intenso hace los resultados menos fiables.
- **VoiceOver** (`npm run participate:voiceover`), opcional y solo en macOS: mide cuánto tarda VoiceOver en responder a cada pulsación. Tarda unos 20 minutos y **durante la prueba VoiceOver habla y mueve el foco: no podrás usar el Mac**.

Cada prueba se ejecuta dos veces: con la CPU ralentizada ×4, como en la charla, para poder comparar, y con la CPU ×1, la de tu equipo tal cual.

## Qué necesitas

- Saber usar la terminal.
- [Node.js](https://nodejs.org/) 26 (la LTS activa) o posterior. Si usas nvm o fnm, el archivo `.nvmrc` del repositorio ya indica la versión: `nvm use` o `fnm use`.
- [Google Chrome](https://www.google.com/chrome/) estable.
- Git.
- Unos 1,1 GB libres para las dependencias.
- Para VoiceOver: en Utilidad VoiceOver > General, marcar «Permitir que VoiceOver se controle con AppleScript». La primera vez, macOS te pedirá permiso para que la terminal controle VoiceOver.

## Cómo ejecutarlo

Estos pasos se han probado en macOS (Apple M4, macOS 27, Node 26 y Chrome 158). Para Windows y Linux, mira antes [la sección siguiente](#windows-y-linux-sin-probar).

```sh
git clone https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil.git
cd el-arbol-de-accesibilidad-fragil/bench
npm ci
npm run setup                    # instala y compila las apps; unos minutos
npm run participate              # Chrome
npm run participate:voiceover    # opcional, solo macOS
```

Para que los resultados sean comparables:

- Si usas un portátil, conéctalo a la corriente.
- Cierra las aplicaciones pesadas.
- No ejecutes otras pruebas al mismo tiempo.

## Windows y Linux (sin probar)

> **Aviso:** el benchmark solo se ha probado en macOS. Las mediciones de Chrome no dependen del sistema y deberían funcionar en Windows y Linux, pero nadie lo ha comprobado todavía. Si lo ejecutas, cuéntanos en el issue cómo ha ido, aunque falle. La prueba de VoiceOver solo existe en macOS.

### Windows

En PowerShell o Windows Terminal:

```powershell
winget install OpenJS.NodeJS.LTS   # Node 26; o el instalador de nodejs.org
winget install Google.Chrome
winget install Git.Git
```

Cierra y vuelve a abrir la terminal para que encuentre `node` y `git`, y sigue los pasos de [Cómo ejecutarlo](#cómo-ejecutarlo) sin el último comando (VoiceOver). Si el equipo tiene modos de energía, usa «Máximo rendimiento» o, al menos, conéctalo a la corriente.

### Linux

```sh
# Node 26 con nvm (https://github.com/nvm-sh/nvm) o fnm
nvm install 26

# Google Chrome estable, con el instalador de Playwright (pide sudo)
cd el-arbol-de-accesibilidad-fragil/bench && npm ci && npx playwright install chrome
```

En Debian o Ubuntu también puedes instalar Chrome con el paquete `.deb` de <https://www.google.com/chrome/>; Google publica Chrome estable para x64 y ARM64. Chrome se ejecuta sin ventana: no hace falta escritorio.

Después, sigue los pasos de [Cómo ejecutarlo](#cómo-ejecutarlo) sin el último comando (VoiceOver).

## Qué datos se recogen

Al empezar, la prueba te enseña exactamente qué datos del equipo se guardan: sistema operativo y versión, arquitectura, modelo de CPU y número de núcleos, memoria, y versiones de Node, Chrome y VoiceOver. **No se guardan ni el nombre del equipo, ni tu usuario, ni rutas de tu disco.**

No se envía nada automáticamente. Al terminar tendrás dos archivos en `bench/results/participant/`:

- `participant-<fecha>.md`: el informe en texto, con tablas.
- `participant-<fecha>.json.gz`: los resultados en bruto.

Las trazas de Chrome que también se generan (en `bench/results/traces/`) se quedan en tu equipo; no hace falta compartirlas. Además de los datos de arriba, incluyen el modelo de hardware, la GPU y la versión del sistema.

## Cómo compartir los resultados

1. Abre un issue con el formulario [«Resultados del benchmark»](https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/new?template=benchmark-results.yml).
2. Pega el contenido de `participant-<fecha>.md` en «Informe».
3. Arrastra `participant-<fecha>.json.gz` a «Resultados en bruto».
4. Si quieres, cuenta qué dispositivo usas y si usas a diario alguna tecnología de asistencia.

El issue es público: al enviarlo aceptas que los resultados se publiquen en el repositorio y se usen en la charla.

## Si algo falla

- **«Google Chrome (stable) was not found»**: instala Chrome estable o ejecuta `npx playwright install chrome`.
- **«Allow VoiceOver to be controlled by AppleScript first»**: activa la opción de Utilidad VoiceOver indicada arriba.
- **VoiceOver sigue marcado como activo al terminar**: al cerrar VoiceOver desde un script, macOS puede seguir marcándolo como activo y Chrome hace trabajo de accesibilidad en todas las páginas. La prueba te avisa; pulsa Cmd+F5 dos veces (activar y desactivar) para corregirlo.
- **Cualquier otro error**: abre un issue normal con el mensaje de la terminal.

Más detalle sobre qué mide cada prueba y cómo: [README del banco de pruebas](README.md).
