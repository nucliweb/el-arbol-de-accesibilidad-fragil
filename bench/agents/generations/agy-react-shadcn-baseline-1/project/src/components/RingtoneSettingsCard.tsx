import * as React from 'react'
import { Play, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  DEFAULT_RINGTONE_ID,
  RINGTONES,
  getRingtoneById,
  isRingtoneId,
  playRingtonePreview,
  type RingtoneId,
  type RingtoneOption,
  type RingtonePlayback,
} from '@/lib/ringtones'

const STORAGE_KEY = 'settings:ringtone'

function readStoredRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors in restricted environments.
  }
  return DEFAULT_RINGTONE_ID
}

export function RingtoneSettingsCard() {
  const [savedRingtoneId, setSavedRingtoneId] =
    React.useState<RingtoneId>(readStoredRingtone)
  const [selectedRingtoneId, setSelectedRingtoneId] =
    React.useState<RingtoneId>(savedRingtoneId)
  const [playingId, setPlayingId] = React.useState<RingtoneId | null>(null)
  const [statusMessage, setStatusMessage] = React.useState('')
  const playbackRef = React.useRef<RingtonePlayback | null>(null)

  const stopPreview = React.useCallback(() => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setPlayingId(null)
  }, [])

  React.useEffect(() => {
    return () => {
      playbackRef.current?.stop()
    }
  }, [])

  const handlePreviewToggle = (ringtone: RingtoneOption) => {
    if (playingId === ringtone.id) {
      stopPreview()
      return
    }

    stopPreview()
    setPlayingId(ringtone.id)
    playbackRef.current = playRingtonePreview(ringtone, () => {
      playbackRef.current = null
      setPlayingId((current) => (current === ringtone.id ? null : current))
    })
  }

  const handleValueChange = (value: string) => {
    if (!isRingtoneId(value)) return
    setSelectedRingtoneId(value)
    setStatusMessage('')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavedRingtoneId(selectedRingtoneId)
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedRingtoneId)
    } catch {
      // Ignore storage access errors in restricted environments.
    }
    const saved = getRingtoneById(selectedRingtoneId)
    setStatusMessage(`Tono de llamada guardado: ${saved.name}.`)
  }

  const savedRingtone = getRingtoneById(savedRingtoneId)

  return (
    <section aria-labelledby="tono-llamada-heading">
      <Card id="ajustes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 id="tono-llamada-heading">Tono de llamada</h2>
          </CardTitle>
          <CardDescription>
            Elige el tono que sonará al recibir una llamada. Tono activo:{' '}
            <span className="font-medium text-foreground">{savedRingtone.name}</span>.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pb-4">
            <RadioGroup
              value={selectedRingtoneId}
              onValueChange={handleValueChange}
              aria-labelledby="tono-llamada-heading"
              className="gap-2"
            >
              {RINGTONES.map((ringtone) => {
                const inputId = `ringtone-${ringtone.id}`
                const descriptionId = `${inputId}-description`
                const isSelected = selectedRingtoneId === ringtone.id
                const isPlaying = playingId === ringtone.id

                return (
                  <div
                    key={ringtone.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      isSelected
                        ? 'border-primary bg-muted/40'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <RadioGroupItem
                        value={ringtone.id}
                        id={inputId}
                        aria-describedby={descriptionId}
                        className="mt-0.5"
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor={inputId} className="cursor-pointer">
                          {ringtone.name}
                        </Label>
                        <p
                          id={descriptionId}
                          className="text-xs text-muted-foreground"
                        >
                          {ringtone.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={isPlaying}
                      aria-label={
                        isPlaying
                          ? `Detener vista previa de ${ringtone.name}`
                          : `Escuchar vista previa de ${ringtone.name}`
                      }
                      onClick={() => handlePreviewToggle(ringtone)}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="size-3.5" aria-hidden="true" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" aria-hidden="true" />
                          <span>Escuchar</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3">
            <Button type="submit">Guardar tono</Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {statusMessage}
            </p>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
