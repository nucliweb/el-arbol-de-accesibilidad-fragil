import { useEffect, useRef, useState } from 'react'
import { ProfilePage } from '@/components/ProfilePage'
import { SettingsPage } from '@/components/SettingsPage'

type PageView = 'ajustes' | 'perfil'

function getViewFromHash(): PageView {
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

export default function App() {
  const [view, setView] = useState<PageView>(getViewFromHash)
  const hasNavigatedRef = useRef(false)

  useEffect(() => {
    function handleHashChange() {
      hasNavigatedRef.current = true
      setView(getViewFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = view === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'

    if (hasNavigatedRef.current) {
      const heading = document.getElementById('contenido-principal')
      heading?.focus()
    }
  }, [view])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <a href="#contenido-principal" className="skip-link visually-hidden">
          Saltar al contenido principal
        </a>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-2">
          <span className="font-semibold">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-2">
              <li>
                <a
                  href="#ajustes"
                  aria-current={view === 'ajustes' ? 'page' : undefined}
                  className={
                    view === 'ajustes'
                      ? 'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground underline underline-offset-4'
                      : 'inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground'
                  }
                >
                  Ajustes
                </a>
              </li>
              <li>
                <a
                  href="#perfil"
                  aria-current={view === 'perfil' ? 'page' : undefined}
                  className={
                    view === 'perfil'
                      ? 'inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground underline underline-offset-4'
                      : 'inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground'
                  }
                >
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {view === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
