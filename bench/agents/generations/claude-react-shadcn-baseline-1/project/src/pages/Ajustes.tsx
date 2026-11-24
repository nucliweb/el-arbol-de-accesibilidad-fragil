import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const TONOS = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Tono = (typeof TONOS)[number]

const STORAGE_KEY = 'ajustes.tono'

function leerTonoGuardado(): Tono {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return TONOS.find((t) => t === guardado) ?? TONOS[0]
}

export default function Ajustes() {
  const [tono, setTono] = useState<Tono>(leerTonoGuardado)
  const [estado, setEstado] = useState('')

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem(STORAGE_KEY, tono)
    setEstado(`Tono de llamada guardado: ${tono}.`)
  }

  return (
    <form onSubmit={guardar}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Ajustes</h1>
          </CardTitle>
          <CardDescription>Personaliza cómo te avisa la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <p id="tono-label" className="text-sm font-medium">
              Tono de llamada
            </p>
            <RadioGroup
              name="tono"
              value={tono}
              onValueChange={(value) => {
                setTono(value as Tono)
                setEstado('')
              }}
              aria-labelledby="tono-label"
            >
              {TONOS.map((nombre) => {
                const id = `tono-${nombre.toLowerCase()}`
                return (
                  <div key={nombre} className="flex items-center gap-2">
                    <RadioGroupItem value={nombre} id={id} />
                    <Label htmlFor={id} className="font-normal">
                      {nombre}
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
            {estado}
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
