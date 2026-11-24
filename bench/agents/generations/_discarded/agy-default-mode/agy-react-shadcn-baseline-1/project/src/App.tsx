import { useEffect, useState } from 'react'
import { cn } from 'cn'
import { ProfilePage } from '@/components/ProfilePage'
import { SettingsPage } from '@/components/SettingsPage'

type Page = 'ajustes' | 'perfil'

function getPageFromHash(): Page {
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    document.title = page === 'ajustes' ? 'Ajustes — Mi cuenta' : 'Perfil — Mi cuenta'
  }, [page])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-3xl items-center gap-6 p-4"
        >
          <span className="font-semibold">Mi cuenta</span>
          <a
            href="#perfil"
            aria-current={page === 'perfil' ? 'page' : undefined}
            onClick={() => setPage('perfil')}
            className={cn(
              'rounded-sm text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
              page === 'perfil'
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Perfil
          </a>
          <a
            href="#ajustes"
            aria-current={page === 'ajustes' ? 'page' : undefined}
            onClick={() => setPage('ajustes')}
            className={cn(
              'rounded-sm text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
              page === 'ajustes'
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Ajustes
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl p-4 py-6">
        {page === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
