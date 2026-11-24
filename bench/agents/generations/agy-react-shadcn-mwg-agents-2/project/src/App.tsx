import { useEffect, useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { SettingsPage } from '@/components/SettingsPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PageView = 'ajustes' | 'perfil'

function getPageFromHash(): PageView {
  if (typeof window === 'undefined') {
    return 'ajustes'
  }
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

function ProfilePage() {
  const idPrefix = useId()
  const formHeadingId = `${idPrefix}-profile-heading`
  const nameId = `${idPrefix}-nombre`
  const emailId = `${idPrefix}-email`
  const [statusMessage, setStatusMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Perfil guardado.')
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1
          id="contenido-principal"
          tabIndex={-1}
          className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">Datos visibles para tus contactos.</p>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          aria-labelledby={formHeadingId}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardHeader>
            <CardTitle as="h2" id={formHeadingId}>
              Información personal
            </CardTitle>
            <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Nombre</Label>
              <Input
                id={nameId}
                name="nombre"
                autoComplete="name"
                defaultValue="Ada Lovelace"
                onChange={() => setStatusMessage('')}
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
                onChange={() => setStatusMessage('')}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Guardar</Button>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex min-h-5 items-center gap-1.5 text-sm text-foreground"
            >
              {statusMessage ? (
                <>
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  <span>{statusMessage}</span>
                </>
              ) : null}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<PageView>(() => getPageFromHash())

  useEffect(() => {
    document.title = page === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'
  }, [page])

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#contenido-principal" className="skip-link visually-hidden">
        Saltar al contenido principal
      </a>

      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-4">
          <span className="py-3 font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-4">
              <li>
                <a
                  href="#perfil"
                  aria-current={page === 'perfil' ? 'page' : undefined}
                  onClick={() => setPage('perfil')}
                  className="nav-link"
                >
                  Perfil
                </a>
              </li>
              <li>
                <a
                  href="#ajustes"
                  aria-current={page === 'ajustes' ? 'page' : undefined}
                  onClick={() => setPage('ajustes')}
                  className="nav-link"
                >
                  Ajustes
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {page === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
