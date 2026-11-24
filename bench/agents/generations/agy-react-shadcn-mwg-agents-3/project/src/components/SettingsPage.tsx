import { useId, useState, type FormEvent } from 'react'
import { Check, CheckCircle2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'

interface RingtoneOption {
  id: string
  label: string
}

const RINGTONES: readonly RingtoneOption[] = [
  { id: 'calisto', label: 'Calisto' },
  { id: 'ganimedes', label: 'Ganímedes' },
  { id: 'luna', label: 'Luna' },
  { id: 'europa', label: 'Europa' },
] as const

const STORAGE_KEY = 'app-settings-ringtone'

function loadSavedRingtone(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && RINGTONES.some((tone) => tone.id === saved)) {
      return saved
    }
  } catch {
    // Ignore storage access errors in restricted browsing contexts.
  }
  return RINGTONES[0].id
}

function getRingtoneLabel(id: string): string {
  return RINGTONES.find((tone) => tone.id === id)?.label ?? RINGTONES[0].label
}

export function SettingsPage() {
  const headingId = useId()
  const descriptionId = useId()
  const [savedRingtone, setSavedRingtone] = useState<string>(loadSavedRingtone)
  const [selectedRingtone, setSelectedRingtone] = useState<string>(savedRingtone)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const hasUnsavedChanges = selectedRingtone !== savedRingtone
  const savedRingtoneLabel = getRingtoneLabel(savedRingtone)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const submittedRingtone = String(formData.get('ringtone') ?? selectedRingtone)
    const validRingtone = RINGTONES.some((tone) => tone.id === submittedRingtone)
      ? submittedRingtone
      : RINGTONES[0].id

    setSavedRingtone(validRingtone)
    setSelectedRingtone(validRingtone)

    try {
      window.localStorage.setItem(STORAGE_KEY, validRingtone)
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }

    setStatusMessage(`Tono de llamada guardado: ${getRingtoneLabel(validRingtone)}.`)
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="font-heading text-2xl font-semibold tracking-tight"
        >
          Ajustes
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza las preferencias de sonido de tu cuenta.
        </p>
      </div>

      <Card id="ajustes">
        <form
          aria-labelledby={headingId}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 id={headingId} className="font-heading text-base leading-snug font-medium">
                Llamadas y sonido
              </h2>
            </div>
            <CardDescription>
              Tono activo actual: <strong className="font-medium text-foreground">{savedRingtoneLabel}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <fieldset className="grid gap-3 border-0 p-0" aria-describedby={descriptionId}>
              <legend className="text-sm font-medium text-foreground">
                Tono de llamada
              </legend>
              <p id={descriptionId} className="text-sm text-muted-foreground">
                Elige el sonido que se reproducirá cuando recibas una llamada.
              </p>

              <div className="grid gap-2.5 pt-1">
                {RINGTONES.map((tone) => {
                  const inputId = `ringtone-${tone.id}`
                  const isSelected = selectedRingtone === tone.id

                  return (
                    <div key={tone.id} className="ringtone-option">
                      <input
                        id={inputId}
                        type="radio"
                        name="ringtone"
                        value={tone.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedRingtone(tone.id)
                          setStatusMessage('')
                        }}
                        className="ringtone-radio"
                      />
                      <label htmlFor={inputId} className="ringtone-label">
                        <span className={isSelected ? 'font-medium' : undefined}>
                          {tone.label}
                        </span>
                        {isSelected ? (
                          <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        ) : null}
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" className="min-h-12 px-4">
              Guardar cambios
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasUnsavedChanges && !statusMessage ? (
                <p>Tienes cambios sin guardar.</p>
              ) : null}
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="min-h-5"
              >
                {statusMessage ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                    <span>{statusMessage}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
