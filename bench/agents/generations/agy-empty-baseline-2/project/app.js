(() => {
  const STORAGE_KEY = "settings.ringtone";

  const RINGTONES = {
    calisto: {
      name: "Calisto",
      type: "sine",
      notes: [
        { freq: 523.25, start: 0.0, duration: 0.24 },
        { freq: 659.25, start: 0.22, duration: 0.24 },
        { freq: 783.99, start: 0.44, duration: 0.28 },
        { freq: 987.77, start: 0.72, duration: 0.45 },
      ],
    },
    ganimedes: {
      name: "Ganímedes",
      type: "triangle",
      notes: [
        { freq: 440.0, start: 0.0, duration: 0.3 },
        { freq: 554.37, start: 0.28, duration: 0.3 },
        { freq: 659.25, start: 0.56, duration: 0.3 },
        { freq: 880.0, start: 0.84, duration: 0.5 },
      ],
    },
    luna: {
      name: "Luna",
      type: "sine",
      notes: [
        { freq: 587.33, start: 0.0, duration: 0.35 },
        { freq: 440.0, start: 0.34, duration: 0.32 },
        { freq: 739.99, start: 0.66, duration: 0.36 },
        { freq: 587.33, start: 1.0, duration: 0.48 },
      ],
    },
    europa: {
      name: "Europa",
      type: "triangle",
      notes: [
        { freq: 659.25, start: 0.0, duration: 0.18 },
        { freq: 987.77, start: 0.18, duration: 0.2 },
        { freq: 830.61, start: 0.38, duration: 0.22 },
        { freq: 1318.51, start: 0.62, duration: 0.45 },
      ],
    },
  };

  const form = document.getElementById("ringtone-form");
  const currentNameEl = document.getElementById("current-ringtone-name");
  const statusEl = document.getElementById("status-message");
  const previewButtons = Array.from(document.querySelectorAll(".preview-button"));

  let audioCtx = null;
  let activeNodes = [];
  let activeButton = null;
  let stopTimer = null;

  function getSavedRingtone() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && Object.prototype.hasOwnProperty.call(RINGTONES, saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors in restricted environments.
    }
    return "calisto";
  }

  function saveRingtone(id) {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }

  function getSelectedRingtone() {
    const checked = form.querySelector('input[name="ringtone"]:checked');
    return checked ? checked.value : "calisto";
  }

  function updatePreviewButtonState(button, isPlaying) {
    const id = button.dataset.ringtone;
    const toneName = RINGTONES[id]?.name ?? id;
    const textEl = button.querySelector(".preview-text");

    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute(
      "aria-label",
      isPlaying ? `Detener vista previa de ${toneName}` : `Escuchar tono ${toneName}`
    );
    if (textEl) {
      textEl.textContent = isPlaying ? "Detener" : "Escuchar";
    }
  }

  function stopPreview() {
    if (stopTimer !== null) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }

    for (const node of activeNodes) {
      try {
        node.stop();
      } catch {
        // Node may already have finished.
      }
      node.disconnect();
    }
    activeNodes = [];

    if (activeButton) {
      updatePreviewButtonState(activeButton, false);
      activeButton = null;
    }
  }

  function playPreview(id, button) {
    const tone = RINGTONES[id];
    if (!tone) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      statusEl.textContent = "Tu navegador no admite la reproducción de vistas previas.";
      return;
    }

    stopPreview();

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    let totalDuration = 0;

    for (const note of tone.notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = tone.type;
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      const startTime = now + note.start;
      const endTime = startTime + note.duration;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(endTime + 0.02);

      activeNodes.push(osc);
      totalDuration = Math.max(totalDuration, note.start + note.duration);
    }

    activeButton = button;
    updatePreviewButtonState(button, true);

    stopTimer = window.setTimeout(() => {
      stopPreview();
    }, Math.ceil((totalDuration + 0.08) * 1000));
  }

  // Initialize from saved preference
  const initialRingtone = getSavedRingtone();
  const initialInput = form.querySelector(`input[name="ringtone"][value="${initialRingtone}"]`);
  if (initialInput) {
    initialInput.checked = true;
  }
  currentNameEl.textContent = RINGTONES[initialRingtone].name;

  // Preview buttons
  for (const button of previewButtons) {
    button.addEventListener("click", () => {
      const id = button.dataset.ringtone;
      if (activeButton === button) {
        stopPreview();
      } else {
        playPreview(id, button);
      }
    });
  }

  // Clear saved status when user picks another option
  form.addEventListener("change", () => {
    statusEl.textContent = "";
  });

  // Save preference on form submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedId = getSelectedRingtone();
    const toneName = RINGTONES[selectedId].name;

    saveRingtone(selectedId);
    currentNameEl.textContent = toneName;
    statusEl.textContent = `Tono de llamada guardado: ${toneName}.`;
  });

  window.addEventListener("pagehide", stopPreview);
})();
