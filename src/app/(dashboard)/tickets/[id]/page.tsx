import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addComment, updateStatus, deleteTicket, updateTicket } from "@/app/tickets/actions"
import Link from "next/link"

export default async function TicketDetailPage({ params, searchParams }: { params: { id: string }, searchParams?: { mp?: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      customer: { select: { name: true } },
      assignedTo: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!ticket) {
    redirect("/tickets")
  }

  const mp = Number(searchParams?.mp || "1")
  const take = 10
  const skip = (mp - 1) * take
  const [messages, totalMessages] = await Promise.all([
    prisma.message.findMany({
      where: { ticketId: params.id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { name: true } }
      }
    }),
    prisma.message.count({ where: { ticketId: params.id } })
  ])
  const msgPageCount = Math.max(1, Math.ceil(totalMessages / take))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ticket.priority}</Badge>
          <form action={async () => { await deleteTicket(ticket.id) }} >
            <Button type="submit" variant="soft-destructive">Excluir</Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground">Cliente: <span className="text-foreground">{ticket.customer?.name}</span></div>
          <div className="text-muted-foreground">Responsável: <span className="text-foreground">{ticket.assignedTo?.name || "-"}</span></div>
          <div className="text-muted-foreground">Status atual:
            <Badge variant="secondary" className="ml-2">{ticket.status}</Badge>
          </div>
          <div className="text-muted-foreground">Descrição:</div>
          <div className="rounded-md border border-border bg-(--card-surface) p-3">
            {ticket.description}
          </div>
          <form action={async (formData) => { await updateTicket(ticket.id, formData) }} className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <input name="title" defaultValue={ticket.title} aria-label="Título" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <select name="priority" defaultValue={String(ticket.priority)} aria-label="Prioridade" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
            <textarea name="description" defaultValue={ticket.description} aria-label="Descrição" className="md:col-span-2 min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <Button type="submit" variant="soft-edit" className="md:col-span-2">Salvar Edição</Button>
          </form>
          <form action={async (formData) => { await updateStatus(ticket.id, formData) }} className="max-w-xs">
            <Select name="status" defaultValue={String(ticket.status)}>
              <SelectTrigger aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Aberto</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="DONE">Concluído</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="soft-edit" className="mt-2">Atualizar Status</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => { await addComment(ticket.id, formData) }} className="space-y-3">
            <textarea name="message" placeholder="Escreva um comentário..." aria-label="Comentário" required className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            <Button type="submit" variant="soft-success">Adicionar Comentário</Button>
          </form>
          <div className="mt-6 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-md border border-border bg-(--card-surface) p-3">
                <div className="text-xs text-muted-foreground">{m.user?.name} • {new Date(m.createdAt).toLocaleString()}</div>
                <div className="text-foreground">{m.content}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum comentário ainda.</div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {mp} de {msgPageCount}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" disabled={mp <= 1} aria-label="Página anterior">
                <Link href={`/tickets/${ticket.id}?${new URLSearchParams({ mp: String(mp - 1) }).toString()}`}>Anterior</Link>
              </Button>
              <Button asChild variant="outline" disabled={mp >= msgPageCount} aria-label="Próxima página">
                <Link href={`/tickets/${ticket.id}?${new URLSearchParams({ mp: String(mp + 1) }).toString()}`}>Próxima</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

