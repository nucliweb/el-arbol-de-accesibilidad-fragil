import { useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfilePage() {
  const formHeadingId = useId()
  const nameId = useId()
  const emailId = useId()
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Datos de perfil guardados.')
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra la información básica de tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} aria-labelledby={formHeadingId} method="post">
        <Card id="perfil">
          <CardHeader>
            <CardTitle>
              <h2 id={formHeadingId} className="font-heading text-base leading-snug font-medium">
                Información personal
              </h2>
            </CardTitle>
            <CardDescription>Datos visibles para tus contactos.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor={nameId}>Nombre</Label>
              <Input
                id={nameId}
                name="name"
                autoComplete="name"
                defaultValue="Ada Lovelace"
                required
                className="min-h-12 border-muted-foreground/60 text-[max(1rem,1em)]"
                onInput={() => setStatusMessage('')}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={emailId}>Correo electrónico</Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue="ada@example.com"
                required
                className="min-h-12 border-muted-foreground/60 text-[max(1rem,1em)]"
                onInput={() => setStatusMessage('')}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" className="min-h-12 px-4 text-base sm:text-sm">
              Guardar cambios
            </Button>

            <p
              role="status"
              className="flex min-h-5 items-center gap-1.5 text-sm text-foreground"
            >
              {statusMessage && (
                <>
                  <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
