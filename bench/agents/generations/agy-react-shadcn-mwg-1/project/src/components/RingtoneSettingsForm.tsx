import { useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const RINGTONE_OPTIONS = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

type RingtoneValue = (typeof RINGTONE_OPTIONS)[number]['value']

const STORAGE_KEY = 'settings:ringtone'

function isRingtoneValue(value: string | null): value is RingtoneValue {
  return RINGTONE_OPTIONS.some((option) => option.value === value)
}

function getInitialRingtone(): RingtoneValue {
  if (typeof window === 'undefined') {
    return 'calisto'
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isRingtoneValue(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  return 'calisto'
}

interface RingtoneSettingsFormProps {
  onSaved: (message: string) => void
}

export function RingtoneSettingsForm({ onSaved }: RingtoneSettingsFormProps) {
  const headingId = useId()
  const descriptionId = useId()
  const groupPrefix = useId()

  const [savedRingtone, setSavedRingtone] = useState<RingtoneValue>(getInitialRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneValue>(savedRingtone)

  const savedLabel =
    RINGTONE_OPTIONS.find((option) => option.value === savedRingtone)?.label ?? 'Calisto'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedRingtone(selectedRingtone)
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedRingtone)
    } catch {
      // Ignore storage write errors in restricted contexts
    }
    const chosenLabel =
      RINGTONE_OPTIONS.find((option) => option.value === selectedRingtone)?.label ?? selectedRingtone
    onSaved(`Tono de llamada guardado: ${chosenLabel}.`)
  }

  return (
    <Card id="tono-de-llamada">
      <CardHeader>
        <CardTitle asChild>
          <h2 id={headingId}>Tono de llamada</h2>
        </CardTitle>
        <CardDescription id={descriptionId}>
          Elige el tono que sonará al recibir llamadas entrantes. Tono activo:{' '}
          <strong className="font-medium text-foreground">{savedLabel}</strong>.
        </CardDescription>
      </CardHeader>

      <form aria-labelledby={headingId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardContent>
          <fieldset className="grid gap-3 border-0 p-0" aria-describedby={descriptionId}>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Opciones de tono de llamada
            </legend>
            <div className="grid gap-2.5">
              {RINGTONE_OPTIONS.map((option) => {
                const optionId = `${groupPrefix}-${option.value}`
                const isSelected = selectedRingtone === option.value

                return (
                  <div key={option.value} className="ringtone-option">
                    <input
                      type="radio"
                      id={optionId}
                      name="ringtone"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelectedRingtone(option.value)}
                      className="ringtone-radio"
                    />
                    <label htmlFor={optionId} className="ringtone-label">
                      {option.label}
                    </label>
                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-foreground"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>
        </CardContent>

        <CardFooter className="justify-between gap-3">
          <Button type="submit" className="settings-submit">
            Guardar tono
          </Button>
          {selectedRingtone !== savedRingtone && (
            <span className="text-sm text-muted-foreground">Cambios sin guardar</span>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
