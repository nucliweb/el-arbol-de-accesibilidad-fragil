import { useEffect, useRef, useState } from 'react'
import { ProfilePage } from '@/components/ProfilePage'
import { SettingsPage } from '@/components/SettingsPage'

type Page = 'ajustes' | 'perfil'

function getPageFromHash(): Page {
  if (typeof window === 'undefined') return 'ajustes'
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

export default function App() {
  const [page, setPage] = useState<Page>(() => getPageFromHash())
  const shouldMoveFocusRef = useRef(false)
  const pageHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = page === 'ajustes' ? 'Ajustes | Mi cuenta' : 'Perfil | Mi cuenta'
    if (shouldMoveFocusRef.current) {
      shouldMoveFocusRef.current = false
      pageHeadingRef.current?.focus()
    }
  }, [page])

  function navigateTo(nextPage: Page) {
    if (nextPage === page) return
    shouldMoveFocusRef.current = true
    setPage(nextPage)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-3">
          <span className="font-semibold text-foreground">Mi cuenta</span>
          <nav aria-label="Principal">
            <ul className="flex items-center gap-2">
              <li>
                <a
                  href="#ajustes"
                  aria-current={page === 'ajustes' ? 'page' : undefined}
                  onClick={() => navigateTo('ajustes')}
                  className="nav-link"
                >
                  Ajustes
                </a>
              </li>
              <li>
                <a
                  href="#perfil"
                  aria-current={page === 'perfil' ? 'page' : undefined}
                  onClick={() => navigateTo('perfil')}
                  className="nav-link"
                >
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {page === 'ajustes' ? (
          <SettingsPage headingRef={pageHeadingRef} />
        ) : (
          <ProfilePage headingRef={pageHeadingRef} />
        )}
      </main>
    </div>
  )
}
