import { useId, useState, type FormEvent, type RefObject } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'

const RINGTONE_OPTIONS = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

type RingtoneValue = (typeof RINGTONE_OPTIONS)[number]['value']

const STORAGE_KEY = 'mi-cuenta:ringtone'

function isRingtoneValue(value: string | null): value is RingtoneValue {
  return RINGTONE_OPTIONS.some((option) => option.value === value)
}

function readSavedRingtone(): RingtoneValue {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isRingtoneValue(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors (e.g., private browsing restrictions)
  }
  return 'calisto'
}

function getRingtoneLabel(value: RingtoneValue): string {
  return RINGTONE_OPTIONS.find((option) => option.value === value)?.label ?? 'Calisto'
}

interface SettingsPageProps {
  headingRef?: RefObject<HTMLHeadingElement | null>
}

export function SettingsPage({ headingRef }: SettingsPageProps) {
  const formHeadingId = useId()
  const hintId = useId()
  const radioIdPrefix = useId()

  const [savedRingtone, setSavedRingtone] = useState<RingtoneValue>(() => readSavedRingtone())
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneValue>(savedRingtone)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const submitted = formData.get('ringtone')
    const nextValue = typeof submitted === 'string' && isRingtoneValue(submitted) ? submitted : selectedRingtone

    setSavedRingtone(nextValue)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextValue)
    } catch {
      // Ignore storage access errors
    }

    setStatusMessage(`Tono de llamada guardado: ${getRingtoneLabel(nextValue)}.`)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <Card id="ajustes">
        <form
          method="post"
          aria-labelledby={formHeadingId}
          onSubmit={handleSubmit}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardHeader>
            <h2
              id={formHeadingId}
              data-slot="card-title"
              className="flex items-center gap-2 font-heading text-base leading-snug font-medium"
            >
              <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
              Llamadas
            </h2>
            <CardDescription>
              Tono actual: <strong className="font-medium text-foreground">{getRingtoneLabel(savedRingtone)}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset aria-describedby={hintId} className="grid gap-3 border-0 p-0 m-0">
              <legend className="text-sm font-medium text-foreground">Tono de llamada</legend>
              <p id={hintId} className="text-sm text-muted-foreground">
                Elige el tono que sonará cuando recibas una llamada.
              </p>

              <div className="grid gap-2 pt-1">
                {RINGTONE_OPTIONS.map((option) => {
                  const inputId = `${radioIdPrefix}-${option.value}`
                  const isSelected = selectedRingtone === option.value

                  return (
                    <div
                      key={option.value}
                      className="ringtone-option"
                      data-selected={isSelected ? 'true' : 'false'}
                    >
                      <input
                        type="radio"
                        id={inputId}
                        name="ringtone"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRingtone(option.value)
                          setStatusMessage('')
                        }}
                        className="ringtone-radio"
                      />
                      <label htmlFor={inputId} className="ringtone-label">
                        {option.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Guardar cambios</Button>
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-sm text-foreground"
            >
              {statusMessage && (
                <>
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
