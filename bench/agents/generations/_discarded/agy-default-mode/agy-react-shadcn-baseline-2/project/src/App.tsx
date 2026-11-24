import { useEffect, useState } from "react"
import { SettingsPage } from "@/components/SettingsPage"
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
import { cn } from "@/lib/utils"

type Page = "ajustes" | "perfil"

function getPageFromHash(): Page {
  return window.location.hash === "#perfil" ? "perfil" : "ajustes"
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)
  const [profileStatus, setProfileStatus] = useState("")

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    document.title =
      page === "ajustes" ? "Ajustes — Mi cuenta" : "Perfil — Mi cuenta"
  }, [page])

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    target: Page
  ) => {
    event.preventDefault()
    window.history.replaceState(null, "", `#${target}`)
    setPage(target)
  }

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileStatus("Cambios del perfil guardados.")
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
            href="#perfil"
            aria-current={page === "perfil" ? "page" : undefined}
            onClick={(event) => handleNavigate(event, "perfil")}
            className={cn(
              "rounded-sm text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              page === "perfil"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Perfil
          </a>
          <a
            href="#ajustes"
            aria-current={page === "ajustes" ? "page" : undefined}
            onClick={(event) => handleNavigate(event, "ajustes")}
            className={cn(
              "rounded-sm text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              page === "ajustes"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ajustes
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl p-4 py-6">
        {page === "ajustes" ? (
          <SettingsPage />
        ) : (
          <section
            id="perfil"
            aria-labelledby="perfil-heading"
            className="grid gap-6"
          >
            <div className="grid gap-1">
              <h1
                id="perfil-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                Perfil
              </h1>
              <p className="text-sm text-muted-foreground">
                Datos visibles para tus contactos.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2>Información personal</h2>
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu nombre y dirección de correo electrónico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      defaultValue="Ada Lovelace"
                      onChange={() => setProfileStatus("")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="ada@example.com"
                      onChange={() => setProfileStatus("")}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <Button type="submit">Guardar</Button>
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-sm text-muted-foreground"
                  >
                    {profileStatus}
                  </p>
                </CardFooter>
              </Card>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
