import * as React from "react"
import { BellRing, Check, Square, Volume2 } from "lucide-react"
import { cn } from "cn"
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
  RINGTONES,
  getRingtoneById,
  isRingtoneId,
  loadSavedRingtone,
  playRingtonePreview,
  saveRingtone,
  type RingtoneId,
} from "@/lib/ringtones"

export function SettingsPage() {
  const [savedRingtone, setSavedRingtone] = React.useState<RingtoneId>(() =>
    loadSavedRingtone()
  )
  const [selectedRingtone, setSelectedRingtone] =
    React.useState<RingtoneId>(savedRingtone)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState("")

  const stopPreviewRef = React.useRef<(() => void) | null>(null)

  const stopPreview = React.useCallback(() => {
    stopPreviewRef.current?.()
    stopPreviewRef.current = null
    setIsPlaying(false)
  }, [])

  React.useEffect(() => {
    return () => {
      stopPreviewRef.current?.()
    }
  }, [])

  const handleRingtoneChange = (value: string) => {
    if (!isRingtoneId(value)) return
    stopPreview()
    setSelectedRingtone(value)
    setStatusMessage("")
  }

  const handleTogglePreview = () => {
    if (isPlaying) {
      stopPreview()
      return
    }

    setIsPlaying(true)
    stopPreviewRef.current = playRingtonePreview(selectedRingtone, () => {
      stopPreviewRef.current = null
      setIsPlaying(false)
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveRingtone(selectedRingtone)
    setSavedRingtone(selectedRingtone)
    const tone = getRingtoneById(selectedRingtone)
    setStatusMessage(`Tono de llamada guardado: ${tone.name}.`)
  }

  const selectedTone = getRingtoneById(selectedRingtone)
  const savedTone = getRingtoneById(savedRingtone)
  const hasUnsavedChanges = selectedRingtone !== savedRingtone

  return (
    <section aria-labelledby="settings-heading" className="space-y-6">
      <div className="space-y-1">
        <h1
          id="settings-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card id="ajustes-sonido">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>
                  <h2 className="flex items-center gap-2">
                    <BellRing
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    Sonido y llamadas
                  </h2>
                </CardTitle>
                <CardDescription>
                  Selecciona el tono que sonará cuando recibas una llamada.
                </CardDescription>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Actual: {savedTone.name}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              <span
                id="ringtone-label"
                className="block text-sm leading-none font-medium"
              >
                Tono de llamada
              </span>

              <RadioGroup
                value={selectedRingtone}
                onValueChange={handleRingtoneChange}
                aria-labelledby="ringtone-label"
                className="grid gap-2.5"
              >
                {RINGTONES.map((tone) => {
                  const itemId = `ringtone-${tone.id}`
                  const descriptionId = `ringtone-${tone.id}-desc`
                  const isSelected = selectedRingtone === tone.id

                  return (
                    <div
                      key={tone.id}
                      className={cn(
                        "relative flex items-start gap-3 rounded-lg border p-3 transition-colors",
                        isSelected
                          ? "border-primary bg-muted/50"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      <RadioGroupItem
                        id={itemId}
                        value={tone.id}
                        aria-describedby={descriptionId}
                        className="mt-0.5"
                      />
                      <div className="grid flex-1 gap-1">
                        <Label
                          htmlFor={itemId}
                          className="cursor-pointer font-medium after:absolute after:inset-0"
                        >
                          {tone.name}
                        </Label>
                        <p
                          id={descriptionId}
                          className="text-xs text-muted-foreground"
                        >
                          {tone.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Tono seleccionado:{" "}
                <span className="font-medium text-foreground">
                  {selectedTone.name}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTogglePreview}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <Square className="size-3.5" aria-hidden="true" />
                    Detener vista previa
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5" aria-hidden="true" />
                    Escuchar {selectedTone.name}
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button type="submit">Guardar cambios</Button>
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground">
                  Tienes cambios sin guardar
                </span>
              )}
            </div>
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              {statusMessage && (
                <>
                  <Check className="size-4 text-foreground" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}
