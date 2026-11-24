import { useId, useState, type FormEvent } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const RINGTONE_STORAGE_KEY = 'account-settings-ringtone'

export interface RingtoneOption {
  value: string
  label: string
}

const RINGTONE_OPTIONS: readonly RingtoneOption[] = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

type RingtoneValue = (typeof RINGTONE_OPTIONS)[number]['value']

function readStoredRingtone(): RingtoneValue {
  if (typeof window === 'undefined') {
    return RINGTONE_OPTIONS[0].value
  }
  try {
    const stored = window.localStorage.getItem(RINGTONE_STORAGE_KEY)
    if (stored && RINGTONE_OPTIONS.some((option) => option.value === stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return RINGTONE_OPTIONS[0].value
}

function getRingtoneLabel(value: RingtoneValue): string {
  return RINGTONE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function SettingsPage() {
  const formHeadingId = useId()
  const descriptionId = useId()
  const radioIdPrefix = useId()

  const [savedRingtone, setSavedRingtone] = useState<RingtoneValue>(readStoredRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneValue>(savedRingtone)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const hasUnsavedChanges = selectedRingtone !== savedRingtone

  function handleSelectionChange(value: RingtoneValue) {
    setSelectedRingtone(value)
    setStatusMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedRingtone(selectedRingtone)
    try {
      window.localStorage.setItem(RINGTONE_STORAGE_KEY, selectedRingtone)
    } catch {
      // Ignore storage write errors in restricted environments
    }
    setStatusMessage(`Tono de llamada guardado: ${getRingtoneLabel(selectedRingtone)}.`)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido y llamadas de tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} aria-labelledby={formHeadingId} method="post">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 id={formHeadingId} className="font-heading text-base leading-snug font-medium">
                Sonido y llamadas
              </h2>
            </CardTitle>
            <CardDescription id={descriptionId}>
              Elige el tono que sonará cuando recibas una llamada entrante. Tono guardado actual:{' '}
              <span className="font-medium text-foreground">{getRingtoneLabel(savedRingtone)}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset aria-describedby={descriptionId} className="m-0 border-0 p-0">
              <legend className="mb-3 text-sm font-medium text-foreground">
                Tono de llamada
              </legend>

              <div className="grid gap-2.5">
                {RINGTONE_OPTIONS.map((option) => {
                  const optionId = `${radioIdPrefix}-${option.value}`
                  const isChecked = selectedRingtone === option.value

                  return (
                    <div
                      key={option.value}
                      className="ringtone-option flex min-h-12 items-center gap-3 rounded-lg border border-muted-foreground/60 bg-background px-3.5 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-accent/60"
                    >
                      <input
                        type="radio"
                        id={optionId}
                        name="ringtone"
                        value={option.value}
                        checked={isChecked}
                        onChange={() => handleSelectionChange(option.value)}
                        required
                        className="ringtone-radio shrink-0 cursor-pointer"
                      />
                      <label
                        htmlFor={optionId}
                        className="ringtone-label flex min-h-12 flex-1 cursor-pointer items-center py-2.5 text-[max(1rem,1em)] leading-snug font-medium text-foreground select-none"
                      >
                        {option.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" className="min-h-12 px-4 text-base sm:text-sm">
              Guardar cambios
            </Button>

            <div className="flex min-h-5 items-center gap-2 text-sm">
              {hasUnsavedChanges && !statusMessage && (
                <span className="text-muted-foreground">Tienes cambios sin guardar.</span>
              )}
              <p
                role="status"
                className="flex items-center gap-1.5 text-foreground"
              >
                {statusMessage && (
                  <>
                    <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </>
                )}
              </p>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
