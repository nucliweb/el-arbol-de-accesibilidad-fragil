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
      language: 'Español.',
    },
    en: {
      slide: (n, total, title) => `Slide ${n} of ${total}: ${title}`,
      slideCount: (total) => `${total} slides`,
      notesOn: 'Notes shown',
      notesOff: 'Notes hidden',
      documentMode: 'Document mode: every slide on a single page',
      presentationMode: 'Presentation mode.',
      theme: { system: 'System theme', light: 'Light theme', dark: 'Dark theme' },
      language: 'English.',
    },
    ca: {
      slide: (n, total, title) => `Diapositiva ${n} de ${total}: ${title}`,
      slideCount: (total) => `${total} diapositives`,
      notesOn: 'Notes visibles',
      notesOff: 'Notes amagades',
      documentMode: 'Mode document: totes les diapositives en una sola pàgina',
      presentationMode: 'Mode presentació.',
      theme: { system: 'Tema del sistema', light: 'Tema clar', dark: 'Tema fosc' },
      language: 'Català.',
    },
  };
  const t = MESSAGES[root.lang] ?? MESSAGES.es;

  // Preferences survive reloads. Storage can be unavailable (private modes),
  // in which case the defaults simply apply.
  const STORAGE_KEY = 'deck-preferences';
  const preferences = { notes: false, documentMode: false, singleKeyShortcuts: true, theme: 'system' };
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
    updateScrollFocus();
  };

  const goTo = (index, { announceIt = true } = {}) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    if (target === current && announceIt) return;
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
    if (isTyping(event.target)) return;

    if (!preferences.documentMode) {
      const onButton = event.target.closest('button, a, summary');
      const actions = {
        ArrowRight: () => goTo(current + 1),
        ArrowDown: () => goTo(current + 1),
        PageDown: () => goTo(current + 1),
        ArrowLeft: () => goTo(current - 1),
        ArrowUp: () => goTo(current - 1),
        PageUp: () => goTo(current - 1),
        Home: () => goTo(0),
        End: () => goTo(slides.length - 1),
      };
      // Space activates a focused button or link; only use it to advance otherwise.
      if (!onButton) actions[' '] = () => goTo(current + 1);
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
      l: nextLanguage,
      L: nextLanguage,
      '?': openHelp,
    };
    if (shortcuts[event.key]) {
      event.preventDefault();
      shortcuts[event.key]();
    }
  });

  prevButton.addEventListener('click', () => goTo(current - 1));
  nextButton.addEventListener('click', () => goTo(current + 1));
  notesButton.addEventListener('click', toggleNotes);
  documentButton.addEventListener('click', toggleDocumentMode);
  helpButton.addEventListener('click', openHelp);
  for (const radio of themeRadios) radio.addEventListener('change', () => setTheme(radio.value));
  for (const link of languageLinks) link.addEventListener('click', markLanguageSwitch);
  shortcutsCheckbox.addEventListener('change', () => {
    preferences.singleKeyShortcuts = shortcutsCheckbox.checked;
    savePreferences();
  });
  window.addEventListener('hashchange', () => goTo(indexFromHash()));
  window.addEventListener('resize', updateScrollFocus);
  // A lazy image can make a slide taller after it is shown; load does not
  // bubble, so listen in the capture phase.
  document.addEventListener('load', (event) => {
    if (event.target instanceof HTMLImageElement) updateScrollFocus();
  }, true);

  // Switch from document to presentation.
  root.classList.add('js');
  controls.hidden = false;
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
