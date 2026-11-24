(() => {
  const STORAGE_KEY = "settings.ringtonePreferences";
  const DEFAULT_SETTINGS = {
    ringtone: "Calisto",
    volume: 70,
  };

  const VALID_RINGTONES = ["Calisto", "Ganímedes", "Luna", "Europa"];

  const TONE_PATTERNS = {
    Calisto: {
      wave: "sine",
      notes: [
        { freq: 523.25, start: 0.0, duration: 0.32 },
        { freq: 659.25, start: 0.22, duration: 0.34 },
        { freq: 783.99, start: 0.44, duration: 0.48 },
        { freq: 659.25, start: 0.82, duration: 0.42 },
      ],
    },
    "Ganímedes": {
      wave: "triangle",
      notes: [
        { freq: 293.66, start: 0.0, duration: 0.28 },
        { freq: 349.23, start: 0.24, duration: 0.28 },
        { freq: 440.0, start: 0.48, duration: 0.42 },
        { freq: 392.0, start: 0.84, duration: 0.42 },
      ],
    },
    Luna: {
      wave: "sine",
      notes: [
        { freq: 587.33, start: 0.0, duration: 0.22 },
        { freq: 659.25, start: 0.18, duration: 0.22 },
        { freq: 783.99, start: 0.36, duration: 0.26 },
        { freq: 987.77, start: 0.56, duration: 0.48 },
      ],
    },
    Europa: {
      wave: "sine",
      notes: [
        { freq: 880.0, start: 0.0, duration: 0.18 },
        { freq: 783.99, start: 0.18, duration: 0.18 },
        { freq: 1046.5, start: 0.36, duration: 0.24 },
        { freq: 880.0, start: 0.62, duration: 0.18 },
        { freq: 1174.66, start: 0.8, duration: 0.42 },
      ],
    },
  };

  const form = document.getElementById("settings-form");
  const radioInputs = Array.from(document.querySelectorAll('input[name="ringtone"]'));
  const previewButtons = Array.from(document.querySelectorAll(".preview-btn"));
  const volumeInput = document.getElementById("ringtone-volume");
  const volumeOutput = document.getElementById("volume-output");
  const currentRingtoneEl = document.getElementById("current-ringtone");
  const statusBadgeEl = document.getElementById("status-badge");
  const liveStatusEl = document.getElementById("live-status");
  const resetButton = document.getElementById("reset-btn");

  let savedSettings = loadSettings();
  let audioCtx = null;
  let activeNodes = [];
  let stopTimerId = null;
  let activeTone = null;

  function loadSettings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      const ringtone = VALID_RINGTONES.includes(parsed.ringtone)
        ? parsed.ringtone
        : DEFAULT_SETTINGS.ringtone;
      const volume = Number.isFinite(Number(parsed.volume))
        ? Math.min(100, Math.max(0, Number(parsed.volume)))
        : DEFAULT_SETTINGS.volume;
      return { ringtone, volume };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignorar si el almacenamiento local no está disponible
    }
  }

  function getSelectedRingtone() {
    const checked = radioInputs.find((input) => input.checked);
    return checked ? checked.value : DEFAULT_SETTINGS.ringtone;
  }

  function getCurrentFormSettings() {
    return {
      ringtone: getSelectedRingtone(),
      volume: Number(volumeInput.value),
    };
  }

  function hasUnsavedChanges() {
    const current = getCurrentFormSettings();
    return (
      current.ringtone !== savedSettings.ringtone ||
      current.volume !== savedSettings.volume
    );
  }

  function updateUI() {
    const selected = getSelectedRingtone();
    currentRingtoneEl.textContent = selected;
    volumeOutput.textContent = `${volumeInput.value} %`;

    radioInputs.forEach((input) => {
      const row = input.closest(".ringtone-row");
      if (row) {
        row.classList.toggle("is-selected", input.checked);
      }
    });

    const unsaved = hasUnsavedChanges();
    statusBadgeEl.textContent = unsaved ? "Sin guardar" : "Guardado";
    statusBadgeEl.classList.toggle("is-unsaved", unsaved);
  }

  function applySettingsToForm(settings) {
    radioInputs.forEach((input) => {
      input.checked = input.value === settings.ringtone;
    });
    volumeInput.value = String(settings.volume);
    updateUI();
  }

  function announce(message) {
    liveStatusEl.textContent = "";
    window.requestAnimationFrame(() => {
      liveStatusEl.textContent = message;
    });
  }

  function resetPreviewButtons() {
    previewButtons.forEach((btn) => {
      const tone = btn.dataset.tone;
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", `Reproducir vista previa de ${tone}`);
      const textEl = btn.querySelector(".preview-btn-text");
      if (textEl) textEl.textContent = "Probar";
    });
  }

  function stopPreview() {
    if (stopTimerId !== null) {
      window.clearTimeout(stopTimerId);
      stopTimerId = null;
    }

    activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.setValueAtTime(0, audioCtx ? audioCtx.currentTime : 0);
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // El oscilador ya terminó
      }
    });

    activeNodes = [];
    activeTone = null;
    resetPreviewButtons();
  }

  async function playPreview(tone, triggerButton) {
    if (activeTone === tone) {
      stopPreview();
      announce(`Vista previa de ${tone} detenida.`);
      return;
    }

    stopPreview();

    const pattern = TONE_PATTERNS[tone];
    if (!pattern) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      announce("Tu navegador no admite la reproducción de audio.");
      return;
    }

    const volumeLevel = Number(volumeInput.value) / 100;
    if (volumeLevel === 0) {
      announce("El volumen está silenciado (0 %). Sube el volumen para escuchar el tono.");
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const peakGain = 0.25 * volumeLevel;
    let totalDuration = 0;

    pattern.notes.forEach(({ freq, start, duration }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = pattern.wave;
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);

      activeNodes.push({ osc, gain });
      totalDuration = Math.max(totalDuration, start + duration);
    });

    activeTone = tone;
    triggerButton.setAttribute("aria-pressed", "true");
    triggerButton.setAttribute("aria-label", `Detener vista previa de ${tone}`);
    const textEl = triggerButton.querySelector(".preview-btn-text");
    if (textEl) textEl.textContent = "Detener";

    announce(`Reproduciendo vista previa de ${tone}.`);

    stopTimerId = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((totalDuration + 0.08) * 1000));
  }

  radioInputs.forEach((input) => {
    input.addEventListener("change", () => {
      updateUI();
      announce(`Tono seleccionado: ${input.value}. Pulsa Guardar cambios para confirmar.`);
    });
  });

  volumeInput.addEventListener("input", () => {
    updateUI();
  });

  previewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playPreview(button.dataset.tone, button);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    savedSettings = getCurrentFormSettings();
    saveSettings(savedSettings);
    updateUI();
    announce(
      `Ajustes guardados. Tono de llamada: ${savedSettings.ringtone}, volumen: ${savedSettings.volume} %.`
    );
  });

  resetButton.addEventListener("click", () => {
    stopPreview();
    savedSettings = { ...DEFAULT_SETTINGS };
    saveSettings(savedSettings);
    applySettingsToForm(savedSettings);
    announce(`Ajustes restablecidos al tono predeterminado: ${DEFAULT_SETTINGS.ringtone}.`);
  });

  applySettingsToForm(savedSettings);
})();
