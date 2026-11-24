import { type FormEvent, useEffect, useState } from 'react'
import { cn } from 'cn'
import { Check, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type RingtoneId,
  RINGTONES,
  getRingtoneById,
  loadSavedRingtone,
  playRingtone,
  saveRingtone,
  stopRingtone,
} from '@/lib/ringtonePlayer'

export function SettingsPage() {
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneId>(loadSavedRingtone)
  const [savedRingtone, setSavedRingtone] = useState<RingtoneId>(loadSavedRingtone)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    return () => {
      stopRingtone()
    }
  }, [])

  const currentOption = getRingtoneById(selectedRingtone)
  const hasUnsavedChanges = selectedRingtone !== savedRingtone

  function handleSelect(id: RingtoneId) {
    if (isPlaying) {
      stopRingtone()
      setIsPlaying(false)
    }
    setSelectedRingtone(id)
    setStatusMessage('')
  }

  function handlePreviewToggle() {
    if (isPlaying) {
      stopRingtone()
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
    const started = playRingtone(selectedRingtone, () => {
      setIsPlaying(false)
    })
    if (!started) {
      setIsPlaying(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveRingtone(selectedRingtone)
    setSavedRingtone(selectedRingtone)
    setStatusMessage(`Tono de llamada guardado: ${currentOption.label}.`)
  }

  return (
    <section id="ajustes" aria-labelledby="ajustes-heading" className="grid gap-6">
      <div className="grid gap-1">
        <h1 id="ajustes-heading" className="font-heading text-2xl font-semibold tracking-tight">
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido de tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Llamadas</h2>
          </CardTitle>
          <CardDescription>
            Selecciona el tono que sonará cuando recibas una llamada entrante.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 pb-4">
            <fieldset aria-describedby="ringtone-help" className="grid gap-3">
              <legend className="text-sm font-medium text-foreground">
                Tono de llamada
              </legend>
              <p id="ringtone-help" className="text-sm text-muted-foreground">
                Usa las teclas de flecha o haz clic en una opción para elegir tu tono preferido.
              </p>

              <div className="grid gap-2">
                {RINGTONES.map((ringtone) => {
                  const inputId = `tono-${ringtone.id}`
                  const descriptionId = `tono-${ringtone.id}-desc`
                  const isSelected = selectedRingtone === ringtone.id

                  return (
                    <div
                      key={ringtone.id}
                      className={cn(
                        'relative flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors',
                        'has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                        isSelected
                          ? 'border-primary bg-muted/50'
                          : 'border-border bg-background hover:bg-muted/30',
                      )}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name="tono-llamada"
                        value={ringtone.id}
                        checked={isSelected}
                        aria-describedby={descriptionId}
                        onChange={() => handleSelect(ringtone.id)}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary focus:outline-none"
                      />
                      <div className="grid flex-1 gap-0.5">
                        <label
                          htmlFor={inputId}
                          className="cursor-pointer text-sm leading-snug font-medium text-foreground after:absolute after:inset-0"
                        >
                          {ringtone.label}
                        </label>
                        <p id={descriptionId} className="text-xs text-muted-foreground">
                          {ringtone.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                Tono seleccionado:{' '}
                <span className="font-medium text-foreground">{currentOption.label}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewToggle}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <Square aria-hidden="true" className="size-3.5" />
                    Detener prueba
                  </>
                ) : (
                  <>
                    <Volume2 aria-hidden="true" className="size-3.5" />
                    Probar {currentOption.label}
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button type="submit">Guardar</Button>
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground">
                  Cambios sin guardar
                </span>
              )}
            </div>
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
