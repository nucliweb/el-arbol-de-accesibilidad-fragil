// Turns the document into a slide deck. Without this script the page is a
// plain, fully readable document: every slide and its notes are visible.
(() => {
  const root = document.documentElement;
  const slides = [...document.querySelectorAll('.slide')];
  const controls = document.querySelector('#deck-controls');
  const announcer = document.querySelector('#announcer');
  const counter = document.querySelector('#slide-counter');
  const prevButton = document.querySelector('#prev-slide');
  const nextButton = document.querySelector('#next-slide');
  const notesButton = document.querySelector('#toggle-notes');
  const documentButton = document.querySelector('#toggle-document');
  const helpButton = document.querySelector('#open-help');
  const help = document.querySelector('#help');
  const shortcutsCheckbox = document.querySelector('#single-key-shortcuts');
  const themeRadios = [...document.querySelectorAll('input[name="theme"]')];
  const viewRadios = [...document.querySelectorAll('input[name="view"]')];
  const viewButton = document.querySelector('#toggle-view');
  const languageLinks = [...document.querySelectorAll('#languages a[hreflang]')];
  const baseTitle = document.title;

  // Every message the script writes, in each language of the deck. The rest
  // of the interface is in the HTML of each translation.
  const MESSAGES = {
    es: {
      slide: (n, total, title) => `Diapositiva ${n} de ${total}: ${title}`,
      slideCount: (total) => `${total} diapositivas`,
      notesOn: 'Notas visibles',
      notesOff: 'Notas ocultas',
      documentMode: 'Modo documento: todas las diapositivas en una sola página',
      presentationMode: 'Modo presentación.',
      theme: { system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' },
      view: { visual: 'Vista visual', text: 'Vista de texto' },
      controlsHidden: 'Barra de controles oculta. Pulsa H para mostrarla.',
      controlsShown: 'Barra de controles visible',
      language: 'Español.',
      altShown: 'Texto alternativo visible',
      altHidden: 'Texto alternativo oculto',
    },
    en: {
      slide: (n, total, title) => `Slide ${n} of ${total}: ${title}`,
      slideCount: (total) => `${total} slides`,
      notesOn: 'Notes shown',
      notesOff: 'Notes hidden',
      documentMode: 'Document mode: every slide on a single page',
      presentationMode: 'Presentation mode.',
      theme: { system: 'System theme', light: 'Light theme', dark: 'Dark theme' },
      view: { visual: 'Visual view', text: 'Text view' },
      controlsHidden: 'Controls bar hidden. Press H to show it.',
      controlsShown: 'Controls bar shown',
      language: 'English.',
      altShown: 'Alt text shown',
      altHidden: 'Alt text hidden',
    },
    ca: {
      slide: (n, total, title) => `Diapositiva ${n} de ${total}: ${title}`,
      slideCount: (total) => `${total} diapositives`,
      notesOn: 'Notes visibles',
      notesOff: 'Notes amagades',
      documentMode: 'Mode document: totes les diapositives en una sola pàgina',
      presentationMode: 'Mode presentació.',
      theme: { system: 'Tema del sistema', light: 'Tema clar', dark: 'Tema fosc' },
      view: { visual: 'Vista visual', text: 'Vista de text' },
      controlsHidden: 'Barra de controls amagada. Prem H per mostrar-la.',
      controlsShown: 'Barra de controls visible',
      language: 'Català.',
      altShown: 'Text alternatiu visible',
      altHidden: 'Text alternatiu amagat',
    },
  };
  const t = MESSAGES[root.lang] ?? MESSAGES.es;

  // Preferences survive reloads. Storage can be unavailable (private modes),
  // in which case the defaults simply apply.
  const STORAGE_KEY = 'deck-preferences';
  const preferences = { notes: false, documentMode: false, singleKeyShortcuts: true, theme: 'system', view: 'visual', controlsHidden: false };
  try {
    Object.assign(preferences, JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {});
  } catch {}
  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
  };

  const titleOf = (slide) => slide.querySelector('h1, h2').textContent.trim();
  let current = 0;

  const announce = (message) => {
    // Clearing first makes screen readers announce repeated messages too.
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  };

  // A region that scrolls must be reachable with the keyboard (WCAG 2.1.1);
  // not every browser makes scroll containers focusable on its own.
  // The controls wrap onto more lines when zoomed; slides leave room for them.
  // With the bar hidden, slides take the whole height and the bar shows on
  // top of them only while it has focus or the pointer.
  const updateControlsHeight = () => {
    const height = preferences.controlsHidden ? 0 : controls.offsetHeight;
    root.style.setProperty('--controls-height', `${height}px`);
  };

  // Slides should fit the screen: shrink the visible slide's text in steps
  // until it does. The CSS keeps it at 1rem or more, so a zoomed-in page
  // scrolls instead of undoing the zoom.
  const MIN_FIT = 0.6;
  // Hidden build items keep their space, so a slide with a build is
  // measured as it will look with every item shown.
  const fitSlide = () => {
    const slide = slides[current];
    slide.style.removeProperty('--fit');
    if (preferences.documentMode || !slide.checkVisibility()) return;
    for (let fit = 0.95; fit >= MIN_FIT && slide.scrollHeight > slide.clientHeight + 1; fit -= 0.05) {
      slide.style.setProperty('--fit', fit.toFixed(2));
    }
  };

  const updateScrollFocus = () => {
    for (const element of document.querySelectorAll('.slide, .notes')) {
      const scrolls = element.checkVisibility() && element.scrollHeight > element.clientHeight + 1;
      if (scrolls) element.tabIndex = 0;
      else element.removeAttribute('tabindex');
    }
  };

  const render = () => {
    if (preferences.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = preferences.theme;
    for (const radio of themeRadios) radio.checked = radio.value === preferences.theme;
    root.dataset.view = preferences.view;
    root.dataset.controls = preferences.controlsHidden ? 'hidden' : 'visible';
    updateControlsHeight();
    for (const radio of viewRadios) radio.checked = radio.value === preferences.view;
    viewButton?.setAttribute('aria-pressed', String(preferences.view === 'text'));
    root.dataset.notes = preferences.notes ? 'visible' : 'hidden';
    root.dataset.mode = preferences.documentMode ? 'document' : 'slides';
    notesButton.setAttribute('aria-pressed', String(preferences.notes));
    documentButton.setAttribute('aria-pressed', String(preferences.documentMode));
    shortcutsCheckbox.checked = preferences.singleKeyShortcuts;

    slides.forEach((slide, index) => {
      slide.hidden = !preferences.documentMode && index !== current;
    });
    prevButton.disabled = preferences.documentMode || current === 0;
    nextButton.disabled = preferences.documentMode || current === slides.length - 1;
    counter.textContent = preferences.documentMode ? t.slideCount(slides.length) : `${current + 1} / ${slides.length}`;
    applyBuild();
    fitSlide();
    updateScrollFocus();
  };

  // Builds: in the visual view, the items of a [data-build] list appear one
  // per "next", like the builds of a slide app. "cumulative" keeps the earlier
  // items; "replace" shows one step at a time. step counts the items shown.
  let step = 0;
  const buildOf = (slide) => slide.querySelector('[data-build]');
  const buildsOn = () => !preferences.documentMode && preferences.view === 'visual';
  const firstStep = (list) => (list.dataset.build === 'replace' ? 1 : 0);
  const applyBuild = () => {
    for (const slide of slides) {
      const list = buildOf(slide);
      if (!list) continue;
      const live = buildsOn() && slide === slides[current];
      // visibility: hidden keeps each item's place, so the title and the
      // shown items never move, and still hides it from screen readers.
      [...list.children].forEach((item, i) => {
        item.toggleAttribute('data-build-hidden', live && (list.dataset.build === 'replace' ? i !== step - 1 : i >= step));
      });
    }
  };
  const itemMessage = (item) => {
    const heading = item.querySelector('h3');
    const summary = item.querySelector('.frame-summary');
    return heading ? `${cellText(heading)}. ${summary ? cellText(summary) : ''}`.trim() : cellText(item);
  };
  const next = () => {
    const list = buildOf(slides[current]);
    if (list && buildsOn() && step < list.children.length) {
      step += 1;
      applyBuild();
      announce(itemMessage(list.children[step - 1]));
      return;
    }
    goTo(current + 1, { entry: 'start' });
  };
  const previous = () => {
    const list = buildOf(slides[current]);
    if (list && buildsOn() && step > firstStep(list)) {
      step -= 1;
      applyBuild();
      const shown = list.children[step - 1];
      announce(shown ? itemMessage(shown) : slideMessage());
      return;
    }
    goTo(current - 1);
  };

  const goTo = (index, { announceIt = true, entry = 'end' } = {}) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    if (target === current && announceIt) return;
    const list = buildOf(slides[target]);
    step = list ? (entry === 'start' ? firstStep(list) : list.children.length) : 0;
    if (openDemo && target !== current) closeDemo();
    if (target !== current) hideAltText();
    const focusWasInSlide = slides[current].contains(document.activeElement);
    current = target;
    render();

    const slide = slides[current];
    history.replaceState(null, '', `#${slide.id}`);
    document.title = current === 0 ? baseTitle : `${titleOf(slide)} · ${baseTitle}`;
    if (focusWasInSlide) {
      // Never leave focus inside a slide that is now hidden.
      const heading = slide.querySelector('h1, h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    for (const link of languageLinks) link.hash = slide.id;
    if (announceIt) announce(slideMessage());
  };

  const slideMessage = () => t.slide(current + 1, slides.length, titleOf(slides[current]));

  const indexFromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    // The hash may point at an element inside a slide.
    const element = id ? document.getElementById(id) : null;
    const slide = element?.closest('.slide');
    return slide ? slides.indexOf(slide) : 0;
  };

  const toggleNotes = () => {
    preferences.notes = !preferences.notes;
    savePreferences();
    render();
    announce(preferences.notes ? t.notesOn : t.notesOff);
  };

  const toggleDocumentMode = () => {
    preferences.documentMode = !preferences.documentMode;
    savePreferences();
    render();
    if (preferences.documentMode) {
      slides[current].scrollIntoView();
      announce(t.documentMode);
    } else {
      announce(`${t.presentationMode} ${slideMessage()}`);
    }
  };

  const setTheme = (theme) => {
    preferences.theme = theme;
    savePreferences();
    render();
    announce(t.theme[theme]);
  };

  // T switches to the opposite of the theme on screen, whether it comes from
  // the system or from an earlier choice.
  const toggleTheme = () => {
    const dark =
      preferences.theme === 'dark' ||
      (preferences.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(dark ? 'light' : 'dark');
  };

  const setView = (view) => {
    const list = buildOf(slides[current]);
    if (list) step = list.children.length;
    preferences.view = view;
    savePreferences();
    render();
    announce(t.view[view]);
  };
  const toggleView = () => setView(preferences.view === 'text' ? 'visual' : 'text');

  const toggleControls = () => {
    preferences.controlsHidden = !preferences.controlsHidden;
    savePreferences();
    render();
    announce(preferences.controlsHidden ? t.controlsHidden : t.controlsShown);
  };

  // Charts for the visual view, drawn from the data tables. The table stays
  // in the page for screen readers (visually hidden in this view); the chart
  // only repeats it, so it is hidden from assistive technology. Each table
  // says how: data-chart="bars|columns|dots", data-chart-by="row" for one
  // panel per row (one per column otherwise), and the cells with data-value.
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const cellText = (cell) => cell.textContent.replace(/\s+/g, ' ').trim();
  const buildChart = (table) => {
    const type = table.dataset.chart;
    const headers = [...table.tHead.rows[0].cells];
    const rows = [...table.tBodies[0].rows];
    const withValue = (cell) => cell?.dataset.value !== undefined;
    const panels =
      table.dataset.chartBy === 'row'
        ? rows.map((row) => ({
            title: cellText(row.cells[0]),
            items: [...row.cells].filter(withValue).map((cell) => ({
              label: cellText(headers[cell.cellIndex]),
              cell,
              native: headers[cell.cellIndex].classList.contains('native'),
            })),
          }))
        : headers.slice(1).map((header) => ({
            title: cellText(header),
            items: rows
              .map((row) => row.cells[header.cellIndex])
              .filter(withValue)
              .map((cell) => ({ label: cellText(cell.parentElement.cells[0]), cell, native: cell.parentElement.classList.contains('native') })),
          }));

    const view = element('div', `chart-view chart-${type}`);
    view.setAttribute('aria-hidden', 'true');
    if (table.caption) view.append(element('p', 'chart-caption', cellText(table.caption)));
    const grid = element('div', 'chart-panels');
    view.append(grid);
    const dotsMax = Number(table.dataset.max ?? 0);
    for (const panel of panels.filter((p) => p.items.length)) {
      const max = Math.max(...panel.items.map(({ cell }) => Number(cell.dataset.value))) || 1;
      const box = element('div', 'chart-panel');
      if (panels.length > 1) box.append(element('p', 'chart-panel-title', panel.title));
      for (const { label, cell, native } of panel.items) {
        const value = Number(cell.dataset.value);
        const state = native || cell.classList.contains('good') ? ' is-good' : cell.classList.contains('bad') ? ' is-bad' : '';
        const item = element('div', `chart-item${state}`);
        item.style.setProperty('--share', String(value / max));
        const track = element('span', 'chart-track');
        if (type === 'dots') {
          for (let i = 0; i < dotsMax; i += 1) track.append(element('span', i < value ? 'chart-dot is-on' : 'chart-dot'));
        } else {
          track.append(element('span', 'chart-bar'));
        }
        item.append(element('span', 'chart-label', label), track, element('span', 'chart-value', cellText(cell)));
        box.append(item);
      }
      grid.append(box);
    }
    // The table moves into a wrapper that the visual view hides visually:
    // a table box does not shrink, a block does.
    const wrapper = element('div', 'chart-table');
    table.before(wrapper);
    wrapper.append(table);
    wrapper.after(view);
  };
  for (const table of document.querySelectorAll('table[data-chart]')) buildChart(table);

  // Live demos: the screenshot and its text alternative stay; the button
  // loads the trace in trace.cafe on top, hidden from assistive technology,
  // which keeps reading the screenshot's description.
  let openDemo = null;
  const closeDemo = () => {
    if (!openDemo) return;
    const { container, openButton } = openDemo;
    if (document.fullscreenElement) document.exitFullscreen();
    container.querySelector('iframe')?.remove();
    container.querySelector('.demo-controls')?.remove();
    container.classList.remove('is-open');
    for (const button of container.querySelectorAll('.demo-open')) {
      button.hidden = !(button.dataset.demoUrl || container.dataset.demoUrl);
    }
    openButton.focus();
    openDemo = null;
  };
  // Key hints: holding Alt (Option) alone for 2 s shows the key of every
  // button with a shortcut. They are only visual; screen readers get the
  // same information from aria-keyshortcuts.
  const KEY_LABELS = { ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc' };
  const addKeyHint = (button) => {
    const keys = button.getAttribute('aria-keyshortcuts');
    if (!keys || button.querySelector('.key-hint')) return;
    const hint = element('span', 'key-hint', KEY_LABELS[keys] ?? keys);
    hint.setAttribute('aria-hidden', 'true');
    button.append(hint);
  };
  for (const button of document.querySelectorAll('button[aria-keyshortcuts]')) addKeyHint(button);
  let hintTimer = null;
  const hideHints = () => {
    clearTimeout(hintTimer);
    hintTimer = null;
    delete root.dataset.hints;
  };
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Alt') {
      hideHints();
      return;
    }
    if (event.repeat || hintTimer || event.ctrlKey || event.metaKey || event.shiftKey) return;
    hintTimer = setTimeout(() => {
      root.dataset.hints = 'visible';
    }, 2000);
  });
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Alt') hideHints();
  });
  window.addEventListener('blur', hideHints);

  // Each "open" button loads its own trace (data-demo-url on the button, or
  // on its .demo container), so a slide can offer more than one.
  for (const openButton of document.querySelectorAll('.demo .demo-open')) {
    const container = openButton.closest('.demo');
    const url = openButton.dataset.demoUrl || container.dataset.demoUrl;
    if (!url) continue;
    openButton.hidden = false;
    openButton.addEventListener('click', () => {
      closeDemo();
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.title = openButton.dataset.frameTitle;
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'demo-close';
      closeButton.textContent = openButton.dataset.closeLabel;
      closeButton.addEventListener('click', closeDemo);
      closeButton.setAttribute('aria-keyshortcuts', 'Escape');
      // Fullscreen shows trace.cafe with its whole interface.
      const fullscreenButton = document.createElement('button');
      fullscreenButton.type = 'button';
      fullscreenButton.className = 'demo-fullscreen';
      fullscreenButton.textContent = openButton.dataset.fullscreenLabel;
      fullscreenButton.setAttribute('aria-pressed', 'false');
      fullscreenButton.setAttribute('aria-keyshortcuts', 'F');
      fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else container.requestFullscreen?.();
      });
      const controlsRow = document.createElement('p');
      controlsRow.className = 'demo-controls';
      controlsRow.append(closeButton, fullscreenButton);
      addKeyHint(closeButton);
      addKeyHint(fullscreenButton);
      // Above the demo, so the controls bar never covers them.
      container.append(controlsRow, frame);
      container.classList.add('is-open');
      for (const button of container.querySelectorAll('.demo-open')) button.hidden = true;
      openDemo = { container, openButton };
      closeButton.focus();
    });
  }

  // Demo keys: O opens a slide's only demo; on a slide with several, 1, 2…
  // open each one, and O the first. F toggles fullscreen on the open demo.
  const demoButtonsOf = (slide) =>
    [...slide.querySelectorAll('.demo .demo-open')].filter((button) => button.dataset.demoUrl || button.closest('.demo').dataset.demoUrl);
  for (const slide of slides) {
    const buttons = demoButtonsOf(slide);
    buttons.forEach((button, i) => {
      button.setAttribute('aria-keyshortcuts', buttons.length === 1 ? 'O' : String(i + 1));
      addKeyHint(button);
    });
  }
  const openDemoNumber = (n) => demoButtonsOf(slides[current])[n - 1]?.click();
  const toggleDemoFullscreen = () => openDemo?.container.querySelector('.demo-fullscreen')?.click();

  document.addEventListener('fullscreenchange', () => {
    for (const button of document.querySelectorAll('.demo-fullscreen')) {
      button.setAttribute('aria-pressed', String(document.fullscreenElement === button.closest('.demo')));
    }
  });

  // Alt text on screen: A shows, over each image marked data-reveal-alt in
  // the current slide, the text a screen reader reads for it. The copy is
  // taken from the alt, so it never drifts, and it is hidden from assistive
  // technology, which already reads the alt of the image.
  const altCopies = [...document.querySelectorAll('img[data-reveal-alt]')].map((img) => {
    const copy = element('p', 'alt-reveal', img.alt);
    copy.setAttribute('aria-hidden', 'true');
    copy.hidden = true;
    (img.closest('picture') ?? img).after(copy);
    return copy;
  });
  const altCopiesOf = (slide) => altCopies.filter((copy) => slide.contains(copy));
  const hideAltText = () => {
    for (const copy of altCopies) copy.hidden = true;
  };
  const toggleAltText = () => {
    const copies = altCopiesOf(slides[current]);
    if (!copies.length) return;
    const show = copies.every((copy) => copy.hidden);
    for (const copy of copies) copy.hidden = !show;
    fitSlide();
    announce(show ? t.altShown : t.altHidden);
  };

  // The language links in the settings, in their order, are the languages
  // of the deck; L opens the next one at the same slide. The flag lets the
  // new page announce where the person landed.
  const LANGUAGE_SWITCH_KEY = 'deck-language-switch';
  const markLanguageSwitch = () => {
    try {
      sessionStorage.setItem(LANGUAGE_SWITCH_KEY, '1');
    } catch {}
  };
  const nextLanguage = () => {
    const index = languageLinks.findIndex((link) => link.hreflang === root.lang);
    markLanguageSwitch();
    location.assign(languageLinks[(index + 1) % languageLinks.length].href);
  };

  let returnFocusTo = null;
  const openHelp = () => {
    returnFocusTo = document.activeElement;
    help.showModal();
  };
  help.addEventListener('close', () => {
    returnFocusTo?.focus();
  });

  const isTyping = (target) =>
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog') !== null;

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && openDemo) {
      event.preventDefault();
      closeDemo();
      return;
    }
    if (isTyping(event.target)) return;

    if (!preferences.documentMode) {
      const onButton = event.target.closest('button, a, summary');
      const actions = {
        ArrowRight: next,
        ArrowDown: next,
        PageDown: next,
        ArrowLeft: previous,
        ArrowUp: previous,
        PageUp: previous,
        Home: () => goTo(0),
        End: () => goTo(slides.length - 1),
      };
      // Space activates a focused button or link; only use it to advance otherwise.
      if (!onButton) actions[' '] = next;
      if (actions[event.key]) {
        event.preventDefault();
        actions[event.key]();
        return;
      }
    }

    if (!preferences.singleKeyShortcuts) return;
    const shortcuts = {
      n: toggleNotes,
      N: toggleNotes,
      d: toggleDocumentMode,
      D: toggleDocumentMode,
      t: toggleTheme,
      T: toggleTheme,
      g: toggleView,
      G: toggleView,
      h: toggleControls,
      H: toggleControls,
      l: nextLanguage,
      L: nextLanguage,
      o: () => openDemoNumber(1),
      O: () => openDemoNumber(1),
      ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), () => openDemoNumber(n)])),
      f: toggleDemoFullscreen,
      F: toggleDemoFullscreen,
      a: toggleAltText,
      A: toggleAltText,
      '?': openHelp,
    };
    if (shortcuts[event.key]) {
      event.preventDefault();
      shortcuts[event.key]();
    }
  });

  prevButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  notesButton.addEventListener('click', toggleNotes);
  documentButton.addEventListener('click', toggleDocumentMode);
  helpButton.addEventListener('click', openHelp);
  for (const radio of themeRadios) radio.addEventListener('change', () => setTheme(radio.value));
  for (const radio of viewRadios) radio.addEventListener('change', () => setView(radio.value));
  viewButton?.addEventListener('click', toggleView);
  for (const link of languageLinks) link.addEventListener('click', markLanguageSwitch);
  shortcutsCheckbox.addEventListener('change', () => {
    preferences.singleKeyShortcuts = shortcutsCheckbox.checked;
    savePreferences();
  });
  window.addEventListener('hashchange', () => goTo(indexFromHash()));
  window.addEventListener('resize', () => {
    updateControlsHeight();
    fitSlide();
    updateScrollFocus();
  });
  // A lazy image can make a slide taller after it is shown; load does not
  // bubble, so listen in the capture phase.
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement) {
      fitSlide();
      updateScrollFocus();
    }
  }, true);

  // Switch from document to presentation.
  root.classList.add('js');
  controls.hidden = false;
  updateControlsHeight();
  // Fonts, zoom and wrapping change the height of the bar.
  new ResizeObserver(() => {
    updateControlsHeight();
    fitSlide();
  }).observe(controls);
  current = indexFromHash();
  render();
  goTo(current, { announceIt: false });

  // After a language change the page reloads; say where the person landed.
  let switchedLanguage = false;
  try {
    switchedLanguage = sessionStorage.getItem(LANGUAGE_SWITCH_KEY) === '1';
    sessionStorage.removeItem(LANGUAGE_SWITCH_KEY);
  } catch {}
  if (switchedLanguage) announce(`${t.language} ${slideMessage()}`);
})();
