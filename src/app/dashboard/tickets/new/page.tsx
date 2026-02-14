import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createTicket } from "@/app/dashboard/tickets/actions"
import Link from "next/link"

export default async function NewTicketPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const techs = await prisma.user.findMany({
    where: { role: "TECH" },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Novo Chamado</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados do Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTicket} className="grid grid-cols-1 gap-4 max-w-3xl">
            <Input name="title" placeholder="Título" aria-label="Título" required />
            <textarea name="description" placeholder="Descrição" aria-label="Descrição" required className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            <Select name="priority" defaultValue="MEDIUM">
              <SelectTrigger aria-label="Prioridade">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select name="assignedToId">
              <SelectTrigger aria-label="Responsável">
                <SelectValue placeholder="Atribuir a" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem responsável</SelectItem>
                {techs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input name="deadlineForecast" placeholder="Previsão (YYYY-MM-DD)" aria-label="Previsão" type="date" />
            <div className="flex gap-2">
              <Button type="submit" variant="soft-success">Criar Chamado</Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/dashboard/tickets">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
