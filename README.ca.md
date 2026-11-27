# L'arbre d'accessibilitat fràgil

[English](README.md) · [Español](README.es.md) · **Català**

Diapositives, benchmark i dades de la xerrada **[El árbol de accesibilidad frágil: por qué el HTML semántico es clave para el rendimiento web](https://2026.a11yconf.com/agenda/el-arbol-de-accesibilidad-fragil)** («L'arbre d'accessibilitat fràgil: per què l'HTML semàntic és clau per al rendiment web»), presentada en castellà a l'A11y Conf 2026.

- **Diapositives**: [Català](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/ca/) · [Español](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/) · [English](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/en/). Cada diapositiva té notes escrites per llegir-les, amb una drecera de teclat per mostrar-les, i una vista de text amb taules en lloc de gràfics.
- **Fes la prova al teu dispositiu**: <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>. Uns 2 minuts, sense instal·lar res, també al mòbil i amb el teu lector de pantalla.

## Sobre la xerrada

Cada vegada que el navegador pinta una pàgina construeix dos arbres: el DOM i, combinat amb ARIA, l'arbre d'accessibilitat. És l'arbre que fan servir els lectors de pantalla i altres tecnologies d'assistència, però també és clau, i poc conegut, per al rendiment web.

La xerrada explica com funciona el renderitzat d'un navegador i en quin moment es genera l'arbre d'accessibilitat. Compara implementacions reals d'un radio button: design systems populars basats en divs i JavaScript, i HTML semàntic accessible per defecte. La diferència en elements del DOM, atributs, CSS i JS és enorme, i es tradueix en temps de parsing, càlcul d'estils i bloqueig del fil principal.

Mostra la relació, no sempre visible, entre «accessible» i «ràpid», i per què l'HTML semàntic, davant de solucions sobredissenyades, millora tant l'experiència de les persones usuàries de tecnologia d'assistència com les mètriques de Core Web Vitals. Prioritzar l'experiència de desenvolupament per davant de la de l'usuari final té un cost real i mesurable.

## El que diuen les dades

Mesurat a Chrome amb l'arbre d'accessibilitat activat (`--force-renderer-accessibility`) i la CPU alentida ×4, i amb VoiceOver automatitzat a macOS:

- Després d'un clic en un grup de 1000 radio buttons, Chrome dedica **2,6 ms** a la feina d'accessibilitat amb radios natius i **185–1.189 ms** amb llibreries de components (shadcn/ui, Material Web, MUI).
- Amb 1000 opcions, VoiceOver triga **436 ms** a anunciar l'opció següent amb radios natius i fins a **1.973 ms** amb MUI.
- En una cerca d'hotels realista, A11yConf Travel, l'arbre d'accessibilitat costa el mateix a les dues versions (56 i 57 ms en una tasca de 14 passos amb el teclat). El que canvia és tot el que hi ha al voltant: **255 contra 991 ms** de fil principal i **79 contra 464 ms** de JavaScript. Cada Tab a la versió legacy executa un centenar de tasques petites (gestors de focus, frames del ripple) en lloc d'una vintena: cap no és llarga, així que cap mètrica no les marca.
- En un iPhone 16 Pro, un clic en 1000 radios de MUI congela Safari uns **5 s**, amb VoiceOver o sense; amb HTML natiu, 0 ms.
- L'HTML semàntic redueix el cost, però no l'elimina: carregar 1000 radios natius passa de 16 ms de bloqueig amb l'accessibilitat desactivada a 479 ms amb l'accessibilitat activada. Menys DOM és menys feina per a l'arbre d'accessibilitat.

La diapositiva «El que aquestes dades no diuen» recull els límits: només Chrome i VoiceOver, un portàtil ràpid amb la CPU alentida, un servidor local. Tot el codi és aquí perquè qualsevol persona ho pugui repetir amb altres navegadors i lectors de pantalla.

## Traces

Obre-les a trace.cafe o arrossega el fitxer al panell Performance de Chrome DevTools. A les traces de la tasca, cada pas apareix amb el seu nom a la pista Timings.

| Què | trace.cafe | Fitxer |
| --- | --- | --- |
| A11yConf Travel, tasca de 14 passos amb el teclat i l'accessibilitat activada: legacy (React, MUI i altres) | [Obre](https://trace.cafe/t/VoRFo6QOSY) | `bench/traces/travel/travel-legacy-a11y-on-run3-task.json.gz` |
| La mateixa tasca: HTML natiu | [Obre](https://trace.cafe/t/XLPHjpSGiI) | `bench/traces/travel/travel-native-a11y-on-run2-task.json.gz` |
| Focus de teclat en un control, 5 s sense tocar res, amb reduir el moviment: legacy (el ripple de focus de MUI no s'atura) | [Obre](https://trace.cafe/t/ihrNliptjB) | `bench/traces/focus-idle/travel-legacy.json.gz` |
| El mateix: HTML natiu | [Obre](https://trace.cafe/t/J5PZ7aWCIg) | `bench/traces/focus-idle/travel-native.json.gz` |
| Documentació de radio buttons de mui.com, 5 s quieta amb reduir el moviment: 20 botons «Edit in Chat» animats sense fi | [Obre](https://trace.cafe/t/rU5JSwqmGV) | `bench/traces/demos/mui-docs-radio-idle-reduced-motion.json.gz` |
| Càrrega de renfe.com en un mòbil de gamma mitjana (Pixel 7 emulat, Slow 4G, CPU ×4) | [Obre](https://trace.cafe/t/HJIoDNe5hJ) | `bench/traces/demos/renfe-mobile-slow4g-cpu4x.json.gz` |

## Com fer servir aquest repositori

| Carpeta | Què hi ha | Com començar |
| --- | --- | --- |
| `deck/` | La presentació: HTML, CSS i una mica de JavaScript, sense build. En castellà (`index.html`), anglès (`en/`) i català (`ca/`), amb tema clar i fosc i vista visual o de text. Dreceres de teclat i configuració al panell d'ajuda (<kbd>?</kbd>): <kbd>G</kbd> canvia la vista, <kbd>T</kbd> el tema, <kbd>L</kbd> l'idioma i <kbd>H</kbd> amaga la barra de controls; mantén <kbd>Alt</kbd> 2 segons per veure la tecla de cada botó. | Publicada a <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/ca/>. En local: `cd deck && npm start` i obre <http://127.0.0.1:8000/ca/> (cal Python 3; qualsevol servidor estàtic serveix). |
| `bench/` | El banc de proves: les apps comparades, els scripts de mesura, els resultats i les traces per a DevTools. | Requisits, instal·lació, ordres i dependències a [bench/README.md](bench/README.md) (en castellà). |
| `docs/` | Referències de la xerrada i tasques pendents. | — |

Per executar els tests de la presentació (navegació, notes, dreceres, vistes, temes, idiomes, demos, cap diapositiva amb desplaçament i auditoria axe a cada diapositiva de cada idioma, amb els dos temes): `cd deck && npm ci && npm test`.

## Participa en el benchmark

Des de qualsevol navegador, també al mòbil i amb el teu lector de pantalla: **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>**, en català, castellà o anglès. Si fas servir un lector de pantalla, fes-la dues vegades, amb el lector apagat i encès: la diferència és el que l'arbre d'accessibilitat li costa al teu dispositiu. No s'envia res sense que ho decideixis; al final pots compartir els resultats en una issue de GitHub, com [aquesta d'un iPhone 16 Pro amb VoiceOver](https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/1).

Si saps fer servir el terminal, també pots executar el banc de proves complet al teu ordinador: a Chrome amb qualsevol sistema operatiu i, opcionalment, amb VoiceOver a macOS. La guia és a [bench/PARTICIPA.md](bench/PARTICIPA.md) (en castellà; [in English](bench/PARTICIPATE.md)).
