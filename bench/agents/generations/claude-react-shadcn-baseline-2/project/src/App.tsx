import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Ajustes from '@/pages/Ajustes'

type Pagina = 'perfil' | 'ajustes'

const PAGINAS: Record<Pagina, string> = {
  perfil: 'Perfil',
  ajustes: 'Ajustes',
}

function paginaDesdeHash(): Pagina {
  return window.location.hash === '#ajustes' ? 'ajustes' : 'perfil'
}

function Perfil() {
  return (
    <Card id="perfil">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
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
  const primerRender = useRef(true)

  useEffect(() => {
    const alCambiarHash = () => setPagina(paginaDesdeHash())
    window.addEventListener('hashchange', alCambiarHash)
    return () => window.removeEventListener('hashchange', alCambiarHash)
  }, [])

  useEffect(() => {
    document.title = `${PAGINAS[pagina]} · Mi cuenta`
    // Al navegar entre páginas, mover el foco al título para que los lectores de pantalla anuncien el cambio.
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    tituloRef.current?.focus()
  }, [pagina])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          {(Object.keys(PAGINAS) as Pagina[]).map((clave) => (
            <a
              key={clave}
              href={`#${clave}`}
              aria-current={pagina === clave ? 'page' : undefined}
              className="text-sm text-muted-foreground hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              {PAGINAS[clave]}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto grid max-w-3xl gap-4 p-4">
        <h1 ref={tituloRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {PAGINAS[pagina]}
        </h1>
        {pagina === 'ajustes' ? <Ajustes /> : <Perfil />}
      </main>
    </div>
  )
}
