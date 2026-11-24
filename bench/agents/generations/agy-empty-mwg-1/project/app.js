(() => {
  'use strict';

  const STORAGE_KEY = 'settings:ringtone';

  const RINGTONES = {
    calisto: {
      label: 'Calisto',
      wave: 'sine',
      notes: [
        { freq: 523.25, duration: 0.22, delay: 0 },
        { freq: 659.25, duration: 0.22, delay: 0.24 },
        { freq: 783.99, duration: 0.36, delay: 0.48 },
        { freq: 659.25, duration: 0.22, delay: 0.92 },
        { freq: 1046.5, duration: 0.42, delay: 1.16 }
      ]
    },
    ganimedes: {
      label: 'Ganímedes',
      wave: 'triangle',
      notes: [
        { freq: 440.0, duration: 0.2, delay: 0 },
        { freq: 554.37, duration: 0.2, delay: 0.22 },
        { freq: 659.25, duration: 0.2, delay: 0.44 },
        { freq: 880.0, duration: 0.45, delay: 0.66 },
        { freq: 659.25, duration: 0.35, delay: 1.18 }
      ]
    },
    luna: {
      label: 'Luna',
      wave: 'sine',
      notes: [
        { freq: 392.0, duration: 0.32, delay: 0 },
        { freq: 493.88, duration: 0.32, delay: 0.35 },
        { freq: 587.33, duration: 0.36, delay: 0.7 },
        { freq: 783.99, duration: 0.5, delay: 1.1 }
      ]
    },
    europa: {
      label: 'Europa',
      wave: 'triangle',
      notes: [
        { freq: 587.33, duration: 0.16, delay: 0 },
        { freq: 739.99, duration: 0.16, delay: 0.18 },
        { freq: 880.0, duration: 0.28, delay: 0.36 },
        { freq: 739.99, duration: 0.16, delay: 0.72 },
        { freq: 880.0, duration: 0.16, delay: 0.9 },
        { freq: 1174.66, duration: 0.42, delay: 1.08 }
      ]
    }
  };

  const PLAY_ICON_PATH = 'M8 5v14l11-7z';
  const STOP_ICON_PATH = 'M6 6h12v12H6z';

  const form = document.getElementById('settings-form');
  const currentRingtoneEl = document.getElementById('current-ringtone');
  const statusBanner = document.getElementById('status-message');
  const statusText = document.getElementById('status-text');
  const previewButtons = Array.from(document.querySelectorAll('.preview-btn'));

  let audioCtx = null;
  let activeNodes = [];
  let stopTimerId = null;
  let activeButton = null;

  function loadSavedRingtone() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Object.prototype.hasOwnProperty.call(RINGTONES, saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
    return 'calisto';
  }

  function saveRingtone(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
  }

  function setButtonState(button, isPlaying) {
    button.setAttribute('aria-pressed', String(isPlaying));
    const textEl = button.querySelector('.preview-btn__text');
    const pathEl = button.querySelector('svg path');
    if (textEl) {
      textEl.textContent = isPlaying ? 'Detener' : 'Probar';
    }
    if (pathEl) {
      pathEl.setAttribute('d', isPlaying ? STOP_ICON_PATH : PLAY_ICON_PATH);
    }
  }

  function stopPreview() {
    if (stopTimerId !== null) {
      window.clearTimeout(stopTimerId);
      stopTimerId = null;
    }
    for (const node of activeNodes) {
      try {
        node.stop();
      } catch {
        // Oscillator may have already ended.
      }
      node.disconnect();
    }
    activeNodes = [];

    if (activeButton) {
      setButtonState(activeButton, false);
      activeButton = null;
    }
  }

  function playPreview(ringtoneId, button) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      announceStatus('Tu navegador no admite la previsualización de audio.');
      return;
    }

    const config = RINGTONES[ringtoneId];
    if (!config) return;

    const wasSameButton = activeButton === button;
    stopPreview();
    if (wasSameButton) return;

    if (!audioCtx) {
      audioCtx = new AudioContextCtor();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const startTime = audioCtx.currentTime + 0.02;
    let totalDuration = 0;

    for (const note of config.notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const noteStart = startTime + note.delay;
      const noteEnd = noteStart + note.duration;

      osc.type = config.wave;
      osc.frequency.setValueAtTime(note.freq, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd + 0.02);

      activeNodes.push(osc);
      totalDuration = Math.max(totalDuration, note.delay + note.duration);
    }

    activeButton = button;
    setButtonState(button, true);

    stopTimerId = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((totalDuration + 0.1) * 1000));
  }

  function announceStatus(message) {
    statusBanner.hidden = false;
    statusText.textContent = '';
    window.requestAnimationFrame(() => {
      statusText.textContent = message;
    });
  }

  // Initialize from saved preference
  const initialRingtone = loadSavedRingtone();
  const initialInput = form.querySelector(`input[name="ringtone"][value="${initialRingtone}"]`);
  if (initialInput) {
    initialInput.checked = true;
  }
  currentRingtoneEl.textContent = RINGTONES[initialRingtone].label;

  // Bind preview buttons
  for (const button of previewButtons) {
    button.addEventListener('click', () => {
      const ringtoneId = button.dataset.ringtone;
      playPreview(ringtoneId, button);
    });
  }

  // Handle explicit form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const selected = formData.get('ringtone');

    if (typeof selected !== 'string' || !Object.prototype.hasOwnProperty.call(RINGTONES, selected)) {
      return;
    }

    saveRingtone(selected);
    const ringtoneLabel = RINGTONES[selected].label;
    currentRingtoneEl.textContent = ringtoneLabel;
    announceStatus(`Tono de llamada guardado: ${ringtoneLabel}.`);
  });
})();
