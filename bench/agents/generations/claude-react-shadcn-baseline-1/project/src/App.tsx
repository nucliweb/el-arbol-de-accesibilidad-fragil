import { useEffect, useRef, useState } from 'react'
import Ajustes from '@/pages/Ajustes'
import Perfil from '@/pages/Perfil'

const PAGINAS = {
  perfil: { titulo: 'Perfil', componente: Perfil },
  ajustes: { titulo: 'Ajustes', componente: Ajustes },
} as const

type Pagina = keyof typeof PAGINAS

function paginaDesdeHash(): Pagina {
  const hash = window.location.hash.slice(1)
  return hash in PAGINAS ? (hash as Pagina) : 'perfil'
}

export default function App() {
  const [pagina, setPagina] = useState<Pagina>(paginaDesdeHash)
  const mainRef = useRef<HTMLElement>(null)
  const primeraCarga = useRef(true)

  useEffect(() => {
    const onHashChange = () => setPagina(paginaDesdeHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${PAGINAS[pagina].titulo} · Mi cuenta`
    // Al cambiar de página, llevar el foco al contenido principal
    // para que lectores de pantalla y teclado empiecen desde ahí.
    if (primeraCarga.current) {
      primeraCarga.current = false
      return
    }
    mainRef.current?.focus()
  }, [pagina])

  const PaginaActual = PAGINAS[pagina].componente

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
              {PAGINAS[clave].titulo}
            </a>
          ))}
        </nav>
      </header>
      <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-3xl p-4 outline-none">
        <PaginaActual />
      </main>
    </div>
  )
}
