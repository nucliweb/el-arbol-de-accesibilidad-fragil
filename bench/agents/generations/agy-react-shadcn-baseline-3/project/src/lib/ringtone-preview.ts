export type RingtoneId = "calisto" | "ganimedes" | "luna" | "europa"

interface NoteStep {
  frequency: number
  start: number
  duration: number
  type: OscillatorType
}

const RINGTONE_PATTERNS: Record<RingtoneId, NoteStep[]> = {
  calisto: [
    { frequency: 523.25, start: 0, duration: 0.22, type: "sine" },
    { frequency: 659.25, start: 0.22, duration: 0.22, type: "sine" },
    { frequency: 783.99, start: 0.44, duration: 0.36, type: "sine" },
  ],
  ganimedes: [
    { frequency: 392.0, start: 0, duration: 0.28, type: "triangle" },
    { frequency: 493.88, start: 0.24, duration: 0.28, type: "triangle" },
    { frequency: 587.33, start: 0.48, duration: 0.38, type: "triangle" },
  ],
  luna: [
    { frequency: 440.0, start: 0, duration: 0.3, type: "sine" },
    { frequency: 554.37, start: 0.36, duration: 0.42, type: "sine" },
  ],
  europa: [
    { frequency: 659.25, start: 0, duration: 0.16, type: "sine" },
    { frequency: 783.99, start: 0.16, duration: 0.16, type: "sine" },
    { frequency: 987.77, start: 0.32, duration: 0.16, type: "sine" },
    { frequency: 1318.51, start: 0.48, duration: 0.34, type: "sine" },
  ],
}

export interface RingtonePlayback {
  stop: () => void
}

export function playRingtonePreview(
  toneId: RingtoneId,
  onEnded: () => void
): RingtonePlayback | null {
  if (typeof window === "undefined") {
    return null
  }

  const AudioCtx = window.AudioContext
  if (!AudioCtx) {
    return null
  }

  const context = new AudioCtx()
  const notes = RINGTONE_PATTERNS[toneId]
  const now = context.currentTime
  let maxEnd = 0

  for (const note of notes) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = note.type
    oscillator.frequency.setValueAtTime(note.frequency, now + note.start)

    gain.gain.setValueAtTime(0.0001, now + note.start)
    gain.gain.exponentialRampToValueAtTime(0.14, now + note.start + 0.03)
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

  let stopped = false

  const cleanup = () => {
    if (stopped) return
    stopped = true
    window.clearTimeout(timerId)
    void context.close().catch(() => {})
  }

  const timerId = window.setTimeout(() => {
    cleanup()
    onEnded()
  }, Math.ceil((maxEnd + 0.08) * 1000))

  return {
    stop: () => {
      cleanup()
    },
  }
}
