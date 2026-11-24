import * as React from 'react'
import { RingtoneSettingsCard } from '@/components/RingtoneSettingsCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function App() {
  const [profileStatus, setProfileStatus] = React.useState('')

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileStatus('Cambios del perfil guardados.')
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
            aria-current="page"
            className="text-sm font-medium text-foreground"
          >
            Ajustes
          </a>
          <a
            href="#perfil"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Perfil
          </a>
        </nav>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4 py-6">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
          <p className="text-sm text-muted-foreground">
            Configura las preferencias de llamadas y los datos de tu cuenta.
          </p>
        </div>

        <RingtoneSettingsCard />

        <section aria-labelledby="perfil-heading">
          <Card id="perfil">
            <CardHeader>
              <CardTitle>
                <h2 id="perfil-heading">Perfil</h2>
              </CardTitle>
              <CardDescription>Datos visibles para tus contactos.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="grid gap-4 pb-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    defaultValue="Ada Lovelace"
                    onChange={() => setProfileStatus('')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="ada@example.com"
                    onChange={() => setProfileStatus('')}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-wrap justify-between gap-3">
                <Button type="submit">Guardar</Button>
                <p
                  role="status"
                  aria-live="polite"
                  className="text-sm text-muted-foreground"
                >
                  {profileStatus}
                </p>
              </CardFooter>
            </form>
          </Card>
        </section>
      </main>
    </div>
  )
}
