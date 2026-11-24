(() => {
  const STORAGE_KEY = 'settings:ringtone';

  const RINGTONES = {
    calisto: {
      label: 'Calisto',
      notes: [
        { freq: 523.25, duration: 0.28, gap: 0.06 }, // C5
        { freq: 659.25, duration: 0.28, gap: 0.06 }, // E5
        { freq: 783.99, duration: 0.42, gap: 0.12 }, // G5
        { freq: 659.25, duration: 0.45, gap: 0 },    // E5
      ],
      wave: 'sine',
    },
    ganimedes: {
      label: 'Ganímedes',
      notes: [
        { freq: 440.0, duration: 0.22, gap: 0.05 },  // A4
        { freq: 554.37, duration: 0.22, gap: 0.05 }, // C#5
        { freq: 659.25, duration: 0.26, gap: 0.05 }, // E5
        { freq: 880.0, duration: 0.5, gap: 0 },      // A5
      ],
      wave: 'triangle',
    },
    luna: {
      label: 'Luna',
      notes: [
        { freq: 587.33, duration: 0.2, gap: 0.06 },  // D5
        { freq: 739.99, duration: 0.2, gap: 0.06 },  // F#5
        { freq: 880.0, duration: 0.24, gap: 0.08 },  // A5
        { freq: 739.99, duration: 0.2, gap: 0.06 },  // F#5
        { freq: 1174.66, duration: 0.4, gap: 0 },    // D6
      ],
      wave: 'sine',
    },
    europa: {
      label: 'Europa',
      notes: [
        { freq: 493.88, duration: 0.24, gap: 0.05 }, // B4
        { freq: 622.25, duration: 0.24, gap: 0.05 }, // D#5
        { freq: 739.99, duration: 0.3, gap: 0.08 },  // F#5
        { freq: 987.77, duration: 0.48, gap: 0 },    // B5
      ],
      wave: 'triangle',
    },
  };

  const form = document.getElementById('ringtone-form');
  const activeNameEl = document.getElementById('active-ringtone-name');
  const statusEl = document.getElementById('save-status');
  const resetButton = document.getElementById('reset-button');
  const previewButtons = Array.from(document.querySelectorAll('.preview-button'));
  const radioInputs = Array.from(form.querySelectorAll('input[name="ringtone"]'));
  const optionRows = Array.from(form.querySelectorAll('.ringtone-option'));

  let savedRingtone = readStoredRingtone();
  let audioCtx = null;
  let activePreviewId = null;
  let activeStopTimer = null;
  let activeNodes = [];

  function readStoredRingtone() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && Object.hasOwn(RINGTONES, stored)) {
        return stored;
      }
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
    return 'calisto';
  }

  function persistRingtone(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore storage write errors in restricted browsing contexts.
    }
  }

  function getSelectedRingtone() {
    const checked = form.querySelector('input[name="ringtone"]:checked');
    return checked ? checked.value : savedRingtone;
  }

  function syncSelectedRowClasses() {
    const selected = getSelectedRingtone();
    for (const row of optionRows) {
      row.classList.toggle('is-selected', row.dataset.option === selected);
    }
  }

  function setStatus(message, withCheckmark = false) {
    statusEl.replaceChildren();
    if (!message) {
      return;
    }

    if (withCheckmark) {
      const icon = document.createElement('span');
      icon.className = 'status-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '✓';
      statusEl.append(icon);
    }

    const text = document.createElement('span');
    text.textContent = message;
    statusEl.append(text);
  }

  function syncSelectionFromSaved() {
    for (const input of radioInputs) {
      input.checked = input.value === savedRingtone;
    }
    activeNameEl.textContent = RINGTONES[savedRingtone].label;
    syncSelectedRowClasses();
    updateDirtyState();
  }

  function updateDirtyState() {
    const isDirty = getSelectedRingtone() !== savedRingtone;
    resetButton.hidden = !isDirty;
  }

  function stopPreview() {
    if (activeStopTimer !== null) {
      window.clearTimeout(activeStopTimer);
      activeStopTimer = null;
    }

    for (const node of activeNodes) {
      try {
        node.stop();
      } catch {
        // Oscillator already stopped.
      }
      node.disconnect();
    }
    activeNodes = [];

    for (const button of previewButtons) {
      button.dataset.playing = 'false';
      const labelSpan = button.querySelector('.preview-label');
      if (labelSpan) {
        labelSpan.textContent = 'Escuchar';
      }
    }

    activePreviewId = null;
  }

  function playPreview(id, button) {
    const wasPlayingSame = activePreviewId === id;
    stopPreview();

    if (wasPlayingSame) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setStatus(`Tu navegador no admite la vista previa de audio para ${RINGTONES[id].label}.`);
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const tone = RINGTONES[id];
    const startTime = audioCtx.currentTime + 0.02;
    let cursor = startTime;

    for (const note of tone.notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = tone.wave;
      osc.frequency.setValueAtTime(note.freq, cursor);

      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(0.18, cursor + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + note.duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(cursor);
      osc.stop(cursor + note.duration + 0.02);

      activeNodes.push(osc);
      cursor += note.duration + note.gap;
    }

    activePreviewId = id;
    button.dataset.playing = 'true';
    const labelSpan = button.querySelector('.preview-label');
    if (labelSpan) {
      labelSpan.textContent = 'Detener';
    }

    const totalMs = Math.ceil((cursor - startTime + 0.08) * 1000);
    activeStopTimer = window.setTimeout(() => {
      stopPreview();
    }, totalMs);
  }

  for (const button of previewButtons) {
    button.addEventListener('click', () => {
      const id = button.dataset.preview;
      if (id && Object.hasOwn(RINGTONES, id)) {
        playPreview(id, button);
      }
    });
  }

  form.addEventListener('change', () => {
    setStatus('');
    syncSelectedRowClasses();
    updateDirtyState();
  });

  resetButton.addEventListener('click', () => {
    stopPreview();
    syncSelectionFromSaved();
    const restoredInput = form.querySelector('input[name="ringtone"]:checked');
    if (restoredInput) {
      restoredInput.focus();
    }
    setStatus(`Selección restablecida a ${RINGTONES[savedRingtone].label}.`);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    stopPreview();

    const selected = getSelectedRingtone();
    if (!Object.hasOwn(RINGTONES, selected)) {
      return;
    }

    savedRingtone = selected;
    persistRingtone(savedRingtone);
    activeNameEl.textContent = RINGTONES[savedRingtone].label;
    syncSelectedRowClasses();
    updateDirtyState();
    setStatus(`Tono de llamada guardado: ${RINGTONES[savedRingtone].label}.`, true);
  });

  window.addEventListener('pagehide', stopPreview);

  syncSelectionFromSaved();
})();
