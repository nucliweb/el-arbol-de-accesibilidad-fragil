import { useId, useState } from 'react'
import { Check, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export interface RingtoneOption {
  value: string
  label: string
}

const RINGTONE_OPTIONS: readonly RingtoneOption[] = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
]

const STORAGE_KEY = 'ajustes:tono-llamada'

function getInitialRingtone(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && RINGTONE_OPTIONS.some((option) => option.value === stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return RINGTONE_OPTIONS[0].value
}

function getRingtoneLabel(value: string): string {
  return RINGTONE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function SettingsPage() {
  const formHeadingId = useId()
  const ringtoneHintId = useId()
  const radioIdPrefix = useId()

  const [savedRingtone, setSavedRingtone] = useState<string>(getInitialRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<string>(savedRingtone)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const hasUnsavedChanges = selectedRingtone !== savedRingtone

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextRingtone = String(formData.get('tono') ?? selectedRingtone)

    setSavedRingtone(nextRingtone)
    setSelectedRingtone(nextRingtone)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextRingtone)
    } catch {
      // Ignore storage access errors
    }

    const label = getRingtoneLabel(nextRingtone)
    setStatusMessage(`Tono de llamada guardado: ${label}.`)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="font-heading text-2xl leading-tight font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura las preferencias de sonido y llamadas de tu cuenta.
        </p>
      </div>

      <form
        aria-labelledby={formHeadingId}
        onSubmit={handleSubmit}
        method="post"
      >
        <Card>
          <CardHeader>
            <CardTitle as="h2" id={formHeadingId} className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Llamadas y sonido</span>
            </CardTitle>
            <CardDescription>
              Tono actual:{' '}
              <strong className="font-medium text-foreground">
                {getRingtoneLabel(savedRingtone)}
              </strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <fieldset className="grid gap-3 border-0 p-0" aria-describedby={ringtoneHintId}>
              <legend className="text-sm font-medium text-foreground">
                Tono de llamada
              </legend>
              <p id={ringtoneHintId} className="text-sm text-muted-foreground">
                Elige el tono que sonará cuando recibas una llamada entrante.
              </p>

              <div className="grid gap-2.5">
                {RINGTONE_OPTIONS.map((option) => {
                  const inputId = `${radioIdPrefix}-${option.value}`
                  const isSelected = selectedRingtone === option.value
                  const isSaved = savedRingtone === option.value

                  return (
                    <div key={option.value} className="ringtone-option">
                      <input
                        id={inputId}
                        type="radio"
                        name="tono"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRingtone(option.value)
                          setStatusMessage('')
                        }}
                        className="ringtone-radio"
                      />
                      <label htmlFor={inputId} className="ringtone-label">
                        <span className="font-medium text-foreground">{option.label}</span>
                      </label>
                      {isSaved ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          <Check className="size-3.5" aria-hidden="true" />
                          <span>Guardado</span>
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-5 text-sm text-foreground">
              <div role="status">
                {statusMessage ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </span>
                ) : null}
              </div>
              {!statusMessage && hasUnsavedChanges ? (
                <p className="text-muted-foreground">
                  Tienes cambios sin guardar.
                </p>
              ) : null}
            </div>

            <Button type="submit" className="min-h-12 px-4 text-base md:text-sm">
              Guardar cambios
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
