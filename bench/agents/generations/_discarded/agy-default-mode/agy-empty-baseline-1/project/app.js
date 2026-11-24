(() => {
  const STORAGE_KEY_TONE = "settings.ringtone";
  const STORAGE_KEY_VOLUME = "settings.ringtoneVolume";

  const RINGTONES = {
    calisto: {
      name: "Calisto",
      wave: "sine",
      notes: [
        { freq: 523.25, start: 0.0, duration: 0.28 },
        { freq: 659.25, start: 0.24, duration: 0.28 },
        { freq: 783.99, start: 0.48, duration: 0.35 },
        { freq: 1046.5, start: 0.8, duration: 0.55 },
      ],
    },
    ganimedes: {
      name: "Ganímedes",
      wave: "triangle",
      notes: [
        { freq: 392.0, start: 0.0, duration: 0.4 },
        { freq: 493.88, start: 0.35, duration: 0.4 },
        { freq: 587.33, start: 0.7, duration: 0.4 },
        { freq: 493.88, start: 1.08, duration: 0.5 },
      ],
    },
    luna: {
      name: "Luna",
      wave: "sine",
      notes: [
        { freq: 880.0, start: 0.0, duration: 0.32 },
        { freq: 659.25, start: 0.32, duration: 0.36 },
        { freq: 783.99, start: 0.72, duration: 0.58 },
      ],
    },
    europa: {
      name: "Europa",
      wave: "triangle",
      notes: [
        { freq: 587.33, start: 0.0, duration: 0.18 },
        { freq: 739.99, start: 0.18, duration: 0.18 },
        { freq: 880.0, start: 0.36, duration: 0.18 },
        { freq: 1174.66, start: 0.54, duration: 0.34 },
        { freq: 880.0, start: 0.92, duration: 0.24 },
        { freq: 1174.66, start: 1.16, duration: 0.4 },
      ],
    },
  };

  const form = document.getElementById("ringtone-form");
  const currentLabel = document.getElementById("current-ringtone-label");
  const statusMessage = document.getElementById("status-message");
  const volumeInput = document.getElementById("ringtone-volume");
  const volumeOutput = document.getElementById("volume-output");
  const previewButtons = Array.from(document.querySelectorAll(".preview-btn"));

  let audioCtx = null;
  let activeNodes = [];
  let activeTimer = null;
  let activeToneKey = null;

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (e.g. private browsing restrictions)
    }
  }

  function getVolumeGain() {
    const percent = Number(volumeInput.value);
    return Math.max(0, Math.min(1, percent / 100)) * 0.35;
  }

  function updateVolumeUI(percent) {
    volumeOutput.textContent = `${percent} %`;
    volumeInput.setAttribute("aria-valuetext", `${percent} por ciento`);
  }

  function setButtonPlayingState(button, isPlaying) {
    const toneKey = button.dataset.preview;
    const toneName = RINGTONES[toneKey]?.name ?? toneKey;
    const labelSpan = button.querySelector(".preview-btn-text");

    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute(
      "aria-label",
      isPlaying
        ? `Detener vista previa de ${toneName}`
        : `Escuchar vista previa de ${toneName}`
    );

    if (labelSpan) {
      labelSpan.textContent = isPlaying ? "Detener" : "Escuchar";
    }
  }

  function stopPreview() {
    if (activeTimer !== null) {
      window.clearTimeout(activeTimer);
      activeTimer = null;
    }

    for (const node of activeNodes) {
      try {
        node.stop();
      } catch {
        // Node may already have stopped
      }
      try {
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    activeNodes = [];

    if (activeToneKey) {
      const previousBtn = previewButtons.find(
        (btn) => btn.dataset.preview === activeToneKey
      );
      if (previousBtn) {
        setButtonPlayingState(previousBtn, false);
      }
      activeToneKey = null;
    }
  }

  function playPreview(toneKey, button) {
    const tone = RINGTONES[toneKey];
    if (!tone) return;

    if (activeToneKey === toneKey) {
      stopPreview();
      statusMessage.textContent = `Vista previa de ${tone.name} detenida.`;
      return;
    }

    stopPreview();

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      statusMessage.textContent = "Tu navegador no admite la reproducción de vista previa.";
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const baseTime = audioCtx.currentTime + 0.02;
    const peakGain = getVolumeGain();
    let totalDuration = 0;

    for (const note of tone.notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = tone.wave;
      osc.frequency.setValueAtTime(note.freq, baseTime + note.start);

      const startAt = baseTime + note.start;
      const endAt = startAt + note.duration;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, peakGain),
        startAt + 0.025
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startAt);
      osc.stop(endAt + 0.02);

      activeNodes.push(osc);
      totalDuration = Math.max(totalDuration, note.start + note.duration);
    }

    activeToneKey = toneKey;
    setButtonPlayingState(button, true);
    statusMessage.textContent = `Reproduciendo vista previa de ${tone.name}.`;

    activeTimer = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((totalDuration + 0.08) * 1000));
  }

  function applySelectedTone(toneKey, announce = true) {
    const tone = RINGTONES[toneKey];
    if (!tone) return;

    const radio = form.querySelector(`input[name="ringtone"][value="${toneKey}"]`);
    if (radio) {
      radio.checked = true;
    }

    currentLabel.textContent = tone.name;
    safeStorageSet(STORAGE_KEY_TONE, toneKey);

    if (announce) {
      statusMessage.textContent = `Tono de llamada guardado: ${tone.name}.`;
    } else {
      statusMessage.textContent = `Tono de llamada actual: ${tone.name}. Los cambios se guardan automáticamente.`;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === "ringtone") {
      applySelectedTone(target.value, true);
    }
  });

  volumeInput.addEventListener("input", () => {
    const value = Number(volumeInput.value);
    updateVolumeUI(value);
    safeStorageSet(STORAGE_KEY_VOLUME, String(value));
  });

  for (const button of previewButtons) {
    button.addEventListener("click", () => {
      const toneKey = button.dataset.preview;
      if (toneKey) {
        playPreview(toneKey, button);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeToneKey) {
      const toneName = RINGTONES[activeToneKey]?.name ?? activeToneKey;
      stopPreview();
      statusMessage.textContent = `Vista previa de ${toneName} detenida.`;
    }
  });

  // Restore saved preferences
  const savedVolume = safeStorageGet(STORAGE_KEY_VOLUME);
  if (savedVolume !== null && !Number.isNaN(Number(savedVolume))) {
    const clamped = Math.max(0, Math.min(100, Number(savedVolume)));
    volumeInput.value = String(clamped);
    updateVolumeUI(clamped);
  } else {
    updateVolumeUI(Number(volumeInput.value));
  }

  const savedTone = safeStorageGet(STORAGE_KEY_TONE);
  if (savedTone && Object.prototype.hasOwnProperty.call(RINGTONES, savedTone)) {
    applySelectedTone(savedTone, false);
  } else {
    applySelectedTone("calisto", false);
  }
})();
