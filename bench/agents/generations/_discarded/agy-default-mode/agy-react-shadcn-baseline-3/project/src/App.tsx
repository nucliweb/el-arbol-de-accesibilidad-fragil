import { type FormEvent, useEffect, useState } from "react"
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

type Section = "ajustes" | "perfil"

function getInitialSection(): Section {
  return window.location.hash === "#perfil" ? "perfil" : "ajustes"
}

function ProfilePage() {
  const [savedMessage, setSavedMessage] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedMessage("Datos del perfil guardados.")
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la información visible para tus contactos.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card id="perfil">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-medium">Información personal</h2>
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
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit">Guardar</Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {savedMessage}
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection)

  useEffect(() => {
    document.title =
      activeSection === "ajustes"
        ? "Ajustes — Mi cuenta"
        : "Perfil — Mi cuenta"
  }, [activeSection])

  useEffect(() => {
    function handleHashChange() {
      setActiveSection(getInitialSection())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

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
            aria-current={activeSection === "ajustes" ? "page" : undefined}
            onClick={() => setActiveSection("ajustes")}
            className={`text-sm transition-colors ${
              activeSection === "ajustes"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ajustes
          </a>
          <a
            href="#perfil"
            aria-current={activeSection === "perfil" ? "page" : undefined}
            onClick={() => setActiveSection("perfil")}
            className={`text-sm transition-colors ${
              activeSection === "perfil"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Perfil
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl p-4 py-6">
        {activeSection === "ajustes" ? <SettingsPage /> : <ProfilePage />}
      </main>
    </div>
  )
}
