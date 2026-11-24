import { useEffect, useRef, useState } from "react"
import { Bell, Square, Volume2 } from "lucide-react"
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
import { playRingtonePreview, type RingtoneId } from "@/lib/ringtone-audio"
import { cn } from "@/lib/utils"

interface RingtoneOption {
  id: RingtoneId
  name: string
  description: string
}

const RINGTONES: readonly RingtoneOption[] = [
  {
    id: "calisto",
    name: "Calisto",
    description: "Melodía cálida y progresiva",
  },
  {
    id: "ganimedes",
    name: "Ganímedes",
    description: "Acordes suaves de campana",
  },
  {
    id: "luna",
    name: "Luna",
    description: "Tono sereno y minimalista",
  },
  {
    id: "europa",
    name: "Europa",
    description: "Pulso cristalino y rítmico",
  },
] as const

const STORAGE_KEY = "mi-cuenta:ringtone"

function isRingtoneId(value: string | null): value is RingtoneId {
  return RINGTONES.some((ringtone) => ringtone.id === value)
}

function getInitialRingtone(): RingtoneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isRingtoneId(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors.
  }
  return "calisto"
}

export function SettingsPage() {
  const [savedRingtone, setSavedRingtone] = useState<RingtoneId>(getInitialRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneId>(savedRingtone)
  const [playingRingtone, setPlayingRingtone] = useState<RingtoneId | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const stopPreviewRef = useRef<(() => void) | null>(null)

  const stopPreview = () => {
    stopPreviewRef.current?.()
    stopPreviewRef.current = null
    setPlayingRingtone(null)
  }

  useEffect(() => {
    return () => {
      stopPreviewRef.current?.()
    }
  }, [])

  const handleTogglePreview = (ringtoneId: RingtoneId) => {
    if (playingRingtone === ringtoneId) {
      stopPreview()
      return
    }

    stopPreview()
    setPlayingRingtone(ringtoneId)
    stopPreviewRef.current = playRingtonePreview(ringtoneId, () => {
      stopPreviewRef.current = null
      setPlayingRingtone((current) => (current === ringtoneId ? null : current))
    })
  }

  const handleValueChange = (value: string) => {
    if (isRingtoneId(value)) {
      setSelectedRingtone(value)
      setStatusMessage("")
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavedRingtone(selectedRingtone)
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedRingtone)
    } catch {
      // Ignore storage access errors.
    }

    const chosen = RINGTONES.find((item) => item.id === selectedRingtone)
    if (chosen) {
      setStatusMessage(`Tono de llamada guardado: ${chosen.name}.`)
    }
  }

  const currentSavedOption = RINGTONES.find((item) => item.id === savedRingtone)

  return (
    <section id="ajustes" aria-labelledby="ajustes-heading" className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="ajustes-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle>
                  <h2
                    id="ringtone-heading"
                    className="flex items-center gap-2"
                  >
                    <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
                    Tono de llamada
                  </h2>
                </CardTitle>
                <CardDescription id="ringtone-description">
                  Selecciona el tono que sonará cuando recibas una llamada.
                </CardDescription>
              </div>
              {currentSavedOption && (
                <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Actual: {currentSavedOption.name}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <RadioGroup
              name="ringtone"
              value={selectedRingtone}
              onValueChange={handleValueChange}
              aria-labelledby="ringtone-heading"
              aria-describedby="ringtone-description"
              className="grid gap-2.5"
            >
              {RINGTONES.map((ringtone) => {
                const isSelected = selectedRingtone === ringtone.id
                const isPlaying = playingRingtone === ringtone.id
                const inputId = `ringtone-${ringtone.id}`
                const descId = `ringtone-${ringtone.id}-description`

                return (
                  <div
                    key={ringtone.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors",
                      isSelected
                        ? "border-primary bg-muted/40"
                        : "border-border hover:bg-muted/25"
                    )}
                  >
                    <RadioGroupItem
                      id={inputId}
                      value={ringtone.id}
                      aria-describedby={descId}
                    />
                    <Label
                      htmlFor={inputId}
                      className="flex flex-1 cursor-pointer flex-col items-start gap-1 leading-snug"
                    >
                      <span className="font-medium text-foreground">
                        {ringtone.name}
                      </span>
                      <span
                        id={descId}
                        className="text-xs font-normal text-muted-foreground"
                      >
                        {ringtone.description}
                      </span>
                    </Label>
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
                      onClick={() => handleTogglePreview(ringtone.id)}
                    >
                      {isPlaying ? (
                        <>
                          <Square aria-hidden="true" className="size-3.5" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Volume2 aria-hidden="true" className="size-3.5" />
                          <span>Escuchar</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Guardar cambios</Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {statusMessage}
            </p>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}
