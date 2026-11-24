import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfilePage() {
  const [name, setName] = useState('Ada Lovelace')
  const [email, setEmail] = useState('ada@example.com')
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Cambios de perfil guardados.')
  }

  return (
    <section id="perfil" aria-labelledby="perfil-heading" className="grid gap-6">
      <div className="grid gap-1">
        <h1 id="perfil-heading" className="font-heading text-2xl font-semibold tracking-tight">
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos visibles para tus contactos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Información personal</h2>
          </CardTitle>
          <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 pb-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setStatusMessage('')
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setStatusMessage('')
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Guardar</Button>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {statusMessage}
            </p>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
