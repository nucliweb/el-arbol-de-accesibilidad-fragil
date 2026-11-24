import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Ajustes from '@/pages/Ajustes'

const PAGINAS = {
  perfil: 'Perfil',
  ajustes: 'Ajustes',
} as const
type Pagina = keyof typeof PAGINAS

function paginaDesdeHash(): Pagina {
  const hash = window.location.hash.slice(1)
  return Object.hasOwn(PAGINAS, hash) ? (hash as Pagina) : 'perfil'
}

function Perfil() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Datos personales</h2>
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
  )
}

export default function App() {
  const [pagina, setPagina] = useState<Pagina>(paginaDesdeHash)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primeraCarga = useRef(true)

  useEffect(() => {
    const onHashChange = () => setPagina(paginaDesdeHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${PAGINAS[pagina]} · Mi cuenta`
    // Al cambiar de página, mover el foco al título para que los lectores de pantalla lo anuncien.
    if (primeraCarga.current) {
      primeraCarga.current = false
    } else {
      tituloRef.current?.focus()
    }
  }, [pagina])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          {(Object.keys(PAGINAS) as Pagina[]).map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={pagina === id ? 'page' : undefined}
              className="text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:underline-offset-4"
            >
              {PAGINAS[id]}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-3xl gap-4 p-4">
        <h1 ref={tituloRef} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {PAGINAS[pagina]}
        </h1>
        {pagina === 'ajustes' ? <Ajustes /> : <Perfil />}
      </main>
    </div>
  )
}
