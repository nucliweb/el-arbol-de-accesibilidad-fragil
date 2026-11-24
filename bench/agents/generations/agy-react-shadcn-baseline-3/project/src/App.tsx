import { useEffect, useState } from "react"
import { cn } from "cn"
import { SettingsPage } from "@/components/settings-page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Page = "ajustes" | "perfil"

function getPageFromHash(): Page {
  if (typeof window !== "undefined" && window.location.hash === "#perfil") {
    return "perfil"
  }
  return "ajustes"
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    document.title =
      page === "ajustes" ? "Ajustes — Mi cuenta" : "Perfil — Mi cuenta"
  }, [page])

  function handleNavigate(nextPage: Page) {
    setPage(nextPage)
    setProfileSaved(false)
  }

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileSaved(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-3xl items-center gap-6 p-4"
        >
          <span className="font-semibold">Mi cuenta</span>
          <a
            href="#ajustes"
            aria-current={page === "ajustes" ? "page" : undefined}
            onClick={() => handleNavigate("ajustes")}
            className={cn(
              "text-sm transition-colors",
              page === "ajustes"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ajustes
          </a>
          <a
            href="#perfil"
            aria-current={page === "perfil" ? "page" : undefined}
            onClick={() => handleNavigate("perfil")}
            className={cn(
              "text-sm transition-colors",
              page === "perfil"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Perfil
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl p-4 py-8">
        {page === "ajustes" ? (
          <SettingsPage />
        ) : (
          <section aria-labelledby="profile-title" className="grid gap-6">
            <div className="grid gap-1">
              <h1
                id="profile-title"
                className="font-heading text-2xl font-semibold tracking-tight"
              >
                Perfil
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona la información visible para tus contactos.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <Card id="perfil">
                <CardHeader>
                  <CardTitle>
                    <h2>Datos personales</h2>
                  </CardTitle>
                  <CardDescription>
                    Datos visibles para tus contactos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      defaultValue="Ada Lovelace"
                      onChange={() => setProfileSaved(false)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="ada@example.com"
                      onChange={() => setProfileSaved(false)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-3">
                  <Button type="submit">Guardar</Button>
                  <div
                    role="status"
                    aria-live="polite"
                    className="text-xs font-medium text-foreground"
                  >
                    {profileSaved ? "Perfil guardado." : null}
                  </div>
                </CardFooter>
              </Card>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
