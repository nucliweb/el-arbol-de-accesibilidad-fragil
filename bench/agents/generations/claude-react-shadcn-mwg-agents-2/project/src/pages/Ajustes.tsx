import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const TONOS = ['Calisto', 'Ganímedes', 'Luna', 'Europa'] as const
type Tono = (typeof TONOS)[number]

const STORAGE_KEY = 'ajustes:tono-llamada'

function leerTonoGuardado(): Tono {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return TONOS.find((tono) => tono === guardado) ?? TONOS[0]
}

export default function Ajustes() {
  const [tonoInicial] = useState<Tono>(leerTonoGuardado)
  const [estado, setEstado] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const datos = new FormData(event.currentTarget)
    const tono = TONOS.find((t) => t === datos.get('tono')) ?? TONOS[0]
    localStorage.setItem(STORAGE_KEY, tono)
    setEstado(`Ajustes guardados. Tono de llamada: ${tono}.`)
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setEstado('')}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Sonido</h2>
          </CardTitle>
          <CardDescription>Elige cómo suenan las llamadas entrantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Tono de llamada</legend>
            {TONOS.map((tono) => {
              const id = `tono-${tono.toLowerCase()}`
              return (
                <div key={tono} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={id}
                    name="tono"
                    value={tono}
                    defaultChecked={tono === tonoInicial}
                    className="size-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                  <label htmlFor={id} className="cursor-pointer text-sm">
                    {tono}
                  </label>
                </div>
              )
            })}
          </fieldset>
        </CardContent>
        <CardFooter className="flex-wrap gap-4">
          <Button type="submit">Guardar</Button>
          <p role="status" className="text-sm text-muted-foreground">
            {estado}
          </p>
        </CardFooter>
      </Card>
    </form>
  )
}
