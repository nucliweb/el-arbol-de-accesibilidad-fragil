import { useId, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfilePageProps {
  headingRef?: React.RefObject<HTMLHeadingElement | null>
}

export function ProfilePage({ headingRef }: ProfilePageProps) {
  const [name, setName] = useState('Ada Lovelace')
  const [email, setEmail] = useState('ada@example.com')
  const [statusMessage, setStatusMessage] = useState('')

  const idPrefix = useId()
  const formHeadingId = `${idPrefix}-profile-heading`
  const nameId = `${idPrefix}-nombre`
  const emailId = `${idPrefix}-email`

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Perfil guardado correctamente.')
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-foreground outline-none"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos visibles para tus contactos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2" id={formHeadingId}>
            Información personal
          </CardTitle>
          <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
        </CardHeader>

        <form aria-labelledby={formHeadingId} onSubmit={handleSubmit}>
          <CardContent className="grid gap-5 pb-6">
            <div className="grid gap-1.5">
              <Label htmlFor={nameId}>Nombre</Label>
              <Input
                id={nameId}
                name="name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (statusMessage) setStatusMessage('')
                }}
                className="min-h-12 text-base"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={emailId}>Correo electrónico</Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (statusMessage) setStatusMessage('')
                }}
                className="min-h-12 text-base"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" size="lg" className="min-h-12 px-4 text-base md:text-sm">
              Guardar cambios
            </Button>

            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground empty:hidden"
            >
              {statusMessage && (
                <>
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </>
              )}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
