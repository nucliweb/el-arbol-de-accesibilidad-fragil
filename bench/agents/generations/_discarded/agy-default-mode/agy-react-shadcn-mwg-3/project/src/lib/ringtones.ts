export type RingtoneId = 'calisto' | 'ganimedes' | 'luna' | 'europa'

export interface RingtoneOption {
  id: RingtoneId
  name: string
  /** Frequencies (Hz) and durations (s) for optional Web Audio preview */
  notes: ReadonlyArray<{ frequency: number; duration: number; delay: number }>
}

export const RINGTONES: readonly RingtoneOption[] = [
  {
    id: 'calisto',
    name: 'Calisto',
    notes: [
      { frequency: 523.25, duration: 0.24, delay: 0 },
      { frequency: 659.25, duration: 0.24, delay: 0.22 },
      { frequency: 783.99, duration: 0.42, delay: 0.44 },
    ],
  },
  {
    id: 'ganimedes',
    name: 'Ganímedes',
    notes: [
      { frequency: 440, duration: 0.22, delay: 0 },
      { frequency: 554.37, duration: 0.22, delay: 0.2 },
      { frequency: 659.25, duration: 0.22, delay: 0.4 },
      { frequency: 880, duration: 0.4, delay: 0.6 },
    ],
  },
  {
    id: 'luna',
    name: 'Luna',
    notes: [
      { frequency: 587.33, duration: 0.3, delay: 0 },
      { frequency: 493.88, duration: 0.3, delay: 0.28 },
      { frequency: 659.25, duration: 0.48, delay: 0.56 },
    ],
  },
  {
    id: 'europa',
    name: 'Europa',
    notes: [
      { frequency: 659.25, duration: 0.2, delay: 0 },
      { frequency: 783.99, duration: 0.2, delay: 0.18 },
      { frequency: 987.77, duration: 0.22, delay: 0.36 },
      { frequency: 783.99, duration: 0.4, delay: 0.56 },
    ],
  },
] as const

export const DEFAULT_RINGTONE: RingtoneId = 'calisto'

const STORAGE_KEY = 'mi-cuenta.ringtone'

export function isRingtoneId(value: string | null): value is RingtoneId {
  return RINGTONES.some((ringtone) => ringtone.id === value)
}

export function loadSavedRingtone(): RingtoneId {
  if (typeof window === 'undefined') return DEFAULT_RINGTONE
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isRingtoneId(stored) ? stored : DEFAULT_RINGTONE
  } catch {
    return DEFAULT_RINGTONE
  }
}

export function saveRingtone(id: RingtoneId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function getRingtoneById(id: RingtoneId): RingtoneOption {
  return RINGTONES.find((ringtone) => ringtone.id === id) ?? RINGTONES[0]
}

export interface RingtonePlaybackHandle {
  stop: () => void
}

/**
 * Plays a short synthesized preview of the requested ringtone on explicit user action.
 */
export function playRingtonePreview(
  id: RingtoneId,
  onEnded: () => void,
): RingtonePlaybackHandle {
  const ringtone = getRingtoneById(id)

  if (typeof window === 'undefined') {
    onEnded()
    return { stop: () => {} }
  }

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) {
    const timer = window.setTimeout(onEnded, 600)
    return { stop: () => window.clearTimeout(timer) }
  }

  const ctx = new AudioContextCtor()
  const now = ctx.currentTime
  let stopped = false

  const totalDuration = ringtone.notes.reduce(
    (max, note) => Math.max(max, note.delay + note.duration),
    0,
  )

  for (const note of ringtone.notes) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(note.frequency, now + note.delay)

    gain.gain.setValueAtTime(0.0001, now + note.delay)
    gain.gain.exponentialRampToValueAtTime(0.14, now + note.delay + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.delay + note.duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(now + note.delay)
    oscillator.stop(now + note.delay + note.duration + 0.02)
  }

  const cleanup = () => {
    if (stopped) return
    stopped = true
    window.clearTimeout(endTimer)
    void ctx.close().catch(() => {})
  }

  const endTimer = window.setTimeout(() => {
    cleanup()
    onEnded()
  }, Math.ceil((totalDuration + 0.08) * 1000))

  return {
    stop: cleanup,
  }
}
