import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const TONOS = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Tono = (typeof TONOS)[number]

const STORAGE_KEY = 'tono-de-llamada'

function leerTonoGuardado(): Tono {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return TONOS.includes(guardado as Tono) ? (guardado as Tono) : TONOS[0]
}

export default function Ajustes() {
  const id = useId()
  const [tono, setTono] = useState<Tono>(leerTonoGuardado)
  const [mensaje, setMensaje] = useState('')

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem(STORAGE_KEY, tono)
    setMensaje(`Tono de llamada guardado: ${tono}.`)
  }

  return (
    <form onSubmit={guardar}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={`${id}-titulo`}>Tono de llamada</h2>
          </CardTitle>
          <CardDescription id={`${id}-descripcion`}>
            Elige el sonido que se reproducirá al recibir una llamada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={tono}
            onValueChange={(valor) => {
              setTono(valor as Tono)
              setMensaje('')
            }}
            aria-labelledby={`${id}-titulo`}
            aria-describedby={`${id}-descripcion`}
          >
            {TONOS.map((opcion) => {
              const itemId = `${id}-${opcion}`
              return (
                <div key={opcion} className="flex items-center gap-3">
                  <RadioGroupItem value={opcion} id={itemId} />
                  <Label htmlFor={itemId} className="cursor-pointer">
                    {opcion}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
        <CardFooter className="gap-4">
          <Button type="submit">Guardar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {mensaje}
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
