import * as React from "react"
import { cn } from "cn"
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
import { SettingsPage } from "@/components/settings-page"

type Page = "ajustes" | "perfil"

function getPageFromHash(): Page {
  return window.location.hash === "#perfil" ? "perfil" : "ajustes"
}

function ProfilePage() {
  const [saved, setSaved] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <div className="space-y-1">
        <h1
          id="profile-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos visibles para tus contactos.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card id="perfil">
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
                onChange={() => setSaved(false)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                defaultValue="ada@example.com"
                onChange={() => setSaved(false)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-3">
            <Button type="submit">Guardar</Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {saved ? "Perfil guardado." : ""}
            </p>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}

export default function App() {
  const [activePage, setActivePage] = React.useState<Page>(() =>
    getPageFromHash()
  )

  React.useEffect(() => {
    const onHashChange = () => setActivePage(getPageFromHash())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  React.useEffect(() => {
    document.title =
      activePage === "ajustes" ? "Ajustes — Mi cuenta" : "Perfil — Mi cuenta"
  }, [activePage])

  const navigate =
    (page: Page) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      setActivePage(page)
      window.history.replaceState(null, "", `#${page}`)
    }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
      >
        Ir al contenido principal
      </a>

      <header className="border-b">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-3xl items-center gap-6 p-4"
        >
          <span className="font-semibold">Mi cuenta</span>
          <a
            href="#ajustes"
            onClick={navigate("ajustes")}
            aria-current={activePage === "ajustes" ? "page" : undefined}
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              activePage === "ajustes"
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            Ajustes
          </a>
          <a
            href="#perfil"
            onClick={navigate("perfil")}
            aria-current={activePage === "perfil" ? "page" : undefined}
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              activePage === "perfil"
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            Perfil
          </a>
        </nav>
      </header>

      <main id="contenido-principal" className="mx-auto max-w-3xl px-4 py-8">
        {activePage === "ajustes" ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
