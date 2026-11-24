import { useId, useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfilePage() {
  const headingId = useId()
  const [name, setName] = useState('Ada Lovelace')
  const [email, setEmail] = useState('ada@example.com')
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Cambios de perfil guardados.')
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="font-heading text-2xl font-semibold tracking-tight"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos visibles para tus contactos.
        </p>
      </div>

      <Card id="perfil">
        <form
          aria-labelledby={headingId}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <CardHeader>
            <h2 id={headingId} className="font-heading text-base leading-snug font-medium">
              Información personal
            </h2>
            <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setStatusMessage('')
                }}
                autoComplete="name"
                enterKeyHint="next"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setStatusMessage('')
                }}
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" className="min-h-12 px-4">
              Guardar cambios
            </Button>

            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-h-5 text-sm text-muted-foreground"
            >
              {statusMessage ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </span>
              ) : null}
            </div>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
