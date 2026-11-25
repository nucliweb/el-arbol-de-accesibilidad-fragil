# A11yConf Travel: resultados de Chrome

Chrome 158.0.8127.88, CPU ×4, viewport 1280×800, 5 ejecuciones por versión y modo; se muestra la mediana. Inicio: 2026-11-25T23:02:13.036Z.

«Accesibilidad activada» es Chrome con `--force-renderer-accessibility`, lo que ocurre cuando hay un lector de pantalla en marcha. Los tiempos de accesibilidad son el trabajo del árbol de accesibilidad en el hilo principal del renderer.

En todas las ejecuciones la tarea hizo lo esperado: el filtro dejó el número de hoteles correcto, el modal se abrió y Escape devolvió el foco al botón.

## Estructura de la página

Medida justo después de la carga, con los 30 hoteles en pantalla. Los nodos AX (árbol de accesibilidad de Chrome, con la accesibilidad activada) incluyen los ignorados; los expuestos son los que llegan al lector de pantalla.

| Versión | Elementos del body | Profundidad DOM | Selectores CSS | Nodos AX | Nodos AX expuestos | JS (KB) | CSS (KB) | Fuentes (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| travel-native | 758 | 9 | 68 | 1661 | 1491 | 10.6 | 5.3 | 0 |
| travel-legacy | 2041 | 12 | 626 | 2186 | 1476 | 784.8 | 67.2 | 64.8 |

## Carga de la página

| Versión | Modo | FCP (ms) | LCP (ms) | Hilo principal (ms) | TBT (ms) | JavaScript (ms) | Estilos (ms) | Layout (ms) | Accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| travel-native | accesibilidad desactivada | 172 | 172 | 224.1 | 60.0 | 28.0 | 20.8 | 23.3 | 31.7 |
| travel-legacy | accesibilidad desactivada | 496 | 496 | 583.0 | 236.1 | 357.6 | 23.3 | 36.5 | 50.4 |
| travel-native | accesibilidad activada | 176 | 176 | 235.3 | 65.4 | 27.4 | 20.5 | 25.4 | 31.9 |
| travel-legacy | accesibilidad activada | 496 | 496 | 584.5 | 236.5 | 353.9 | 25.0 | 36.2 | 52.3 |

## Tarea con teclado (14 pasos)

| Versión | Modo | Hilo principal (ms) | TBT (ms) | JavaScript (ms) | Estilos (ms) | Accesibilidad (ms) | Interacción más lenta (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| travel-native | accesibilidad desactivada | 254.7 | 0 | 79.9 | 11.4 | 55.2 | 24 |
| travel-legacy | accesibilidad desactivada | 1049.1 | 39.5 | 471.3 | 75.8 | 61.4 | 72 |
| travel-native | accesibilidad activada | 266.1 | 0 | 81.8 | 12.7 | 54.9 | 24 |
| travel-legacy | accesibilidad activada | 1043.7 | 41.0 | 483.6 | 72.8 | 64.9 | 80 |

### Paso a paso, accesibilidad desactivada (mediana)

«Interacción» es la duración de Event Timing (como INP; «<16» significa menos de 16 ms, el mínimo que mide el navegador). «Hilo principal» y «accesibilidad» salen de la traza, entre el inicio y el final de cada paso (500 ms después de la tecla).

| Paso | travel-native: interacción (ms) | travel-native: hilo principal (ms) | travel-native: accesibilidad (ms) | travel-legacy: interacción (ms) | travel-legacy: hilo principal (ms) | travel-legacy: accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | <16 | 6.7 | 0.7 | 16 | 44.0 | 1.6 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 24 | 28 | 8.9 | 72 | 93.1 | 2.6 |
| 3. Tab a «3 estrellas» | 16 | 5.2 | 0.5 | 20 | 27.7 | 1.6 |
| 4. Tab a «2 estrellas» | <16 | 4.8 | 0.8 | 16 | 35.4 | 1.5 |
| 5. Tab a «1 estrella» | <16 | 4.3 | 0.3 | 16 | 35.7 | 1.3 |
| 6. Tab al precio máximo | <16 | 4.8 | 0.7 | 24 | 36.8 | 1.4 |
| 7. Bajar el precio | 16 | 17.5 | 6.5 | 40 | 69.5 | 1.4 |
| 8. Tab al régimen | 16 | 5.4 | 0.5 | 16 | 44.0 | 2.1 |
| 9. Elegir «Solo alojamiento» | 16 | 14.2 | 4.3 | 48 | 57.9 | 1.9 |
| 10. Volver a «Cualquier régimen» | 16 | 17.2 | 6.7 | 56 | 85.1 | 8.6 |
| 11. Abrir el detalle del hotel | 16 | 21.0 | 6.5 | 72 | 95.9 | 9.2 |
| 12. Siguiente habitación | <16 | 9.4 | 4.1 | 16 | 29.8 | 1.5 |
| 13. Siguiente habitación | <16 | 5.1 | 0.7 | 16 | 32.5 | 2.5 |
| 14. Cerrar con Escape (vuelta al botón) | 16 | 20.4 | 11.2 | 40 | 87.6 | 12.7 |

### Paso a paso, accesibilidad activada (mediana)

«Interacción» es la duración de Event Timing (como INP; «<16» significa menos de 16 ms, el mínimo que mide el navegador). «Hilo principal» y «accesibilidad» salen de la traza, entre el inicio y el final de cada paso (500 ms después de la tecla).

| Paso | travel-native: interacción (ms) | travel-native: hilo principal (ms) | travel-native: accesibilidad (ms) | travel-legacy: interacción (ms) | travel-legacy: hilo principal (ms) | travel-legacy: accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | <16 | 7.3 | 0.3 | 16 | 50.2 | 1.9 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 24 | 30.5 | 9.0 | 72 | 90.4 | 2.8 |
| 3. Tab a «3 estrellas» | <16 | 5.7 | 0.8 | 16 | 28.9 | 1.7 |
| 4. Tab a «2 estrellas» | <16 | 5.7 | 0.6 | 16 | 30.3 | 1.4 |
| 5. Tab a «1 estrella» | <16 | 5.0 | 0.4 | 16 | 33.9 | 1.8 |
| 6. Tab al precio máximo | <16 | 5.5 | 0.5 | 16 | 37.1 | 1.5 |
| 7. Bajar el precio | 16 | 19.0 | 6.8 | 32 | 59.2 | 1.2 |
| 8. Tab al régimen | <16 | 5.9 | 0.5 | 16 | 44.3 | 2.1 |
| 9. Elegir «Solo alojamiento» | 16 | 14.4 | 4.4 | 48 | 61.4 | 1.9 |
| 10. Volver a «Cualquier régimen» | 16 | 18.6 | 7.2 | 56 | 87.8 | 8.6 |
| 11. Abrir el detalle del hotel | 16 | 22.1 | 6.6 | 72 | 100.6 | 10 |
| 12. Siguiente habitación | <16 | 9.1 | 4.1 | 16 | 32.1 | 1.3 |
| 13. Siguiente habitación | <16 | 5.3 | 0.4 | 16 | 34.0 | 2.1 |
| 14. Cerrar con Escape (vuelta al botón) | 16 | 20.4 | 11.6 | 40 | 89.5 | 13.4 |

## Trazas para abrir en DevTools

Las trazas están en `results/traces/travel-2026-11-25T23-02-12-792Z/`. Se abren en el panel Performance de Chrome DevTools (Cargar perfil, o arrastrando el archivo .json.gz). En la tarea, cada paso aparece con su nombre en la pista Timings. Para cada versión y modo se elige la ejecución representativa: la que tiene el tiempo de hilo principal de la tarea más cercano a la mediana. Estas son sus cifras, el equivalente en texto de lo que muestra cada traza.

### travel-native, accesibilidad desactivada (ejecución 2)

- Carga: `travel-native-a11y-off-run2-load.json.gz`. Hilo principal 223.7 ms, TBT 59.4 ms, JavaScript 28.0 ms, estilos 20.8 ms, layout 22.6 ms, accesibilidad 30.6 ms; LCP 172 ms.
- Tarea: `travel-native-a11y-off-run2-task.json.gz`. Hilo principal 254.7 ms, TBT 0 ms, JavaScript 79.9 ms, accesibilidad 54.0 ms.

| Paso (pista Timings) | Interacción (ms) | Hilo principal (ms) | JavaScript (ms) | Estilos (ms) | Layout (ms) | Accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | <16 | 6.0 | 1.0 | 0.1 | 0 | 0.1 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 24 | 29.7 | 7.1 | 0.6 | 3.3 | 8.2 |
| 3. Tab a «3 estrellas» | <16 | 6.1 | 0.7 | 0.1 | 0 | 0.1 |
| 4. Tab a «2 estrellas» | <16 | 4.4 | 0.6 | 0.5 | 0 | 0.5 |
| 5. Tab a «1 estrella» | <16 | 3.9 | 0.6 | 0.5 | 0 | 0.3 |
| 6. Tab al precio máximo | <16 | 4.7 | 0.5 | 0.4 | 0 | 1.0 |
| 7. Bajar el precio | <16 | 17.3 | 3.0 | 0.0 | 2.6 | 7.0 |
| 8. Tab al régimen | <16 | 5.7 | 0.2 | 0.1 | 0 | 0.6 |
| 9. Elegir «Solo alojamiento» | 16 | 14.6 | 3.6 | 0.1 | 1.6 | 4.7 |
| 10. Volver a «Cualquier régimen» | 16 | 17.2 | 2.2 | 0.7 | 2.1 | 6.7 |
| 11. Abrir el detalle del hotel | 16 | 19.9 | 8.4 | 4.3 | 1.5 | 6.5 |
| 12. Siguiente habitación | <16 | 9.4 | 0.9 | 0.2 | 0 | 4.6 |
| 13. Siguiente habitación | <16 | 4.3 | 0.6 | 0.1 | 0 | 0.7 |
| 14. Cerrar con Escape (vuelta al botón) | 16 | 20.5 | 4.3 | 3.8 | 0.0 | 10.7 |

### travel-legacy, accesibilidad desactivada (ejecución 4)

- Carga: `travel-legacy-a11y-off-run4-load.json.gz`. Hilo principal 593.0 ms, TBT 244.4 ms, JavaScript 369.9 ms, estilos 23.3 ms, layout 36.5 ms, accesibilidad 50.6 ms; LCP 512 ms.
- Tarea: `travel-legacy-a11y-off-run4-task.json.gz`. Hilo principal 1049.1 ms, TBT 37.9 ms, JavaScript 465.8 ms, accesibilidad 64.1 ms.

| Paso (pista Timings) | Interacción (ms) | Hilo principal (ms) | JavaScript (ms) | Estilos (ms) | Layout (ms) | Accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | 16 | 42.8 | 15.0 | 3.1 | 1.6 | 1.1 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 72 | 93.1 | 61.5 | 3.8 | 1.4 | 2.6 |
| 3. Tab a «3 estrellas» | <16 | 27.7 | 8.7 | 1.1 | 1.3 | 1.1 |
| 4. Tab a «2 estrellas» | <16 | 35.6 | 11.1 | 2.8 | 1.8 | 1.0 |
| 5. Tab a «1 estrella» | <16 | 29.8 | 10.4 | 1.2 | 0.9 | 2.8 |
| 6. Tab al precio máximo | 24 | 35.4 | 8.7 | 4.9 | 0.1 | 1.6 |
| 7. Bajar el precio | 40 | 77.4 | 32.6 | 6.1 | 2.7 | 2.0 |
| 8. Tab al régimen | 16 | 39.6 | 9.8 | 4.4 | 1.6 | 2.3 |
| 9. Elegir «Solo alojamiento» | 48 | 61.4 | 39.6 | 3.5 | 0.6 | 2.9 |
| 10. Volver a «Cualquier régimen» | 56 | 79.2 | 42.1 | 5.3 | 3.5 | 9.2 |
| 11. Abrir el detalle del hotel | 72 | 98.7 | 51.9 | 8.6 | 1.1 | 9.5 |
| 12. Siguiente habitación | 16 | 36.7 | 12.0 | 3.4 | 1.0 | 1.5 |
| 13. Siguiente habitación | 16 | 34.7 | 13.0 | 2.7 | 1.4 | 1.7 |
| 14. Cerrar con Escape (vuelta al botón) | 40 | 84.0 | 35.3 | 4.6 | 0.6 | 13.8 |

### travel-native, accesibilidad activada (ejecución 5)

- Carga: `travel-native-a11y-on-run5-load.json.gz`. Hilo principal 241.9 ms, TBT 65.4 ms, JavaScript 27.3 ms, estilos 23.6 ms, layout 25.4 ms, accesibilidad 31.9 ms; LCP 180 ms.
- Tarea: `travel-native-a11y-on-run5-task.json.gz`. Hilo principal 266.1 ms, TBT 0 ms, JavaScript 84.0 ms, accesibilidad 54.5 ms.

| Paso (pista Timings) | Interacción (ms) | Hilo principal (ms) | JavaScript (ms) | Estilos (ms) | Layout (ms) | Accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | <16 | 7.5 | 0.9 | 0.1 | 0 | 1.0 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 24 | 27.2 | 7.2 | 0.4 | 3 | 8.4 |
| 3. Tab a «3 estrellas» | <16 | 4.8 | 0.1 | 0.0 | 0 | 0.4 |
| 4. Tab a «2 estrellas» | <16 | 4.5 | 0.7 | 0.1 | 0 | 0.1 |
| 5. Tab a «1 estrella» | <16 | 5.0 | 0.8 | 0.1 | 0 | 0.1 |
| 6. Tab al precio máximo | <16 | 5.2 | 0.5 | 0.1 | 0 | 0.5 |
| 7. Bajar el precio | 16 | 19.0 | 3.8 | 0.8 | 2.3 | 6.5 |
| 8. Tab al régimen | <16 | 6.6 | 0.9 | 0.1 | 0 | 0.3 |
| 9. Elegir «Solo alojamiento» | 16 | 14.5 | 3.5 | 0.5 | 1.8 | 4.2 |
| 10. Volver a «Cualquier régimen» | 16 | 21.3 | 2.8 | 0.1 | 3 | 7.5 |
| 11. Abrir el detalle del hotel | 16 | 22.1 | 9.5 | 4.9 | 1.4 | 6.6 |
| 12. Siguiente habitación | <16 | 9.0 | 0.7 | 0.1 | 0 | 4.1 |
| 13. Siguiente habitación | <16 | 7.0 | 1.0 | 0.5 | 0 | 1.1 |
| 14. Cerrar con Escape (vuelta al botón) | 16 | 21.9 | 5.3 | 3.9 | 0.1 | 11.6 |

### travel-legacy, accesibilidad activada (ejecución 4)

- Carga: `travel-legacy-a11y-on-run4-load.json.gz`. Hilo principal 591.2 ms, TBT 238.4 ms, JavaScript 355.5 ms, estilos 25.0 ms, layout 35.3 ms, accesibilidad 52.3 ms; LCP 500 ms.
- Tarea: `travel-legacy-a11y-on-run4-task.json.gz`. Hilo principal 1043.7 ms, TBT 41.0 ms, JavaScript 483.6 ms, accesibilidad 64.9 ms.

| Paso (pista Timings) | Interacción (ms) | Hilo principal (ms) | JavaScript (ms) | Estilos (ms) | Layout (ms) | Accesibilidad (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Tab a «4 estrellas» | 16 | 43.2 | 14.5 | 1.3 | 0.2 | 1.6 |
| 2. Marcar «4 estrellas» (anuncio de resultados) | 80 | 103.2 | 65.5 | 6.0 | 1.5 | 2.0 |
| 3. Tab a «3 estrellas» | 16 | 26.6 | 8.8 | 0.8 | 0.6 | 1.7 |
| 4. Tab a «2 estrellas» | <16 | 27.6 | 10.3 | 2.5 | 1.2 | 1.1 |
| 5. Tab a «1 estrella» | <16 | 32.3 | 12.1 | 3.3 | 0.8 | 1.2 |
| 6. Tab al precio máximo | 24 | 37.1 | 9.9 | 2.2 | 0.5 | 1.5 |
| 7. Bajar el precio | 32 | 58.0 | 32.0 | 1.6 | 1.6 | 1.2 |
| 8. Tab al régimen | 16 | 44.3 | 10.8 | 4.9 | 0.1 | 1.5 |
| 9. Elegir «Solo alojamiento» | 48 | 61.4 | 38.3 | 4.3 | 1.1 | 2.5 |
| 10. Volver a «Cualquier régimen» | 64 | 109.0 | 54.2 | 8.0 | 3.8 | 13.5 |
| 11. Abrir el detalle del hotel | 72 | 100.6 | 51.9 | 9.6 | 1.6 | 9.8 |
| 12. Siguiente habitación | 16 | 32.1 | 12.8 | 3.2 | 0.9 | 1.3 |
| 13. Siguiente habitación | 16 | 34.0 | 13.1 | 1.9 | 0.9 | 2.8 |
| 14. Cerrar con Escape (vuelta al botón) | 40 | 85.5 | 39.0 | 3.8 | 1.2 | 13.6 |

