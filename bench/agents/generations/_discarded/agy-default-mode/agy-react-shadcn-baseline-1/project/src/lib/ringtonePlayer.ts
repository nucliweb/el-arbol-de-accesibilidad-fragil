export type RingtoneId = 'calisto' | 'ganimedes' | 'luna' | 'europa'

export interface RingtoneOption {
  id: RingtoneId
  label: string
  description: string
  notes: readonly number[]
}

export const DEFAULT_RINGTONE: RingtoneId = 'calisto'

export const RINGTONE_STORAGE_KEY = 'settings.ringtone'

export const RINGTONES: readonly RingtoneOption[] = [
  {
    id: 'calisto',
    label: 'Calisto',
    description: 'Melodía suave de tonos cálidos y pausados.',
    notes: [440, 554.37, 659.25],
  },
  {
    id: 'ganimedes',
    label: 'Ganímedes',
    description: 'Acorde profundo con resonancia equilibrada.',
    notes: [329.63, 440, 523.25, 659.25],
  },
  {
    id: 'luna',
    label: 'Luna',
    description: 'Timbre ligero y cristalino de notas agudas.',
    notes: [587.33, 739.99, 880],
  },
  {
    id: 'europa',
    label: 'Europa',
    description: 'Secuencia rítmica clara y brillante.',
    notes: [523.25, 659.25, 783.99, 1046.5],
  },
] as const

export function isRingtoneId(value: string | null): value is RingtoneId {
  return RINGTONES.some((ringtone) => ringtone.id === value)
}

export function getRingtoneById(id: RingtoneId): RingtoneOption {
  return RINGTONES.find((ringtone) => ringtone.id === id) ?? RINGTONES[0]
}

export function loadSavedRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(RINGTONE_STORAGE_KEY)
    if (isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage errors in restricted contexts.
  }
  return DEFAULT_RINGTONE
}

export function saveRingtone(id: RingtoneId): void {
  try {
    window.localStorage.setItem(RINGTONE_STORAGE_KEY, id)
  } catch {
    // Ignore storage errors in restricted contexts.
  }
}

let activeContext: AudioContext | null = null
let activeTimer: number | null = null

export function stopRingtone(): void {
  if (activeTimer !== null) {
    window.clearTimeout(activeTimer)
    activeTimer = null
  }
  if (activeContext !== null) {
    void activeContext.close().catch(() => {})
    activeContext = null
  }
}

export function playRingtone(id: RingtoneId, onEnded?: () => void): boolean {
  stopRingtone()

  const AudioCtx = window.AudioContext
  if (!AudioCtx) {
    onEnded?.()
    return false
  }

  try {
    const context = new AudioCtx()
    activeContext = context
    const ringtone = getRingtoneById(id)
    const noteDuration = 0.22
    const noteGap = 0.06
    const startTime = context.currentTime + 0.02

    ringtone.notes.forEach((frequency, index) => {
      const noteStart = startTime + index * (noteDuration + noteGap)
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)

      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.14, noteStart + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + noteDuration + 0.02)
    })

    const totalMs = Math.ceil(ringtone.notes.length * (noteDuration + noteGap) * 1000) + 120
    activeTimer = window.setTimeout(() => {
      stopRingtone()
      onEnded?.()
    }, totalMs)

    return true
  } catch {
    stopRingtone()
    onEnded?.()
    return false
  }
}
