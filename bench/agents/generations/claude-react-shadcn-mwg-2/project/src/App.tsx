import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SettingsPage from '@/pages/SettingsPage'

const PAGES = {
  perfil: 'Perfil',
  ajustes: 'Ajustes',
} as const

type Page = keyof typeof PAGES

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getPageFromHash(): Page {
  const hash = window.location.hash.slice(1)
  return hash in PAGES ? (hash as Page) : 'perfil'
}

function ProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos personales</CardTitle>
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
  )
}

export default function App() {
  const page = useSyncExternalStore(subscribeToHash, getPageFromHash)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    document.title = `${PAGES[page]} · Mi cuenta`
    // Move focus to the new page heading on navigation (not on first load)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [page])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          {(Object.keys(PAGES) as Page[]).map((key) => (
            <a
              key={key}
              href={`#${key}`}
              aria-current={page === key ? 'page' : undefined}
              className="text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              {PAGES[key]}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-3xl gap-4 p-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {PAGES[page]}
        </h1>
        {page === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
