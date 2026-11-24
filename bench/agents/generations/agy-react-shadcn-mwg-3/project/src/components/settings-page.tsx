import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const STORAGE_KEY = 'mi-cuenta:ringtone'

export interface RingtoneOption {
  value: 'calisto' | 'ganimedes' | 'luna' | 'europa'
  label: string
}

const RINGTONE_OPTIONS: readonly RingtoneOption[] = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
]

function getInitialRingtone(): RingtoneOption['value'] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (RINGTONE_OPTIONS.some((option) => option.value === saved)) {
      return saved as RingtoneOption['value']
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  return 'calisto'
}

export function SettingsPage() {
  const headingId = useId()
  const descriptionId = useId()
  const baseId = useId()

  const [savedRingtone, setSavedRingtone] = useState<RingtoneOption['value']>(getInitialRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneOption['value']>(savedRingtone)
  const [statusMessage, setStatusMessage] = useState('')

  const savedLabel =
    RINGTONE_OPTIONS.find((option) => option.value === savedRingtone)?.label ?? 'Calisto'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const chosen = RINGTONE_OPTIONS.find((option) => option.value === selectedRingtone)
    if (!chosen) return

    setSavedRingtone(chosen.value)
    try {
      window.localStorage.setItem(STORAGE_KEY, chosen.value)
    } catch {
      // Ignore storage write errors in restricted contexts
    }
    setStatusMessage(`Tono de llamada guardado: ${chosen.label}.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Ajustes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las preferencias de sonido de tu cuenta.
        </p>
      </div>

      <Card id="ajustes">
        <CardHeader>
          <CardTitle>
            <h2 id={headingId}>Sonido</h2>
          </CardTitle>
          <CardDescription id={descriptionId}>
            Elige el sonido que escucharás al recibir una llamada entrante. Tono actual:{' '}
            <strong className="font-medium text-foreground">{savedLabel}</strong>.
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={handleSubmit}
          aria-labelledby={headingId}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardContent>
            <fieldset aria-describedby={descriptionId} className="grid gap-2.5">
              <legend className="mb-2 text-sm font-medium text-foreground">
                Tono de llamada
              </legend>

              {RINGTONE_OPTIONS.map((option) => {
                const optionId = `${baseId}-${option.value}`
                const isSelected = selectedRingtone === option.value

                return (
                  <div
                    key={option.value}
                    className={`ringtone-option flex items-center gap-3 rounded-lg border px-3.5 transition-colors ${
                      isSelected
                        ? 'border-primary bg-muted/50'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      id={optionId}
                      name="ringtone"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedRingtone(option.value)
                        if (statusMessage) setStatusMessage('')
                      }}
                      className="ringtone-radio"
                    />
                    <label htmlFor={optionId} className="ringtone-label text-foreground">
                      <span>{option.label}</span>
                    </label>
                  </div>
                )
              })}
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center gap-4">
            <Button type="submit">Guardar cambios</Button>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {statusMessage}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
