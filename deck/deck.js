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
  const baseTitle = document.title;

  // Preferences survive reloads. Storage can be unavailable (private modes),
  // in which case the defaults simply apply.
  const STORAGE_KEY = 'deck-preferences';
  const preferences = { notes: false, documentMode: false, singleKeyShortcuts: true };
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
    counter.textContent = preferences.documentMode ? `${slides.length} diapositivas` : `${current + 1} / ${slides.length}`;
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
    if (announceIt) announce(`Diapositiva ${current + 1} de ${slides.length}: ${titleOf(slide)}`);
  };

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
    announce(preferences.notes ? 'Notas visibles' : 'Notas ocultas');
  };

  const toggleDocumentMode = () => {
    preferences.documentMode = !preferences.documentMode;
    savePreferences();
    render();
    if (preferences.documentMode) {
      slides[current].scrollIntoView();
      announce('Modo documento: todas las diapositivas en una sola página');
    } else {
      announce(`Modo presentación. Diapositiva ${current + 1} de ${slides.length}: ${titleOf(slides[current])}`);
    }
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
  shortcutsCheckbox.addEventListener('change', () => {
    preferences.singleKeyShortcuts = shortcutsCheckbox.checked;
    savePreferences();
  });
  window.addEventListener('hashchange', () => goTo(indexFromHash()));
  window.addEventListener('resize', updateScrollFocus);

  // Switch from document to presentation.
  root.classList.add('js');
  controls.hidden = false;
  current = indexFromHash();
  render();
  goTo(current, { announceIt: false });
})();
