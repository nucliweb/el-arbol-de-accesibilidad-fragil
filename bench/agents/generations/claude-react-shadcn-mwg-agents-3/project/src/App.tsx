import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPage } from '@/pages/SettingsPage'

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function useHash() {
  return useSyncExternalStore(subscribeToHash, () => window.location.hash)
}

const linkClass =
  'text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground'

export default function App() {
  const hash = useHash()
  const isSettings = hash === '#ajustes'
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    document.title = isSettings ? 'Ajustes · Mi cuenta' : 'Mi cuenta'
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Move focus to the new view's heading so keyboard and screen reader users land on it.
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [isSettings])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          <a href="#perfil" className={linkClass} aria-current={isSettings ? undefined : 'page'}>
            Perfil
          </a>
          <a href="#ajustes" className={linkClass} aria-current={isSettings ? 'page' : undefined}>
            Ajustes
          </a>
        </nav>
      </header>
      <main ref={mainRef} className="mx-auto max-w-3xl p-4">
        {isSettings ? (
          <SettingsPage />
        ) : (
          <Card id="perfil">
            <CardHeader>
              <CardTitle>
                <h1 tabIndex={-1} className="outline-none">
                  Perfil
                </h1>
              </CardTitle>
              <CardDescription>Datos visibles para tus contactos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" defaultValue="Ada Lovelace" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" defaultValue="ada@example.com" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Guardar</Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
