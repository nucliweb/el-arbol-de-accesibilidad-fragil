(() => {
  const STORAGE_KEY = 'settings.ringtone';
  const DEFAULT_RINGTONE = 'Calisto';
  const VALID_RINGTONES = ['Calisto', 'Ganímedes', 'Luna', 'Europa'];

  const form = document.getElementById('form-ajustes');
  const activeToneEl = document.getElementById('tono-activo');
  const statusEl = document.getElementById('estado-ajustes');
  const resetBtn = document.getElementById('btn-restablecer');
  const radios = Array.from(document.querySelectorAll('input[name="ringtone"]'));
  const previewButtons = Array.from(document.querySelectorAll('.preview-button'));

  // Melodías sintetizadas con Web Audio API (frecuencia en Hz, inicio y duración en segundos)
  const TONE_PATTERNS = {
    Calisto: {
      type: 'sine',
      notes: [
        { freq: 392.0, start: 0.0, duration: 0.35 },
        { freq: 493.88, start: 0.25, duration: 0.35 },
        { freq: 587.33, start: 0.5, duration: 0.55 },
      ],
    },
    'Ganímedes': {
      type: 'triangle',
      notes: [
        { freq: 440.0, start: 0.0, duration: 0.22 },
        { freq: 554.37, start: 0.2, duration: 0.22 },
        { freq: 659.25, start: 0.4, duration: 0.22 },
        { freq: 880.0, start: 0.6, duration: 0.45 },
      ],
    },
    Luna: {
      type: 'sine',
      notes: [
        { freq: 783.99, start: 0.0, duration: 0.45 },
        { freq: 659.25, start: 0.35, duration: 0.55 },
        { freq: 523.25, start: 0.75, duration: 0.6 },
      ],
    },
    Europa: {
      type: 'triangle',
      notes: [
        { freq: 587.33, start: 0.0, duration: 0.16 },
        { freq: 739.99, start: 0.18, duration: 0.16 },
        { freq: 880.0, start: 0.36, duration: 0.16 },
        { freq: 739.99, start: 0.56, duration: 0.16 },
        { freq: 987.77, start: 0.74, duration: 0.35 },
      ],
    },
  };

  let audioCtx = null;
  let activeNodes = [];
  let stopTimeoutId = null;
  let playingTone = null;

  function loadSavedTone() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_RINGTONES.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignorar errores de almacenamiento si está deshabilitado
    }
    return DEFAULT_RINGTONE;
  }

  function persistTone(tone) {
    try {
      window.localStorage.setItem(STORAGE_KEY, tone);
    } catch {
      // Ignorar errores de almacenamiento si está deshabilitado
    }
  }

  function getSelectedTone() {
    const checked = radios.find((radio) => radio.checked);
    return checked ? checked.value : DEFAULT_RINGTONE;
  }

  function setSelectedTone(tone) {
    radios.forEach((radio) => {
      radio.checked = radio.value === tone;
    });
  }

  function showStatus(message) {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-visible', Boolean(message));
  }

  function updatePreviewButtons() {
    previewButtons.forEach((btn) => {
      const tone = btn.dataset.tone;
      const isPlaying = playingTone === tone;
      btn.classList.toggle('is-playing', isPlaying);
      btn.setAttribute(
        'aria-label',
        isPlaying ? `Detener tono ${tone}` : `Escuchar tono ${tone}`
      );
      const label = btn.querySelector('.preview-label');
      if (label) {
        label.textContent = isPlaying ? 'Detener' : 'Probar';
      }
    });
  }

  function stopPreview() {
    if (stopTimeoutId !== null) {
      window.clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }

    activeNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // El oscilador ya pudo haber finalizado
      }
    });
    activeNodes = [];
    playingTone = null;
    updatePreviewButtons();
  }

  function playPreview(tone) {
    const pattern = TONE_PATTERNS[tone];
    if (!pattern) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showStatus(`Vista previa no disponible en este navegador para «${tone}».`);
      return;
    }

    stopPreview();

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    let totalDuration = 0;

    pattern.notes.forEach(({ freq, start, duration }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = pattern.type;
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);

      activeNodes.push({ osc, gain });
      totalDuration = Math.max(totalDuration, start + duration);
    });

    playingTone = tone;
    updatePreviewButtons();

    stopTimeoutId = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((totalDuration + 0.08) * 1000));
  }

  // Inicialización con el tono guardado
  const initialTone = loadSavedTone();
  setSelectedTone(initialTone);
  activeToneEl.textContent = initialTone;

  // Vista previa por cada tono
  previewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.tone;
      if (playingTone === tone) {
        stopPreview();
      } else {
        playPreview(tone);
      }
    });
  });

  // Guardar cambios
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selectedTone = getSelectedTone();
    persistTone(selectedTone);
    activeToneEl.textContent = selectedTone;
    showStatus(`Tono de llamada guardado: ${selectedTone}.`);
  });

  // Restablecer valor predeterminado
  resetBtn.addEventListener('click', () => {
    stopPreview();
    setSelectedTone(DEFAULT_RINGTONE);
    persistTone(DEFAULT_RINGTONE);
    activeToneEl.textContent = DEFAULT_RINGTONE;
    showStatus(`Tono de llamada restablecido a ${DEFAULT_RINGTONE}.`);
  });
})();
