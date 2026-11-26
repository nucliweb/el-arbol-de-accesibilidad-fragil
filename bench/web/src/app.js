// The browser version of the benchmark: runs every scenario in the visible
// test iframe, keeps each session (screen reader off or on) in
// sessionStorage, shows the medians as tables and prepares the report.
import { measure } from './lib/measure.js';
import { buildIssueUrl, buildWebReport, summarizeSession } from './lib/report.js';
import { REPETITIONS, SCENARIOS } from './scenarios.js';

const STORAGE_KEY = 'a11y-tree-bench-sessions';
const READY_TIMEOUT_MS = 60000;

const TEXT = {
  es: {},
  en: {
    pageTitle: 'Accessibility tree benchmark, in your browser',
    heading: 'How much does the accessibility tree cost your device?',
    intro1: 'This test compares the same page built with native HTML and with component libraries, and measures how long your browser stays blocked after each action: picking a radio button, filtering hotels, opening a detail view.',
    intro2: 'If you use a screen reader, the most useful test is to run it twice: once with the screen reader off and once with it on. The difference is what the accessibility tree costs your device.',
    beforeHeading: 'Before you start',
    before1: 'It takes about 2 minutes on a computer and a bit longer on a phone.',
    before2: 'Do not touch anything or switch tabs until it finishes: the test page receives clicks and the focus may move into it. Your screen reader may read parts of it; that is expected and part of what is measured.',
    before3: 'On a laptop or a phone, keep the charger plugged in if you can.',
    before4: 'Nothing is sent automatically: at the end you will see your results and decide whether to share them.',
    readerLegend: 'Is a screen reader running right now?',
    readerNone: 'No',
    readerNarrator: 'Narrator',
    readerOther: 'Other',
    deviceLabel: 'Which device are you using? (optional)',
    deviceHint: 'For example: mid-range Android phone from 2021, or Windows laptop from 2019.',
    start: 'Start the test',
    progressHeading: 'Measuring',
    progressLabel: 'Progress',
    testHeading: 'Test page',
    testHint: 'The measured pages load here. It stays visible because the browser only builds the accessibility tree of what is shown.',
    frameTitle: 'Test page, controlled by the test',
    resultsHeading: 'Your results',
    resultsHint: 'Time, in milliseconds, that the browser stayed blocked after each step (median of 3 repetitions). Lower is better.',
    shareHeading: 'Share the results',
    shareHint: 'The link opens the repository form on GitHub with your results already filled in; you need a GitHub account. If you prefer another way, copy the report or download the data.',
    shareLink: 'Send to GitHub',
    copyReport: 'Copy the report',
    downloadData: 'Download the data',
    clearResults: 'Clear my results',
    footer: 'Part of the talk "El árbol de accesibilidad frágil" (A11y Conf 2026). Code, method and data on',
  },
};
const UI = {
  es: {
    measuring: (target, step, rep) => `Midiendo ${target}: ${step}, repetición ${rep} de ${REPETITIONS}.`,
    load: 'Carga',
    done: 'Prueba terminada. Los resultados están más abajo.',
    interrupted: 'La pestaña dejó de estar visible durante la prueba: los resultados pueden no ser fiables. Puedes repetirla.',
    failed: (message) => `La prueba se detuvo por un error: ${message}`,
    session: (reader) => (reader === 'none' ? 'Sin lector de pantalla' : `Con ${reader}`),
    difference: (reader) => `Diferencia con ${reader} (con lector menos sin lector)`,
    step: 'Paso',
    elements: 'Elementos de la página',
    nextRun: (reader) =>
      reader === 'none'
        ? 'Si usas un lector de pantalla, enciéndelo, elige cuál es arriba y repite la prueba para ver la diferencia.'
        : 'Si aún no lo has hecho, apaga el lector, marca «No» arriba y repite la prueba para ver la diferencia.',
    copied: 'Informe copiado.',
    copyFailed: 'No se pudo copiar. Descarga los datos en su lugar.',
    cleared: 'Resultados borrados.',
    unknownDevice: 'dispositivo sin indicar',
  },
  en: {
    measuring: (target, step, rep) => `Measuring ${target}: ${step}, repetition ${rep} of ${REPETITIONS}.`,
    load: 'Load',
    done: 'Test finished. The results are below.',
    interrupted: 'The tab was hidden during the test: the results may not be reliable. You can run it again.',
    failed: (message) => `The test stopped because of an error: ${message}`,
    session: (reader) => (reader === 'none' ? 'Without a screen reader' : `With ${reader}`),
    difference: (reader) => `Difference with ${reader} (with minus without the screen reader)`,
    step: 'Step',
    elements: 'Page elements',
    nextRun: (reader) =>
      reader === 'none'
        ? 'If you use a screen reader, turn it on, choose it above and run the test again to see the difference.'
        : 'If you have not done it yet, turn the screen reader off, choose "No" above and run the test again to see the difference.',
    copied: 'Report copied.',
    copyFailed: 'Could not copy. Download the data instead.',
    cleared: 'Results cleared.',
    unknownDevice: 'unspecified device',
  },
};

