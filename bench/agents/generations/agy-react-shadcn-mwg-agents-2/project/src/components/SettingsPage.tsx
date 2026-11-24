import { useId, useState, type FormEvent } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RINGTONE_OPTIONS,
  getRingtoneLabel,
  loadSavedRingtone,
  saveRingtone,
  type RingtoneId,
} from '@/lib/ringtones'

export function SettingsPage() {
  const idPrefix = useId()
  const formHeadingId = `${idPrefix}-sound-heading`
  const hintId = `${idPrefix}-ringtone-hint`

  const [savedRingtone, setSavedRingtone] = useState<RingtoneId>(() => loadSavedRingtone())
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneId>(() => loadSavedRingtone())
  const [statusMessage, setStatusMessage] = useState('')

  const hasUnsavedChanges = selectedRingtone !== savedRingtone
  const savedLabel = getRingtoneLabel(savedRingtone)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveRingtone(selectedRingtone)
    setSavedRingtone(selectedRingtone)
    setStatusMessage(`Tono de llamada guardado: ${getRingtoneLabel(selectedRingtone)}.`)
  }

  function handleReset() {
    setSelectedRingtone(savedRingtone)
    setStatusMessage(`Se mantiene el tono guardado: ${savedLabel}.`)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura tus preferencias de llamadas y sonido.
        </p>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          aria-labelledby={formHeadingId}
          noValidate
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardHeader>
            <CardTitle as="h2" id={formHeadingId} className="flex items-center gap-2">
              <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
              <span>Sonido y llamadas</span>
            </CardTitle>
            <CardDescription>
              Elige el tono que sonará cuando recibas una llamada entrante.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset className="ringtone-fieldset" aria-describedby={hintId}>
              <legend className="text-sm font-medium text-foreground">Tono de llamada</legend>
              <p id={hintId} className="mt-1 mb-3 text-sm text-muted-foreground">
                Tono guardado actualmente:{' '}
                <strong className="font-medium text-foreground">{savedLabel}</strong>
                {hasUnsavedChanges ? ' (hay cambios sin guardar)' : ''}
              </p>

              <div className="grid gap-2.5">
                {RINGTONE_OPTIONS.map((option) => {
                  const optionId = `${idPrefix}-ringtone-${option.value}`
                  const isSelected = selectedRingtone === option.value

                  return (
                    <div
                      key={option.value}
                      className="ringtone-option"
                      data-selected={isSelected ? 'true' : undefined}
                    >
                      <input
                        type="radio"
                        id={optionId}
                        name="ringtone"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRingtone(option.value)
                          setStatusMessage('')
                        }}
                        className="ringtone-radio"
                      />
                      <label htmlFor={optionId} className="ringtone-label">
                        {option.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">Guardar cambios</Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Restablecer
              </Button>
            </div>

            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex min-h-5 items-center gap-1.5 text-sm text-foreground"
            >
              {statusMessage ? (
                <>
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </>
              ) : null}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
