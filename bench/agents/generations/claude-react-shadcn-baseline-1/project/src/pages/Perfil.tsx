import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Perfil() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Perfil</h1>
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
      <CardFooter>
        <Button>Guardar</Button>
      </CardFooter>
    </Card>
  )
}
