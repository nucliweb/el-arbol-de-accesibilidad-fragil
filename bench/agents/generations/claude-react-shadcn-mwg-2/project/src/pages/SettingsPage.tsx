import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const RINGTONES = [
  { value: 'calisto', label: 'Calisto' },
  { value: 'ganimedes', label: 'Ganímedes' },
  { value: 'luna', label: 'Luna' },
  { value: 'europa', label: 'Europa' },
] as const

type Ringtone = (typeof RINGTONES)[number]['value']

export default function SettingsPage() {
  const [ringtone, setRingtone] = useState<Ringtone>('calisto')
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selected = RINGTONES.find((option) => option.value === ringtone)
    setStatus(`Ajustes guardados. Tono de llamada: ${selected?.label}.`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="tono-llamada-titulo">Tono de llamada</h2>
          </CardTitle>
          <CardDescription id="tono-llamada-descripcion">
            Elige el sonido que se reproducirá al recibir una llamada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="tono"
            value={ringtone}
            onValueChange={(value) => {
              setRingtone(value as Ringtone)
              setStatus('')
            }}
            aria-labelledby="tono-llamada-titulo"
            aria-describedby="tono-llamada-descripcion"
          >
            {RINGTONES.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <RadioGroupItem value={option.value} id={`tono-${option.value}`} />
                <Label htmlFor={`tono-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="gap-4">
          <Button type="submit">Guardar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
