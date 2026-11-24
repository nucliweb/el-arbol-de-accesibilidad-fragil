import { useEffect, useState } from 'react'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'

type Page = 'ajustes' | 'perfil'

function getPageFromHash(): Page {
  if (typeof window === 'undefined') {
    return 'ajustes'
  }
  return window.location.hash === '#perfil' ? 'perfil' : 'ajustes'
}

const PAGE_TITLES: Record<Page, string> = {
  ajustes: 'Ajustes | Mi cuenta',
  perfil: 'Perfil | Mi cuenta',
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    const syncPage = () => {
      setPage(getPageFromHash())
    }
    window.addEventListener('hashchange', syncPage)
    window.addEventListener('popstate', syncPage)
    return () => {
      window.removeEventListener('hashchange', syncPage)
      window.removeEventListener('popstate', syncPage)
    }
  }, [])

  useEffect(() => {
    document.title = PAGE_TITLES[page]
  }, [page])

  function navigateTo(nextPage: Page) {
    if (nextPage !== page) {
      setPage(nextPage)
      window.history.pushState(null, '', `#${nextPage}`)
    }
    requestAnimationFrame(() => {
      document.getElementById('contenido-principal')?.focus()
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <a href="#contenido-principal" className="skip-link visually-hidden">
          Saltar al contenido principal
        </a>
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-2"
        >
          <span className="font-semibold">Mi cuenta</span>
          <ul className="flex items-center gap-1">
            <li>
              <a
                href="#perfil"
                aria-current={page === 'perfil' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  navigateTo('perfil')
                }}
                className={
                  page === 'perfil'
                    ? 'inline-flex min-h-11 items-center rounded-md bg-muted px-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                    : 'inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                }
              >
                Perfil
              </a>
            </li>
            <li>
              <a
                href="#ajustes"
                aria-current={page === 'ajustes' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  navigateTo('ajustes')
                }}
                className={
                  page === 'ajustes'
                    ? 'inline-flex min-h-11 items-center rounded-md bg-muted px-3 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                    : 'inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                }
              >
                Ajustes
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:py-6">
        {page === 'ajustes' ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
