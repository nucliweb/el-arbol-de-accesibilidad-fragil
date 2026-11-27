# The fragile accessibility tree

**English** · [Español](README.es.md) · [Català](README.ca.md)

Slides, benchmark and data for the talk **[El árbol de accesibilidad frágil: por qué el HTML semántico es clave para el rendimiento web](https://2026.a11yconf.com/agenda/el-arbol-de-accesibilidad-fragil)** ("The fragile accessibility tree: why semantic HTML is key to web performance"), given in Spanish at A11y Conf 2026.

- **Slides**: [English](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/en/) · [Español](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/) · [Català](https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/ca/). Every slide has notes written to be read, with a keyboard shortcut to show them, and a text view with tables instead of charts.
- **Run the benchmark on your device**: <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>. About 2 minutes, nothing to install, also on a phone and with your screen reader.

## About the talk

Every time the browser renders a page it builds two trees: the DOM and, combined with ARIA, the accessibility tree. Screen readers and other assistive technologies use that tree, and it is also a key, little-known part of web performance.

The talk looks at how a browser renders a page and when the accessibility tree is built. It compares real implementations of a radio button: popular design systems built on divs and JavaScript, and semantic HTML that is accessible by default. The difference in DOM elements, attributes, CSS and JavaScript is huge, and it turns into parsing time, style calculation and a blocked main thread.

It shows the link, not always visible, between "accessible" and "fast", and why semantic HTML, rather than over-engineered solutions, improves both the experience of people who use assistive technology and the Core Web Vitals. Putting the developer experience before the user experience has a real, measurable cost.

## What the data shows

Measured in Chrome with the accessibility tree on (`--force-renderer-accessibility`) and the CPU slowed down 4x, and with VoiceOver on macOS driven automatically:

- After one click in a group of 1,000 radio buttons, Chrome spends **2.6 ms** on accessibility work with native radios and **185–1,189 ms** with component libraries (shadcn/ui, Material Web, MUI).
- With 1,000 options, VoiceOver takes **436 ms** to announce the next option with native radios and up to **1,973 ms** with MUI.
- In a realistic hotel search, A11yConf Travel, the accessibility tree costs the same in both versions (56 and 57 ms over a 14-step keyboard task). What changes is everything around it: **255 vs 991 ms** of main thread and **79 vs 464 ms** of JavaScript. Every Tab in the legacy version runs about 100 small tasks (focus handlers, ripple frames) instead of about 20: none of them is long, so no metric flags them.
- On an iPhone 16 Pro, one click on 1,000 MUI radios freezes Safari for about **5 s**, with or without VoiceOver; with native HTML, 0 ms.
- Native HTML lowers the cost but does not remove it: loading 1,000 native radios goes from 16 ms of blocking time with accessibility off to 479 ms with it on. Less DOM is less work for the accessibility tree.

The slide "What this data does not say" lists the limits: only Chrome and VoiceOver, a fast laptop with a slowed-down CPU, a local server. All the code is here so anyone can repeat it with other browsers and screen readers.

## Traces

Open them in trace.cafe, or drag the file into the Performance panel of Chrome DevTools. In the task traces, each step of the task is named in the Timings track.

| What | trace.cafe | File |
| --- | --- | --- |
| A11yConf Travel, 14-step keyboard task, accessibility on: legacy (React, MUI and others) | [Open](https://trace.cafe/t/VoRFo6QOSY) | `bench/traces/travel/travel-legacy-a11y-on-run3-task.json.gz` |
| The same task: native HTML | [Open](https://trace.cafe/t/XLPHjpSGiI) | `bench/traces/travel/travel-native-a11y-on-run2-task.json.gz` |
| Keyboard focus on one control, 5 s without touching anything, reduced motion requested: legacy (the MUI focus ripple keeps animating) | [Open](https://trace.cafe/t/ihrNliptjB) | `bench/traces/focus-idle/travel-legacy.json.gz` |
| The same: native HTML | [Open](https://trace.cafe/t/J5PZ7aWCIg) | `bench/traces/focus-idle/travel-native.json.gz` |
| mui.com radio button docs, 5 s idle with reduced motion: 20 "Edit in Chat" buttons animate without end | [Open](https://trace.cafe/t/rU5JSwqmGV) | `bench/traces/demos/mui-docs-radio-idle-reduced-motion.json.gz` |
| renfe.com loading on a mid-range phone (emulated Pixel 7, Slow 4G, CPU 4x) | [Open](https://trace.cafe/t/HJIoDNe5hJ) | `bench/traces/demos/renfe-mobile-slow4g-cpu4x.json.gz` |

## Using this repository

| Folder | What it holds | How to start |
| --- | --- | --- |
| `deck/` | The slides: HTML, CSS and a little JavaScript, no build step. In Spanish (`index.html`), English (`en/`) and Catalan (`ca/`), with light and dark themes and a visual or text view. Keyboard shortcuts and settings are in the help dialog (<kbd>?</kbd>): <kbd>G</kbd> switches the view, <kbd>T</kbd> the theme, <kbd>L</kbd> the language and <kbd>H</kbd> hides the controls bar; hold <kbd>Alt</kbd> for 2 seconds to see each button's key. | Published at <https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/>. Locally: `cd deck && npm start` and open <http://127.0.0.1:8000> (needs Python 3; any static server works). |
| `bench/` | The benchmark: the compared apps, the measurement scripts, the results and the traces for DevTools. | Requirements, setup, commands and dependencies in [bench/README.md](bench/README.md) (in Spanish). |
| `docs/` | References for the talk and pending tasks. | — |

To run the slide tests (navigation, notes, shortcuts, views, themes, languages, demos, no slide scrolling, and an axe audit of every slide in every language and both themes): `cd deck && npm ci && npm test`.

## Take part in the benchmark

From any browser, on a phone too and with your screen reader: **<https://nucliweb.github.io/el-arbol-de-accesibilidad-fragil/benchmark/>**, in English, Spanish or Catalan. If you use a screen reader, run it twice, with it off and on: the difference is what the accessibility tree costs your device. Nothing is sent unless you decide to; at the end you can share the results as a GitHub issue, like [this iPhone 16 Pro run with VoiceOver](https://github.com/nucliweb/el-arbol-de-accesibilidad-fragil/issues/1).

If you use the terminal, you can also run the full benchmark on your computer: in Chrome on any operating system and, optionally, with VoiceOver on macOS. The guide is in [bench/PARTICIPATE.md](bench/PARTICIPATE.md) ([en español](bench/PARTICIPA.md)).
