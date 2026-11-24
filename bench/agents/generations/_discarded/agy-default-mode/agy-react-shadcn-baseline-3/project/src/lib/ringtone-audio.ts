export type RingtoneId = "calisto" | "ganimedes" | "luna" | "europa"

export interface RingtoneOption {
  id: RingtoneId
  name: string
  description: string
  notes: ReadonlyArray<{ frequency: number; start: number; duration: number }>
  waveform: OscillatorType
}

export const RINGTONES: ReadonlyArray<RingtoneOption> = [
  {
    id: "calisto",
    name: "Calisto",
    description: "Campanas suaves con cadencia descendente",
    waveform: "sine",
    notes: [
      { frequency: 659.25, start: 0, duration: 0.35 },
      { frequency: 523.25, start: 0.28, duration: 0.35 },
      { frequency: 440, start: 0.56, duration: 0.55 },
    ],
  },
  {
    id: "ganimedes",
    name: "Ganímedes",
    description: "Arpegio cristalino en ascenso",
    waveform: "triangle",
    notes: [
      { frequency: 440, start: 0, duration: 0.24 },
      { frequency: 554.37, start: 0.2, duration: 0.24 },
      { frequency: 659.25, start: 0.4, duration: 0.24 },
      { frequency: 880, start: 0.6, duration: 0.5 },
    ],
  },
  {
    id: "luna",
    name: "Luna",
    description: "Tono sereno y cálido de dos notas",
    waveform: "sine",
    notes: [
      { frequency: 587.33, start: 0, duration: 0.45 },
      { frequency: 493.88, start: 0.42, duration: 0.65 },
    ],
  },
  {
    id: "europa",
    name: "Europa",
    description: "Pulso rítmico y nítido de cuatro notas",
    waveform: "triangle",
    notes: [
      { frequency: 783.99, start: 0, duration: 0.18 },
      { frequency: 659.25, start: 0.2, duration: 0.18 },
      { frequency: 783.99, start: 0.42, duration: 0.18 },
      { frequency: 1046.5, start: 0.64, duration: 0.42 },
    ],
  },
]

let activeContext: AudioContext | null = null
let activeTimeout: number | null = null

export function stopRingtonePreview(): void {
  if (activeTimeout !== null) {
    window.clearTimeout(activeTimeout)
    activeTimeout = null
  }
  if (activeContext) {
    void activeContext.close().catch(() => {})
    activeContext = null
  }
}

export function playRingtonePreview(
  ringtoneId: RingtoneId,
  onEnded?: () => void
): boolean {
  stopRingtonePreview()

  const ringtone = RINGTONES.find((item) => item.id === ringtoneId)
  if (!ringtone) {
    return false
  }

  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioCtx) {
    return false
  }

  try {
    const context = new AudioCtx()
    activeContext = context

    const now = context.currentTime
    let maxEnd = 0

    for (const note of ringtone.notes) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = ringtone.waveform
      oscillator.frequency.setValueAtTime(note.frequency, now + note.start)

      gain.gain.setValueAtTime(0.0001, now + note.start)
      gain.gain.exponentialRampToValueAtTime(0.16, now + note.start + 0.025)
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.start + note.duration
      )

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(now + note.start)
      oscillator.stop(now + note.start + note.duration + 0.02)

      maxEnd = Math.max(maxEnd, note.start + note.duration)
    }

    activeTimeout = window.setTimeout(() => {
      if (activeContext === context) {
        void context.close().catch(() => {})
        activeContext = null
      }
      activeTimeout = null
      onEnded?.()
    }, Math.ceil((maxEnd + 0.1) * 1000))

    return true
  } catch {
    stopRingtonePreview()
    return false
  }
}
