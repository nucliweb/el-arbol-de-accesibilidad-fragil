export type RingtoneId = "calisto" | "ganimedes" | "luna" | "europa"

export interface RingtoneOption {
  id: RingtoneId
  name: string
  description: string
  notes: readonly number[]
}

export const RINGTONES: readonly RingtoneOption[] = [
  {
    id: "calisto",
    name: "Calisto",
    description: "Tono claro y equilibrado con cadencia suave.",
    notes: [523.25, 659.25, 783.99, 987.77],
  },
  {
    id: "ganimedes",
    name: "Ganímedes",
    description: "Acordes profundos y cálidos de ritmo pausado.",
    notes: [293.66, 440.0, 587.33, 739.99],
  },
  {
    id: "luna",
    name: "Luna",
    description: "Melodía minimalista y serena.",
    notes: [659.25, 493.88, 830.61, 659.25],
  },
  {
    id: "europa",
    name: "Europa",
    description: "Destellos agudos y nítidos de inspiración cristalina.",
    notes: [783.99, 587.33, 880.0, 987.77],
  },
] as const

export const DEFAULT_RINGTONE: RingtoneId = "calisto"

const STORAGE_KEY = "settings:ringtone"

export function isRingtoneId(value: string): value is RingtoneId {
  return RINGTONES.some((tone) => tone.id === value)
}

export function loadSavedRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors in restricted environments.
  }
  return DEFAULT_RINGTONE
}

export function saveRingtone(id: RingtoneId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ignore storage access errors in restricted environments.
  }
}

export function getRingtoneById(id: RingtoneId): RingtoneOption {
  return RINGTONES.find((tone) => tone.id === id) ?? RINGTONES[0]
}

export function playRingtonePreview(
  id: RingtoneId,
  onEnded?: () => void
): () => void {
  const AudioCtx = window.AudioContext
  if (!AudioCtx) {
    onEnded?.()
    return () => {}
  }

  const tone = getRingtoneById(id)
  const ctx = new AudioCtx()
  const noteDuration = 0.22
  const noteGap = 0.05
  const totalDurationMs = Math.ceil(
    (tone.notes.length * (noteDuration + noteGap) + 0.1) * 1000
  )

  tone.notes.forEach((frequency, index) => {
    const startTime = ctx.currentTime + index * (noteDuration + noteGap)
    const endTime = startTime + noteDuration

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(frequency, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(startTime)
    oscillator.stop(endTime + 0.02)
  })

  let stopped = false
  const timeoutId = window.setTimeout(() => {
    if (!stopped) {
      stopped = true
      void ctx.close()
      onEnded?.()
    }
  }, totalDurationMs)

  return () => {
    if (!stopped) {
      stopped = true
      window.clearTimeout(timeoutId)
      void ctx.close()
    }
  }
}
