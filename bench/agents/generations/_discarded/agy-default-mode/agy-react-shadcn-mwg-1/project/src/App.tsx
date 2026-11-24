import { useEffect, useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { SettingsPage } from '@/components/SettingsPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Page = 'ajustes' | 'perfil'

function getPageFromHash(): Page {
  if (typeof window !== 'undefined' && window.location.hash === '#perfil') {
    return 'perfil'
  }
  return 'ajustes'
}

function ProfilePage() {
  const baseId = useId()
  const headingId = `${baseId}-profile-heading`
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
          className="font-heading text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">Datos visibles para tus contactos.</p>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          aria-labelledby={headingId}
          className="flex flex-col gap-(--card-spacing)"
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
                name="nombre"
                autoComplete="name"
                defaultValue="Ada Lovelace"
                required
                className="form-control"
              />
            </div>
            <div className="grid gap-1.5">
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
                required
                className="form-control"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" size="lg" className="min-h-12 px-5">
              Guardar cambios
            </Button>
            <div role="status" className="min-h-5 text-sm text-foreground">
              {statusMessage && (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  {statusMessage}
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    document.title = page === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'
  }, [page])

  useEffect(() => {
    function syncPageFromUrl() {
      setPage(getPageFromHash())
    }
    window.addEventListener('hashchange', syncPageFromUrl)
    window.addEventListener('popstate', syncPageFromUrl)
    return () => {
      window.removeEventListener('hashchange', syncPageFromUrl)
      window.removeEventListener('popstate', syncPageFromUrl)
    }
  }, [])

  function navigate(nextPage: Page) {
    setPage(nextPage)
    const nextHash = `#${nextPage}`
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
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <span className="font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-4">
              <li>
                <a
                  href="#ajustes"
                  aria-current={page === 'ajustes' ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate('ajustes')
                  }}
                  className={
                    page === 'ajustes'
                      ? 'inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                      : 'inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                  }
                >
                  Ajustes
                </a>
              </li>
              <li>
                <a
                  href="#perfil"
                  aria-current={page === 'perfil' ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate('perfil')
                  }}
                  className={
                    page === 'perfil'
                      ? 'inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                      : 'inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                  }
                >
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        {page === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
