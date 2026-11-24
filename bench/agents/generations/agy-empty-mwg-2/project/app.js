const STORAGE_KEY = "settings.ringtone";

const RINGTONES = {
  calisto: {
    label: "Calisto",
    notes: [523.25, 659.25, 783.99, 1046.5],
    wave: "sine",
    stepSeconds: 0.18,
  },
  ganimedes: {
    label: "Ganímedes",
    notes: [440, 554.37, 659.25, 880],
    wave: "triangle",
    stepSeconds: 0.2,
  },
  luna: {
    label: "Luna",
    notes: [392, 493.88, 587.33, 783.99],
    wave: "sine",
    stepSeconds: 0.24,
  },
  europa: {
    label: "Europa",
    notes: [587.33, 739.99, 880, 1174.66],
    wave: "triangle",
    stepSeconds: 0.16,
  },
};

const PLAY_ICON_PATH = "M8 5v14l11-7z";
const STOP_ICON_PATH = "M6 6h12v12H6z";

const form = document.getElementById("ringtone-form");
const currentRingtoneEl = document.getElementById("current-ringtone");
const statusMessageEl = document.getElementById("status-message");
const previewButton = document.getElementById("preview-button");
const previewIconPath = document.getElementById("preview-icon-path");

let audioContext = null;
let stopTimerId = null;
let activeNodes = [];

function getSavedRingtone() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.hasOwn(RINGTONES, saved)) {
      return saved;
    }
  } catch {
    // Storage may be unavailable in restricted contexts.
  }
  return "calisto";
}

function saveRingtone(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage errors and still update UI state.
  }
}

function getSelectedRingtone() {
  const checked = form.querySelector('input[name="ringtone"]:checked');
  return checked && Object.hasOwn(RINGTONES, checked.value)
    ? checked.value
    : "calisto";
}

function announceStatus(message) {
  statusMessageEl.textContent = "";
  window.requestAnimationFrame(() => {
    statusMessageEl.textContent = message;
  });
}

function stopPreview() {
  if (stopTimerId !== null) {
    window.clearTimeout(stopTimerId);
    stopTimerId = null;
  }

  for (const node of activeNodes) {
    try {
      node.stop();
      node.disconnect();
    } catch {
      // Oscillator may have already finished.
    }
  }
  activeNodes = [];

  previewButton.setAttribute("aria-pressed", "false");
  previewIconPath.setAttribute("d", PLAY_ICON_PATH);
}

function playPreview(ringtoneKey) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const tone = RINGTONES[ringtoneKey];

  if (!AudioCtx || !tone) {
    announceStatus("La vista previa de audio no está disponible en este navegador.");
    return;
  }

  stopPreview();

  try {
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const { notes, wave, stepSeconds } = tone;

    notes.forEach((frequency, index) => {
      const startTime = now + index * stepSeconds;
      const endTime = startTime + stepSeconds * 1.4;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(endTime);
      activeNodes.push(oscillator);
    });

    previewButton.setAttribute("aria-pressed", "true");
    previewIconPath.setAttribute("d", STOP_ICON_PATH);

    const totalMs = Math.ceil((notes.length * stepSeconds + 0.25) * 1000);
    stopTimerId = window.setTimeout(() => {
      stopPreview();
    }, totalMs);
  } catch {
    stopPreview();
    announceStatus("No se pudo reproducir la vista previa de audio.");
  }
}

// Initialize form with saved selection
const initialRingtone = getSavedRingtone();
const initialRadio = form.querySelector(
  `input[name="ringtone"][value="${initialRingtone}"]`,
);
if (initialRadio) {
  initialRadio.checked = true;
}
currentRingtoneEl.textContent = RINGTONES[initialRingtone].label;

// Stop audio preview if the user switches selection
form.addEventListener("change", (event) => {
  if (event.target.name === "ringtone" && previewButton.getAttribute("aria-pressed") === "true") {
    stopPreview();
  }
});

// Explicit save on form submission (no auto-submit on radio change)
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = getSelectedRingtone();
  const label = RINGTONES[selected].label;

  saveRingtone(selected);
  currentRingtoneEl.textContent = label;
  announceStatus(`Tono de llamada guardado: ${label}.`);
});

// User-initiated audio preview toggle
previewButton.addEventListener("click", () => {
  const isPlaying = previewButton.getAttribute("aria-pressed") === "true";
  if (isPlaying) {
    stopPreview();
    return;
  }

  playPreview(getSelectedRingtone());
});
