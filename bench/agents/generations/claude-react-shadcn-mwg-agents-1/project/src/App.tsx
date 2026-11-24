import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsPage } from '@/components/settings-page'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 p-4">
          <span className="font-semibold">Mi cuenta</span>
          <a href="#perfil" className="text-sm text-muted-foreground hover:text-foreground">
            Perfil
          </a>
          <a href="#ajustes" className="text-sm text-muted-foreground hover:text-foreground">
            Ajustes
          </a>
        </nav>
      </header>
      <main className="mx-auto grid max-w-3xl gap-6 p-4">
        <Card id="perfil">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
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
          <CardFooter>
            <Button>Guardar</Button>
          </CardFooter>
        </Card>
        <SettingsPage />
      </main>
    </div>
  )
}
