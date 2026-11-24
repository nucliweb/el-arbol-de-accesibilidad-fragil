import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { Check, Square, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  playRingtonePreview,
  type RingtoneId,
  type RingtonePlayback,
} from "@/lib/ringtone-preview"

interface RingtoneOption {
  id: RingtoneId
  name: string
  description: string
}

const STORAGE_KEY = "settings.ringtone"

const RINGTONE_OPTIONS: readonly RingtoneOption[] = [
  {
    id: "calisto",
    name: "Calisto",
    description: "Melodía suave y cristalina.",
  },
  {
    id: "ganimedes",
    name: "Ganímedes",
    description: "Acorde cálido y envolvente.",
  },
  {
    id: "luna",
    name: "Luna",
    description: "Pulsos serenos y minimalistas.",
  },
  {
    id: "europa",
    name: "Europa",
    description: "Campanas claras y brillantes.",
  },
] as const

function isRingtoneId(value: string): value is RingtoneId {
  return RINGTONE_OPTIONS.some((option) => option.id === value)
}

function loadSavedRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access issues
  }
  return "calisto"
}

export function SettingsPage() {
  const [savedTone, setSavedTone] = useState<RingtoneId>(loadSavedRingtone)
  const [selectedTone, setSelectedTone] = useState<RingtoneId>(savedTone)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const playbackRef = useRef<RingtonePlayback | null>(null)

  const selectedOption =
    RINGTONE_OPTIONS.find((option) => option.id === selectedTone) ??
    RINGTONE_OPTIONS[0]

  const savedOption =
    RINGTONE_OPTIONS.find((option) => option.id === savedTone) ??
    RINGTONE_OPTIONS[0]

  const hasUnsavedChanges = selectedTone !== savedTone

  function stopPreview() {
    playbackRef.current?.stop()
    playbackRef.current = null
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      playbackRef.current?.stop()
      playbackRef.current = null
    }
  }, [])

  function handleToneChange(value: string) {
    if (!isRingtoneId(value)) return
    stopPreview()
    setSelectedTone(value)
    setStatusMessage("")
  }

  function handleTogglePreview() {
    if (isPlaying) {
      stopPreview()
      return
    }

    const playback = playRingtonePreview(selectedTone, () => {
      playbackRef.current = null
      setIsPlaying(false)
    })

    if (playback) {
      playbackRef.current = playback
      setIsPlaying(true)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedTone(selectedTone)
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedTone)
    } catch {
      // Ignore storage access issues
    }
    setStatusMessage(`Tono de llamada guardado: ${selectedOption.name}.`)
  }

  return (
    <section aria-labelledby="settings-title" className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="settings-title"
          className="font-heading text-2xl font-semibold tracking-tight"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card id="tono-de-llamada">
          <CardHeader>
            <CardTitle>
              <h2 id="ringtone-heading">Tono de llamada</h2>
            </CardTitle>
            <CardDescription id="ringtone-description">
              Selecciona el tono que sonará al recibir una llamada. Tono activo:{" "}
              <span className="font-medium text-foreground">
                {savedOption.name}
              </span>
              .
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <RadioGroup
              name="ringtone"
              value={selectedTone}
              onValueChange={handleToneChange}
              aria-labelledby="ringtone-heading"
              aria-describedby="ringtone-description"
            >
              {RINGTONE_OPTIONS.map((option) => {
                const inputId = `ringtone-${option.id}`
                const descId = `ringtone-${option.id}-desc`
                const isSelected = selectedTone === option.id

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors",
                      isSelected
                        ? "border-primary bg-muted/50"
                        : "border-border hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem
                      id={inputId}
                      value={option.id}
                      aria-describedby={descId}
                      className="mt-0.5"
                    />
                    <div className="grid flex-1 gap-0.5">
                      <Label
                        htmlFor={inputId}
                        className="cursor-pointer font-medium after:absolute after:inset-0"
                      >
                        {option.name}
                      </Label>
                      <p id={descId} className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">Guardar</Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTogglePreview}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <Square aria-hidden="true" className="size-3.5" />
                    Detener vista previa
                  </>
                ) : (
                  <>
                    <Volume2 aria-hidden="true" className="size-4" />
                    Escuchar {selectedOption.name}
                  </>
                )}
              </Button>
            </div>

            <div
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground"
            >
              {statusMessage ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Check aria-hidden="true" className="size-3.5" />
                  {statusMessage}
                </span>
              ) : hasUnsavedChanges ? (
                <span>Cambios sin guardar</span>
              ) : null}
            </div>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}
