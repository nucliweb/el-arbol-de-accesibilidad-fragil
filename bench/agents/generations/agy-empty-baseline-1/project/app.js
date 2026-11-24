const STORAGE_KEY = 'settings:ringtone';
const DEFAULT_TONE = 'Calisto';

// Musical patterns for each ringtone (frequency in Hz, start offset in s, duration in s, oscillator type)
const TONE_PATTERNS = {
  Calisto: {
    type: 'sine',
    notes: [
      { freq: 523.25, time: 0.0, dur: 0.22 },
      { freq: 659.25, time: 0.22, dur: 0.22 },
      { freq: 783.99, time: 0.44, dur: 0.25 },
      { freq: 1046.5, time: 0.7, dur: 0.45 },
    ],
  },
  Ganímedes: {
    type: 'triangle',
    notes: [
      { freq: 329.63, time: 0.0, dur: 0.28 },
      { freq: 392.0, time: 0.3, dur: 0.28 },
      { freq: 493.88, time: 0.6, dur: 0.45 },
      { freq: 392.0, time: 1.1, dur: 0.4 },
    ],
  },
  Luna: {
    type: 'sine',
    notes: [
      { freq: 440.0, time: 0.0, dur: 0.35 },
      { freq: 554.37, time: 0.38, dur: 0.35 },
      { freq: 659.25, time: 0.76, dur: 0.55 },
    ],
  },
  Europa: {
    type: 'sine',
    notes: [
      { freq: 659.25, time: 0.0, dur: 0.16 },
      { freq: 880.0, time: 0.18, dur: 0.16 },
      { freq: 987.77, time: 0.36, dur: 0.22 },
      { freq: 1318.51, time: 0.6, dur: 0.45 },
    ],
  },
};

const form = document.getElementById('ringtone-form');
const selectedToneName = document.getElementById('selected-tone-name');
const statusMessage = document.getElementById('status-message');
const radioInputs = Array.from(document.querySelectorAll('input[name="ringtone"]'));
const previewButtons = Array.from(document.querySelectorAll('.preview-btn'));

let audioContext = null;
let activeNodes = [];
let stopTimeoutId = null;
let playingTone = null;

function getSavedTone() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.prototype.hasOwnProperty.call(TONE_PATTERNS, saved)) {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return DEFAULT_TONE;
}

function saveTone(tone) {
  try {
    localStorage.setItem(STORAGE_KEY, tone);
  } catch {
    // Ignore storage access errors
  }
}

function getSelectedTone() {
  const checked = radioInputs.find((input) => input.checked);
  return checked ? checked.value : DEFAULT_TONE;
}

function updateSelectedDisplay(tone) {
  selectedToneName.textContent = tone;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function stopPreview() {
  if (stopTimeoutId !== null) {
    clearTimeout(stopTimeoutId);
    stopTimeoutId = null;
  }

  for (const node of activeNodes) {
    try {
      node.stop();
    } catch {
      // Oscillator may already have finished
    }
    node.disconnect();
  }
  activeNodes = [];
  playingTone = null;

  for (const btn of previewButtons) {
    const tone = btn.dataset.tone;
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `Escuchar vista previa de ${tone}`);
    const label = btn.querySelector('.preview-btn-text');
    if (label) {
      label.textContent = 'Escuchar';
    }
  }
}

function playPreview(tone, triggerButton) {
  if (playingTone === tone) {
    stopPreview();
    return;
  }

  stopPreview();

  const pattern = TONE_PATTERNS[tone];
  if (!pattern) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    setStatus('Tu navegador no permite reproducir la vista previa de audio.');
    return;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  let totalDuration = 0;

  for (const note of pattern.notes) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = pattern.type;
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    gain.gain.setValueAtTime(0.0001, now + note.time);
    gain.gain.exponentialRampToValueAtTime(0.22, now + note.time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.02);

    activeNodes.push(osc);
    totalDuration = Math.max(totalDuration, note.time + note.dur);
  }

  playingTone = tone;
  triggerButton.setAttribute('aria-pressed', 'true');
  triggerButton.setAttribute('aria-label', `Detener vista previa de ${tone}`);
  const label = triggerButton.querySelector('.preview-btn-text');
  if (label) {
    label.textContent = 'Detener';
  }

  stopTimeoutId = window.setTimeout(() => {
    stopPreview();
  }, Math.ceil((totalDuration + 0.05) * 1000));
}

function init() {
  const initialTone = getSavedTone();
  for (const input of radioInputs) {
    input.checked = input.value === initialTone;
  }
  updateSelectedDisplay(initialTone);

  form.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'ringtone') {
      const tone = event.target.value;
      updateSelectedDisplay(tone);
      setStatus('');
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const tone = getSelectedTone();
    saveTone(tone);
    updateSelectedDisplay(tone);
    setStatus(`Tono guardado: ${tone}.`);
  });

  for (const btn of previewButtons) {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.tone;
      playPreview(tone, btn);
    });
  }
}

init();
