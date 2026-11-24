import { useId, useState, type FormEvent } from 'react'
import { Check, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'

const RINGTONES = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

type RingtoneValue = (typeof RINGTONES)[number]['value']

export function SettingsPage() {
  const baseId = useId()
  const sectionHeadingId = `${baseId}-calls-heading`
  const descriptionId = `${baseId}-ringtone-desc`

  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneValue>('calisto')
  const [savedRingtone, setSavedRingtone] = useState<RingtoneValue>('calisto')
  const [statusMessage, setStatusMessage] = useState('')

  const savedLabel =
    RINGTONES.find((tone) => tone.value === savedRingtone)?.label ?? RINGTONES[0].label

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedRingtone(selectedRingtone)
    const chosenLabel =
      RINGTONES.find((tone) => tone.value === selectedRingtone)?.label ?? selectedRingtone
    setStatusMessage(`Tono de llamada guardado: ${chosenLabel}.`)
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="font-heading text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura las preferencias de sonido para tus llamadas entrantes.
        </p>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          aria-labelledby={sectionHeadingId}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardHeader>
            <h2
              id={sectionHeadingId}
              className="flex items-center gap-2 font-heading text-base leading-snug font-medium"
            >
              <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
              Llamadas
            </h2>
            <CardDescription id={descriptionId}>
              Elige el tono que sonará cuando recibas una llamada. Tono activo actual:{' '}
              <strong className="font-medium text-foreground">{savedLabel}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset
              aria-describedby={descriptionId}
              className="m-0 grid gap-3 border-0 p-0"
            >
              <legend className="mb-3 text-sm font-medium text-foreground">
                Tono de llamada
              </legend>

              {RINGTONES.map((tone) => {
                const inputId = `${baseId}-ringtone-${tone.value}`
                const isSaved = savedRingtone === tone.value

                return (
                  <div key={tone.value} className="ringtone-option">
                    <input
                      type="radio"
                      id={inputId}
                      name="ringtone"
                      value={tone.value}
                      checked={selectedRingtone === tone.value}
                      onChange={() => {
                        setSelectedRingtone(tone.value)
                        if (statusMessage) {
                          setStatusMessage('')
                        }
                      }}
                      className="ringtone-radio"
                    />
                    <label htmlFor={inputId} className="ringtone-label">
                      <span>{tone.label}</span>
                    </label>
                    {isSaved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        <Check className="size-3.5" aria-hidden="true" />
                        Actual
                      </span>
                    )}
                  </div>
                )
              })}
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" size="lg" className="min-h-12 px-5">
              Guardar cambios
            </Button>
            <div role="status" className="min-h-5 text-sm text-foreground">
              {statusMessage && (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  {statusMessage}
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
