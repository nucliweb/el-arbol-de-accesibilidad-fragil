import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const RINGTONES = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const

export function SettingsPage() {
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ringtone = new FormData(event.currentTarget).get('tono')
    setStatus(`Tono de llamada guardado: ${ringtone}.`)
  }

  return (
    <Card>
      <form aria-labelledby="ajustes-titulo" onSubmit={handleSubmit} className="flex flex-col gap-(--card-spacing)">
        <CardHeader>
          <CardTitle>
            <h1 id="ajustes-titulo" tabIndex={-1} className="outline-none">
              Ajustes
            </h1>
          </CardTitle>
          <CardDescription>Personaliza cómo te avisa la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Tono de llamada</legend>
            {RINGTONES.map((ringtone) => {
              const id = `tono-${ringtone.toLowerCase()}`
              return (
                <div key={ringtone} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={id}
                    name="tono"
                    value={ringtone}
                    defaultChecked={ringtone === RINGTONES[0]}
                    className="size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-foreground/60 bg-background checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring forced-colors:appearance-auto"
                  />
                  <label htmlFor={id} className="cursor-pointer py-1 text-sm">
                    {ringtone}
                  </label>
                </div>
              )
            })}
          </fieldset>
        </CardContent>
        <CardFooter className="justify-between gap-4">
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
          <Button type="submit">Guardar cambios</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
