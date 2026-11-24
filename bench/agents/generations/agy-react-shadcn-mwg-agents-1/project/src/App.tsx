import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPage } from '@/pages/SettingsPage'

type PageView = 'ajustes' | 'perfil'

function getPageFromHash(hash: string): PageView {
  return hash === '#perfil' ? 'perfil' : 'ajustes'
}

export default function App() {
  const [activePage, setActivePage] = useState<PageView>(() => getPageFromHash(window.location.hash))
  const [profileStatus, setProfileStatus] = useState<string>('')
  const mainHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const hasNavigatedRef = useRef(false)
  const profileFormHeadingId = useId()

  useEffect(() => {
    const handleHashChange = () => {
      hasNavigatedRef.current = true
      setActivePage(getPageFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = activePage === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'
    if (hasNavigatedRef.current) {
      mainHeadingRef.current?.focus()
    }
  }, [activePage])

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileStatus('Cambios de perfil guardados.')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-4">
              <li>
                <a
                  href="#ajustes"
                  aria-current={activePage === 'ajustes' ? 'page' : undefined}
                  className={
                    activePage === 'ajustes'
                      ? 'text-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground'
                      : 'text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground'
                  }
                >
                  Ajustes
                </a>
              </li>
              <li>
                <a
                  href="#perfil"
                  aria-current={activePage === 'perfil' ? 'page' : undefined}
                  className={
                    activePage === 'perfil'
                      ? 'text-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground'
                      : 'text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground'
                  }
                >
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:py-6">
        {activePage === 'ajustes' ? (
          <SettingsPage headingRef={mainHeadingRef} />
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-1">
              <h1
                ref={mainHeadingRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight outline-none"
              >
                Perfil
              </h1>
              <p className="text-sm text-muted-foreground">Datos visibles para tus contactos.</p>
            </div>

            <Card id="perfil">
              <form
                method="post"
                aria-labelledby={profileFormHeadingId}
                onSubmit={handleProfileSubmit}
                className="flex flex-col gap-(--card-spacing)"
              >
                <CardHeader>
                  <h2
                    id={profileFormHeadingId}
                    data-slot="card-title"
                    className="font-heading text-base leading-snug font-medium"
                  >
                    Información personal
                  </h2>
                  <CardDescription>Actualiza tu nombre y dirección de correo electrónico.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      autoComplete="name"
                      defaultValue="Ada Lovelace"
                      onChange={() => setProfileStatus('')}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      defaultValue="ada@example.com"
                      onChange={() => setProfileStatus('')}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <Button type="submit">Guardar cambios</Button>
                  <p
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-1.5 text-sm text-foreground"
                  >
                    {profileStatus && (
                      <>
                        <Check className="size-4 shrink-0" aria-hidden="true" />
                        <span>{profileStatus}</span>
                      </>
                    )}
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