const params = new URLSearchParams(location.search);
const lang = params.get('lang') === 'en' || (!params.get('lang') && !navigator.language.startsWith('es')) ? 'en' : 'es';
const ui = UI[lang];
const $ = (selector) => document.querySelector(selector);

function applyLanguage() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const text = TEXT[lang][el.dataset.i18n];
    if (text) el.textContent = text;
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    const text = TEXT[lang][el.dataset.i18nTitle];
    if (text) el.title = text;
  }
  const link = $('#language-link');
  const other = lang === 'es' ? 'en' : 'es';
  link.href = `?lang=${other}`;
  link.lang = other;
  link.hreflang = other;
  link.textContent = other === 'en' ? 'English' : 'Español';
}

const announce = (message) => {
  $('#announcer').textContent = '';
  setTimeout(() => {
    $('#announcer').textContent = message;
  }, 100);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadSessions = () => JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
const saveSessions = (sessions) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

function environment() {
  const data = navigator.userAgentData;
  return {
    userAgent: navigator.userAgent,
    platform: data?.platform ?? navigator.platform,
    mobile: data?.mobile ?? /Mobi|Android/i.test(navigator.userAgent),
    cpuCores: navigator.hardwareConcurrency ?? 'unknown',
    memoryGB: navigator.deviceMemory ?? 'unknown',
  };
}

// Loads a page into the iframe and resolves when it has rendered: the load
// event, and for the React apps their own "bench:rendered" mark.
function loadInto(frame, url, marksRendered) {
  return new Promise((resolve, reject) => {
    frame.addEventListener(
      'load',
      async () => {
        const started = performance.now();
        while (marksRendered && !frame.contentWindow.performance.getEntriesByName('bench:rendered').length) {
          if (performance.now() - started > READY_TIMEOUT_MS) {
            reject(new Error(`${url} did not render`));
            return;
          }
          await new Promise((r) => requestAnimationFrame(r));
        }
        resolve();
      },
      { once: true },
    );
    frame.src = url;
  });
}

async function runTest() {
  const frame = $('#test-frame');
  const samples = [];
  const total = REPETITIONS * SCENARIOS.reduce((n, s) => n + s.targets.length * (s.steps.length + 1), 0);
  let done = 0;
  const progress = (target, step, rep) => {
    $('#progress').value = done / total;
    $('#progress-text').textContent = ui.measuring(target.label[lang], step, rep);
  };

  for (let rep = 1; rep <= REPETITIONS; rep += 1) {
    for (const scenario of SCENARIOS) {
      for (const target of scenario.targets) {
        progress(target, ui.load, rep);
        const load = await measure(() => loadInto(frame, target.path, target.marksRendered));
        const elements = frame.contentDocument.body.getElementsByTagName('*').length;
        samples.push({ scenario: scenario.id, target: target.id, step: 'load', rep, ...load, elements });
        done += 1;
        await sleep(300);
        for (const step of scenario.steps) {
          progress(target, step.name[lang], rep);
          const result = await measure(() => step.run(frame.contentDocument));
          samples.push({ scenario: scenario.id, target: target.id, step: step.id, rep, ...result });
          done += 1;
          await sleep(200);
        }
      }
    }
  }
  $('#progress').value = 1;
  frame.src = 'about:blank';
  return samples;
}

function labels() {
  const result = { scenarios: {}, targets: {}, steps: { load: ui.load } };
  for (const scenario of SCENARIOS) {
    result.scenarios[scenario.id] = scenario.title[lang];
    for (const target of scenario.targets) result.targets[target.id] = target.label[lang];
    for (const step of scenario.steps) result.steps[step.id] = step.name[lang];
  }
  return result;
}

function table(caption, scenario, cell) {
  const el = document.createElement('table');
  const cap = el.createCaption();
  cap.textContent = caption;
  const head = el.createTHead().insertRow();
  const corner = document.createElement('th');
  corner.scope = 'col';
  corner.textContent = ui.step;
  head.append(corner);
  for (const target of scenario.targets) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = 'num';
    th.textContent = target.label[lang];
    head.append(th);
  }
  const body = el.createTBody();
  for (const step of [{ id: 'load', name: { [lang]: ui.load } }, ...scenario.steps]) {
    const row = body.insertRow();
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = step.name[lang];
    row.append(th);
    for (const target of scenario.targets) {
      const td = row.insertCell();
      td.className = 'num';
      td.textContent = cell(target.id, step.id);
    }
  }
  return el;
}

