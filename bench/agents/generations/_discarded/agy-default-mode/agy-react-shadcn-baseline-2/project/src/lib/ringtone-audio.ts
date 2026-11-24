export type RingtoneId = "calisto" | "ganimedes" | "luna" | "europa"

interface NoteStep {
  frequency: number
  duration: number
  gap: number
  type: OscillatorType
}

const RINGTONE_PATTERNS: Record<RingtoneId, NoteStep[]> = {
  calisto: [
    { frequency: 523.25, duration: 0.18, gap: 0.05, type: "sine" },
    { frequency: 659.25, duration: 0.18, gap: 0.05, type: "sine" },
    { frequency: 783.99, duration: 0.32, gap: 0.08, type: "sine" },
  ],
  ganimedes: [
    { frequency: 440, duration: 0.22, gap: 0.06, type: "triangle" },
    { frequency: 554.37, duration: 0.22, gap: 0.06, type: "triangle" },
    { frequency: 659.25, duration: 0.35, gap: 0.08, type: "triangle" },
  ],
  luna: [
    { frequency: 392, duration: 0.28, gap: 0.08, type: "sine" },
    { frequency: 493.88, duration: 0.28, gap: 0.08, type: "sine" },
    { frequency: 587.33, duration: 0.36, gap: 0.08, type: "sine" },
  ],
  europa: [
    { frequency: 587.33, duration: 0.14, gap: 0.04, type: "sine" },
    { frequency: 739.99, duration: 0.14, gap: 0.04, type: "sine" },
    { frequency: 880, duration: 0.14, gap: 0.04, type: "sine" },
    { frequency: 1174.66, duration: 0.3, gap: 0.08, type: "sine" },
  ],
}

export function playRingtonePreview(
  ringtoneId: RingtoneId,
  onEnded: () => void
): () => void {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioCtx) {
    const timer = window.setTimeout(onEnded, 500)
    return () => window.clearTimeout(timer)
  }

  let context: AudioContext | null = null
  try {
    context = new AudioCtx()
  } catch {
    const timer = window.setTimeout(onEnded, 500)
    return () => window.clearTimeout(timer)
  }

  const pattern = RINGTONE_PATTERNS[ringtoneId]
  const oscillators: OscillatorNode[] = []
  let cursor = context.currentTime + 0.02

  for (const step of pattern) {
    const osc = context.createOscillator()
    const gain = context.createGain()

    osc.type = step.type
    osc.frequency.setValueAtTime(step.frequency, cursor)

    gain.gain.setValueAtTime(0.0001, cursor)
    gain.gain.exponentialRampToValueAtTime(0.14, cursor + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + step.duration)

    osc.connect(gain)
    gain.connect(context.destination)

    osc.start(cursor)
    osc.stop(cursor + step.duration + 0.01)
    oscillators.push(osc)

    cursor += step.duration + step.gap
  }

  const totalMs = Math.ceil((cursor - context.currentTime) * 1000) + 50
  const endTimer = window.setTimeout(() => {
    void context?.close()
    onEnded()
  }, totalMs)

  return () => {
    window.clearTimeout(endTimer)
    for (const osc of oscillators) {
      try {
        osc.stop()
      } catch {
        // Oscillator may already have stopped.
      }
    }
    void context?.close()
  }
}
