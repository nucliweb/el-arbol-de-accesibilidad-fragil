(() => {
  const STORAGE_KEY = "settings.ringtone";
  const VALID_TONES = ["Calisto", "Ganímedes", "Luna", "Europa"];

  const TONE_PATTERNS = {
    Calisto: {
      wave: "sine",
      notes: [
        { freq: 523.25, start: 0.0, duration: 0.25 },
        { freq: 659.25, start: 0.22, duration: 0.25 },
        { freq: 783.99, start: 0.44, duration: 0.45 },
      ],
    },
    Ganímedes: {
      wave: "triangle",
      notes: [
        { freq: 392.0, start: 0.0, duration: 0.16 },
        { freq: 493.88, start: 0.18, duration: 0.16 },
        { freq: 587.33, start: 0.36, duration: 0.22 },
        { freq: 493.88, start: 0.62, duration: 0.28 },
      ],
    },
    Luna: {
      wave: "sine",
      notes: [
        { freq: 440.0, start: 0.0, duration: 0.32 },
        { freq: 554.37, start: 0.32, duration: 0.32 },
        { freq: 659.25, start: 0.64, duration: 0.45 },
      ],
    },
    Europa: {
      wave: "sine",
      notes: [
        { freq: 880.0, start: 0.0, duration: 0.18 },
        { freq: 1046.5, start: 0.18, duration: 0.18 },
        { freq: 1318.51, start: 0.36, duration: 0.28 },
        { freq: 1046.5, start: 0.66, duration: 0.32 },
      ],
    },
  };

  const form = document.getElementById("ringtone-form");
  const activeLabel = document.getElementById("active-ringtone-label");
  const statusMessage = document.getElementById("status-message");
  const previewButtons = Array.from(document.querySelectorAll(".preview-button"));
  const radioInputs = Array.from(
    document.querySelectorAll('input[name="ringtone"]')
  );

  let audioCtx = null;
  let activeNodes = [];
  let stopTimer = null;
  let playingTone = null;

  function loadSavedTone() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_TONES.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors in restricted environments.
    }
    return "Calisto";
  }

  function saveTone(tone) {
    try {
      window.localStorage.setItem(STORAGE_KEY, tone);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }

  function getSelectedTone() {
    const checked = radioInputs.find((input) => input.checked);
    return checked ? checked.value : "Calisto";
  }

  function setSelectedTone(tone) {
    radioInputs.forEach((input) => {
      input.checked = input.value === tone;
    });
    activeLabel.textContent = tone;
  }

  function updatePreviewButtons(currentTone) {
    previewButtons.forEach((button) => {
      const isPlaying = button.dataset.tone === currentTone;
      button.setAttribute("aria-pressed", String(isPlaying));
      button.setAttribute(
        "aria-label",
        isPlaying
          ? `Detener vista previa de ${button.dataset.tone}`
          : `Escuchar vista previa de ${button.dataset.tone}`
      );
      const icon = button.querySelector(".preview-icon");
      const text = button.querySelector(".preview-text");
      if (icon) icon.textContent = isPlaying ? "■" : "▶";
      if (text) text.textContent = isPlaying ? "Detener" : "Probar";
    });
  }

  function stopPreview() {
    if (stopTimer) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }

    activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.value = 0;
        osc.stop();
      } catch {
        // Oscillator already stopped.
      }
    });

    activeNodes = [];
    playingTone = null;
    updatePreviewButtons(null);
  }

  function playPreview(tone) {
    if (playingTone === tone) {
      stopPreview();
      return;
    }

    stopPreview();

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      statusMessage.textContent =
        "Tu navegador no soporta la vista previa de audio.";
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const pattern = TONE_PATTERNS[tone];
    if (!pattern) return;

    playingTone = tone;
    updatePreviewButtons(tone);

    const now = audioCtx.currentTime;
    let maxEnd = 0;

    pattern.notes.forEach(({ freq, start, duration }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = pattern.wave;
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + start + duration
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);

      activeNodes.push({ osc, gain });
      maxEnd = Math.max(maxEnd, start + duration);
    });

    stopTimer = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((maxEnd + 0.08) * 1000));
  }

  previewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tone = button.dataset.tone;
      if (tone) {
        playPreview(tone);
      }
    });
  });

  radioInputs.forEach((input) => {
    input.addEventListener("change", () => {
      statusMessage.textContent = "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = getSelectedTone();
    saveTone(selected);
    activeLabel.textContent = selected;
    statusMessage.textContent = `Tono de llamada guardado: ${selected}.`;
  });

  const initialTone = loadSavedTone();
  setSelectedTone(initialTone);
})();
