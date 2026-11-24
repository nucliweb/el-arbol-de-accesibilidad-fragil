import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'

const RINGTONES = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Ringtone = (typeof RINGTONES)[number]
const DEFAULT_RINGTONE: Ringtone = 'Calisto'

export function SettingsPage() {
  const id = useId()
  const headingId = `${id}-heading`
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ringtone = new FormData(event.currentTarget).get('ringtone') as Ringtone
    setStatus(`Tono de llamada guardado: ${ringtone}.`)
  }

  return (
    <Card id="ajustes">
      <form
        method="post"
        action="/ajustes"
        aria-labelledby={headingId}
        onSubmit={handleSubmit}
        className="flex flex-col gap-(--card-spacing)"
      >
        <CardHeader>
          <h2 id={headingId} className="font-heading text-base leading-snug font-medium">
            Ajustes
          </h2>
          <CardDescription>Personaliza cómo te avisamos de las llamadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-1">
            <legend className="mb-2 text-sm font-medium">Tono de llamada</legend>
            {RINGTONES.map((ringtone) => {
              const inputId = `${id}-ringtone-${ringtone}`
              return (
                <div key={ringtone} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={inputId}
                    name="ringtone"
                    value={ringtone}
                    defaultChecked={ringtone === DEFAULT_RINGTONE}
                    className="ringtone-radio size-4 shrink-0 accent-primary"
                  />
                  <label htmlFor={inputId} className="flex-1 cursor-pointer py-3 text-sm">
                    {ringtone}
                  </label>
                </div>
              )
            })}
          </fieldset>
        </CardContent>
        <CardFooter className="gap-4">
          <Button type="submit">Guardar cambios</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
