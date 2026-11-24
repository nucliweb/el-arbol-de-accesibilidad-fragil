export interface RingtoneOption {
  id: 'calisto' | 'ganimedes' | 'luna' | 'europa'
  name: string
  description: string
  notes: readonly number[]
}

export const RINGTONES: readonly RingtoneOption[] = [
  {
    id: 'calisto',
    name: 'Calisto',
    description: 'Acorde suave y ascendente.',
    notes: [523.25, 659.25, 783.99],
  },
  {
    id: 'ganimedes',
    name: 'Ganímedes',
    description: 'Pulso claro de tonos cálidos.',
    notes: [440, 554.37, 659.25, 880],
  },
  {
    id: 'luna',
    name: 'Luna',
    description: 'Melodía serena de campanas.',
    notes: [587.33, 698.46, 880],
  },
  {
    id: 'europa',
    name: 'Europa',
    description: 'Secuencia cristalina y brillante.',
    notes: [659.25, 783.99, 987.77, 1318.51],
  },
] as const

export type RingtoneId = RingtoneOption['id']

export const DEFAULT_RINGTONE_ID: RingtoneId = 'calisto'

export function isRingtoneId(value: string): value is RingtoneId {
  return RINGTONES.some((ringtone) => ringtone.id === value)
}

export function getRingtoneById(id: RingtoneId): RingtoneOption {
  return RINGTONES.find((ringtone) => ringtone.id === id) ?? RINGTONES[0]
}

export interface RingtonePlayback {
  stop: () => void
}

export function playRingtonePreview(
  ringtone: RingtoneOption,
  onEnded: () => void,
): RingtonePlayback {
  const AudioCtx =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined

  if (!AudioCtx) {
    const timer = window.setTimeout(onEnded, 600)
    return {
      stop: () => window.clearTimeout(timer),
    }
  }

  let closed = false
  const context = new AudioCtx()
  const stepDuration = 0.18
  const noteDuration = 0.24
  const startAt = context.currentTime + 0.02

  ringtone.notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const noteStart = startAt + index * stepDuration
    const noteEnd = noteStart + noteDuration

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, noteStart)

    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(noteStart)
    oscillator.stop(noteEnd + 0.02)
  })

  const totalMs = Math.ceil(
    (ringtone.notes.length * stepDuration + noteDuration) * 1000,
  )

  const closeContext = () => {
    if (closed) return
    closed = true
    void context.close().catch(() => {})
  }

  const timer = window.setTimeout(() => {
    closeContext()
    onEnded()
  }, totalMs)

  return {
    stop: () => {
      window.clearTimeout(timer)
      closeContext()
    },
  }
}
