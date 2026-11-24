import { type FormEvent, useEffect, useState } from "react"
import { Bell, Check, Square, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  RINGTONES,
  type RingtoneId,
  playRingtonePreview,
  stopRingtonePreview,
} from "@/lib/ringtone-audio"

const STORAGE_KEY = "settings.ringtone"
const DEFAULT_RINGTONE: RingtoneId = "calisto"

function readStoredRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && RINGTONES.some((tone) => tone.id === stored)) {
      return stored as RingtoneId
    }
  } catch {
    // Ignore storage access failures in restricted contexts.
  }
  return DEFAULT_RINGTONE
}

function getRingtoneName(id: RingtoneId): string {
  return RINGTONES.find((tone) => tone.id === id)?.name ?? "Calisto"
}

export function SettingsPage() {
  const [savedRingtone, setSavedRingtone] = useState<RingtoneId>(() =>
    readStoredRingtone()
  )
  const [selectedRingtone, setSelectedRingtone] =
    useState<RingtoneId>(savedRingtone)
  const [playingRingtone, setPlayingRingtone] = useState<RingtoneId | null>(
    null
  )
  const [statusMessage, setStatusMessage] = useState<string>("")

  const hasChanges = selectedRingtone !== savedRingtone
  const savedRingtoneName = getRingtoneName(savedRingtone)

  useEffect(() => {
    return () => {
      stopRingtonePreview()
    }
  }, [])

  function handleSelectRingtone(value: string) {
    const nextId = value as RingtoneId
    setSelectedRingtone(nextId)
    setStatusMessage("")
  }

  function handleTogglePreview(toneId: RingtoneId) {
    if (playingRingtone === toneId) {
      stopRingtonePreview()
      setPlayingRingtone(null)
      return
    }

    const started = playRingtonePreview(toneId, () => {
      setPlayingRingtone((current) => (current === toneId ? null : current))
    })

    if (started) {
      setPlayingRingtone(toneId)
    } else {
      setPlayingRingtone(null)
      setStatusMessage("La vista previa de audio no está disponible en este navegador.")
    }
  }

  function handleReset() {
    stopRingtonePreview()
    setPlayingRingtone(null)
    setSelectedRingtone(savedRingtone)
    setStatusMessage("Cambios descartados.")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedRingtone(selectedRingtone)
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedRingtone)
    } catch {
      // Ignore storage write errors in restricted contexts.
    }
    setStatusMessage(
      `Tono de llamada guardado: ${getRingtoneName(selectedRingtone)}.`
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido y notificaciones de tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card id="ajustes-tono">
          <CardHeader>
            <CardTitle>
              <h2
                id="ringtone-heading"
                className="flex items-center gap-2 text-base font-medium"
              >
                <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
                Tono de llamada
              </h2>
            </CardTitle>
            <CardDescription id="ringtone-description">
              Selecciona el tono que sonará cuando recibas una llamada entrante.
            </CardDescription>
            <CardAction>
              <span className="inline-flex items-center rounded-md border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                Actual: {savedRingtoneName}
              </span>
            </CardAction>
          </CardHeader>

          <CardContent>
            <RadioGroup
              value={selectedRingtone}
              onValueChange={handleSelectRingtone}
              aria-labelledby="ringtone-heading"
              aria-describedby="ringtone-description"
              className="gap-2.5"
            >
              {RINGTONES.map((tone) => {
                const inputId = `ringtone-${tone.id}`
                const descId = `ringtone-${tone.id}-description`
                const isSelected = selectedRingtone === tone.id
                const isPlaying = playingRingtone === tone.id

                return (
                  <div
                    key={tone.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-muted/40"
                        : "border-border hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <RadioGroupItem
                        id={inputId}
                        value={tone.id}
                        aria-describedby={descId}
                        className="mt-0.5"
                      />
                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <Label
                          htmlFor={inputId}
                          className="cursor-pointer font-medium text-foreground"
                        >
                          {tone.name}
                        </Label>
                        <p
                          id={descId}
                          className="text-xs text-muted-foreground"
                        >
                          {tone.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isPlaying ? "secondary" : "outline"}
                      size="sm"
                      aria-pressed={isPlaying}
                      aria-label={
                        isPlaying
                          ? `Detener vista previa de ${tone.name}`
                          : `Probar vista previa de ${tone.name}`
                      }
                      onClick={() => handleTogglePreview(tone.id)}
                    >
                      {isPlaying ? (
                        <>
                          <Square aria-hidden="true" className="size-3.5" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Volume2 aria-hidden="true" className="size-3.5" />
                          <span>Probar</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="submit">Guardar cambios</Button>
              {hasChanges && (
                <Button type="button" variant="ghost" onClick={handleReset}>
                  Descartar
                </Button>
              )}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              {statusMessage && (
                <>
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-foreground"
                  />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
