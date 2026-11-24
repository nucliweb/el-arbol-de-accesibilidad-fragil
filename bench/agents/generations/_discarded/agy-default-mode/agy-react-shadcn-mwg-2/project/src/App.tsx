import { useEffect, useId, useState } from 'react'
import { Check } from 'lucide-react'
import { SettingsPage } from '@/components/SettingsPage'
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

type PageId = 'ajustes' | 'perfil'

function getPageFromHash(): PageId {
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

function ProfilePage() {
  const headingId = useId()
  const nameId = useId()
  const emailId = useId()
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Datos de perfil guardados.')
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="font-heading text-2xl leading-tight font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos visibles para tus contactos.
        </p>
      </div>

      <form aria-labelledby={headingId} onSubmit={handleSubmit} method="post">
        <Card id="perfil">
          <CardHeader>
            <CardTitle as="h2" id={headingId}>
              Información personal
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre y correo electrónico de contacto.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Nombre</Label>
              <Input
                id={nameId}
                name="nombre"
                autoComplete="name"
                defaultValue="Ada Lovelace"
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="grid gap-2">
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
                className="min-h-12 text-base"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div role="status" className="min-h-5 text-sm text-foreground">
              {statusMessage ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </span>
              ) : null}
            </div>
            <Button type="submit" className="min-h-12 px-4 text-base md:text-sm">
              Guardar cambios
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(getPageFromHash)

  useEffect(() => {
    const syncPageFromUrl = () => {
      setActivePage(getPageFromHash())
    }
    window.addEventListener('hashchange', syncPageFromUrl)
    window.addEventListener('popstate', syncPageFromUrl)
    return () => {
      window.removeEventListener('hashchange', syncPageFromUrl)
      window.removeEventListener('popstate', syncPageFromUrl)
    }
  }, [])

  useEffect(() => {
    document.title =
      activePage === 'perfil' ? 'Perfil | Mi cuenta' : 'Ajustes | Mi cuenta'
  }, [activePage])

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, page: PageId) {
    event.preventDefault()
    window.history.pushState(null, '', `#${page}`)
    setActivePage(page)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <a href="#contenido-principal" className="skip-link visually-hidden">
          Saltar al contenido principal
        </a>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-3">
          <span className="font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-2">
              <li>
                <a
                  href="#ajustes"
                  aria-current={activePage === 'ajustes' ? 'page' : undefined}
                  onClick={(event) => navigate(event, 'ajustes')}
                  className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                    activePage === 'ajustes'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Ajustes
                </a>
              </li>
              <li>
                <a
                  href="#perfil"
                  aria-current={activePage === 'perfil' ? 'page' : undefined}
                  onClick={(event) => navigate(event, 'perfil')}
                  className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                    activePage === 'perfil'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {activePage === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
