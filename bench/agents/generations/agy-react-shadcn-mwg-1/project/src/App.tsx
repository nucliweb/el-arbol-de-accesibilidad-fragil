import { useId, useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { RingtoneSettingsForm } from '@/components/RingtoneSettingsForm'
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

export default function App() {
  const profileHeadingId = useId()
  const nameInputId = useId()
  const emailInputId = useId()

  const [name, setName] = useState('Ada Lovelace')
  const [email, setEmail] = useState('ada@example.com')
  const [statusMessage, setStatusMessage] = useState('')

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Perfil guardado correctamente.')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#contenido-principal" className="skip-link visually-hidden">
        Ir al contenido principal
      </a>

      <header className="border-b">
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-3"
        >
          <span className="font-semibold">Mi cuenta</span>
          <ul className="flex items-center gap-5 text-sm">
            <li>
              <a
                href="#tono-de-llamada"
                className="settings-nav-link inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
              >
                Tono de llamada
              </a>
            </li>
            <li>
              <a
                href="#perfil"
                className="settings-nav-link inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
              >
                Perfil
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <div className="grid gap-1">
          <h1
            id="contenido-principal"
            tabIndex={-1}
            className="settings-heading text-2xl font-semibold tracking-tight"
          >
            Ajustes
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura tus preferencias de sonido y los datos de tu cuenta.
          </p>
        </div>

        <div
          role="status"
          className={
            statusMessage
              ? 'flex items-center gap-2 rounded-lg border border-[var(--control-border)] bg-muted px-4 py-3 text-sm font-medium text-foreground'
              : 'visually-hidden'
          }
        >
          {statusMessage && (
            <>
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              <span>{statusMessage}</span>
            </>
          )}
        </div>

        <RingtoneSettingsForm onSaved={setStatusMessage} />

        <Card id="perfil">
          <CardHeader>
            <CardTitle asChild>
              <h2 id={profileHeadingId}>Perfil</h2>
            </CardTitle>
            <CardDescription>Datos visibles para tus contactos.</CardDescription>
          </CardHeader>

          <form
            aria-labelledby={profileHeadingId}
            onSubmit={handleProfileSubmit}
            className="flex flex-col gap-4"
          >
            <CardContent className="grid gap-6">
              <div className="grid gap-1.5">
                <Label htmlFor={nameInputId}>
                  Nombre <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={nameInputId}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={emailInputId}>
                  Correo electrónico <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={emailInputId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="settings-input"
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="settings-submit">
                Guardar perfil
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
