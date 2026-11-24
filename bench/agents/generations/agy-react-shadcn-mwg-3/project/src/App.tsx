import { useEffect, useId, useState, type FormEvent } from 'react'
import { SettingsPage } from '@/components/settings-page'
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

type Section = 'ajustes' | 'perfil'

function getSectionFromHash(): Section {
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

function ProfilePage() {
  const headingId = useId()
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Cambios del perfil guardados.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualiza la información visible para tus contactos.
        </p>
      </div>

      <Card id="perfil">
        <CardHeader>
          <CardTitle>
            <h2 id={headingId}>Datos personales</h2>
          </CardTitle>
          <CardDescription>Datos visibles para tus contactos.</CardDescription>
        </CardHeader>

        <form
          onSubmit={handleSubmit}
          aria-labelledby={headingId}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                autoComplete="name"
                defaultValue="Ada Lovelace"
                onChange={() => {
                  if (statusMessage) setStatusMessage('')
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue="ada@example.com"
                onChange={() => {
                  if (statusMessage) setStatusMessage('')
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-4">
            <Button type="submit">Guardar cambios</Button>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {statusMessage}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(getSectionFromHash)

  useEffect(() => {
    document.title =
      activeSection === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'
  }, [activeSection])

  useEffect(() => {
    function syncSection() {
      setActiveSection(getSectionFromHash())
    }
    window.addEventListener('hashchange', syncSection)
    window.addEventListener('popstate', syncSection)
    return () => {
      window.removeEventListener('hashchange', syncSection)
      window.removeEventListener('popstate', syncSection)
    }
  }, [])

  function navigateTo(section: Section) {
    setActiveSection(section)
    const nextHash = `#${section}`
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <a href="#contenido-principal" className="skip-link visually-hidden">
          Saltar al contenido principal
        </a>
        <div className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex list-none items-center gap-4">
              <li>
                <a
                  href="#perfil"
                  aria-current={activeSection === 'perfil' ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    navigateTo('perfil')
                  }}
                  className={`inline-flex min-h-8 items-center rounded-md px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    activeSection === 'perfil'
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Perfil
                </a>
              </li>
              <li>
                <a
                  href="#ajustes"
                  aria-current={activeSection === 'ajustes' ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    navigateTo('ajustes')
                  }}
                  className={`inline-flex min-h-8 items-center rounded-md px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    activeSection === 'ajustes'
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ajustes
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        {activeSection === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
