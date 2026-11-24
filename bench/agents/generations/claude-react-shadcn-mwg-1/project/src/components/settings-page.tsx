import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RINGTONES = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Ringtone = (typeof RINGTONES)[number]

export function SettingsPage() {
  const id = useId()
  const legendId = `${id}-tono`
  const [ringtone, setRingtone] = useState<Ringtone>('Calisto')
  const [status, setStatus] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(`Ajustes guardados. Tono de llamada: ${ringtone}.`)
  }

  return (
    <Card id="ajustes" aria-labelledby={`${id}-titulo`} role="region">
      <CardHeader>
        <CardTitle>
          <h2 id={`${id}-titulo`}>Ajustes</h2>
        </CardTitle>
        <CardDescription>Personaliza cómo te avisa el teléfono.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="contents">
        <CardContent>
          <div className="grid gap-3">
            <Label asChild>
              <span id={legendId}>Tono de llamada</span>
            </Label>
            <RadioGroup
              name="tono"
              value={ringtone}
              onValueChange={(value) => {
                setRingtone(value as Ringtone)
                setStatus('')
              }}
              aria-labelledby={legendId}
            >
              {RINGTONES.map((tone) => {
                const optionId = `${id}-tono-${tone}`
                return (
                  <div key={tone} className="flex items-center gap-3">
                    <RadioGroupItem value={tone} id={optionId} />
                    <Label htmlFor={optionId} className="font-normal">
                      {tone}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="gap-4">
          <Button type="submit">Guardar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