const ms = (value) => (value === null || value === undefined ? '–' : String(Math.round(value)));

function renderResults(sessions) {
  const container = $('#results');
  container.replaceChildren();
  for (const session of sessions) {
    const heading = document.createElement('h3');
    heading.textContent = `${ui.session(session.screenReader)} · ${session.device}`;
    container.append(heading);
    if (session.interrupted) {
      const warning = document.createElement('p');
      warning.textContent = ui.interrupted;
      container.append(warning);
    }
    for (const scenario of SCENARIOS) {
      const data = session.summary[scenario.id] ?? {};
      container.append(table(scenario.title[lang], scenario, (target, step) => ms(data[target]?.[step]?.blockedMs)));
    }
  }
  const without = sessions.find((s) => s.screenReader === 'none');
  for (const withReader of sessions.filter((s) => s.screenReader !== 'none')) {
    if (!without) break;
    const heading = document.createElement('h3');
    heading.textContent = ui.difference(withReader.screenReader);
    container.append(heading);
    for (const scenario of SCENARIOS) {
      container.append(
        table(scenario.title[lang], scenario, (target, step) => {
          const a = withReader.summary[scenario.id]?.[target]?.[step]?.blockedMs;
          const b = without.summary[scenario.id]?.[target]?.[step]?.blockedMs;
          if (a == null || b == null) return '–';
          const diff = Math.round(a - b);
          return `${diff >= 0 ? '+' : ''}${diff}`;
        }),
      );
    }
  }
  const last = sessions.at(-1);
  if (last) {
    const next = document.createElement('p');
    next.textContent = ui.nextRun(last.screenReader);
    container.append(next);
  }

  const env = environment();
  const report = buildWebReport({
    environment: { device: last?.device ?? ui.unknownDevice, ...env },
    sessions,
    labels: labels(),
  });
  const raw = JSON.stringify({ schema: 1, kind: 'web', environment: env, sessions: sessions.map(({ samples, ...s }) => s) });
  $('#share-link').href = buildIssueUrl({ report, raw, device: last?.device ?? ui.unknownDevice });
  $('#copy-report').onclick = async () => {
    try {
      await navigator.clipboard.writeText(report);
      $('#action-status').textContent = ui.copied;
    } catch {
      $('#action-status').textContent = ui.copyFailed;
    }
  };
  $('#download-data').onclick = () => {
    const blob = new Blob([JSON.stringify({ schema: 1, kind: 'web', environment: env, sessions }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `a11y-tree-bench-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  $('#results-section').hidden = sessions.length === 0;
}

applyLanguage();
renderResults(loadSessions());

$('#clear-results').addEventListener('click', () => {
  saveSessions([]);
  renderResults([]);
  $('#start').focus();
  announce(ui.cleared);
});

$('#setup').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const screenReader = form.get('reader');
  const device = String(form.get('device') ?? '').trim() || ui.unknownDevice;
  const start = $('#start');
  $('#progress-section').hidden = false;
  // Move focus before disabling the button, so it is never lost.
  $('#progress-heading').focus();
  start.disabled = true;
  let interrupted = false;
  const onHidden = () => {
    if (document.hidden) interrupted = true;
  };
  document.addEventListener('visibilitychange', onHidden);
  const wakeLock = await navigator.wakeLock?.request('screen').catch(() => null);
  try {
    const samples = await runTest();
    const sessions = [...loadSessions(), { screenReader, device, interrupted, createdAt: new Date().toISOString(), summary: summarizeSession(samples), samples }];
    saveSessions(sessions);
    renderResults(sessions);
    $('#progress-section').hidden = true;
    $('#results-heading').focus();
    announce(interrupted ? `${ui.done} ${ui.interrupted}` : ui.done);
  } catch (error) {
    $('#progress-text').textContent = ui.failed(error.message);
    announce(ui.failed(error.message));
  } finally {
    document.removeEventListener('visibilitychange', onHidden);
    await wakeLock?.release?.();
    start.disabled = false;
  }
});
