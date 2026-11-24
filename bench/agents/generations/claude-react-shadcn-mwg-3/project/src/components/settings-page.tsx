import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const RINGTONES = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Ringtone = (typeof RINGTONES)[number]

const STORAGE_KEY = 'ajustes:tono-de-llamada'

function readStoredRingtone(): Ringtone {
  const stored = localStorage.getItem(STORAGE_KEY)
  return RINGTONES.find((tone) => tone === stored) ?? RINGTONES[0]
}

export function SettingsPage() {
  const [savedRingtone, setSavedRingtone] = useState<Ringtone>(readStoredRingtone)
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('tono')
    const ringtone = RINGTONES.find((tone) => tone === value)
    if (!ringtone) return
    localStorage.setItem(STORAGE_KEY, ringtone)
    setSavedRingtone(ringtone)
    setStatus(`Cambios guardados. Tono de llamada: ${ringtone}.`)
  }

  return (
    <Card>
      <form className="flex flex-col gap-(--card-spacing)" aria-labelledby="ajustes-titulo" onSubmit={handleSubmit} onChange={() => setStatus('')}>
        <CardHeader>
          <CardTitle>
            <h2 id="ajustes-titulo">Sonido</h2>
          </CardTitle>
          <CardDescription>Elige cómo suena el teléfono cuando recibes una llamada.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-1">
            <legend className="mb-2 text-sm font-medium">Tono de llamada</legend>
            {RINGTONES.map((tone) => {
              const id = `tono-${tone.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()}`
              return (
                <div key={tone} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={id}
                    name="tono"
                    value={tone}
                    defaultChecked={tone === savedRingtone}
                    className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                  <label htmlFor={id} className="flex-1 py-3 text-sm">
                    {tone}
                  </label>
                </div>
              )
            })}
          </fieldset>
        </CardContent>
        <CardFooter className="flex-wrap gap-4">
          <Button type="submit">Guardar cambios</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
